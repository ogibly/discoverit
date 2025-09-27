"""
Enterprise analytics and reporting service.
"""
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc
from datetime import datetime, timedelta
from ..models import (
    Asset, AssetGroup, ScanTask, User, AuditLog, 
    AssetMetric, NetworkTopology, ComplianceCheck
)
from .base_service import BaseService


class AnalyticsService(BaseService):
    def __init__(self, db: Session):
        super().__init__(db)

    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Get comprehensive dashboard metrics."""
        return {
            "asset_metrics": self._get_asset_metrics(),
            "scan_metrics": self._get_scan_metrics(),
            "user_metrics": self._get_user_metrics(),
            "security_metrics": self._get_security_metrics(),
            "performance_metrics": self._get_performance_metrics(),
            "compliance_metrics": self._get_compliance_metrics()
        }

    def _get_asset_metrics(self) -> Dict[str, Any]:
        """Get asset-related metrics."""
        total_assets = self.db.query(Asset).count()
        active_assets = self.db.query(Asset).filter(Asset.is_active == True).count()
        managed_assets = self.db.query(Asset).filter(Asset.is_managed == True).count()
        
        # Asset types distribution
        asset_types = self.db.query(
            Asset.device_type, 
            func.count(Asset.id).label('count')
        ).group_by(Asset.device_type).all()
        
        # Assets by location
        locations = self.db.query(
            Asset.location,
            func.count(Asset.id).label('count')
        ).filter(Asset.location.isnot(None)).group_by(Asset.location).all()
        
        # Recent asset additions
        recent_assets = self.db.query(Asset).filter(
            Asset.created_at >= datetime.utcnow() - timedelta(days=30)
        ).count()
        
        return {
            "total_assets": total_assets,
            "active_assets": active_assets,
            "managed_assets": managed_assets,
            "unmanaged_assets": total_assets - managed_assets,
            "asset_types": {asset_type: count for asset_type, count in asset_types},
            "locations": {location: count for location, count in locations},
            "recent_additions": recent_assets,
            "management_rate": (managed_assets / total_assets * 100) if total_assets > 0 else 0
        }

    def _get_scan_metrics(self) -> Dict[str, Any]:
        """Get scan-related metrics."""
        total_scans = self.db.query(ScanTask).count()
        completed_scans = self.db.query(ScanTask).filter(ScanTask.status == "completed").count()
        failed_scans = self.db.query(ScanTask).filter(ScanTask.status == "failed").count()
        running_scans = self.db.query(ScanTask).filter(ScanTask.status == "running").count()
        
        # Scan success rate
        success_rate = (completed_scans / total_scans * 100) if total_scans > 0 else 0
        
        # Average scan duration
        avg_duration = self.db.query(func.avg(ScanTask.duration)).filter(
            ScanTask.status == "completed",
            ScanTask.duration.isnot(None)
        ).scalar() or 0
        
        # Scans by type
        scan_types = self.db.query(
            ScanTask.scan_type,
            func.count(ScanTask.id).label('count')
        ).group_by(ScanTask.scan_type).all()
        
        # Recent scans
        recent_scans = self.db.query(ScanTask).filter(
            ScanTask.created_at >= datetime.utcnow() - timedelta(days=7)
        ).count()
        
        return {
            "total_scans": total_scans,
            "completed_scans": completed_scans,
            "failed_scans": failed_scans,
            "running_scans": running_scans,
            "success_rate": success_rate,
            "average_duration": avg_duration,
            "scan_types": {scan_type: count for scan_type, count in scan_types},
            "recent_scans": recent_scans
        }

    def _get_user_metrics(self) -> Dict[str, Any]:
        """Get user-related metrics."""
        total_users = self.db.query(User).count()
        active_users = self.db.query(User).filter(User.is_active == True).count()
        
        # User activity
        active_users_30d = self.db.query(User).filter(
            User.last_login >= datetime.utcnow() - timedelta(days=30)
        ).count()
        
        # User roles
        user_roles = self.db.query(
            User.role_id,
            func.count(User.id).label('count')
        ).group_by(User.role_id).all()
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "active_users_30d": active_users_30d,
            "user_roles": {role_id: count for role_id, count in user_roles}
        }

    def _get_security_metrics(self) -> Dict[str, Any]:
        """Get security-related metrics."""
        # Audit log metrics
        total_audit_events = self.db.query(AuditLog).count()
        failed_events = self.db.query(AuditLog).filter(AuditLog.success == False).count()
        
        # Recent security events
        recent_events = self.db.query(AuditLog).filter(
            AuditLog.created_at >= datetime.utcnow() - timedelta(days=7)
        ).count()
        
        # Failed login attempts
        failed_logins = self.db.query(AuditLog).filter(
            and_(
                AuditLog.action == "LOGIN",
                AuditLog.success == False
            )
        ).count()
        
        return {
            "total_audit_events": total_audit_events,
            "failed_events": failed_events,
            "recent_events": recent_events,
            "failed_logins": failed_logins,
            "security_score": max(0, 100 - (failed_events / total_audit_events * 100)) if total_audit_events > 0 else 100
        }

    def _get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance-related metrics."""
        # Asset metrics
        total_metrics = self.db.query(AssetMetric).count()
        
        # Average response times
        avg_latency = self.db.query(func.avg(AssetMetric.value)).filter(
            AssetMetric.metric_type == "network",
            AssetMetric.metric_name == "latency"
        ).scalar() or 0
        
        # System health
        healthy_assets = self.db.query(Asset).filter(
            Asset.is_active == True
        ).count()
        
        return {
            "total_metrics": total_metrics,
            "average_latency": avg_latency,
            "healthy_assets": healthy_assets,
            "performance_score": min(100, max(0, 100 - (avg_latency / 100))) if avg_latency > 0 else 100
        }

    def _get_compliance_metrics(self) -> Dict[str, Any]:
        """Get compliance-related metrics."""
        total_checks = self.db.query(ComplianceCheck).count()
        passed_checks = self.db.query(ComplianceCheck).filter(ComplianceCheck.status == "pass").count()
        failed_checks = self.db.query(ComplianceCheck).filter(ComplianceCheck.status == "fail").count()
        
        # Recent compliance checks
        recent_checks = self.db.query(ComplianceCheck).filter(
            ComplianceCheck.checked_at >= datetime.utcnow() - timedelta(days=30)
        ).count()
        
        return {
            "total_checks": total_checks,
            "passed_checks": passed_checks,
            "failed_checks": failed_checks,
            "recent_checks": recent_checks,
            "compliance_rate": (passed_checks / total_checks * 100) if total_checks > 0 else 0
        }

    def get_asset_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        group_by: str = "day"
    ) -> Dict[str, Any]:
        """Get detailed asset analytics."""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Asset creation trends
        creation_trends = self._get_asset_creation_trends(start_date, end_date, group_by)
        
        # Asset type distribution over time
        type_distribution = self._get_asset_type_distribution(start_date, end_date)
        
        # Location distribution
        location_distribution = self._get_location_distribution()
        
        # Management status trends
        management_trends = self._get_management_trends(start_date, end_date, group_by)
        
        return {
            "creation_trends": creation_trends,
            "type_distribution": type_distribution,
            "location_distribution": location_distribution,
            "management_trends": management_trends,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "group_by": group_by
            }
        }

    def _get_asset_creation_trends(
        self, 
        start_date: datetime, 
        end_date: datetime, 
        group_by: str
    ) -> List[Dict[str, Any]]:
        """Get asset creation trends over time."""
        if group_by == "day":
            date_format = "%Y-%m-%d"
        elif group_by == "week":
            date_format = "%Y-%U"
        elif group_by == "month":
            date_format = "%Y-%m"
        else:
            date_format = "%Y-%m-%d"
        
        trends = self.db.query(
            func.date_format(Asset.created_at, date_format).label('period'),
            func.count(Asset.id).label('count')
        ).filter(
            and_(
                Asset.created_at >= start_date,
                Asset.created_at <= end_date
            )
        ).group_by('period').order_by('period').all()
        
        return [{"period": trend.period, "count": trend.count} for trend in trends]

    def _get_asset_type_distribution(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get asset type distribution over time."""
        distribution = self.db.query(
            Asset.device_type,
            func.count(Asset.id).label('count')
        ).filter(
            and_(
                Asset.created_at >= start_date,
                Asset.created_at <= end_date
            )
        ).group_by(Asset.device_type).all()
        
        return {asset_type: count for asset_type, count in distribution}

    def _get_location_distribution(self) -> Dict[str, Any]:
        """Get location distribution of assets."""
        distribution = self.db.query(
            Asset.location,
            func.count(Asset.id).label('count')
        ).filter(Asset.location.isnot(None)).group_by(Asset.location).all()
        
        return {location: count for location, count in distribution}

    def _get_management_trends(
        self, 
        start_date: datetime, 
        end_date: datetime, 
        group_by: str
    ) -> List[Dict[str, Any]]:
        """Get asset management trends over time."""
        if group_by == "day":
            date_format = "%Y-%m-%d"
        elif group_by == "week":
            date_format = "%Y-%U"
        elif group_by == "month":
            date_format = "%Y-%m"
        else:
            date_format = "%Y-%m-%d"
        
        trends = self.db.query(
            func.date_format(Asset.created_at, date_format).label('period'),
            func.sum(func.case([(Asset.is_managed == True, 1)], else_=0)).label('managed'),
            func.sum(func.case([(Asset.is_managed == False, 1)], else_=0)).label('unmanaged')
        ).filter(
            and_(
                Asset.created_at >= start_date,
                Asset.created_at <= end_date
            )
        ).group_by('period').order_by('period').all()
        
        return [
            {
                "period": trend.period,
                "managed": trend.managed or 0,
                "unmanaged": trend.unmanaged or 0
            }
            for trend in trends
        ]

    def get_scan_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get detailed scan analytics."""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Scan success trends
        success_trends = self._get_scan_success_trends(start_date, end_date)
        
        # Scan duration analysis
        duration_analysis = self._get_scan_duration_analysis(start_date, end_date)
        
        # Scan type performance
        type_performance = self._get_scan_type_performance(start_date, end_date)
        
        # Target analysis
        target_analysis = self._get_scan_target_analysis(start_date, end_date)
        
        return {
            "success_trends": success_trends,
            "duration_analysis": duration_analysis,
            "type_performance": type_performance,
            "target_analysis": target_analysis,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            }
        }

    def _get_scan_success_trends(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get scan success trends over time."""
        trends = self.db.query(
            func.date(ScanTask.created_at).label('date'),
            func.count(ScanTask.id).label('total'),
            func.sum(func.case([(ScanTask.status == "completed", 1)], else_=0)).label('successful'),
            func.sum(func.case([(ScanTask.status == "failed", 1)], else_=0)).label('failed')
        ).filter(
            and_(
                ScanTask.created_at >= start_date,
                ScanTask.created_at <= end_date
            )
        ).group_by('date').order_by('date').all()
        
        return [
            {
                "date": trend.date.isoformat(),
                "total": trend.total,
                "successful": trend.successful or 0,
                "failed": trend.failed or 0,
                "success_rate": (trend.successful / trend.total * 100) if trend.total > 0 else 0
            }
            for trend in trends
        ]

    def _get_scan_duration_analysis(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get scan duration analysis."""
        durations = self.db.query(ScanTask.duration).filter(
            and_(
                ScanTask.created_at >= start_date,
                ScanTask.created_at <= end_date,
                ScanTask.status == "completed",
                ScanTask.duration.isnot(None)
            )
        ).all()
        
        if not durations:
            return {"average": 0, "min": 0, "max": 0, "median": 0}
        
        duration_values = [d[0] for d in durations]
        duration_values.sort()
        
        return {
            "average": sum(duration_values) / len(duration_values),
            "min": min(duration_values),
            "max": max(duration_values),
            "median": duration_values[len(duration_values) // 2]
        }

    def _get_scan_type_performance(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get scan type performance analysis."""
        performance = self.db.query(
            ScanTask.scan_type,
            func.count(ScanTask.id).label('total'),
            func.sum(func.case([(ScanTask.status == "completed", 1)], else_=0)).label('successful'),
            func.avg(ScanTask.duration).label('avg_duration')
        ).filter(
            and_(
                ScanTask.created_at >= start_date,
                ScanTask.created_at <= end_date
            )
        ).group_by(ScanTask.scan_type).all()
        
        return {
            scan_type: {
                "total": perf.total,
                "successful": perf.successful or 0,
                "success_rate": (perf.successful / perf.total * 100) if perf.total > 0 else 0,
                "avg_duration": perf.avg_duration or 0
            }
            for scan_type, perf in performance
        }

    def _get_scan_target_analysis(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get scan target analysis."""
        targets = self.db.query(
            ScanTask.target,
            func.count(ScanTask.id).label('scan_count'),
            func.sum(ScanTask.discovered_devices).label('total_devices')
        ).filter(
            and_(
                ScanTask.created_at >= start_date,
                ScanTask.created_at <= end_date
            )
        ).group_by(ScanTask.target).order_by(desc('scan_count')).limit(10).all()
        
        return [
            {
                "target": target.target,
                "scan_count": target.scan_count,
                "total_devices": target.total_devices or 0
            }
            for target in targets
        ]

    def get_security_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get security analytics."""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Audit log analysis
        audit_analysis = self._get_audit_analysis(start_date, end_date)
        
        # Failed login analysis
        failed_login_analysis = self._get_failed_login_analysis(start_date, end_date)
        
        # User activity analysis
        user_activity = self._get_user_activity_analysis(start_date, end_date)
        
        return {
            "audit_analysis": audit_analysis,
            "failed_login_analysis": failed_login_analysis,
            "user_activity": user_activity,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            }
        }

    def _get_audit_analysis(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get audit log analysis."""
        # Action distribution
        actions = self.db.query(
            AuditLog.action,
            func.count(AuditLog.id).label('count')
        ).filter(
            and_(
                AuditLog.created_at >= start_date,
                AuditLog.created_at <= end_date
            )
        ).group_by(AuditLog.action).all()
        
        # Success/failure rates
        success_rate = self.db.query(
            func.sum(func.case([(AuditLog.success == True, 1)], else_=0)).label('successful'),
            func.count(AuditLog.id).label('total')
        ).filter(
            and_(
                AuditLog.created_at >= start_date,
                AuditLog.created_at <= end_date
            )
        ).first()
        
        return {
            "actions": {action: count for action, count in actions},
            "success_rate": (success_rate.successful / success_rate.total * 100) if success_rate.total > 0 else 0,
            "total_events": success_rate.total
        }

    def _get_failed_login_analysis(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get failed login analysis."""
        failed_logins = self.db.query(AuditLog).filter(
            and_(
                AuditLog.action == "LOGIN",
                AuditLog.success == False,
                AuditLog.created_at >= start_date,
                AuditLog.created_at <= end_date
            )
        ).all()
        
        # Group by IP address
        ip_counts = {}
        for login in failed_logins:
            ip = login.ip_address or "unknown"
            ip_counts[ip] = ip_counts.get(ip, 0) + 1
        
        # Top failed login IPs
        top_ips = sorted(ip_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "total_failed_logins": len(failed_logins),
            "unique_ips": len(ip_counts),
            "top_failed_ips": [{"ip": ip, "count": count} for ip, count in top_ips]
        }

    def _get_user_activity_analysis(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get user activity analysis."""
        # Active users
        active_users = self.db.query(User).filter(
            User.last_login >= start_date
        ).count()
        
        # User activity by day
        daily_activity = self.db.query(
            func.date(AuditLog.created_at).label('date'),
            func.count(func.distinct(AuditLog.user_id)).label('active_users')
        ).filter(
            and_(
                AuditLog.created_at >= start_date,
                AuditLog.created_at <= end_date,
                AuditLog.user_id.isnot(None)
            )
        ).group_by('date').order_by('date').all()
        
        return {
            "active_users": active_users,
            "daily_activity": [
                {"date": activity.date.isoformat(), "active_users": activity.active_users}
                for activity in daily_activity
            ]
        }

    def generate_report(
        self,
        report_type: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate comprehensive reports."""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        if report_type == "asset_summary":
            return self._generate_asset_summary_report(start_date, end_date, filters)
        elif report_type == "scan_performance":
            return self._generate_scan_performance_report(start_date, end_date, filters)
        elif report_type == "security_audit":
            return self._generate_security_audit_report(start_date, end_date, filters)
        elif report_type == "compliance":
            return self._generate_compliance_report(start_date, end_date, filters)
        else:
            return {"error": f"Unknown report type: {report_type}"}

    def _generate_asset_summary_report(
        self, 
        start_date: datetime, 
        end_date: datetime, 
        filters: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate asset summary report."""
        return {
            "report_type": "asset_summary",
            "period": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
            "summary": self._get_asset_metrics(),
            "analytics": self.get_asset_analytics(start_date, end_date),
            "generated_at": datetime.utcnow().isoformat()
        }

    def _generate_scan_performance_report(
        self, 
        start_date: datetime, 
        end_date: datetime, 
        filters: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate scan performance report."""
        return {
            "report_type": "scan_performance",
            "period": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
            "summary": self._get_scan_metrics(),
            "analytics": self.get_scan_analytics(start_date, end_date),
            "generated_at": datetime.utcnow().isoformat()
        }

    def _generate_security_audit_report(
        self, 
        start_date: datetime, 
        end_date: datetime, 
        filters: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate security audit report."""
        return {
            "report_type": "security_audit",
            "period": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
            "summary": self._get_security_metrics(),
            "analytics": self.get_security_analytics(start_date, end_date),
            "generated_at": datetime.utcnow().isoformat()
        }

    def _generate_compliance_report(
        self, 
        start_date: datetime, 
        end_date: datetime, 
        filters: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate compliance report."""
        return {
            "report_type": "compliance",
            "period": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
            "summary": self._get_compliance_metrics(),
            "generated_at": datetime.utcnow().isoformat()
        }
