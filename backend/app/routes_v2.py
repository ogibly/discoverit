"""
Refactored API routes using service layer.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Request, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from .db_utils import get_db
from .services.asset_service import AssetService
from .services.scan_service_v2 import ScanServiceV2 as ScanService
from .services.operation_service import OperationService
from .services.credential_service import CredentialService
from .services.scanner_service import ScannerService
from .services.auth_service import AuthService
from .auth import (
    get_current_active_user, require_permission, require_permissions, require_admin,
    require_assets_read, require_assets_write, require_discovery_read, require_discovery_write,
    require_scanners_read, require_scanners_write, require_operations_read, require_operations_write,
    require_operations_execute, require_credentials_read, require_credentials_write,
    require_users_read, require_users_write, require_roles_read, require_roles_write,
    require_settings_read, require_settings_write, get_auth_service
)
from . import schemas
from .models import User, Asset
import socket
import ipaddress

router = APIRouter()


# Authentication routes
@router.post("/auth/login", response_model=schemas.Token)
def login(
    user_credentials: schemas.UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login user and return access token."""
    auth_service = AuthService(db)
    
    # Authenticate user
    user = auth_service.authenticate_user(user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check IP restrictions
    client_ip = request.client.host if request.client else "127.0.0.1"
    from .services.ldap_service import IPRangeService
    ip_service = IPRangeService(db)
    
    if not ip_service.check_user_ip_access(user, client_ip):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied from IP address {client_ip}",
        )
    
    # Create access token
    access_token = auth_service.create_access_token(user.id)
    
    # Create session
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    session = auth_service.create_session(user.id, ip_address, user_agent)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 30 * 60,  # 30 minutes
        "user": user
    }

