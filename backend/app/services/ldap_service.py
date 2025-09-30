"""
LDAP Authentication and Synchronization Service
Implements state-of-the-art LDAP integration with best practices
"""
import logging
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import ipaddress
from ldap3 import Server, Connection, ALL, SUBTREE, BASE, LEVEL
from ldap3.core.exceptions import LDAPException, LDAPBindError, LDAPSocketOpenError
from sqlalchemy.orm import Session
from ..models import User, Role, LDAPConfig, LDAPSyncLog, IPRange
from ..schemas import LDAPConfigCreate, LDAPConfigUpdate
from .auth_service import AuthService
import json
import re

logger = logging.getLogger(__name__)

class LDAPService:
    """LDAP service for authentication and user synchronization"""
    
    def __init__(self, db: Session):
        self.db = db
        self.auth_service = AuthService(db)
    
    def test_connection(self, config: LDAPConfig) -> Dict[str, Any]:
        """Test LDAP connection and return connection status"""
        try:
            # Create server configuration
            server = Server(
                config.server_uri,
                use_ssl=config.use_ssl,
                get_info=ALL if config.verify_cert else None
            )
            
            # Test connection
            conn = Connection(
                server,
                user=config.bind_dn,
                password=config.bind_password,
                auto_bind=True,
                receive_timeout=config.connection_timeout
            )
            
            # Test user search
            search_result = conn.search(
                search_base=config.user_base_dn,
                search_filter=config.user_search_filter,
                search_scope=SUBTREE,
                attributes=[config.username_attribute, config.email_attribute],
                size_limit=1
            )
            
            conn.unbind()
            
            return {
                "success": True,
                "message": "Connection successful",
                "users_found": len(conn.entries) if search_result else 0
            }
            
        except LDAPBindError as e:
            return {
                "success": False,
                "message": f"Authentication failed: {str(e)}",
                "error_type": "authentication"
            }
        except LDAPSocketOpenError as e:
            return {
                "success": False,
                "message": f"Connection failed: {str(e)}",
                "error_type": "connection"
            }
        except LDAPException as e:
            return {
                "success": False,
                "message": f"LDAP error: {str(e)}",
                "error_type": "ldap"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Unexpected error: {str(e)}",
                "error_type": "unexpected"
            }
    
    def authenticate_user(self, username: str, password: str, config: LDAPConfig) -> Optional[Dict[str, Any]]:
        """Authenticate user against LDAP"""
        try:
            # Create server configuration
            server = Server(
                config.server_uri,
                use_ssl=config.use_ssl,
                get_info=ALL if config.verify_cert else None
            )
            
            # First, bind with service account to search for user
            conn = Connection(
                server,
                user=config.bind_dn,
                password=config.bind_password,
                auto_bind=True,
                receive_timeout=config.connection_timeout
            )
            
            # Search for user
            user_filter = f"(&{config.user_search_filter}({config.username_attribute}={username}))"
            search_result = conn.search(
                search_base=config.user_base_dn,
                search_filter=user_filter,
                search_scope=SUBTREE,
                attributes=[
                    config.username_attribute,
                    config.email_attribute,
                    config.full_name_attribute,
                    config.first_name_attribute,
                    config.last_name_attribute,
                    config.user_member_attribute
                ]
            )
            
            if not search_result or len(conn.entries) == 0:
                conn.unbind()
                return None
            
            user_entry = conn.entries[0]
            user_dn = str(user_entry.entry_dn)
            
            # Now authenticate the user with their password
            user_conn = Connection(
                server,
                user=user_dn,
                password=password,
                auto_bind=True,
                receive_timeout=config.connection_timeout
            )
            
            # Extract user attributes
            user_data = {
                "username": str(getattr(user_entry, config.username_attribute, username)),
                "email": str(getattr(user_entry, config.email_attribute, "")),
                "full_name": str(getattr(user_entry, config.full_name_attribute, "")),
                "first_name": str(getattr(user_entry, config.first_name_attribute, "")),
                "last_name": str(getattr(user_entry, config.last_name_attribute, "")),
                "ldap_dn": user_dn,
                "ldap_uid": str(getattr(user_entry, config.username_attribute, username)),
                "groups": []
            }
            
            # Get user groups if configured
            if config.group_base_dn and config.user_member_attribute:
                try:
                    member_of = getattr(user_entry, config.user_member_attribute, [])
                    if member_of:
                        user_data["groups"] = [str(group) for group in member_of]
                except Exception as e:
                    logger.warning(f"Failed to get user groups: {e}")
            
            user_conn.unbind()
            conn.unbind()
            
            return user_data
            
        except LDAPBindError:
            return None  # Invalid credentials
        except Exception as e:
            logger.error(f"LDAP authentication error: {e}")
            return None
    
    def sync_users(self, config: LDAPConfig, sync_type: str = "incremental") -> Dict[str, Any]:
        """Synchronize users from LDAP"""
        sync_log = LDAPSyncLog(
            ldap_config_id=config.id,
            sync_type=sync_type,
            status="running"
        )
        self.db.add(sync_log)
        self.db.commit()
        
        try:
            # Create server configuration
            server = Server(
                config.server_uri,
                use_ssl=config.use_ssl,
                get_info=ALL if config.verify_cert else None
            )
            
            # Connect with service account
            conn = Connection(
                server,
                user=config.bind_dn,
                password=config.bind_password,
                auto_bind=True,
                receive_timeout=config.connection_timeout
            )
            
            # Search for all users
            search_result = conn.search(
                search_base=config.user_base_dn,
                search_filter=config.user_search_filter,
                search_scope=SUBTREE,
                attributes=[
                    config.username_attribute,
                    config.email_attribute,
                    config.full_name_attribute,
                    config.first_name_attribute,
                    config.last_name_attribute,
                    config.user_member_attribute
                ]
            )
            
            if not search_result:
                raise Exception("No users found in LDAP")
            
            users_created = 0
            users_updated = 0
            users_deactivated = 0
            errors_count = 0
            error_details = []
            
            # Get existing LDAP users
            existing_users = self.db.query(User).filter(
                User.auth_source == "ldap",
                User.ldap_dn.isnot(None)
            ).all()
            existing_ldap_dns = {user.ldap_dn: user for user in existing_users}
            
            # Process each LDAP user
            for entry in conn.entries:
                try:
                    user_dn = str(entry.entry_dn)
                    username = str(getattr(entry, config.username_attribute, ""))
                    email = str(getattr(entry, config.email_attribute, ""))
                    full_name = str(getattr(entry, config.full_name_attribute, ""))
                    
                    if not username or not email:
                        continue
                    
                    # Check if user exists
                    if user_dn in existing_ldap_dns:
                        # Update existing user
                        user = existing_ldap_dns[user_dn]
                        user.email = email
                        user.full_name = full_name
                        user.last_ldap_sync = datetime.utcnow()
                        user.is_active = True
                        users_updated += 1
                    else:
                        # Create new user
                        user = User(
                            username=username,
                            email=email,
                            full_name=full_name,
                            auth_source="ldap",
                            ldap_dn=user_dn,
                            ldap_uid=username,
                            is_active=True,
                            last_ldap_sync=datetime.utcnow()
                        )
                        self.db.add(user)
                        users_created += 1
                    
                    # Apply role mapping if configured
                    if config.role_mapping:
                        self._apply_role_mapping(user, entry, config)
                    
                except Exception as e:
                    errors_count += 1
                    error_details.append({
                        "user": str(entry.entry_dn),
                        "error": str(e)
                    })
                    logger.error(f"Error processing user {entry.entry_dn}: {e}")
            
            # Deactivate users not in LDAP (if full sync)
            if sync_type == "full":
                ldap_dns = {str(entry.entry_dn) for entry in conn.entries}
                for user in existing_users:
                    if user.ldap_dn not in ldap_dns:
                        user.is_active = False
                        users_deactivated += 1
            
            conn.unbind()
            
            # Update sync log
            sync_log.completed_at = datetime.utcnow()
            sync_log.status = "success" if errors_count == 0 else "partial"
            sync_log.users_created = users_created
            sync_log.users_updated = users_updated
            sync_log.users_deactivated = users_deactivated
            sync_log.errors_count = errors_count
            sync_log.error_details = error_details
            
            # Update config
            config.last_sync = datetime.utcnow()
            config.sync_status = sync_log.status
            
            self.db.commit()
            
            return {
                "success": True,
                "users_created": users_created,
                "users_updated": users_updated,
                "users_deactivated": users_deactivated,
                "errors_count": errors_count,
                "sync_log_id": sync_log.id
            }
            
        except Exception as e:
            # Update sync log with error
            sync_log.completed_at = datetime.utcnow()
            sync_log.status = "error"
            sync_log.error_message = str(e)
            sync_log.error_details = [{"error": str(e)}]
            
            config.sync_status = "error"
            
            self.db.commit()
            
            logger.error(f"LDAP sync failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "sync_log_id": sync_log.id
            }
    
    def _apply_role_mapping(self, user: User, ldap_entry, config: LDAPConfig):
        """Apply role mapping based on LDAP groups"""
        if not config.role_mapping:
            return
        
        try:
            # Get user's LDAP groups
            member_of = getattr(ldap_entry, config.user_member_attribute, [])
            user_groups = [str(group) for group in member_of] if member_of else []
            
            # Find matching role
            for ldap_group, role_name in config.role_mapping.items():
                if ldap_group in user_groups:
                    role = self.db.query(Role).filter(Role.name == role_name).first()
                    if role:
                        user.role_id = role.id
                        break
        except Exception as e:
            logger.error(f"Error applying role mapping for user {user.username}: {e}")
    
    def get_ldap_configs(self, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None) -> List[LDAPConfig]:
        """Get LDAP configurations"""
        query = self.db.query(LDAPConfig)
        
        if is_active is not None:
            query = query.filter(LDAPConfig.is_active == is_active)
        
        return query.order_by(LDAPConfig.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_ldap_config(self, config_id: int) -> Optional[LDAPConfig]:
        """Get LDAP configuration by ID"""
        return self.db.query(LDAPConfig).filter(LDAPConfig.id == config_id).first()
    
    def create_ldap_config(self, config_data: LDAPConfigCreate, created_by: int) -> LDAPConfig:
        """Create new LDAP configuration"""
        # Ensure only one default config
        if config_data.is_default:
            self.db.query(LDAPConfig).update({"is_default": False})
        
        config = LDAPConfig(
            **config_data.dict(),
            created_by=created_by
        )
        
        self.db.add(config)
        self.db.commit()
        self.db.refresh(config)
        
        return config
    
    def update_ldap_config(self, config_id: int, config_data: LDAPConfigUpdate) -> Optional[LDAPConfig]:
        """Update LDAP configuration"""
        config = self.get_ldap_config(config_id)
        if not config:
            return None
        
        # Ensure only one default config
        if config_data.is_default:
            self.db.query(LDAPConfig).filter(LDAPConfig.id != config_id).update({"is_default": False})
        
        # Update fields
        update_data = config_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)
        
        config.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(config)
        
        return config
    
    def delete_ldap_config(self, config_id: int) -> bool:
        """Delete LDAP configuration"""
        config = self.get_ldap_config(config_id)
        if not config:
            return False
        
        # Check if it's the default config
        if config.is_default:
            raise ValueError("Cannot delete default LDAP configuration")
        
        self.db.delete(config)
        self.db.commit()
        
        return True
    
    def get_sync_logs(self, config_id: Optional[int] = None, limit: int = 50) -> List[LDAPSyncLog]:
        """Get LDAP sync logs"""
        query = self.db.query(LDAPSyncLog)
        
        if config_id:
            query = query.filter(LDAPSyncLog.ldap_config_id == config_id)
        
        return query.order_by(LDAPSyncLog.started_at.desc()).limit(limit).all()


