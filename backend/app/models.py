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
    
    # Modern label features
    label_type = Column(String(20), default="custom", index=True)  # system, custom, dynamic, template
    category = Column(String(50), nullable=True, index=True)  # security, environment, device_type, etc.
    parent_id = Column(Integer, ForeignKey("labels.id"), nullable=True)  # For hierarchical labels
    icon = Column(String(50), nullable=True)  # Icon identifier (e.g., "server", "shield", "globe")
    
    # Smart labeling rules
    auto_apply_rules = Column(JSON, nullable=True)  # Rules for automatic application
    priority = Column(Integer, default=0)  # Label priority for display order
    
    # Usage analytics
    usage_count = Column(Integer, default=0)  # How many assets use this label
    last_used = Column(DateTime, nullable=True)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    is_system = Column(Boolean, default=False)  # System labels cannot be deleted
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent = relationship("Label", remote_side=[id], backref="children")
    creator = relationship("User")

class LabelTemplate(Base):
    __tablename__ = "label_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)  # security, environment, compliance, etc.
    
    # Template configuration
    labels = Column(JSON, nullable=False)  # List of label definitions
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime, nullable=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User")

class SmartLabelRule(Base):
    __tablename__ = "smart_label_rules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Rule configuration
    conditions = Column(JSON, nullable=False)  # Rule conditions (e.g., os_name contains "Windows")
    label_id = Column(Integer, ForeignKey("labels.id"), nullable=False)
    priority = Column(Integer, default=0)  # Rule execution priority
    
    # Rule behavior
    is_active = Column(Boolean, default=True)
    auto_apply = Column(Boolean, default=True)  # Automatically apply when conditions are met
    remove_on_false = Column(Boolean, default=False)  # Remove label when conditions are no longer met
    
    # Usage tracking
    match_count = Column(Integer, default=0)
    last_matched = Column(DateTime, nullable=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    label = relationship("Label")
    creator = relationship("User")

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
    discovered_devices = Column(Integer, default=0)  # Actual devices discovered (not just IPs scanned)
    error_message = Column(Text, nullable=True)
    created_by = Column(String(100), nullable=True)  # User who initiated the scan
    discovery_depth = Column(Integer, default=1)  # Network discovery depth (hops)
    scanner_ids = Column(JSON, nullable=True)  # List of scanner IDs to use
    
    # Relationships
    scans = relationship("Scan", back_populates="scan_task", cascade="all, delete-orphan")

class Scan(Base):
    __tablename__ = "scans"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete='CASCADE'), nullable=True)
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
    
    # AWX Job Templates
    awx_network_discovery_template = Column(String(50), nullable=True)
    awx_network_discovery_vars = Column(Text, nullable=True)  # JSON string
    awx_device_config_template = Column(String(50), nullable=True)
    awx_device_config_vars = Column(Text, nullable=True)  # JSON string
    awx_security_template = Column(String(50), nullable=True)
    awx_security_vars = Column(Text, nullable=True)  # JSON string
    
    # AWX Workflow Settings
    awx_auto_config = Column(Boolean, default=False)
    awx_auto_security = Column(Boolean, default=False)
    awx_sync_inventory = Column(Boolean, default=False)
    awx_inventory_id = Column(String(50), nullable=True)
    awx_sync_interval = Column(Integer, default=30)  # minutes
    awx_connected = Column(Boolean, default=False)
    
    # Application settings
    scan_timeout = Column(Integer, default=300)  # Default scan timeout in seconds
    max_concurrent_scans = Column(Integer, default=5)
    auto_discovery_enabled = Column(Boolean, default=True)
    max_discovery_depth = Column(Integer, default=3)  # Maximum network depth for LAN discovery
    
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
    is_default = Column(Boolean, default=False)  # Default scanner for fallback
    max_concurrent_scans = Column(Integer, default=3)
    timeout_seconds = Column(Integer, default=300)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# User and Role models
class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    
    # Permissions as JSON array
    permissions = Column(JSON, nullable=True)  # List of permission strings
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    full_name = Column(String(255), nullable=True)
    
    # Authentication
    hashed_password = Column(String(255), nullable=True)  # Nullable for LDAP users
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Authentication source
    auth_source = Column(String(20), default='local')  # 'local' or 'ldap'
    ldap_dn = Column(String(500), nullable=True)  # LDAP Distinguished Name
    ldap_uid = Column(String(100), nullable=True)  # LDAP UID attribute
    
    # Role relationship
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    role = relationship("Role")
    
    # Session management
    last_login = Column(DateTime, nullable=True)
    login_count = Column(Integer, default=0)
    last_ldap_sync = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # User preferences
    preferences = Column(JSON, nullable=True)  # User-specific settings
    
    # IP Range restrictions
    allowed_ip_ranges = relationship(
        "IPRange", 
        secondary="user_ip_ranges", 
        back_populates="allowed_users",
        foreign_keys="[user_ip_ranges.c.user_id, user_ip_ranges.c.ip_range_id]"
    )

