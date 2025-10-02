"""
Enhanced Scan service for managing network scans and scan tasks.
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
import logging
import time
import subprocess

logger = logging.getLogger(__name__)


class ScanServiceV2:
    def __init__(self, db: Session):
        self.db = db
        from .scanner_service_enhanced import ScannerServiceV2
        self.scanner_service = ScannerServiceV2(db)
        self.asset_service = AssetService(db)

    def create_scan_task(self, task_data: ScanTaskCreate) -> ScanTask:
        """Create a new scan task with enhanced validation."""
        # Validate target format
        try:
            if '/' in task_data.target:
                ipaddress.ip_network(task_data.target, strict=False)
            else:
                ipaddress.ip_address(task_data.target)
        except ValueError as e:
            raise ValueError(f"Invalid target format: {e}")
        
        task = ScanTask(
            name=task_data.name,
            target=task_data.target,
            scan_template_id=task_data.scan_template_id,
            created_by=task_data.created_by,
            scanner_ids=getattr(task_data, 'scanner_ids', [])
        )
        
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        
        logger.info(f"Created scan task {task.id}: {task.name}")
        return task

    def get_scan_task(self, task_id: int) -> Optional[ScanTask]:
        """Get a scan task by ID with all related data."""
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

    def cancel_scan_task(self, task_id: int) -> bool:
        """Cancel a running scan task."""
        task = self.get_scan_task(task_id)
        if not task or task.status != "running":
            return False
        
        task.status = "cancelled"
        task.end_time = datetime.utcnow()
        self.db.commit()
        
        logger.info(f"Cancelled scan task {task_id}")
        return True

    def get_ips_from_target(self, target: str) -> List[str]:
        """Get list of IPs to scan from target specification."""
        ips = []
        
        try:
            if '/' in target:
                # CIDR notation
                network = ipaddress.ip_network(target, strict=False)
                # Limit to reasonable number of IPs (max 1024)
                if network.num_addresses > 1024:
                    raise ValueError(f"Target network too large: {network.num_addresses} addresses (max 1024)")
                
                for ip in network.hosts():
                    ips.append(str(ip))
            else:
                # Single IP
                ipaddress.ip_address(target)  # Validate
                ips.append(target)
                
        except ValueError as e:
            logger.error(f"Invalid target format: {target} - {e}")
            raise ValueError(f"Invalid target format: {e}")
        
        return ips

    def get_scanner_recommendation(self, target: str, current_user=None) -> Dict[str, Any]:
        """Get scanner recommendation for a target network."""
        try:
            # Get the best scanner for this target
            optimal_scanner = self.scanner_service.get_best_scanner_for_target(target, current_user)
            
            if not optimal_scanner:
                return {
                    "recommended_scanner": None,
                    "fallback_available": True,
                    "message": "No scanners configured. Will use local nmap fallback.",
                    "scanner_type": "local_fallback"
                }
            
            # Get all available scanners for comparison
            all_scanners = self.scanner_service.get_all_scanners()
            active_scanners = [s for s in all_scanners if s.is_active]
            
            # Check if there are satellite scanners available
            satellite_scanners = [s for s in active_scanners if not s.is_default]
            
            recommendation = {
                "recommended_scanner": {
                    "id": optimal_scanner.id,
                    "name": optimal_scanner.name,
                    "url": optimal_scanner.url,
                    "is_satellite": not optimal_scanner.is_default,
                    "is_default": optimal_scanner.is_default,
                    "subnets": optimal_scanner.subnets,
                    "max_concurrent_scans": optimal_scanner.max_concurrent_scans,
                    "timeout_seconds": optimal_scanner.timeout_seconds
                },
                "scanner_type": "satellite" if not optimal_scanner.is_default else "default",
                "message": f"Using {'satellite' if not optimal_scanner.is_default else 'default'} scanner '{optimal_scanner.name}' for optimal performance",
                "alternatives_available": len(satellite_scanners) > 1 if not optimal_scanner.is_default else len(satellite_scanners) > 0,
                "total_scanners": len(active_scanners),
                "satellite_scanners": len(satellite_scanners)
            }
            
            # Add suggestion for satellite scanner if using default
            if optimal_scanner.is_default and satellite_scanners:
                recommendation["suggestion"] = {
                    "type": "info",
                    "message": f"Consider setting up a satellite scanner for this network range for improved scan performance and accuracy.",
                    "available_satellites": len(satellite_scanners)
                }
            
            return recommendation
            
        except Exception as e:
            logger.error(f"Error getting scanner recommendation for {target}: {e}")
            return {
                "recommended_scanner": None,
                "fallback_available": True,
                "message": f"Error getting scanner recommendation: {str(e)}",
                "scanner_type": "error"
            }

    def run_scan_task(self, task_id: int) -> None:
        """Run a scan task with enhanced error handling and progress tracking."""
        task = self.get_scan_task(task_id)
        if not task:
            logger.error(f"Scan task {task_id} not found")
            return
        
        try:
            logger.info(f"Starting scan task {task_id}: {task.name}")
            
            # Initialize task status
            task.status = "running"
            task.start_time = datetime.utcnow()
            self.db.commit()
            
            # Get IPs to scan
            ips_to_scan = self.get_ips_from_target(task.target)
            total_ips = len(ips_to_scan)
            task.total_ips = total_ips
            self.db.commit()
            
            logger.info(f"Scanning {total_ips} IPs for task {task_id}")
            
            # Update progress as we scan
            for i, ip in enumerate(ips_to_scan):
                # Check for cancellation
                self.db.refresh(task)
                if task.status == "cancelled":
                    logger.info(f"Scan task {task_id} cancelled")
                    break
                
                # Update current IP and progress
                task.current_ip = ip
                task.completed_ips = i
                # Ensure progress never exceeds 100%
                progress = int((i / total_ips) * 100) if total_ips > 0 else 0
                task.progress = min(progress, 100)
                self.db.commit()
                
                try:
                    # Get scan configuration from template
                    scan_config = self._get_scan_config_from_template(task)
                    
                    # Perform the scan
                    scan_result = self._perform_scan(ip, scan_config)
                    
                    # Categorize the scan result
                    categorization = self._categorize_scan_result(scan_result)
                    scan_result["categorization"] = categorization
                    
                    # Add task metadata
                    scan_result["task_metadata"] = {
                        "task_id": task.id,
                        "task_name": task.name,
                        "scan_timestamp": datetime.utcnow().isoformat()
                    }
                    
                    # Create scan record
                    scan = Scan(
                        asset_id=None,  # No asset created automatically
                        scan_task_id=task.id,
                        scan_data=scan_result,
                        scan_type=scan_config["scan_type"],
                        status="completed" if categorization["is_device"] else "no_device"
                    )
                    self.db.add(scan)
                    self.db.commit()
                    
                    logger.debug(f"Scanned {ip}: {categorization['result_type']}")
                    
                except Exception as e:
                    logger.error(f"Failed to scan {ip}: {e}")
                    # Create failed scan record
                    failed_scan = Scan(
                        asset_id=None,
                        scan_task_id=task.id,
                        scan_data={
                            "ip": ip,
                            "status": "failed",
                            "error": str(e),
                            "timestamp": datetime.utcnow().isoformat()
                        },
                        scan_type=scan_config["scan_type"],
                        status="failed"
                    )
                    self.db.add(failed_scan)
                    self.db.commit()
            
            # Mark task as completed
            if task.status != "cancelled":
                task.status = "completed"
                task.progress = 100
                task.completed_ips = total_ips
                
                # Count actual discovered devices
                discovered_count = self.db.query(Scan).filter(
                    Scan.scan_task_id == task.id,
                    Scan.status == "completed"
                ).count()
                
                task.discovered_devices = discovered_count
                logger.info(f"Scan task {task_id} completed: {discovered_count} devices found")
            
            task.end_time = datetime.utcnow()
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Scan task {task_id} failed: {e}")
            # Mark task as failed
            task.status = "failed"
            task.error_message = str(e)
            task.end_time = datetime.utcnow()
            self.db.commit()

    def _get_scan_config_from_template(self, task: ScanTask) -> Dict[str, Any]:
        """Get scan configuration from the associated template."""
        if not task.scan_template_id:
            raise ValueError("Scan template is required for all scan tasks")
        
        # Get template from database
        from .template_service import TemplateService
        template_service = TemplateService(self.db)
        template = template_service.get_scan_template(task.scan_template_id)
        
        if not template:
            raise ValueError(f"Scan template {task.scan_template_id} not found")
        
        # Use template configuration
        config = template.scan_config.copy()
        return config

    def _perform_scan(self, ip: str, scan_config: Dict[str, Any]) -> Dict[str, Any]:
        """Perform a comprehensive scan using the optimal scanner service."""
        try:
            # Get the best scanner for this target IP
            optimal_scanner = self.scanner_service.get_best_scanner_for_target(ip)
            
            if not optimal_scanner:
                logger.warning(f"No scanner available for {ip}, using local nmap")
                return self._perform_local_scan(ip, scan_config)
            
            # Use the optimal scanner URL
            scanner_url = optimal_scanner.url
            logger.info(f"Using scanner '{optimal_scanner.name}' ({scanner_url}) for target {ip}")
            
            # Prepare scan request
            scan_request = {
                "target": ip,
                "scan_type": scan_config.get("scan_type", "standard"),
                "timeout": optimal_scanner.timeout_seconds or 30,
                "arguments": scan_config.get("arguments", "-sS -O -sV -A")
            }
            
            # Call scanner service
            response = requests.post(
                f"{scanner_url}/scan",
                json=scan_request,
                timeout=(optimal_scanner.timeout_seconds or 30) + 5  # Slightly longer than scanner timeout
            )
            
            if response.status_code == 200:
                scan_result = response.json()
                scan_result["scanner_info"] = {
                    "scanner_id": optimal_scanner.id,
                    "scanner_name": optimal_scanner.name,
                    "scanner_url": scanner_url,
                    "scan_method": "remote_scanner",
                    "is_satellite": not optimal_scanner.is_default
                }
                return scan_result
            else:
                # Fallback to local nmap if scanner service fails
                logger.warning(f"Scanner '{optimal_scanner.name}' failed for {ip}, using local nmap")
                return self._perform_local_scan(ip, scan_config)
                
        except requests.exceptions.RequestException as e:
            logger.warning(f"Scanner service unavailable for {ip}: {e}, using local nmap")
            return self._perform_local_scan(ip, scan_config)
        except Exception as e:
            logger.error(f"Scan failed for {ip}: {e}")
            return {
                "ip": ip,
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "scan_type": scan_config.get("scan_type", "standard")
            }

    def _perform_local_scan(self, ip: str, scan_config: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback local scan using nmap directly."""
        import re
        
        try:
            # Add network interface options for better host network access
            base_opts = ["--privileged", "--send-ip"]  # Use privileged mode and send IP packets
            
            # Get arguments from scan config (from template)
            arguments = scan_config.get("arguments", "-sS -O -sV -A")
            timeout = scan_config.get("timeout", 300)
            
            # Parse arguments and build command
            args_list = arguments.split()
            cmd = ["nmap"] + base_opts + args_list + [ip]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
            
            # Parse results
            scan_type = scan_config.get("scan_type", "standard")
            scan_result = self._parse_nmap_output(result, ip, scan_type)
            scan_result["scanner_info"] = {
                "scanner_url": "local_nmap",
                "scan_method": "local_nmap"
            }
            
            return scan_result
            
        except subprocess.TimeoutExpired:
            return {
                "ip": ip,
                "status": "failed",
                "error": "Scan timeout",
                "timestamp": datetime.utcnow().isoformat(),
                "scan_type": scan_config.get("scan_type", "standard")
            }
        except Exception as e:
            return {
                "ip": ip,
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "scan_type": scan_type
            }

    def _parse_nmap_output(self, result: subprocess.CompletedProcess, ip: str, scan_type: str) -> Dict[str, Any]:
        """Parse nmap output into structured data."""
        import re
        
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
        
        # Extract open ports
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
        
        # Determine device type
        scan_result["device_type"] = self._determine_device_type(scan_result)
        
        return scan_result

    def _determine_device_type(self, scan_result: Dict[str, Any]) -> str:
        """Determine device type based on scan results."""
        services = scan_result.get("services", [])
        ports = scan_result.get("ports", [])
        vendor = scan_result.get("vendor", "")
        
        # Network infrastructure
        if any(service in services for service in ["ssh", "telnet", "snmp"]):
            if any(port["port"] in [161, 162] for port in ports):  # SNMP
                return "network_device"
            return "server"
        
        # Web servers
        if any(service in services for service in ["http", "https", "apache", "nginx"]):
            return "web_server"
        
        # Database servers
        if any(service in services for service in ["mysql", "postgresql", "mssql", "oracle"]):
            return "database_server"
        
        # Printers
        if any(service in services for service in ["ipp", "lpd", "printer"]):
            return "printer"
        
        # IoT devices
        if vendor and any(brand in vendor.lower() for brand in ["cisco", "netgear", "linksys", "tp-link"]):
            return "network_device"
        
        # Default
        if scan_result.get("ports"):
            return "unknown_device"
        else:
            return "host"

    def _categorize_scan_result(self, scan_result: Dict[str, Any]) -> Dict[str, Any]:
        """Categorize scan results to help users understand what was found."""
        result_type = "unknown"
        confidence = "low"
        indicators = []

        # If scan failed
        if scan_result.get("status") == "failed" or "error" in scan_result:
            result_type = "failed"
            confidence = "none"
            indicators.append("Scan failed")
            return {
                "result_type": result_type,
                "confidence": confidence,
                "indicators": indicators,
                "is_device": False
            }

        # Check if host is up
        if "Host is up" not in scan_result.get("raw_output", ""):
            result_type = "no_response"
            confidence = "none"
            indicators.append("No response")
            return {
                "result_type": result_type,
                "confidence": confidence,
                "indicators": indicators,
                "is_device": False
            }

        # Analyze indicators to determine device type and confidence
        if scan_result.get("ports") and len(scan_result["ports"]) > 0:
            indicators.append(f"{len(scan_result['ports'])} open ports")
            confidence = "high"
            result_type = "active_device"

        if scan_result.get("hostname") and scan_result["hostname"] != scan_result.get("ip"):
            indicators.append("DNS hostname")
            if confidence == "low":
                confidence = "medium"
            if result_type == "unknown":
                result_type = "named_device"

        if scan_result.get("addresses", {}).get("mac"):
            indicators.append("MAC address")
            confidence = "high"
            result_type = "physical_device"

        if scan_result.get("os_info", {}).get("os_name"):
            indicators.append("OS detected")
            confidence = "high"
            result_type = "active_device"

        if scan_result.get("vendor"):
            indicators.append("Vendor info")
            if confidence == "low":
                confidence = "medium"
            if result_type == "unknown":
                result_type = "identified_device"

        if scan_result.get("response_time") is not None:
            indicators.append("Response time")
            if result_type == "unknown":
                result_type = "responding_host"

        if scan_result.get("ttl") is not None:
            indicators.append("TTL info")
            if result_type == "unknown":
                result_type = "network_device"

        if scan_result.get("services") and len(scan_result["services"]) > 0:
            indicators.append(f"{len(scan_result['services'])} services")
            if confidence == "low":
                confidence = "medium"
            if result_type == "unknown":
                result_type = "service_device"

        # If no specific indicators, it's just a responding IP
        if result_type == "unknown" and len(indicators) == 0:
            result_type = "responding_ip"
            confidence = "low"
            indicators.append("Basic response")

        return {
            "result_type": result_type,
            "confidence": confidence,
            "indicators": indicators,
            "is_device": self._is_device_discovered(scan_result)
        }

    def _is_device_discovered(self, scan_result: Dict[str, Any]) -> bool:
        """Determine if a device was actually discovered."""
        # Device is considered discovered if:
        # 1. Has open ports
        # 2. Has MAC address
        # 3. Has hostname (different from IP)
        # 4. Has OS information
        
        has_ports = scan_result.get("ports") and len(scan_result["ports"]) > 0
        has_mac = scan_result.get("addresses", {}).get("mac")
        has_hostname = scan_result.get("hostname") and scan_result["hostname"] != scan_result.get("ip")
        has_os = scan_result.get("os_info", {}).get("os_name")
        
        return has_ports or has_mac or has_hostname or has_os

    def delete_scan(self, scan_id: int) -> bool:
        """Delete a scan record."""
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if scan:
            self.db.delete(scan)
            self.db.commit()
            return True
        return False

    def get_scan_history(self, asset_id: int, limit: int = 10) -> List[Scan]:
        """Get scan history for an asset."""
        return self.db.query(Scan).filter(
            Scan.asset_id == asset_id
        ).order_by(desc(Scan.timestamp)).limit(limit).all()
    
    def get_scan_statistics(self) -> Dict[str, Any]:
        """Get scan task statistics."""
        total_tasks = self.db.query(ScanTask).count()
        running_tasks = self.db.query(ScanTask).filter(ScanTask.status == "running").count()
        completed_tasks = self.db.query(ScanTask).filter(ScanTask.status == "completed").count()
        failed_tasks = self.db.query(ScanTask).filter(ScanTask.status == "failed").count()
        cancelled_tasks = self.db.query(ScanTask).filter(ScanTask.status == "cancelled").count()
        
        return {
            "total_tasks": total_tasks,
            "running_tasks": running_tasks,
            "completed_tasks": completed_tasks,
            "failed_tasks": failed_tasks,
            "cancelled_tasks": cancelled_tasks
        }
    
    def update_scan_task(self, task_id: int, task_data: ScanTaskUpdate) -> Optional[ScanTask]:
        """Update a scan task."""
        task = self.get_scan_task(task_id)
        if not task:
            return None
        
        # Only allow updates if task is not running
        if task.status == "running":
            raise ValueError("Cannot update a running scan task")
        
        update_data = task_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(task, key):
                setattr(task, key, value)
        
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def get_scan_results(self, task_id: int) -> Dict[str, Any]:
        """Get scan results for a specific task."""
        task = self.get_scan_task(task_id)
        if not task:
            raise ValueError(f"Scan task {task_id} not found")
        
        scans = self.db.query(Scan).filter(Scan.scan_task_id == task_id).all()
        
        return {
            "task": task,
            "scans": scans,
            "total_scans": len(scans),
            "completed_scans": len([s for s in scans if s.status == "completed"]),
            "failed_scans": len([s for s in scans if s.status == "failed"])
        }
    
    def download_scan_results(self, task_id: int) -> Dict[str, Any]:
        """Download scan results for a specific task."""
        task = self.get_scan_task(task_id)
        if not task:
            raise ValueError(f"Scan task {task_id} not found")
        
        scans = self.db.query(Scan).filter(Scan.scan_task_id == task_id).all()
        
        # Format results for download
        results = {
            "task_id": task_id,
            "task_name": task.name,
            "target": task.target,
            "status": task.status,
            "start_time": task.start_time.isoformat() if task.start_time else None,
            "end_time": task.end_time.isoformat() if task.end_time else None,
            "scans": []
        }
        
        for scan in scans:
            scan_data = {
                "scan_id": scan.id,
                "asset_id": scan.asset_id,
                "ip_address": scan.ip_address,
                "status": scan.status,
                "timestamp": scan.timestamp.isoformat() if scan.timestamp else None,
                "results": scan.results
            }
            results["scans"].append(scan_data)
        
        return results