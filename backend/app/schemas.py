from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import ipaddress

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
    scan_type: str = Field(..., description="Type of scan: quick, comprehensive, arp, snmp, lan_discovery")
    created_by: Optional[str] = None
    discovery_depth: Optional[int] = Field(1, ge=1, le=5, description="Network discovery depth (hops)")
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
    default_subnet: Optional[str] = None
    
    
    # Application settings
    scan_timeout: int = Field(300, ge=30, le=3600)
    max_concurrent_scans: int = Field(5, ge=1, le=20)
    auto_discovery_enabled: bool = True
    max_discovery_depth: int = Field(3, ge=1, le=5)
    
    # Notification settings
    email_notifications: bool = False
    email_smtp_server: Optional[str] = None
    email_smtp_port: Optional[int] = Field(None, ge=1, le=65535)
    email_username: Optional[str] = None
    email_password: Optional[str] = None

class SettingsCreate(SettingsBase):
    pass

class SettingsUpdate(BaseModel):
    scanners: Optional[List[Dict[str, Any]]] = None
    default_subnet: Optional[str] = None
    scan_timeout: Optional[int] = Field(None, ge=30, le=3600)
    max_concurrent_scans: Optional[int] = Field(None, ge=1, le=20)
    auto_discovery_enabled: Optional[bool] = None
    max_discovery_depth: Optional[int] = Field(None, ge=1, le=5)
    email_notifications: Optional[bool] = None
    email_smtp_server: Optional[str] = None
    email_smtp_port: Optional[int] = Field(None, ge=1, le=65535)
    email_username: Optional[str] = None
    email_password: Optional[str] = None

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

class NotificationBase(BaseModel):
    type: str = Field(..., description="Notification type: scan_completed, etc.")
    title: str = Field(..., min_length=1, max_length=255)
    message: str
    is_read: bool = False

class NotificationCreate(NotificationBase):
    scan_task_id: Optional[int] = None
    job_id: Optional[int] = None

class Notification(NotificationBase):
    id: int
    created_at: datetime
    scan_task_id: Optional[int] = None
    job_id: Optional[int] = None
    
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
    sync_status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    
    class Config:
        from_attributes = True

# IP Range Schemas
class IPRangeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    ip_range: str = Field(..., min_length=1, max_length=100)
    ip_start: Optional[str] = None
    ip_end: Optional[str] = None
    range_type: str = Field(default="cidr", pattern="^(cidr|range|single)$")
    is_restrictive: bool = True
    priority: int = Field(default=0, ge=0, le=1000)
    is_active: bool = True

class IPRangeCreate(IPRangeBase):
    pass

class IPRangeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    ip_range: Optional[str] = Field(None, min_length=1, max_length=100)
    ip_start: Optional[str] = None
    ip_end: Optional[str] = None
    range_type: Optional[str] = Field(None, pattern="^(cidr|range|single)$")
    is_restrictive: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0, le=1000)
    is_active: Optional[bool] = None

class IPRange(IPRangeBase):
    id: int
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

# User IP Range Assignment Schema
class UserIPRangeAssignment(BaseModel):
    user_id: int
    ip_range_id: int
    granted_at: datetime
    granted_by: Optional[int] = None
    
    class Config:
        from_attributes = True

# Update forward references
AssetGroup.update_forward_refs()
Asset.update_forward_refs()
