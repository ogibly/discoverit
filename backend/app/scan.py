import nmap
from datetime import datetime
import json
from typing import List, Dict
import socket

def run_scan(ip: str):
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
        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "ports": [],
            "error": str(e),
            "scan_type": "quick"
        }

def arp_scan(target: str):
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
        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "hosts": [],
            "error": str(e)
        }

def discover_subnet(target: str):
    """
    Discovers hosts in a subnet using a fast ping scan and ARP scan.
    """
    ping_results = nmap.PortScanner().scan(hosts=target, arguments="-sn -T4")
    arp_results = arp_scan(target)

    hosts_by_ip = {}

    for host in ping_results.get('scan', {}):
        if ping_results['scan'][host].get('status', {}).get('state') == 'up':
            addresses = ping_results['scan'][host].get('addresses', {})
            mac = addresses.get('mac')
            vendor = None
            if mac:
                vendor = ping_results['scan'][host].get('vendor', {}).get(mac)
            hosts_by_ip[host] = {
                "ip": host,
                "mac": mac,
                "vendor": vendor
            }

    for host in arp_results.get('hosts', []):
        if host['ip'] not in hosts_by_ip:
            hosts_by_ip[host['ip']] = host

    return {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "hosts": list(hosts_by_ip.values())
    }

def comprehensive_scan(ip: str) -> Dict:
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
            return {"timestamp": timestamp, "ip": ip, "error": "Host not responding.", "scan_type": "comprehensive"}

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
        return {
            "timestamp": timestamp,
            "ip": ip,
            "error": str(e),
            "scan_type": "comprehensive"
        }
