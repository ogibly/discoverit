"""
Credential service for managing user credentials and key pairs.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from ..models import Credential
from ..schemas import CredentialCreate, CredentialUpdate
from datetime import datetime
import json


class CredentialService:
    def __init__(self, db: Session):
        self.db = db

    def create_credential(self, credential_data: CredentialCreate) -> Credential:
        """Create a new credential."""
        # Check if credential with same name already exists
        existing = self.db.query(Credential).filter(
            Credential.name == credential_data.name
        ).first()
        if existing:
            raise ValueError(f"Credential with name '{credential_data.name}' already exists")
        
        credential = Credential(
            name=credential_data.name,
            description=credential_data.description,
            credential_type=credential_data.credential_type,
            username=credential_data.username,
            password=credential_data.password,
            ssh_private_key=credential_data.ssh_private_key,
            ssh_public_key=credential_data.ssh_public_key,
            ssh_passphrase=credential_data.ssh_passphrase,
            api_key=credential_data.api_key,
            api_secret=credential_data.api_secret,
            certificate_data=credential_data.certificate_data,
            private_key_data=credential_data.private_key_data,
            domain=credential_data.domain,
            port=credential_data.port,
            created_by=credential_data.created_by,
            is_active=credential_data.is_active,
            tags=credential_data.tags
        )
        
        self.db.add(credential)
        self.db.commit()
        self.db.refresh(credential)
        return credential

    def get_credential(self, credential_id: int) -> Optional[Credential]:
        """Get a credential by ID."""
        return self.db.query(Credential).filter(Credential.id == credential_id).first()

    def get_credential_by_name(self, name: str) -> Optional[Credential]:
        """Get a credential by name."""
        return self.db.query(Credential).filter(Credential.name == name).first()

    def get_credentials(
        self,
        skip: int = 0,
        limit: int = 100,
        credential_type: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> List[Credential]:
        """Get credentials with optional filtering."""
        query = self.db.query(Credential)
        
        if credential_type:
            query = query.filter(Credential.credential_type == credential_type)
        
        if is_active is not None:
            query = query.filter(Credential.is_active == is_active)
        
        if search:
            search_filter = or_(
                Credential.name.ilike(f"%{search}%"),
                Credential.description.ilike(f"%{search}%"),
                Credential.username.ilike(f"%{search}%"),
                Credential.domain.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        if tags:
            # Filter by tags (assuming tags is stored as JSON array)
            for tag in tags:
                query = query.filter(Credential.tags.contains([tag]))
        
        return query.order_by(desc(Credential.created_at)).offset(skip).limit(limit).all()

    def update_credential(self, credential_id: int, credential_data: CredentialUpdate) -> Optional[Credential]:
        """Update a credential."""
        credential = self.get_credential(credential_id)
        if not credential:
            return None
        
        # Check if new name conflicts with existing credential
        if credential_data.name and credential_data.name != credential.name:
            existing = self.db.query(Credential).filter(
                and_(
                    Credential.name == credential_data.name,
                    Credential.id != credential_id
                )
            ).first()
            if existing:
                raise ValueError(f"Credential with name '{credential_data.name}' already exists")
        
        # Update fields
        update_data = credential_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(credential, field, value)
        
        credential.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(credential)
        return credential

    def delete_credential(self, credential_id: int) -> bool:
        """Delete a credential."""
        credential = self.get_credential(credential_id)
        if not credential:
            return False
        
        self.db.delete(credential)
        self.db.commit()
        return True

    def mark_credential_used(self, credential_id: int) -> bool:
        """Mark a credential as used (update last_used timestamp)."""
        credential = self.get_credential(credential_id)
        if not credential:
            return False
        
        credential.last_used = datetime.utcnow()
        self.db.commit()
        return True

    def get_credentials_by_type(self, credential_type: str) -> List[Credential]:
        """Get all active credentials of a specific type."""
        return self.db.query(Credential).filter(
            and_(
                Credential.credential_type == credential_type,
                Credential.is_active == True
            )
        ).order_by(Credential.name).all()


    def validate_credential_data(self, credential_data: CredentialCreate) -> List[str]:
        """Validate credential data and return list of errors."""
        errors = []
        
        # Validate credential type specific fields
        if credential_data.credential_type == 'username_password':
            if not credential_data.username:
                errors.append("Username is required for username_password credentials")
            if not credential_data.password:
                errors.append("Password is required for username_password credentials")
        
        elif credential_data.credential_type == 'ssh_key':
            if not credential_data.ssh_private_key:
                errors.append("SSH private key is required for ssh_key credentials")
        
        elif credential_data.credential_type == 'api_key':
            if not credential_data.api_key:
                errors.append("API key is required for api_key credentials")
        
        elif credential_data.credential_type == 'certificate':
            if not credential_data.certificate_data:
                errors.append("Certificate data is required for certificate credentials")
        
        return errors

    def get_credential_statistics(self) -> Dict[str, Any]:
        """Get statistics about credentials."""
        total_credentials = self.db.query(Credential).count()
        active_credentials = self.db.query(Credential).filter(Credential.is_active == True).count()
        
        # Count by type
        type_counts = {}
        for credential_type in ['username_password', 'ssh_key', 'api_key', 'certificate']:
            count = self.db.query(Credential).filter(
                and_(
                    Credential.credential_type == credential_type,
                    Credential.is_active == True
                )
            ).count()
            type_counts[credential_type] = count
        
        return {
            'total_credentials': total_credentials,
            'active_credentials': active_credentials,
            'inactive_credentials': total_credentials - active_credentials,
            'by_type': type_counts
        }
