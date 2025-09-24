"""
Custom exceptions for the DiscoverIT API.
"""
from typing import Optional, Dict, Any


class DiscoverITException(Exception):
    """Base exception for DiscoverIT application."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(DiscoverITException):
    """Raised when validation fails."""
    pass


class NotFoundError(DiscoverITException):
    """Raised when a resource is not found."""
    pass


class ConflictError(DiscoverITException):
    """Raised when there's a conflict with existing data."""
    pass


class AuthenticationError(DiscoverITException):
    """Raised when authentication fails."""
    pass


class AuthorizationError(DiscoverITException):
    """Raised when authorization fails."""
    pass


class ServiceError(DiscoverITException):
    """Raised when a service operation fails."""
    pass


class DatabaseError(DiscoverITException):
    """Raised when a database operation fails."""
    pass


class ExternalServiceError(DiscoverITException):
    """Raised when an external service call fails."""
    pass
