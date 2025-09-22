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
            # Initialize task status
            task.status = "running"
            task.start_time = datetime.utcnow()
            self.db.commit()
            
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
                
                # Only create scan record if a device was actually discovered
                if self._is_device_discovered(scan_result):
                    scan = Scan(
                        asset_id=None,  # No asset created automatically
                        scan_task_id=task.id,
                        scan_data=scan_result,
                        scan_type=task.scan_type,
                        status="completed"
                    )
                    self.db.add(scan)
                    self.db.commit()
            
            # Mark task as completed
            if task.status != "cancelled":
                task.status = "completed"
                task.progress = 100
                task.completed_ips = total_ips
                
                # Count actual discovered devices for this scan task
                discovered_count = self.db.query(Scan).filter(
                    Scan.scan_task_id == task.id,
                    Scan.asset_id.is_(None)  # Only count discovered devices, not converted assets
                ).count()
                
                # Update task with discovered device count
                task.discovered_devices = discovered_count
                
            task.end_time = datetime.utcnow()
            self.db.commit()
            
        except Exception as e:
            # Mark task as failed
            task.status = "failed"
            task.error_message = str(e)
            task.end_time = datetime.utcnow()
            self.db.commit()

    def _perform_scan(self, ip: str, scan_type: str) -> Dict[str, Any]:
        """Perform a comprehensive scan on a single IP address using multiple tools."""
        import subprocess
        import json
        import re
        import socket
        
        try:
            # Build comprehensive scan command based on scan type
            if scan_type == "quick":
                # Enhanced quick scan with more information
                cmd = ["nmap", "-sn", "-PE", "-PS21,22,23,25,53,80,110,443,993,995", "-PA21,22,23,25,53,80,110,443,993,995", ip]
            elif scan_type == "comprehensive":
                cmd = ["nmap", "-sS", "-O", "-sV", "-A", "--script", "default,safe", ip]
            elif scan_type == "snmp":
                cmd = ["nmap", "-sU", "-p", "161", "--script", "snmp-info,snmp-brute", ip]
            elif scan_type == "arp":
                cmd = ["nmap", "-sn", "-PR", ip]  # ARP ping scan
            elif scan_type == "lan_discovery":
                # LAN discovery with multiple techniques
                cmd = ["nmap", "-sn", "-PE", "-PS21,22,23,25,53,80,110,443,993,995", "-PA21,22,23,25,53,80,110,443,993,995", "-PR", ip]
            else:
                cmd = ["nmap", "-sn", "-PE", "-PS21,22,23,25,53,80,110,443,993,995", "-PA21,22,23,25,53,80,110,443,993,995", ip]
            
            # Run nmap
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            # Parse nmap output with enhanced information gathering
            scan_result = {
                "ip": ip,
                "scan_type": scan_type,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "completed" if result.returncode == 0 else "failed",
                "raw_output": result.stdout,
                "stderr": result.stderr,
                "ports": [],
                "os_info": {},
                "device_info": {},
                "hostname": None,
                "addresses": {"mac": None},
                "vendor": None,
                "device_type": None,
                "response_time": None,
                "ttl": None,
                "services": [],
                "vulnerabilities": [],
                "network_info": {}
            }
            
            # Check if host is up
            if "Host is up" not in result.stdout and "0 hosts up" in result.stdout:
                scan_result["status"] = "failed"
                scan_result["error"] = "Host is down or unreachable"
                return scan_result
            
            # Extract hostname
            hostname_match = re.search(r'for (\S+)', result.stdout)
            if hostname_match:
                scan_result["hostname"] = hostname_match.group(1)
            
            # Extract MAC address and vendor
            mac_match = re.search(r'MAC Address: ([0-9A-Fa-f:]{17}) \(([^)]+)\)', result.stdout)
            if mac_match:
                scan_result["addresses"]["mac"] = mac_match.group(1)
                scan_result["vendor"] = mac_match.group(2)
            
            # Extract response time
            response_time_match = re.search(r'(\d+\.\d+)s latency', result.stdout)
            if response_time_match:
                scan_result["response_time"] = float(response_time_match.group(1))
            
            # Extract TTL
            ttl_match = re.search(r'TTL=(\d+)', result.stdout)
            if ttl_match:
                scan_result["ttl"] = int(ttl_match.group(1))
            
            # Extract OS information
            os_match = re.search(r'Running: ([^,]+)', result.stdout)
            if os_match:
                scan_result["os_info"]["os_name"] = os_match.group(1).strip()
            
            # Extract OS details
            os_details_match = re.search(r'OS details: ([^,]+)', result.stdout)
            if os_details_match:
                scan_result["os_info"]["os_details"] = os_details_match.group(1).strip()
            
            # Extract open ports with enhanced information
            port_matches = re.findall(r'(\d+)/(\w+)\s+open\s+(\w+)(?:\s+([^,]+))?', result.stdout)
            for port, protocol, service, version in port_matches:
                port_info = {
                    "port": int(port),
                    "protocol": protocol,
                    "service": service,
                    "state": "open",
                    "version": version.strip() if version else None
                }
                scan_result["ports"].append(port_info)
                scan_result["services"].append(service)
            
            # Determine device type based on open ports and services
            scan_result["device_type"] = self._determine_device_type(scan_result["ports"], scan_result["services"])
            
            # Try to get additional network information
            try:
                hostname = socket.gethostbyaddr(ip)[0] if not scan_result["hostname"] else scan_result["hostname"]
                scan_result["network_info"]["reverse_dns"] = hostname
            except:
                pass
            
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

    def _determine_device_type(self, ports: List[Dict], services: List[str]) -> str:
        """Determine device type based on open ports and services."""
        if not ports and not services:
            return "Unknown"
        
        # Common service patterns for device identification
        web_services = {'http', 'https', 'apache', 'nginx', 'iis'}
        ssh_services = {'ssh', 'openssh'}
        ftp_services = {'ftp', 'vsftpd', 'proftpd'}
        smtp_services = {'smtp', 'postfix', 'sendmail'}
        dns_services = {'dns', 'bind', 'named'}
        database_services = {'mysql', 'postgresql', 'mongodb', 'redis'}
        printer_services = {'ipp', 'lpd', 'cups'}
        router_services = {'telnet', 'snmp'}
        
        service_set = set(services)
        
        if web_services.intersection(service_set):
            return "Web Server"
        elif ssh_services.intersection(service_set):
            return "Server/Workstation"
        elif ftp_services.intersection(service_set):
            return "File Server"
        elif smtp_services.intersection(service_set):
            return "Mail Server"
        elif dns_services.intersection(service_set):
            return "DNS Server"
        elif database_services.intersection(service_set):
            return "Database Server"
        elif printer_services.intersection(service_set):
            return "Printer"
        elif router_services.intersection(service_set):
            return "Network Device"
        elif any(port['port'] in [80, 443, 8080, 8443] for port in ports):
            return "Web Server"
        elif any(port['port'] == 22 for port in ports):
            return "Server/Workstation"
        elif any(port['port'] in [21, 20] for port in ports):
            return "File Server"
        elif any(port['port'] == 25 for port in ports):
            return "Mail Server"
        elif any(port['port'] == 53 for port in ports):
            return "DNS Server"
        else:
            return "Network Device"

    def discover_lan_network(self, max_depth: int = 2) -> Dict[str, Any]:
        """Discover devices on the local network with configurable depth."""
        import subprocess
        import ipaddress
        import socket
        import concurrent.futures
        import threading
        
        try:
            # Get local network information
            local_ip = self._get_local_ip()
            network = self._get_local_network(local_ip)
            
            if not network:
                return {"error": "Could not determine local network"}
            
            # Generate IP list based on depth (reduced scope for performance)
            ips_to_scan = self._generate_network_ips_optimized(network, max_depth)
            
            # Perform discovery scan with concurrent processing
            discovery_results = []
            
            # Use ThreadPoolExecutor for concurrent scanning
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                # Submit all scan tasks
                future_to_ip = {
                    executor.submit(self._perform_quick_scan, ip): ip 
                    for ip in ips_to_scan
                }
                
                # Collect results as they complete
                for future in concurrent.futures.as_completed(future_to_ip, timeout=60):
                    try:
                        scan_result = future.result()
                        if scan_result and scan_result.get("status") == "completed":
                            discovery_results.append(scan_result)
                    except Exception as e:
                        # Skip failed scans
                        continue
            
            return {
                "network": str(network),
                "local_ip": local_ip,
                "max_depth": max_depth,
                "total_ips_scanned": len(ips_to_scan),
                "live_devices": len(discovery_results),
                "devices": discovery_results,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {"error": f"LAN discovery failed: {str(e)}"}

    def _get_local_ip(self) -> str:
        """Get the local IP address."""
        try:
            # Connect to a remote address to determine local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
            return local_ip
        except:
            return "127.0.0.1"

    def _get_local_network(self, local_ip: str) -> Optional[ipaddress.IPv4Network]:
        """Get the local network based on IP address."""
        try:
            # Assume /24 network for most cases
            ip_obj = ipaddress.IPv4Address(local_ip)
            network = ipaddress.IPv4Network(f"{ip_obj}/24", strict=False)
            return network
        except:
            return None

    def _generate_network_ips_optimized(self, network: ipaddress.IPv4Network, max_depth: int) -> List[str]:
        """Generate IP addresses to scan based on network and depth (optimized for performance)."""
        ips = []
        
        if max_depth == 1:
            # Scan only the local subnet (sample every 4th IP for performance)
            for i, ip in enumerate(network.hosts()):
                if i % 4 == 0:  # Sample every 4th IP
                    ips.append(str(ip))
        elif max_depth == 2:
            # Scan local subnet (sample every 2nd IP) and adjacent subnets (sample every 4th IP)
            for i, ip in enumerate(network.hosts()):
                if i % 2 == 0:  # Sample every 2nd IP
                    ips.append(str(ip))
            
            # Add adjacent subnets (sampled)
            try:
                # Previous subnet
                prev_network = ipaddress.IPv4Network(f"{network.network_address - 256}/24", strict=False)
                for i, ip in enumerate(prev_network.hosts()):
                    if i % 4 == 0:  # Sample every 4th IP
                        ips.append(str(ip))
                
                # Next subnet
                next_network = ipaddress.IPv4Network(f"{network.network_address + 256}/24", strict=False)
                for i, ip in enumerate(next_network.hosts()):
                    if i % 4 == 0:  # Sample every 4th IP
                        ips.append(str(ip))
            except:
                pass
        else:
            # For higher depths, scan multiple subnets (heavily sampled)
            base_network = ipaddress.IPv4Network(f"{network.network_address}/16", strict=False)
            for i, ip in enumerate(base_network.hosts()):
                if i % 16 == 0:  # Sample every 16th IP for performance
                    ips.append(str(ip))
        
        return ips[:100]  # Limit to 100 IPs maximum for performance

    def _perform_quick_scan(self, ip: str) -> Dict[str, Any]:
        """Perform a quick ping scan on a single IP address."""
        import subprocess
        
        try:
            # Use ping for quick host discovery
            result = subprocess.run(
                ["ping", "-c", "1", "-W", "1", ip], 
                capture_output=True, 
                text=True, 
                timeout=3
            )
            
            if result.returncode == 0:
                return {
                    "ip": ip,
                    "status": "completed",
                    "hostname": None,
                    "device_type": "Network Device",
                    "response_time": None,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "ip": ip,
                    "status": "failed",
                    "error": "Host unreachable",
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except subprocess.TimeoutExpired:
            return {
                "ip": ip,
                "status": "failed",
                "error": "Timeout",
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "ip": ip,
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    def _is_device_discovered(self, scan_result: Dict[str, Any]) -> bool:
        """
        Determine if a scan result represents an actual discovered device.
        Only creates device records for IPs that have actual devices behind them.
        """
        # If scan failed, no device was discovered
        if scan_result.get("status") == "failed" or "error" in scan_result:
            return False
        
        # Check if host is up and responding
        if "Host is up" not in scan_result.get("raw_output", ""):
            return False
        
        # Device is considered discovered if any of these conditions are met:
        
        # 1. Has open ports (indicates services running)
        if scan_result.get("ports") and len(scan_result["ports"]) > 0:
            return True
        
        # 2. Has a hostname (indicates DNS resolution)
        if scan_result.get("hostname") and scan_result["hostname"] != scan_result.get("ip"):
            return True
        
        # 3. Has MAC address (indicates physical device on local network)
        if scan_result.get("addresses", {}).get("mac"):
            return True
        
        # 4. Has OS information (indicates OS fingerprinting success)
        if scan_result.get("os_info", {}).get("os_name"):
            return True
        
        # 5. Has vendor information (indicates device identification)
        if scan_result.get("vendor"):
            return True
        
        # 6. Has response time (indicates device responded to probes)
        if scan_result.get("response_time") is not None:
            return True
        
        # 7. Has TTL information (indicates network device)
        if scan_result.get("ttl") is not None:
            return True
        
        # 8. Has services detected (even if no open ports, services might be detected)
        if scan_result.get("services") and len(scan_result["services"]) > 0:
            return True
        
        # If none of the above conditions are met, no device was discovered
        return False
