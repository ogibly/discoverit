"""
Authentication dependencies and middleware.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List
from .database import SessionLocal
from .services.auth_service import AuthService
from .models import User

# Security scheme
security = HTTPBearer()

def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Get authentication service."""
    return AuthService(db)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify token
    user_id = auth_service.verify_token(credentials.credentials)
    if user_id is None:
        raise credentials_exception
    
    # Get user
    user = auth_service.get_user(user_id)
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_permission(permission: str):
    """Decorator to require a specific permission."""
    def permission_checker(
        current_user: User = Depends(get_current_active_user),
        auth_service: AuthService = Depends(get_auth_service)
    ) -> User:
        if not auth_service.check_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required"
            )
        return current_user
    return permission_checker

def require_permissions(permissions: List[str]):
    """Decorator to require any of the specified permissions."""
    def permissions_checker(
        current_user: User = Depends(get_current_active_user),
        auth_service: AuthService = Depends(get_auth_service)
    ) -> User:
        user_permissions = auth_service.get_user_permissions(current_user)
        if not any(perm in user_permissions for perm in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of the following permissions required: {', '.join(permissions)}"
            )
        return current_user
    return permissions_checker

def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """Require admin privileges."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

# Common permission dependencies
require_assets_read = require_permission("assets:read")
require_assets_write = require_permissions(["assets:create", "assets:update", "assets:delete"])
require_discovery_read = require_permission("discovery:read")
require_discovery_write = require_permissions(["discovery:create", "discovery:update", "discovery:delete"])
require_scanners_read = require_permission("scanners:read")
require_scanners_write = require_permissions(["scanners:create", "scanners:update", "scanners:delete"])
require_operations_read = require_permission("operations:read")
require_operations_write = require_permissions(["operations:create", "operations:update", "operations:delete"])
require_operations_execute = require_permission("operations:execute")
require_credentials_read = require_permission("credentials:read")
require_credentials_write = require_permissions(["credentials:create", "credentials:update", "credentials:delete"])
require_users_read = require_permission("users:read")
require_users_write = require_permissions(["users:create", "users:update", "users:delete"])
require_roles_read = require_permission("roles:read")
require_roles_write = require_permissions(["roles:create", "roles:update", "roles:delete"])
require_settings_read = require_permission("settings:read")
require_settings_write = require_permission("settings:update")
