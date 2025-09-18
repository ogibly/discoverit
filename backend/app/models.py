from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, Boolean, Text, JSON, Index
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

# Association tables for many-to-many relationships
asset_group_association = Table(
    'asset_group_association', Base.metadata,
    Column('asset_id', Integer, ForeignKey('assets.id', ondelete='CASCADE')),
    Column('asset_group_id', Integer, ForeignKey('asset_groups.id', ondelete='CASCADE'))
)

asset_label_association = Table(
    'asset_label_association', Base.metadata,
    Column('asset_id', Integer, ForeignKey('assets.id', ondelete='CASCADE')),
    Column('label_id', Integer, ForeignKey('labels.id', ondelete='CASCADE'))
)

asset_group_label_association = Table(
    'asset_group_label_association', Base.metadata,
    Column('asset_group_id', Integer, ForeignKey('asset_groups.id', ondelete='CASCADE')),
    Column('label_id', Integer, ForeignKey('labels.id', ondelete='CASCADE'))
)

class Label(Base):
    __tablename__ = "labels"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)  # Hex color code
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Network information
    primary_ip = Column(String(45), index=True, nullable=True)  # IPv4 or IPv6
    mac_address = Column(String(17), nullable=True)
    
    # Device information
    hostname = Column(String(255), nullable=True)
    os_name = Column(String(100), nullable=True)
    os_family = Column(String(50), nullable=True)
    os_version = Column(String(100), nullable=True)
    manufacturer = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    serial_number = Column(String(100), nullable=True)
    
    # Management information
    owner = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    department = Column(String(100), nullable=True)
    
    # Credentials (should be encrypted in production)
    username = Column(String(100), nullable=True)
    password = Column(String(255), nullable=True)  # Should be encrypted
    ssh_key = Column(Text, nullable=True)
    
    # Status and metadata
    is_managed = Column(Boolean, default=False)  # True if manually managed asset
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Additional data as JSON
    custom_fields = Column(JSON, nullable=True)
    scan_data = Column(JSON, nullable=True)  # Latest scan results
    
    # Relationships
    ip_addresses = relationship("IPAddress", back_populates="asset", cascade="all, delete-orphan")
    groups = relationship("AssetGroup", secondary=asset_group_association, back_populates="assets")
    labels = relationship("Label", secondary=asset_label_association)
    scans = relationship("Scan", back_populates="asset", cascade="all, delete-orphan")

