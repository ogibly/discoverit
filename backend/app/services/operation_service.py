import json
import asyncio
import subprocess
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from ..models import Operation, Job, Asset, AssetGroup, Credential, User
from ..schemas import OperationCreate, OperationUpdate, OperationRun, JobCreate, JobUpdate
import logging

logger = logging.getLogger(__name__)

class OperationService:
    def __init__(self, db: Session):
        self.db = db

    def create_operation(self, operation_data: OperationCreate, user_id: int) -> Operation:
        """Create a new operation."""
        operation = Operation(
            **operation_data.dict(),
            created_by=user_id
        )
        self.db.add(operation)
        self.db.commit()
        self.db.refresh(operation)
        return operation

    def get_operation(self, operation_id: int) -> Optional[Operation]:
        """Get an operation by ID."""
        return self.db.query(Operation).filter(Operation.id == operation_id).first()

    def get_operations(self, skip: int = 0, limit: int = 100) -> List[Operation]:
        """Get all operations with pagination."""
        return self.db.query(Operation).offset(skip).limit(limit).all()

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
        operation = self.get_operation(operation_id)
        if not operation:
            return False
        
        self.db.delete(operation)
        self.db.commit()
        return True

    def run_operation(self, run_data: OperationRun, user_id: int) -> Job:
        """Run an operation on specified targets."""
        operation = self.get_operation(run_data.operation_id)
        if not operation:
            raise ValueError(f"Operation {run_data.operation_id} not found")

        # Resolve target assets
        target_assets = self._resolve_target_assets(run_data, operation)
        if not target_assets:
            raise ValueError("No target assets found")

        # Create job
        job_data = JobCreate(
            operation_id=operation.id,
            asset_ids=[asset.id for asset in target_assets],
            total_assets=len(target_assets),
            status="pending",
            params=run_data.params or {}
        )
        
        job = Job(**job_data.dict(), created_by=user_id)
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)

        # Start execution asynchronously
        asyncio.create_task(self._execute_operation(job, operation, target_assets, run_data))
        
        return job

    def _resolve_target_assets(self, run_data: OperationRun, operation: Operation) -> List[Asset]:
        """Resolve target assets from various sources."""
        assets = []
        
        # From run data
        if run_data.asset_ids:
            assets.extend(self.db.query(Asset).filter(Asset.id.in_(run_data.asset_ids)).all())
        
        if run_data.asset_group_ids:
            for group_id in run_data.asset_group_ids:
                group = self.db.query(AssetGroup).filter(AssetGroup.id == group_id).first()
                if group:
                    assets.extend(group.assets)
        
        if run_data.target_labels:
            # Get assets with specific labels
            label_assets = self.db.query(Asset).join(Asset.labels).filter(
                Asset.labels.any(id.in_(run_data.target_labels))
            ).all()
            assets.extend(label_assets)
        
        # From operation configuration
        if not assets:
            if operation.target_assets:
                assets.extend(self.db.query(Asset).filter(Asset.id.in_(operation.target_assets)).all())
            
            if operation.target_asset_groups:
                for group_id in operation.target_asset_groups:
                    group = self.db.query(AssetGroup).filter(AssetGroup.id == group_id).first()
                    if group:
                        assets.extend(group.assets)
            
            if operation.target_labels:
                label_assets = self.db.query(Asset).join(Asset.labels).filter(
                    Asset.labels.any(id.in_(operation.target_labels))
                ).all()
                assets.extend(label_assets)
        
        # Remove duplicates
        unique_assets = list({asset.id: asset for asset in assets}.values())
        return unique_assets

    async def _execute_operation(self, job: Job, operation: Operation, assets: List[Asset], run_data: OperationRun):
        """Execute the operation on all target assets."""
        try:
            # Update job status
            job.status = "running"
            job.start_time = datetime.utcnow()
            self.db.commit()

            results = {}
            
            # Execute based on operation type
            if operation.operation_type == "awx":
                results = await self._execute_awx_operation(job, operation, assets, run_data)
            elif operation.operation_type == "api":
                results = await self._execute_api_operation(job, operation, assets, run_data)
            elif operation.operation_type == "script":
                results = await self._execute_script_operation(job, operation, assets, run_data)
            else:
                raise ValueError(f"Unsupported operation type: {operation.operation_type}")

            # Update job completion
            job.status = "completed"
            job.end_time = datetime.utcnow()
            job.progress = 100
            job.results = results
            job.summary = {
                "total_assets": len(assets),
                "successful": len([r for r in results.values() if r.get("success", False)]),
                "failed": len([r for r in results.values() if not r.get("success", False)]),
                "execution_time": (job.end_time - job.start_time).total_seconds()
            }
            self.db.commit()

        except Exception as e:
            logger.error(f"Operation execution failed: {e}")
            job.status = "failed"
            job.end_time = datetime.utcnow()
            job.error_message = str(e)
            self.db.commit()

    async def _execute_awx_operation(self, job: Job, operation: Operation, assets: List[Asset], run_data: OperationRun) -> Dict[str, Any]:
        """Execute AWX/Ansible Tower operation."""
        results = {}
        
        # Get AWX settings
        from .asset_service import AssetService
        asset_service = AssetService(self.db)
        awx_settings = asset_service.get_awx_settings()
        
        if not awx_settings.get("awx_connected"):
            raise ValueError("AWX Tower is not connected")
        
        # Prepare inventory
        inventory = self._prepare_awx_inventory(assets, operation)
        
        # Prepare extra variables
        extra_vars = operation.awx_extra_vars or {}
        if run_data.awx_extra_vars:
            extra_vars.update(run_data.awx_extra_vars)
        
        # Add asset-specific variables
        extra_vars.update({
            "target_assets": [{"ip": asset.primary_ip, "hostname": asset.hostname} for asset in assets],
            "job_id": job.id,
            "operation_name": operation.name
        })
        
        # Launch AWX job
        awx_payload = {
            "job_template": operation.awx_job_template_id,
            "inventory": inventory,
            "extra_vars": json.dumps(extra_vars),
            "limit": operation.awx_limit,
            "tags": operation.awx_tags,
            "skip_tags": operation.awx_skip_tags,
            "verbosity": operation.awx_verbosity
        }
        
        try:
            response = requests.post(
                f"{awx_settings['awx_url']}/api/v2/job_templates/{operation.awx_job_template_id}/launch/",
                json=awx_payload,
                auth=(awx_settings['awx_username'], awx_settings['awx_password']),
                timeout=30
            )
            
            if response.status_code == 201:
                awx_job_data = response.json()
                job.awx_job_id = str(awx_job_data['id'])
                job.awx_job_url = f"{awx_settings['awx_url']}/#/jobs/playbook/{awx_job_data['id']}"
                self.db.commit()
                
                # Monitor AWX job
                results = await self._monitor_awx_job(job, awx_settings, assets)
            else:
                raise Exception(f"AWX job launch failed: {response.text}")
                
        except Exception as e:
            logger.error(f"AWX operation failed: {e}")
            for asset in assets:
                results[asset.primary_ip] = {
                    "success": False,
                    "error": str(e),
                    "asset": asset.primary_ip
                }
        
        return results

    async def _execute_api_operation(self, job: Job, operation: Operation, assets: List[Asset], run_data: OperationRun) -> Dict[str, Any]:
        """Execute API call operation."""
        results = {}
        
        # Prepare headers
        headers = operation.api_headers or {}
        if run_data.api_headers:
            headers.update(run_data.api_headers)
        
        # Prepare body
        body = operation.api_body or {}
        if run_data.api_body:
            body.update(run_data.api_body)
        
        # Process each asset
        for i, asset in enumerate(assets):
            try:
                job.current_asset = asset.primary_ip
                job.processed_assets = i
                job.progress = int((i / len(assets)) * 100)
                self.db.commit()
                
                # Prepare asset-specific request
                asset_headers = headers.copy()
                asset_body = body.copy()
                
                # Replace placeholders with asset data
                asset_headers = self._replace_placeholders(asset_headers, asset)
                asset_body = self._replace_placeholders(asset_body, asset)
                
                # Make API call
                response = requests.request(
                    method=operation.api_method,
                    url=operation.api_url,
                    headers=asset_headers,
                    json=asset_body if operation.api_method in ['POST', 'PUT', 'PATCH'] else None,
                    timeout=operation.api_timeout
                )
                
                results[asset.primary_ip] = {
                    "success": response.status_code < 400,
                    "status_code": response.status_code,
                    "response": response.text[:1000],  # Limit response size
                    "asset": asset.primary_ip,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"API operation failed for asset {asset.primary_ip}: {e}")
                results[asset.primary_ip] = {
                    "success": False,
                    "error": str(e),
                    "asset": asset.primary_ip,
                    "timestamp": datetime.utcnow().isoformat()
                }
        
        return results

    async def _execute_script_operation(self, job: Job, operation: Operation, assets: List[Asset], run_data: OperationRun) -> Dict[str, Any]:
        """Execute script operation via WinRM or SSH."""
        results = {}
        
        # Get credentials
        credential = None
        if operation.credential_id:
            credential = self.db.query(Credential).filter(Credential.id == operation.credential_id).first()
        
        # Process each asset
        for i, asset in enumerate(assets):
            try:
                job.current_asset = asset.primary_ip
                job.processed_assets = i
                job.progress = int((i / len(assets)) * 100)
                self.db.commit()
                
                # Prepare script content
                script_content = operation.script_content or ""
                script_args = operation.script_args or {}
                if run_data.script_args:
                    script_args.update(run_data.script_args)
                
                # Replace placeholders
                script_content = self._replace_placeholders(script_content, asset)
                script_args = self._replace_placeholders(script_args, asset)
                
                # Execute script
                if operation.script_type == "powershell":
                    result = await self._execute_powershell_script(asset, script_content, script_args, credential)
                elif operation.script_type == "bash":
                    result = await self._execute_bash_script(asset, script_content, script_args, credential)
                elif operation.script_type == "python":
                    result = await self._execute_python_script(asset, script_content, script_args, credential)
                else:
                    raise ValueError(f"Unsupported script type: {operation.script_type}")
                
                results[asset.primary_ip] = result
                
            except Exception as e:
                logger.error(f"Script operation failed for asset {asset.primary_ip}: {e}")
                results[asset.primary_ip] = {
                    "success": False,
                    "error": str(e),
                    "asset": asset.primary_ip,
                    "timestamp": datetime.utcnow().isoformat()
                }
        
        return results

    def _prepare_awx_inventory(self, assets: List[Asset], operation: Operation) -> Dict[str, Any]:
        """Prepare AWX inventory from assets."""
        inventory = {
            "all": {
                "hosts": {},
                "vars": {}
            }
        }
        
        for asset in assets:
            host_vars = {
                "ansible_host": asset.primary_ip,
                "hostname": asset.hostname or asset.primary_ip,
                "os_name": asset.os_name,
                "os_family": asset.os_family,
                "manufacturer": asset.manufacturer,
                "model": asset.model
            }
            
            # Add OS-specific groups
            if asset.os_family:
                if asset.os_family.lower() in ['windows', 'win']:
                    host_vars["ansible_connection"] = "winrm"
                    host_vars["ansible_winrm_transport"] = "basic"
                else:
                    host_vars["ansible_connection"] = "ssh"
                    host_vars["ansible_ssh_common_args"] = "-o StrictHostKeyChecking=no"
            
            inventory["all"]["hosts"][asset.primary_ip] = host_vars
        
        return inventory

    async def _monitor_awx_job(self, job: Job, awx_settings: Dict[str, Any], assets: List[Asset]) -> Dict[str, Any]:
        """Monitor AWX job execution."""
        results = {}
        
        while True:
            try:
                response = requests.get(
                    f"{awx_settings['awx_url']}/api/v2/jobs/{job.awx_job_id}/",
                    auth=(awx_settings['awx_username'], awx_settings['awx_password']),
                    timeout=10
                )
                
                if response.status_code == 200:
                    awx_job = response.json()
                    job.progress = awx_job.get('percent_complete', 0)
                    self.db.commit()
                    
                    if awx_job['status'] in ['successful', 'failed', 'error', 'canceled']:
                        # Job completed
                        for asset in assets:
                            results[asset.primary_ip] = {
                                "success": awx_job['status'] == 'successful',
                                "status": awx_job['status'],
                                "asset": asset.primary_ip,
                                "timestamp": datetime.utcnow().isoformat()
                            }
                        break
                    
                    # Wait before next check
                    await asyncio.sleep(5)
                else:
                    raise Exception(f"Failed to get AWX job status: {response.text}")
                    
            except Exception as e:
                logger.error(f"Error monitoring AWX job: {e}")
                for asset in assets:
                    results[asset.primary_ip] = {
                        "success": False,
                        "error": str(e),
                        "asset": asset.primary_ip,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                break
        
        return results

    async def _execute_powershell_script(self, asset: Asset, script_content: str, script_args: Dict[str, Any], credential: Optional[Credential]) -> Dict[str, Any]:
        """Execute PowerShell script via WinRM."""
        # This would integrate with pywinrm or similar library
        # For now, return a mock result
        return {
            "success": True,
            "stdout": f"PowerShell script executed on {asset.primary_ip}",
            "stderr": "",
            "exit_code": 0,
            "asset": asset.primary_ip,
            "timestamp": datetime.utcnow().isoformat()
        }

    async def _execute_bash_script(self, asset: Asset, script_content: str, script_args: Dict[str, Any], credential: Optional[Credential]) -> Dict[str, Any]:
        """Execute Bash script via SSH."""
        # This would integrate with paramiko or similar library
        # For now, return a mock result
        return {
            "success": True,
            "stdout": f"Bash script executed on {asset.primary_ip}",
            "stderr": "",
            "exit_code": 0,
            "asset": asset.primary_ip,
            "timestamp": datetime.utcnow().isoformat()
        }

    async def _execute_python_script(self, asset: Asset, script_content: str, script_args: Dict[str, Any], credential: Optional[Credential]) -> Dict[str, Any]:
        """Execute Python script."""
        # This would execute Python script locally or remotely
        # For now, return a mock result
        return {
            "success": True,
            "stdout": f"Python script executed for {asset.primary_ip}",
            "stderr": "",
            "exit_code": 0,
            "asset": asset.primary_ip,
            "timestamp": datetime.utcnow().isoformat()
        }

    def _replace_placeholders(self, data: Any, asset: Asset) -> Any:
        """Replace placeholders in data with asset information."""
        if isinstance(data, str):
            return data.replace("{{asset_ip}}", asset.primary_ip or "") \
                      .replace("{{asset_hostname}}", asset.hostname or "") \
                      .replace("{{asset_name}}", asset.name or "") \
                      .replace("{{asset_os}}", asset.os_name or "") \
                      .replace("{{asset_mac}}", asset.mac_address or "")
        elif isinstance(data, dict):
            return {key: self._replace_placeholders(value, asset) for key, value in data.items()}
        elif isinstance(data, list):
            return [self._replace_placeholders(item, asset) for item in data]
        else:
            return data

    def get_job(self, job_id: int) -> Optional[Job]:
        """Get a job by ID."""
        return self.db.query(Job).filter(Job.id == job_id).first()

    def get_jobs(self, operation_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Job]:
        """Get jobs with optional filtering."""
        query = self.db.query(Job)
        if operation_id:
            query = query.filter(Job.operation_id == operation_id)
        return query.offset(skip).limit(limit).all()

    def cancel_job(self, job_id: int) -> bool:
        """Cancel a running job."""
        job = self.get_job(job_id)
        if not job or job.status not in ['pending', 'running']:
            return False
        
        job.status = "cancelled"
        job.end_time = datetime.utcnow()
        self.db.commit()
        return True