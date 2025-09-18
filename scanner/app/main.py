from fastapi import FastAPI, HTTPException
import nmap
from datetime import datetime
import json
from typing import List, Dict
import socket

app = FastAPI()

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