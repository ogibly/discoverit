"""
Subnet management service for DiscoverIT application.
"""
import ipaddress
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta

from ..models import Subnet
from ..schemas import SubnetCreate, SubnetUpdate


class SubnetService:
    """Service for managing network subnets."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_subnet(self, subnet_data: SubnetCreate, created_by: str = None) -> Subnet:
        """Create a new subnet."""
        # Parse CIDR to extract network address and subnet mask
        network = ipaddress.ip_network(subnet_data.cidr, strict=False)
        network_address = str(network.network_address)
        subnet_mask = str(network.netmask)
        
        # Check for duplicate CIDR
        existing = self.db.query(Subnet).filter(Subnet.cidr == subnet_data.cidr).first()
        if existing:
            raise ValueError(f"Subnet with CIDR {subnet_data.cidr} already exists")
        
        # Check for duplicate name
        existing_name = self.db.query(Subnet).filter(Subnet.name == subnet_data.name).first()
        if existing_name:
            raise ValueError(f"Subnet with name '{subnet_data.name}' already exists")
        
        # Create subnet
        subnet = Subnet(
            name=subnet_data.name,
            description=subnet_data.description,
            cidr=subnet_data.cidr,
            network_address=network_address,
            subnet_mask=subnet_mask,
            gateway=subnet_data.gateway,
            vlan_id=subnet_data.vlan_id,
            location=subnet_data.location,
            department=subnet_data.department,
            is_active=subnet_data.is_active,
            is_managed=subnet_data.is_managed,
            scan_frequency=subnet_data.scan_frequency,
            tags=subnet_data.tags,
            created_by=created_by
        )
        
        # Calculate next scan time if managed
        if subnet.is_managed and subnet.scan_frequency != "manual":
            subnet.next_scan = self._calculate_next_scan_time(subnet.scan_frequency)
        
        self.db.add(subnet)
        self.db.commit()
        self.db.refresh(subnet)
        
        return subnet
    
    def get_subnet(self, subnet_id: int) -> Optional[Subnet]:
        """Get a subnet by ID."""
        return self.db.query(Subnet).filter(Subnet.id == subnet_id).first()
    
    def get_subnets(
        self, 
        skip: int = 0, 
        limit: int = 100,
        is_active: Optional[bool] = None,
        is_managed: Optional[bool] = None,
        department: Optional[str] = None,
        location: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Subnet]:
        """Get list of subnets with optional filtering."""
        query = self.db.query(Subnet)
        
        # Apply filters
        if is_active is not None:
            query = query.filter(Subnet.is_active == is_active)
        
        if is_managed is not None:
            query = query.filter(Subnet.is_managed == is_managed)
        
        if department:
            query = query.filter(Subnet.department.ilike(f"%{department}%"))
        
        if location:
            query = query.filter(Subnet.location.ilike(f"%{location}%"))
        
        if search:
            search_filter = or_(
                Subnet.name.ilike(f"%{search}%"),
                Subnet.description.ilike(f"%{search}%"),
                Subnet.cidr.ilike(f"%{search}%"),
                Subnet.location.ilike(f"%{search}%"),
                Subnet.department.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        return query.offset(skip).limit(limit).all()
    
    def update_subnet(self, subnet_id: int, subnet_data: SubnetUpdate) -> Optional[Subnet]:
        """Update a subnet."""
        subnet = self.get_subnet(subnet_id)
        if not subnet:
            return None
        
        # Check for duplicate name if name is being updated
        if subnet_data.name and subnet_data.name != subnet.name:
            existing = self.db.query(Subnet).filter(
                and_(Subnet.name == subnet_data.name, Subnet.id != subnet_id)
            ).first()
            if existing:
                raise ValueError(f"Subnet with name '{subnet_data.name}' already exists")
        
        # Check for duplicate CIDR if CIDR is being updated
        if subnet_data.cidr and subnet_data.cidr != subnet.cidr:
            existing = self.db.query(Subnet).filter(
                and_(Subnet.cidr == subnet_data.cidr, Subnet.id != subnet_id)
            ).first()
            if existing:
                raise ValueError(f"Subnet with CIDR {subnet_data.cidr} already exists")
            
            # Update network address and subnet mask if CIDR changed
            network = ipaddress.ip_network(subnet_data.cidr, strict=False)
            subnet.network_address = str(network.network_address)
            subnet.subnet_mask = str(network.netmask)
        
        # Update fields
        update_data = subnet_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(subnet, field, value)
        
        # Recalculate next scan time if scan frequency or managed status changed
        if (subnet_data.scan_frequency is not None or subnet_data.is_managed is not None):
            if subnet.is_managed and subnet.scan_frequency != "manual":
                subnet.next_scan = self._calculate_next_scan_time(subnet.scan_frequency)
            else:
                subnet.next_scan = None
        
        subnet.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(subnet)
        
        return subnet
    
    def delete_subnet(self, subnet_id: int) -> bool:
        """Delete a subnet."""
        subnet = self.get_subnet(subnet_id)
        if not subnet:
            return False
        
        self.db.delete(subnet)
        self.db.commit()
        
        return True
    
    def get_subnets_due_for_scan(self) -> List[Subnet]:
        """Get subnets that are due for scanning."""
        now = datetime.utcnow()
        return self.db.query(Subnet).filter(
            and_(
                Subnet.is_active == True,
                Subnet.is_managed == True,
                Subnet.scan_frequency != "manual",
                or_(
                    Subnet.next_scan.is_(None),
                    Subnet.next_scan <= now
                )
            )
        ).all()
    
    def update_last_scanned(self, subnet_id: int) -> Optional[Subnet]:
        """Update the last scanned timestamp for a subnet."""
        subnet = self.get_subnet(subnet_id)
        if not subnet:
            return None
        
        subnet.last_scanned = datetime.utcnow()
        
        # Calculate next scan time
        if subnet.is_managed and subnet.scan_frequency != "manual":
            subnet.next_scan = self._calculate_next_scan_time(subnet.scan_frequency)
        
        self.db.commit()
        self.db.refresh(subnet)
        
        return subnet
    
    def get_subnet_statistics(self) -> Dict[str, Any]:
        """Get subnet statistics."""
        total_subnets = self.db.query(Subnet).count()
        active_subnets = self.db.query(Subnet).filter(Subnet.is_active == True).count()
        managed_subnets = self.db.query(Subnet).filter(Subnet.is_managed == True).count()
        
        # Count by scan frequency
        frequency_stats = {}
        for frequency in ['daily', 'weekly', 'monthly', 'manual']:
            count = self.db.query(Subnet).filter(
                and_(Subnet.scan_frequency == frequency, Subnet.is_managed == True)
            ).count()
            frequency_stats[frequency] = count
        
        # Count by department
        department_stats = {}
        departments = self.db.query(Subnet.department).filter(
            Subnet.department.isnot(None)
        ).distinct().all()
        
        for dept_tuple in departments:
            if dept_tuple[0]:  # department is not None
                count = self.db.query(Subnet).filter(Subnet.department == dept_tuple[0]).count()
                department_stats[dept_tuple[0]] = count
        
        return {
            "total_subnets": total_subnets,
            "active_subnets": active_subnets,
            "managed_subnets": managed_subnets,
            "unmanaged_subnets": total_subnets - managed_subnets,
            "scan_frequency_distribution": frequency_stats,
            "department_distribution": department_stats
        }
    
    def _calculate_next_scan_time(self, frequency: str) -> datetime:
        """Calculate the next scan time based on frequency."""
        now = datetime.utcnow()
        
        if frequency == "daily":
            return now + timedelta(days=1)
        elif frequency == "weekly":
            return now + timedelta(weeks=1)
        elif frequency == "monthly":
            return now + timedelta(days=30)  # Approximate month
        else:
            return now  # For manual or unknown frequencies
    
    def create_default_subnets(self) -> None:
        """Create default subnets for common network ranges."""
        default_subnets = [
            {
                "name": "Docker Compose Network",
                "description": "Default Docker Compose network range",
                "cidr": "172.18.0.0/16",
                "location": "Local Development",
                "department": "Development",
                "is_managed": True,
                "scan_frequency": "weekly"
            },
            {
                "name": "Docker Bridge Network",
                "description": "Default Docker bridge network",
                "cidr": "172.17.0.0/16",
                "location": "Local Development",
                "department": "Development",
                "is_managed": True,
                "scan_frequency": "weekly"
            },
            {
                "name": "Home/Office Network",
                "description": "Common home and office network range",
                "cidr": "192.168.0.0/16",
                "location": "Office",
                "department": "IT",
                "is_managed": False,
                "scan_frequency": "manual"
            },
            {
                "name": "Large Private Network",
                "description": "Large private network range",
                "cidr": "10.0.0.0/8",
                "location": "Enterprise",
                "department": "IT",
                "is_managed": False,
                "scan_frequency": "manual"
            }
        ]
        
        for subnet_data in default_subnets:
            existing = self.db.query(Subnet).filter(
                Subnet.name == subnet_data["name"]
            ).first()
            
            if not existing:
                try:
                    self.create_subnet(SubnetCreate(**subnet_data), created_by="system")
                except ValueError:
                    # Skip if subnet already exists
                    pass
