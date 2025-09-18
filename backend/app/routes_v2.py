"""
Refactored API routes using service layer.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .database import SessionLocal
from .services.asset_service import AssetService
from .services.scan_service import ScanService
from .services.operation_service import OperationService
from .services.credential_service import CredentialService
from .services.scanner_service import ScannerService
from . import schemas
import socket
import ipaddress

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Asset routes
@router.get("/assets", response_model=List[schemas.Asset])
def list_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    label_ids: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_managed: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """List assets with optional filtering."""
    service = AssetService(db)
    
    label_list = None
    if label_ids:
        label_list = [int(id) for id in label_ids.split(',')]
    
    return service.get_assets(
        skip=skip,
        limit=limit,
        label_ids=label_list,
        search=search,
        is_managed=is_managed
    )

@router.post("/assets", response_model=schemas.Asset)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db)):
    """Create a new asset."""
    service = AssetService(db)
    return service.create_asset(asset)

@router.get("/assets/{asset_id}", response_model=schemas.Asset)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    """Get an asset by ID."""
    service = AssetService(db)
    asset = service.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.put("/assets/{asset_id}", response_model=schemas.Asset)
def update_asset(asset_id: int, asset: schemas.AssetUpdate, db: Session = Depends(get_db)):
    """Update an asset."""
    service = AssetService(db)
    updated_asset = service.update_asset(asset_id, asset)
    if not updated_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return updated_asset

@router.delete("/assets/{asset_id}", status_code=204)
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    """Delete an asset."""
    service = AssetService(db)
    if not service.delete_asset(asset_id):
        raise HTTPException(status_code=404, detail="Asset not found")

# Scan routes
@router.get("/scan-tasks", response_model=List[schemas.ScanTask])
def list_scan_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List scan tasks."""
    service = ScanService(db)
    return service.get_scan_tasks(skip=skip, limit=limit, status=status)

