"""
DiscoverIT Scanner Service - Windows Service Implementation
"""
import os
import sys
import json
import time
import logging
import threading
import requests
from datetime import datetime
from typing import Dict, Any, Optional
import win32serviceutil
import win32service
import win32event
import servicemanager
import socket
import nmap
import psutil
import ipaddress
from fastapi import FastAPI
import uvicorn
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'scanner.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ScannerConfig:
    """Configuration management for the scanner service."""
    
    def __init__(self, config_path: str = None):
        self.config_path = config_path or os.path.join(os.path.dirname(__file__), 'config.json')
        self.config = self.load_config()
        self.last_network_check = 0
        self.network_check_interval = 300  # Check every 5 minutes
        # Always enable auto-detection for dynamic networks
        self.config['auto_detect_networks'] = True
        self.config['dynamic_network_monitoring'] = True
        # Initial network detection
        self.config['subnets'] = self.detect_network_subnets()
        self.save_config()
    
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from file."""
        default_config = {
            "scanner_id": None,
            "scanner_name": f"Scanner-{socket.gethostname()}",
            "main_instance_url": "http://localhost:8000",
            "api_key": None,
            "port": 8001,
            "subnets": [],
            "max_concurrent_scans": 3,
            "timeout_seconds": 300,
            "heartbeat_interval": 30,
            "auto_register": True,
            "log_level": "INFO"
        }
        
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    loaded_config = json.load(f)
                    default_config.update(loaded_config)
        except Exception as e:
            logger.warning(f"Failed to load config: {e}, using defaults")
        
        return default_config
    
    def save_config(self):
        """Save configuration to file."""
        try:
            with open(self.config_path, 'w') as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save config: {e}")
    
    def get(self, key: str, default=None):
        """Get configuration value."""
        return self.config.get(key, default)
    
    def set(self, key: str, value: Any):
        """Set configuration value."""
        self.config[key] = value
        self.save_config()
    
    def detect_network_subnets(self) -> list:
        """Auto-detect network subnets from available network interfaces."""
        subnets = []
        try:
            # Get network interfaces
            interfaces = psutil.net_if_addrs()
            
            for interface_name, addresses in interfaces.items():
                # Skip loopback and virtual interfaces
                if interface_name.lower() in ['lo', 'loopback', 'vmware', 'virtualbox', 'hyper-v']:
                    continue
                
                for addr in addresses:
                    # Only process IPv4 addresses
                    if addr.family == socket.AF_INET and addr.address != '127.0.0.1':
                        try:
                            # Get the network interface info
                            interface_stats = psutil.net_if_stats().get(interface_name)
                            if interface_stats and interface_stats.isup:
                                # Calculate subnet from IP and netmask
                                ip = ipaddress.IPv4Address(addr.address)
                                netmask = addr.netmask
                                
                                if netmask:
                                    # Create network from IP and netmask
                                    network = ipaddress.IPv4Network(f"{addr.address}/{netmask}", strict=False)
                                    
                                    # Only include private networks and common corporate ranges
                                    if (network.is_private or 
                                        network.network_address in [ipaddress.IPv4Address('10.0.0.0'), 
                                                                   ipaddress.IPv4Address('172.16.0.0'),
                                                                   ipaddress.IPv4Address('192.168.0.0')]):
                                        
                                        subnet_str = str(network)
                                        if subnet_str not in subnets:
                                            subnets.append(subnet_str)
                                            logger.info(f"Detected network interface: {interface_name} -> {subnet_str}")
                                            
                        except Exception as e:
                            logger.warning(f"Failed to process interface {interface_name}: {e}")
                            continue
            
            # If no subnets detected, add common defaults
            if not subnets:
                logger.warning("No network interfaces detected, using default subnets")
                subnets = ["192.168.1.0/24", "10.0.0.0/8"]
            
            logger.info(f"Auto-detected {len(subnets)} network subnets: {subnets}")
            return subnets
            
        except Exception as e:
            logger.error(f"Failed to detect network interfaces: {e}")
            # Return common default subnets as fallback
            return ["192.168.1.0/24", "10.0.0.0/8"]
    
    def check_network_changes(self) -> bool:
        """Check if network interfaces have changed and update if necessary."""
        current_time = time.time()
        
        # Only check periodically to avoid excessive CPU usage
        if current_time - self.last_network_check < self.network_check_interval:
            return False
        
        self.last_network_check = current_time
        
        try:
            # Get current network subnets
            current_subnets = self.detect_network_subnets()
            existing_subnets = self.config.get('subnets', [])
            
            # Check if networks have changed
            if set(current_subnets) != set(existing_subnets):
                logger.info(f"Network changes detected:")
                logger.info(f"  Previous: {existing_subnets}")
                logger.info(f"  Current:  {current_subnets}")
                
                # Update configuration
                self.config['subnets'] = current_subnets
                self.config['last_network_update'] = datetime.utcnow().isoformat()
                self.save_config()
                
                return True
                
        except Exception as e:
            logger.error(f"Failed to check network changes: {e}")
        
        return False
    
    def get_network_info(self) -> Dict[str, Any]:
        """Get comprehensive network information for the scanner."""
        try:
            interfaces = psutil.net_if_addrs()
            interface_stats = psutil.net_if_stats()
            
            network_info = {
                "subnets": self.config.get('subnets', []),
                "interfaces": [],
                "last_updated": self.config.get('last_network_update', datetime.utcnow().isoformat()),
                "total_interfaces": len(interfaces)
            }
            
            for interface_name, addresses in interfaces.items():
                # Skip loopback and virtual interfaces
                if interface_name.lower() in ['lo', 'loopback', 'vmware', 'virtualbox', 'hyper-v']:
                    continue
                
                interface_data = {
                    "name": interface_name,
                    "addresses": [],
                    "is_up": False,
                    "speed": 0
                }
                
                # Get interface statistics
                stats = interface_stats.get(interface_name)
                if stats:
                    interface_data["is_up"] = stats.isup
                    interface_data["speed"] = stats.speed
                
                # Get addresses
                for addr in addresses:
                    if addr.family == socket.AF_INET and addr.address != '127.0.0.1':
                        interface_data["addresses"].append({
                            "ip": addr.address,
                            "netmask": addr.netmask,
                            "broadcast": addr.broadcast
                        })
                
                if interface_data["addresses"]:  # Only include interfaces with IP addresses
                    network_info["interfaces"].append(interface_data)
            
            return network_info
            
        except Exception as e:
            logger.error(f"Failed to get network info: {e}")
            return {
                "subnets": self.config.get('subnets', []),
                "interfaces": [],
                "last_updated": datetime.utcnow().isoformat(),
                "error": str(e)
            }

class ScannerAPI:
    """FastAPI application for the scanner service."""
    
    def __init__(self, config: ScannerConfig):
        self.config = config
        self.app = FastAPI(title="DiscoverIT Scanner", version="1.0.0")
        self.nm = nmap.PortScanner()
        self.network_monitor_thread = None
        self.setup_routes()
        self.start_network_monitoring()
    
    def start_network_monitoring(self):
        """Start background thread for network monitoring."""
        if self.config.get('dynamic_network_monitoring', True):
            self.network_monitor_thread = threading.Thread(
                target=self._network_monitor_loop, 
                daemon=True,
                name="NetworkMonitor"
            )
            self.network_monitor_thread.start()
            logger.info("Started dynamic network monitoring")
    
    def _network_monitor_loop(self):
        """Background loop to monitor network changes."""
        while True:
            try:
                # Check for network changes
                if self.config.check_network_changes():
                    # Notify main instance of network changes
                    self._notify_network_changes()
                
                # Sleep for 30 seconds before next check
                time.sleep(30)
                
            except Exception as e:
                logger.error(f"Error in network monitoring loop: {e}")
                time.sleep(60)  # Wait longer on error
    
    def _notify_network_changes(self):
        """Notify the main DiscoverIT instance of network changes."""
        try:
            main_url = self.config.get('main_instance_url')
            api_key = self.config.get('api_key')
            scanner_id = self.config.get('scanner_id')
            
            if not all([main_url, api_key, scanner_id]):
                logger.warning("Cannot notify network changes: missing configuration")
                return
            
            # Get current network info
            network_info = self.config.get_network_info()
            
            # Send update to main instance
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            update_data = {
                'scanner_id': scanner_id,
                'network_info': network_info,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            response = requests.post(
                f"{main_url}/api/v2/scanners/{scanner_id}/network-update",
                json=update_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info("Successfully notified main instance of network changes")
            else:
                logger.warning(f"Failed to notify network changes: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Failed to notify network changes: {e}")
    
    def setup_routes(self):
        """Setup API routes."""
        
        @self.app.get("/health")
        async def health_check():
            """Health check endpoint."""
            try:
                nm = nmap.PortScanner()
                return {
                    "status": "healthy",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "service": "scanner",
                    "version": "1.0.0",
                    "scanner_id": self.config.get("scanner_id"),
                    "scanner_name": self.config.get("scanner_name"),
                    "nmap_available": True,
                    "hostname": socket.gethostname(),
                    "ip_address": self.get_local_ip()
                }
            except Exception as e:
                return {
                    "status": "unhealthy",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "service": "scanner",
                    "version": "1.0.0",
                    "error": str(e),
                    "nmap_available": False
                }
        
        @self.app.post("/scan")
        async def unified_scan(request: Dict[str, Any]):
            """Unified scan endpoint."""
            return await self.perform_scan(request)
        
        @self.app.get("/status")
        async def get_status():
            """Get scanner status."""
            return {
                "scanner_id": self.config.get("scanner_id"),
                "scanner_name": self.config.get("scanner_name"),
                "status": "running",
                "uptime": time.time() - self.start_time,
                "config": {
                    "subnets": self.config.get("subnets", []),
                    "max_concurrent_scans": self.config.get("max_concurrent_scans", 3),
                    "timeout_seconds": self.config.get("timeout_seconds", 300),
                    "dynamic_network_monitoring": self.config.get("dynamic_network_monitoring", True)
                }
            }
        
        @self.app.get("/network-info")
        async def get_network_info():
            """Get current network information."""
            return self.config.get_network_info()
        
        @self.app.post("/refresh-networks")
        async def refresh_networks():
            """Manually refresh network detection."""
            try:
                # Force network detection
                new_subnets = self.config.detect_network_subnets()
                old_subnets = self.config.get('subnets', [])
                
                self.config.set('subnets', new_subnets)
                self.config.set('last_network_update', datetime.utcnow().isoformat())
                
                # Notify main instance if networks changed
                if set(new_subnets) != set(old_subnets):
                    self._notify_network_changes()
                
                return {
                    "status": "success",
                    "previous_subnets": old_subnets,
                    "current_subnets": new_subnets,
                    "changed": set(new_subnets) != set(old_subnets),
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Failed to refresh networks: {e}")
                return {
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
        
        @self.app.get("/logs")
        async def get_logs(lines: int = 100):
            """Get recent log entries."""
            try:
                # For now, return a simple log structure
                # In a real implementation, you'd read from log files
                logs = [
                    f"{datetime.utcnow().isoformat()} - INFO - Scanner service running",
                    f"{datetime.utcnow().isoformat()} - INFO - Network monitoring active",
                    f"{datetime.utcnow().isoformat()} - INFO - Health check endpoint responding"
                ]
                
                return {
                    "status": "success",
                    "logs": logs[-lines:],  # Return last N lines
                    "total_lines": len(logs),
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Failed to get logs: {e}")
                return {
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
        
        @self.app.post("/configure")
        async def configure_scanner(config: Dict[str, Any]):
            """Update scanner configuration."""
            for key, value in config.items():
                self.config.set(key, value)
            return {"status": "success", "message": "Configuration updated"}
    
    async def perform_scan(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Perform network scan."""
        try:
            target = request.get("target")
            scan_type = request.get("scan_type", "quick")
            discovery_depth = request.get("discovery_depth", 1)
            timeout = request.get("timeout", 30)
            
            nm = nmap.PortScanner()
            timestamp = datetime.utcnow().isoformat() + "Z"
            
            # Build scan arguments
            if scan_type == "quick":
                arguments = "-sn -PE -PS21,22,23,25,53,80,110,443,993,995 -PA21,22,23,25,53,80,110,443,993,995"
            elif scan_type == "comprehensive":
                arguments = "-sS -O -sV -A --script default,safe"
            elif scan_type == "lan_discovery":
                if discovery_depth == 1:
                    arguments = "-sn -PR"
                elif discovery_depth == 2:
                    arguments = "-sn -PE -PS21,22,23,25,53,80,110,443,993,995 -PR"
                else:
                    arguments = "-sS -O -sV -A --script default,safe"
            else:
                arguments = "-sn -PE -PS21,22,23,25,53,80,110,443,993,995"
            
            arguments += f" -T4 --host-timeout {timeout}s"
            
            # Run scan
            nm.scan(target, arguments=arguments)
            
            if target not in nm.all_hosts():
                return {
                    "ip": target,
                    "status": "failed",
                    "error": "Host is down or unreachable",
                    "timestamp": timestamp,
                    "scan_type": scan_type,
                    "scanner_id": self.config.get("scanner_id")
                }
            
            host_data = nm[target]
            
            # Extract scan results
            result = {
                "ip": target,
                "status": "completed",
                "timestamp": timestamp,
                "scan_type": scan_type,
                "discovery_depth": discovery_depth,
                "scanner_id": self.config.get("scanner_id"),
                "scanner_name": self.config.get("scanner_name"),
                "hostname": host_data.hostname() if host_data.hostname() else None,
                "addresses": {
                    "ipv4": host_data['addresses'].get('ipv4'),
                    "ipv6": host_data['addresses'].get('ipv6'),
                    "mac": host_data['addresses'].get('mac')
                },
                "vendor": host_data.get('vendor', {}).get(host_data['addresses'].get('mac', '')) if host_data['addresses'].get('mac') else None,
                "ports": [],
                "services": [],
                "os_info": {},
                "device_info": {}
            }
            
            # Extract OS information
            if 'osmatch' in host_data and host_data['osmatch']:
                best_match = host_data['osmatch'][0]
                result["os_info"] = {
                    "os_name": best_match.get('name', 'Unknown'),
                    "os_accuracy": best_match.get('accuracy', 0),
                    "os_family": best_match.get('osclass', [{}])[0].get('osfamily', 'Unknown') if best_match.get('osclass') else 'Unknown',
                    "os_version": best_match.get('osclass', [{}])[0].get('version', 'Unknown') if best_match.get('osclass') else 'Unknown'
                }
            
            # Extract device information
            mac_address = host_data['addresses'].get('mac')
            if mac_address:
                result["device_info"] = {
                    "manufacturer": host_data.get('vendor', {}).get(mac_address, 'Unknown'),
                    "model": "Unknown",
                    "serial_number": "Unknown"
                }
            
            # Extract ports and services
            if host_data.all_protocols():
                for proto in host_data.all_protocols():
                    for port in host_data[proto].keys():
                        port_info = host_data[proto][port]
                        if port_info.get("state") == "open":
                            port_data = {
                                "port": port,
                                "protocol": proto,
                                "service": port_info.get("name", ""),
                                "state": port_info.get("state", ""),
                                "version": port_info.get("version", ""),
                                "product": port_info.get("product", ""),
                                "extrainfo": port_info.get("extrainfo", ""),
                                "cpe": port_info.get("cpe", "")
                            }
                            result["ports"].append(port_data)
                            if port_info.get("name"):
                                result["services"].append(port_info.get("name"))
            
            return result
            
        except Exception as e:
            return {
                "ip": request.get("target", "unknown"),
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "scan_type": request.get("scan_type", "unknown"),
                "scanner_id": self.config.get("scanner_id")
            }
    
    def get_local_ip(self) -> str:
        """Get local IP address."""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"

