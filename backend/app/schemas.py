from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import ipaddress

# Custom datetime serializer for timezone-aware responses
def serialize_datetime(dt: datetime) -> str:
    """Serialize datetime to ISO format with timezone info."""
    if dt is None:
        return None
    
    # If datetime is naive (no timezone), assume it's UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    # Return ISO format with timezone info
    return dt.isoformat()

class Port(BaseModel):
    port: int
    proto: str
    state: str
    service: Optional[str] = None
    version: Optional[str] = None
    product: Optional[str] = None
    
    class Config:
        from_attributes = True

class ScanData(BaseModel):
    timestamp: datetime
    scan_type: str
    ports: List[Port] = []
    hostname: Optional[str] = None
    os_info: Optional[Dict[str, Any]] = None
    device_info: Optional[Dict[str, Any]] = None
    addresses: Optional[Dict[str, str]] = None
    services: List[Dict[str, Any]] = []
    script_results: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class AssetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    primary_ip: Optional[str] = None
    mac_address: Optional[str] = None
    hostname: Optional[str] = None
    os_name: Optional[str] = None
    os_family: Optional[str] = None
    os_version: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    owner: Optional[str] = None
    location: Optional[str] = None
    department: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssh_key: Optional[str] = None
    is_managed: bool = False
    is_active: bool = True
    custom_fields: Optional[Dict[str, Any]] = None

    @validator('primary_ip')
    def validate_ip(cls, v):
        if v:
            try:
                ipaddress.ip_address(v)
            except ValueError:
                raise ValueError('Invalid IP address format')
        return v

    @validator('mac_address')
    def validate_mac(cls, v):
        if v:
            # Basic MAC address validation
            import re
            if not re.match(r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$', v):
                raise ValueError('Invalid MAC address format')
        return v

class AssetCreate(AssetBase):
    ip_addresses: List[str] = []
    labels: List[int] = []

class AssetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    primary_ip: Optional[str] = None
    mac_address: Optional[str] = None
    hostname: Optional[str] = None
    os_name: Optional[str] = None
    os_family: Optional[str] = None
    os_version: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    owner: Optional[str] = None
    location: Optional[str] = None
    department: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssh_key: Optional[str] = None
    is_managed: Optional[bool] = None
    is_active: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None
    ip_addresses: Optional[List[str]] = None
    labels: Optional[List[int]] = None

    @validator('primary_ip')
    def validate_ip(cls, v):
        if v:
            try:
                ipaddress.ip_address(v)
            except ValueError:
                raise ValueError('Invalid IP address format')
        return v

    @validator('mac_address')
    def validate_mac(cls, v):
        if v:
            import re
            if not re.match(r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$', v):
                raise ValueError('Invalid MAC address format')
        return v

class Asset(AssetBase):
    id: int
    last_seen: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    scan_data: Optional[ScanData] = None
    ip_addresses: List['IPAddress'] = []
    labels: List['Label'] = []
    # Remove groups to prevent circular reference
    # groups: List['AssetGroup'] = []
    
    class Config:
        from_attributes = True

class IPAddressBase(BaseModel):
    ip: str = Field(..., description="IP address (IPv4 or IPv6)")
    is_primary: bool = False

    @validator('ip')
    def validate_ip(cls, v):
        try:
            ipaddress.ip_address(v)
        except ValueError:
            raise ValueError('Invalid IP address format')
        return v

class IPAddressCreate(IPAddressBase):
    pass

class IPAddress(IPAddressBase):
    id: int
    asset_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class LabelBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')

class LabelCreate(LabelBase):
    pass

class LabelUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')

class Label(LabelBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AssetGroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    default_username: Optional[str] = None
    default_password: Optional[str] = None
    default_ssh_key: Optional[str] = None
    is_active: bool = True
    custom_fields: Optional[Dict[str, Any]] = None

class AssetGroupCreate(AssetGroupBase):
    asset_ids: List[int] = []
    labels: List[int] = []

class AssetGroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    default_username: Optional[str] = None
    default_password: Optional[str] = None
    default_ssh_key: Optional[str] = None
    is_active: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None
    asset_ids: Optional[List[int]] = None
    labels: Optional[List[int]] = None

class AssetGroup(AssetGroupBase):
    id: int
    created_at: datetime
    updated_at: datetime
    # Remove assets to prevent circular reference
    # assets: List[Asset] = []
    labels: List[Label] = []
    
    class Config:
        from_attributes = True

# Separate schemas for when we need to include relationships
class AssetWithGroups(Asset):
    groups: List[AssetGroup] = []

class AssetGroupWithAssets(AssetGroup):
    assets: List[Asset] = []



class ScanTaskBase(BaseModel):
    name: Optional[str] = None
    target: str = Field(..., description="CIDR, IP range, or specific IPs to scan")
    scan_template_id: Optional[int] = Field(None, description="ID of the scan template to use")
    created_by: Optional[str] = None
    scanner_ids: Optional[List[int]] = Field(default_factory=list, description="List of scanner IDs to use")

class ScanTaskCreate(ScanTaskBase):
    pass

class ScanTaskUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r'^(running|completed|cancelled|failed)$')
    progress: Optional[int] = Field(None, ge=0, le=100)
    current_ip: Optional[str] = None
    total_ips: Optional[int] = None
    completed_ips: Optional[int] = None
    error_message: Optional[str] = None

class ScanTask(ScanTaskBase):
    id: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    current_ip: Optional[str] = None
    total_ips: Optional[int] = None
    completed_ips: Optional[int] = None
    discovered_devices: Optional[int] = None  # Actual devices discovered (not just IPs scanned)
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True


class ScannerConfigBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., description="Scanner service URL")
    subnets: Optional[List[str]] = None
    is_active: bool = True
    is_default: bool = False
    max_concurrent_scans: int = Field(3, ge=1, le=10)
    timeout_seconds: int = Field(300, ge=30, le=3600)

class ScannerConfigCreate(ScannerConfigBase):
    pass

class ScannerConfigUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    url: Optional[str] = None
    subnets: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    max_concurrent_scans: Optional[int] = Field(None, ge=1, le=10)
    timeout_seconds: Optional[int] = Field(None, ge=30, le=3600)

class ScannerConfig(ScannerConfigBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SettingsBase(BaseModel):
    # Scanner configuration
    scanners: Optional[List[Dict[str, Any]]] = None
    # Scan retry configuration
    scan_retry_time_limit_minutes: Optional[int] = Field(default=30, ge=1, le=1440)  # 1 minute to 24 hours

class SettingsCreate(SettingsBase):
    pass

class SettingsUpdate(BaseModel):
    scanners: Optional[List[Dict[str, Any]]] = None
    scan_retry_time_limit_minutes: Optional[int] = Field(None, ge=1, le=1440)

class Settings(SettingsBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Authentication schemas
class RoleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: bool = True

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None

class Role(RoleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    full_name: Optional[str] = Field(None, max_length=255)
    is_active: bool = True
    role_id: Optional[int] = None
    auth_source: str = Field(default="local", pattern="^(local|ldap)$")
    ldap_dn: Optional[str] = None
    ldap_uid: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[str] = Field(None, pattern=r'^[^@]+@[^@]+\.[^@]+$')
    full_name: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None
    role_id: Optional[int] = None
    preferences: Optional[Dict[str, Any]] = None

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)

class User(UserBase):
    id: int
    is_superuser: bool
    last_login: Optional[datetime] = None
    login_count: int
    created_at: datetime
    updated_at: datetime
    role: Optional[Role] = None
    preferences: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class UserSession(BaseModel):
    id: int
    user_id: int
    session_token: str
    created_at: datetime
    expires_at: datetime
    last_activity: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: User

class APIKeyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True

class APIKeyCreate(APIKeyBase):
    pass

class APIKeyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None

class APIKey(APIKeyBase):
    id: int
    key_prefix: str
    last_used: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class APIKeyWithSecret(APIKey):
    """API Key response that includes the actual key (only shown once)"""
    key: str

class CredentialBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    credential_type: str = Field(..., description="Type: username_password, ssh_key, api_key, certificate")
    
    # Username/Password fields
    username: Optional[str] = Field(None, max_length=100)
    password: Optional[str] = Field(None, max_length=500)
    
    # SSH Key fields
    ssh_private_key: Optional[str] = None
    ssh_public_key: Optional[str] = None
    ssh_passphrase: Optional[str] = Field(None, max_length=500)
    
    # API Key fields
    api_key: Optional[str] = Field(None, max_length=500)
    api_secret: Optional[str] = Field(None, max_length=500)
    
    # Certificate fields
    certificate_data: Optional[str] = None
    private_key_data: Optional[str] = None
    
    # Additional fields
    domain: Optional[str] = Field(None, max_length=255)
    port: Optional[int] = Field(None, ge=1, le=65535)
    
    # Metadata
    created_by: Optional[int] = None  # User ID who created this credential
    is_active: bool = True
    tags: Optional[List[str]] = None

class CredentialCreate(CredentialBase):
    pass

class CredentialUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    credential_type: Optional[str] = None
    
    # Username/Password fields
    username: Optional[str] = Field(None, max_length=100)
    password: Optional[str] = Field(None, max_length=500)
    
    # SSH Key fields
    ssh_private_key: Optional[str] = None
    ssh_public_key: Optional[str] = None
    ssh_passphrase: Optional[str] = Field(None, max_length=500)
    
    # API Key fields
    api_key: Optional[str] = Field(None, max_length=500)
    api_secret: Optional[str] = Field(None, max_length=500)
    
    # Certificate fields
    certificate_data: Optional[str] = None
    private_key_data: Optional[str] = None
    
    # Additional fields
    domain: Optional[str] = Field(None, max_length=255)
    port: Optional[int] = Field(None, ge=1, le=65535)
    
    # Metadata
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None

class Credential(CredentialBase):
    id: int
    last_used: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# LDAP Configuration Schemas
class LDAPConfigBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    server_uri: str = Field(..., min_length=1, max_length=500)
    use_ssl: bool = False
    use_tls: bool = True
    verify_cert: bool = True
    bind_dn: Optional[str] = None
    bind_password: Optional[str] = None
    user_base_dn: str = Field(..., min_length=1, max_length=500)
    user_search_filter: str = Field(default="(objectClass=person)", max_length=500)
    user_search_scope: str = Field(default="subtree", pattern="^(base|onelevel|subtree)$")
    username_attribute: str = Field(default="sAMAccountName", max_length=100)
    email_attribute: str = Field(default="mail", max_length=100)
    full_name_attribute: str = Field(default="displayName", max_length=100)
    first_name_attribute: str = Field(default="givenName", max_length=100)
    last_name_attribute: str = Field(default="sn", max_length=100)
    group_base_dn: Optional[str] = None
    group_search_filter: str = Field(default="(objectClass=group)", max_length=500)
    group_member_attribute: str = Field(default="member", max_length=100)
    user_member_attribute: str = Field(default="memberOf", max_length=100)
    role_mapping: Optional[Dict[str, str]] = None
    connection_timeout: int = Field(default=10, ge=1, le=300)
    read_timeout: int = Field(default=10, ge=1, le=300)
    max_connections: int = Field(default=10, ge=1, le=100)
    retry_attempts: int = Field(default=3, ge=1, le=10)
    auto_sync_enabled: bool = True
    sync_interval_minutes: int = Field(default=60, ge=1, le=1440)
    is_active: bool = True
    is_default: bool = False

class LDAPConfigCreate(LDAPConfigBase):
    pass

class LDAPConfigUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    server_uri: Optional[str] = Field(None, min_length=1, max_length=500)
    use_ssl: Optional[bool] = None
    use_tls: Optional[bool] = None
    verify_cert: Optional[bool] = None
    bind_dn: Optional[str] = None
    bind_password: Optional[str] = None
    user_base_dn: Optional[str] = Field(None, min_length=1, max_length=500)
    user_search_filter: Optional[str] = Field(None, max_length=500)
    user_search_scope: Optional[str] = Field(None, pattern="^(base|onelevel|subtree)$")
    username_attribute: Optional[str] = Field(None, max_length=100)
    email_attribute: Optional[str] = Field(None, max_length=100)
    full_name_attribute: Optional[str] = Field(None, max_length=100)
    first_name_attribute: Optional[str] = Field(None, max_length=100)
    last_name_attribute: Optional[str] = Field(None, max_length=100)
    group_base_dn: Optional[str] = None
    group_search_filter: Optional[str] = Field(None, max_length=500)
    group_member_attribute: Optional[str] = Field(None, max_length=100)
    user_member_attribute: Optional[str] = Field(None, max_length=100)
    role_mapping: Optional[Dict[str, str]] = None
    connection_timeout: Optional[int] = Field(None, ge=1, le=300)
    read_timeout: Optional[int] = Field(None, ge=1, le=300)
    max_connections: Optional[int] = Field(None, ge=1, le=100)
    retry_attempts: Optional[int] = Field(None, ge=1, le=10)
    auto_sync_enabled: Optional[bool] = None
    sync_interval_minutes: Optional[int] = Field(None, ge=1, le=1440)
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None

class LDAPConfig(LDAPConfigBase):
    id: int
    last_sync: Optional[datetime] = None
    sync_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    
    class Config:
        from_attributes = True

# LDAP Sync Log Schema
class LDAPSyncLog(BaseModel):
    id: int
    ldap_config_id: int
    sync_type: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    users_created: int
    users_updated: int
    users_deactivated: int
    groups_processed: int
    errors_count: int
    error_message: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

# Enterprise Enhancement Schemas

class ScanTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    scan_config: Dict[str, Any] = Field(..., description="Complete scan configuration")
    scan_type: str = Field(default="standard", max_length=50)
    is_system: bool = False

class ScanTemplateCreate(ScanTemplateBase):
    pass

class ScanTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    scan_config: Optional[Dict[str, Any]] = None
    scan_type: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None

class ScanTemplate(ScanTemplateBase):
    id: int
    is_active: bool
    usage_count: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    
    class Config:
        from_attributes = True

class AssetTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    device_type: str = Field(..., description="server, workstation, switch, router, etc.")
    template_data: Dict[str, Any] = Field(..., description="Asset field defaults and structure")
    custom_fields_schema: Optional[Dict[str, Any]] = None
    auto_apply_rules: Optional[Dict[str, Any]] = None
    is_system: bool = False

class AssetTemplateCreate(AssetTemplateBase):
    pass

class AssetTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    device_type: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None
    custom_fields_schema: Optional[Dict[str, Any]] = None
    auto_apply_rules: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class AssetTemplate(AssetTemplateBase):
    id: int
    is_active: bool
    usage_count: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    
    class Config:
        from_attributes = True

class AuditLogBase(BaseModel):
    action: str = Field(..., description="CREATE, UPDATE, DELETE, LOGIN, etc.")
    resource_type: str = Field(..., description="asset, scan, user, etc.")
    resource_id: Optional[int] = None
    resource_name: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    user_id: Optional[int] = None

class AuditLog(AuditLogBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class WebhookBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., description="Webhook endpoint URL")
    events: List[str] = Field(..., description="List of events to trigger webhook")
    secret: Optional[str] = None
    retry_count: int = Field(default=3, ge=0, le=10)
    timeout_seconds: int = Field(default=30, ge=5, le=300)

class WebhookCreate(WebhookBase):
    pass

class WebhookUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    url: Optional[str] = None
    events: Optional[List[str]] = None
    secret: Optional[str] = None
    is_active: Optional[bool] = None
    retry_count: Optional[int] = Field(None, ge=0, le=10)
    timeout_seconds: Optional[int] = Field(None, ge=5, le=300)

class Webhook(WebhookBase):
    id: int
    is_active: bool
    last_triggered: Optional[datetime] = None
    success_count: int
    failure_count: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    
    class Config:
        from_attributes = True

class WebhookDelivery(BaseModel):
    id: int
    webhook_id: int
    event_type: str
    payload: Dict[str, Any]
    response_status: Optional[int] = None
    response_body: Optional[str] = None
    success: bool
    error_message: Optional[str] = None
    attempt_count: int
    created_at: datetime
    delivered_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class NetworkTopologyBase(BaseModel):
    source_asset_id: int
    target_asset_id: int
    relationship_type: str = Field(..., description="connected_to, depends_on, etc.")
    connection_details: Optional[Dict[str, Any]] = None

class NetworkTopologyCreate(NetworkTopologyBase):
    pass

class NetworkTopology(NetworkTopologyBase):
    id: int
    discovered_at: datetime
    last_verified: Optional[datetime] = None
    is_active: bool
    
    class Config:
        from_attributes = True

# Bulk Operations Schemas
class BulkAssetCreate(BaseModel):
    assets: List[Dict[str, Any]] = Field(..., description="List of asset data dictionaries")
    template_id: Optional[int] = None
    apply_labels: Optional[List[int]] = None
    apply_groups: Optional[List[int]] = None

class BulkAssetUpdate(BaseModel):
    asset_ids: List[int] = Field(..., description="List of asset IDs to update")
    updates: Dict[str, Any] = Field(..., description="Fields to update")
    apply_labels: Optional[List[int]] = None
    apply_groups: Optional[List[int]] = None

class BulkOperationResult(BaseModel):
    success_count: int
    failure_count: int
    errors: List[Dict[str, Any]] = []
    created_ids: Optional[List[int]] = None
    updated_ids: Optional[List[int]] = None

# Enhanced Discovery Schemas
class DiscoveryConfig(BaseModel):
    target: str = Field(..., description="Target network or IP range")
    scanner_id: Optional[str] = None
    credentials: Optional[List[int]] = None
    scan_template_id: int = Field(..., description="Required scan template ID")
    schedule: Optional[Dict[str, Any]] = None

class DiscoveryResult(BaseModel):
    scan_task_id: int
    discovered_devices: int
    scan_duration: float
    success_rate: float
    errors: List[str] = []

# Subnet Schemas
class SubnetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Subnet name")
    description: Optional[str] = Field(None, description="Subnet description")
    cidr: str = Field(..., description="CIDR notation (e.g., 192.168.1.0/24)")
    gateway: Optional[str] = Field(None, description="Gateway IP address")
    vlan_id: Optional[int] = Field(None, ge=1, le=4094, description="VLAN ID")
    location: Optional[str] = Field(None, max_length=255, description="Physical location")
    department: Optional[str] = Field(None, max_length=255, description="Department/team")
    is_active: bool = Field(True, description="Whether subnet is active")
    is_managed: bool = Field(False, description="Whether subnet is actively managed")
    scan_frequency: str = Field("weekly", description="Scan frequency: daily, weekly, monthly, manual")
    tags: Optional[Dict[str, Any]] = Field(None, description="Additional metadata tags")

    @validator('cidr')
    def validate_cidr(cls, v):
        try:
            network = ipaddress.ip_network(v, strict=False)
            return str(network)
        except ValueError:
            raise ValueError('Invalid CIDR notation')

    @validator('gateway')
    def validate_gateway(cls, v):
        if v is None:
            return v
        try:
            ipaddress.ip_address(v)
            return v
        except ValueError:
            raise ValueError('Invalid gateway IP address')

    @validator('scan_frequency')
    def validate_scan_frequency(cls, v):
        allowed_frequencies = ['daily', 'weekly', 'monthly', 'manual']
        if v not in allowed_frequencies:
            raise ValueError(f'Scan frequency must be one of: {", ".join(allowed_frequencies)}')
        return v

class SubnetCreate(SubnetBase):
    pass

class SubnetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    cidr: Optional[str] = None
    gateway: Optional[str] = None
    vlan_id: Optional[int] = Field(None, ge=1, le=4094)
    location: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None
    is_managed: Optional[bool] = None
    scan_frequency: Optional[str] = None
    tags: Optional[Dict[str, Any]] = None

    @validator('cidr')
    def validate_cidr(cls, v):
        if v is None:
            return v
        try:
            network = ipaddress.ip_network(v, strict=False)
            return str(network)
        except ValueError:
            raise ValueError('Invalid CIDR notation')

    @validator('gateway')
    def validate_gateway(cls, v):
        if v is None:
            return v
        try:
            ipaddress.ip_address(v)
            return v
        except ValueError:
            raise ValueError('Invalid gateway IP address')

    @validator('scan_frequency')
    def validate_scan_frequency(cls, v):
        if v is None:
            return v
        allowed_frequencies = ['daily', 'weekly', 'monthly', 'manual']
        if v not in allowed_frequencies:
            raise ValueError(f'Scan frequency must be one of: {", ".join(allowed_frequencies)}')
        return v

class Subnet(SubnetBase):
    id: int
    network_address: str
    subnet_mask: str
    last_scanned: Optional[datetime] = None
    next_scan: Optional[datetime] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Update forward references
AssetGroup.update_forward_refs()
Asset.update_forward_refs()