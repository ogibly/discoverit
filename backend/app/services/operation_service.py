"""
Operation service for managing operations and jobs.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from ..models import Operation, Job, Asset, AssetGroup, Label
from ..schemas import OperationCreate, OperationUpdate, OperationRun, JobCreate
import requests
import json
from datetime import datetime
import asyncio
import concurrent.futures


class OperationService:
    def __init__(self, db: Session):
        self.db = db

    def create_operation(self, operation_data: OperationCreate) -> Operation:
        """Create a new operation."""
        operation = Operation(**operation_data.dict())
        self.db.add(operation)
        self.db.commit()
        self.db.refresh(operation)
        return operation

    def get_operation(self, operation_id: int) -> Optional[Operation]:
        """Get an operation by ID."""
        return self.db.query(Operation).options(
            joinedload(Operation.jobs),
            joinedload(Operation.target_group)
        ).filter(Operation.id == operation_id).first()

    def get_operations(
        self, 
        skip: int = 0, 
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[Operation]:
        """Get operations with optional filtering."""
        query = self.db.query(Operation).options(
            joinedload(Operation.jobs),
            joinedload(Operation.target_group)
        )
        
        if is_active is not None:
            query = query.filter(Operation.is_active == is_active)
        
        return query.order_by(desc(Operation.created_at)).offset(skip).limit(limit).all()

    def update_operation(self, operation_id: int, operation_data: OperationUpdate) -> Optional[Operation]:
        """Update an operation."""
        operation = self.get_operation(operation_id)
        if not operation:
            return None
        
        update_data = operation_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(operation, field, value)
        
        operation.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(operation)
        return operation

    def delete_operation(self, operation_id: int) -> bool:
        """Delete an operation."""
        operation = self.db.query(Operation).filter(Operation.id == operation_id).first()
        if not operation:
            return False
        
        self.db.delete(operation)
        self.db.commit()
        return True

    def run_operation(self, operation_run: OperationRun) -> Job:
        """Run an operation on specified targets."""
        # Get or create operation
        if operation_run.operation_id:
            operation = self.get_operation(operation_run.operation_id)
        elif operation_run.operation_name:
            operation = self.db.query(Operation).filter(
                Operation.name == operation_run.operation_name
            ).first()
            if not operation:
                # Create a temporary operation
                operation = Operation(
                    name=operation_run.operation_name,
                    operation_type="api_call",
                    is_active=True
                )
                self.db.add(operation)
                self.db.commit()
                self.db.refresh(operation)
        else:
            raise ValueError("Either operation_id or operation_name must be provided")
        
        if not operation:
            raise ValueError("Operation not found")
        
        # Get target assets
        target_assets = self._get_target_assets(operation_run)
        
        # Create job
        job = Job(
            operation_id=operation.id,
            asset_ids=[asset.id for asset in target_assets],
            asset_group_ids=operation_run.asset_group_ids,
            target_labels=operation_run.target_labels,
            params=operation_run.params,
            status="pending",
            created_by=operation_run.params.get("created_by") if operation_run.params else None
        )
        
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        
        return job

    def _get_target_assets(self, operation_run: OperationRun) -> List[Asset]:
        """Get assets based on operation run parameters."""
        assets = []
        
        # Get assets by IDs
        if operation_run.asset_ids:
            assets.extend(
                self.db.query(Asset).filter(Asset.id.in_(operation_run.asset_ids)).all()
            )
        
        # Get assets from groups
        if operation_run.asset_group_ids:
            for group_id in operation_run.asset_group_ids:
                group = self.db.query(AssetGroup).options(
                    joinedload(AssetGroup.assets)
                ).filter(AssetGroup.id == group_id).first()
                if group:
                    assets.extend(group.assets)
        
        # Get assets by labels
        if operation_run.target_labels:
            label_assets = self.db.query(Asset).join(Asset.labels).filter(
                Label.id.in_(operation_run.target_labels)
            ).all()
            assets.extend(label_assets)
        
        # Remove duplicates
        unique_assets = list({asset.id: asset for asset in assets}.values())
        return unique_assets

    def execute_job(self, job_id: int) -> None:
        """Execute a job in the background."""
        job = self.get_job(job_id)
        if not job:
            return
        
        try:
            job.status = "running"
            job.start_time = datetime.utcnow()
            self.db.commit()
            
            # Get target assets
            target_assets = self.db.query(Asset).filter(
                Asset.id.in_(job.asset_ids or [])
            ).all()
            
            results = []
            total_assets = len(target_assets)
            
            for i, asset in enumerate(target_assets):
                # Check for cancellation
                self.db.refresh(job)
                if job.status == "cancelled":
                    break
                
                # Update progress
                job.current_asset = asset.name
                job.progress = int(((i + 1) / total_assets) * 100) if total_assets > 0 else 0
                self.db.commit()
                
                # Execute operation on asset
                result = self._execute_operation_on_asset(job.operation, asset, job.params)
                results.append(result)
            
            # Mark job as completed
            if job.status != "cancelled":
                job.status = "completed"
                job.progress = 100
            job.results = results
            job.end_time = datetime.utcnow()
            self.db.commit()
            
        except Exception as e:
            # Mark job as failed
            job.status = "failed"
            job.error_message = str(e)
            job.end_time = datetime.utcnow()
            self.db.commit()

    def _execute_operation_on_asset(self, operation: Operation, asset: Asset, params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Execute an operation on a single asset."""
        try:
            if operation.operation_type == "awx_playbook":
                return self._execute_awx_playbook(operation, asset, params)
            elif operation.operation_type == "api_call":
                return self._execute_api_call(operation, asset, params)
            elif operation.operation_type == "script":
                return self._execute_script(operation, asset, params)
            else:
                return {
                    "asset_id": asset.id,
                    "asset_name": asset.name,
                    "status": "failed",
                    "error": f"Unknown operation type: {operation.operation_type}"
                }
        except Exception as e:
            return {
                "asset_id": asset.id,
                "asset_name": asset.name,
                "status": "failed",
                "error": str(e)
            }

    def _execute_awx_playbook(self, operation: Operation, asset: Asset, params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Execute an AWX playbook on an asset."""
        try:
            from .awx_service import AWXService
            
            # Get AWX settings from database
            settings = self.db.query(models.Settings).first()
            if not settings or not settings.awx_url:
                raise ValueError("AWX Tower not configured")
            
            # Initialize AWX service
            awx_service = AWXService(
                awx_url=settings.awx_url,
                username=settings.awx_username or "",
                password=settings.awx_password or ""
            )
            
            # Test connection
            if not awx_service.test_connection():
                raise Exception("Failed to connect to AWX Tower")
            
            # Prepare asset data
            asset_data = {
                "id": asset.id,
                "name": asset.name,
                "primary_ip": asset.primary_ip,
                "hostname": asset.hostname,
                "mac_address": asset.mac_address,
                "username": asset.username,
                "ssh_key": asset.ssh_key,
                "os_name": asset.os_name,
                "manufacturer": asset.manufacturer,
                "model": asset.model
            }
            
            # Merge extra vars
            extra_vars = operation.awx_extra_vars or {}
            if params:
                extra_vars.update(params)
            
            # Run playbook
            result = awx_service.run_playbook_on_assets(
                playbook_name=operation.awx_playbook_name,
                assets=[asset_data],
                extra_vars=extra_vars,
                job_name=f"{operation.name}_{asset.name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            )
            
            return {
                "asset_id": asset.id,
                "asset_name": asset.name,
                "status": "success",
                "operation_type": "awx_playbook",
                "playbook": operation.awx_playbook_name,
                "awx_job_id": result["job_id"],
                "awx_job_url": result["job_url"],
                "response": "AWX playbook launched successfully"
            }
            
        except Exception as e:
            return {
                "asset_id": asset.id,
                "asset_name": asset.name,
                "status": "failed",
                "operation_type": "awx_playbook",
                "playbook": operation.awx_playbook_name,
                "error": str(e)
            }

    def _execute_api_call(self, operation: Operation, asset: Asset, params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Execute an API call for an asset."""
        if not operation.api_url:
            raise ValueError("API URL not configured")
        
        # Replace placeholders in URL with asset data
        url = operation.api_url.replace("{ip}", asset.primary_ip or "")
        url = url.replace("{hostname}", asset.hostname or "")
        url = url.replace("{name}", asset.name)
        
        # Make the API call
        response = requests.request(
            method=operation.api_method or "GET",
            url=url,
            headers=operation.api_headers or {},
            json=operation.api_body,
            timeout=30
        )
        
        return {
            "asset_id": asset.id,
            "asset_name": asset.name,
            "status": "success" if response.status_code < 400 else "failed",
            "operation_type": "api_call",
            "status_code": response.status_code,
            "response": response.text[:1000]  # Limit response size
        }

    def _execute_script(self, operation: Operation, asset: Asset, params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Execute a script on an asset."""
        # This would execute a script (SSH, PowerShell, etc.)
        # For now, return a mock response
        return {
            "asset_id": asset.id,
            "asset_name": asset.name,
            "status": "success",
            "operation_type": "script",
            "script": operation.script_path,
            "response": "Script execution completed successfully"
        }

    def get_job(self, job_id: int) -> Optional[Job]:
        """Get a job by ID."""
        return self.db.query(Job).options(
            joinedload(Job.operation)
        ).filter(Job.id == job_id).first()

    def get_jobs(
        self, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[Job]:
        """Get jobs with optional filtering."""
        query = self.db.query(Job).options(
            joinedload(Job.operation)
        )
        
        if status:
            query = query.filter(Job.status == status)
        
        return query.order_by(desc(Job.created_at)).offset(skip).limit(limit).all()

    def cancel_job(self, job_id: int) -> bool:
        """Cancel a running job."""
        job = self.get_job(job_id)
        if not job or job.status not in ["pending", "running"]:
            return False
        
        job.status = "cancelled"
        job.end_time = datetime.utcnow()
        self.db.commit()
        return True
