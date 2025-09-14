from fastapi import FastAPI, HTTPException
import requests
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class ScanRequest(BaseModel):
    ip: str
    scan_type: str
    subnet: Optional[str] = None

@app.post("/scan")
async def manage_scan(scan_request: ScanRequest):
    scanner_base_url = "http://scanner:8001"  # Scanner service is on the same Docker network

    try:
        if scan_request.scan_type == "quick":
            response = requests.post(f"{scanner_base_url}/scan/quick", params={"ip": scan_request.ip})
        elif scan_request.scan_type == "comprehensive":
            response = requests.post(f"{scanner_base_url}/scan/comprehensive", params={"ip": scan_request.ip})
        else:
            raise HTTPException(status_code=400, detail="Invalid scan type")

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"ScanManager failed to reach scanner: {e}")
