"""
Enhanced discovery service with advanced data collection capabilities.
"""
import asyncio
import aiohttp
import json
import nmap
import socket
import subprocess
import platform
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime
from ..models import Asset, ScanTask
from ..schemas import AssetCreate
from .base_service import BaseService


class EnhancedDiscoveryService:
    def __init__(self, db: Session):
        self.db = db

    async def perform_enhanced_discovery(
        self,
        target: str,
        scan_type: str = "comprehensive",
        discovery_depth: int = 2,
        credentials: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """Perform enhanced discovery with advanced data collection."""
        
        discovery_results = {
            "devices": [],
            "network_topology": [],
            "metrics": [],
            "services": [],
            "vulnerabilities": [],
            "scan_metadata": {
                "target": target,
                "scan_type": scan_type,
                "discovery_depth": discovery_depth,
                "start_time": datetime.utcnow(),
                "end_time": None,
                "duration": 0
            }
        }

        try:
            # Phase 1: Network Discovery
            devices = await self._discover_network_devices(target, scan_type)
            discovery_results["devices"] = devices

            # Phase 2: Service Discovery
            if discovery_depth >= 2:
                for device in devices:
                    services = await self._discover_services(device, credentials)
                    discovery_results["services"].extend(services)

            # Phase 3: OS Fingerprinting
            if discovery_depth >= 3:
                for device in devices:
                    os_info = await self._perform_os_fingerprinting(device)
                    device.update(os_info)

            # Phase 4: Hardware Detection
            if discovery_depth >= 3:
                for device in devices:
                    hardware_info = await self._detect_hardware(device, credentials)
                    device.update(hardware_info)

            # Phase 5: Network Topology Mapping
            if discovery_depth >= 4:
                topology = await self._map_network_topology(devices)
                discovery_results["network_topology"] = topology

            # Phase 6: Vulnerability Scanning
            if discovery_depth >= 5:
                vulnerabilities = await self._scan_vulnerabilities(devices)
                discovery_results["vulnerabilities"] = vulnerabilities

            # Phase 7: Performance Metrics Collection
            metrics = await self._collect_performance_metrics(devices)
            discovery_results["metrics"] = metrics

        except Exception as e:
            discovery_results["error"] = str(e)
        finally:
            discovery_results["scan_metadata"]["end_time"] = datetime.utcnow()
            discovery_results["scan_metadata"]["duration"] = (
                discovery_results["scan_metadata"]["end_time"] - 
                discovery_results["scan_metadata"]["start_time"]
            ).total_seconds()

        return discovery_results

    async def _discover_network_devices(self, target: str, scan_type: str) -> List[Dict[str, Any]]:
        """Discover network devices using advanced scanning techniques."""
        devices = []
        
        # Use nmap for network discovery
        nm = nmap.PortScanner()
        
        # Get scan configuration from template
        from .template_service import TemplateService
        template_service = TemplateService(self.db)
        
        # Find template by name (since we removed scan_type)
        # For now, we'll use the first active template as a fallback
        templates = template_service.get_scan_templates(is_active=True)
        if not templates:
            raise ValueError("No active templates found")
        
        template = templates[0]  # Use first matching template
        scan_config = template.scan_config
        args = scan_config.get("arguments", "-sS -O -sV -A")
        
        try:
            # Perform the scan
            nm.scan(hosts=target, arguments=args)
            
            for host in nm.all_hosts():
                if nm[host].state() == "up":
                    device = {
                        "ip_address": host,
                        "hostname": nm[host].hostname() or "",
                        "state": nm[host].state(),
                        "mac_address": "",
                        "vendor": "",
                        "os_info": {},
                        "ports": [],
                        "services": [],
                        "device_type": "unknown",
                        "confidence": 0.0
                    }
                    
                    # Extract MAC address and vendor
                    if 'mac' in nm[host]['addresses']:
                        device["mac_address"] = nm[host]['addresses']['mac']
                    if 'vendor' in nm[host]:
                        device["vendor"] = nm[host]['vendor'].get(device["mac_address"], "")
                    
                    # Extract OS information
                    if 'osmatch' in nm[host]:
                        os_matches = nm[host]['osmatch']
                        if os_matches:
                            best_match = max(os_matches, key=lambda x: x['accuracy'])
                            device["os_info"] = {
                                "name": best_match['name'],
                                "accuracy": best_match['accuracy'],
                                "family": best_match.get('osclass', [{}])[0].get('osfamily', ''),
                                "version": best_match.get('osclass', [{}])[0].get('osgen', '')
                            }
                    
                    # Extract port information
                    for proto in nm[host].all_protocols():
                        ports = nm[host][proto].keys()
                        for port in ports:
                            port_info = nm[host][proto][port]
                            device["ports"].append({
                                "port": port,
                                "protocol": proto,
                                "state": port_info['state'],
                                "service": port_info.get('name', ''),
                                "version": port_info.get('version', ''),
                                "product": port_info.get('product', '')
                            })
                    
                    # Determine device type based on services and OS
                    device["device_type"] = self._determine_device_type(device)
                    device["confidence"] = self._calculate_confidence(device)
                    
                    devices.append(device)
                    
        except Exception as e:
            print(f"Error during network discovery: {e}")
        
        return devices

    async def _discover_services(self, device: Dict[str, Any], credentials: Optional[List[int]]) -> List[Dict[str, Any]]:
        """Discover services running on a device."""
        services = []
        
        for port_info in device.get("ports", []):
            if port_info["state"] == "open":
                service = {
                    "device_ip": device["ip_address"],
                    "port": port_info["port"],
                    "protocol": port_info["protocol"],
                    "service_name": port_info["service"],
                    "version": port_info["version"],
                    "product": port_info["product"],
                    "banner": "",
                    "configuration": {},
                    "security_info": {}
                }
                
                # Try to get service banner
                try:
                    banner = await self._get_service_banner(
                        device["ip_address"], 
                        port_info["port"], 
                        port_info["protocol"]
                    )
                    service["banner"] = banner
                except:
                    pass
                
                # Try to get service configuration if credentials are available
                if credentials and port_info["service"] in ["ssh", "telnet", "snmp"]:
                    try:
                        config = await self._get_service_configuration(
                            device["ip_address"],
                            port_info["port"],
                            port_info["service"],
                            credentials
                        )
                        service["configuration"] = config
                    except:
                        pass
                
                # Analyze security information
                service["security_info"] = self._analyze_service_security(service)
                
                services.append(service)
        
        return services

    async def _perform_os_fingerprinting(self, device: Dict[str, Any]) -> Dict[str, Any]:
        """Perform advanced OS fingerprinting."""
        os_info = device.get("os_info", {})
        
        # Enhanced OS detection using multiple techniques
        try:
            # TCP/IP stack fingerprinting
            tcp_fingerprint = await self._tcp_stack_fingerprinting(device["ip_address"])
            os_info.update(tcp_fingerprint)
            
            # HTTP header analysis
            http_fingerprint = await self._http_header_fingerprinting(device["ip_address"])
            os_info.update(http_fingerprint)
            
            # SNMP system description
            snmp_info = await self._snmp_system_info(device["ip_address"])
            if snmp_info:
                os_info.update(snmp_info)
                
        except Exception as e:
            print(f"Error during OS fingerprinting for {device['ip_address']}: {e}")
        
        return {"os_info": os_info}

    async def _detect_hardware(self, device: Dict[str, Any], credentials: Optional[List[int]]) -> Dict[str, Any]:
        """Detect hardware information."""
        hardware_info = {
            "cpu_info": {},
            "memory_info": {},
            "storage_info": {},
            "network_interfaces": [],
            "system_info": {}
        }
        
        try:
            # Try SNMP for hardware information
            if credentials:
                snmp_hardware = await self._get_snmp_hardware_info(device["ip_address"], credentials)
                hardware_info.update(snmp_hardware)
            
            # Try SSH for detailed system information
            if device.get("os_info", {}).get("family") in ["Linux", "Unix"]:
                ssh_hardware = await self._get_ssh_hardware_info(device["ip_address"], credentials)
                hardware_info.update(ssh_hardware)
            
            # Try WMI for Windows systems
            elif device.get("os_info", {}).get("family") == "Windows":
                wmi_hardware = await self._get_wmi_hardware_info(device["ip_address"], credentials)
                hardware_info.update(wmi_hardware)
                
        except Exception as e:
            print(f"Error during hardware detection for {device['ip_address']}: {e}")
        
        return {"hardware_info": hardware_info}

    async def _map_network_topology(self, devices: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Map network topology and device relationships."""
        topology = []
        
        try:
            # Use traceroute to map network paths
            for device in devices:
                if device["ip_address"]:
                    path = await self._trace_network_path(device["ip_address"])
                    if path:
                        for i, hop in enumerate(path[:-1]):
                            topology.append({
                                "source_ip": hop,
                                "target_ip": path[i + 1],
                                "relationship_type": "connected_to",
                                "hop_number": i + 1,
                                "latency": hop.get("latency", 0)
                            })
            
            # Analyze ARP tables for local network topology
            arp_topology = await self._analyze_arp_tables(devices)
            topology.extend(arp_topology)
            
        except Exception as e:
            print(f"Error during topology mapping: {e}")
        
        return topology

    async def _scan_vulnerabilities(self, devices: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Perform vulnerability scanning on discovered devices."""
        vulnerabilities = []
        
        try:
            # Use nmap NSE scripts for vulnerability detection
            nm = nmap.PortScanner()
            
            for device in devices:
                if device["ip_address"]:
                    # Run vulnerability scripts
                    nm.scan(
                        hosts=device["ip_address"],
                        arguments="--script vuln,safe -T4"
                    )
                    
                    for host in nm.all_hosts():
                        if 'script' in nm[host]:
                            for script_name, script_output in nm[host]['script'].items():
                                if 'vuln' in script_name.lower() or 'cve' in script_output.lower():
                                    vulnerability = {
                                        "device_ip": device["ip_address"],
                                        "script_name": script_name,
                                        "output": script_output,
                                        "severity": self._determine_vulnerability_severity(script_output),
                                        "cve_ids": self._extract_cve_ids(script_output)
                                    }
                                    vulnerabilities.append(vulnerability)
                                    
        except Exception as e:
            print(f"Error during vulnerability scanning: {e}")
        
        return vulnerabilities

    async def _collect_performance_metrics(self, devices: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Collect performance metrics from devices."""
        metrics = []
        
        for device in devices:
            try:
                # Ping latency
                latency = await self._measure_latency(device["ip_address"])
                if latency:
                    metrics.append({
                        "device_ip": device["ip_address"],
                        "metric_type": "network",
                        "metric_name": "latency",
                        "value": latency,
                        "unit": "ms"
                    })
                
                # Port response times
                for port_info in device.get("ports", []):
                    if port_info["state"] == "open":
                        response_time = await self._measure_port_response_time(
                            device["ip_address"], 
                            port_info["port"]
                        )
                        if response_time:
                            metrics.append({
                                "device_ip": device["ip_address"],
                                "metric_type": "service",
                                "metric_name": f"port_{port_info['port']}_response_time",
                                "value": response_time,
                                "unit": "ms",
                                "metadata": {
                                    "port": port_info["port"],
                                    "service": port_info["service"]
                                }
                            })
                            
            except Exception as e:
                print(f"Error collecting metrics for {device['ip_address']}: {e}")
        
        return metrics

    def _determine_device_type(self, device: Dict[str, Any]) -> str:
        """Determine device type based on discovered information."""
        ports = device.get("ports", [])
        os_info = device.get("os_info", {})
        vendor = device.get("vendor", "").lower()
        
        # Check for specific device types based on ports and services
        if any(port["service"] in ["ssh", "telnet"] and port["port"] in [22, 23] for port in ports):
            if any(port["service"] in ["http", "https"] for port in ports):
                return "server"
            else:
                return "network_device"
        
        if any(port["service"] in ["snmp"] for port in ports):
            if "cisco" in vendor or "juniper" in vendor:
                return "router"
            elif "hp" in vendor or "dell" in vendor:
                return "switch"
        
        if any(port["service"] in ["http", "https"] for port in ports):
            if any(port["service"] in ["rdp", "smb"] for port in ports):
                return "workstation"
            else:
                return "server"
        
        if any(port["service"] in ["printer", "ipp"] for port in ports):
            return "printer"
        
        # Fallback to OS-based detection
        os_family = os_info.get("family", "").lower()
        if "windows" in os_family:
            return "workstation"
        elif "linux" in os_family or "unix" in os_family:
            return "server"
        
        return "unknown"

    def _calculate_confidence(self, device: Dict[str, Any]) -> float:
        """Calculate confidence score for device identification."""
        confidence = 0.0
        
        # Base confidence from OS detection
        os_accuracy = device.get("os_info", {}).get("accuracy", 0)
        confidence += os_accuracy * 0.3
        
        # Confidence from service detection
        services = [port["service"] for port in device.get("ports", []) if port["service"]]
        if services:
            confidence += min(len(services) * 0.1, 0.3)
        
        # Confidence from MAC vendor
        if device.get("vendor"):
            confidence += 0.2
        
        # Confidence from hostname
        if device.get("hostname"):
            confidence += 0.1
        
        # Confidence from device type determination
        if device.get("device_type") != "unknown":
            confidence += 0.1
        
        return min(confidence, 1.0)

    async def _get_service_banner(self, ip: str, port: int, protocol: str) -> str:
        """Get service banner from a port."""
        try:
            if protocol == "tcp":
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(5)
                sock.connect((ip, port))
                
                # Send common probes
                probes = [b"\r\n", b"GET / HTTP/1.0\r\n\r\n", b"HELP\r\n"]
                banner = ""
                
                for probe in probes:
                    try:
                        sock.send(probe)
                        response = sock.recv(1024)
                        if response:
                            banner += response.decode('utf-8', errors='ignore')
                            break
                    except:
                        continue
                
                sock.close()
                return banner.strip()
        except:
            pass
        
        return ""

    def _analyze_service_security(self, service: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze security aspects of a service."""
        security_info = {
            "encryption": False,
            "authentication_required": False,
            "known_vulnerabilities": [],
            "security_score": 0.0
        }
        
        service_name = service.get("service_name", "").lower()
        version = service.get("version", "").lower()
        banner = service.get("banner", "").lower()
        
        # Check for encryption
        if any(term in service_name for term in ["ssl", "tls", "https", "ssh"]):
            security_info["encryption"] = True
            security_info["security_score"] += 0.3
        
        # Check for authentication
        if any(term in banner for term in ["login", "password", "authentication"]):
            security_info["authentication_required"] = True
            security_info["security_score"] += 0.2
        
        # Check for known vulnerable versions
        vulnerable_versions = {
            "apache": ["2.2", "2.0"],
            "nginx": ["1.0", "1.1"],
            "openssh": ["6.0", "5.0"]
        }
        
        for product, versions in vulnerable_versions.items():
            if product in service_name and any(v in version for v in versions):
                security_info["known_vulnerabilities"].append(f"{product} {version}")
                security_info["security_score"] -= 0.3
        
        security_info["security_score"] = max(0.0, min(1.0, security_info["security_score"]))
        
        return security_info

    def _determine_vulnerability_severity(self, output: str) -> str:
        """Determine vulnerability severity from script output."""
        output_lower = output.lower()
        
        if any(term in output_lower for term in ["critical", "remote code execution", "buffer overflow"]):
            return "critical"
        elif any(term in output_lower for term in ["high", "privilege escalation", "sql injection"]):
            return "high"
        elif any(term in output_lower for term in ["medium", "information disclosure", "denial of service"]):
            return "medium"
        else:
            return "low"

    def _extract_cve_ids(self, output: str) -> List[str]:
        """Extract CVE IDs from vulnerability output."""
        import re
        cve_pattern = r'CVE-\d{4}-\d{4,7}'
        return re.findall(cve_pattern, output, re.IGNORECASE)

    async def _tcp_stack_fingerprinting(self, ip: str) -> Dict[str, Any]:
        """Perform TCP stack fingerprinting."""
        # This is a simplified implementation
        # In a real implementation, you would analyze TCP options, window sizes, etc.
        return {
            "tcp_options": [],
            "window_size": 0,
            "ttl": 0
        }

    async def _http_header_fingerprinting(self, ip: str) -> Dict[str, Any]:
        """Perform HTTP header fingerprinting."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"http://{ip}", timeout=5) as response:
                    headers = dict(response.headers)
                    return {
                        "server": headers.get("Server", ""),
                        "x_powered_by": headers.get("X-Powered-By", ""),
                        "http_version": f"HTTP/{response.version.major}.{response.version.minor}"
                    }
        except:
            return {}

    async def _snmp_system_info(self, ip: str) -> Dict[str, Any]:
        """Get system information via SNMP."""
        # This would require SNMP credentials and implementation
        return {}

    async def _get_snmp_hardware_info(self, ip: str, credentials: List[int]) -> Dict[str, Any]:
        """Get hardware information via SNMP."""
        # This would require SNMP credentials and implementation
        return {}

    async def _get_ssh_hardware_info(self, ip: str, credentials: List[int]) -> Dict[str, Any]:
        """Get hardware information via SSH."""
        # This would require SSH credentials and implementation
        return {}

    async def _get_wmi_hardware_info(self, ip: str, credentials: List[int]) -> Dict[str, Any]:
        """Get hardware information via WMI."""
        # This would require Windows credentials and implementation
        return {}

    async def _trace_network_path(self, target_ip: str) -> List[Dict[str, Any]]:
        """Trace network path to target."""
        # This would implement traceroute functionality
        return []

    async def _analyze_arp_tables(self, devices: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze ARP tables for network topology."""
        # This would analyze ARP tables to determine local network topology
        return []

    async def _measure_latency(self, ip: str) -> Optional[float]:
        """Measure network latency to a device."""
        try:
            import time
            start_time = time.time()
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            sock.connect((ip, 80))  # Try common port
            sock.close()
            return (time.time() - start_time) * 1000  # Convert to milliseconds
        except:
            return None

    async def _measure_port_response_time(self, ip: str, port: int) -> Optional[float]:
        """Measure response time for a specific port."""
        try:
            import time
            start_time = time.time()
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            sock.connect((ip, port))
            sock.close()
            return (time.time() - start_time) * 1000  # Convert to milliseconds
        except:
            return None

    async def _get_service_configuration(self, ip: str, port: int, service: str, credentials: List[int]) -> Dict[str, Any]:
        """Get service configuration using credentials."""
        # This would use provided credentials to get service configuration
        return {}

    async def create_assets_from_discovery(self, discovery_results: Dict[str, Any]) -> List[Asset]:
        """Create assets from discovery results."""
        assets = []
        
        for device in discovery_results.get("devices", []):
            try:
                asset_data = {
                    "name": device.get("hostname") or device["ip_address"],
                    "description": f"Discovered device - {device.get('device_type', 'unknown')}",
                    "primary_ip": device["ip_address"],
                    "mac_address": device.get("mac_address"),
                    "hostname": device.get("hostname"),
                    "os_name": device.get("os_info", {}).get("name"),
                    "os_family": device.get("os_info", {}).get("family"),
                    "os_version": device.get("os_info", {}).get("version"),
                    "manufacturer": device.get("vendor"),
                    "device_type": device.get("device_type"),
                    "is_managed": False,
                    "is_active": True,
                    "custom_fields": {
                        "discovery_confidence": device.get("confidence", 0.0),
                        "discovery_method": "enhanced_scan",
                        "ports_discovered": len(device.get("ports", [])),
                        "services_discovered": len([p for p in device.get("ports", []) if p.get("service")])
                    }
                }
                
                asset = Asset(**asset_data)
                self.db.add(asset)
                assets.append(asset)
                
            except Exception as e:
                print(f"Error creating asset for {device['ip_address']}: {e}")
        
        self.db.commit()
        return assets
