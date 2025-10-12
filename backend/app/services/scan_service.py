"""
Enhanced Scan service for managing network scans and scan tasks.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc
from ..models import ScanTask, Scan, Asset
from ..schemas import ScanTaskCreate, ScanTaskUpdate
from .asset_service import AssetService
import ipaddress
import requests
import json
from datetime import datetime, timezone
import asyncio
import concurrent.futures
import logging
import time
import subprocess

logger = logging.getLogger(__name__)


class ScanServiceV2:
    def __init__(self, db: Session):
        self.db = db
        from .scanner_service_enhanced import ScannerServiceV2
        self.scanner_service = ScannerServiceV2(db)
        self.asset_service = AssetService(db)

    def create_scan_task(self, task_data: ScanTaskCreate) -> ScanTask:
        """Create a new scan task with bulletproof validation and fallbacks."""
        logger.info(f"Creating scan task: {task_data.name} for target: {task_data.target}")
        
        # Import ScanTemplate at the beginning to avoid scope issues
        from ..models import ScanTemplate
        
        # Layer 1: Validate target format with comprehensive error handling
        try:
            if '/' in task_data.target:
                ipaddress.ip_network(task_data.target, strict=False)
                logger.info(f"Validated network target: {task_data.target}")
            else:
                ipaddress.ip_address(task_data.target)
                logger.info(f"Validated IP target: {task_data.target}")
        except ValueError as e:
            error_msg = f"Invalid target format '{task_data.target}': {e}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Layer 2: Bulletproof template selection with multiple fallbacks
        scan_template_id = task_data.scan_template_id
        template_source = "provided"
        
        if not scan_template_id:
            logger.warning("No scan template provided, searching for fallback options")
            
            # Fallback 1: Try to get the first active system template
            default_template = self.db.query(ScanTemplate).filter(
                ScanTemplate.is_system == True,
                ScanTemplate.is_active == True
            ).order_by(ScanTemplate.id).first()
            
            if default_template:
                scan_template_id = default_template.id
                template_source = "system_default"
                logger.info(f"Using system default template {default_template.id} ({default_template.name})")
            else:
                # Fallback 2: Try any active template
                any_template = self.db.query(ScanTemplate).filter(
                    ScanTemplate.is_active == True
                ).order_by(ScanTemplate.id).first()
                
                if any_template:
                    scan_template_id = any_template.id
                    template_source = "any_active"
                    logger.info(f"Using any active template {any_template.id} ({any_template.name})")
                else:
                    # Fallback 3: Create a minimal default template
                    logger.warning("No templates available, creating emergency default template")
                    emergency_template = ScanTemplate(
                        name="Emergency Default Template",
                        description="Auto-generated emergency template",
                        scan_config={
                            "scan_type": "quick",
                            "discovery_depth": 1,
                            "timeout": 30,
                            "arguments": "-sn -T4"
                        },
                        scan_type="quick",
                        is_system=True,
                        is_active=True,
                        created_by=0
                    )
                    self.db.add(emergency_template)
                    self.db.commit()
                    self.db.refresh(emergency_template)
                    scan_template_id = emergency_template.id
                    template_source = "emergency_created"
                    logger.info(f"Created emergency template {emergency_template.id}")
        
        # Layer 3: Validate template exists and is accessible
        if scan_template_id:
            template = self.db.query(ScanTemplate).filter(ScanTemplate.id == scan_template_id).first()
            if not template:
                error_msg = f"Template {scan_template_id} not found in database"
                logger.error(error_msg)
                raise ValueError(error_msg)
            if not template.is_active:
                logger.warning(f"Template {scan_template_id} is inactive, but proceeding")
        
        # Layer 4: Create task with comprehensive error handling
        try:
            task = ScanTask(
                name=task_data.name or f"Network Scan - {task_data.target}",
                target=task_data.target,
                scan_template_id=scan_template_id,
                created_by=task_data.created_by or "system",
                scanner_ids=getattr(task_data, 'scanner_ids', []) or [],
                status="pending",
                start_time=datetime.utcnow()
            )
            
            self.db.add(task)
            self.db.commit()
            self.db.refresh(task)
            
            logger.info(f"Successfully created scan task {task.id} using template {scan_template_id} (source: {template_source})")
            
        except Exception as e:
            self.db.rollback()
            error_msg = f"Failed to create scan task: {e}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Load template information and convert to dictionary for API response
        if task.scan_template_id:
            try:
                template = self.db.query(ScanTemplate).filter(ScanTemplate.id == task.scan_template_id).first()
                if template:
                    task.scan_template = {
                        "id": template.id,
                        "name": template.name,
                        "scan_type": template.scan_type,
                        "description": template.description or ""
                    }
                else:
                    task.scan_template = None
            except Exception as e:
                logger.warning(f"Failed to load template {task.scan_template_id} for task {task.id}: {e}")
                task.scan_template = None
        else:
            task.scan_template = None
        
        logger.info(f"Created scan task {task.id}: {task.name}")
        return task

    def get_scan_task(self, task_id: int) -> Optional[ScanTask]:
        """Get a scan task by ID with all related data."""
        task = self.db.query(ScanTask).options(
            joinedload(ScanTask.scans),
            joinedload(ScanTask.scan_template)
        ).filter(ScanTask.id == task_id).first()
        
        # Convert the SQLAlchemy relationship to a dictionary for API response
        if task and task.scan_template:
            try:
                # Handle both SQLAlchemy objects and dictionaries
                if hasattr(task.scan_template, '_sa_instance_state'):
                    # It's a SQLAlchemy object
                    task.scan_template = {
                        "id": task.scan_template.id,
                        "name": task.scan_template.name,
                        "scan_type": task.scan_template.scan_type,
                        "description": task.scan_template.description or ""
                    }
                elif isinstance(task.scan_template, dict):
                    # It's already a dictionary, ensure it has the right structure
                    task.scan_template = {
                        "id": task.scan_template.get("id", task.scan_template_id),
                        "name": task.scan_template.get("name", "Unknown Template"),
                        "scan_type": task.scan_template.get("scan_type", "standard"),
                        "description": task.scan_template.get("description", "")
                    }
                else:
                    # Fallback for unknown types
                    task.scan_template = {
                        "id": getattr(task.scan_template, 'id', task.scan_template_id),
                        "name": getattr(task.scan_template, 'name', 'Unknown Template'),
                        "scan_type": getattr(task.scan_template, 'scan_type', 'standard'),
                        "description": getattr(task.scan_template, 'description', '')
                    }
            except Exception as e:
                logger.warning(f"Failed to process template for task {task.id}: {e}")
                task.scan_template = None
        
        return task

    def get_scan_tasks(
        self, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[ScanTask]:
        """Get scan tasks with optional filtering."""
        query = self.db.query(ScanTask).options(
            joinedload(ScanTask.scans)
        )
        
        if status:
            query = query.filter(ScanTask.status == status)
        
        tasks = query.options(
            joinedload(ScanTask.scan_template)
        ).order_by(desc(ScanTask.start_time)).offset(skip).limit(limit).all()
        
        # Convert SQLAlchemy relationships to dictionaries for API response
        for task in tasks:
            if task.scan_template:
                try:
                    # Handle both SQLAlchemy objects and dictionaries
                    if hasattr(task.scan_template, '_sa_instance_state'):
                        # It's a SQLAlchemy object
                        task.scan_template = {
                            "id": task.scan_template.id,
                            "name": task.scan_template.name,
                            "scan_type": task.scan_template.scan_type,
                            "description": task.scan_template.description or ""
                        }
                    elif isinstance(task.scan_template, dict):
                        # It's already a dictionary, ensure it has the right structure
                        task.scan_template = {
                            "id": task.scan_template.get("id", task.scan_template_id),
                            "name": task.scan_template.get("name", "Unknown Template"),
                            "scan_type": task.scan_template.get("scan_type", "standard"),
                            "description": task.scan_template.get("description", "")
                        }
                    else:
                        # Fallback for unknown types
                        task.scan_template = {
                            "id": getattr(task.scan_template, 'id', task.scan_template_id),
                            "name": getattr(task.scan_template, 'name', 'Unknown Template'),
                            "scan_type": getattr(task.scan_template, 'scan_type', 'standard'),
                            "description": getattr(task.scan_template, 'description', '')
                        }
                except Exception as e:
                    logger.warning(f"Failed to process template for task {task.id}: {e}")
                    task.scan_template = None
        
        return tasks

    def get_active_scan_task(self) -> Optional[ScanTask]:
        """Get the currently active scan task."""
        return self.db.query(ScanTask).filter(
            ScanTask.status == "running"
        ).first()

    def cancel_scan_task(self, task_id: int) -> bool:
        """Cancel a running scan task."""
        task = self.get_scan_task(task_id)
        if not task or task.status != "running":
            return False
        
        task.status = "cancelled"
        task.end_time = datetime.utcnow()
        self.db.commit()
        
        logger.info(f"Cancelled scan task {task_id}")
        return True

    def get_ips_from_target(self, target: str) -> List[str]:
        """Get list of IPs to scan from target specification."""
        ips = []
        
        try:
            if '/' in target:
                # CIDR notation
                network = ipaddress.ip_network(target, strict=False)
                # Limit to reasonable number of IPs (max 1024)
                if network.num_addresses > 1024:
                    raise ValueError(f"Target network too large: {network.num_addresses} addresses (max 1024)")
                
                for ip in network.hosts():
                    ips.append(str(ip))
            else:
                # Single IP
                ipaddress.ip_address(target)  # Validate
                ips.append(target)
                
        except ValueError as e:
            logger.error(f"Invalid target format: {target} - {e}")
            raise ValueError(f"Invalid target format: {e}")
        
        return ips

    def get_scanner_recommendation(self, target: str, current_user=None) -> Dict[str, Any]:
        """Get scanner recommendation for a target network."""
        try:
            # Get the best scanner for this target
            optimal_scanner = self.scanner_service.get_best_scanner_for_target(target, current_user)
            
            if not optimal_scanner:
                return {
                    "recommended_scanner": None,
                    "fallback_available": True,
                    "message": "No scanners configured. Will use local nmap fallback.",
                    "scanner_type": "local_fallback"
                }
            
            # Get all available scanners for comparison
            all_scanners = self.scanner_service.get_all_scanners()
            active_scanners = [s for s in all_scanners if s.is_active]
            
            # Check if there are satellite scanners available
            satellite_scanners = [s for s in active_scanners if not s.is_default]
            
            recommendation = {
                "recommended_scanner": {
                    "id": optimal_scanner.id,
                    "name": optimal_scanner.name,
                    "url": optimal_scanner.url,
                    "is_satellite": not optimal_scanner.is_default,
                    "is_default": optimal_scanner.is_default,
                    "subnets": optimal_scanner.subnets,
                    "max_concurrent_scans": optimal_scanner.max_concurrent_scans,
                    "timeout_seconds": optimal_scanner.timeout_seconds
                },
                "scanner_type": "satellite" if not optimal_scanner.is_default else "default",
                "message": f"Using {'satellite' if not optimal_scanner.is_default else 'default'} scanner '{optimal_scanner.name}' for optimal performance",
                "alternatives_available": len(satellite_scanners) > 1 if not optimal_scanner.is_default else len(satellite_scanners) > 0,
                "total_scanners": len(active_scanners),
                "satellite_scanners": len(satellite_scanners)
            }
            
            # Add suggestion for satellite scanner if using default
            if optimal_scanner.is_default and satellite_scanners:
                recommendation["suggestion"] = {
                    "type": "info",
                    "message": f"Consider setting up a satellite scanner for this network range for improved scan performance and accuracy.",
                    "available_satellites": len(satellite_scanners)
                }
            
            return recommendation
            
        except Exception as e:
            logger.error(f"Error getting scanner recommendation for {target}: {e}")
            return {
                "recommended_scanner": None,
                "fallback_available": True,
                "message": f"Error getting scanner recommendation: {str(e)}",
                "scanner_type": "error"
            }

    def run_scan_task(self, task_id: int) -> None:
        """Run a scan task with bulletproof error handling and progress tracking."""
        logger.info(f"Starting scan task execution for task {task_id}")
        
        try:
            # Layer 1: Validate task exists and is in correct state
            # Use raw SQLAlchemy object for internal processing (not API response)
            task = self.db.query(ScanTask).options(
                joinedload(ScanTask.scan_template)
            ).filter(ScanTask.id == task_id).first()
            
            if not task:
                logger.error(f"Scan task {task_id} not found")
                return
            
            if task.status not in ["pending", "failed"]:
                logger.warning(f"Scan task {task_id} is in status '{task.status}', cannot run")
                return
            
            logger.info(f"Starting scan task {task_id}: {task.name} for target: {task.target}")
            
            # Layer 2: Validate template exists before starting
            if not task.scan_template_id:
                error_msg = "Scan template is required for all scan tasks"
                logger.error(f"Task {task_id}: {error_msg}")
                task.status = "failed"
                task.error_message = error_msg
                task.end_time = datetime.utcnow()
                self.db.commit()
                return
            
            # Layer 3: Initialize task status with error handling
            try:
                task.status = "running"
                task.error_message = None
                self.db.commit()
                logger.info(f"Task {task_id} status set to running")
            except Exception as e:
                logger.error(f"Failed to update task {task_id} status: {e}")
                return
            
            # Layer 4: Get IPs to scan with comprehensive validation
            try:
                ips_to_scan = self.get_ips_from_target(task.target)
                total_ips = len(ips_to_scan)
                
                if total_ips == 0:
                    error_msg = f"No valid IPs found for target: {task.target}"
                    logger.error(f"Task {task_id}: {error_msg}")
                    task.status = "failed"
                    task.error_message = error_msg
                    task.end_time = datetime.utcnow()
                    self.db.commit()
                    return
                
                task.total_ips = total_ips
                self.db.commit()
                logger.info(f"Task {task_id}: Scanning {total_ips} IPs")
                
            except Exception as e:
                error_msg = f"Failed to parse target '{task.target}': {e}"
                logger.error(f"Task {task_id}: {error_msg}")
                task.status = "failed"
                task.error_message = error_msg
                task.end_time = datetime.utcnow()
                self.db.commit()
                return
            
            # Layer 5: Main scan loop with bulletproof error handling
            successful_scans = 0
            failed_scans = 0
            
            for i, ip in enumerate(ips_to_scan):
                try:
                    # Check for cancellation with error handling
                    try:
                        self.db.refresh(task)
                        if task.status == "cancelled":
                            logger.info(f"Scan task {task_id} cancelled at IP {ip}")
                            break
                    except Exception as e:
                        logger.error(f"Failed to check cancellation status: {e}")
                        # Continue with scan despite error
                    
                    # Update current IP and progress with error handling
                    try:
                        task.current_ip = ip
                        task.completed_ips = i
                        progress = int((i / total_ips) * 100) if total_ips > 0 else 0
                        task.progress = min(progress, 100)
                        self.db.commit()
                    except Exception as e:
                        logger.error(f"Failed to update progress for IP {ip}: {e}")
                        # Continue with scan despite error
                    
                    logger.info(f"Task {task_id}: Scanning IP {ip} ({i+1}/{total_ips})")
                    
                    # Get scan configuration with error handling
                    try:
                        scan_config = self._get_scan_config_from_template(task)
                        if not scan_config:
                            raise ValueError("Failed to get scan configuration from template")
                    except Exception as e:
                        logger.error(f"Task {task_id}: Failed to get scan config for IP {ip}: {e}")
                        failed_scans += 1
                        continue
                    
                    # Perform the scan with comprehensive error handling
                    try:
                        scan_result = self._perform_scan(ip, scan_config)
                        if not scan_result:
                            raise ValueError("Scan returned no result")
                    except Exception as e:
                        logger.error(f"Task {task_id}: Scan failed for IP {ip}: {e}")
                        failed_scans += 1
                        
                        # Create failed scan record
                        try:
                            failed_scan = Scan(
                                asset_id=None,
                                scan_task_id=task.id,
                                scan_data={
                                    "ip": ip,
                                    "status": "failed",
                                    "error": str(e),
                                    "timestamp": datetime.utcnow().isoformat()
                                },
                                scan_type=scan_config.get("scan_type", "standard"),
                                status="failed"
                            )
                            self.db.add(failed_scan)
                            self.db.commit()
                        except Exception as db_error:
                            logger.error(f"Failed to save failed scan record: {db_error}")
                        continue
                    
                    # Process successful scan result
                    try:
                        # Categorize the scan result
                        categorization = self._categorize_scan_result(scan_result)
                        scan_result["categorization"] = categorization
                        
                        # Add task metadata
                        scan_result["task_metadata"] = {
                            "task_id": task.id,
                            "task_name": task.name,
                            "scan_timestamp": datetime.utcnow().isoformat()
                        }
                        
                        # Create scan record with error handling
                        try:
                            scan = Scan(
                                asset_id=None,  # No asset created automatically
                                scan_task_id=task.id,
                                scan_data=scan_result,
                                scan_type=scan_config.get("scan_type", "standard"),
                                status="completed" if categorization["is_device"] else "no_device"
                            )
                            self.db.add(scan)
                            self.db.commit()
                            successful_scans += 1
                            
                            logger.info(f"Task {task_id}: Successfully scanned {ip}: {categorization['result_type']} (is_device: {categorization['is_device']})")
                            
                        except Exception as db_error:
                            logger.error(f"Task {task_id}: Failed to save scan result for IP {ip}: {db_error}")
                            failed_scans += 1
                            
                    except Exception as process_error:
                        logger.error(f"Task {task_id}: Failed to process scan result for IP {ip}: {process_error}")
                        failed_scans += 1
                
                except Exception as e:
                    logger.error(f"Task {task_id}: Unexpected error scanning IP {ip}: {e}")
                    failed_scans += 1
                    
                    # Create failed scan record with error handling
                    try:
                        failed_scan = Scan(
                            asset_id=None,
                            scan_task_id=task.id,
                            scan_data={
                                "ip": ip,
                                "status": "failed",
                                "error": str(e),
                                "timestamp": datetime.utcnow().isoformat()
                            },
                            scan_type="standard",  # Default scan type for failed scans
                            status="failed"
                        )
                        self.db.add(failed_scan)
                        self.db.commit()
                    except Exception as db_error:
                        logger.error(f"Failed to save failed scan record: {db_error}")
            
            # Layer 6: Final task completion with comprehensive error handling
            try:
                # Refresh task to get latest status
                self.db.refresh(task)
                
                if task.status != "cancelled":
                    # Determine final status based on results
                    if successful_scans > 0:
                        task.status = "completed"
                        logger.info(f"Task {task_id}: Completed successfully with {successful_scans} successful scans")
                    elif failed_scans == total_ips:
                        task.status = "failed"
                        task.error_message = f"All {total_ips} scans failed"
                        logger.error(f"Task {task_id}: All scans failed")
                    else:
                        task.status = "completed"  # Partial success is still completion
                        logger.warning(f"Task {task_id}: Completed with {successful_scans} successful and {failed_scans} failed scans")
                    
                    # Update progress and completion stats
                    task.progress = 100
                    task.completed_ips = total_ips
                    
                    # Count actual discovered devices with error handling
                    try:
                        discovered_count = self.db.query(Scan).filter(
                            Scan.scan_task_id == task.id,
                            Scan.status == "completed"  # This means is_device was True
                        ).count()
                        task.discovered_devices = discovered_count
                        logger.info(f"Task {task_id}: Found {discovered_count} devices out of {total_ips} IPs scanned")
                    except Exception as e:
                        logger.error(f"Task {task_id}: Failed to count discovered devices: {e}")
                        task.discovered_devices = 0
                
                # Set end time
                task.end_time = datetime.utcnow()
                
                # Final commit with error handling
                try:
                    self.db.commit()
                    logger.info(f"Task {task_id}: Final status saved successfully")
                except Exception as e:
                    logger.error(f"Task {task_id}: Failed to save final status: {e}")
                    self.db.rollback()
                    
            except Exception as e:
                logger.error(f"Task {task_id}: Critical error during completion: {e}")
                try:
                    task.status = "failed"
                    task.error_message = f"Critical error during completion: {e}"
                    task.end_time = datetime.utcnow()
                    self.db.commit()
                except Exception as final_error:
                    logger.error(f"Task {task_id}: Failed to save error status: {final_error}")
                    self.db.rollback()
            
        except Exception as e:
            logger.error(f"Task {task_id}: Critical failure during scan execution: {e}")
            # Try to mark task as failed with comprehensive error handling
            try:
                # Get fresh task reference
                task = self.get_scan_task(task_id)
                if task:
                    task.status = "failed"
                    task.error_message = f"Critical failure: {str(e)}"
                    task.end_time = datetime.utcnow()
                    self.db.commit()
                    logger.info(f"Task {task_id}: Marked as failed due to critical error")
                else:
                    logger.error(f"Task {task_id}: Could not retrieve task to mark as failed")
            except Exception as final_error:
                logger.error(f"Task {task_id}: Failed to mark task as failed: {final_error}")
                try:
                    self.db.rollback()
                except:
                    pass  # Ignore rollback errors

    def can_retry_scan_task(self, task_id: int) -> Dict[str, Any]:
        """Check if a failed scan task can be retried based on time limits."""
        task = self.db.query(ScanTask).filter(ScanTask.id == task_id).first()
        if not task:
            return {"can_retry": False, "reason": "Scan task not found"}
        
        if task.status != "failed":
            return {"can_retry": False, "reason": "Only failed scans can be retried"}
        
        # Get retry time limit from settings
        settings = self.asset_service.get_settings()
        retry_limit_minutes = getattr(settings, 'scan_retry_time_limit_minutes', 30)
        
        # Check if scan is within retry time limit
        if task.end_time:
            # Handle timezone-aware vs naive datetime comparison
            now = datetime.now(timezone.utc)
            end_time = task.end_time
            
            # If end_time is naive, assume it's UTC
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=timezone.utc)
            
            time_since_failure = now - end_time
            if time_since_failure.total_seconds() > (retry_limit_minutes * 60):
                return {
                    "can_retry": False, 
                    "reason": f"Scan is too old to retry (older than {retry_limit_minutes} minutes)",
                    "time_since_failure": time_since_failure.total_seconds() / 60
                }
        
        return {"can_retry": True, "reason": "Scan is eligible for retry"}

    def retry_scan_task(self, task_id: int) -> Dict[str, Any]:
        """Retry a failed scan task."""
        # Check if scan can be retried
        retry_check = self.can_retry_scan_task(task_id)
        if not retry_check["can_retry"]:
            raise ValueError(retry_check["reason"])
        
        task = self.db.query(ScanTask).filter(ScanTask.id == task_id).first()
        if not task:
            raise ValueError("Scan task not found")
        
        # Reset task status and clear error
        task.status = "pending"
        task.progress = 0
        task.current_ip = None
        task.completed_ips = 0
        task.discovered_devices = 0
        task.error_message = None
        task.start_time = None
        task.end_time = None
        
        # Clear previous scan results for this task
        self.db.query(Scan).filter(Scan.scan_task_id == task_id).delete()
        
        self.db.commit()
        
        return {
            "message": "Scan task retry initiated",
            "task_id": task_id,
            "status": "pending"
        }

    def _get_scan_config_from_template(self, task: ScanTask) -> Dict[str, Any]:
        """Get scan configuration from the associated template."""
        if not task.scan_template_id:
            raise ValueError("Scan template is required for all scan tasks")
        
        # Use the template relationship that should be loaded
        if not task.scan_template:
            raise ValueError(f"Scan template {task.scan_template_id} not found or not loaded")
        
        # Use template configuration
        config = task.scan_template.scan_config.copy()
        return config

    def _perform_scan(self, ip: str, scan_config: Dict[str, Any]) -> Dict[str, Any]:
        """Perform a comprehensive scan using the optimal scanner service."""
        try:
            # Get the best scanner for this target IP
            optimal_scanner = self.scanner_service.get_best_scanner_for_target(ip)
            
            if not optimal_scanner:
                logger.warning(f"No scanner available for {ip}, using local nmap")
                return self._perform_local_scan(ip, scan_config)
            
            # Use the optimal scanner URL
            scanner_url = optimal_scanner.url
            logger.info(f"Using scanner '{optimal_scanner.name}' ({scanner_url}) for target {ip}")
            
            # Prepare scan request
            scan_request = {
                "target": ip,
                "scan_type": scan_config.get("scan_type", "standard"),
                "timeout": optimal_scanner.timeout_seconds or 30,
                "arguments": scan_config.get("arguments", "-sS -O -sV -A")
            }
            
            # Call scanner service
            response = requests.post(
                f"{scanner_url}/scan",
                json=scan_request,
                timeout=(optimal_scanner.timeout_seconds or 30) + 5  # Slightly longer than scanner timeout
            )
            
            if response.status_code == 200:
                scan_result = response.json()
                scan_result["scanner_info"] = {
                    "scanner_id": optimal_scanner.id,
                    "scanner_name": optimal_scanner.name,
                    "scanner_url": scanner_url,
                    "scan_method": "remote_scanner",
                    "is_satellite": not optimal_scanner.is_default
                }
                return scan_result
            else:
                # Fallback to local nmap if scanner service fails
                logger.warning(f"Scanner '{optimal_scanner.name}' failed for {ip}, using local nmap")
                return self._perform_local_scan(ip, scan_config)
                
        except requests.exceptions.RequestException as e:
            logger.warning(f"Scanner service unavailable for {ip}: {e}, using local nmap")
            return self._perform_local_scan(ip, scan_config)
        except Exception as e:
            logger.error(f"Scan failed for {ip}: {e}")
            return {
                "ip": ip,
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "scan_type": scan_config.get("scan_type", "standard")
            }

    def _perform_local_scan(self, ip: str, scan_config: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback local scan using nmap directly."""
        import re
        
        try:
            # Add network interface options for better host network access
            base_opts = ["--privileged", "--send-ip"]  # Use privileged mode and send IP packets
            
            # Get arguments from scan config (from template)
            arguments = scan_config.get("arguments", "-sS -O -sV -A")
            timeout = scan_config.get("timeout", 300)
            
            # Parse arguments and build command
            args_list = arguments.split()
            cmd = ["nmap"] + base_opts + args_list + [ip]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
            
            # Parse results
            scan_type = scan_config.get("scan_type", "standard")
            scan_result = self._parse_nmap_output(result, ip, scan_type)
            scan_result["scanner_info"] = {
                "scanner_url": "local_nmap",
                "scan_method": "local_nmap"
            }
            
            return scan_result
            
        except subprocess.TimeoutExpired:
            return {
                "ip": ip,
                "status": "failed",
                "error": "Scan timeout",
                "timestamp": datetime.utcnow().isoformat(),
                "scan_type": scan_config.get("scan_type", "standard")
            }
        except Exception as e:
            return {
                "ip": ip,
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "scan_type": scan_type
            }

    def _parse_nmap_output(self, result: subprocess.CompletedProcess, ip: str, scan_type: str) -> Dict[str, Any]:
        """Parse nmap output into structured data."""
        import re
        
        scan_result = {
            "ip": ip,
            "scan_type": scan_type,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "completed" if result.returncode == 0 else "failed",
            "raw_output": result.stdout,
            "stderr": result.stderr,
            "ports": [],
            "os_info": {},
            "device_info": {},
            "hostname": None,
            "addresses": {"mac": None},
            "vendor": None,
            "device_type": None,
            "response_time": None,
            "ttl": None,
            "services": [],
            "network_info": {}
        }
        
        # Check if host is up - be more flexible
        if ("0 hosts up" in result.stdout or 
            "Note: Host seems down" in result.stdout or
            "Host is down" in result.stdout):
            scan_result["status"] = "failed"
            scan_result["error"] = "Host is down or unreachable"
            return scan_result
        
        # If we get here and the scan didn't fail, mark as completed
        if result.returncode == 0:
            scan_result["status"] = "completed"
        
        # Extract hostname
        hostname_match = re.search(r'for (\S+)', result.stdout)
        if hostname_match:
            scan_result["hostname"] = hostname_match.group(1)
        
        # Extract MAC address and vendor
        mac_match = re.search(r'MAC Address: ([0-9A-Fa-f:]{17}) \(([^)]+)\)', result.stdout)
        if mac_match:
            scan_result["addresses"]["mac"] = mac_match.group(1)
            scan_result["vendor"] = mac_match.group(2)
        
        # Extract response time
        response_time_match = re.search(r'(\d+\.\d+)s latency', result.stdout)
        if response_time_match:
            scan_result["response_time"] = float(response_time_match.group(1))
        
        # Extract TTL
        ttl_match = re.search(r'TTL=(\d+)', result.stdout)
        if ttl_match:
            scan_result["ttl"] = int(ttl_match.group(1))
        
        # Extract OS information
        os_match = re.search(r'Running: ([^,]+)', result.stdout)
        if os_match:
            scan_result["os_info"]["os_name"] = os_match.group(1).strip()
        
        # Extract OS details
        os_details_match = re.search(r'OS details: ([^,]+)', result.stdout)
        if os_details_match:
            scan_result["os_info"]["os_details"] = os_details_match.group(1).strip()
        
        # Extract open ports
        port_matches = re.findall(r'(\d+)/(\w+)\s+open\s+(\w+)(?:\s+([^,]+))?', result.stdout)
        for port, protocol, service, version in port_matches:
            port_info = {
                "port": int(port),
                "protocol": protocol,
                "service": service,
                "state": "open",
                "version": version.strip() if version else None
            }
            scan_result["ports"].append(port_info)
            scan_result["services"].append(service)
        
        # Determine device type
        scan_result["device_type"] = self._determine_device_type(scan_result)
        
        return scan_result

    def _determine_device_type(self, scan_result: Dict[str, Any]) -> str:
        """Determine device type based on scan results."""
        services = scan_result.get("services", [])
        ports = scan_result.get("ports", [])
        vendor = scan_result.get("vendor", "")
        
        # Network infrastructure
        if any(service in services for service in ["ssh", "telnet", "snmp"]):
            if any(port["port"] in [161, 162] for port in ports):  # SNMP
                return "network_device"
            return "server"
        
        # Web servers
        if any(service in services for service in ["http", "https", "apache", "nginx"]):
            return "web_server"
        
        # Database servers
        if any(service in services for service in ["mysql", "postgresql", "mssql", "oracle"]):
            return "database_server"
        
        # Printers
        if any(service in services for service in ["ipp", "lpd", "printer"]):
            return "printer"
        
        # IoT devices
        if vendor and any(brand in vendor.lower() for brand in ["cisco", "netgear", "linksys", "tp-link"]):
            return "network_device"
        
        # Default
        if scan_result.get("ports"):
            return "unknown_device"
        else:
            return "host"

    def _categorize_scan_result(self, scan_result: Dict[str, Any]) -> Dict[str, Any]:
        """Categorize scan results to help users understand what was found."""
        result_type = "unknown"
        confidence = "low"
        indicators = []

        # If scan failed
        if scan_result.get("status") == "failed" or "error" in scan_result:
            result_type = "failed"
            confidence = "none"
            indicators.append("Scan failed")
            return {
                "result_type": result_type,
                "confidence": confidence,
                "indicators": indicators,
                "is_device": False
            }

        # Check if host is up - be more flexible with this check
        raw_output = scan_result.get("raw_output", "")
        if ("Host is up" not in raw_output and 
            "1 host up" not in raw_output and 
            "host up" not in raw_output.lower() and
            "0 hosts up" in raw_output):
            result_type = "no_response"
            confidence = "none"
            indicators.append("No response")
            return {
                "result_type": result_type,
                "confidence": confidence,
                "indicators": indicators,
                "is_device": False
            }

        # Analyze indicators to determine device type and confidence
        if scan_result.get("ports") and len(scan_result["ports"]) > 0:
            indicators.append(f"{len(scan_result['ports'])} open ports")
            confidence = "high"
            result_type = "active_device"

        if scan_result.get("hostname") and scan_result["hostname"] != scan_result.get("ip"):
            indicators.append("DNS hostname")
            if confidence == "low":
                confidence = "medium"
            if result_type == "unknown":
                result_type = "named_device"

        if scan_result.get("addresses", {}).get("mac"):
            indicators.append("MAC address")
            confidence = "high"
            result_type = "physical_device"

        if scan_result.get("os_info", {}).get("os_name"):
            indicators.append("OS detected")
            confidence = "high"
            result_type = "active_device"

        if scan_result.get("vendor"):
            indicators.append("Vendor info")
            if confidence == "low":
                confidence = "medium"
            if result_type == "unknown":
                result_type = "identified_device"

        if scan_result.get("response_time") is not None:
            indicators.append("Response time")
            if result_type == "unknown":
                result_type = "responding_host"

        if scan_result.get("ttl") is not None:
            indicators.append("TTL info")
            if result_type == "unknown":
                result_type = "network_device"

        if scan_result.get("services") and len(scan_result["services"]) > 0:
            indicators.append(f"{len(scan_result['services'])} services")
            if confidence == "low":
                confidence = "medium"
            if result_type == "unknown":
                result_type = "service_device"

        # If no specific indicators, it's just a responding IP
        if result_type == "unknown" and len(indicators) == 0:
            result_type = "responding_ip"
            confidence = "low"
            indicators.append("Host responds to ping")

        return {
            "result_type": result_type,
            "confidence": confidence,
            "indicators": indicators,
            "is_device": self._is_device_discovered(scan_result)
        }

    def _is_device_discovered(self, scan_result: Dict[str, Any]) -> bool:
        """Determine if a device was actually discovered."""
        # Device is considered discovered if:
        # 1. Has open ports
        # 2. Has MAC address
        # 3. Has hostname (different from IP)
        # 4. Has OS information
        # 5. Host responds to ping (for ping scans like -sn)
        # 6. Has response time (indicates host is alive)
        # 7. Has TTL (indicates network response)
        # 8. Scan completed successfully (indicates host responded)
        
        has_ports = scan_result.get("ports") and len(scan_result["ports"]) > 0
        has_mac = scan_result.get("addresses", {}).get("mac")
        has_hostname = scan_result.get("hostname") and scan_result["hostname"] != scan_result.get("ip")
        has_os = scan_result.get("os_info", {}).get("os_name")
        has_response_time = scan_result.get("response_time") is not None
        has_ttl = scan_result.get("ttl") is not None
        
        # Check if host is up (for ping scans) - be more flexible with this check
        raw_output = scan_result.get("raw_output", "")
        is_host_up = ("Host is up" in raw_output or 
                     "1 host up" in raw_output or 
                     "host up" in raw_output.lower() or
                     "Nmap scan report" in raw_output)  # nmap found something
        
        # Check if scan completed successfully (this is the key indicator)
        scan_successful = (scan_result.get("status") == "completed" and 
                          "error" not in scan_result and
                          not ("0 hosts up" in raw_output) and
                          not ("Host is down" in raw_output))
        
        # If scan was successful, it means the host responded in some way
        if scan_successful:
            return True
        
        # Otherwise, check for specific indicators
        return (has_ports or has_mac or has_hostname or has_os or 
                is_host_up or has_response_time or has_ttl)

    def delete_scan(self, scan_id: int) -> bool:
        """Delete a scan record."""
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if scan:
            self.db.delete(scan)
            self.db.commit()
            return True
        return False

    def get_scan_history(self, asset_id: int, limit: int = 10) -> List[Scan]:
        """Get scan history for an asset."""
        return self.db.query(Scan).filter(
            Scan.asset_id == asset_id
        ).order_by(desc(Scan.timestamp)).limit(limit).all()
    
    def get_scan_statistics(self) -> Dict[str, Any]:
        """Get scan task statistics."""
        total_tasks = self.db.query(ScanTask).count()
        running_tasks = self.db.query(ScanTask).filter(ScanTask.status == "running").count()
        completed_tasks = self.db.query(ScanTask).filter(ScanTask.status == "completed").count()
        failed_tasks = self.db.query(ScanTask).filter(ScanTask.status == "failed").count()
        cancelled_tasks = self.db.query(ScanTask).filter(ScanTask.status == "cancelled").count()
        
        return {
            "total_tasks": total_tasks,
            "running_tasks": running_tasks,
            "completed_tasks": completed_tasks,
            "failed_tasks": failed_tasks,
            "cancelled_tasks": cancelled_tasks
        }
    
    def update_scan_task(self, task_id: int, task_data: ScanTaskUpdate) -> Optional[ScanTask]:
        """Update a scan task."""
        task = self.get_scan_task(task_id)
        if not task:
            return None
        
        # Only allow updates if task is not running
        if task.status == "running":
            raise ValueError("Cannot update a running scan task")
        
        update_data = task_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(task, key):
                setattr(task, key, value)
        
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def get_scan_results(self, task_id: int) -> Dict[str, Any]:
        """Get scan results for a specific task."""
        task = self.get_scan_task(task_id)
        if not task:
            raise ValueError(f"Scan task {task_id} not found")
        
        scans = self.db.query(Scan).filter(Scan.scan_task_id == task_id).all()
        
        return {
            "task": task,
            "scans": scans,
            "total_scans": len(scans),
            "completed_scans": len([s for s in scans if s.status == "completed"]),
            "failed_scans": len([s for s in scans if s.status == "failed"])
        }
    
    def download_scan_results(self, task_id: int) -> Dict[str, Any]:
        """Download scan results for a specific task."""
        task = self.get_scan_task(task_id)
        if not task:
            raise ValueError(f"Scan task {task_id} not found")
        
        scans = self.db.query(Scan).filter(Scan.scan_task_id == task_id).all()
        
        # Format results for download
        results = {
            "task_id": task_id,
            "task_name": task.name,
            "target": task.target,
            "status": task.status,
            "start_time": task.start_time.replace(tzinfo=timezone.utc).isoformat() if task.start_time else None,
            "end_time": task.end_time.replace(tzinfo=timezone.utc).isoformat() if task.end_time else None,
            "scans": []
        }
        
        for scan in scans:
            scan_data = {
                "scan_id": scan.id,
                "asset_id": scan.asset_id,
                "ip_address": scan.ip_address,
                "status": scan.status,
                "timestamp": scan.timestamp.replace(tzinfo=timezone.utc).isoformat() if scan.timestamp else None,
                "results": scan.results
            }
            results["scans"].append(scan_data)
        
        return results