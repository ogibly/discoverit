"""
API Key service for managing API keys for satellite scanners and external integrations.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from ..models import APIKey
from ..schemas import APIKeyCreate, APIKeyUpdate
from datetime import datetime, timedelta
import secrets
import hashlib
import json


class APIKeyService:
    def __init__(self, db: Session):
        self.db = db

    def generate_api_key(self) -> tuple[str, str]:
        """Generate a new API key and return both the key and its hash."""
        # Generate a secure random key
        key = f"dit_{secrets.token_urlsafe(32)}"
        
        # Create hash for storage
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        
        # Get prefix for identification
        key_prefix = key[:8]
        
        return key, key_hash, key_prefix

    def create_api_key(self, key_data: APIKeyCreate, created_by: int) -> tuple[APIKey, str]:
        """Create a new API key."""
        # Check if API key with same name already exists
        existing = self.db.query(APIKey).filter(
            APIKey.name == key_data.name
        ).first()
        if existing:
            raise ValueError(f"API key with name '{key_data.name}' already exists")
        
        # Generate new key
        key, key_hash, key_prefix = self.generate_api_key()
        
        # Create API key record
        api_key = APIKey(
            name=key_data.name,
            description=key_data.description,
            key_hash=key_hash,
            key_prefix=key_prefix,
            permissions=key_data.permissions or ["scanner:read", "scanner:write"],
            expires_at=key_data.expires_at,
            is_active=key_data.is_active,
            created_by=created_by
        )
        
        self.db.add(api_key)
        self.db.commit()
        self.db.refresh(api_key)
        
        return api_key, key

    def get_api_key(self, key_id: int) -> Optional[APIKey]:
        """Get an API key by ID."""
        return self.db.query(APIKey).filter(APIKey.id == key_id).first()

    def get_api_keys(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[APIKey]:
        """Get API keys with optional filtering."""
        query = self.db.query(APIKey)
        
        if is_active is not None:
            query = query.filter(APIKey.is_active == is_active)
        
        if search:
            search_filter = APIKey.name.ilike(f"%{search}%")
            query = query.filter(search_filter)
        
        return query.order_by(desc(APIKey.created_at)).offset(skip).limit(limit).all()

    def update_api_key(self, key_id: int, key_data: APIKeyUpdate) -> Optional[APIKey]:
        """Update an API key."""
        api_key = self.get_api_key(key_id)
        if not api_key:
            return None
        
        # Check if new name conflicts with existing API key
        if key_data.name and key_data.name != api_key.name:
            existing = self.db.query(APIKey).filter(
                and_(
                    APIKey.name == key_data.name,
                    APIKey.id != key_id
                )
            ).first()
            if existing:
                raise ValueError(f"API key with name '{key_data.name}' already exists")
        
        # Update fields
        update_data = key_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(api_key, field, value)
        
        api_key.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(api_key)
        return api_key

    def delete_api_key(self, key_id: int) -> bool:
        """Delete an API key."""
        api_key = self.get_api_key(key_id)
        if not api_key:
            return False
        
        self.db.delete(api_key)
        self.db.commit()
        return True

    def validate_api_key(self, key: str) -> Optional[APIKey]:
        """Validate an API key and return the associated record."""
        if not key or not key.startswith('dit_'):
            return None
        
        # Hash the provided key
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        
        # Find matching API key
        api_key = self.db.query(APIKey).filter(
            and_(
                APIKey.key_hash == key_hash,
                APIKey.is_active == True
            )
        ).first()
        
        if not api_key:
            return None
        
        # Check expiration
        if api_key.expires_at and api_key.expires_at < datetime.utcnow():
            return None
        
        # Update last used timestamp
        api_key.last_used = datetime.utcnow()
        self.db.commit()
        
        return api_key

    def get_api_key_statistics(self) -> Dict[str, Any]:
        """Get statistics about API keys."""
        total_keys = self.db.query(APIKey).count()
        active_keys = self.db.query(APIKey).filter(APIKey.is_active == True).count()
        expired_keys = self.db.query(APIKey).filter(
            and_(
                APIKey.expires_at.isnot(None),
                APIKey.expires_at < datetime.utcnow()
            )
        ).count()
        
        # Get recently used keys (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recently_used = self.db.query(APIKey).filter(
            APIKey.last_used >= week_ago
        ).count()
        
        return {
            "total_keys": total_keys,
            "active_keys": active_keys,
            "inactive_keys": total_keys - active_keys,
            "expired_keys": expired_keys,
            "recently_used": recently_used
        }

    def revoke_api_key(self, key_id: int) -> bool:
        """Revoke an API key by setting it as inactive."""
        api_key = self.get_api_key(key_id)
        if not api_key:
            return False
        
        api_key.is_active = False
        api_key.updated_at = datetime.utcnow()
        self.db.commit()
        return True

    def regenerate_api_key(self, key_id: int) -> tuple[APIKey, str]:
        """Regenerate an API key (creates new key, keeps same record)."""
        api_key = self.get_api_key(key_id)
        if not api_key:
            raise ValueError("API key not found")
        
        # Generate new key
        key, key_hash, key_prefix = self.generate_api_key()
        
        # Update the record
        api_key.key_hash = key_hash
        api_key.key_prefix = key_prefix
        api_key.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(api_key)
        
        return api_key, key
