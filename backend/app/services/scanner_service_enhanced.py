"""
Refactored scanner service with enhanced error handling, validation, and caching.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime
import requests
import ipaddress
import json
import logging

from ..models import ScannerConfig, UserSatelliteScannerAccess, User
from ..schemas import ScannerConfigCreate, ScannerConfigUpdate
from .base_service import BaseService, ServiceError, ValidationError, NotFoundError, DuplicateError
from .validation_mixins import CommonValidationMixin, IPValidationMixin, URLValidationMixin
from .cache_service import CacheableService, cached

logger = logging.getLogger(__name__)


class ScannerServiceV2(BaseService[ScannerConfig], CommonValidationMixin, CacheableService):
    """Enhanced scanner service with improved error handling and caching."""
    
    def __init__(self, db: Session):
        super().__init__(db, ScannerConfig)
        self.logger = logging.getLogger(f"{self.__class__.__module__}.{self.__class__.__name__}")
    
    def create_scanner_config(self, config_data: ScannerConfigCreate) -> ScannerConfig:
        """Create a new scanner configuration with enhanced validation."""
        # Validate input data
        self._validate_scanner_config(config_data)
        
        # Check for duplicate name
        if self.exists_by_field('name', config_data.name):
            raise DuplicateError(f"Scanner with name '{config_data.name}' already exists")
        
        # If this is being set as default, unset any existing default
        if config_data.is_default:
            self._unset_default_scanner()
        
        with self.transaction():
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
            self.db.flush()
            
            # Invalidate cache
            self.invalidate_cache("scanner")
            
            return config
    
    def get_scanner_config(self, config_id: int) -> Optional[ScannerConfig]:
        """Get a scanner configuration by ID."""
        return self.get_by_id(config_id)
    
    @cached("scanner_list", ttl=300)  # Cache for 5 minutes
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
        
        return query.offset(skip).limit(limit).all()
    
    def update_scanner_config(self, config_id: int, config_data: ScannerConfigUpdate) -> Optional[ScannerConfig]:
        """Update a scanner configuration."""
        config = self.get_by_id(config_id)
        if not config:
            raise NotFoundError(f"Scanner configuration with ID {config_id} not found")
        
        # Validate input data
        self._validate_scanner_config_update(config_data)
        
        # Check for duplicate name (excluding current config)
        if config_data.name and config_data.name != config.name:
            if self.exists_by_field('name', config_data.name):
                raise DuplicateError(f"Scanner with name '{config_data.name}' already exists")
        
        # If this is being set as default, unset any existing default
        if config_data.is_default and not config.is_default:
            self._unset_default_scanner()
        
        with self.transaction():
            update_data = config_data.dict(exclude_unset=True)
            for key, value in update_data.items():
                if hasattr(config, key):
                    setattr(config, key, value)
            
            # Invalidate cache
            self.invalidate_cache("scanner")
            
            return config
    
    def delete_scanner_config(self, config_id: int) -> bool:
        """Delete a scanner configuration."""
        config = self.get_by_id(config_id)
        if not config:
            raise NotFoundError(f"Scanner configuration with ID {config_id} not found")
        
        with self.transaction():
            self.db.delete(config)
            
            # Invalidate cache
            self.invalidate_cache("scanner")
            
            return True
    
    @cached("scanner_default", ttl=600)  # Cache for 10 minutes
    def get_default_scanner(self) -> Optional[ScannerConfig]:
        """Get the default scanner configuration."""
        return self.db.query(ScannerConfig).filter(
            ScannerConfig.is_default == True,
            ScannerConfig.is_active == True
        ).first()
    
    @cached("scanner_stats", ttl=300)  # Cache for 5 minutes
    def get_scanner_statistics(self) -> Dict[str, Any]:
        """Get scanner statistics."""
        total = self.count()
        active = self.count(is_active=True)
        inactive = self.count(is_active=False)
        default = 1 if self.get_default_scanner() else 0
        
        return {
            'total': total,
            'active': active,
            'inactive': inactive,
            'default': default
        }
    
    def get_all_scanners(self) -> List[ScannerConfig]:
        """Get all scanner configurations."""
        return self.get_scanner_configs()
    
    def get_scanner_for_ip(self, ip: str) -> Optional[ScannerConfig]:
        """Get the appropriate scanner configuration for a given IP address."""
        if not self.validate_ip_address(ip):
            raise ValidationError(f"Invalid IP address: {ip}")
        
        # Get all active scanners
        scanners = self.get_scanner_configs(is_active=True)
        
        for scanner in scanners:
            if scanner.subnets:
                for subnet in scanner.subnets:
                    if self.ip_in_network(ip, subnet):
                        return scanner
        
        # Return default scanner if no specific match
        return self.get_default_scanner()
    
    def get_best_scanner_for_target(self, target: str, current_user=None) -> Optional[ScannerConfig]:
        """Get the best scanner for a given target IP or subnet."""
        try:
            # Parse the target to get the network
            if '/' in target:
                target_network = ipaddress.ip_network(target, strict=False)
            else:
                # Single IP - get the /32 network
                target_network = ipaddress.ip_network(f"{target}/32", strict=False)
            
            # Get all active scanners
            scanners = self.get_scanner_configs(is_active=True)
            
            # Apply access control - only admins can see all scanners
            if current_user and not current_user.is_superuser:
                # For now, non-admin users see all scanners
                # TODO: Implement proper access control
                pass
            
            for scanner in scanners:
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
            
        except ValueError as e:
            logger.error(f"Invalid target format: {target} - {e}")
            return self.get_default_scanner()
    
    def check_scanner_health(self, config_id: int) -> Dict[str, Any]:
        """Check the health of a scanner configuration."""
        config = self.get_by_id(config_id)
        if not config:
            raise NotFoundError(f"Scanner configuration with ID {config_id} not found")
        
        try:
            # Test connection to scanner
            response = requests.get(
                f"{config.url}/health",
                timeout=config.timeout_seconds or 30
            )
            
            return {
                'scanner_id': config_id,
                'status': 'healthy' if response.status_code == 200 else 'unhealthy',
                'response_time': response.elapsed.total_seconds(),
                'status_code': response.status_code,
                'checked_at': datetime.utcnow().isoformat()
            }
        except requests.exceptions.RequestException as e:
            return {
                'scanner_id': config_id,
                'status': 'unhealthy',
                'error': str(e),
                'checked_at': datetime.utcnow().isoformat()
            }
    
    def check_all_scanners_health(self) -> List[Dict[str, Any]]:
        """Check the health of all active scanner configurations."""
        active_scanners = self.get_scanner_configs(is_active=True)
        health_results = []
        
        for scanner in active_scanners:
            health_result = self.check_scanner_health(scanner.id)
            health_results.append(health_result)
        
        return health_results
    
    def test_scanner_connection(self, config_id: int, test_ip: str) -> Dict[str, Any]:
        """Test scanner connection to a specific IP."""
        config = self.get_by_id(config_id)
        if not config:
            raise NotFoundError(f"Scanner configuration with ID {config_id} not found")
        
        if not self.validate_ip_address(test_ip):
            raise ValidationError(f"Invalid test IP address: {test_ip}")
        
        try:
            # Test connection to scanner
            response = requests.post(
                f"{config.url}/test",
                json={'target_ip': test_ip},
                timeout=config.timeout_seconds or 30
            )
            
            return {
                'scanner_id': config_id,
                'test_ip': test_ip,
                'success': response.status_code == 200,
                'response_time': response.elapsed.total_seconds(),
                'status_code': response.status_code,
                'response_data': response.json() if response.status_code == 200 else None,
                'tested_at': datetime.utcnow().isoformat()
            }
        except requests.exceptions.RequestException as e:
            return {
                'scanner_id': config_id,
                'test_ip': test_ip,
                'success': False,
                'error': str(e),
                'tested_at': datetime.utcnow().isoformat()
            }
    
    def sync_with_settings(self) -> Dict[str, Any]:
        """Sync scanner configurations with the Settings table."""
        # This would implement synchronization logic with settings
        # For now, return a placeholder
        return {
            'message': 'Scanner configurations synchronized with settings',
            'synced_at': datetime.utcnow().isoformat()
        }
    
    def _validate_scanner_config(self, config_data: ScannerConfigCreate) -> None:
        """Validate scanner configuration data."""
        # Validate name
        if not config_data.name or not self.validate_name(config_data.name):
            raise ValidationError("Invalid scanner name")
        
        # Validate URL
        if not self.validate_url(config_data.url):
            raise ValidationError("Invalid scanner URL")
        
        # Validate subnets
        if config_data.subnets:
            for subnet in config_data.subnets:
                if not self.validate_ip_network(subnet):
                    raise ValidationError(f"Invalid subnet format: {subnet}")
        
        # Validate numeric fields
        if config_data.max_concurrent_scans is not None:
            self.validate_positive_integer("max_concurrent_scans", config_data.max_concurrent_scans)
        
        if config_data.timeout_seconds is not None:
            self.validate_positive_integer("timeout_seconds", config_data.timeout_seconds)
    
    def _validate_scanner_config_update(self, config_data: ScannerConfigUpdate) -> None:
        """Validate scanner configuration update data."""
        # Validate name if provided
        if config_data.name and not self.validate_name(config_data.name):
            raise ValidationError("Invalid scanner name")
        
        # Validate URL if provided
        if config_data.url and not self.validate_url(config_data.url):
            raise ValidationError("Invalid scanner URL")
        
        # Validate subnets if provided
        if config_data.subnets:
            for subnet in config_data.subnets:
                if not self.validate_ip_network(subnet):
                    raise ValidationError(f"Invalid subnet format: {subnet}")
        
        # Validate numeric fields if provided
        if config_data.max_concurrent_scans is not None:
            self.validate_positive_integer("max_concurrent_scans", config_data.max_concurrent_scans)
        
        if config_data.timeout_seconds is not None:
            self.validate_positive_integer("timeout_seconds", config_data.timeout_seconds)
    
    def _unset_default_scanner(self) -> None:
        """Unset any existing default scanner."""
        self.db.query(ScannerConfig).filter(ScannerConfig.is_default == True).update(
            {"is_default": False}
        )