class IPAddress(Base):
    __tablename__ = "ip_addresses"
    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String(45), index=True, nullable=False)  # IPv4 or IPv6
    asset_id = Column(Integer, ForeignKey('assets.id', ondelete='CASCADE'), nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    asset = relationship("Asset", back_populates="ip_addresses")
    
    # Ensure unique IP per asset
    __table_args__ = (
        Index('ix_ip_addresses_asset_ip', 'asset_id', 'ip', unique=True),
    )

class ScanTask(Base):
    __tablename__ = "scan_tasks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)  # Optional task name
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    target = Column(String(255), nullable=False)  # CIDR, IP range, or specific IPs
    status = Column(String(20), default="running", index=True)  # running, completed, cancelled, failed
    scan_type = Column(String(50), nullable=False)  # quick, comprehensive, arp, snmp
    progress = Column(Integer, default=0)  # Percentage of completion
    current_ip = Column(String(45), nullable=True)  # IP being scanned
    total_ips = Column(Integer, default=0)  # Total IPs to scan
    completed_ips = Column(Integer, default=0)  # Completed IPs
    error_message = Column(Text, nullable=True)
    created_by = Column(String(100), nullable=True)  # User who initiated the scan
    
    # Relationships
    scans = relationship("Scan", back_populates="scan_task", cascade="all, delete-orphan")

class Scan(Base):
    __tablename__ = "scans"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete='CASCADE'), nullable=False)
    scan_task_id = Column(Integer, ForeignKey("scan_tasks.id", ondelete='SET NULL'), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    scan_data = Column(JSON, nullable=True)  # Structured scan results
    status = Column(String(20), default="completed", index=True)  # completed, failed, partial
    scan_type = Column(String(50), nullable=False)
    duration_seconds = Column(Integer, nullable=True)  # How long the scan took
    
    # Relationships
    asset = relationship("Asset", back_populates="scans")
    scan_task = relationship("ScanTask", back_populates="scans")

class AssetGroup(Base):
    __tablename__ = "asset_groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Group credentials for operations
    default_username = Column(String(100), nullable=True)
    default_password = Column(String(255), nullable=True)  # Should be encrypted
    default_ssh_key = Column(Text, nullable=True)
    
    # Group properties
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Additional group metadata
    custom_fields = Column(JSON, nullable=True)
    
    # Relationships
    assets = relationship("Asset", secondary=asset_group_association, back_populates="groups")
    labels = relationship("Label", secondary=asset_group_label_association)
    operations = relationship("Operation", back_populates="target_group")

class Operation(Base):
    __tablename__ = "operations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Operation type and configuration
    operation_type = Column(String(50), nullable=False)  # awx_playbook, api_call, script, etc.
    
    # AWX Tower integration
    awx_url = Column(String(500), nullable=True)
    awx_playbook_id = Column(Integer, nullable=True)
    awx_playbook_name = Column(String(255), nullable=True)
    awx_extra_vars = Column(JSON, nullable=True)
    
    # Generic API configuration
    api_url = Column(String(500), nullable=True)
    api_method = Column(String(10), nullable=True)  # GET, POST, PUT, DELETE
    api_headers = Column(JSON, nullable=True)
    api_body = Column(JSON, nullable=True)
    
    # Script execution
    script_path = Column(String(500), nullable=True)
    script_args = Column(JSON, nullable=True)
    
    # Target configuration
    target_group_id = Column(Integer, ForeignKey("asset_groups.id"), nullable=True)
    target_labels = Column(JSON, nullable=True)  # List of label IDs to target
    
    # Status and metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    jobs = relationship("Job", back_populates="operation", cascade="all, delete-orphan")
    target_group = relationship("AssetGroup", back_populates="operations")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    operation_id = Column(Integer, ForeignKey("operations.id", ondelete='CASCADE'), nullable=False)
    
    # Target assets and groups
    asset_ids = Column(JSON, nullable=True)  # List of asset IDs
    asset_group_ids = Column(JSON, nullable=True)  # List of group IDs
    target_labels = Column(JSON, nullable=True)  # List of label IDs
    
    # Job execution details
    status = Column(String(20), default="pending", index=True)  # pending, running, completed, failed, cancelled
    progress = Column(Integer, default=0)  # Percentage completion
    current_asset = Column(String(255), nullable=True)  # Currently processing asset
    
    # Results and logging
    results = Column(JSON, nullable=True)  # Structured results
    error_message = Column(Text, nullable=True)
    log_output = Column(Text, nullable=True)
    
    # AWX specific fields
    awx_job_id = Column(Integer, nullable=True)  # AWX job ID if applicable
    awx_job_url = Column(String(500), nullable=True)
    
    # Timing
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Additional parameters
    params = Column(JSON, nullable=True)
    created_by = Column(String(100), nullable=True)
    
    # Relationships
    operation = relationship("Operation", back_populates="jobs")

class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    
    # Scanner configuration
    scanners = Column(JSON, nullable=True)  # List of scanner configurations
    default_subnet = Column(String(50), nullable=True, default="172.18.0.0/16")
    
    # AWX Tower configuration
    awx_url = Column(String(500), nullable=True)
    awx_username = Column(String(100), nullable=True)
    awx_password = Column(String(255), nullable=True)  # Should be encrypted
    awx_token = Column(String(500), nullable=True)  # Should be encrypted
    
    # Application settings
    scan_timeout = Column(Integer, default=300)  # Default scan timeout in seconds
    max_concurrent_scans = Column(Integer, default=5)
    auto_discovery_enabled = Column(Boolean, default=True)
    
    # Notification settings
    email_notifications = Column(Boolean, default=False)
    email_smtp_server = Column(String(255), nullable=True)
    email_smtp_port = Column(Integer, nullable=True)
    email_username = Column(String(100), nullable=True)
    email_password = Column(String(255), nullable=True)  # Should be encrypted
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ScannerConfig(Base):
    __tablename__ = "scanner_configs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    url = Column(String(500), nullable=False)
    subnets = Column(JSON, nullable=True)  # List of subnets this scanner handles
    is_active = Column(Boolean, default=True)
    max_concurrent_scans = Column(Integer, default=3)
    timeout_seconds = Column(Integer, default=300)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Credential(Base):
    __tablename__ = "credentials"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    
    # Credential type
    credential_type = Column(String(50), nullable=False)  # 'username_password', 'ssh_key', 'api_key', 'certificate'
    
    # Username/Password credentials
    username = Column(String(100), nullable=True)
    password = Column(String(500), nullable=True)  # Should be encrypted
    
    # SSH Key credentials
    ssh_private_key = Column(Text, nullable=True)  # Should be encrypted
    ssh_public_key = Column(Text, nullable=True)
    ssh_passphrase = Column(String(500), nullable=True)  # Should be encrypted
    
    # API Key credentials
    api_key = Column(String(500), nullable=True)  # Should be encrypted
    api_secret = Column(String(500), nullable=True)  # Should be encrypted
    
    # Certificate credentials
    certificate_data = Column(Text, nullable=True)  # Should be encrypted
    private_key_data = Column(Text, nullable=True)  # Should be encrypted
    
    # Additional fields
    domain = Column(String(255), nullable=True)  # For domain credentials
    port = Column(Integer, nullable=True)  # For specific port credentials
    
    # Metadata
    created_by = Column(String(100), nullable=True)  # User who created this credential
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Tags for organization
    tags = Column(JSON, nullable=True)  # List of tags for categorization

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # scan_completed, operation_failed, etc.
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Related entities
    scan_task_id = Column(Integer, ForeignKey("scan_tasks.id", ondelete='SET NULL'), nullable=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete='SET NULL'), nullable=True)
    
    # Relationships
    scan_task = relationship("ScanTask")
    job = relationship("Job")
