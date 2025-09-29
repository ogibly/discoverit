"""
Asset service for managing assets and their relationships.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from ..models import Asset, IPAddress, Label, AssetGroup, Settings
from ..schemas import AssetCreate, AssetUpdate, AssetGroupCreate, AssetGroupUpdate, LabelBase, LabelUpdate, SettingsUpdate
import ipaddress
from datetime import datetime


class AssetService:
    def __init__(self, db: Session):
        self.db = db

    def create_asset(self, asset_data: AssetCreate) -> Asset:
        """Create a new asset with IP addresses and labels."""
        # Create the asset
        asset = Asset(
            name=asset_data.name,
            description=asset_data.description,
            primary_ip=asset_data.primary_ip,
            mac_address=asset_data.mac_address,
            hostname=asset_data.hostname,
            os_name=asset_data.os_name,
            os_family=asset_data.os_family,
            os_version=asset_data.os_version,
            manufacturer=asset_data.manufacturer,
            model=asset_data.model,
            serial_number=asset_data.serial_number,
            owner=asset_data.owner,
            location=asset_data.location,
            department=asset_data.department,
            username=asset_data.username,
            password=asset_data.password,
            ssh_key=asset_data.ssh_key,
            is_managed=asset_data.is_managed,
            is_active=asset_data.is_active,
            custom_fields=asset_data.custom_fields
        )
        
        self.db.add(asset)
        self.db.flush()  # Get the ID
        
        # Add IP addresses
        for ip_str in asset_data.ip_addresses:
            ip_address = IPAddress(
                ip=ip_str,
                asset_id=asset.id,
                is_primary=(ip_str == asset_data.primary_ip)
            )
            self.db.add(ip_address)
        
        # Add labels
        if asset_data.labels:
            labels = self.db.query(Label).filter(Label.id.in_(asset_data.labels)).all()
            asset.labels.extend(labels)
        
        self.db.commit()
        self.db.refresh(asset)
        return asset

    def get_asset(self, asset_id: int) -> Optional[Asset]:
        """Get an asset by ID with all relationships loaded."""
        return self.db.query(Asset).options(
            joinedload(Asset.ip_addresses),
            joinedload(Asset.labels),
            joinedload(Asset.groups)
        ).filter(Asset.id == asset_id).first()

    def get_assets(
        self, 
        skip: int = 0, 
        limit: int = 100,
        label_ids: Optional[List[int]] = None,
        search: Optional[str] = None,
        is_managed: Optional[bool] = None
    ) -> List[Asset]:
        """Get assets with optional filtering."""
        query = self.db.query(Asset).options(
            joinedload(Asset.ip_addresses),
            joinedload(Asset.labels),
            joinedload(Asset.groups)
        )
        
        # Apply filters
        if label_ids:
            query = query.join(Asset.labels).filter(Label.id.in_(label_ids))
        
        if search:
            search_filter = or_(
                Asset.name.ilike(f"%{search}%"),
                Asset.hostname.ilike(f"%{search}%"),
                Asset.primary_ip.ilike(f"%{search}%"),
                Asset.mac_address.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        if is_managed is not None:
            query = query.filter(Asset.is_managed == is_managed)
        
        return query.offset(skip).limit(limit).all()

    def update_asset(self, asset_id: int, asset_data: AssetUpdate) -> Optional[Asset]:
        """Update an asset."""
        asset = self.get_asset(asset_id)
        if not asset:
            return None
        
        # Update basic fields
        update_data = asset_data.dict(exclude_unset=True, exclude={'ip_addresses', 'labels'})
        for field, value in update_data.items():
            setattr(asset, field, value)
        
        # Update IP addresses if provided
        if asset_data.ip_addresses is not None:
            # Remove existing IP addresses
            self.db.query(IPAddress).filter(IPAddress.asset_id == asset_id).delete()
            
            # Add new IP addresses
            for ip_str in asset_data.ip_addresses:
                ip_address = IPAddress(
                    ip=ip_str,
                    asset_id=asset.id,
                    is_primary=(ip_str == asset_data.primary_ip)
                )
                self.db.add(ip_address)
        
        # Update labels if provided
        if asset_data.labels is not None:
            asset.labels.clear()
            if asset_data.labels:
                labels = self.db.query(Label).filter(Label.id.in_(asset_data.labels)).all()
                asset.labels.extend(labels)
        
        asset.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(asset)
        return asset

    # Asset Group methods
    def get_asset_groups(
        self, 
        skip: int = 0, 
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[AssetGroup]:
        """Get asset groups with optional filtering."""
        query = self.db.query(AssetGroup).options(
            joinedload(AssetGroup.assets),
            joinedload(AssetGroup.labels)
        )
        
        if is_active is not None:
            query = query.filter(AssetGroup.is_active == is_active)
        
        return query.offset(skip).limit(limit).all()

    def create_asset_group(self, group_data: AssetGroupCreate) -> AssetGroup:
        """Create a new asset group."""
        group = AssetGroup(
            name=group_data.name,
            description=group_data.description,
            default_username=group_data.default_username,
            default_password=group_data.default_password,
            default_ssh_key=group_data.default_ssh_key,
            is_active=group_data.is_active,
            custom_fields=group_data.custom_fields
        )
        
        self.db.add(group)
        self.db.flush()
        
        # Add assets
        if group_data.asset_ids:
            assets = self.db.query(Asset).filter(Asset.id.in_(group_data.asset_ids)).all()
            group.assets.extend(assets)
        
        # Add labels
        if group_data.labels:
            labels = self.db.query(Label).filter(Label.id.in_(group_data.labels)).all()
            group.labels.extend(labels)
        
        self.db.commit()
        self.db.refresh(group)
        return group

    def get_asset_group(self, group_id: int) -> Optional[AssetGroup]:
        """Get an asset group by ID."""
        return self.db.query(AssetGroup).options(
            joinedload(AssetGroup.assets),
            joinedload(AssetGroup.labels)
        ).filter(AssetGroup.id == group_id).first()

    def update_asset_group(self, group_id: int, group_data: AssetGroupUpdate) -> Optional[AssetGroup]:
        """Update an asset group."""
        group = self.get_asset_group(group_id)
        if not group:
            return None
        
        # Update basic fields
        update_data = group_data.dict(exclude_unset=True, exclude={'asset_ids', 'labels'})
        for field, value in update_data.items():
            setattr(group, field, value)
        
        # Update assets if provided
        if group_data.asset_ids is not None:
            group.assets.clear()
            if group_data.asset_ids:
                assets = self.db.query(Asset).filter(Asset.id.in_(group_data.asset_ids)).all()
                group.assets.extend(assets)
        
        # Update labels if provided
        if group_data.labels is not None:
            group.labels.clear()
            if group_data.labels:
                labels = self.db.query(Label).filter(Label.id.in_(group_data.labels)).all()
                group.labels.extend(labels)
        
        group.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(group)
        return group

    def delete_asset_group(self, group_id: int) -> bool:
        """Delete an asset group."""
        group = self.db.query(AssetGroup).filter(AssetGroup.id == group_id).first()
        if not group:
            return False
        
        self.db.delete(group)
        self.db.commit()
        return True

    # Label methods
    def get_labels(self, skip: int = 0, limit: int = 100) -> List[Label]:
        """Get labels."""
        return self.db.query(Label).offset(skip).limit(limit).all()

    def create_label(self, label_data: LabelBase) -> Label:
        """Create a new label."""
        label = Label(
            name=label_data.name,
            description=label_data.description,
            color=label_data.color
        )
        
        self.db.add(label)
        self.db.commit()
        self.db.refresh(label)
        return label

    def get_label(self, label_id: int) -> Optional[Label]:
        """Get a label by ID."""
        return self.db.query(Label).filter(Label.id == label_id).first()

    def update_label(self, label_id: int, label_data: LabelUpdate) -> Optional[Label]:
        """Update a label."""
        label = self.get_label(label_id)
        if not label:
            return None
        
        # Update fields
        update_data = label_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(label, field, value)
        
        label.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(label)
        return label

    def delete_label(self, label_id: int) -> bool:
        """Delete a label."""
        label = self.db.query(Label).filter(Label.id == label_id).first()
        if not label:
            return False
        
        self.db.delete(label)
        self.db.commit()
        return True

    # Settings methods
    def get_settings(self) -> Optional[Settings]:
        """Get application settings."""
        return self.db.query(Settings).first()

    def create_default_settings(self) -> Settings:
        """Create default settings."""
        # Create default scanner configurations
        default_scanners = [
            {
                "name": "Default Scanner",
                "url": "http://scanner:8001",
                "subnets": ["172.18.0.0/16"],
                "is_active": True,
                "max_concurrent_scans": 3,
                "timeout_seconds": 300
            }
        ]
        
        settings = Settings(
            scanners=default_scanners,
            default_subnet="192.168.1.0/24",
            scan_timeout=300,
            max_concurrent_scans=5,
        )
        
        self.db.add(settings)
        self.db.commit()
        self.db.refresh(settings)
        return settings

    def update_settings(self, settings_data: SettingsUpdate) -> Settings:
        """Update application settings."""
        settings = self.get_settings()
        if not settings:
            settings = self.create_default_settings()
        
        # Update fields
        update_data = settings_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
        
        settings.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(settings)
        return settings

    def delete_asset(self, asset_id: int) -> bool:
        """Delete an asset."""
        asset = self.db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            return False
        
        self.db.delete(asset)
        self.db.commit()
        return True

    def get_asset_by_ip(self, ip: str) -> Optional[Asset]:
        """Get an asset by IP address."""
        return self.db.query(Asset).join(IPAddress).filter(
            IPAddress.ip == ip
        ).options(
            joinedload(Asset.ip_addresses),
            joinedload(Asset.labels),
            joinedload(Asset.groups)
        ).first()

    def create_asset_from_scan(self, scan_data: Dict[str, Any], ip: str) -> Asset:
        """Create an asset from scan data."""
        # Extract information from scan data
        hostname = scan_data.get('hostname')
        os_info = scan_data.get('os_info', {})
        device_info = scan_data.get('device_info', {})
        addresses = scan_data.get('addresses', {})
        
        # Create asset name
        name = hostname or ip
        
        # Create asset data
        asset_data = AssetCreate(
            name=name,
            primary_ip=ip,
            mac_address=addresses.get('mac'),
            hostname=hostname,
            os_name=os_info.get('os_name'),
            os_family=os_info.get('os_family'),
            os_version=os_info.get('os_version'),
            manufacturer=device_info.get('manufacturer'),
            model=device_info.get('model'),
            is_managed=False,  # Auto-discovered
            scan_data=scan_data
        )
        
        return self.create_asset(asset_data)

    def update_asset_from_scan(self, asset: Asset, scan_data: Dict[str, Any]) -> Asset:
        """Update an asset with new scan data."""
        # Extract information from scan data
        os_info = scan_data.get('os_info', {})
        device_info = scan_data.get('device_info', {})
        addresses = scan_data.get('addresses', {})
        
        # Update fields if they're not already set or if scan data is more recent
        if not asset.os_name and os_info.get('os_name'):
            asset.os_name = os_info.get('os_name')
        if not asset.os_family and os_info.get('os_family'):
            asset.os_family = os_info.get('os_family')
        if not asset.os_version and os_info.get('os_version'):
            asset.os_version = os_info.get('os_version')
        if not asset.manufacturer and device_info.get('manufacturer'):
            asset.manufacturer = device_info.get('manufacturer')
        if not asset.model and device_info.get('model'):
            asset.model = device_info.get('model')
        if not asset.mac_address and addresses.get('mac'):
            asset.mac_address = addresses.get('mac')
        
        # Update scan data and last seen
        asset.scan_data = scan_data
        asset.last_seen = datetime.utcnow()
        asset.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(asset)
        return asset
