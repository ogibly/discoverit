from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models, scan
from datetime import datetime
import json
from typing import List, Optional
from pydantic import BaseModel
import socket
from fastapi import BackgroundTasks

SCAN_PROGRESS = {"status": "idle", "current_ip": None, "message": None, "scan_id": None}
CURRENT_SCAN_ID = None


class DeviceOut(BaseModel):
    id: int
    ip: str
    mac: Optional[str] = None
    vendor: Optional[str] = None
    last_seen: datetime

    class Config:
        orm_mode = True


class HistoryResponse(BaseModel):
    scan: Optional[dict]
    ports: List[dict]
    page: int
    total: int


class DeviceCreate(BaseModel):
    ip: str
    mac: Optional[str] = None
    vendor: Optional[str] = None

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/devices", response_model=List[DeviceOut])
def list_devices(db: Session = Depends(get_db)):
    return db.query(models.Device).all()

@router.post("/devices", response_model=DeviceOut)
def create_device(payload: DeviceCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Device).filter(models.Device.ip == payload.ip).first()
    if existing:
        return existing
    device = models.Device(
        ip=payload.ip,
        mac=payload.mac,
        vendor=payload.vendor,
        last_seen=datetime.utcnow(),
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device

@router.get("/devices/{device_id}/history", response_model=HistoryResponse)
def device_history(device_id: int, page: int = 1, limit: int = 1, db: Session = Depends(get_db)):
    scans = db.query(models.Scan).filter(models.Scan.device_id==device_id)\
        .order_by(models.Scan.timestamp.desc()).offset((page-1)*limit).limit(limit).all()
    total = db.query(models.Scan).filter(models.Scan.device_id==device_id).count()
    if not scans:
        return {"scan": None, "ports": [], "page": page, "total": total}
    scan_data = json.loads(scans[0].scan_data)
    return {"scan": scan_data, "ports": scan_data["ports"], "page": page, "total": total}


@router.get("/suggest_subnet")
def suggest_subnet():
    try:
        hostname = socket.gethostname()
        ip = socket.gethostbyname(hostname)
        # naive /24 suggestion
        parts = ip.split('.')
        if len(parts) == 4:
            return {"subnet": f"{parts[0]}.{parts[1]}.{parts[2]}.0/24"}
    except Exception:
        pass
    return {"subnet": None}

@router.get("/scan/progress")
def scan_progress():
    return SCAN_PROGRESS

@router.post("/scan/cancel")
def cancel_scan():
    global CURRENT_SCAN_ID
    if SCAN_PROGRESS["status"] != "idle":
        CURRENT_SCAN_ID = "cancelled"
        SCAN_PROGRESS.update({"status": "cancelled", "message": "Scan cancelled by user"})
        return {"message": "Scan cancellation requested"}
    return {"message": "No active scan to cancel"}


@router.post("/scan")
def trigger_scan(target: Optional[str] = None, db: Session = Depends(get_db)):
    global CURRENT_SCAN_ID
    import uuid
    scan_id = str(uuid.uuid4())
    CURRENT_SCAN_ID = scan_id
    
    if target:
        # Discover devices on subnet/range and upsert devices, then run comprehensive scan per device
        result = scan.discover_subnet(target)
        discovered = []
        hosts = result.get("hosts", [])
        SCAN_PROGRESS.update({"status": "discovering", "current_ip": None, "message": f"Discovering {target} - found {len(hosts)} hosts", "scan_id": scan_id})
        
        for i, h in enumerate(hosts):
            # Check for cancellation
            if CURRENT_SCAN_ID != scan_id:
                SCAN_PROGRESS.update({"status": "idle", "current_ip": None, "message": "Scan aborted", "scan_id": None})
                return {"message": "Scan aborted", "count": len(discovered), "aborted": True}
            
            ip = h.get("ip")
            if not ip:
                continue
            
            SCAN_PROGRESS.update({"current_ip": ip, "status": "upserting", "message": f"Processing {i+1}/{len(hosts)}: {ip}", "scan_id": scan_id})
            device = db.query(models.Device).filter(models.Device.ip == ip).first()
            now_ts = datetime.utcnow()
            if device:
                if h.get("mac"):
                    device.mac = h["mac"]
                if h.get("vendor"):
                    device.vendor = h["vendor"]
                device.last_seen = now_ts
            else:
                device = models.Device(ip=ip, mac=h.get("mac"), vendor=h.get("vendor"), last_seen=now_ts)
                db.add(device)
                db.flush()
            
            # comprehensive scan for this host
            SCAN_PROGRESS.update({"status": "scanning", "current_ip": ip, "message": f"Comprehensive scan {i+1}/{len(hosts)}: {ip}", "scan_id": scan_id})
            scan_result = scan.comprehensive_scan(ip)
            scan_result["scan_id"] = scan_id
            scan_result["aborted"] = CURRENT_SCAN_ID != scan_id
            db_scan = models.Scan(device_id=device.id, timestamp=now_ts, scan_data=json.dumps(scan_result))
            db.add(db_scan)
            discovered.append(ip)
        
        db.commit()
        SCAN_PROGRESS.update({"status": "idle", "current_ip": None, "message": None, "scan_id": None})
        return {"message": "Comprehensive scan completed", "count": len(discovered)}
    # Fallback: scan all known devices' ports
    devices = db.query(models.Device).all()
    for d in devices:
        SCAN_PROGRESS.update({"status": "scanning", "current_ip": d.ip, "message": f"Scanning {d.ip}"})
        result = scan.run_scan(d.ip)
        db_scan = models.Scan(device_id=d.id, timestamp=datetime.utcnow(), scan_data=json.dumps(result))
        db.add(db_scan)
    db.commit()
    SCAN_PROGRESS.update({"status": "idle", "current_ip": None, "message": None})
    return {"message": "Scan completed", "count": len(devices)}