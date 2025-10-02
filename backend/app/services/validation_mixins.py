"""
Validation mixins for common validation patterns across services.
"""
import ipaddress
import re
from typing import Any, List, Optional, Dict
from .base_service import ValidationError
import logging

logger = logging.getLogger(__name__)


class IPValidationMixin:
    """Mixin for IP address validation."""
    
    def validate_ip_address(self, ip: str) -> bool:
        """Validate an IP address."""
        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False
    
    def validate_ip_network(self, network: str) -> bool:
        """Validate an IP network/CIDR."""
        try:
            ipaddress.ip_network(network, strict=False)
            return True
        except ValueError:
            return False
    
    def validate_ip_range(self, ip_range: str) -> bool:
        """Validate an IP range (start-end format)."""
        try:
            if "-" not in ip_range:
                return False
            start_ip, end_ip = ip_range.split("-", 1)
            start = ipaddress.ip_address(start_ip.strip())
            end = ipaddress.ip_address(end_ip.strip())
            return start <= end
        except (ValueError, IndexError):
            return False
    
    def ip_in_network(self, ip: str, network: str) -> bool:
        """Check if an IP is within a network."""
        try:
            return ipaddress.ip_address(ip) in ipaddress.ip_network(network, strict=False)
        except (ValueError, TypeError):
            return False


class NameValidationMixin:
    """Mixin for name validation."""
    
    def validate_name(self, name: str, min_length: int = 1, max_length: int = 255) -> bool:
        """Validate a name field."""
        if not name or not isinstance(name, str):
            return False
        
        name = name.strip()
        if len(name) < min_length or len(name) > max_length:
            return False
        
        # Allow alphanumeric, spaces, hyphens, underscores, and dots
        if not re.match(r'^[a-zA-Z0-9\s\-_\.]+$', name):
            return False
        
        return True
    
    def validate_hostname(self, hostname: str) -> bool:
        """Validate a hostname."""
        if not hostname or not isinstance(hostname, str):
            return False
        
        hostname = hostname.strip()
        if len(hostname) > 253:
            return False
        
        # Basic hostname validation
        if not re.match(r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$', hostname):
            return False
        
        return True


class EmailValidationMixin:
    """Mixin for email validation."""
    
    def validate_email(self, email: str) -> bool:
        """Validate an email address."""
        if not email or not isinstance(email, str):
            return False
        
        email = email.strip()
        if len(email) > 254:
            return False
        
        # Basic email validation regex
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))


class URLValidationMixin:
    """Mixin for URL validation."""
    
    def validate_url(self, url: str, require_https: bool = False) -> bool:
        """Validate a URL."""
        if not url or not isinstance(url, str):
            return False
        
        url = url.strip()
        
        # Basic URL validation
        pattern = r'^https?://[a-zA-Z0-9.-]+(?:\:[0-9]+)?(?:/[^\s]*)?$'
        if not re.match(pattern, url):
            return False
        
        if require_https and not url.startswith('https://'):
            return False
        
        return True


class NetworkValidationMixin:
    """Mixin for network-related validation."""
    
    def validate_port(self, port: int) -> bool:
        """Validate a port number."""
        return isinstance(port, int) and 1 <= port <= 65535
    
    def validate_mac_address(self, mac: str) -> bool:
        """Validate a MAC address."""
        if not mac or not isinstance(mac, str):
            return False
        
        mac = mac.strip().upper()
        
        # Common MAC address formats
        patterns = [
            r'^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$',  # XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
            r'^([0-9A-F]{4}[:-]){2}([0-9A-F]{4})$',  # XXXX:XXXX:XXXX or XXXX-XXXX-XXXX
        ]
        
        return any(re.match(pattern, mac) for pattern in patterns)
    
    def validate_vlan_id(self, vlan_id: int) -> bool:
        """Validate a VLAN ID."""
        return isinstance(vlan_id, int) and 1 <= vlan_id <= 4094


class CommonValidationMixin(IPValidationMixin, NameValidationMixin, EmailValidationMixin, URLValidationMixin, NetworkValidationMixin):
    """Combined mixin with all common validation methods."""
    
    def validate_required_fields(self, data: Dict[str, Any], required_fields: List[str]) -> None:
        """Validate that required fields are present and not empty."""
        missing_fields = []
        for field in required_fields:
            if field not in data or not data[field]:
                missing_fields.append(field)
        
        if missing_fields:
            raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")
    
    def validate_field_length(self, field_name: str, value: str, min_length: int = 0, max_length: int = 255) -> None:
        """Validate field length."""
        if not isinstance(value, str):
            raise ValidationError(f"{field_name} must be a string")
        
        value = value.strip()
        if len(value) < min_length:
            raise ValidationError(f"{field_name} must be at least {min_length} characters long")
        
        if len(value) > max_length:
            raise ValidationError(f"{field_name} must be no more than {max_length} characters long")
    
    def validate_positive_integer(self, field_name: str, value: Any, min_value: int = 1) -> None:
        """Validate a positive integer field."""
        if not isinstance(value, int) or value < min_value:
            raise ValidationError(f"{field_name} must be a positive integer >= {min_value}")
    
    def validate_boolean(self, field_name: str, value: Any) -> None:
        """Validate a boolean field."""
        if not isinstance(value, bool):
            raise ValidationError(f"{field_name} must be a boolean value")
    
    def validate_choice(self, field_name: str, value: Any, choices: List[Any]) -> None:
        """Validate that a field value is one of the allowed choices."""
        if value not in choices:
            raise ValidationError(f"{field_name} must be one of: {', '.join(map(str, choices))}")
    
    def sanitize_string(self, value: str, max_length: int = 255) -> str:
        """Sanitize a string by trimming and limiting length."""
        if not isinstance(value, str):
            return ""
        
        return value.strip()[:max_length]
    
    def sanitize_list(self, value: List[Any], max_items: int = 100) -> List[Any]:
        """Sanitize a list by limiting the number of items."""
        if not isinstance(value, list):
            return []
        
        return value[:max_items]
