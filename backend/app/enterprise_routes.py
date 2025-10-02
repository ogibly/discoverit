"""
Enterprise enhancement API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from .db_utils import get_db
from .services.audit_service import AuditService
from .services.template_service import TemplateService
from .services.webhook_service import WebhookService
from .services.asset_service import AssetService
from .auth import (
    get_current_active_user, require_permission, require_permissions, require_admin,
    require_assets_read, require_assets_write, require_discovery_read, require_discovery_write,
    require_scanners_read, require_scanners_write, require_credentials_read, require_credentials_write,
    require_users_read, require_users_write, require_roles_read, require_roles_write,
    require_settings_read, require_settings_write
)
from . import schemas
from .models import User, ScanTemplate
import json

router = APIRouter()

# Audit Logging Routes
@router.get("/audit-logs", response_model=List[schemas.AuditLog])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[int] = Query(None),
    resource_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get audit logs with filtering."""
    service = AuditService(db)
    return service.get_audit_logs(
        skip=skip,
        limit=limit,
        user_id=user_id,
        resource_type=resource_type,
        action=action,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/audit-logs/summary")
def get_audit_summary(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get audit log summary statistics."""
    service = AuditService(db)
    return service.get_audit_summary(start_date=start_date, end_date=end_date)

# Scan Template Routes
@router.get("/scan-templates", response_model=List[schemas.ScanTemplate])
def get_scan_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_system: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(require_discovery_read),
    db: Session = Depends(get_db)
):
    """Get scan templates."""
    service = TemplateService(db)
    return service.get_scan_templates(
        skip=skip,
        limit=limit,
        is_system=is_system,
        is_active=is_active
    )

@router.get("/scan-templates/{template_id}", response_model=schemas.ScanTemplate)
def get_scan_template(
    template_id: int,
    current_user: User = Depends(require_discovery_read),
    db: Session = Depends(get_db)
):
    """Get a scan template by ID."""
    service = TemplateService(db)
    template = service.get_scan_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Scan template not found")
    return template

@router.post("/scan-templates", response_model=schemas.ScanTemplate)
def create_scan_template(
    template_data: schemas.ScanTemplateCreate,
    current_user: User = Depends(require_discovery_write),
    db: Session = Depends(get_db)
):
    """Create a new scan template."""
    service = TemplateService(db)
    audit_service = AuditService(db)
    
    template = service.create_scan_template(template_data, current_user.id)
    
    # Log the action
    audit_service.log_action(
        action="CREATE",
        resource_type="scan_template",
        user_id=current_user.id,
        resource_id=template.id,
        resource_name=template.name
    )
    
    return template

@router.put("/scan-templates/{template_id}", response_model=schemas.ScanTemplate)
def update_scan_template(
    template_id: int,
    template_data: schemas.ScanTemplateUpdate,
    current_user: User = Depends(require_discovery_write),
    db: Session = Depends(get_db)
):
    """Update a scan template."""
    service = TemplateService(db)
    audit_service = AuditService(db)
    
    template = service.update_scan_template(template_id, template_data)
    if not template:
        raise HTTPException(status_code=404, detail="Scan template not found")
    
    # Log the action
    audit_service.log_action(
        action="UPDATE",
        resource_type="scan_template",
        user_id=current_user.id,
        resource_id=template.id,
        resource_name=template.name
    )
    
    return template

@router.delete("/scan-templates/{template_id}", status_code=204)
def delete_scan_template(
    template_id: int,
    current_user: User = Depends(require_discovery_write),
    db: Session = Depends(get_db)
):
    """Delete a scan template."""
    service = TemplateService(db)
    audit_service = AuditService(db)
    
    template = service.get_scan_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Scan template not found")
    
    if not service.delete_scan_template(template_id):
        raise HTTPException(status_code=400, detail="Cannot delete system template")
    
    # Log the action
    audit_service.log_action(
        action="DELETE",
        resource_type="scan_template",
        user_id=current_user.id,
        resource_id=template_id,
        resource_name=template.name
    )

# Asset Template Routes
@router.get("/asset-templates", response_model=List[schemas.AssetTemplate])
def get_asset_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_system: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None),
    device_type: Optional[str] = Query(None),
    current_user: User = Depends(require_assets_read),
    db: Session = Depends(get_db)
):
    """Get asset templates."""
    service = TemplateService(db)
    return service.get_asset_templates(
        skip=skip,
        limit=limit,
        is_system=is_system,
        is_active=is_active,
        device_type=device_type
    )

@router.get("/asset-templates/{template_id}", response_model=schemas.AssetTemplate)
def get_asset_template(
    template_id: int,
    current_user: User = Depends(require_assets_read),
    db: Session = Depends(get_db)
):
    """Get an asset template by ID."""
    service = TemplateService(db)
    template = service.get_asset_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Asset template not found")
    return template

@router.post("/asset-templates", response_model=schemas.AssetTemplate)
def create_asset_template(
    template_data: schemas.AssetTemplateCreate,
    current_user: User = Depends(require_assets_write),
    db: Session = Depends(get_db)
):
    """Create a new asset template."""
    service = TemplateService(db)
    audit_service = AuditService(db)
    
    template = service.create_asset_template(template_data, current_user.id)
    
    # Log the action
    audit_service.log_action(
        action="CREATE",
        resource_type="asset_template",
        user_id=current_user.id,
        resource_id=template.id,
        resource_name=template.name
    )
    
    return template

@router.put("/asset-templates/{template_id}", response_model=schemas.AssetTemplate)
def update_asset_template(
    template_id: int,
    template_data: schemas.AssetTemplateUpdate,
    current_user: User = Depends(require_assets_write),
    db: Session = Depends(get_db)
):
    """Update an asset template."""
    service = TemplateService(db)
    audit_service = AuditService(db)
    
    template = service.update_asset_template(template_id, template_data)
    if not template:
        raise HTTPException(status_code=404, detail="Asset template not found")
    
    # Log the action
    audit_service.log_action(
        action="UPDATE",
        resource_type="asset_template",
        user_id=current_user.id,
        resource_id=template.id,
        resource_name=template.name
    )
    
    return template

@router.delete("/asset-templates/{template_id}", status_code=204)
def delete_asset_template(
    template_id: int,
    current_user: User = Depends(require_assets_write),
    db: Session = Depends(get_db)
):
    """Delete an asset template."""
    service = TemplateService(db)
    audit_service = AuditService(db)
    
    template = service.get_asset_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Asset template not found")
    
    if not service.delete_asset_template(template_id):
        raise HTTPException(status_code=400, detail="Cannot delete system template")
    
    # Log the action
    audit_service.log_action(
        action="DELETE",
        resource_type="asset_template",
        user_id=current_user.id,
        resource_id=template_id,
        resource_name=template.name
    )

# Webhook Routes
@router.get("/webhooks", response_model=List[schemas.Webhook])
def get_webhooks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get webhooks."""
    service = WebhookService(db)
    return service.get_webhooks(skip=skip, limit=limit, is_active=is_active)

@router.get("/webhooks/{webhook_id}", response_model=schemas.Webhook)
def get_webhook(
    webhook_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get a webhook by ID."""
    service = WebhookService(db)
    webhook = service.get_webhook(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return webhook

@router.post("/webhooks", response_model=schemas.Webhook)
def create_webhook(
    webhook_data: schemas.WebhookCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new webhook."""
    service = WebhookService(db)
    audit_service = AuditService(db)
    
    webhook = service.create_webhook(webhook_data, current_user.id)
    
    # Log the action
    audit_service.log_action(
        action="CREATE",
        resource_type="webhook",
        user_id=current_user.id,
        resource_id=webhook.id,
        resource_name=webhook.name
    )
    
    return webhook

@router.put("/webhooks/{webhook_id}", response_model=schemas.Webhook)
def update_webhook(
    webhook_id: int,
    webhook_data: schemas.WebhookUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a webhook."""
    service = WebhookService(db)
    audit_service = AuditService(db)
    
    webhook = service.update_webhook(webhook_id, webhook_data)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    # Log the action
    audit_service.log_action(
        action="UPDATE",
        resource_type="webhook",
        user_id=current_user.id,
        resource_id=webhook.id,
        resource_name=webhook.name
    )
    
    return webhook

@router.delete("/webhooks/{webhook_id}", status_code=204)
def delete_webhook(
    webhook_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete a webhook."""
    service = WebhookService(db)
    audit_service = AuditService(db)
    
    webhook = service.get_webhook(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    service.delete_webhook(webhook_id)
    
    # Log the action
    audit_service.log_action(
        action="DELETE",
        resource_type="webhook",
        user_id=current_user.id,
        resource_id=webhook_id,
        resource_name=webhook.name
    )

@router.get("/webhooks/{webhook_id}/deliveries", response_model=List[schemas.WebhookDelivery])
def get_webhook_deliveries(
    webhook_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get webhook delivery history."""
    service = WebhookService(db)
    return service.get_webhook_deliveries(webhook_id, skip=skip, limit=limit)

@router.get("/webhooks/{webhook_id}/stats")
def get_webhook_stats(
    webhook_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get webhook statistics."""
    service = WebhookService(db)
    return service.get_webhook_stats(webhook_id)

# Bulk Operations Routes
@router.post("/assets/bulk-create", response_model=schemas.BulkOperationResult)
def bulk_create_assets(
    bulk_data: schemas.BulkAssetCreate,
    current_user: User = Depends(require_assets_write),
    db: Session = Depends(get_db)
):
    """Create multiple assets in bulk."""
    service = AssetService(db)
    audit_service = AuditService(db)
    
    created_ids = []
    errors = []
    
    for asset_data in bulk_data.assets:
        try:
            # Apply template if specified
            if bulk_data.template_id:
                template_service = TemplateService(db)
                template = template_service.get_asset_template(bulk_data.template_id)
                if template:
                    # Merge template data with provided data
                    template_data = template.template_data.copy()
                    template_data.update(asset_data)
                    asset_data = template_data
            
            # Create asset
            asset = service.create_asset_from_dict(asset_data)
            created_ids.append(asset.id)
            
            # Apply labels and groups
            if bulk_data.apply_labels:
                service.add_labels_to_asset(asset.id, bulk_data.apply_labels)
            if bulk_data.apply_groups:
                service.add_groups_to_asset(asset.id, bulk_data.apply_groups)
            
            # Log the action
            audit_service.log_asset_action(
                action="CREATE",
                asset_id=asset.id,
                asset_name=asset.name,
                user_id=current_user.id
            )
            
        except Exception as e:
            errors.append({
                "asset_data": asset_data,
                "error": str(e)
            })
    
    return schemas.BulkOperationResult(
        success_count=len(created_ids),
        failure_count=len(errors),
        errors=errors,
        created_ids=created_ids
    )

@router.post("/assets/bulk-update", response_model=schemas.BulkOperationResult)
def bulk_update_assets(
    bulk_data: schemas.BulkAssetUpdate,
    current_user: User = Depends(require_assets_write),
    db: Session = Depends(get_db)
):
    """Update multiple assets in bulk."""
    service = AssetService(db)
    audit_service = AuditService(db)
    
    updated_ids = []
    errors = []
    
    for asset_id in bulk_data.asset_ids:
        try:
            asset = service.get_asset(asset_id)
            if not asset:
                errors.append({
                    "asset_id": asset_id,
                    "error": "Asset not found"
                })
                continue
            
            # Update asset
            service.update_asset(asset_id, bulk_data.updates)
            updated_ids.append(asset_id)
            
            # Apply labels and groups
            if bulk_data.apply_labels:
                service.add_labels_to_asset(asset_id, bulk_data.apply_labels)
            if bulk_data.apply_groups:
                service.add_groups_to_asset(asset_id, bulk_data.apply_groups)
            
            # Log the action
            audit_service.log_asset_action(
                action="UPDATE",
                asset_id=asset_id,
                asset_name=asset.name,
                user_id=current_user.id,
                changes=bulk_data.updates
            )
            
        except Exception as e:
            errors.append({
                "asset_id": asset_id,
                "error": str(e)
            })
    
    return schemas.BulkOperationResult(
        success_count=len(updated_ids),
        failure_count=len(errors),
        errors=errors,
        updated_ids=updated_ids
    )

# Enhanced Discovery Routes
@router.post("/discovery/enhanced", response_model=schemas.DiscoveryResult)
def enhanced_discovery(
    discovery_config: schemas.DiscoveryConfig,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_discovery_write),
    db: Session = Depends(get_db)
):
    """Start an enhanced discovery scan with advanced configuration."""
    from .services.scan_service import ScanServiceV2
    
    service = ScanServiceV2(db)
    audit_service = AuditService(db)
    
    # Apply scan template - template is required
    if not discovery_config.scan_template_id:
        raise HTTPException(status_code=400, detail="scan_template_id is required for enhanced discovery")
    
    template_service = TemplateService(db)
    template = template_service.get_scan_template(discovery_config.scan_template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Scan template not found")
    
    # Use template configuration
    template_config = template.scan_config.copy()
    
    # Increment template usage
    template_service.increment_scan_template_usage(discovery_config.scan_template_id)
    
    # Start the scan
    scan_task = service.create_enhanced_scan_task(
        name=f"Enhanced Discovery - {discovery_config.target}",
        target=discovery_config.target,
        scan_config=template_config,
        scanner_id=discovery_config.scanner_id,
        credentials=discovery_config.credentials,
        created_by=current_user.username
    )
    
    # Log the action
    audit_service.log_scan_action(
        action="CREATE",
        scan_task_id=scan_task.id,
        scan_name=scan_task.name,
        user_id=current_user.id,
        details={
            "target": discovery_config.target,
            "scan_type": template_config.get("scan_type", "standard"),
            "template_id": discovery_config.scan_template_id
        }
    )
    
    # Trigger webhooks
    webhook_service = WebhookService(db)
    background_tasks.add_task(
        webhook_service.trigger_webhooks_for_event,
        "scan.started",
        {
            "scan_task_id": scan_task.id,
            "scan_name": scan_task.name,
            "target": discovery_config.target,
            "scan_type": template_config.get("scan_type", "standard"),
            "template_id": discovery_config.scan_template_id,
            "user_id": current_user.id
        }
    )
    
    return schemas.DiscoveryResult(
        scan_task_id=scan_task.id,
        discovered_devices=0,  # Will be updated as scan progresses
        scan_duration=0.0,     # Will be updated when scan completes
        success_rate=0.0,      # Will be updated when scan completes
        errors=[]
    )

# Template Initialization Route
@router.post("/templates/initialize-defaults")
def initialize_default_templates(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Initialize default system templates."""
    service = TemplateService(db)
    audit_service = AuditService(db)
    
    service.create_default_templates()
    
    # Log the action
    audit_service.log_action(
        action="INITIALIZE",
        resource_type="templates",
        user_id=current_user.id,
        details={"templates": ["scan_templates", "asset_templates"]}
    )
    
    return {"message": "Default templates initialized successfully"}