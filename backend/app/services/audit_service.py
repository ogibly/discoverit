"""
Audit service for comprehensive logging and compliance tracking.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from ..models import AuditLog, User
from ..schemas import AuditLogCreate
import json


class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def log_action(
        self,
        action: str,
        resource_type: str,
        user_id: Optional[int] = None,
        resource_id: Optional[int] = None,
        resource_name: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> AuditLog:
        """Log an action for audit purposes."""
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            error_message=error_message
        )
        
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)
        return audit_log

    def log_asset_action(
        self,
        action: str,
        asset_id: int,
        asset_name: str,
        user_id: Optional[int] = None,
        changes: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> AuditLog:
        """Log an asset-related action."""
        details = {"changes": changes} if changes else None
        return self.log_action(
            action=action,
            resource_type="asset",
            user_id=user_id,
            resource_id=asset_id,
            resource_name=asset_name,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            error_message=error_message
        )

    def log_scan_action(
        self,
        action: str,
        scan_task_id: int,
        scan_name: str,
        user_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> AuditLog:
        """Log a scan-related action."""
        return self.log_action(
            action=action,
            resource_type="scan",
            user_id=user_id,
            resource_id=scan_task_id,
            resource_name=scan_name,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            error_message=error_message
        )

    def log_user_action(
        self,
        action: str,
        user_id: int,
        username: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> AuditLog:
        """Log a user-related action."""
        return self.log_action(
            action=action,
            resource_type="user",
            user_id=user_id,
            resource_id=user_id,
            resource_name=username,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            error_message=error_message
        )

    def get_audit_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        action: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[AuditLog]:
        """Get audit logs with filtering."""
        query = self.db.query(AuditLog)
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        if action:
            query = query.filter(AuditLog.action == action)
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)
        
        return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    def get_audit_summary(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get audit log summary statistics."""
        query = self.db.query(AuditLog)
        
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)
        
        total_actions = query.count()
        successful_actions = query.filter(AuditLog.success == True).count()
        failed_actions = query.filter(AuditLog.success == False).count()
        
        # Get action breakdown
        action_breakdown = {}
        for log in query.all():
            action_breakdown[log.action] = action_breakdown.get(log.action, 0) + 1
        
        # Get resource type breakdown
        resource_breakdown = {}
        for log in query.all():
            resource_breakdown[log.resource_type] = resource_breakdown.get(log.resource_type, 0) + 1
        
        return {
            "total_actions": total_actions,
            "successful_actions": successful_actions,
            "failed_actions": failed_actions,
            "success_rate": (successful_actions / total_actions * 100) if total_actions > 0 else 0,
            "action_breakdown": action_breakdown,
            "resource_breakdown": resource_breakdown
        }
