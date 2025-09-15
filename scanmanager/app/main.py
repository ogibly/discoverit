from fastapi import FastAPI, HTTPException
import requests
from pydantic import BaseModel
from typing import Optional, List
import ipaddress

app = FastAPI()

class ScanRequest(BaseModel):
    ip: str
    scan_type: str
    subnet: Optional[str] = None

class ScannerConfig(BaseModel):
    name: str
    url: str
    subnets: str

scanners: List[ScannerConfig] = []

@app.on_event("startup")
async def startup_event():
    # In a real-world scenario, this would fetch from a database or a configuration service.
    # For now, we'll use a fixed list, but the backend will provide the actual list.
    pass

def get_scanner_for_ip(ip: str) -> Optional[ScannerConfig]:
    for scanner in scanners:
        for subnet_str in scanner.subnets.split(','):
            try:
                if ipaddress.ip_address(ip) in ipaddress.ip_network(subnet_str.strip()):
                    return scanner
            except ValueError:
                continue
    return None

@app.post("/scan")
async def manage_scan(scan_request: ScanRequest):
    global scanners
    # Fetch the latest scanner configuration from the backend
    try:
        response = requests.get("http://backend:8000/settings")
        response.raise_for_status()
        scanners = [ScannerConfig(**s) for s in response.json().get("scanners", [])]
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"ScanManager failed to fetch settings: {e}")

    scanner = get_scanner_for_ip(scan_request.ip)
    if not scanner:
        if scanners:
            scanner = scanners[0] # Default to the first scanner if no specific match is found
        else:
            raise HTTPException(status_code=404, detail="No scanners configured")

    try:
        if scan_request.scan_type == "quick":
            response = requests.post(f"{scanner.url}/scan/quick", params={"ip": scan_request.ip})
        elif scan_request.scan_type == "comprehensive":
            response = requests.post(f"{scanner.url}/scan/comprehensive", params={"ip": scan_request.ip})
        else:
            raise HTTPException(status_code=400, detail="Invalid scan type")

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"ScanManager failed to reach scanner at {scanner.url}: {e}")
