"""
Improved API routes with enhanced error handling and service factory pattern.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from .db_utils import get_db
from .services.service_factory import ServiceFactory, get_service_factory
from .services.base_service import ServiceError, ValidationError, NotFoundError, DuplicateError
from .auth import (
    get_current_active_user, require_permission, require_permissions, require_admin,
    require_assets_read, require_assets_write, require_discovery_read, require_discovery_write,
    require_scanners_write, require_credentials_read, require_credentials_write,
    require_users_read, require_users_write, require_roles_read, require_roles_write,
    require_settings_read, require_settings_write, require_subnets_read, require_subnets_write,
    require_satellite_scanners_read, require_satellite_scanners_write, require_satellite_scanners_use,
    get_auth_service
)
from . import schemas
from .models import User, Asset

logger = logging.getLogger(__name__)

router = APIRouter()


def handle_service_errors(func):
    """Decorator to handle service layer errors and convert to HTTP exceptions."""
    from functools import wraps
    
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except NotFoundError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except DuplicateError as e:
            raise HTTPException(status_code=409, detail=str(e))
        except ServiceError as e:
            logger.error(f"Service error in {func.__name__}: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    return wrapper


# Dependency to get service factory
def get_services(db: Session = Depends(get_db)) -> ServiceFactory:
    """Get the service factory."""
    return get_service_factory(db)


# Authentication routes
@router.post("/auth/login", response_model=schemas.Token)
@handle_service_errors
async def login(
    user_credentials: schemas.UserLogin,
    request: Request,
    services: ServiceFactory = Depends(get_services)
):
    """Login user and return access token."""
    auth_service = services.get_auth_service()
    
    # Authenticate user
    user = auth_service.authenticate_user(user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
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
@handle_service_errors
async def refresh_token(
    current_user: User = Depends(get_current_active_user),
    services: ServiceFactory = Depends(get_services)
):
    """Refresh access token."""
    auth_service = services.get_auth_service()
    access_token = auth_service.create_access_token(current_user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 30 * 60,  # 30 minutes
        "user": current_user
    }


@router.post("/auth/logout")
@handle_service_errors
async def logout(
    current_user: User = Depends(get_current_active_user),
    services: ServiceFactory = Depends(get_services)
):
    """Logout user and invalidate session."""
    auth_service = services.get_auth_service()
    # In a real implementation, you would invalidate the specific session
    return {"message": "Successfully logged out"}


@router.get("/auth/me", response_model=schemas.User)
@handle_service_errors
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user


@router.get("/auth/permissions")
@handle_service_errors
async def get_user_permissions(
    current_user: User = Depends(get_current_active_user),
    services: ServiceFactory = Depends(get_services)
):
    """Get user permissions."""
    auth_service = services.get_auth_service()
    permissions = auth_service.get_user_permissions(current_user)
    return {"permissions": permissions}


# Scanner routes with improved error handling
@router.get("/scanners", response_model=List[schemas.ScannerConfig])
@router.get("/scanner-configs", response_model=List[schemas.ScannerConfig])
@handle_service_errors
async def list_scanner_configs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    services: ServiceFactory = Depends(get_services)
):
    """List scanner configurations with optional filtering."""
    scanner_service = services.get_scanner_service()
    return scanner_service.get_scanner_configs(
        skip=skip,
        limit=limit,
        is_active=is_active,
        search=search
    )


@router.post("/scanners", response_model=schemas.ScannerConfig)
@router.post("/scanner-configs", response_model=schemas.ScannerConfig)
@handle_service_errors
async def create_scanner_config(
    config: schemas.ScannerConfigCreate,
    current_user: User = Depends(require_scanners_write),
    services: ServiceFactory = Depends(get_services)
):
    """Create a new scanner configuration."""
    scanner_service = services.get_scanner_service()
    return scanner_service.create_scanner_config(config)


@router.get("/scanners/statistics")
@handle_service_errors
async def get_scanner_statistics(
    services: ServiceFactory = Depends(get_services)
):
    """Get statistics about scanner configurations."""
    scanner_service = services.get_scanner_service()
    return scanner_service.get_scanner_statistics()


@router.get("/scanners/default", response_model=schemas.ScannerConfig)
@handle_service_errors
async def get_default_scanner(
    services: ServiceFactory = Depends(get_services)
):
    """Get the default scanner configuration."""
    scanner_service = services.get_scanner_service()
    config = scanner_service.get_default_scanner()
    if not config:
        raise HTTPException(status_code=404, detail="No default scanner configured")
    return config


@router.get("/scanners/for-ip/{ip}")
@handle_service_errors
async def get_scanner_for_ip(
    ip: str,
    services: ServiceFactory = Depends(get_services)
):
    """Get the appropriate scanner configuration for a given IP address."""
    scanner_service = services.get_scanner_service()
    config = scanner_service.get_scanner_for_ip(ip)
    if not config:
        raise HTTPException(status_code=404, detail="No suitable scanner found for this IP")
    return config


@router.get("/scanners/recommendation")
@handle_service_errors
async def get_scanner_recommendation(
    target: str = Query(..., description="Target IP or subnet to get scanner recommendation for"),
    current_user: User = Depends(get_current_active_user),
    services: ServiceFactory = Depends(get_services)
):
    """Get scanner recommendation for a target network."""
    try:
        scan_service = services.get_scan_service()
        return scan_service.get_scanner_recommendation(target, current_user)
    except Exception as e:
        logger.error(f"Error in scanner recommendation endpoint: {e}")
        raise HTTPException(status_code=422, detail=f"Error getting scanner recommendation: {str(e)}")


@router.get("/scanners/{config_id}", response_model=schemas.ScannerConfig)
@router.get("/scanner-configs/{config_id}", response_model=schemas.ScannerConfig)
@handle_service_errors
async def get_scanner_config(
    config_id: int,
    services: ServiceFactory = Depends(get_services)
):
    """Get a scanner configuration by ID."""
    scanner_service = services.get_scanner_service()
    config = scanner_service.get_scanner_config(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Scanner configuration not found")
    return config


@router.put("/scanners/{config_id}", response_model=schemas.ScannerConfig)
@router.put("/scanner-configs/{config_id}", response_model=schemas.ScannerConfig)
@handle_service_errors
async def update_scanner_config(
    config_id: int,
    config: schemas.ScannerConfigUpdate,
    current_user: User = Depends(require_scanners_write),
    services: ServiceFactory = Depends(get_services)
):
    """Update a scanner configuration."""
    scanner_service = services.get_scanner_service()
    updated_config = scanner_service.update_scanner_config(config_id, config)
    if not updated_config:
        raise HTTPException(status_code=404, detail="Scanner configuration not found")
    return updated_config


@router.delete("/scanners/{config_id}")
@router.delete("/scanner-configs/{config_id}")
@handle_service_errors
async def delete_scanner_config(
    config_id: int,
    current_user: User = Depends(require_scanners_write),
    services: ServiceFactory = Depends(get_services)
):
    """Delete a scanner configuration."""
    scanner_service = services.get_scanner_service()
    success = scanner_service.delete_scanner_config(config_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scanner configuration not found")
    return {"message": "Scanner configuration deleted successfully"}


@router.get("/scanners/{config_id}/health")
@handle_service_errors
async def check_scanner_health(
    config_id: int,
    services: ServiceFactory = Depends(get_services)
):
    """Check the health of a scanner configuration."""
    scanner_service = services.get_scanner_service()
    return scanner_service.check_scanner_health(config_id)


@router.get("/scanners/health/all")
@handle_service_errors
async def check_all_scanners_health(
    services: ServiceFactory = Depends(get_services)
):
    """Check the health of all active scanner configurations."""
    scanner_service = services.get_scanner_service()
    return scanner_service.check_all_scanners_health()


@router.post("/scanners/{config_id}/test")
@handle_service_errors
async def test_scanner_connection(
    config_id: int,
    test_ip: str = Query("127.0.0.1"),
    current_user: User = Depends(require_scanners_write),
    services: ServiceFactory = Depends(get_services)
):
    """Test the connection of a scanner configuration to a target IP."""
    scanner_service = services.get_scanner_service()
    result = scanner_service.test_scanner_connection(config_id, test_ip)
    return {"message": "Connection test initiated", "result": result}


@router.post("/scanners/sync-settings")
@handle_service_errors
async def sync_scanners_with_settings(
    current_user: User = Depends(require_scanners_write),
    services: ServiceFactory = Depends(get_services)
):
    """Sync scanner configurations with the Settings table."""
    scanner_service = services.get_scanner_service()
    return scanner_service.sync_with_settings()


# Scan task routes with improved error handling
@router.get("/scan-tasks", response_model=List[schemas.ScanTask])
@handle_service_errors
async def list_scan_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_discovery_read),
    services: ServiceFactory = Depends(get_services)
):
    """List scan tasks."""
    scan_service = services.get_scan_service()
    return scan_service.get_scan_tasks(skip=skip, limit=limit, status=status)


@router.post("/scan-tasks", response_model=schemas.ScanTask)
@handle_service_errors
async def create_scan_task(
    task: schemas.ScanTaskCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_discovery_write),
    services: ServiceFactory = Depends(get_services)
):
    """Create and start a new scan task."""
    scan_service = services.get_scan_service()
    
    # Check if there's already an active scan
    active_scan = scan_service.get_active_scan_task()
    if active_scan:
        raise HTTPException(
            status_code=409, 
            detail="Another scan is already running. Please wait for it to complete or cancel it first."
        )
    
    scan_task = scan_service.create_scan_task(task)
    
    # Start the scan in the background
    background_tasks.add_task(scan_service.run_scan_task, scan_task.id)
    
    return scan_task


@router.get("/scan-tasks/active", response_model=Optional[schemas.ScanTask])
@handle_service_errors
async def get_active_scan_task(
    current_user: User = Depends(require_discovery_read),
    services: ServiceFactory = Depends(get_services)
):
    """Get the currently active scan task."""
    scan_service = services.get_scan_service()
    return scan_service.get_active_scan_task()


@router.get("/scan-tasks/statistics")
@handle_service_errors
async def get_scan_statistics(
    current_user: User = Depends(require_discovery_read),
    services: ServiceFactory = Depends(get_services)
):
    """Get scan task statistics."""
    scan_service = services.get_scan_service()
    return scan_service.get_scan_statistics()


@router.get("/scan-tasks/{task_id}", response_model=schemas.ScanTask)
@handle_service_errors
async def get_scan_task(
    task_id: int,
    current_user: User = Depends(require_discovery_read),
    services: ServiceFactory = Depends(get_services)
):
    """Get a specific scan task."""
    scan_service = services.get_scan_service()
    return scan_service.get_scan_task(task_id)


@router.put("/scan-tasks/{task_id}", response_model=schemas.ScanTask)
@handle_service_errors
async def update_scan_task(
    task_id: int,
    task: schemas.ScanTaskUpdate,
    current_user: User = Depends(require_discovery_write),
    services: ServiceFactory = Depends(get_services)
):
    """Update a scan task."""
    scan_service = services.get_scan_service()
    return scan_service.update_scan_task(task_id, task)


@router.post("/scan-tasks/{task_id}/cancel", status_code=200)
@handle_service_errors
async def cancel_scan_task(
    task_id: int,
    current_user: User = Depends(require_discovery_write),
    services: ServiceFactory = Depends(get_services)
):
    """Cancel a scan task."""
    scan_service = services.get_scan_service()
    return scan_service.cancel_scan_task(task_id)


@router.get("/scan-tasks/{task_id}/results")
@handle_service_errors
async def get_scan_results(
    task_id: int,
    current_user: User = Depends(require_discovery_read),
    services: ServiceFactory = Depends(get_services)
):
    """Get scan results for a specific task."""
    scan_service = services.get_scan_service()
    return scan_service.get_scan_results(task_id)


@router.get("/scan-tasks/{task_id}/download")
@handle_service_errors
async def download_scan_results(
    task_id: int,
    current_user: User = Depends(require_discovery_read),
    services: ServiceFactory = Depends(get_services)
):
    """Download scan results for a specific task."""
    scan_service = services.get_scan_service()
    return scan_service.download_scan_results(task_id)


# Asset routes with improved error handling
@router.get("/assets", response_model=List[schemas.Asset])
@router.get("/devices", response_model=List[schemas.Asset])  # Alias for frontend compatibility
@handle_service_errors
async def list_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    label_ids: Optional[List[int]] = Query(None),
    search: Optional[str] = Query(None),
    is_managed: Optional[bool] = Query(None),
    current_user: User = Depends(require_assets_read),
    services: ServiceFactory = Depends(get_services)
):
    """List assets with optional filtering."""
    asset_service = services.get_asset_service()
    return asset_service.get_assets(
        skip=skip,
        limit=limit,
        label_ids=label_ids,
        search=search,
        is_managed=is_managed
    )


@router.post("/assets", response_model=schemas.Asset)
@handle_service_errors
async def create_asset(
    asset: schemas.AssetCreate,
    current_user: User = Depends(require_assets_write),
    services: ServiceFactory = Depends(get_services)
):
    """Create a new asset."""
    asset_service = services.get_asset_service()
    return asset_service.create_asset(asset)


@router.get("/assets/{asset_id}", response_model=schemas.Asset)
@handle_service_errors
async def get_asset(
    asset_id: int,
    current_user: User = Depends(require_assets_read),
    services: ServiceFactory = Depends(get_services)
):
    """Get an asset by ID."""
    asset_service = services.get_asset_service()
    asset = asset_service.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.put("/assets/{asset_id}", response_model=schemas.Asset)
@handle_service_errors
async def update_asset(
    asset_id: int,
    asset: schemas.AssetUpdate,
    current_user: User = Depends(require_assets_write),
    services: ServiceFactory = Depends(get_services)
):
    """Update an asset."""
    asset_service = services.get_asset_service()
    updated_asset = asset_service.update_asset(asset_id, asset)
    if not updated_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return updated_asset


@router.delete("/assets/{asset_id}")
@handle_service_errors
async def delete_asset(
    asset_id: int,
    current_user: User = Depends(require_assets_write),
    services: ServiceFactory = Depends(get_services)
):
    """Delete an asset."""
    asset_service = services.get_asset_service()
    success = asset_service.delete_asset(asset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Asset deleted successfully"}


# Asset Group routes
@router.get("/asset-groups", response_model=List[schemas.AssetGroup])
@handle_service_errors
async def list_asset_groups(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_assets_read),
    services: ServiceFactory = Depends(get_services)
):
    """List asset groups with optional filtering."""
    asset_service = services.get_asset_service()
    return asset_service.get_asset_groups(
        skip=skip,
        limit=limit,
        is_active=is_active
    )


@router.post("/asset-groups", response_model=schemas.AssetGroup)
@handle_service_errors
async def create_asset_group(
    group: schemas.AssetGroupCreate,
    current_user: User = Depends(require_assets_write),
    services: ServiceFactory = Depends(get_services)
):
    """Create a new asset group."""
    asset_service = services.get_asset_service()
    return asset_service.create_asset_group(group)


@router.get("/asset-groups/{group_id}", response_model=schemas.AssetGroup)
@handle_service_errors
async def get_asset_group(
    group_id: int,
    current_user: User = Depends(require_assets_read),
    services: ServiceFactory = Depends(get_services)
):
    """Get an asset group by ID."""
    asset_service = services.get_asset_service()
    group = asset_service.get_asset_group(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Asset group not found")
    return group


@router.put("/asset-groups/{group_id}", response_model=schemas.AssetGroup)
@handle_service_errors
async def update_asset_group(
    group_id: int,
    group: schemas.AssetGroupUpdate,
    current_user: User = Depends(require_assets_write),
    services: ServiceFactory = Depends(get_services)
):
    """Update an asset group."""
    asset_service = services.get_asset_service()
    updated_group = asset_service.update_asset_group(group_id, group)
    if not updated_group:
        raise HTTPException(status_code=404, detail="Asset group not found")
    return updated_group


@router.delete("/asset-groups/{group_id}")
@handle_service_errors
async def delete_asset_group(
    group_id: int,
    current_user: User = Depends(require_assets_write),
    services: ServiceFactory = Depends(get_services)
):
    """Delete an asset group."""
    asset_service = services.get_asset_service()
    success = asset_service.delete_asset_group(group_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset group not found")
    return {"message": "Asset group deleted successfully"}


# Settings routes
@router.get("/settings")
@handle_service_errors
async def get_settings(
    current_user: User = Depends(require_settings_read),
    services: ServiceFactory = Depends(get_services)
):
    """Get application settings."""
    asset_service = services.get_asset_service()
    settings = asset_service.get_settings()
    if not settings:
        settings = asset_service.create_default_settings()
    return settings


@router.put("/settings")
@handle_service_errors
async def update_settings(
    settings_data: dict,
    current_user: User = Depends(require_settings_write),
    services: ServiceFactory = Depends(get_services)
):
    """Update application settings."""
    asset_service = services.get_asset_service()
    return asset_service.update_settings(settings_data)


# User management routes
@router.get("/users", response_model=List[schemas.User])
@handle_service_errors
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_users_read),
    services: ServiceFactory = Depends(get_services)
):
    """List users."""
    auth_service = services.get_auth_service()
    return auth_service.get_users(skip=skip, limit=limit)


# Role management routes
@router.get("/roles", response_model=List[schemas.Role])
@handle_service_errors
async def list_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles_read),
    services: ServiceFactory = Depends(get_services)
):
    """List roles."""
    auth_service = services.get_auth_service()
    return auth_service.get_roles(skip=skip, limit=limit)


# Subnet routes
@router.get("/subnets", response_model=List[schemas.Subnet])
@handle_service_errors
async def list_subnets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_subnets_read),
    services: ServiceFactory = Depends(get_services)
):
    """List subnets."""
    subnet_service = services.get_subnet_service()
    return subnet_service.get_subnets(skip=skip, limit=limit)


# API Key routes
@router.get("/api-keys", response_model=List[schemas.APIKey])
@handle_service_errors
async def list_api_keys(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_admin),
    services: ServiceFactory = Depends(get_services)
):
    """List API keys."""
    api_key_service = services.get_api_key_service()
    return api_key_service.get_api_keys(skip=skip, limit=limit)


# LDAP routes
@router.get("/ldap/configs", response_model=List[schemas.LDAPConfig])
@handle_service_errors
async def list_ldap_configs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_admin),
    services: ServiceFactory = Depends(get_services)
):
    """List LDAP configurations."""
    ldap_service = services.get_ldap_service()
    return ldap_service.get_ldap_configs(skip=skip, limit=limit)


# Credential routes
@router.get("/credentials", response_model=List[schemas.Credential])
@handle_service_errors
async def list_credentials(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_credentials_read),
    services: ServiceFactory = Depends(get_services)
):
    """List credentials."""
    credential_service = services.get_credential_service()
    return credential_service.get_credentials(skip=skip, limit=limit)
