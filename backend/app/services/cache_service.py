"""
Caching service for frequently accessed data.
"""
import json
import pickle
from typing import Any, Optional, Dict, List, Union
from datetime import datetime, timedelta
import hashlib
import logging
from functools import wraps

logger = logging.getLogger(__name__)


class CacheService:
    """Simple in-memory cache service."""
    
    def __init__(self, default_ttl: int = 300):  # 5 minutes default TTL
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl
        self.logger = logging.getLogger(f"{self.__class__.__module__}.{self.__class__.__name__}")
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate a cache key from arguments."""
        key_data = {
            'args': args,
            'kwargs': sorted(kwargs.items())
        }
        key_string = json.dumps(key_data, sort_keys=True)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"{prefix}:{key_hash}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from cache."""
        if key not in self._cache:
            return None
        
        cache_entry = self._cache[key]
        
        # Check if expired
        if datetime.utcnow() > cache_entry['expires_at']:
            del self._cache[key]
            return None
        
        self.logger.debug(f"Cache hit for key: {key}")
        return cache_entry['value']
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a value in cache."""
        ttl = ttl or self.default_ttl
        expires_at = datetime.utcnow() + timedelta(seconds=ttl)
        
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': datetime.utcnow()
        }
        
        self.logger.debug(f"Cached value for key: {key} (TTL: {ttl}s)")
    
    def delete(self, key: str) -> bool:
        """Delete a value from cache."""
        if key in self._cache:
            del self._cache[key]
            self.logger.debug(f"Deleted cache key: {key}")
            return True
        return False
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self._cache.clear()
        self.logger.info("Cache cleared")
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear cache entries matching a pattern."""
        keys_to_delete = [key for key in self._cache.keys() if pattern in key]
        for key in keys_to_delete:
            del self._cache[key]
        
        self.logger.info(f"Cleared {len(keys_to_delete)} cache entries matching pattern: {pattern}")
        return len(keys_to_delete)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        now = datetime.utcnow()
        total_entries = len(self._cache)
        expired_entries = sum(1 for entry in self._cache.values() if now > entry['expires_at'])
        
        return {
            'total_entries': total_entries,
            'expired_entries': expired_entries,
            'active_entries': total_entries - expired_entries,
            'cache_size_bytes': sum(len(pickle.dumps(entry)) for entry in self._cache.values())
        }
    
    def cleanup_expired(self) -> int:
        """Remove expired entries from cache."""
        now = datetime.utcnow()
        expired_keys = [
            key for key, entry in self._cache.items()
            if now > entry['expires_at']
        ]
        
        for key in expired_keys:
            del self._cache[key]
        
        if expired_keys:
            self.logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
        
        return len(expired_keys)


def cached(prefix: str, ttl: int = 300):
    """Decorator to cache function results."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get cache service from first argument (usually self)
            cache_service = getattr(args[0], 'cache_service', None) if args else None
            
            if not cache_service:
                # If no cache service available, just call the function
                return func(*args, **kwargs)
            
            # Generate cache key
            key = cache_service._generate_key(prefix, func.__name__, *args, **kwargs)
            
            # Try to get from cache
            cached_result = cache_service.get(key)
            if cached_result is not None:
                return cached_result
            
            # Call function and cache result
            result = func(*args, **kwargs)
            cache_service.set(key, result, ttl)
            return result
        
        return wrapper
    return decorator


class CacheableService:
    """Mixin for services that support caching."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.cache_service = CacheService()
    
    def invalidate_cache(self, pattern: str = None) -> int:
        """Invalidate cache entries."""
        if pattern:
            return self.cache_service.clear_pattern(pattern)
        else:
            self.cache_service.clear()
            return 0


# Global cache service instance
_cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """Get the global cache service instance."""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service


def reset_cache_service():
    """Reset the global cache service (useful for testing)."""
    global _cache_service
    _cache_service = None
