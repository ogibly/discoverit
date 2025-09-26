"""
Authentication service for user management and role-based permissions.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc, or_
from ..models import User, Role, UserSession, LDAPConfig
from ..schemas import UserCreate, UserUpdate, UserPasswordUpdate, RoleCreate, RoleUpdate
from datetime import datetime, timedelta
import secrets
import hashlib
from jose import jwt
from passlib.context import CryptContext

# Password hashing - using pbkdf2_sha256 to avoid bcrypt issues
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# JWT settings
SECRET_KEY = "your-secret-key-here"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
SESSION_EXPIRE_DAYS = 7

# Permission constants
PERMISSIONS = {
    # Asset permissions
    "assets:read": "View assets",
    "assets:create": "Create assets",
    "assets:update": "Update assets",
    "assets:delete": "Delete assets",
    
    # Discovery permissions
    "discovery:read": "View discovery results",
    "discovery:create": "Start discovery scans",
    "discovery:update": "Modify discovery settings",
    "discovery:delete": "Cancel discovery scans",
    
    # Scanner permissions
    "scanners:read": "View scanner configurations",
    "scanners:create": "Create scanner configurations",
    "scanners:update": "Update scanner configurations",
    "scanners:delete": "Delete scanner configurations",
    
    # Operation permissions
    "operations:read": "View operations",
    "operations:create": "Create operations",
    "operations:update": "Update operations",
    "operations:delete": "Delete operations",
    "operations:execute": "Execute operations",
    
    # Credential permissions
    "credentials:read": "View credentials",
    "credentials:create": "Create credentials",
    "credentials:update": "Update credentials",
    "credentials:delete": "Delete credentials",
    
    # User management permissions
    "users:read": "View users",
    "users:create": "Create users",
    "users:update": "Update users",
    "users:delete": "Delete users",
    
    # Role management permissions
    "roles:read": "View roles",
    "roles:create": "Create roles",
    "roles:update": "Update roles",
    "roles:delete": "Delete roles",
    
    # Settings permissions
    "settings:read": "View settings",
    "settings:update": "Update settings",
}

# Default roles
DEFAULT_ROLES = {
    "admin": {
        "name": "Administrator",
        "description": "Full system access",
        "permissions": list(PERMISSIONS.keys())
    },
    "operator": {
        "name": "Operator",
        "description": "Can manage assets, run operations, and view most data",
        "permissions": [
            "assets:read", "assets:create", "assets:update", "assets:delete",
            "discovery:read", "discovery:create", "discovery:update", "discovery:delete",
            "scanners:read",
            "operations:read", "operations:create", "operations:update", "operations:execute",
            "credentials:read", "credentials:create", "credentials:update", "credentials:delete",
            "settings:read"
        ]
    },
    "viewer": {
        "name": "Viewer",
        "description": "Read-only access to most data",
        "permissions": [
            "assets:read",
            "discovery:read",
            "scanners:read",
            "operations:read",
            "credentials:read",
            "settings:read"
        ]
    }
}


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def hash_password(self, password: str) -> str:
        """Hash a password."""
        # Truncate password if it's longer than 72 bytes (bcrypt limit)
        if len(password.encode('utf-8')) > 72:
            password = password[:72]
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        # Truncate password if it's longer than 72 bytes (bcrypt limit)
        if len(plain_password.encode('utf-8')) > 72:
            plain_password = plain_password[:72]
        return pwd_context.verify(plain_password, hashed_password)

    def create_access_token(self, user_id: int, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token."""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode = {"sub": str(user_id), "exp": expire}
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def verify_token(self, token: str) -> Optional[int]:
        """Verify a JWT token and return user ID."""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            return int(user_id)
        except Exception:
            return None

    def create_session(self, user_id: int, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> UserSession:
        """Create a user session."""
        # Generate session token
        session_token = secrets.token_urlsafe(32)
        
        # Set expiration
        expires_at = datetime.utcnow() + timedelta(days=SESSION_EXPIRE_DAYS)
        
        # Create session
        session = UserSession(
            user_id=user_id,
            session_token=session_token,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_session(self, session_token: str) -> Optional[UserSession]:
        """Get a user session by token."""
        return self.db.query(UserSession).filter(
            and_(
                UserSession.session_token == session_token,
                UserSession.expires_at > datetime.utcnow()
            )
        ).first()

    def update_session_activity(self, session_token: str) -> bool:
        """Update session last activity time."""
        session = self.get_session(session_token)
        if not session:
            return False
        
        session.last_activity = datetime.utcnow()
        self.db.commit()
        return True

    def delete_session(self, session_token: str) -> bool:
        """Delete a user session."""
        session = self.get_session(session_token)
        if not session:
            return False
        
        self.db.delete(session)
        self.db.commit()
        return True

    def delete_user_sessions(self, user_id: int) -> int:
        """Delete all sessions for a user."""
        sessions = self.db.query(UserSession).filter(UserSession.user_id == user_id).all()
        count = len(sessions)
        for session in sessions:
            self.db.delete(session)
        self.db.commit()
        return count

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate a user with username and password."""
        user = self.db.query(User).filter(
            and_(
                User.username == username,
                User.is_active == True
            )
        ).options(joinedload(User.role)).first()
        
        if not user:
            return None
        
        # Handle LDAP authentication
        if user.auth_source == "ldap":
            from .ldap_service import LDAPService
            ldap_service = LDAPService(self.db)
            
            # Get default LDAP config
            ldap_config = self.db.query(LDAPConfig).filter(
                LDAPConfig.is_default == True,
                LDAPConfig.is_active == True
            ).first()
            
            if not ldap_config:
                logger.error("No default LDAP configuration found")
                return None
            
            # Authenticate against LDAP
            ldap_user_data = ldap_service.authenticate_user(username, password, ldap_config)
            if not ldap_user_data:
                return None
            
            # Update user info from LDAP
            user.email = ldap_user_data.get("email", user.email)
            user.full_name = ldap_user_data.get("full_name", user.full_name)
            user.last_ldap_sync = datetime.utcnow()
            
        else:
            # Handle local authentication
            if not user.hashed_password or not self.verify_password(password, user.hashed_password):
                return None
        
        # Update login info
        user.last_login = datetime.utcnow()
        user.login_count += 1
        self.db.commit()
        
        return user

    def get_user(self, user_id: int) -> Optional[User]:
        """Get a user by ID."""
        return self.db.query(User).options(joinedload(User.role)).filter(User.id == user_id).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get a user by username."""
        return self.db.query(User).options(joinedload(User.role)).filter(User.username == username).first()

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user."""
        # Check if username or email already exists
        existing_user = self.db.query(User).filter(
            or_(User.username == user_data.username, User.email == user_data.email)
        ).first()
        if existing_user:
            raise ValueError("Username or email already exists")
        
        # Hash password
        hashed_password = self.hash_password(user_data.password)
        
        # Create user
        user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            is_active=user_data.is_active,
            role_id=user_data.role_id
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user(self, user_id: int, user_data: UserUpdate) -> Optional[User]:
        """Update a user."""
        user = self.get_user(user_id)
        if not user:
            return None
        
        # Check for username/email conflicts
        if user_data.username and user_data.username != user.username:
            existing = self.db.query(User).filter(User.username == user_data.username).first()
            if existing:
                raise ValueError("Username already exists")
        
        if user_data.email and user_data.email != user.email:
            existing = self.db.query(User).filter(User.email == user_data.email).first()
            if existing:
                raise ValueError("Email already exists")
        
        # Update fields
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        return user

    def change_password(self, user_id: int, password_data: UserPasswordUpdate) -> bool:
        """Change a user's password."""
        user = self.get_user(user_id)
        if not user:
            return False
        
        # Verify current password
        if not self.verify_password(password_data.current_password, user.hashed_password):
            raise ValueError("Current password is incorrect")
        
        # Update password
        user.hashed_password = self.hash_password(password_data.new_password)
        user.updated_at = datetime.utcnow()
        self.db.commit()
        return True

    def delete_user(self, user_id: int) -> bool:
        """Delete a user."""
        user = self.get_user(user_id)
        if not user:
            return False
        
        # Delete user sessions
        self.delete_user_sessions(user_id)
        
        # Delete user
        self.db.delete(user)
        self.db.commit()
        return True

    def get_users(self, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None) -> List[User]:
        """Get users with optional filtering."""
        query = self.db.query(User).options(joinedload(User.role))
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        return query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()

    def create_role(self, role_data: RoleCreate) -> Role:
        """Create a new role."""
        # Check if role name already exists
        existing = self.db.query(Role).filter(Role.name == role_data.name).first()
        if existing:
            raise ValueError(f"Role with name '{role_data.name}' already exists")
        
        role = Role(**role_data.dict())
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        return role

    def get_role(self, role_id: int) -> Optional[Role]:
        """Get a role by ID."""
        return self.db.query(Role).filter(Role.id == role_id).first()

    def get_roles(self, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None) -> List[Role]:
        """Get roles with optional filtering."""
        query = self.db.query(Role)
        
        if is_active is not None:
            query = query.filter(Role.is_active == is_active)
        
        return query.order_by(Role.name).offset(skip).limit(limit).all()

    def update_role(self, role_id: int, role_data: RoleUpdate) -> Optional[Role]:
        """Update a role."""
        role = self.get_role(role_id)
        if not role:
            return None
        
        # Check for name conflicts
        if role_data.name and role_data.name != role.name:
            existing = self.db.query(Role).filter(Role.name == role_data.name).first()
            if existing:
                raise ValueError(f"Role with name '{role_data.name}' already exists")
        
        # Update fields
        update_data = role_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(role, field, value)
        
        role.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(role)
        return role

    def delete_role(self, role_id: int) -> bool:
        """Delete a role."""
        role = self.get_role(role_id)
        if not role:
            return False
        
        # Check if role is in use
        users_with_role = self.db.query(User).filter(User.role_id == role_id).count()
        if users_with_role > 0:
            raise ValueError(f"Cannot delete role '{role.name}' - it is assigned to {users_with_role} users")
        
        self.db.delete(role)
        self.db.commit()
        return True

    def check_permission(self, user: User, permission: str) -> bool:
        """Check if a user has a specific permission."""
        # Superusers have all permissions
        if user.is_superuser:
            return True
        
        # Check role permissions
        if user.role and user.role.permissions:
            return permission in user.role.permissions
        
        return False

    def get_user_permissions(self, user: User) -> List[str]:
        """Get all permissions for a user."""
        if user.is_superuser:
            return list(PERMISSIONS.keys())
        
        if user.role and user.role.permissions:
            return user.role.permissions
        
        return []

    def initialize_default_roles(self) -> None:
        """Initialize default roles if they don't exist."""
        for role_key, role_data in DEFAULT_ROLES.items():
            existing = self.db.query(Role).filter(Role.name == role_data["name"]).first()
            if not existing:
                role = Role(
                    name=role_data["name"],
                    description=role_data["description"],
                    permissions=role_data["permissions"]
                )
                self.db.add(role)
        
        self.db.commit()

    def create_default_admin(self) -> User:
        """Create a default admin user if none exists."""
        existing_admin = self.db.query(User).filter(User.is_superuser == True).first()
        if existing_admin:
            return existing_admin
        
        # Get admin role
        admin_role = self.db.query(Role).filter(Role.name == "Administrator").first()
        
        # Create admin user
        admin_user = User(
            username="admin",
            email="admin@discoverit.local",
            full_name="System Administrator",
            hashed_password=self.hash_password("admin123"),  # Change in production!
            is_active=True,
            is_superuser=True,
            role_id=admin_role.id if admin_role else None
        )
        
        self.db.add(admin_user)
        self.db.commit()
        self.db.refresh(admin_user)
        return admin_user
