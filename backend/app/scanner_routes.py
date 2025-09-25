"""
Scanner Management Routes for DiscoverIT
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
import time

from .database import get_db
from .services.asset_service import AssetService

router = APIRouter()

@router.post("/scanners/register", response_model=Dict[str, Any])
def register_scanner(scanner_data: Dict[str, Any], db: Session = Depends(get_db)):
    """Register a new remote scanner."""
    try:
        # Generate unique scanner ID
        scanner_id = f"scanner_{int(time.time())}"
        
        # Store scanner registration in database or settings
        # For now, we'll add it to the settings scanners list
        service = AssetService(db)
        settings = service.get_settings()
        if not settings:
            settings = service.create_default_settings()
        
        # Add new scanner to the list
        scanners = settings.scanners or []
        new_scanner = {
            "id": scanner_id,
            "name": scanner_data.get("scanner_name"),
            "url": scanner_data.get("scanner_url"),
            "subnets": scanner_data.get("subnets", []),
            "is_active": True,
            "max_concurrent_scans": scanner_data.get("max_concurrent_scans", 3),
            "timeout_seconds": scanner_data.get("timeout_seconds", 300),
            "registered_at": datetime.utcnow().isoformat(),
            "last_heartbeat": datetime.utcnow().isoformat()
        }
        
        scanners.append(new_scanner)
        settings.scanners = scanners
        db.commit()
        
        return {
            "scanner_id": scanner_id,
            "status": "registered",
            "message": "Scanner registered successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scanners/heartbeat")
def scanner_heartbeat(heartbeat_data: Dict[str, Any], db: Session = Depends(get_db)):
    """Receive heartbeat from remote scanner."""
    try:
        scanner_id = heartbeat_data.get("scanner_id")
        if not scanner_id:
            raise HTTPException(status_code=400, detail="scanner_id is required")
        
        # Update scanner heartbeat in settings
        service = AssetService(db)
        settings = service.get_settings()
        if settings and settings.scanners:
            for scanner in settings.scanners:
                if scanner.get("id") == scanner_id:
                    scanner["last_heartbeat"] = datetime.utcnow().isoformat()
                    scanner["status"] = "online"
                    scanner["uptime"] = heartbeat_data.get("uptime", 0)
                    break
        
        db.commit()
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scanners", response_model=List[Dict[str, Any]])
def list_scanners(db: Session = Depends(get_db)):
    """List all registered scanners."""
    try:
        service = AssetService(db)
        settings = service.get_settings()
        if not settings or not settings.scanners:
            return []
        
        return settings.scanners
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/scanners/{scanner_id}")
def remove_scanner(scanner_id: str, db: Session = Depends(get_db)):
    """Remove a registered scanner."""
    try:
        service = AssetService(db)
        settings = service.get_settings()
        if settings and settings.scanners:
            settings.scanners = [s for s in settings.scanners if s.get("id") != scanner_id]
            db.commit()
        
        return {"status": "success", "message": "Scanner removed"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scanners/{scanner_id}/status")
def get_scanner_status(scanner_id: str, db: Session = Depends(get_db)):
    """Get status of a specific scanner."""
    try:
        service = AssetService(db)
        settings = service.get_settings()
        if not settings or not settings.scanners:
            raise HTTPException(status_code=404, detail="Scanner not found")
        
        for scanner in settings.scanners:
            if scanner.get("id") == scanner_id:
                return {
                    "scanner_id": scanner_id,
                    "name": scanner.get("name"),
                    "url": scanner.get("url"),
                    "status": scanner.get("status", "unknown"),
                    "last_heartbeat": scanner.get("last_heartbeat"),
                    "uptime": scanner.get("uptime", 0),
                    "is_active": scanner.get("is_active", False)
                }
        
        raise HTTPException(status_code=404, detail="Scanner not found")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scanners/{scanner_id}/network-update")
def update_scanner_networks(scanner_id: str, network_data: Dict[str, Any], db: Session = Depends(get_db)):
    """Update scanner network information from satellite scanner."""
    try:
        service = AssetService(db)
        settings = service.get_settings()
        if not settings or not settings.scanners:
            raise HTTPException(status_code=404, detail="Scanner not found")
        
        # Find the scanner
        scanner_found = False
        for scanner in settings.scanners:
            if scanner.get("id") == scanner_id:
                scanner_found = True
                
                # Update network information
                network_info = network_data.get('network_info', {})
                subnets = network_info.get('subnets', [])
                
                # Update scanner with new network information
                scanner['subnets'] = subnets
                scanner['network_info'] = network_info
                scanner['last_network_update'] = network_data.get('timestamp')
                scanner['dynamic_network_monitoring'] = True
                scanner['last_heartbeat'] = datetime.utcnow().isoformat()
                scanner['status'] = 'online'
                
                break
        
        if not scanner_found:
            raise HTTPException(status_code=404, detail="Scanner not found")
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Updated network information for scanner {scanner_id}",
            "subnets": network_data.get('network_info', {}).get('subnets', []),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