class DiscoverITScannerService(win32serviceutil.ServiceFramework):
    """Windows Service for DiscoverIT Scanner."""
    
    _svc_name_ = "DiscoverITScanner"
    _svc_display_name_ = "DiscoverIT Scanner Service"
    _svc_description_ = "Network scanner service for DiscoverIT platform"
    
    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        self.config = ScannerConfig()
        self.scanner_api = ScannerAPI(self.config)
        self.start_time = time.time()
        self.heartbeat_thread = None
        self.api_thread = None
        self.running = False
    
    def SvcStop(self):
        """Stop the service."""
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        self.running = False
        win32event.SetEvent(self.hWaitStop)
    
    def SvcDoRun(self):
        """Run the service."""
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        
        self.running = True
        
        # Start API server in separate thread
        self.api_thread = threading.Thread(target=self.run_api_server)
        self.api_thread.daemon = True
        self.api_thread.start()
        
        # Start heartbeat thread
        self.heartbeat_thread = threading.Thread(target=self.heartbeat_loop)
        self.heartbeat_thread.daemon = True
        self.heartbeat_thread.start()
        
        # Wait for stop signal
        win32event.WaitForSingleObject(self.hWaitStop, win32event.INFINITE)
    
    def run_api_server(self):
        """Run the FastAPI server."""
        try:
            port = self.config.get("port", 8001)
            uvicorn.run(
                self.scanner_api.app,
                host="0.0.0.0",
                port=port,
                log_level="info"
            )
        except Exception as e:
            logger.error(f"API server error: {e}")
    
    def heartbeat_loop(self):
        """Send heartbeat to main instance."""
        while self.running:
            try:
                self.send_heartbeat()
                time.sleep(self.config.get("heartbeat_interval", 30))
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
                time.sleep(60)  # Wait longer on error
    
    def send_heartbeat(self):
        """Send heartbeat to main DiscoverIT instance."""
        try:
            main_url = self.config.get("main_instance_url")
            api_key = self.config.get("api_key")
            
            if not main_url or not api_key:
                return
            
            # Get scanner status
            status = {
                "scanner_id": self.config.get("scanner_id"),
                "scanner_name": self.config.get("scanner_name"),
                "status": "running",
                "uptime": time.time() - self.start_time,
                "hostname": socket.gethostname(),
                "ip_address": self.scanner_api.get_local_ip(),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
            # Send heartbeat
            response = requests.post(
                f"{main_url}/api/v2/scanners/heartbeat",
                json=status,
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=10
            )
            
            if response.status_code == 200:
                logger.debug("Heartbeat sent successfully")
            else:
                logger.warning(f"Heartbeat failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Failed to send heartbeat: {e}")

if __name__ == '__main__':
    if len(sys.argv) == 1:
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(DiscoverITScannerService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        win32serviceutil.HandleCommandLine(DiscoverITScannerService)
