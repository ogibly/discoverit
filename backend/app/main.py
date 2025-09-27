from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
from datetime import datetime

from . import models
from .config import settings
from .database import engine, Base, SessionLocal, get_db
from .routes_v2 import router
from .scanner_routes import router as scanner_router
from .routes_enterprise import router as enterprise_router
from .services.auth_service import AuthService

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
            scanners=default_scanners,
            default_subnet=settings.default_subnets[0],
            scan_timeout=settings.scan_timeout,
            max_concurrent_scans=settings.max_concurrent_scans,
            auto_discovery_enabled=True,
            max_discovery_depth=settings.max_discovery_depth
        )
        db.add(new_settings)
        db.commit()
    elif not db_settings.default_subnet:
        db_settings.default_subnet = settings.default_subnets[0]
        if not hasattr(db_settings, 'max_discovery_depth') or db_settings.max_discovery_depth is None:
            db_settings.max_discovery_depth = settings.max_discovery_depth
        db.commit()

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
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0"
    }
