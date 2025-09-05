import nmap
from datetime import datetime
import json
from typing import List, Dict
import subprocess
import socket
import re

def run_scan(ip: str):
    nm = nmap.PortScanner()
    try:
        # Very fast scan: common ports only, aggressive timing, short timeout
        nm.scan(ip, arguments="-sT -T5 -Pn -F --max-retries 1 --host-timeout 15s")
        ports = []
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
            "ports": ports
        }
    except Exception as e:
        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "ports": [],
            "error": str(e)
        }


def discover_subnet(target: str):
    """
    Discover hosts in a subnet (CIDR) or IP range.
    Supports formats like:
    - 192.168.1.0/24 (CIDR)
    - 192.168.1.1-192.168.1.50 (IP range)
    - 10.0.0.1-10.0.0.100 (IP range)
    """
    nm = nmap.PortScanner()
    try:
        # Very fast ping scan with short timeout
        nm.scan(hosts=target, arguments="-sn -T5 --max-retries 1 --host-timeout 5s")
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
        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "hosts": [],
            "error": str(e)
        }


def get_hostname(ip: str) -> str:
    """Get hostname for IP address"""
    try:
        hostname = socket.gethostbyaddr(ip)[0]
        return hostname
    except:
        return None


def get_os_fingerprint(ip: str) -> Dict:
    """Get OS fingerprint using nmap OS detection"""
    nm = nmap.PortScanner()
    try:
        # OS detection scan
        nm.scan(ip, arguments="-O -T4 --max-retries 1 --host-timeout 10s")
        if ip in nm.all_hosts():
            host = nm[ip]
            os_info = {
                "os_name": host.get('osmatch', [{}])[0].get('name', 'Unknown') if host.get('osmatch') else 'Unknown',
                "os_accuracy": host.get('osmatch', [{}])[0].get('accuracy', 0) if host.get('osmatch') else 0,
                "os_family": host.get('osmatch', [{}])[0].get('osclass', [{}])[0].get('osfamily', 'Unknown') if host.get('osmatch') and host.get('osmatch')[0].get('osclass') else 'Unknown'
            }
            return os_info
    except:
        pass
    return {"os_name": "Unknown", "os_accuracy": 0, "os_family": "Unknown"}


def get_service_detection(ip: str) -> List[Dict]:
    """Get detailed service information"""
    nm = nmap.PortScanner()
    try:
        # Service version detection
        nm.scan(ip, arguments="-sV -T4 --max-retries 1 --host-timeout 15s")
        services = []
        for proto in nm[ip].all_protocols():
            for port in nm[ip][proto].keys():
                port_info = nm[ip][proto][port]
                service = {
                    "port": port,
                    "proto": proto,
                    "state": port_info["state"],
                    "service": port_info.get("name", ""),
                    "version": port_info.get("version", ""),
                    "product": port_info.get("product", ""),
                    "extrainfo": port_info.get("extrainfo", ""),
                    "cpe": port_info.get("cpe", "")
                }
                services.append(service)
        return services
    except:
        return []


def get_script_scan(ip: str) -> Dict:
    """Run nmap scripts for additional information"""
    nm = nmap.PortScanner()
    try:
        # Run common information gathering scripts
        nm.scan(ip, arguments="--script=default,safe -T4 --max-retries 1 --host-timeout 20s")
        script_results = {}
        if ip in nm.all_hosts():
            host = nm[ip]
            for script in host.get('script', {}):
                script_results[script] = host['script'][script]
        return script_results
    except:
        return {}


def comprehensive_scan(ip: str) -> Dict:
    """Comprehensive device fingerprinting and information gathering"""
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    # Basic port scan
    basic_ports = run_scan(ip)
    
    # Get hostname
    hostname = get_hostname(ip)
    
    # OS fingerprinting
    os_info = get_os_fingerprint(ip)
    
    # Service detection
    services = get_service_detection(ip)
    
    # Script scan results
    script_results = get_script_scan(ip)
    
    # Combine all information
    result = {
        "timestamp": timestamp,
        "ip": ip,
        "hostname": hostname,
        "os_info": os_info,
        "ports": basic_ports.get("ports", []),
        "services": services,
        "script_results": script_results,
        "scan_type": "comprehensive"
    }
    
    return result