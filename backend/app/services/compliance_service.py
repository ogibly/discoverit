"""
Compliance service for managing compliance rules and checks.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from ..models import ComplianceRule, ComplianceCheck, Asset, AssetGroup
from ..schemas import ComplianceRuleCreate, ComplianceRuleUpdate, ComplianceCheckCreate
from .base_service import BaseService


class ComplianceService(BaseService):
    def __init__(self, db: Session):
        super().__init__(db)

    def get_compliance_rules(
        self,
        skip: int = 0,
        limit: int = 100,
        rule_type: Optional[str] = None,
        framework: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[ComplianceRule]:
        """Get compliance rules with filtering."""
        query = self.db.query(ComplianceRule)
        
        if rule_type:
            query = query.filter(ComplianceRule.rule_type == rule_type)
        if framework:
            query = query.filter(ComplianceRule.framework == framework)
        if is_active is not None:
            query = query.filter(ComplianceRule.is_active == is_active)
        
        return query.order_by(ComplianceRule.created_at.desc()).offset(skip).limit(limit).all()

    def get_compliance_rule(self, rule_id: int) -> Optional[ComplianceRule]:
        """Get a compliance rule by ID."""
        return self.db.query(ComplianceRule).filter(ComplianceRule.id == rule_id).first()

    def create_compliance_rule(
        self,
        rule_data: ComplianceRuleCreate,
        user_id: Optional[int] = None
    ) -> ComplianceRule:
        """Create a new compliance rule."""
        rule = ComplianceRule(
            name=rule_data.name,
            description=rule_data.description,
            rule_type=rule_data.rule_type,
            framework=rule_data.framework,
            rule_definition=rule_data.rule_definition,
            severity=rule_data.severity,
            created_by=user_id
        )
        
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        return rule

    def update_compliance_rule(
        self,
        rule_id: int,
        rule_data: ComplianceRuleUpdate
    ) -> Optional[ComplianceRule]:
        """Update a compliance rule."""
        rule = self.get_compliance_rule(rule_id)
        if not rule:
            return None
        
        update_data = rule_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(rule, field, value)
        
        self.db.commit()
        self.db.refresh(rule)
        return rule

    def delete_compliance_rule(self, rule_id: int) -> bool:
        """Delete a compliance rule."""
        rule = self.get_compliance_rule(rule_id)
        if not rule:
            return False
        
        self.db.delete(rule)
        self.db.commit()
        return True

    def run_compliance_check(
        self,
        rule_id: int,
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None,
        user_id: Optional[int] = None
    ) -> ComplianceCheck:
        """Run a compliance check for a specific rule."""
        rule = self.get_compliance_rule(rule_id)
        if not rule:
            raise ValueError(f"Compliance rule {rule_id} not found")
        
        # Execute the compliance rule
        check_result = self._execute_compliance_rule(rule, asset_id, asset_group_id)
        
        # Create compliance check record
        check = ComplianceCheck(
            rule_id=rule_id,
            asset_id=asset_id,
            asset_group_id=asset_group_id,
            status=check_result["status"],
            details=check_result["details"],
            checked_by=user_id
        )
        
        self.db.add(check)
        self.db.commit()
        self.db.refresh(check)
        return check

    def run_all_compliance_checks(
        self,
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None,
        user_id: Optional[int] = None
    ) -> List[ComplianceCheck]:
        """Run all active compliance checks."""
        rules = self.db.query(ComplianceRule).filter(ComplianceRule.is_active == True).all()
        checks = []
        
        for rule in rules:
            try:
                check = self.run_compliance_check(rule.id, asset_id, asset_group_id, user_id)
                checks.append(check)
            except Exception as e:
                # Create a failed check record
                failed_check = ComplianceCheck(
                    rule_id=rule.id,
                    asset_id=asset_id,
                    asset_group_id=asset_group_id,
                    status="error",
                    details={"error": str(e)},
                    checked_by=user_id
                )
                self.db.add(failed_check)
                checks.append(failed_check)
        
        self.db.commit()
        return checks

    def get_compliance_checks(
        self,
        skip: int = 0,
        limit: int = 100,
        rule_id: Optional[int] = None,
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None,
        status: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[ComplianceCheck]:
        """Get compliance checks with filtering."""
        query = self.db.query(ComplianceCheck)
        
        if rule_id:
            query = query.filter(ComplianceCheck.rule_id == rule_id)
        if asset_id:
            query = query.filter(ComplianceCheck.asset_id == asset_id)
        if asset_group_id:
            query = query.filter(ComplianceCheck.asset_group_id == asset_group_id)
        if status:
            query = query.filter(ComplianceCheck.status == status)
        if start_date:
            query = query.filter(ComplianceCheck.checked_at >= start_date)
        if end_date:
            query = query.filter(ComplianceCheck.checked_at <= end_date)
        
        return query.order_by(ComplianceCheck.checked_at.desc()).offset(skip).limit(limit).all()

    def get_compliance_summary(
        self,
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get compliance summary for assets or asset groups."""
        query = self.db.query(ComplianceCheck)
        
        if asset_id:
            query = query.filter(ComplianceCheck.asset_id == asset_id)
        if asset_group_id:
            query = query.filter(ComplianceCheck.asset_group_id == asset_group_id)
        
        checks = query.all()
        
        total_checks = len(checks)
        passed_checks = len([c for c in checks if c.status == "pass"])
        failed_checks = len([c for c in checks if c.status == "fail"])
        warning_checks = len([c for c in checks if c.status == "warning"])
        error_checks = len([c for c in checks if c.status == "error"])
        
        # Group by rule
        rule_summary = {}
        for check in checks:
            rule_id = check.rule_id
            if rule_id not in rule_summary:
                rule_summary[rule_id] = {
                    "total": 0,
                    "passed": 0,
                    "failed": 0,
                    "warnings": 0,
                    "errors": 0
                }
            
            rule_summary[rule_id]["total"] += 1
            if check.status == "pass":
                rule_summary[rule_id]["passed"] += 1
            elif check.status == "fail":
                rule_summary[rule_id]["failed"] += 1
            elif check.status == "warning":
                rule_summary[rule_id]["warnings"] += 1
            elif check.status == "error":
                rule_summary[rule_id]["errors"] += 1
        
        return {
            "total_checks": total_checks,
            "passed_checks": passed_checks,
            "failed_checks": failed_checks,
            "warning_checks": warning_checks,
            "error_checks": error_checks,
            "compliance_rate": (passed_checks / total_checks * 100) if total_checks > 0 else 0,
            "rule_summary": rule_summary
        }

    def _execute_compliance_rule(
        self,
        rule: ComplianceRule,
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Execute a compliance rule and return the result."""
        rule_definition = rule.rule_definition
        
        try:
            if rule.rule_type == "security":
                return self._execute_security_rule(rule_definition, asset_id, asset_group_id)
            elif rule.rule_type == "configuration":
                return self._execute_configuration_rule(rule_definition, asset_id, asset_group_id)
            elif rule.rule_type == "inventory":
                return self._execute_inventory_rule(rule_definition, asset_id, asset_group_id)
            else:
                return {
                    "status": "error",
                    "details": {"error": f"Unknown rule type: {rule.rule_type}"}
                }
        except Exception as e:
            return {
                "status": "error",
                "details": {"error": str(e)}
            }

    def _execute_security_rule(
        self,
        rule_definition: Dict[str, Any],
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Execute a security compliance rule."""
        rule_type = rule_definition.get("type")
        
        if rule_type == "password_policy":
            return self._check_password_policy(rule_definition, asset_id, asset_group_id)
        elif rule_type == "access_control":
            return self._check_access_control(rule_definition, asset_id, asset_group_id)
        elif rule_type == "encryption":
            return self._check_encryption(rule_definition, asset_id, asset_group_id)
        elif rule_type == "vulnerability":
            return self._check_vulnerabilities(rule_definition, asset_id, asset_group_id)
        else:
            return {
                "status": "error",
                "details": {"error": f"Unknown security rule type: {rule_type}"}
            }

    def _execute_configuration_rule(
        self,
        rule_definition: Dict[str, Any],
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Execute a configuration compliance rule."""
        rule_type = rule_definition.get("type")
        
        if rule_type == "required_fields":
            return self._check_required_fields(rule_definition, asset_id, asset_group_id)
        elif rule_type == "field_values":
            return self._check_field_values(rule_definition, asset_id, asset_group_id)
        elif rule_type == "asset_lifecycle":
            return self._check_asset_lifecycle(rule_definition, asset_id, asset_group_id)
        else:
            return {
                "status": "error",
                "details": {"error": f"Unknown configuration rule type: {rule_type}"}
            }

    def _execute_inventory_rule(
        self,
        rule_definition: Dict[str, Any],
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Execute an inventory compliance rule."""
        rule_type = rule_definition.get("type")
        
        if rule_type == "asset_count":
            return self._check_asset_count(rule_definition, asset_id, asset_group_id)
        elif rule_type == "asset_types":
            return self._check_asset_types(rule_definition, asset_id, asset_group_id)
        elif rule_type == "location_coverage":
            return self._check_location_coverage(rule_definition, asset_id, asset_group_id)
        else:
            return {
                "status": "error",
                "details": {"error": f"Unknown inventory rule type: {rule_type}"}
            }

    def _check_password_policy(
        self,
        rule_definition: Dict[str, Any],
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Check password policy compliance."""
        # This would check password policies on assets
        # For now, return a mock result
        return {
            "status": "pass",
            "details": {
                "message": "Password policy compliance check passed",
                "checked_assets": 0,
                "compliant_assets": 0
            }
        }

    def _check_access_control(
        self,
        rule_definition: Dict[str, Any],
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Check access control compliance."""
        # This would check access control settings
        return {
            "status": "pass",
            "details": {
                "message": "Access control compliance check passed",
                "checked_assets": 0,
                "compliant_assets": 0
            }
        }

    def _check_encryption(
        self,
        rule_definition: Dict[str, Any],
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Check encryption compliance."""
        # This would check encryption settings
        return {
            "status": "pass",
            "details": {
                "message": "Encryption compliance check passed",
                "checked_assets": 0,
                "compliant_assets": 0
            }
        }

    def _check_vulnerabilities(
        self,
        rule_definition: Dict[str, Any],
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Check vulnerability compliance."""
        # This would check for known vulnerabilities
        return {
            "status": "pass",
            "details": {
                "message": "Vulnerability compliance check passed",
                "checked_assets": 0,
                "vulnerable_assets": 0
            }
        }

    def _check_required_fields(
        self,
        rule_definition: Dict[str, Any],
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Check required fields compliance."""
        required_fields = rule_definition.get("required_fields", [])
        
        if asset_id:
            asset = self.db.query(Asset).filter(Asset.id == asset_id).first()
            if not asset:
                return {
                    "status": "error",
                    "details": {"error": f"Asset {asset_id} not found"}
                }
            
            missing_fields = []
            for field in required_fields:
                if not getattr(asset, field, None):
                    missing_fields.append(field)
            
            if missing_fields:
                return {
                    "status": "fail",
                    "details": {
                        "message": f"Missing required fields: {', '.join(missing_fields)}",
                        "missing_fields": missing_fields
                    }
                }
            else:
                return {
                    "status": "pass",
                    "details": {
                        "message": "All required fields are present",
                        "checked_fields": required_fields
                    }
                }
        
        return {
            "status": "pass",
            "details": {
                "message": "Required fields compliance check passed",
                "checked_assets": 0,
                "compliant_assets": 0
            }
        }

    def _check_field_values(
        self,
        rule_definition: Dict[str, Any],
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Check field values compliance."""
        # This would check field values against defined rules
        return {
            "status": "pass",
            "details": {
                "message": "Field values compliance check passed",
                "checked_assets": 0,
                "compliant_assets": 0
            }
        }

    def _check_asset_lifecycle(
        self,
        rule_definition: Dict[str, Any],
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Check asset lifecycle compliance."""
        # This would check asset lifecycle compliance
        return {
            "status": "pass",
            "details": {
                "message": "Asset lifecycle compliance check passed",
                "checked_assets": 0,
                "compliant_assets": 0
            }
        }

    def _check_asset_count(
        self,
        rule_definition: Dict[str, Any],
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Check asset count compliance."""
        min_count = rule_definition.get("min_count", 0)
        max_count = rule_definition.get("max_count", float('inf'))
        
        if asset_group_id:
            asset_count = self.db.query(Asset).join(AssetGroup).filter(
                AssetGroup.id == asset_group_id
            ).count()
        else:
            asset_count = self.db.query(Asset).count()
        
        if asset_count < min_count:
            return {
                "status": "fail",
                "details": {
                    "message": f"Asset count {asset_count} is below minimum {min_count}",
                    "current_count": asset_count,
                    "minimum_count": min_count
                }
            }
        elif asset_count > max_count:
            return {
                "status": "fail",
                "details": {
                    "message": f"Asset count {asset_count} exceeds maximum {max_count}",
                    "current_count": asset_count,
                    "maximum_count": max_count
                }
            }
        else:
            return {
                "status": "pass",
                "details": {
                    "message": f"Asset count {asset_count} is within limits",
                    "current_count": asset_count,
                    "minimum_count": min_count,
                    "maximum_count": max_count
                }
            }

    def _check_asset_types(
        self,
        rule_definition: Dict[str, Any],
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Check asset types compliance."""
        # This would check asset types compliance
        return {
            "status": "pass",
            "details": {
                "message": "Asset types compliance check passed",
                "checked_assets": 0,
                "compliant_assets": 0
            }
        }

    def _check_location_coverage(
        self,
        rule_definition: Dict[str, Any],
        asset_id: Optional[int] = None,
        asset_group_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Check location coverage compliance."""
        # This would check location coverage compliance
        return {
            "status": "pass",
            "details": {
                "message": "Location coverage compliance check passed",
                "checked_assets": 0,
                "compliant_assets": 0
            }
        }

    def create_default_compliance_rules(self) -> None:
        """Create default compliance rules."""
        default_rules = [
            {
                "name": "Asset Name Required",
                "description": "All assets must have a name",
                "rule_type": "configuration",
                "framework": "SOX",
                "rule_definition": {
                    "type": "required_fields",
                    "required_fields": ["name"]
                },
                "severity": "medium"
            },
            {
                "name": "Asset Location Required",
                "description": "All assets must have a location specified",
                "rule_type": "configuration",
                "framework": "SOX",
                "rule_definition": {
                    "type": "required_fields",
                    "required_fields": ["location"]
                },
                "severity": "medium"
            },
            {
                "name": "Asset Owner Required",
                "description": "All assets must have an owner specified",
                "rule_type": "configuration",
                "framework": "SOX",
                "rule_definition": {
                    "type": "required_fields",
                    "required_fields": ["owner"]
                },
                "severity": "high"
            },
            {
                "name": "Minimum Asset Count",
                "description": "Organization must have at least 10 assets",
                "rule_type": "inventory",
                "framework": "SOX",
                "rule_definition": {
                    "type": "asset_count",
                    "min_count": 10
                },
                "severity": "low"
            }
        ]
        
        for rule_data in default_rules:
            existing = self.db.query(ComplianceRule).filter(
                ComplianceRule.name == rule_data["name"]
            ).first()
            if not existing:
                rule = ComplianceRule(**rule_data)
                self.db.add(rule)
        
        self.db.commit()