class IPRangeService:
    """IP Range management service"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def validate_ip_range(self, ip_range: str, range_type: str = "cidr") -> bool:
        """Validate IP range format"""
        try:
            if range_type == "cidr":
                ipaddress.ip_network(ip_range, strict=False)
            elif range_type == "range":
                # Format: 192.168.1.1-192.168.1.100
                if "-" not in ip_range:
                    return False
                start_ip, end_ip = ip_range.split("-", 1)
                ipaddress.ip_address(start_ip.strip())
                ipaddress.ip_address(end_ip.strip())
            elif range_type == "single":
                ipaddress.ip_address(ip_range)
            return True
        except ValueError:
            return False
    
    def ip_in_range(self, ip: str, ip_range: IPRange) -> bool:
        """Check if IP is within the specified range"""
        try:
            if ip_range.range_type == "cidr":
                network = ipaddress.ip_network(ip_range.ip_range, strict=False)
                return ipaddress.ip_address(ip) in network
            elif ip_range.range_type == "range":
                start_ip = ipaddress.ip_address(ip_range.ip_start)
                end_ip = ipaddress.ip_address(ip_range.ip_end)
                target_ip = ipaddress.ip_address(ip)
                return start_ip <= target_ip <= end_ip
            elif ip_range.range_type == "single":
                return ipaddress.ip_address(ip) == ipaddress.ip_address(ip_range.ip_range)
            return False
        except ValueError:
            return False
    
    def check_user_ip_access(self, user: User, client_ip: str) -> bool:
        """Check if user has access from the given IP"""
        # Superusers have access from anywhere
        if user.is_superuser:
            return True
        
        # If user has no IP restrictions, allow access
        if not user.allowed_ip_ranges:
            return True
        
        # Check if IP is in any allowed range
        for ip_range in user.allowed_ip_ranges:
            if ip_range.is_active and self.ip_in_range(client_ip, ip_range):
                return True
        
        return False
    
    def get_ip_ranges(self, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None) -> List[IPRange]:
        """Get IP ranges"""
        query = self.db.query(IPRange)
        
        if is_active is not None:
            query = query.filter(IPRange.is_active == is_active)
        
        return query.order_by(IPRange.priority.desc(), IPRange.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_ip_range(self, range_id: int) -> Optional[IPRange]:
        """Get IP range by ID"""
        return self.db.query(IPRange).filter(IPRange.id == range_id).first()
    
    def create_ip_range(self, range_data: Dict[str, Any], created_by: int) -> IPRange:
        """Create new IP range"""
        # Validate IP range
        if not self.validate_ip_range(range_data["ip_range"], range_data.get("range_type", "cidr")):
            raise ValueError("Invalid IP range format")
        
        ip_range = IPRange(
            **range_data,
            created_by=created_by
        )
        
        self.db.add(ip_range)
        self.db.commit()
        self.db.refresh(ip_range)
        
        return ip_range
    
    def update_ip_range(self, range_id: int, range_data: Dict[str, Any]) -> Optional[IPRange]:
        """Update IP range"""
        ip_range = self.get_ip_range(range_id)
        if not ip_range:
            return None
        
        # Validate IP range if it's being updated
        if "ip_range" in range_data:
            range_type = range_data.get("range_type", ip_range.range_type)
            if not self.validate_ip_range(range_data["ip_range"], range_type):
                raise ValueError("Invalid IP range format")
        
        # Update fields
        for field, value in range_data.items():
            setattr(ip_range, field, value)
        
        ip_range.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(ip_range)
        
        return ip_range
    
    def delete_ip_range(self, range_id: int) -> bool:
        """Delete IP range"""
        ip_range = self.get_ip_range(range_id)
        if not ip_range:
            return False
        
        self.db.delete(ip_range)
        self.db.commit()
        
        return True
    
    def assign_ip_range_to_user(self, user_id: int, range_id: int, granted_by: int) -> bool:
        """Assign IP range to user"""
        user = self.db.query(User).filter(User.id == user_id).first()
        ip_range = self.get_ip_range(range_id)
        
        if not user or not ip_range:
            return False
        
        # Check if already assigned
        if ip_range in user.allowed_ip_ranges:
            return True
        
        user.allowed_ip_ranges.append(ip_range)
        self.db.commit()
        
        return True
    
    def remove_ip_range_from_user(self, user_id: int, range_id: int) -> bool:
        """Remove IP range from user"""
        user = self.db.query(User).filter(User.id == user_id).first()
        ip_range = self.get_ip_range(range_id)
        
        if not user or not ip_range:
            return False
        
        if ip_range in user.allowed_ip_ranges:
            user.allowed_ip_ranges.remove(ip_range)
            self.db.commit()
        
        return True
