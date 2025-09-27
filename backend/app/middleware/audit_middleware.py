"""
Audit middleware for comprehensive request logging.
"""
import time
import json
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..services.audit_service import AuditService


class AuditMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, exclude_paths: list = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/favicon.ico"
        ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip audit logging for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        start_time = time.time()
        
        # Extract request information
        request_info = {
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "headers": dict(request.headers),
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
        }

        # Get user information if available
        user_id = None
        try:
            # Try to get user from request state (set by auth middleware)
            if hasattr(request.state, "user") and request.state.user:
                user_id = request.state.user.id
        except:
            pass

        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time

        # Log the request
        await self._log_request(
            user_id=user_id,
            request_info=request_info,
            response_status=response.status_code,
            process_time=process_time
        )

        return response

    async def _log_request(
        self,
        user_id: int = None,
        request_info: dict = None,
        response_status: int = None,
        process_time: float = None
    ):
        """Log the request to audit system."""
        try:
            db = SessionLocal()
            try:
                audit_service = AuditService(db)
                
                # Determine action based on HTTP method and path
                action = self._determine_action(request_info["method"], request_info["path"])
                resource_type = self._determine_resource_type(request_info["path"])
                
                # Extract resource ID if present
                resource_id = self._extract_resource_id(request_info["path"])
                
                # Log the action
                audit_service.log_action(
                    action=action,
                    resource_type=resource_type,
                    user_id=user_id,
                    resource_id=resource_id,
                    resource_name=request_info["path"],
                    details={
                        "method": request_info["method"],
                        "url": request_info["url"],
                        "query_params": request_info["query_params"],
                        "response_status": response_status,
                        "process_time": process_time,
                        "user_agent": request_info["user_agent"]
                    },
                    ip_address=request_info["client_ip"],
                    user_agent=request_info["user_agent"],
                    success=200 <= response_status < 400,
                    error_message=None if 200 <= response_status < 400 else f"HTTP {response_status}"
                )
            finally:
                db.close()
        except Exception as e:
            # Don't let audit logging errors break the request
            print(f"Audit logging error: {e}")

    def _determine_action(self, method: str, path: str) -> str:
        """Determine the action based on HTTP method and path."""
        if method == "GET":
            return "READ"
        elif method == "POST":
            if "login" in path.lower():
                return "LOGIN"
            elif "logout" in path.lower():
                return "LOGOUT"
            else:
                return "CREATE"
        elif method == "PUT" or method == "PATCH":
            return "UPDATE"
        elif method == "DELETE":
            return "DELETE"
        else:
            return method.upper()

    def _determine_resource_type(self, path: str) -> str:
        """Determine the resource type based on the path."""
        path_parts = path.strip("/").split("/")
        
        if len(path_parts) >= 2:
            resource = path_parts[1]
            # Map API paths to resource types
            resource_mapping = {
                "assets": "asset",
                "asset-groups": "asset_group",
                "scans": "scan",
                "scanners": "scanner",
                "users": "user",
                "roles": "role",
                "labels": "label",
                "credentials": "credential",
                "settings": "setting",
                "webhooks": "webhook",
                "templates": "template",
                "analytics": "analytics",
                "audit-logs": "audit_log"
            }
            return resource_mapping.get(resource, "unknown")
        
        return "system"

    def _extract_resource_id(self, path: str) -> int:
        """Extract resource ID from the path if present."""
        try:
            path_parts = path.strip("/").split("/")
            # Look for numeric ID in the path
            for part in path_parts:
                if part.isdigit():
                    return int(part)
        except:
            pass
        return None
