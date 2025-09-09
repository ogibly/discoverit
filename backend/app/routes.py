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

@router.post("/assets", response_model=schemas.Asset)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db)):
    db_asset = models.Asset(
        name=asset.name,
        mac=asset.mac,
        owner=asset.owner,
        username=asset.username,
        password=asset.password,
        scan_data=asset.scan_data,
        labels=asset.labels,
        custom_fields=asset.custom_fields
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    for ip in asset.ips:
        db_ip = models.IPAddress(ip=ip.ip, asset_id=db_asset.id)
        db.add(db_ip)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.get("/assets", response_model=List[schemas.Asset])
def list_assets(db: Session = Depends(get_db)):
    return db.query(models.Asset).all()

@router.get("/assets/{asset_id}", response_model=schemas.Asset)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    return db.query(models.Asset).filter(models.Asset.id == asset_id).first()

@router.put("/assets/{asset_id}", response_model=schemas.Asset)
def update_asset(asset_id: int, asset: schemas.AssetCreate, db: Session = Depends(get_db)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        return None
    for key, value in asset.dict().items():
        setattr(db_asset, key, value)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.delete("/assets/{asset_id}", status_code=204)
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if asset:
        db.delete(asset)
        db.commit()
    return

@router.post("/asset_groups", response_model=schemas.AssetGroup)
def create_asset_group(asset_group: schemas.AssetGroupCreate, db: Session = Depends(get_db)):
    db_asset_group = models.AssetGroup(
        name=asset_group.name,
        labels=asset_group.labels
    )
    db.add(db_asset_group)
    db.commit()
    db.refresh(db_asset_group)
    for asset_id in asset_group.asset_ids:
        asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
        if asset:
            db_asset_group.assets.append(asset)
    db.commit()
    db.refresh(db_asset_group)
    return db_asset_group

@router.get("/asset_groups", response_model=List[schemas.AssetGroup])
def list_asset_groups(db: Session = Depends(get_db)):
    return db.query(models.AssetGroup).all()

@router.get("/asset_groups/{asset_group_id}", response_model=schemas.AssetGroup)
def get_asset_group(asset_group_id: int, db: Session = Depends(get_db)):
    return db.query(models.AssetGroup).filter(models.AssetGroup.id == asset_group_id).first()

@router.put("/asset_groups/{asset_group_id}", response_model=schemas.AssetGroup)
def update_asset_group(asset_group_id: int, asset_group: schemas.AssetGroupCreate, db: Session = Depends(get_db)):
    db_asset_group = db.query(models.AssetGroup).filter(models.AssetGroup.id == asset_group_id).first()
    if not db_asset_group:
        return None
    db_asset_group.name = asset_group.name
    db_asset_group.labels = asset_group.labels
    db_asset_group.assets = []
    for asset_id in asset_group.asset_ids:
        asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
        if asset:
            db_asset_group.assets.append(asset)
    db.commit()
    db.refresh(db_asset_group)
    return db_asset_group

@router.delete("/asset_groups/{asset_group_id}", status_code=204)
def delete_asset_group(asset_group_id: int, db: Session = Depends(get_db)):
    asset_group = db.query(models.AssetGroup).filter(models.AssetGroup.id == asset_group_id).first()
    if asset_group:
        db.delete(asset_group)
        db.commit()
    return

@router.post("/asset_groups/{asset_group_id}/assets", response_model=schemas.AssetGroup)
def add_asset_to_group(asset_group_id: int, asset_id: int, db: Session = Depends(get_db)):
    db_asset_group = db.query(models.AssetGroup).filter(models.AssetGroup.id == asset_group_id).first()
    if not db_asset_group:
        return None
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        return None
    db_asset_group.assets.append(asset)
    db.commit()
    db.refresh(db_asset_group)
    return db_asset_group

@router.delete("/asset_groups/{asset_group_id}/assets/{asset_id}", status_code=204)
def remove_asset_from_group(asset_group_id: int, asset_id: int, db: Session = Depends(get_db)):
    db_asset_group = db.query(models.AssetGroup).filter(models.AssetGroup.id == asset_group_id).first()
    if not db_asset_group:
        return
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        return
    db_asset_group.assets.remove(asset)
    db.commit()
    return

@router.post("/operations", response_model=schemas.Operation)
def create_operation(operation: schemas.OperationCreate, db: Session = Depends(get_db)):
    db_operation = models.Operation(**operation.dict())
    db.add(db_operation)
    db.commit()
    db.refresh(db_operation)
    return db_operation

@router.get("/operations", response_model=List[schemas.Operation])
def list_operations(db: Session = Depends(get_db)):
    return db.query(models.Operation).all()

@router.get("/operations/{operation_id}", response_model=schemas.Operation)
def get_operation(operation_id: int, db: Session = Depends(get_db)):
    return db.query(models.Operation).filter(models.Operation.id == operation_id).first()

@router.put("/operations/{operation_id}", response_model=schemas.Operation)
def update_operation(operation_id: int, operation: schemas.OperationCreate, db: Session = Depends(get_db)):
    db_operation = db.query(models.Operation).filter(models.Operation.id == operation_id).first()
    if not db_operation:
        return None
    for key, value in operation.dict().items():
        setattr(db_operation, key, value)
    db.commit()
    db.refresh(db_operation)
    return db_operation

@router.delete("/operations/{operation_id}", status_code=204)
def delete_operation(operation_id: int, db: Session = Depends(get_db)):
    operation = db.query(models.Operation).filter(models.Operation.id == operation_id).first()
    if operation:
        db.delete(operation)
        db.commit()
    return

def run_operation_background(job_id: int):
    db = SessionLocal()
    try:
        job = db.query(models.Job).filter(models.Job.id == job_id).first()
        if not job:
            return

        operation = db.query(models.Operation).filter(models.Operation.id == job.operation_id).first()
        asset_group = db.query(models.AssetGroup).filter(models.AssetGroup.id == job.asset_group_id).first()

        if not operation or not asset_group:
            job.status = "failed"
            job.end_time = datetime.utcnow()
            db.commit()
            return

        results = []
        for asset in asset_group.assets:
            # Here you would make the actual API call using the operation's details.
            # For this example, we'll just simulate a successful call.
            results.append({
                "asset_id": asset.id,
                "asset_name": asset.name,
                "status": "success",
                "response": "Operation completed successfully."
            })

        job.results = json.dumps(results)
        job.status = "completed"
        job.end_time = datetime.utcnow()
        db.commit()
    finally:
        db.close()

@router.post("/operations/{operation_id}/run/{asset_group_id}", response_model=schemas.Job)
async def run_operation(
    operation_id: int,
    asset_group_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    operation = db.query(models.Operation).filter(models.Operation.id == operation_id).first()
    asset_group = db.query(models.AssetGroup).filter(models.AssetGroup.id == asset_group_id).first()

    if not operation or not asset_group:
        return None

    new_job = models.Job(
        operation_id=operation_id,
        asset_group_id=asset_group_id,
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    background_tasks.add_task(run_operation_background, new_job.id)
    return new_job

@router.get("/jobs/{job_id}", response_model=schemas.Job)
def get_job(job_id: int, db: Session = Depends(get_db)):
    return db.query(models.Job).filter(models.Job.id == job_id).first()
