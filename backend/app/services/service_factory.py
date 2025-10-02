"""
Service factory for dependency injection and service management.
"""
from typing import Dict, Type, Any, Optional
from sqlalchemy.orm import Session
from .base_service import BaseService
from .auth_service import AuthService
from .asset_service import AssetService
from .scanner_service_enhanced import ScannerServiceV2
from .credential_service import CredentialService
from .subnet_service import SubnetService
from .ldap_service import LDAPService
from .api_key_service import APIKeyService
from .scan_service import ScanServiceV2
from .enhanced_discovery_service import EnhancedDiscoveryService
from .template_service import TemplateService
from .webhook_service import WebhookService
from .audit_service import AuditService

import logging

logger = logging.getLogger(__name__)


class ServiceFactory:
    """Factory for creating and managing service instances."""
    
    def __init__(self, db: Session):
        self.db = db
        self._services: Dict[str, Any] = {}
        self._service_classes = {
            'auth': AuthService,
            'asset': AssetService,
            'scanner': ScannerServiceV2,
            'credential': CredentialService,
            'subnet': SubnetService,
            'ldap': LDAPService,
            'api_key': APIKeyService,
            'scan': ScanServiceV2,
            'discovery': EnhancedDiscoveryService,
            'template': TemplateService,
            'webhook': WebhookService,
            'audit': AuditService,
        }
    
    def get_service(self, service_name: str) -> Any:
        """Get a service instance by name."""
        if service_name not in self._services:
            if service_name not in self._service_classes:
                raise ValueError(f"Unknown service: {service_name}")
            
            service_class = self._service_classes[service_name]
            self._services[service_name] = service_class(self.db)
            logger.debug(f"Created new {service_name} service instance")
        
        return self._services[service_name]
    
    def get_auth_service(self) -> AuthService:
        """Get the authentication service."""
        return self.get_service('auth')
    
    def get_asset_service(self) -> AssetService:
        """Get the asset service."""
        return self.get_service('asset')
    
    def get_scanner_service(self) -> ScannerServiceV2:
        """Get the scanner service."""
        return self.get_service('scanner')
    
    def get_credential_service(self) -> CredentialService:
        """Get the credential service."""
        return self.get_service('credential')
    
    def get_subnet_service(self) -> SubnetService:
        """Get the subnet service."""
        return self.get_service('subnet')
    
    def get_ldap_service(self) -> LDAPService:
        """Get the LDAP service."""
        return self.get_service('ldap')
    
    def get_api_key_service(self) -> APIKeyService:
        """Get the API key service."""
        return self.get_service('api_key')
    
    def get_scan_service(self) -> ScanServiceV2:
        """Get the scan service."""
        return self.get_service('scan')
    
    def get_discovery_service(self) -> EnhancedDiscoveryService:
        """Get the discovery service."""
        return self.get_service('discovery')
    
    def get_template_service(self) -> TemplateService:
        """Get the template service."""
        return self.get_service('template')
    
    def get_webhook_service(self) -> WebhookService:
        """Get the webhook service."""
        return self.get_service('webhook')
    
    def get_audit_service(self) -> AuditService:
        """Get the audit service."""
        return self.get_service('audit')
    
    def clear_cache(self):
        """Clear the service cache."""
        self._services.clear()
        logger.debug("Service cache cleared")
    
    def register_service(self, name: str, service_class: Type[BaseService]):
        """Register a new service class."""
        self._service_classes[name] = service_class
        logger.info(f"Registered new service: {name}")


# Global service factory instance
_service_factory: Optional[ServiceFactory] = None


def get_service_factory(db: Session) -> ServiceFactory:
    """Get the global service factory instance."""
    global _service_factory
    if _service_factory is None:
        _service_factory = ServiceFactory(db)
    return _service_factory


def reset_service_factory():
    """Reset the global service factory (useful for testing)."""
    global _service_factory
    _service_factory = None
