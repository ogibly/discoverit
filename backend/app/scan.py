import nmap
from datetime import datetime
import json
from typing import List

def run_scan(ip: str):
    nm = nmap.PortScanner()
    try:
        # Fast scan: top 1000 ports, aggressive timing, no ping
        nm.scan(ip, arguments="-sT -T5 -Pn --top-ports 1000 --max-retries 1 --host-timeout 30s")
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


def discover_subnet(cidr: str):
    nm = nmap.PortScanner()
    try:
        # Fast ping scan with aggressive timing
        nm.scan(hosts=cidr, arguments="-sn -T5 --max-retries 1 --host-timeout 10s")
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