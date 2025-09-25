# Add this after the existing models, before the UserSession class

class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    key_hash = Column(String(500), nullable=False, unique=True)  # Hashed version of the key
    key_prefix = Column(String(20), nullable=False)  # First 8 characters for identification
    permissions = Column(JSON, nullable=True)  # List of permissions
    expires_at = Column(DateTime, nullable=True)  # Optional expiration
    last_used = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User")