@router.post("/auth/refresh")
def refresh_token(
    current_user: User = Depends(get_current_active_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Refresh access token."""
    # Create new access token
    access_token = auth_service.create_access_token(current_user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 30 * 60,  # 30 minutes
        "user": current_user
    }

@router.post("/auth/logout")
def logout(
    current_user: User = Depends(get_current_active_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Logout user and invalidate session."""
    # In a real implementation, you would invalidate the specific session
    # For now, we'll just return success
    return {"message": "Successfully logged out"}

@router.get("/auth/me", response_model=schemas.User)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user

@router.get("/auth/permissions")
def get_user_permissions(
    current_user: User = Depends(get_current_active_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Get current user's permissions."""
    permissions = auth_service.get_user_permissions(current_user)
    return {"permissions": permissions}

# User management routes
@router.get("/users", response_model=List[schemas.User])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(require_users_read),
    db: Session = Depends(get_db)
):
    """List users (admin only)."""
    auth_service = AuthService(db)
    return auth_service.get_users(skip=skip, limit=limit, is_active=is_active)

@router.post("/users", response_model=schemas.User)
def create_user(
    user_data: schemas.UserCreate,
    current_user: User = Depends(require_users_write),
    db: Session = Depends(get_db)
):
    """Create a new user (admin only)."""
    auth_service = AuthService(db)
    try:
        return auth_service.create_user(user_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/users/{user_id}", response_model=schemas.User)
def get_user(
    user_id: int,
    current_user: User = Depends(require_users_read),
    db: Session = Depends(get_db)
):
    """Get user by ID (admin only)."""
    auth_service = AuthService(db)
    user = auth_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_data: schemas.UserUpdate,
    current_user: User = Depends(require_users_write),
    db: Session = Depends(get_db)
):
    """Update user (admin only)."""
    auth_service = AuthService(db)
    try:
        updated_user = auth_service.update_user(user_id, user_data)
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        return updated_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(require_users_write),
    db: Session = Depends(get_db)
):
    """Delete user (admin only)."""
    auth_service = AuthService(db)
    if not auth_service.delete_user(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@router.post("/users/{user_id}/change-password")
def change_password(
    user_id: int,
    password_data: schemas.UserPasswordUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change user password."""
    auth_service = AuthService(db)
    
    # Users can only change their own password unless they're admin
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Can only change your own password")
    
    try:
        auth_service.change_password(user_id, password_data)
        return {"message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Role management routes
@router.get("/roles", response_model=List[schemas.Role])
def list_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(require_roles_read),
    db: Session = Depends(get_db)
):
    """List roles (admin only)."""
    auth_service = AuthService(db)
    return auth_service.get_roles(skip=skip, limit=limit, is_active=is_active)

@router.post("/roles", response_model=schemas.Role)
def create_role(
    role_data: schemas.RoleCreate,
    current_user: User = Depends(require_roles_write),
    db: Session = Depends(get_db)
):
    """Create a new role (admin only)."""
    auth_service = AuthService(db)
    try:
        return auth_service.create_role(role_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/roles/{role_id}", response_model=schemas.Role)
def get_role(
    role_id: int,
    current_user: User = Depends(require_roles_read),
    db: Session = Depends(get_db)
):
    """Get role by ID (admin only)."""
    auth_service = AuthService(db)
    role = auth_service.get_role(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.put("/roles/{role_id}", response_model=schemas.Role)
def update_role(
    role_id: int,
    role_data: schemas.RoleUpdate,
    current_user: User = Depends(require_roles_write),
    db: Session = Depends(get_db)
):
    """Update role (admin only)."""
    auth_service = AuthService(db)
    try:
        updated_role = auth_service.update_role(role_id, role_data)
        if not updated_role:
            raise HTTPException(status_code=404, detail="Role not found")
        return updated_role
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/roles/{role_id}")
def delete_role(
    role_id: int,
    current_user: User = Depends(require_roles_write),
    db: Session = Depends(get_db)
):
    """Delete role (admin only)."""
    auth_service = AuthService(db)
    try:
        if not auth_service.delete_role(role_id):
            raise HTTPException(status_code=404, detail="Role not found")
        return {"message": "Role deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Asset routes
@router.get("/assets", response_model=List[schemas.Asset])
def list_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    label_ids: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_managed: Optional[bool] = Query(None),
    current_user: User = Depends(require_assets_read),
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

@router.get("/scan-tasks/{task_id}/results")
def get_scan_results(task_id: int, db: Session = Depends(get_db)):
    """Get scan results for a completed scan task."""
    service = ScanService(db)
    task = service.get_scan_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Scan task not found")
    
    # Get scans for this task
    from .models import Scan
    scans = db.query(Scan).filter(Scan.scan_task_id == task_id).all()
    
    # Get assets from the scans
    results = []
    for scan in scans:
        asset = scan.asset
        if asset:
            results.append({
                "id": asset.id,
                "ip": asset.primary_ip,
                "hostname": asset.hostname,
                "mac": asset.mac_address,
                "os": asset.os_name,
                "vendor": asset.manufacturer,
                "device_type": asset.model,
                "status": "up" if asset.is_active else "down",
                "last_seen": asset.last_seen,
                "discovered_at": asset.created_at,
                "scan_timestamp": scan.timestamp,
                "scan_status": scan.status
            })
    
    return {
        "scan_task_id": task_id,
        "scan_name": task.name,
        "scan_status": task.status,
        "total_devices": len(results),
        "results": results
    }

@router.get("/devices")
def get_discovered_devices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    scan_task_id: Optional[int] = Query(None, description="Filter devices by scan task ID"),
    current_user: User = Depends(require_assets_read),
    db: Session = Depends(get_db)
):
    """Get discovered devices (scans without assets) that can be converted to assets."""
    from .models import Scan
    import json
    
    # Query scans that don't have an associated asset
    query = db.query(Scan).filter(Scan.asset_id.is_(None))
    
    # Apply filters
    if status:
        query = query.filter(Scan.status == status)
    
    # Filter by scan task ID if provided
    if scan_task_id:
        query = query.filter(Scan.scan_task_id == scan_task_id)
    
    # Apply search
    if search:
        query = query.filter(Scan.scan_data.contains(search))
    
    # Get total count
    total = query.count()
    
    # Apply pagination and include scan_task relationship
    scans = query.options(joinedload(Scan.scan_task)).order_by(Scan.timestamp.desc()).offset(skip).limit(limit).all()
    
    # Format results
    devices = []
    for scan in scans:
        try:
            scan_data = json.loads(scan.scan_data) if isinstance(scan.scan_data, str) else scan.scan_data
            ip_address = scan_data.get("ip_address", "Unknown")
            
            # Extract device information from scan data
            hostname = scan_data.get("hostname")
            os_info = scan_data.get("os_info", {})
            device_info = scan_data.get("device_info", {})
            addresses = scan_data.get("addresses", {})
            
            # Extract categorization data
            categorization = scan_data.get("categorization", {})
            
            devices.append({
                "id": scan.id,  # Use scan ID as device ID
                "primary_ip": ip_address,
                "hostname": hostname,
                "mac_address": addresses.get("mac"),
                "os_name": os_info.get("os_name"),
                "os_family": os_info.get("os_family"),
                "os_version": os_info.get("os_version"),
                "manufacturer": device_info.get("manufacturer"),
                "model": device_info.get("model"),
                "is_managed": False,  # Devices are not managed until converted to assets
                "last_seen": scan.timestamp,
                "created_at": scan.timestamp,
                "updated_at": scan.timestamp,
                "scan_data": scan_data,
                "scan_status": scan.status,
                "scan_type": scan.scan_type,
                "scan_task_id": scan.scan_task_id,
                "scan_task_name": scan.scan_task.name if scan.scan_task else None,
                # Categorization data for UI display
                "result_type": categorization.get("result_type", "unknown"),
                "confidence": categorization.get("confidence", "low"),
                "indicators": categorization.get("indicators", []),
                "is_device": categorization.get("is_device", False)
            })
        except (json.JSONDecodeError, KeyError) as e:
            # Skip malformed scan data
            continue
    
    return {
        "devices": devices,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.post("/devices/{device_id}/convert-to-asset")
def convert_device_to_asset(
    device_id: int,
    asset_data: schemas.AssetCreate,
    current_user: User = Depends(require_assets_write),
    db: Session = Depends(get_db)
):
    """Convert a discovered device (scan) to an asset."""
    from .models import Scan
    import json
    
    # Get the scan/device
    scan = db.query(Scan).filter(Scan.id == device_id, Scan.asset_id.is_(None)).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Device not found or already converted")
    
    try:
        scan_data = json.loads(scan.scan_data) if isinstance(scan.scan_data, str) else scan.scan_data
        ip_address = scan_data.get("ip_address", "Unknown")
        
        # Check if an asset with this IP already exists
        existing_asset = db.query(models.Asset).filter(models.Asset.primary_ip == ip_address).first()
        if existing_asset:
            raise HTTPException(status_code=400, detail=f"Asset with IP {ip_address} already exists")
        
        # Create the asset
        asset = models.Asset(
            name=asset_data.name,
            primary_ip=ip_address,
            mac_address=asset_data.mac_address,
            hostname=asset_data.hostname,
            os_name=asset_data.os_name,
            os_family=asset_data.os_family,
            os_version=asset_data.os_version,
            manufacturer=asset_data.manufacturer,
            model=asset_data.model,
            is_managed=asset_data.is_managed,
            scan_data=scan_data,
            last_seen=scan.timestamp
        )
        
        db.add(asset)
        db.flush()  # Get the asset ID
        
        # Link the scan to the new asset
        scan.asset_id = asset.id
        db.commit()
        db.refresh(asset)
        
        return asset
        
    except (json.JSONDecodeError, KeyError) as e:
        raise HTTPException(status_code=400, detail="Invalid device data")

@router.post("/discovery/lan")
async def discover_lan_network(
    max_depth: int = Query(2, ge=1, le=5, description="Maximum network depth to scan"),
    current_user: User = Depends(require_discovery_write),
    db: Session = Depends(get_db)
):
    """Discover devices on the local network with configurable depth."""
    import asyncio
    import concurrent.futures
    
    def run_discovery():
        service = ScanService(db)
        return service.discover_lan_network(max_depth)
    
    try:
        # Use asyncio.wait_for with a thread pool executor for timeout
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor() as executor:
            result = await asyncio.wait_for(
                loop.run_in_executor(executor, run_discovery),
                timeout=30.0
            )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="LAN discovery operation timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LAN discovery failed: {str(e)}")

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

@router.post("/operations/execute", response_model=schemas.Job)
def execute_operation(
    execution_data: schemas.OperationExecution,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_operations_execute),
    db: Session = Depends(get_db)
):
    """Execute an operation on selected assets or asset groups with credential selection."""
    service = OperationService(db)
    
    # Create and start the operation job with credentials
    job = service.create_operation_job_with_credentials(execution_data, current_user.id)
    
    # Start the operation in the background
    background_tasks.add_task(service.execute_job, job.id)
    
    return job

@router.post("/operations/run", response_model=schemas.Job)
def run_operation(
    operation_run: schemas.OperationRun,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Run an operation on specified targets (legacy endpoint)."""
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

@router.post("/awx/test-connection")
def test_awx_connection(
    awx_config: dict,
    current_user: User = Depends(require_settings_write),
    db: Session = Depends(get_db)
):
    """Test AWX Tower connection."""
    try:
        import requests
        from requests.auth import HTTPBasicAuth
        
        awx_url = awx_config.get('awx_url', '').rstrip('/')
        username = awx_config.get('awx_username', '')
        password = awx_config.get('awx_password', '')
        
        if not awx_url or not username or not password:
            raise HTTPException(status_code=400, detail="AWX URL, username, and password are required")
        
        # Test connection by making a simple API call
        test_url = f"{awx_url}/api/v2/me/"
        response = requests.get(
            test_url,
            auth=HTTPBasicAuth(username, password),
            timeout=10,
            verify=False  # In production, you might want to verify SSL
        )
        
        if response.status_code == 200:
            return {"success": True, "message": "AWX connection successful"}
        else:
            return {"success": False, "error": f"AWX returned status code: {response.status_code}"}
            
    except requests.exceptions.ConnectionError:
        return {"success": False, "error": "Could not connect to AWX server"}
    except requests.exceptions.Timeout:
        return {"success": False, "error": "Connection timeout"}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"Request failed: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}

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

@router.post("/validate-network-range")
def validate_network_range(
    target: str = Query(..., description="Network range to validate (CIDR, IP range, or single IP)"),
    db: Session = Depends(get_db)
):
    """Validate and analyze a network range for scanning."""
    import ipaddress
    import re
    
    try:
        # Handle different input formats
        if target.lower() == 'auto':
            return {
                "valid": True,
                "type": "auto",
                "description": "Auto-detect local network",
                "ip_count": None,
                "suggested_name": "Auto LAN Discovery"
            }
        
        # Check if it's a CIDR notation
        if '/' in target:
            network = ipaddress.ip_network(target, strict=False)
            return {
                "valid": True,
                "type": "cidr",
                "network": str(network),
                "ip_count": network.num_addresses,
                "first_ip": str(network.network_address),
                "last_ip": str(network.broadcast_address),
                "description": f"CIDR network with {network.num_addresses} addresses",
                "suggested_name": f"Scan {target}"
            }
        
        # Check if it's an IP range (e.g., 192.168.1.1-192.168.1.254)
        if '-' in target:
            parts = target.split('-')
            if len(parts) == 2:
                start_ip = ipaddress.ip_address(parts[0].strip())
                end_ip = ipaddress.ip_address(parts[1].strip())
                
                # Calculate IP count
                ip_count = int(end_ip) - int(start_ip) + 1
                
                return {
                    "valid": True,
                    "type": "range",
                    "start_ip": str(start_ip),
                    "end_ip": str(end_ip),
                    "ip_count": ip_count,
                    "description": f"IP range with {ip_count} addresses",
                    "suggested_name": f"Range Scan {target}"
                }
        
        # Check if it's a single IP
        try:
            ip = ipaddress.ip_address(target)
            return {
                "valid": True,
                "type": "single",
                "ip": str(ip),
                "ip_count": 1,
                "description": "Single IP address",
                "suggested_name": f"Single IP Scan {target}"
            }
        except ValueError:
            pass
        
        return {
            "valid": False,
            "error": "Invalid network range format. Use CIDR (192.168.1.0/24), IP range (192.168.1.1-192.168.1.254), or single IP (192.168.1.1)"
        }
        
    except Exception as e:
        return {
            "valid": False,
            "error": f"Invalid network range: {str(e)}"
        }

# Scanner management routes
@router.get("/scanners", response_model=List[schemas.ScannerConfig])
@router.get("/scanner-configs", response_model=List[schemas.ScannerConfig])
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
@router.post("/scanner-configs", response_model=schemas.ScannerConfig)
def create_scanner_config(config: schemas.ScannerConfigCreate, db: Session = Depends(get_db)):
    """Create a new scanner configuration."""
    service = ScannerService(db)
    try:
        return service.create_scanner_config(config)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/scanners/statistics")
def get_scanner_statistics(db: Session = Depends(get_db)):
    """Get statistics about scanner configurations."""
    service = ScannerService(db)
    return service.get_scanner_statistics()

@router.get("/scanners/default", response_model=schemas.ScannerConfig)
def get_default_scanner(db: Session = Depends(get_db)):
    """Get the default scanner configuration."""
    service = ScannerService(db)
    config = service.get_default_scanner()
    if not config:
        raise HTTPException(status_code=404, detail="No default scanner configured")
    return config

@router.get("/scanners/{config_id}", response_model=schemas.ScannerConfig)
@router.get("/scanner-configs/{config_id}", response_model=schemas.ScannerConfig)
def get_scanner_config(config_id: int, db: Session = Depends(get_db)):
    """Get a scanner configuration by ID."""
    service = ScannerService(db)
    config = service.get_scanner_config(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Scanner configuration not found")
    return config

@router.put("/scanners/{config_id}", response_model=schemas.ScannerConfig)
@router.put("/scanner-configs/{config_id}", response_model=schemas.ScannerConfig)
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
@router.delete("/scanner-configs/{config_id}")
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

# LDAP Configuration routes
@router.get("/ldap/configs", response_model=List[schemas.LDAPConfig])
def list_ldap_configs(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_settings_read),
    db: Session = Depends(get_db)
):
    """List LDAP configurations."""
    from .services.ldap_service import LDAPService
    service = LDAPService(db)
    return service.get_ldap_configs(skip=skip, limit=limit, is_active=is_active)

@router.post("/ldap/configs", response_model=schemas.LDAPConfig)
def create_ldap_config(
    config: schemas.LDAPConfigCreate,
    current_user: User = Depends(require_settings_write),
    db: Session = Depends(get_db)
):
    """Create a new LDAP configuration."""
    from .services.ldap_service import LDAPService
    service = LDAPService(db)
    return service.create_ldap_config(config, current_user.id)

@router.get("/ldap/configs/{config_id}", response_model=schemas.LDAPConfig)
def get_ldap_config(
    config_id: int,
    current_user: User = Depends(require_settings_read),
    db: Session = Depends(get_db)
):
    """Get LDAP configuration by ID."""
    from .services.ldap_service import LDAPService
    service = LDAPService(db)
    config = service.get_ldap_config(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="LDAP configuration not found")
    return config

@router.put("/ldap/configs/{config_id}", response_model=schemas.LDAPConfig)
def update_ldap_config(
    config_id: int,
    config: schemas.LDAPConfigUpdate,
    current_user: User = Depends(require_settings_write),
    db: Session = Depends(get_db)
):
    """Update LDAP configuration."""
    from .services.ldap_service import LDAPService
    service = LDAPService(db)
    updated_config = service.update_ldap_config(config_id, config)
    if not updated_config:
        raise HTTPException(status_code=404, detail="LDAP configuration not found")
    return updated_config

@router.delete("/ldap/configs/{config_id}")
def delete_ldap_config(
    config_id: int,
    current_user: User = Depends(require_settings_write),
    db: Session = Depends(get_db)
):
    """Delete LDAP configuration."""
    from .services.ldap_service import LDAPService
    service = LDAPService(db)
    if not service.delete_ldap_config(config_id):
        raise HTTPException(status_code=404, detail="LDAP configuration not found")

@router.post("/ldap/configs/{config_id}/test")
def test_ldap_connection(
    config_id: int,
    current_user: User = Depends(require_settings_read),
    db: Session = Depends(get_db)
):
    """Test LDAP connection."""
    from .services.ldap_service import LDAPService
    service = LDAPService(db)
    config = service.get_ldap_config(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="LDAP configuration not found")
    
    result = service.test_connection(config)
    return result

@router.post("/ldap/configs/{config_id}/sync")
def sync_ldap_users(
    config_id: int,
    sync_type: str = "incremental",
    current_user: User = Depends(require_settings_write),
    db: Session = Depends(get_db)
):
    """Synchronize users from LDAP."""
    from .services.ldap_service import LDAPService
    service = LDAPService(db)
    config = service.get_ldap_config(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="LDAP configuration not found")
    
    if sync_type not in ["full", "incremental"]:
        raise HTTPException(status_code=400, detail="Invalid sync type. Must be 'full' or 'incremental'")
    
    result = service.sync_users(config, sync_type)
    return result

@router.get("/ldap/sync-logs", response_model=List[schemas.LDAPSyncLog])
def get_ldap_sync_logs(
    config_id: Optional[int] = None,
    limit: int = 50,
    current_user: User = Depends(require_settings_read),
    db: Session = Depends(get_db)
):
    """Get LDAP sync logs."""
    from .services.ldap_service import LDAPService
    service = LDAPService(db)
    return service.get_sync_logs(config_id=config_id, limit=limit)

# IP Range Management routes
@router.get("/ip-ranges", response_model=List[schemas.IPRange])
def list_ip_ranges(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_settings_read),
    db: Session = Depends(get_db)
):
    """List IP ranges."""
    from .services.ldap_service import IPRangeService
    service = IPRangeService(db)
    return service.get_ip_ranges(skip=skip, limit=limit, is_active=is_active)

@router.post("/ip-ranges", response_model=schemas.IPRange)
def create_ip_range(
    ip_range: schemas.IPRangeCreate,
    current_user: User = Depends(require_settings_write),
    db: Session = Depends(get_db)
):
    """Create a new IP range."""
    from .services.ldap_service import IPRangeService
    service = IPRangeService(db)
    return service.create_ip_range(ip_range.dict(), current_user.id)

@router.get("/ip-ranges/{range_id}", response_model=schemas.IPRange)
def get_ip_range(
    range_id: int,
    current_user: User = Depends(require_settings_read),
    db: Session = Depends(get_db)
):
    """Get IP range by ID."""
    from .services.ldap_service import IPRangeService
    service = IPRangeService(db)
    ip_range = service.get_ip_range(range_id)
    if not ip_range:
        raise HTTPException(status_code=404, detail="IP range not found")
    return ip_range

@router.put("/ip-ranges/{range_id}", response_model=schemas.IPRange)
def update_ip_range(
    range_id: int,
    ip_range: schemas.IPRangeUpdate,
    current_user: User = Depends(require_settings_write),
    db: Session = Depends(get_db)
):
    """Update IP range."""
    from .services.ldap_service import IPRangeService
    service = IPRangeService(db)
    updated_range = service.update_ip_range(range_id, ip_range.dict(exclude_unset=True))
    if not updated_range:
        raise HTTPException(status_code=404, detail="IP range not found")
    return updated_range

@router.delete("/ip-ranges/{range_id}")
def delete_ip_range(
    range_id: int,
    current_user: User = Depends(require_settings_write),
    db: Session = Depends(get_db)
):
    """Delete IP range."""
    from .services.ldap_service import IPRangeService
    service = IPRangeService(db)
    if not service.delete_ip_range(range_id):
        raise HTTPException(status_code=404, detail="IP range not found")

@router.post("/users/{user_id}/ip-ranges/{range_id}")
def assign_ip_range_to_user(
    user_id: int,
    range_id: int,
    current_user: User = Depends(require_users_write),
    db: Session = Depends(get_db)
):
    """Assign IP range to user."""
    from .services.ldap_service import IPRangeService
    service = IPRangeService(db)
    if not service.assign_ip_range_to_user(user_id, range_id, current_user.id):
        raise HTTPException(status_code=404, detail="User or IP range not found")

@router.delete("/users/{user_id}/ip-ranges/{range_id}")
def remove_ip_range_from_user(
    user_id: int,
    range_id: int,
    current_user: User = Depends(require_users_write),
    db: Session = Depends(get_db)
):
    """Remove IP range from user."""
    from .services.ldap_service import IPRangeService
    service = IPRangeService(db)
    if not service.remove_ip_range_from_user(user_id, range_id):
        raise HTTPException(status_code=404, detail="User or IP range not found")

@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "DiscoverIT API is running"}
