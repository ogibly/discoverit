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
from . import schemas
from datetime import datetime

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

class ScanTaskOut(BaseModel):
    id: int
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    target: str
    scan_type: str

    class Config:
        orm_mode = True


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

@router.delete("/devices/{device_id}", status_code=204)
def delete_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if device:
        db.delete(device)
        db.commit()
    return

@router.delete("/scans/{scan_id}", status_code=204)
def delete_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if scan:
        db.delete(scan)
        db.commit()
    return

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

def run_background_scan(task_id: int):
    """
    This function runs in the background.
    It creates its own database session.
    """
    db = SessionLocal()
    try:
        task = db.query(models.ScanTask).filter(models.ScanTask.id == task_id).first()
        if not task:
            return

        # Discover devices on subnet/range
        result = scan.discover_subnet(task.target)
        hosts = result.get("hosts", [])
        
        for h in hosts:
            # Check for cancellation
            db.refresh(task)
            if task.status == "cancelled":
                break

            ip = h.get("ip")
            if not ip:
                continue
            
            # Upsert device
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
            
            # Run the specified scan type
            if task.scan_type == "quick":
                scan_result = scan.run_scan(ip)
            else:
                scan_result = scan.comprehensive_scan(ip)
            
            db_scan = models.Scan(
                device_id=device.id,
                scan_task_id=task.id,
                timestamp=now_ts,
                scan_data=json.dumps(scan_result),
                status="completed"
            )
            db.add(db_scan)
            db.commit()

        # Update task status
        db.refresh(task)
        if task.status != "cancelled":
            task.status = "completed"
        task.end_time = datetime.utcnow()
        db.commit()
    finally:
        db.close()

@router.get("/scan/active", response_model=Optional[ScanTaskOut])
def get_active_scan(db: Session = Depends(get_db)):
    return db.query(models.ScanTask).filter(models.ScanTask.status == "running").first()

@router.post("/scan/{task_id}/cancel", status_code=200)
def cancel_scan(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.ScanTask).filter(models.ScanTask.id == task_id).first()
    if task and task.status == "running":
        task.status = "cancelled"
        db.commit()
        return {"message": "Scan cancellation requested"}
    return {"message": "No active scan to cancel or scan not found"}

@router.post("/scan", status_code=202, response_model=ScanTaskOut)
def trigger_scan(
    background_tasks: BackgroundTasks,
    target: Optional[str] = None,
    scan_type: str = "comprehensive",
    db: Session = Depends(get_db)
):
    if not target:
        # This part can be refactored or removed if not needed
        # For now, it remains a simple, non-task-based scan
        devices = db.query(models.Device).all()
        for d in devices:
            result = scan.run_scan(d.ip)
            db_scan = models.Scan(device_id=d.id, timestamp=datetime.utcnow(), scan_data=json.dumps(result))
            db.add(db_scan)
        db.commit()
        return {"message": "Simple scan completed for known devices", "count": len(devices)}

    # Create a new scan task
    new_task = models.ScanTask(target=target, scan_type=scan_type)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    background_tasks.add_task(run_background_scan, new_task.id)
    return new_task
