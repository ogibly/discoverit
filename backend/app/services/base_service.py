"""
Base service class with common functionality for all services.
"""
from typing import TypeVar, Generic, List, Optional, Any, Dict
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')


class BaseService(Generic[T]):
    """Base service class with common CRUD operations."""
    
    def __init__(self, db: Session, model_class: type):
        self.db = db
        self.model_class = model_class
    
    def create(self, data: Dict[str, Any], **kwargs) -> T:
        """Create a new record."""
        try:
            instance = self.model_class(**data, **kwargs)
            self.db.add(instance)
            self.db.commit()
            self.db.refresh(instance)
            return instance
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating {self.model_class.__name__}: {e}")
            raise
    
    def get_by_id(self, record_id: int) -> Optional[T]:
        """Get a record by ID."""
        try:
            return self.db.query(self.model_class).filter(
                self.model_class.id == record_id
            ).first()
        except SQLAlchemyError as e:
            logger.error(f"Error getting {self.model_class.__name__} by ID {record_id}: {e}")
            raise
    
    def get_all(self, skip: int = 0, limit: int = 100, **filters) -> List[T]:
        """Get all records with optional filtering."""
        try:
            query = self.db.query(self.model_class)
            
            # Apply filters
            for key, value in filters.items():
                if hasattr(self.model_class, key) and value is not None:
                    query = query.filter(getattr(self.model_class, key) == value)
            
            return query.offset(skip).limit(limit).all()
        except SQLAlchemyError as e:
            logger.error(f"Error getting {self.model_class.__name__} records: {e}")
            raise
    
    def update(self, record_id: int, data: Dict[str, Any]) -> Optional[T]:
        """Update a record."""
        try:
            instance = self.get_by_id(record_id)
            if not instance:
                return None
            
            for key, value in data.items():
                if hasattr(instance, key):
                    setattr(instance, key, value)
            
            self.db.commit()
            self.db.refresh(instance)
            return instance
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating {self.model_class.__name__} {record_id}: {e}")
            raise
    
    def delete(self, record_id: int) -> bool:
        """Delete a record."""
        try:
            instance = self.get_by_id(record_id)
            if not instance:
                return False
            
            self.db.delete(instance)
            self.db.commit()
            return True
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting {self.model_class.__name__} {record_id}: {e}")
            raise
    
    def count(self, **filters) -> int:
        """Count records with optional filtering."""
        try:
            query = self.db.query(self.model_class)
            
            # Apply filters
            for key, value in filters.items():
                if hasattr(self.model_class, key) and value is not None:
                    query = query.filter(getattr(self.model_class, key) == value)
            
            return query.count()
        except SQLAlchemyError as e:
            logger.error(f"Error counting {self.model_class.__name__} records: {e}")
            raise
    
    def exists(self, record_id: int) -> bool:
        """Check if a record exists."""
        try:
            return self.db.query(self.model_class).filter(
                self.model_class.id == record_id
            ).first() is not None
        except SQLAlchemyError as e:
            logger.error(f"Error checking existence of {self.model_class.__name__} {record_id}: {e}")
            raise
