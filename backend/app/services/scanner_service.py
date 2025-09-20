"""
Scanner service for managing scanner configurations and health checks.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from ..models import ScannerConfig
from ..schemas import ScannerConfigCreate, ScannerConfigUpdate
from datetime import datetime
import requests
import ipaddress
import json


class ScannerService:
    def __init__(self, db: Session):
        self.db = db

    def create_scanner_config(self, config_data: ScannerConfigCreate) -> ScannerConfig:
        """Create a new scanner configuration."""
        # Check if scanner with same name already exists
        existing = self.db.query(ScannerConfig).filter(
            ScannerConfig.name == config_data.name
        ).first()
        if existing:
            raise ValueError(f"Scanner with name '{config_data.name}' already exists")
        
        # Validate subnets
        if config_data.subnets:
            for subnet in config_data.subnets:
                try:
                    ipaddress.ip_network(subnet, strict=False)
                except ValueError:
                    raise ValueError(f"Invalid subnet format: {subnet}")
        
        # If this is being set as default, unset any existing default
        if config_data.is_default:
            self.db.query(ScannerConfig).filter(ScannerConfig.is_default == True).update(
                {"is_default": False}
            )
        
        config = ScannerConfig(
            name=config_data.name,
            url=config_data.url,
            subnets=config_data.subnets,
            is_active=config_data.is_active,
            is_default=config_data.is_default,
            max_concurrent_scans=config_data.max_concurrent_scans,
            timeout_seconds=config_data.timeout_seconds
        )
        
        self.db.add(config)
        self.db.commit()
        self.db.refresh(config)
        return config

    def get_scanner_config(self, config_id: int) -> Optional[ScannerConfig]:
        """Get a scanner configuration by ID."""
        return self.db.query(ScannerConfig).filter(ScannerConfig.id == config_id).first()

    def get_scanner_config_by_name(self, name: str) -> Optional[ScannerConfig]:
        """Get a scanner configuration by name."""
        return self.db.query(ScannerConfig).filter(ScannerConfig.name == name).first()
    
    def get_default_scanner(self) -> Optional[ScannerConfig]:
        """Get the default scanner configuration."""
        return self.db.query(ScannerConfig).filter(
            and_(ScannerConfig.is_default == True, ScannerConfig.is_active == True)
        ).first()

    def get_scanner_configs(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[ScannerConfig]:
        """Get scanner configurations with optional filtering."""
        query = self.db.query(ScannerConfig)
        
        if is_active is not None:
            query = query.filter(ScannerConfig.is_active == is_active)
        
        if search:
            search_filter = ScannerConfig.name.ilike(f"%{search}%")
            query = query.filter(search_filter)
        
        return query.order_by(desc(ScannerConfig.created_at)).offset(skip).limit(limit).all()

    def update_scanner_config(self, config_id: int, config_data: ScannerConfigUpdate) -> Optional[ScannerConfig]:
        """Update a scanner configuration."""
        config = self.get_scanner_config(config_id)
        if not config:
            return None
        
        # Check if new name conflicts with existing scanner
        if config_data.name and config_data.name != config.name:
            existing = self.db.query(ScannerConfig).filter(
                and_(
                    ScannerConfig.name == config_data.name,
                    ScannerConfig.id != config_id
                )
            ).first()
            if existing:
                raise ValueError(f"Scanner with name '{config_data.name}' already exists")
        
        # Validate subnets if provided
        if config_data.subnets:
            for subnet in config_data.subnets:
                try:
                    ipaddress.ip_network(subnet, strict=False)
                except ValueError:
                    raise ValueError(f"Invalid subnet format: {subnet}")
        
        # If this is being set as default, unset any existing default
        if config_data.is_default and config_data.is_default != config.is_default:
            self.db.query(ScannerConfig).filter(
                and_(ScannerConfig.is_default == True, ScannerConfig.id != config_id)
            ).update({"is_default": False})
        
        # Update fields
        update_data = config_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)
        
        config.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(config)
        return config

    def delete_scanner_config(self, config_id: int) -> bool:
        """Delete a scanner configuration."""
        config = self.get_scanner_config(config_id)
        if not config:
            return False
        
        self.db.delete(config)
        self.db.commit()
        return True

    def get_scanner_for_ip(self, ip: str) -> Optional[ScannerConfig]:
        """Get the appropriate scanner configuration for a given IP address."""
        try:
            ip_obj = ipaddress.ip_address(ip)
        except ValueError:
            return None
        
        # Find active scanners that handle this IP
        active_scanners = self.db.query(ScannerConfig).filter(
            ScannerConfig.is_active == True
        ).all()
        
        for scanner in active_scanners:
            if scanner.subnets:
                for subnet_str in scanner.subnets:
                    try:
                        subnet = ipaddress.ip_network(subnet_str, strict=False)
                        if ip_obj in subnet:
                            return scanner
                    except ValueError:
                        continue
        
        # If no specific scanner found, return the first active scanner
        if active_scanners:
            return active_scanners[0]
        
        return None

    def check_scanner_health(self, config_id: int) -> Dict[str, Any]:
        """Check the health of a scanner configuration."""
        config = self.get_scanner_config(config_id)
        if not config:
            return {"status": "error", "message": "Scanner configuration not found"}
        
        try:
            # Try to reach the scanner's health endpoint
            health_url = f"{config.url.rstrip('/')}/health"
            response = requests.get(health_url, timeout=config.timeout_seconds)
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "message": "Scanner is responding",
                    "response_time": response.elapsed.total_seconds(),
                    "status_code": response.status_code
                }
            else:
                return {
                    "status": "unhealthy",
                    "message": f"Scanner returned status code {response.status_code}",
                    "status_code": response.status_code
                }
        except requests.exceptions.Timeout:
            return {
                "status": "timeout",
                "message": f"Scanner did not respond within {config.timeout_seconds} seconds"
            }
        except requests.exceptions.ConnectionError:
            return {
                "status": "unreachable",
                "message": "Could not connect to scanner"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Health check failed: {str(e)}"
            }

    def check_all_scanners_health(self) -> List[Dict[str, Any]]:
        """Check the health of all active scanner configurations."""
        active_scanners = self.db.query(ScannerConfig).filter(
            ScannerConfig.is_active == True
        ).all()
        
        health_results = []
        for scanner in active_scanners:
            health_result = self.check_scanner_health(scanner.id)
            health_results.append({
                "scanner_id": scanner.id,
                "scanner_name": scanner.name,
                "scanner_url": scanner.url,
                **health_result
            })
        
        return health_results

    def get_scanner_statistics(self) -> Dict[str, Any]:
        """Get statistics about scanner configurations."""
        total_scanners = self.db.query(ScannerConfig).count()
        active_scanners = self.db.query(ScannerConfig).filter(ScannerConfig.is_active == True).count()
        
        # Get subnet coverage
        all_subnets = set()
        for scanner in self.db.query(ScannerConfig).filter(ScannerConfig.is_active == True).all():
            if scanner.subnets:
                all_subnets.update(scanner.subnets)
        
        return {
            "total_scanners": total_scanners,
            "active_scanners": active_scanners,
            "inactive_scanners": total_scanners - active_scanners,
            "total_subnets_covered": len(all_subnets),
            "subnets": list(all_subnets)
        }

    def test_scanner_connection(self, config_id: int, test_ip: str = "127.0.0.1") -> Dict[str, Any]:
        """Test a scanner connection with a specific IP."""
        config = self.get_scanner_config(config_id)
        if not config:
            return {"status": "error", "message": "Scanner configuration not found"}
        
        try:
            # Try a simple scan request
            test_url = f"{config.url.rstrip('/')}/scan/quick"
            response = requests.post(
                test_url,
                params={"ip": test_ip},
                timeout=config.timeout_seconds
            )
            
            if response.status_code == 200:
                return {
                    "status": "success",
                    "message": "Scanner connection test successful",
                    "response_time": response.elapsed.total_seconds(),
                    "test_ip": test_ip
                }
            else:
                return {
                    "status": "error",
                    "message": f"Scanner test failed with status code {response.status_code}",
                    "status_code": response.status_code
                }
        except requests.exceptions.Timeout:
            return {
                "status": "timeout",
                "message": f"Scanner test timed out after {config.timeout_seconds} seconds"
            }
        except requests.exceptions.ConnectionError:
            return {
                "status": "connection_error",
                "message": "Could not connect to scanner for testing"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Scanner test failed: {str(e)}"
            }

    def sync_with_settings(self) -> Dict[str, Any]:
        """Sync scanner configurations with the Settings table."""
        from .asset_service import AssetService
        
        asset_service = AssetService(self.db)
        settings = asset_service.get_settings()
        
        if not settings:
            return {"status": "error", "message": "No settings found"}
        
        # Get all active scanner configs
        active_configs = self.db.query(ScannerConfig).filter(
            ScannerConfig.is_active == True
        ).all()
        
        # Convert to the format expected by Settings
        scanner_list = []
        for config in active_configs:
            scanner_list.append({
                "name": config.name,
                "url": config.url,
                "subnets": config.subnets or [],
                "is_active": config.is_active,
                "max_concurrent_scans": config.max_concurrent_scans,
                "timeout_seconds": config.timeout_seconds
            })
        
        # Update settings
        settings.scanners = scanner_list
        self.db.commit()
        
        return {
            "status": "success",
            "message": f"Synced {len(scanner_list)} scanner configurations to settings",
            "scanners": scanner_list
        }
    
    def get_best_scanner_for_target(self, target: str) -> Optional[ScannerConfig]:
        """
        Get the best scanner for a given target IP or subnet.
        Returns the scanner that handles the specific subnet, or the default scanner as fallback.
        """
        try:
            # Parse the target to get the network
            if '/' in target:
                target_network = ipaddress.ip_network(target, strict=False)
            else:
                # Single IP - get the /32 network
                target_network = ipaddress.ip_network(f"{target}/32", strict=False)
            
            # First, try to find a scanner that handles this specific subnet
            active_scanners = self.db.query(ScannerConfig).filter(
                ScannerConfig.is_active == True
            ).all()
            
            for scanner in active_scanners:
                if scanner.subnets:
                    for subnet_str in scanner.subnets:
                        try:
                            scanner_network = ipaddress.ip_network(subnet_str, strict=False)
                            # Check if target network is contained within scanner's subnet
                            if target_network.subnet_of(scanner_network) or target_network == scanner_network:
                                return scanner
                        except ValueError:
                            continue
            
            # If no specific scanner found, return the default scanner
            return self.get_default_scanner()
            
        except ValueError:
            # Invalid target format, return default scanner
            return self.get_default_scanner()
