"""
Database models for DiscoverIT application.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, Index, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from .database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    last_login = Column(DateTime, nullable=True)
    login_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    preferences = Column(JSON, nullable=True)
    auth_source = Column(String(20), default="local", nullable=False)
    ldap_dn = Column(String(500), nullable=True)
    ldap_uid = Column(String(100), nullable=True)
    last_ldap_sync = Column(DateTime, nullable=True)
    
    # Relationships
    role = relationship("Role", back_populates="users")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    created_labels = relationship("Label", back_populates="creator")
    created_credentials = relationship("Credential", back_populates="creator")
    created_ldap_configs = relationship("LDAPConfig", back_populates="creator")
    created_api_keys = relationship("APIKey", back_populates="creator")
    created_ip_ranges = relationship("IPRange", back_populates="creator")
    allowed_ip_ranges = relationship("UserIPRange", foreign_keys="UserIPRange.user_id", back_populates="user")


class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    permissions = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="role")


class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_token = Column(String(500), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    last_activity = Column(DateTime, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="sessions")


class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    primary_ip = Column(String(45), index=True, nullable=True)
    mac_address = Column(String(17), nullable=True)
    hostname = Column(String(255), nullable=True)
    os_name = Column(String(100), nullable=True)
    os_family = Column(String(50), nullable=True)
    os_version = Column(String(100), nullable=True)
    manufacturer = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    serial_number = Column(String(100), nullable=True)
    owner = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    department = Column(String(100), nullable=True)
    username = Column(String(100), nullable=True)
    password = Column(String(255), nullable=True)
    ssh_key = Column(Text, nullable=True)
    is_managed = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    custom_fields = Column(JSON, nullable=True)
    scan_data = Column(JSON, nullable=True)
    
    # Relationships
    scans = relationship("Scan", back_populates="asset", cascade="all, delete-orphan")
    labels = relationship("Label", secondary="asset_label_association", back_populates="assets")
    groups = relationship("AssetGroup", secondary="asset_group_association", back_populates="assets")
    ip_addresses = relationship("IPAddress", back_populates="asset", cascade="all, delete-orphan")


class IPAddress(Base):
    __tablename__ = "ip_addresses"
    
    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String(45), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    asset = relationship("Asset", back_populates="ip_addresses")


class AssetGroup(Base):
    __tablename__ = "asset_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    default_username = Column(String(100), nullable=True)
    default_password = Column(String(255), nullable=True)
    default_ssh_key = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    custom_fields = Column(JSON, nullable=True)
    
    # Relationships
    assets = relationship("Asset", secondary="asset_group_association", back_populates="groups")
    labels = relationship("Label", secondary="asset_group_label_association", back_populates="asset_groups")


class Label(Base):
    __tablename__ = "labels"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)
    label_type = Column(String(20), index=True, nullable=True)
    category = Column(String(50), index=True, nullable=True)
    parent_id = Column(Integer, ForeignKey("labels.id"), nullable=True)
    icon = Column(String(50), nullable=True)
    auto_apply_rules = Column(JSON, nullable=True)
    priority = Column(Integer, nullable=True)
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    is_system = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="created_labels")
    parent = relationship("Label", remote_side=[id])
    children = relationship("Label", back_populates="parent")
    assets = relationship("Asset", secondary="asset_label_association", back_populates="labels")
    asset_groups = relationship("AssetGroup", secondary="asset_group_label_association", back_populates="labels")


class ScanTask(Base):
    __tablename__ = "scan_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    target = Column(String(255), nullable=False)
    status = Column(String(20), index=True, nullable=True)
    scan_template_id = Column(Integer, ForeignKey("scan_templates.id"), nullable=True)
    progress = Column(Integer, nullable=True)
    current_ip = Column(String(45), nullable=True)
    total_ips = Column(Integer, nullable=True)
    completed_ips = Column(Integer, nullable=True)
    discovered_devices = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    created_by = Column(String(100), nullable=True)
    discovery_depth = Column(Integer, default=1, nullable=True)
    scanner_ids = Column(JSON, nullable=True)
    
    # Relationships
    scans = relationship("Scan", back_populates="scan_task", cascade="all, delete-orphan")
    scan_template = relationship("ScanTemplate")


class Scan(Base):
    __tablename__ = "scans"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=True)
    scan_task_id = Column(Integer, ForeignKey("scan_tasks.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, index=True, nullable=True)
    scan_data = Column(JSON, nullable=True)
    status = Column(String(20), index=True, nullable=True)
    scan_type = Column(String(50), nullable=False)
    duration_seconds = Column(Integer, nullable=True)
    
    # Relationships
    asset = relationship("Asset", back_populates="scans")
    scan_task = relationship("ScanTask", back_populates="scans")


class Credential(Base):
    __tablename__ = "credentials"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    credential_type = Column(String(50), nullable=False)
    username = Column(String(100), nullable=True)
    password = Column(String(500), nullable=True)
    ssh_private_key = Column(Text, nullable=True)
    ssh_public_key = Column(Text, nullable=True)
    ssh_passphrase = Column(String(500), nullable=True)
    api_key = Column(String(500), nullable=True)
    api_secret = Column(String(500), nullable=True)
    certificate_data = Column(Text, nullable=True)
    private_key_data = Column(Text, nullable=True)
    domain = Column(String(255), nullable=True)
    port = Column(Integer, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tags = Column(JSON, nullable=True)
    
    # Relationships
    creator = relationship("User", back_populates="created_credentials")


class ScannerConfig(Base):
    __tablename__ = "scanner_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    url = Column(String(500), nullable=False)
    subnets = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    max_concurrent_scans = Column(Integer, nullable=True)
    timeout_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    scanners = Column(JSON, nullable=True)
    default_subnet = Column(String(50), nullable=True)
    scan_timeout = Column(Integer, nullable=True)
    max_concurrent_scans = Column(Integer, nullable=True)
    max_discovery_depth = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LDAPConfig(Base):
    __tablename__ = "ldap_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    server_uri = Column(String(500), nullable=False)
    use_ssl = Column(Boolean, default=False)
    use_tls = Column(Boolean, default=False)
    verify_cert = Column(Boolean, default=True)
    bind_dn = Column(String(500), nullable=True)
    bind_password = Column(String(500), nullable=True)
    user_base_dn = Column(String(500), nullable=False)
    user_search_filter = Column(String(500), nullable=True)
    user_search_scope = Column(String(20), nullable=True)
    username_attribute = Column(String(100), nullable=True)
    email_attribute = Column(String(100), nullable=True)
    full_name_attribute = Column(String(100), nullable=True)
    first_name_attribute = Column(String(100), nullable=True)
    last_name_attribute = Column(String(100), nullable=True)
    group_base_dn = Column(String(500), nullable=True)
    group_search_filter = Column(String(500), nullable=True)
    group_member_attribute = Column(String(100), nullable=True)
    user_member_attribute = Column(String(100), nullable=True)
    role_mapping = Column(JSON, nullable=True)
    connection_timeout = Column(Integer, default=10)
    read_timeout = Column(Integer, default=10)
    max_connections = Column(Integer, default=10)
    retry_attempts = Column(Integer, default=3)
    auto_sync_enabled = Column(Boolean, default=False)
    sync_interval_minutes = Column(Integer, default=60)
    last_sync = Column(DateTime, nullable=True)
    sync_status = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("User", back_populates="created_ldap_configs")
    sync_logs = relationship("LDAPSyncLog", back_populates="ldap_config", cascade="all, delete-orphan")


class LDAPSyncLog(Base):
    __tablename__ = "ldap_sync_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    ldap_config_id = Column(Integer, ForeignKey("ldap_configs.id"), nullable=False)
    sync_type = Column(String(20), nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=True)
    users_created = Column(Integer, nullable=True)
    users_updated = Column(Integer, nullable=True)
    users_deactivated = Column(Integer, nullable=True)
    groups_processed = Column(Integer, nullable=True)
    errors_count = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    
    # Relationships
    ldap_config = relationship("LDAPConfig", back_populates="sync_logs")


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
    creator = relationship("User", back_populates="created_api_keys")


# Association tables
class AssetLabelAssociation(Base):
    __tablename__ = "asset_label_association"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=True)
    label_id = Column(Integer, ForeignKey("labels.id", ondelete="CASCADE"), nullable=True)


class AssetGroupAssociation(Base):
    __tablename__ = "asset_group_association"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=True)
    asset_group_id = Column(Integer, ForeignKey("asset_groups.id", ondelete="CASCADE"), nullable=True)


class AssetGroupLabelAssociation(Base):
    __tablename__ = "asset_group_label_association"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_group_id = Column(Integer, ForeignKey("asset_groups.id", ondelete="CASCADE"), nullable=True)
    label_id = Column(Integer, ForeignKey("labels.id", ondelete="CASCADE"), nullable=True)


class IPRange(Base):
    __tablename__ = "ip_ranges"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    ip_range = Column(String(100), nullable=False)
    ip_start = Column(String(45), nullable=True)
    ip_end = Column(String(45), nullable=True)
    range_type = Column(String(20), default="cidr", nullable=False)
    is_restrictive = Column(Boolean, default=True, nullable=False)
    priority = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("User", back_populates="created_ip_ranges")


class UserIPRange(Base):
    __tablename__ = "user_ip_ranges"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    ip_range_id = Column(Integer, ForeignKey("ip_ranges.id", ondelete="CASCADE"), primary_key=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    granted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="allowed_ip_ranges")
    ip_range = relationship("IPRange")
    granter = relationship("User", foreign_keys=[granted_by])


# Enterprise Enhancement Models

class ScanTemplate(Base):
    """Predefined scan configurations for different scenarios."""
    __tablename__ = "scan_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    scan_config = Column(JSON, nullable=False)  # Complete scan configuration
    scan_type = Column(String(50), nullable=False)  # quick, standard, comprehensive, custom
    is_system = Column(Boolean, default=False)  # System templates vs user templates
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("User")


class AssetTemplate(Base):
    """Predefined asset templates for different device types."""
    __tablename__ = "asset_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    device_type = Column(String(100), nullable=False)  # server, workstation, switch, router, etc.
    template_data = Column(JSON, nullable=False)  # Asset field defaults and structure
    custom_fields_schema = Column(JSON, nullable=True)  # Custom field definitions
    auto_apply_rules = Column(JSON, nullable=True)  # Rules for auto-applying this template
    is_system = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("User")


class AuditLog(Base):
    """Comprehensive audit logging for compliance and security."""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    resource_type = Column(String(50), nullable=False, index=True)  # asset, scan, user, etc.
    resource_id = Column(Integer, nullable=True, index=True)
    resource_name = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)  # Additional context and changes
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User")


class Webhook(Base):
    """Webhook configurations for external integrations."""
    __tablename__ = "webhooks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    events = Column(JSON, nullable=False)  # List of events to trigger webhook
    secret = Column(String(255), nullable=True)  # Webhook secret for verification
    is_active = Column(Boolean, default=True)
    retry_count = Column(Integer, default=3)
    timeout_seconds = Column(Integer, default=30)
    last_triggered = Column(DateTime, nullable=True)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator = relationship("User")


class WebhookDelivery(Base):
    """Webhook delivery attempts and results."""
    __tablename__ = "webhook_deliveries"
    
    id = Column(Integer, primary_key=True, index=True)
    webhook_id = Column(Integer, ForeignKey("webhooks.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    response_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    success = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    attempt_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    delivered_at = Column(DateTime, nullable=True)
    
    # Relationships
    webhook = relationship("Webhook")


class NetworkTopology(Base):
    """Network topology and device relationships."""
    __tablename__ = "network_topology"
    
    id = Column(Integer, primary_key=True, index=True)
    source_asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    target_asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    relationship_type = Column(String(50), nullable=False)  # connected_to, depends_on, etc.
    connection_details = Column(JSON, nullable=True)  # Port, protocol, etc.
    discovered_at = Column(DateTime, default=datetime.utcnow)
    last_verified = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    source_asset = relationship("Asset", foreign_keys=[source_asset_id])
    target_asset = relationship("Asset", foreign_keys=[target_asset_id])

