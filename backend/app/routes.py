from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models, scan
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/devices")
def list_devices(db: Session = Depends(get_db)):
    return db.query(models.Device).all()

@router.get("/devices/{device_id}/history")
def device_history(device_id: int, page: int = 1, limit: int = 1, db: Session = Depends(get_db)):
    scans = db.query(models.Scan).filter(models.Scan.device_id==device_id)\
        .order_by(models.Scan.timestamp.desc()).offset((page-1)*limit).limit(limit).all()
    total = db.query(models.Scan).filter(models.Scan.device_id==device_id).count()
    if not scans:
        return {"scan": None, "ports": [], "page": page, "total": total}
    scan_data = json.loads(scans[0].scan_data)
    return {"scan": scan_data, "ports": scan_data["ports"], "page": page, "total": total}

@router.post("/scan")
def trigger_scan(db: Session = Depends(get_db)):
    devices = db.query(models.Device).all()
    for d in devices:
        result = scan.run_scan(d.ip)
        db_scan = models.Scan(device_id=d.id, timestamp=result["timestamp"], scan_data=json.dumps(result))
        db.add(db_scan)
    db.commit()
    return {"message": "Scan completed"}