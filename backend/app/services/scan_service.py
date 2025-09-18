"""
Scan service for managing network scans and scan tasks.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc
from ..models import ScanTask, Scan, Asset
from ..schemas import ScanTaskCreate, ScanTaskUpdate
from .asset_service import AssetService
import ipaddress
import requests
import json
from datetime import datetime
import asyncio
import concurrent.futures


class ScanService:
    def __init__(self, db: Session):
        self.db = db
        self.asset_service = AssetService(db)

    def create_scan_task(self, task_data: ScanTaskCreate) -> ScanTask:
        """Create a new scan task."""
        task = ScanTask(
            name=task_data.name,
            target=task_data.target,
            scan_type=task_data.scan_type,
            created_by=task_data.created_by
        )
        
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def get_scan_task(self, task_id: int) -> Optional[ScanTask]:
        """Get a scan task by ID."""
        return self.db.query(ScanTask).options(
            joinedload(ScanTask.scans)
        ).filter(ScanTask.id == task_id).first()

    def get_scan_tasks(
        self, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[ScanTask]:
        """Get scan tasks with optional filtering."""
        query = self.db.query(ScanTask).options(
            joinedload(ScanTask.scans)
        )
        
        if status:
            query = query.filter(ScanTask.status == status)
        
        return query.order_by(desc(ScanTask.start_time)).offset(skip).limit(limit).all()

    def get_active_scan_task(self) -> Optional[ScanTask]:
        """Get the currently active scan task."""
        return self.db.query(ScanTask).filter(
            ScanTask.status == "running"
        ).first()

    def update_scan_task(self, task_id: int, task_data: ScanTaskUpdate) -> Optional[ScanTask]:
        """Update a scan task."""
        task = self.get_scan_task(task_id)
        if not task:
            return None
        
        update_data = task_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)
        
        self.db.commit()
        self.db.refresh(task)
        return task

    def cancel_scan_task(self, task_id: int) -> bool:
        """Cancel a running scan task."""
        task = self.get_scan_task(task_id)
        if not task or task.status != "running":
            return False
        
        task.status = "cancelled"
        task.end_time = datetime.utcnow()
        self.db.commit()
        return True

    def get_ips_from_target(self, target: str) -> List[str]:
        """Parse target string and return list of IPs to scan."""
        ips = []
        
        try:
            # Handle CIDR notation
            if '/' in target:
                network = ipaddress.ip_network(target, strict=False)
                ips = [str(ip) for ip in network]
            # Handle IP range (e.g., 192.168.1.1-50)
            elif '-' in target:
                base_ip, end_range = target.rsplit('-', 1)
                base_parts = base_ip.split('.')
                if len(base_parts) == 4 and end_range.isdigit():
                    start_ip = int(base_parts[3])
                    end_ip = int(end_range)
                    for i in range(start_ip, min(end_ip + 1, 256)):
                        ips.append(f"{'.'.join(base_parts[:3])}.{i}")
            # Handle comma-separated IPs
            elif ',' in target:
                ips = [ip.strip() for ip in target.split(',')]
            # Single IP
            else:
                ips = [target]
        except (ValueError, ipaddress.AddressValueError):
            # If parsing fails, treat as single IP
            ips = [target]
        
        return ips

    def run_scan_task(self, task_id: int) -> None:
        """Run a scan task in the background."""
        task = self.get_scan_task(task_id)
        if not task:
            return
        
        try:
            # Get IPs to scan
            ips_to_scan = self.get_ips_from_target(task.target)
            total_ips = len(ips_to_scan)
            task.total_ips = total_ips
            self.db.commit()
            
            # Update progress as we scan
            for i, ip in enumerate(ips_to_scan):
                # Check for cancellation
                self.db.refresh(task)
                if task.status == "cancelled":
                    break
                
                # Update current IP and progress
                task.current_ip = ip
                task.completed_ips = i
                task.progress = int((i / total_ips) * 100) if total_ips > 0 else 0
                self.db.commit()
                
                # Perform the scan
                scan_result = self._perform_scan(ip, task.scan_type)
                
                # Create or update asset
                asset = self.asset_service.get_asset_by_ip(ip)
                if asset:
                    # Update existing asset
                    self.asset_service.update_asset_from_scan(asset, scan_result)
                else:
                    # Create new asset
                    asset = self.asset_service.create_asset_from_scan(scan_result, ip)
                
                # Create scan record
                scan = Scan(
                    asset_id=asset.id,
                    scan_task_id=task.id,
                    scan_data=scan_result,
                    scan_type=task.scan_type,
                    status="completed" if "error" not in scan_result else "failed"
                )
                self.db.add(scan)
                self.db.commit()
            
            # Mark task as completed
            if task.status != "cancelled":
                task.status = "completed"
                task.progress = 100
                task.completed_ips = total_ips
            task.end_time = datetime.utcnow()
            self.db.commit()
            
        except Exception as e:
            # Mark task as failed
            task.status = "failed"
            task.error_message = str(e)
            task.end_time = datetime.utcnow()
            self.db.commit()

    def _perform_scan(self, ip: str, scan_type: str) -> Dict[str, Any]:
        """Perform a scan on a single IP address using local nmap."""
        import subprocess
        import json
        import re
        
        try:
            # Build nmap command based on scan type
            if scan_type == "quick":
                cmd = ["nmap", "-sn", ip]  # Ping scan only
            elif scan_type == "comprehensive":
                cmd = ["nmap", "-sS", "-O", "-sV", "-A", ip]
            elif scan_type == "snmp":
                cmd = ["nmap", "-sU", "-p", "161", "--script", "snmp-info", ip]
            elif scan_type == "arp":
                cmd = ["nmap", "-sn", "-PR", ip]  # ARP ping scan
            else:
                cmd = ["nmap", "-sn", ip]  # Default to ping scan
            
            # Run nmap
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            # Parse nmap output
            scan_result = {
                "ip": ip,
                "scan_type": scan_type,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "completed" if result.returncode == 0 else "failed",
                "raw_output": result.stdout,
                "ports": [],
                "os_info": {},
                "device_info": {},
                "hostname": None,
                "addresses": {"mac": None}
            }
            
            # Extract hostname
            hostname_match = re.search(r'for (\S+)', result.stdout)
            if hostname_match:
                scan_result["hostname"] = hostname_match.group(1)
            
            # Extract MAC address
            mac_match = re.search(r'MAC Address: ([0-9A-Fa-f:]{17})', result.stdout)
            if mac_match:
                scan_result["addresses"]["mac"] = mac_match.group(1)
            
            # Extract OS information
            os_match = re.search(r'Running: ([^,]+)', result.stdout)
            if os_match:
                scan_result["os_info"]["os_name"] = os_match.group(1).strip()
            
            # Extract open ports
            port_matches = re.findall(r'(\d+)/(\w+)\s+open\s+(\w+)', result.stdout)
            for port, protocol, service in port_matches:
                scan_result["ports"].append({
                    "port": int(port),
                    "protocol": protocol,
                    "service": service,
                    "state": "open"
                })
            
            return scan_result
            
        except subprocess.TimeoutExpired:
            return {
                "ip": ip,
                "scan_type": scan_type,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "failed",
                "error": "Scan timeout",
                "ports": [],
                "os_info": {},
                "device_info": {}
            }
        except Exception as e:
            return {
                "ip": ip,
                "scan_type": scan_type,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "failed",
                "error": str(e),
                "ports": [],
                "os_info": {},
                "device_info": {}
            }

    def get_asset_scan_history(
        self, 
        asset_id: int, 
        page: int = 1, 
        limit: int = 10
    ) -> Dict[str, Any]:
        """Get scan history for an asset."""
        offset = (page - 1) * limit
        
        scans = self.db.query(Scan).filter(
            Scan.asset_id == asset_id
        ).order_by(desc(Scan.timestamp)).offset(offset).limit(limit).all()
        
        total = self.db.query(Scan).filter(Scan.asset_id == asset_id).count()
        
        return {
            "scans": scans,
            "page": page,
            "total": total,
            "has_more": (offset + len(scans)) < total
        }

    def delete_scan(self, scan_id: int) -> bool:
        """Delete a scan record."""
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return False
        
        self.db.delete(scan)
        self.db.commit()
        return True

    def get_scan_statistics(self) -> Dict[str, Any]:
        """Get statistics about scan tasks."""
        total_scans = self.db.query(ScanTask).count()
        completed_scans = self.db.query(ScanTask).filter(ScanTask.status == "completed").count()
        running_scans = self.db.query(ScanTask).filter(ScanTask.status == "running").count()
        failed_scans = self.db.query(ScanTask).filter(ScanTask.status == "failed").count()
        cancelled_scans = self.db.query(ScanTask).filter(ScanTask.status == "cancelled").count()
        
        # Get total assets discovered
        total_assets = self.db.query(Asset).count()
        
        # Get recent scan activity (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_scans = self.db.query(ScanTask).filter(
            ScanTask.start_time >= week_ago
        ).count()
        
        return {
            "total_scans": total_scans,
            "completed_scans": completed_scans,
            "running_scans": running_scans,
            "failed_scans": failed_scans,
            "cancelled_scans": cancelled_scans,
            "total_assets": total_assets,
            "recent_scans": recent_scans
        }
