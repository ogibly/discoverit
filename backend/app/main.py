from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime, timezone
from typing import Any

from . import models
from .config import settings
from .database import engine, Base, SessionLocal, get_db
from .routes import router
from .scanner_routes import router as scanner_router
from .enterprise_routes import router as enterprise_router
from .services.auth_service import AuthService
from .middleware.audit_middleware import AuditMiddleware

# Custom JSON encoder for timezone-aware datetime serialization
class TimezoneAwareJSONEncoder:
    """Custom JSON encoder that ensures all datetime objects are serialized with timezone info."""
    
    @staticmethod
    def serialize_datetime(dt: datetime) -> str:
        """Serialize datetime to ISO format with timezone info."""
        if dt is None:
            return None
        
        # If datetime is naive (no timezone), assume it's UTC
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        
        # Return ISO format with timezone info
        return dt.isoformat()
    
    @staticmethod
    def serialize_model(model: Any) -> Any:
        """Recursively serialize a model, converting all datetime fields."""
        if isinstance(model, dict):
            return {key: TimezoneAwareJSONEncoder.serialize_model(value) for key, value in model.items()}
        elif isinstance(model, list):
            return [TimezoneAwareJSONEncoder.serialize_model(item) for item in model]
        elif isinstance(model, datetime):
            return TimezoneAwareJSONEncoder.serialize_datetime(model)
        else:
            return model

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info("Starting DiscoverIT API...")
    
    try:
        # Create database tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")
        
        # Initialize authentication system
        db = SessionLocal()
        try:
            auth_service = AuthService(db)
            
            # Initialize default roles
            auth_service.initialize_default_roles()
            logger.info("Default roles initialized")
            
            # Create default admin user
            auth_service.create_default_admin()
            logger.info("Default admin user created")
            
            # Initialize default settings
            _initialize_default_settings(db)
            logger.info("Default settings initialized")
            
            # Initialize default templates
            from .services.template_service import TemplateService
            template_service = TemplateService(db)
            template_service.create_default_templates()
            logger.info("Default templates initialized")
            
            # Initialize default scanner configuration
            _initialize_default_scanner(db)
            logger.info("Default scanner configuration initialized")
            
            # Ensure all users have access to the default scanner
            from .services.scanner_service import ScannerService
            scanner_service = ScannerService(db)
            grants_created = scanner_service.ensure_all_users_have_default_scanner_access()
            if grants_created > 0:
                logger.info(f"Granted default scanner access to {grants_created} users")
            
        finally:
            db.close()
            
        logger.info("DiscoverIT API startup completed successfully")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise HTTPException(status_code=500, detail="Application startup failed")
    
    yield
    
    # Shutdown
    logger.info("Shutting down DiscoverIT API...")

def _initialize_default_settings(db: SessionLocal):
    """Initialize default application settings."""
    db_settings = db.query(models.Settings).first()
    if not db_settings:
        # Default scanner configuration optimized for containerized environments
        default_scanners = [
            {
                "name": "Default Scanner",
                "url": settings.default_scanner_url,
                "subnets": settings.default_subnets,
                "is_active": True,
                "max_concurrent_scans": 3,
                "timeout_seconds": settings.scan_timeout
            }
        ]
        new_settings = models.Settings(
            scanners=default_scanners
        )
        db.add(new_settings)
        db.commit()

def _initialize_default_scanner(db: SessionLocal):
    """Initialize default scanner configuration as a ScannerConfig entity."""
    from .services.scanner_service import ScannerService
    from .schemas import ScannerConfigCreate
    
    # Check if default scanner already exists
    scanner_service = ScannerService(db)
    existing_default = scanner_service.get_default_scanner()
    
    if not existing_default:
        # Create default scanner configuration
        default_scanner_data = ScannerConfigCreate(
            name="Default Scanner",
            url=settings.default_scanner_url,
            subnets=settings.default_subnets,
            is_active=True,
            is_default=True,
            max_concurrent_scans=3,
            timeout_seconds=settings.scan_timeout
        )
        
        try:
            default_scanner = scanner_service.create_scanner_config(default_scanner_data)
            
            # Grant access to all users for the default scanner
            from .models import User, UserSatelliteScannerAccess
            all_users = db.query(User).all()
            
            for user in all_users:
                # Check if access already exists
                existing_access = db.query(UserSatelliteScannerAccess).filter(
                    UserSatelliteScannerAccess.user_id == user.id,
                    UserSatelliteScannerAccess.scanner_id == default_scanner.id
                ).first()
                
                if not existing_access:
                    access = UserSatelliteScannerAccess(
                        user_id=user.id,
                        scanner_id=default_scanner.id,
                        granted_by=1  # System admin
                    )
                    db.add(access)
            
            db.commit()
            logger.info(f"Default scanner created with ID {default_scanner.id} and access granted to all users")
            
        except Exception as e:
            logger.error(f"Failed to create default scanner: {e}")
            db.rollback()

app = FastAPI(
    title="DiscoverIT API",
    description="Network device discovery and management API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Audit middleware for comprehensive logging
app.add_middleware(AuditMiddleware)

# Include API routes
app.include_router(router, prefix="/api/v2", tags=["v2"])
app.include_router(scanner_router, prefix="/api/v2", tags=["scanners"])
app.include_router(enterprise_router, prefix="/api/v2", tags=["enterprise"])

# Legacy routes removed - only v2 API is used

@app.get("/")
def read_root():
    """Root endpoint with API information."""
    return {
        "message": "DiscoverIT API",
        "version": "2.0.0",
        "docs": "/docs",
        "api_v2": "/api/v2"
    }

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.0"
    }
