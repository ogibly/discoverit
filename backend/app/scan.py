import nmap
from datetime import datetime
import json

def run_scan(ip: str):
    nm = nmap.PortScanner()
    nm.scan(ip, arguments="-sS -T4 -Pn")
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
        "timestamp": datetime.utcnow(),
        "ports": ports
    }