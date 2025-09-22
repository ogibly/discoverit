from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import nmap
from datetime import datetime
import json
from typing import List, Dict, Optional
import socket
import re

app = FastAPI()

class ScanRequest(BaseModel):
    target: str
    scan_type: str
    discovery_depth: int = 1
    timeout: int = 30

@app.get("/health")
def health_check():
    """
    Health check endpoint for the scanner service.
    """
    try:
        # Test if nmap is available
        nm = nmap.PortScanner()
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "service": "scanner",
            "version": "1.0.0",
            "nmap_available": True
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

@app.post("/scan")
def unified_scan(request: ScanRequest):
    """
    Unified scan endpoint that handles all scan types with enhanced data collection.
    """
    nm = nmap.PortScanner()
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    try:
        # Build scan arguments based on type and depth
        if request.scan_type == "quick":
            arguments = "-sn -PE -PS21,22,23,25,53,80,110,443,993,995 -PA21,22,23,25,53,80,110,443,993,995"
        elif request.scan_type == "comprehensive":
            arguments = "-sS -O -sV -A --script default,safe"
        elif request.scan_type == "lan_discovery":
            if request.discovery_depth == 1:
                arguments = "-sn -PR"  # ARP only
            elif request.discovery_depth == 2:
                arguments = "-sn -PE -PS21,22,23,25,53,80,110,443,993,995 -PR"
            else:  # depth >= 3
                arguments = "-sS -O -sV -A --script default,safe"
        elif request.scan_type == "arp":
            arguments = "-sn -PR"
        elif request.scan_type == "snmp":
            arguments = "-sU -p 161 --script snmp-info,snmp-brute"
        else:
            arguments = "-sn -PE -PS21,22,23,25,53,80,110,443,993,995"
        
        # Add timing and timeout
        arguments += f" -T4 --host-timeout {request.timeout}s"
        
        # Run the scan
        nm.scan(request.target, arguments=arguments)
        
        if request.target not in nm.all_hosts():
            return {
                "ip": request.target,
                "status": "failed",
                "error": "Host is down or unreachable",
                "timestamp": timestamp,
                "scan_type": request.scan_type
            }
        
        host_data = nm[request.target]
        
        # Extract comprehensive information
        result = {
            "ip": request.target,
            "status": "completed",
            "timestamp": timestamp,
            "scan_type": request.scan_type,
            "discovery_depth": request.discovery_depth,
            "raw_output": nm.csv(),
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
            "device_info": {},
            "response_time": None,
            "ttl": None,
            "network_info": {}
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
        
        # Extract response time and TTL from raw output
        raw_output = nm.csv()
        response_time_match = re.search(r'(\d+\.\d+)s latency', raw_output)
        if response_time_match:
            result["response_time"] = float(response_time_match.group(1))
        
        ttl_match = re.search(r'TTL=(\d+)', raw_output)
        if ttl_match:
            result["ttl"] = int(ttl_match.group(1))
        
        # Determine device type
        result["device_type"] = _determine_device_type(result)
        
        return result
        
    except Exception as e:
        return {
            "ip": request.target,
            "status": "failed",
            "error": str(e),
            "timestamp": timestamp,
            "scan_type": request.scan_type
        }

def _determine_device_type(scan_result: Dict) -> str:
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

@app.post("/scan/quick")
def quick_scan(ip: str):
    """
    Runs a quick scan on the top ports.
    """
    nm = nmap.PortScanner()
    try:
        # Fast scan: common ports, aggressive timing, no ping
        nm.scan(ip, arguments="-sT -T4 -Pn -F")
        ports = []
        if ip in nm.all_hosts() and nm[ip].all_protocols():
            for proto in nm[ip].all_protocols():
                for port in nm[ip][proto].keys():
                    ports.append({
                        "port": port,
                        "proto": proto,
                        "state": nm[ip][proto][port]["state"],
                        "service": nm[ip][proto][port].get("name", "")
                    })
        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "ports": ports,
            "scan_type": "quick"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scan/arp")
def arp_scan_endpoint(target: str):
    """
    Discovers hosts in a subnet using an ARP scan.
    """
    nm = nmap.PortScanner()
    try:
        # ARP scan
        nm.scan(hosts=target, arguments="-PR -sn -T4")
        hosts: List[dict] = []
        for host in nm.all_hosts():
            addresses = nm[host].get('addresses', {})
            mac = addresses.get('mac')
            vendor = None
            if mac:
                vendor = nm[host].get('vendor', {}).get(mac)
            hosts.append({
                "ip": host,
                "mac": mac,
                "vendor": vendor
            })
        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "hosts": hosts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scan/discover")
def discover_subnet_endpoint(target: str):
    """
    Discovers hosts in a subnet using a fast ping scan.
    """
    nm = nmap.PortScanner()
    try:
        nm.scan(hosts=target, arguments="-sn -T4")
        hosts = []
        for host in nm.all_hosts():
            if nm[host].state() == 'up':
                addresses = nm[host].get('addresses', {})
                mac = addresses.get('mac')
                vendor = None
                if mac:
                    vendor = nm[host].get('vendor', {}).get(mac)
                hosts.append({
                    "ip": host,
                    "mac": mac,
                    "vendor": vendor
                })
        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "hosts": hosts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scan/comprehensive")
def comprehensive_scan_endpoint(ip: str):
    """
    Runs a comprehensive, aggressive scan to gather maximum information.
    This uses the -A flag to enable OS detection, version detection,
    script scanning, and traceroute. Requires root privileges.
    """
    nm = nmap.PortScanner()
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    try:
        # Aggressive scan with OS, version, script, traceroute, and additional scripts for device info
        nm.scan(ip, arguments="-A -T4 -sU -p 161 --script default,discovery,vuln")
        
        if ip not in nm.all_hosts():
            raise HTTPException(status_code=404, detail="Host not responding.")

        host_data = nm[ip]
        
        # Extract Hostname and DNS info
        hostname = host_data.hostname() if host_data.hostname() else None
        dns_info = socket.gethostbyaddr(ip) if hostname else {}

        # Extract OS Information
        os_info = {}
        if 'osmatch' in host_data and host_data['osmatch']:
            best_match = host_data['osmatch'][0]
            os_info = {
                "os_name": best_match.get('name', 'Unknown'),
                "os_accuracy": best_match.get('accuracy', 0),
                "os_family": best_match.get('osclass', [{}])[0].get('osfamily', 'Unknown') if best_match.get('osclass') else 'Unknown',
                "os_version": best_match.get('osclass', [{}])[0].get('version', 'Unknown') if best_match.get('osclass') else 'Unknown'
            }

        # Extract Device Info
        vendor_data = host_data.get('vendor', {})
        mac_address = host_data['addresses'].get('mac')
        device_info = {
            "manufacturer": vendor_data.get(mac_address, 'Unknown') if mac_address else 'Unknown',
            "model": "Unknown",  # Nmap doesn't reliably provide model/serial
            "serial_number": "Unknown"
        }

        # Extract IP and MAC addresses
        addresses = {
            "ipv4": host_data['addresses'].get('ipv4'),
            "ipv6": host_data['addresses'].get('ipv6'),
            "mac": mac_address
        }

        # Extract Services and Ports
        services = []
        open_ports = {"tcp": [], "udp": []}
        if host_data.all_protocols():
            for proto in host_data.all_protocols():
                if proto not in open_ports: continue
                for port in host_data[proto].keys():
                    port_info = host_data[proto][port]
                    if port_info.get("state") == "open":
                        open_ports[proto].append(port)
                        services.append({
                            "port": port,
                            "proto": proto,
                            "state": port_info.get("state", ""),
                            "service": port_info.get("name", ""),
                            "version": port_info.get("version", ""),
                            "product": port_info.get("product", ""),
                            "extrainfo": port_info.get("extrainfo", ""),
                            "cpe": port_info.get("cpe", "")
                        })

        # Extract Script Results for more details
        script_results = host_data.get('script', {})

        # Combine all information
        result = {
            "timestamp": timestamp,
            "ip": ip,
            "hostname": hostname,
            "dns_info": dns_info,
            "os_info": os_info,
            "device_info": device_info,
            "addresses": addresses,
            "open_ports": open_ports,
            "services": services,
            "script_results": script_results,
            "scan_type": "comprehensive"
        }
        
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scan/snmp")
def snmp_scan_endpoint(ip: str):
    """
    Performs SNMP scan to gather device information.
    """
    nm = nmap.PortScanner()
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    try:
        # SNMP scan with common community strings
        nm.scan(ip, arguments="-sU -p 161 --script snmp-info,snmp-sysdescr,snmp-interfaces")
        
        if ip not in nm.all_hosts():
            raise HTTPException(status_code=404, detail="Host not responding to SNMP.")

        host_data = nm[ip]
        snmp_info = {}
        
        # Extract SNMP information from script results
        if 'script' in host_data:
            script_results = host_data['script']
            
            # Parse SNMP system description
            if 'snmp-sysdescr' in script_results:
                sysdescr = script_results['snmp-sysdescr']
                snmp_info['system_description'] = sysdescr
            
            # Parse SNMP system info
            if 'snmp-info' in script_results:
                info = script_results['snmp-info']
                snmp_info['system_info'] = info
            
            # Parse SNMP interfaces
            if 'snmp-interfaces' in script_results:
                interfaces = script_results['snmp-interfaces']
                snmp_info['interfaces'] = interfaces

        result = {
            "timestamp": timestamp,
            "ip": ip,
            "scan_type": "snmp",
            "snmp_info": snmp_info,
            "script_results": host_data.get('script', {})
        }
        
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scan/arp-table")
def arp_table_scan_endpoint():
    """
    Scans the local ARP table to discover devices on the network.
    """
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    try:
        import subprocess
        import re
        
        # Get ARP table
        result = subprocess.run(['arp', '-a'], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail="Failed to read ARP table")
        
        devices = []
        arp_lines = result.stdout.strip().split('\n')
        
        for line in arp_lines:
            # Parse ARP table entries
            # Format: hostname (ip) at mac [ether] on interface
            match = re.search(r'\((\d+\.\d+\.\d+\.\d+)\) at ([0-9a-fA-F:]{17})', line)
            if match:
                ip = match.group(1)
                mac = match.group(2)
                
                # Extract hostname if available
                hostname_match = re.search(r'^([^(]+)', line)
                hostname = hostname_match.group(1).strip() if hostname_match else None
                
                devices.append({
                    "ip": ip,
                    "mac": mac,
                    "hostname": hostname
                })
        
        return {
            "timestamp": timestamp,
            "scan_type": "arp_table",
            "devices": devices,
            "total_devices": len(devices)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))