@router.post("/scan-tasks", response_model=schemas.ScanTask)
def create_scan_task(
    task: schemas.ScanTaskCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create and start a new scan task."""
    service = ScanService(db)
    
    # Check if there's already an active scan
    active_scan = service.get_active_scan_task()
    if active_scan:
        raise HTTPException(
            status_code=409, 
            detail="Another scan is already running. Please wait for it to complete or cancel it first."
        )
    
    scan_task = service.create_scan_task(task)
    
    # Start the scan in the background
    background_tasks.add_task(service.run_scan_task, scan_task.id)
    
    return scan_task

@router.get("/scan-tasks/active", response_model=Optional[schemas.ScanTask])
def get_active_scan_task(db: Session = Depends(get_db)):
    """Get the currently active scan task."""
    service = ScanService(db)
    return service.get_active_scan_task()

@router.get("/scan-tasks/statistics")
def get_scan_statistics(db: Session = Depends(get_db)):
    """Get scan task statistics."""
    service = ScanService(db)
    return service.get_scan_statistics()

@router.get("/scan-tasks/{task_id}", response_model=schemas.ScanTask)
def get_scan_task(task_id: int, db: Session = Depends(get_db)):
    """Get a scan task by ID."""
    service = ScanService(db)
    task = service.get_scan_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Scan task not found")
    return task

@router.put("/scan-tasks/{task_id}", response_model=schemas.ScanTask)
def update_scan_task(task_id: int, task: schemas.ScanTaskUpdate, db: Session = Depends(get_db)):
    """Update a scan task."""
    service = ScanService(db)
    updated_task = service.update_scan_task(task_id, task)
    if not updated_task:
        raise HTTPException(status_code=404, detail="Scan task not found")
    return updated_task

@router.post("/scan-tasks/{task_id}/cancel", status_code=200)
def cancel_scan_task(task_id: int, db: Session = Depends(get_db)):
    """Cancel a running scan task."""
    service = ScanService(db)
    if not service.cancel_scan_task(task_id):
        raise HTTPException(status_code=404, detail="Scan task not found or not running")
    return {"message": "Scan task cancelled successfully"}

@router.get("/assets/{asset_id}/scans")
def get_asset_scan_history(
    asset_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get scan history for an asset."""
    service = ScanService(db)
    return service.get_asset_scan_history(asset_id, page, limit)

@router.delete("/scans/{scan_id}", status_code=204)
def delete_scan(scan_id: int, db: Session = Depends(get_db)):
    """Delete a scan record."""
    service = ScanService(db)
    if not service.delete_scan(scan_id):
        raise HTTPException(status_code=404, detail="Scan not found")

# Operation routes
@router.get("/operations", response_model=List[schemas.Operation])
def list_operations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """List operations."""
    service = OperationService(db)
    return service.get_operations(skip=skip, limit=limit, is_active=is_active)

@router.post("/operations", response_model=schemas.Operation)
def create_operation(operation: schemas.OperationCreate, db: Session = Depends(get_db)):
    """Create a new operation."""
    service = OperationService(db)
    return service.create_operation(operation)

@router.get("/operations/{operation_id}", response_model=schemas.Operation)
def get_operation(operation_id: int, db: Session = Depends(get_db)):
    """Get an operation by ID."""
    service = OperationService(db)
    operation = service.get_operation(operation_id)
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    return operation

@router.put("/operations/{operation_id}", response_model=schemas.Operation)
def update_operation(operation_id: int, operation: schemas.OperationUpdate, db: Session = Depends(get_db)):
    """Update an operation."""
    service = OperationService(db)
    updated_operation = service.update_operation(operation_id, operation)
    if not updated_operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    return updated_operation

@router.delete("/operations/{operation_id}", status_code=204)
def delete_operation(operation_id: int, db: Session = Depends(get_db)):
    """Delete an operation."""
    service = OperationService(db)
    if not service.delete_operation(operation_id):
        raise HTTPException(status_code=404, detail="Operation not found")

@router.post("/operations/run", response_model=schemas.Job)
def run_operation(
    operation_run: schemas.OperationRun,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Run an operation on specified targets."""
    service = OperationService(db)
    
    # Create and start the job
    job = service.run_operation(operation_run)
    
    # Execute the job in the background
    background_tasks.add_task(service.execute_job, job.id)
    
    return job

@router.get("/jobs", response_model=List[schemas.Job])
def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List jobs."""
    service = OperationService(db)
    return service.get_jobs(skip=skip, limit=limit, status=status)

@router.get("/jobs/{job_id}", response_model=schemas.Job)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get a job by ID."""
    service = OperationService(db)
    job = service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/jobs/{job_id}/cancel", status_code=200)
def cancel_job(job_id: int, db: Session = Depends(get_db)):
    """Cancel a running job."""
    service = OperationService(db)
    if not service.cancel_job(job_id):
        raise HTTPException(status_code=404, detail="Job not found or not cancellable")
    return {"message": "Job cancelled successfully"}

# Asset Group routes
@router.get("/asset-groups", response_model=List[schemas.AssetGroup])
def list_asset_groups(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """List asset groups."""
    service = AssetService(db)
    return service.get_asset_groups(skip=skip, limit=limit, is_active=is_active)

@router.post("/asset-groups", response_model=schemas.AssetGroup)
def create_asset_group(group: schemas.AssetGroupCreate, db: Session = Depends(get_db)):
    """Create a new asset group."""
    service = AssetService(db)
    return service.create_asset_group(group)

@router.get("/asset-groups/{group_id}", response_model=schemas.AssetGroup)
def get_asset_group(group_id: int, db: Session = Depends(get_db)):
    """Get an asset group by ID."""
    service = AssetService(db)
    group = service.get_asset_group(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Asset group not found")
    return group

@router.put("/asset-groups/{group_id}", response_model=schemas.AssetGroup)
def update_asset_group(group_id: int, group: schemas.AssetGroupUpdate, db: Session = Depends(get_db)):
    """Update an asset group."""
    service = AssetService(db)
    updated_group = service.update_asset_group(group_id, group)
    if not updated_group:
        raise HTTPException(status_code=404, detail="Asset group not found")
    return updated_group

@router.delete("/asset-groups/{group_id}", status_code=204)
def delete_asset_group(group_id: int, db: Session = Depends(get_db)):
    """Delete an asset group."""
    service = AssetService(db)
    if not service.delete_asset_group(group_id):
        raise HTTPException(status_code=404, detail="Asset group not found")

# Label routes
@router.get("/labels", response_model=List[schemas.Label])
def list_labels(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """List labels."""
    service = AssetService(db)
    return service.get_labels(skip=skip, limit=limit)

@router.post("/labels", response_model=schemas.Label)
def create_label(label: schemas.LabelBase, db: Session = Depends(get_db)):
    """Create a new label."""
    service = AssetService(db)
    return service.create_label(label)

@router.get("/labels/{label_id}", response_model=schemas.Label)
def get_label(label_id: int, db: Session = Depends(get_db)):
    """Get a label by ID."""
    service = AssetService(db)
    label = service.get_label(label_id)
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    return label

@router.put("/labels/{label_id}", response_model=schemas.Label)
def update_label(label_id: int, label: schemas.LabelUpdate, db: Session = Depends(get_db)):
    """Update a label."""
    service = AssetService(db)
    updated_label = service.update_label(label_id, label)
    if not updated_label:
        raise HTTPException(status_code=404, detail="Label not found")
    return updated_label

@router.delete("/labels/{label_id}", status_code=204)
def delete_label(label_id: int, db: Session = Depends(get_db)):
    """Delete a label."""
    service = AssetService(db)
    if not service.delete_label(label_id):
        raise HTTPException(status_code=404, detail="Label not found")

# Settings routes
@router.get("/settings", response_model=schemas.Settings)
def get_settings(db: Session = Depends(get_db)):
    """Get application settings."""
    service = AssetService(db)
    settings = service.get_settings()
    if not settings:
        # Create default settings if none exist
        settings = service.create_default_settings()
    return settings

@router.put("/settings", response_model=schemas.Settings)
def update_settings(settings: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    """Update application settings."""
    service = AssetService(db)
    return service.update_settings(settings)

# Utility routes
@router.get("/suggest-subnet")
def suggest_subnet():
    """Suggest a subnet based on the current host's network."""
    try:
        hostname = socket.gethostname()
        ip = socket.gethostbyname(hostname)
        # Suggest /24 subnet
        parts = ip.split('.')
        if len(parts) == 4:
            return {"subnet": f"{parts[0]}.{parts[1]}.{parts[2]}.0/24"}
    except Exception:
        pass
    return {"subnet": None}

# Scanner management routes
@router.get("/scanners", response_model=List[schemas.ScannerConfig])
def list_scanner_configs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List scanner configurations with optional filtering."""
    service = ScannerService(db)
    return service.get_scanner_configs(
        skip=skip,
        limit=limit,
        is_active=is_active,
        search=search
    )

@router.post("/scanners", response_model=schemas.ScannerConfig)
def create_scanner_config(config: schemas.ScannerConfigCreate, db: Session = Depends(get_db)):
    """Create a new scanner configuration."""
    service = ScannerService(db)
    try:
        return service.create_scanner_config(config)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/scanners/{config_id}", response_model=schemas.ScannerConfig)
def get_scanner_config(config_id: int, db: Session = Depends(get_db)):
    """Get a scanner configuration by ID."""
    service = ScannerService(db)
    config = service.get_scanner_config(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Scanner configuration not found")
    return config

@router.put("/scanners/{config_id}", response_model=schemas.ScannerConfig)
def update_scanner_config(
    config_id: int,
    config: schemas.ScannerConfigUpdate,
    db: Session = Depends(get_db)
):
    """Update a scanner configuration."""
    service = ScannerService(db)
    try:
        updated_config = service.update_scanner_config(config_id, config)
        if not updated_config:
            raise HTTPException(status_code=404, detail="Scanner configuration not found")
        return updated_config
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/scanners/{config_id}")
def delete_scanner_config(config_id: int, db: Session = Depends(get_db)):
    """Delete a scanner configuration."""
    service = ScannerService(db)
    if not service.delete_scanner_config(config_id):
        raise HTTPException(status_code=404, detail="Scanner configuration not found")
    return {"message": "Scanner configuration deleted successfully"}

@router.get("/scanners/{config_id}/health")
def check_scanner_health(config_id: int, db: Session = Depends(get_db)):
    """Check the health of a scanner configuration."""
    service = ScannerService(db)
    return service.check_scanner_health(config_id)

@router.get("/scanners/health/all")
def check_all_scanners_health(db: Session = Depends(get_db)):
    """Check the health of all active scanner configurations."""
    service = ScannerService(db)
    return service.check_all_scanners_health()

@router.get("/scanners/statistics")
def get_scanner_statistics(db: Session = Depends(get_db)):
    """Get statistics about scanner configurations."""
    service = ScannerService(db)
    return service.get_scanner_statistics()

@router.post("/scanners/{config_id}/test")
def test_scanner_connection(
    config_id: int,
    test_ip: str = Query("127.0.0.1"),
    db: Session = Depends(get_db)
):
    """Test a scanner connection with a specific IP."""
    service = ScannerService(db)
    return service.test_scanner_connection(config_id, test_ip)

@router.get("/scanners/for-ip/{ip}")
def get_scanner_for_ip(ip: str, db: Session = Depends(get_db)):
    """Get the appropriate scanner configuration for a given IP address."""
    service = ScannerService(db)
    config = service.get_scanner_for_ip(ip)
    if not config:
        raise HTTPException(status_code=404, detail="No suitable scanner found for this IP")
    return config

@router.post("/scanners/sync-settings")
def sync_scanners_with_settings(db: Session = Depends(get_db)):
    """Sync scanner configurations with the Settings table."""
    service = ScannerService(db)
    return service.sync_with_settings()

# Credential routes
@router.get("/credentials", response_model=List[schemas.Credential])
def list_credentials(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    credential_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),  # Comma-separated tags
    db: Session = Depends(get_db)
):
    """List credentials with optional filtering."""
    service = CredentialService(db)
    tag_list = tags.split(',') if tags else None
    return service.get_credentials(
        skip=skip,
        limit=limit,
        credential_type=credential_type,
        is_active=is_active,
        search=search,
        tags=tag_list
    )

@router.post("/credentials", response_model=schemas.Credential)
def create_credential(credential: schemas.CredentialCreate, db: Session = Depends(get_db)):
    """Create a new credential."""
    service = CredentialService(db)
    
    # Validate credential data
    errors = service.validate_credential_data(credential)
    if errors:
        raise HTTPException(status_code=400, detail=f"Validation errors: {', '.join(errors)}")
    
    try:
        return service.create_credential(credential)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/credentials/{credential_id}", response_model=schemas.Credential)
def get_credential(credential_id: int, db: Session = Depends(get_db)):
    """Get a credential by ID."""
    service = CredentialService(db)
    credential = service.get_credential(credential_id)
    if not credential:
        raise HTTPException(status_code=404, detail="Credential not found")
    return credential

@router.put("/credentials/{credential_id}", response_model=schemas.Credential)
def update_credential(
    credential_id: int,
    credential: schemas.CredentialUpdate,
    db: Session = Depends(get_db)
):
    """Update a credential."""
    service = CredentialService(db)
    try:
        updated_credential = service.update_credential(credential_id, credential)
        if not updated_credential:
            raise HTTPException(status_code=404, detail="Credential not found")
        return updated_credential
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/credentials/{credential_id}")
def delete_credential(credential_id: int, db: Session = Depends(get_db)):
    """Delete a credential."""
    service = CredentialService(db)
    if not service.delete_credential(credential_id):
        raise HTTPException(status_code=404, detail="Credential not found")
    return {"message": "Credential deleted successfully"}

@router.get("/credentials/type/{credential_type}", response_model=List[schemas.Credential])
def get_credentials_by_type(credential_type: str, db: Session = Depends(get_db)):
    """Get credentials by type."""
    service = CredentialService(db)
    return service.get_credentials_by_type(credential_type)

@router.get("/credentials/for-operation/{operation_type}", response_model=List[schemas.Credential])
def get_credentials_for_operation(operation_type: str, db: Session = Depends(get_db)):
    """Get appropriate credentials for a specific operation type."""
    service = CredentialService(db)
    return service.get_credentials_for_operation(operation_type)

@router.get("/credentials/statistics")
def get_credential_statistics(db: Session = Depends(get_db)):
    """Get credential statistics."""
    service = CredentialService(db)
    return service.get_credential_statistics()

@router.post("/credentials/{credential_id}/mark-used")
def mark_credential_used(credential_id: int, db: Session = Depends(get_db)):
    """Mark a credential as used."""
    service = CredentialService(db)
    if not service.mark_credential_used(credential_id):
        raise HTTPException(status_code=404, detail="Credential not found")
    return {"message": "Credential marked as used"}

# Operation credential routes
@router.get("/operations/{operation_id}/credentials", response_model=List[schemas.Credential])
def get_credentials_for_operation(operation_id: int, db: Session = Depends(get_db)):
    """Get appropriate credentials for a specific operation."""
    operation_service = OperationService(db)
    operation = operation_service.get_operation(operation_id)
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    return operation_service.get_credentials_for_operation(operation.operation_type)

@router.post("/operations/validate-credentials")
def validate_operation_credentials(operation_run: schemas.OperationRun, db: Session = Depends(get_db)):
    """Validate credentials for an operation run."""
    operation_service = OperationService(db)
    errors = operation_service.validate_operation_credentials(operation_run)
    
    if errors:
        return {"valid": False, "errors": errors}
    else:
        return {"valid": True, "message": "Credentials are valid"}

@router.post("/operations/{operation_id}/preview-inventory")
def preview_ansible_inventory(
    operation_id: int,
    operation_run: schemas.OperationRun,
    db: Session = Depends(get_db)
):
    """Preview the Ansible inventory that would be generated for an operation."""
    operation_service = OperationService(db)
    operation = operation_service.get_operation(operation_id)
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    # Get target assets
    assets = operation_service.get_target_assets(operation_run)
    if not assets:
        raise HTTPException(status_code=400, detail="No target assets found")
    
    # Prepare credentials
    credentials = operation_service.prepare_credentials_for_assets(
        assets, 
        operation_run.credential_id, 
        operation_run.override_credentials
    )
    
    # Create inventory
    inventory = operation_service.create_ansible_inventory_with_credentials(assets, credentials)
    
    return {
        "inventory": inventory,
        "asset_count": len(assets),
        "credential_summary": {
            "selected_credential_id": operation_run.credential_id,
            "assets_with_credentials": len([a for a in assets if a.id in credentials and credentials[a.id]]),
            "assets_without_credentials": len([a for a in assets if a.id not in credentials or not credentials[a.id]])
        }
    }

@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "DiscoverIT API is running"}
