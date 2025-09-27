"""
Template service for managing scan and asset templates.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from ..models import ScanTemplate, AssetTemplate, User
from ..schemas import ScanTemplateCreate, ScanTemplateUpdate, AssetTemplateCreate, AssetTemplateUpdate
from .base_service import BaseService


class TemplateService(BaseService):
    def __init__(self, db: Session):
        super().__init__(db)

    # Scan Template Methods
    def get_scan_templates(
        self,
        skip: int = 0,
        limit: int = 100,
        is_system: Optional[bool] = None,
        is_active: Optional[bool] = None,
        scan_type: Optional[str] = None
    ) -> List[ScanTemplate]:
        """Get scan templates with filtering."""
        query = self.db.query(ScanTemplate)
        
        if is_system is not None:
            query = query.filter(ScanTemplate.is_system == is_system)
        if is_active is not None:
            query = query.filter(ScanTemplate.is_active == is_active)
        if scan_type:
            query = query.filter(ScanTemplate.scan_type == scan_type)
        
        return query.order_by(ScanTemplate.usage_count.desc()).offset(skip).limit(limit).all()

    def get_scan_template(self, template_id: int) -> Optional[ScanTemplate]:
        """Get a scan template by ID."""
        return self.db.query(ScanTemplate).filter(ScanTemplate.id == template_id).first()

    def create_scan_template(
        self,
        template_data: ScanTemplateCreate,
        user_id: Optional[int] = None
    ) -> ScanTemplate:
        """Create a new scan template."""
        template = ScanTemplate(
            name=template_data.name,
            description=template_data.description,
            scan_config=template_data.scan_config,
            scan_type=template_data.scan_type,
            is_system=template_data.is_system,
            created_by=user_id
        )
        
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def update_scan_template(
        self,
        template_id: int,
        template_data: ScanTemplateUpdate
    ) -> Optional[ScanTemplate]:
        """Update a scan template."""
        template = self.get_scan_template(template_id)
        if not template:
            return None
        
        update_data = template_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)
        
        self.db.commit()
        self.db.refresh(template)
        return template

    def delete_scan_template(self, template_id: int) -> bool:
        """Delete a scan template."""
        template = self.get_scan_template(template_id)
        if not template or template.is_system:
            return False  # Cannot delete system templates
        
        self.db.delete(template)
        self.db.commit()
        return True

    def increment_scan_template_usage(self, template_id: int) -> None:
        """Increment usage count for a scan template."""
        template = self.get_scan_template(template_id)
        if template:
            template.usage_count += 1
            self.db.commit()

    # Asset Template Methods
    def get_asset_templates(
        self,
        skip: int = 0,
        limit: int = 100,
        is_system: Optional[bool] = None,
        is_active: Optional[bool] = None,
        device_type: Optional[str] = None
    ) -> List[AssetTemplate]:
        """Get asset templates with filtering."""
        query = self.db.query(AssetTemplate)
        
        if is_system is not None:
            query = query.filter(AssetTemplate.is_system == is_system)
        if is_active is not None:
            query = query.filter(AssetTemplate.is_active == is_active)
        if device_type:
            query = query.filter(AssetTemplate.device_type == device_type)
        
        return query.order_by(AssetTemplate.usage_count.desc()).offset(skip).limit(limit).all()

    def get_asset_template(self, template_id: int) -> Optional[AssetTemplate]:
        """Get an asset template by ID."""
        return self.db.query(AssetTemplate).filter(AssetTemplate.id == template_id).first()

    def create_asset_template(
        self,
        template_data: AssetTemplateCreate,
        user_id: Optional[int] = None
    ) -> AssetTemplate:
        """Create a new asset template."""
        template = AssetTemplate(
            name=template_data.name,
            description=template_data.description,
            device_type=template_data.device_type,
            template_data=template_data.template_data,
            custom_fields_schema=template_data.custom_fields_schema,
            auto_apply_rules=template_data.auto_apply_rules,
            is_system=template_data.is_system,
            created_by=user_id
        )
        
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def update_asset_template(
        self,
        template_id: int,
        template_data: AssetTemplateUpdate
    ) -> Optional[AssetTemplate]:
        """Update an asset template."""
        template = self.get_asset_template(template_id)
        if not template:
            return None
        
        update_data = template_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)
        
        self.db.commit()
        self.db.refresh(template)
        return template

    def delete_asset_template(self, template_id: int) -> bool:
        """Delete an asset template."""
        template = self.get_asset_template(template_id)
        if not template or template.is_system:
            return False  # Cannot delete system templates
        
        self.db.delete(template)
        self.db.commit()
        return True

    def increment_asset_template_usage(self, template_id: int) -> None:
        """Increment usage count for an asset template."""
        template = self.get_asset_template(template_id)
        if template:
            template.usage_count += 1
            self.db.commit()

    def get_suggested_asset_template(
        self,
        device_type: str,
        os_family: Optional[str] = None,
        manufacturer: Optional[str] = None
    ) -> Optional[AssetTemplate]:
        """Get the best matching asset template for a device."""
        # First try exact device type match
        template = self.db.query(AssetTemplate).filter(
            AssetTemplate.device_type == device_type,
            AssetTemplate.is_active == True
        ).order_by(AssetTemplate.usage_count.desc()).first()
        
        if template:
            return template
        
        # Try to find a generic template
        generic_template = self.db.query(AssetTemplate).filter(
            AssetTemplate.device_type == "generic",
            AssetTemplate.is_active == True
        ).order_by(AssetTemplate.usage_count.desc()).first()
        
        return generic_template

    def create_default_templates(self) -> None:
        """Create default system templates."""
        # Default scan templates
        default_scan_templates = [
            {
                "name": "Quick Network Discovery",
                "description": "Fast ping scan to discover active hosts",
                "scan_type": "quick",
                "scan_config": {
                    "scan_type": "quick",
                    "discovery_depth": 1,
                    "timeout": 30,
                    "arguments": "-sn -T4"
                }
            },
            {
                "name": "Standard Network Scan",
                "description": "Comprehensive port and service discovery",
                "scan_type": "standard",
                "scan_config": {
                    "scan_type": "standard",
                    "discovery_depth": 2,
                    "timeout": 300,
                    "arguments": "-sS -O -sV -A"
                }
            },
            {
                "name": "Deep Network Analysis",
                "description": "Comprehensive scan with vulnerability detection",
                "scan_type": "comprehensive",
                "scan_config": {
                    "scan_type": "comprehensive",
                    "discovery_depth": 3,
                    "timeout": 600,
                    "arguments": "-sS -O -sV -A --script default,safe,vuln"
                }
            }
        ]
        
        for template_data in default_scan_templates:
            existing = self.db.query(ScanTemplate).filter(
                ScanTemplate.name == template_data["name"]
            ).first()
            if not existing:
                template = ScanTemplate(
                    name=template_data["name"],
                    description=template_data["description"],
                    scan_type=template_data["scan_type"],
                    scan_config=template_data["scan_config"],
                    is_system=True
                )
                self.db.add(template)
        
        # Default asset templates
        default_asset_templates = [
            {
                "name": "Windows Server Template",
                "description": "Template for Windows servers",
                "device_type": "server",
                "template_data": {
                    "os_family": "Windows",
                    "is_managed": True,
                    "custom_fields": {
                        "domain": "",
                        "service_pack": "",
                        "last_patch_date": ""
                    }
                }
            },
            {
                "name": "Linux Server Template",
                "description": "Template for Linux servers",
                "device_type": "server",
                "template_data": {
                    "os_family": "Linux",
                    "is_managed": True,
                    "custom_fields": {
                        "distribution": "",
                        "kernel_version": "",
                        "package_manager": ""
                    }
                }
            },
            {
                "name": "Network Switch Template",
                "description": "Template for network switches",
                "device_type": "switch",
                "template_data": {
                    "is_managed": True,
                    "custom_fields": {
                        "firmware_version": "",
                        "port_count": "",
                        "management_vlan": ""
                    }
                }
            },
            {
                "name": "Generic Device Template",
                "description": "Generic template for unknown devices",
                "device_type": "generic",
                "template_data": {
                    "is_managed": False,
                    "custom_fields": {
                        "notes": "",
                        "purpose": ""
                    }
                }
            }
        ]
        
        for template_data in default_asset_templates:
            existing = self.db.query(AssetTemplate).filter(
                AssetTemplate.name == template_data["name"]
            ).first()
            if not existing:
                template = AssetTemplate(
                    name=template_data["name"],
                    description=template_data["description"],
                    device_type=template_data["device_type"],
                    template_data=template_data["template_data"],
                    is_system=True
                )
                self.db.add(template)
        
        self.db.commit()
