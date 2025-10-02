"""
Enhanced base service class with common functionality for all services.
"""
from typing import TypeVar, Generic, List, Optional, Any, Dict, Callable, Union
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from contextlib import contextmanager
import logging
from functools import wraps

logger = logging.getLogger(__name__)

T = TypeVar('T')


class ServiceError(Exception):
    """Base exception for service layer errors."""
    pass


class ValidationError(ServiceError):
    """Raised when validation fails."""
    pass


class NotFoundError(ServiceError):
    """Raised when a resource is not found."""
    pass


class DuplicateError(ServiceError):
    """Raised when trying to create a duplicate resource."""
    pass


def handle_db_errors(func: Callable) -> Callable:
    """Decorator to handle database errors consistently."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except IntegrityError as e:
            logger.error(f"Database integrity error in {func.__name__}: {e}")
            raise DuplicateError(f"Resource already exists: {str(e)}")
        except SQLAlchemyError as e:
            logger.error(f"Database error in {func.__name__}: {e}")
            raise ServiceError(f"Database operation failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {e}")
            raise ServiceError(f"Operation failed: {str(e)}")
    return wrapper


class BaseService(Generic[T]):
    """Enhanced base service class with common CRUD operations and error handling."""
    
    def __init__(self, db: Session, model_class: type):
        self.db = db
        self.model_class = model_class
        self.logger = logging.getLogger(f"{self.__class__.__module__}.{self.__class__.__name__}")
    
    @contextmanager
    def transaction(self):
        """Context manager for database transactions."""
        try:
            yield self.db
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Transaction rolled back: {e}")
            raise
    
    @handle_db_errors
    def create(self, data: Dict[str, Any], **kwargs) -> T:
        """Create a new record with enhanced error handling."""
        with self.transaction():
            instance = self.model_class(**data, **kwargs)
            self.db.add(instance)
            self.db.flush()  # Get ID without committing
            return instance
    
    @handle_db_errors
    def get_by_id(self, record_id: int) -> Optional[T]:
        """Get a record by ID."""
        return self.db.query(self.model_class).filter(
            self.model_class.id == record_id
        ).first()
    
    @handle_db_errors
    def get_by_field(self, field: str, value: Any) -> Optional[T]:
        """Get a record by a specific field."""
        if not hasattr(self.model_class, field):
            raise ValidationError(f"Field '{field}' does not exist on {self.model_class.__name__}")
        return self.db.query(self.model_class).filter(
            getattr(self.model_class, field) == value
        ).first()
    
    @handle_db_errors
    def get_all(self, skip: int = 0, limit: int = 100, **filters) -> List[T]:
        """Get all records with optional filtering."""
        query = self.db.query(self.model_class)
        
        # Apply filters
        for key, value in filters.items():
            if hasattr(self.model_class, key) and value is not None:
                query = query.filter(getattr(self.model_class, key) == value)
        
        return query.offset(skip).limit(limit).all()
    
    @handle_db_errors
    def update(self, record_id: int, data: Dict[str, Any]) -> Optional[T]:
        """Update a record with enhanced error handling."""
        with self.transaction():
            instance = self.get_by_id(record_id)
            if not instance:
                raise NotFoundError(f"{self.model_class.__name__} with ID {record_id} not found")
            
            for key, value in data.items():
                if hasattr(instance, key):
                    setattr(instance, key, value)
                else:
                    self.logger.warning(f"Field '{key}' does not exist on {self.model_class.__name__}")
            
            return instance
    
    @handle_db_errors
    def delete(self, record_id: int) -> bool:
        """Delete a record with enhanced error handling."""
        with self.transaction():
            instance = self.get_by_id(record_id)
            if not instance:
                raise NotFoundError(f"{self.model_class.__name__} with ID {record_id} not found")
            
            self.db.delete(instance)
            return True
    
    @handle_db_errors
    def count(self, **filters) -> int:
        """Count records with optional filtering."""
        query = self.db.query(self.model_class)
        
        # Apply filters
        for key, value in filters.items():
            if hasattr(self.model_class, key) and value is not None:
                query = query.filter(getattr(self.model_class, key) == value)
        
        return query.count()
    
    @handle_db_errors
    def exists(self, record_id: int) -> bool:
        """Check if a record exists."""
        return self.db.query(self.model_class).filter(
            self.model_class.id == record_id
        ).first() is not None
    
    @handle_db_errors
    def exists_by_field(self, field: str, value: Any) -> bool:
        """Check if a record exists by a specific field."""
        if not hasattr(self.model_class, field):
            raise ValidationError(f"Field '{field}' does not exist on {self.model_class.__name__}")
        return self.db.query(self.model_class).filter(
            getattr(self.model_class, field) == value
        ).first() is not None
    
    def validate_unique(self, field: str, value: Any, exclude_id: Optional[int] = None) -> bool:
        """Validate that a field value is unique."""
        query = self.db.query(self.model_class).filter(
            getattr(self.model_class, field) == value
        )
        if exclude_id:
            query = query.filter(self.model_class.id != exclude_id)
        return query.first() is None
