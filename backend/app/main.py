from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine, Base, SessionLocal
from .routes_v2 import router
import json
from datetime import datetime

app = FastAPI(
    title="DiscoverIT API",
    description="Network device discovery and management API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
def startup_event():
    """Initialize the application on startup."""
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Initialize default settings
    db = SessionLocal()
    try:
        settings = db.query(models.Settings).first()
        if not settings:
            default_scanners = [
                {
                    "name": "Default Scanner",
                    "url": "http://scanner:8001",
                    "subnets": ["172.18.0.0/16"],
                    "is_active": True,
                    "max_concurrent_scans": 3,
                    "timeout_seconds": 300
                }
            ]
            new_settings = models.Settings(
                scanners=default_scanners,
                default_subnet="172.18.0.0/16",
                scan_timeout=300,
                max_concurrent_scans=5,
                auto_discovery_enabled=True
            )
            db.add(new_settings)
            db.commit()
        elif not settings.default_subnet:
            settings.default_subnet = "172.18.0.0/16"
            db.commit()
    finally:
        db.close()

@app.on_event("shutdown")
def shutdown_event():
    """Cleanup on application shutdown."""
    pass

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://frontend:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include API routes
app.include_router(router, prefix="/api/v2", tags=["v2"])

# Legacy routes for backward compatibility
from .routes import router as legacy_router
app.include_router(legacy_router, prefix="/api/v1", tags=["v1"])

@app.get("/")
def read_root():
    """Root endpoint with API information."""
    return {
        "message": "DiscoverIT API",
        "version": "2.0.0",
        "docs": "/docs",
        "api_v1": "/api/v1",
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