class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete='CASCADE'), nullable=False)
    session_token = Column(String(500), nullable=False, unique=True, index=True)
    
    # Session metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    last_activity = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User")

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
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # User who created this credential
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Tags for organization
    tags = Column(JSON, nullable=True)  # List of tags for categorization
    
    # Relationships
    creator = relationship("User")

# LDAP Configuration
class LDAPConfig(Base):
    __tablename__ = "ldap_configs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    
    # LDAP Server Configuration
    server_uri = Column(String(500), nullable=False)  # ldap://server:389 or ldaps://server:636
    use_ssl = Column(Boolean, default=False)
    use_tls = Column(Boolean, default=True)
    verify_cert = Column(Boolean, default=True)
    
    # Authentication
    bind_dn = Column(String(500), nullable=True)  # Service account DN
    bind_password = Column(String(500), nullable=True)  # Encrypted service account password
    
    # User Search Configuration
    user_base_dn = Column(String(500), nullable=False)  # Base DN for user search
    user_search_filter = Column(String(500), default="(objectClass=person)")
    user_search_scope = Column(String(20), default="subtree")  # base, onelevel, subtree
    
    # User Attribute Mapping
    username_attribute = Column(String(100), default="sAMAccountName")  # or uid, cn, etc.
    email_attribute = Column(String(100), default="mail")
    full_name_attribute = Column(String(100), default="displayName")
    first_name_attribute = Column(String(100), default="givenName")
    last_name_attribute = Column(String(100), default="sn")
    
    # Group Configuration
    group_base_dn = Column(String(500), nullable=True)
    group_search_filter = Column(String(500), default="(objectClass=group)")
    group_member_attribute = Column(String(100), default="member")
    user_member_attribute = Column(String(100), default="memberOf")
    
    # Role Mapping
    role_mapping = Column(JSON, nullable=True)  # Map LDAP groups to application roles
    
    # Connection Settings
    connection_timeout = Column(Integer, default=10)
    read_timeout = Column(Integer, default=10)
    max_connections = Column(Integer, default=10)
    retry_attempts = Column(Integer, default=3)
    
    # Sync Settings
    auto_sync_enabled = Column(Boolean, default=True)
    sync_interval_minutes = Column(Integer, default=60)
    last_sync = Column(DateTime, nullable=True)
    sync_status = Column(String(20), default="pending")  # pending, running, success, error
    
    # Status
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("User")

# IP Range Management
class IPRange(Base):
    __tablename__ = "ip_ranges"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    
    # IP Range Definition
    ip_range = Column(String(100), nullable=False)  # CIDR notation: 192.168.1.0/24
    ip_start = Column(String(45), nullable=True)  # Start IP for ranges
    ip_end = Column(String(45), nullable=True)    # End IP for ranges
    
    # Range Type
    range_type = Column(String(20), default="cidr")  # cidr, range, single
    
    # Access Control
    is_restrictive = Column(Boolean, default=True)  # True = restrict to this range, False = allow all except this range
    priority = Column(Integer, default=0)  # Higher priority rules are evaluated first
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("User")
    allowed_users = relationship(
        "User", 
        secondary="user_ip_ranges", 
        back_populates="allowed_ip_ranges",
        foreign_keys="[user_ip_ranges.c.user_id, user_ip_ranges.c.ip_range_id]"
    )

# Association table for User-IP Range relationships
user_ip_ranges = Table(
    'user_ip_ranges',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('ip_range_id', Integer, ForeignKey('ip_ranges.id', ondelete='CASCADE'), primary_key=True),
    Column('granted_at', DateTime, default=datetime.utcnow),
    Column('granted_by', Integer, ForeignKey('users.id'), nullable=True)
)

# LDAP Sync Log
class LDAPSyncLog(Base):
    __tablename__ = "ldap_sync_logs"
    id = Column(Integer, primary_key=True, index=True)
    ldap_config_id = Column(Integer, ForeignKey("ldap_configs.id"), nullable=False)
    
    # Sync Details
    sync_type = Column(String(20), nullable=False)  # full, incremental, user, group
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="running")  # running, success, error, partial
    
    # Results
    users_created = Column(Integer, default=0)
    users_updated = Column(Integer, default=0)
    users_deactivated = Column(Integer, default=0)
    groups_processed = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    
    # Error Details
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    
    # Relationships
    ldap_config = relationship("LDAPConfig")

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
