"""
Common utilities for the DiscoverIT API.
"""
import re
import ipaddress
from typing import List, Optional, Union
from datetime import datetime


def validate_ip_address(ip: str) -> bool:
    """Validate if a string is a valid IP address."""
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False


def validate_subnet(subnet: str) -> bool:
    """Validate if a string is a valid subnet (CIDR notation)."""
    try:
        ipaddress.ip_network(subnet, strict=False)
        return True
    except ValueError:
        return False


def validate_mac_address(mac: str) -> bool:
    """Validate if a string is a valid MAC address."""
    mac_pattern = re.compile(r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$')
    return bool(mac_pattern.match(mac))


def parse_ip_range(ip_range: str) -> List[str]:
    """Parse an IP range string and return list of IP addresses."""
    try:
        network = ipaddress.ip_network(ip_range, strict=False)
        return [str(ip) for ip in network.hosts()]
    except ValueError:
        return []


def is_private_ip(ip: str) -> bool:
    """Check if an IP address is private."""
    try:
        ip_obj = ipaddress.ip_address(ip)
        return ip_obj.is_private
    except ValueError:
        return False


def format_datetime(dt: datetime) -> str:
    """Format datetime for API responses."""
    return dt.isoformat() if dt else None


def sanitize_string(value: str, max_length: Optional[int] = None) -> str:
    """Sanitize string input by trimming whitespace and optionally limiting length."""
    if not value:
        return ""
    
    sanitized = value.strip()
    
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized


def generate_unique_name(base_name: str, existing_names: List[str]) -> str:
    """Generate a unique name by appending a number if the base name exists."""
    if base_name not in existing_names:
        return base_name
    
    counter = 1
    while f"{base_name}_{counter}" in existing_names:
        counter += 1
    
    return f"{base_name}_{counter}"


def chunk_list(lst: List, chunk_size: int) -> List[List]:
    """Split a list into chunks of specified size."""
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]


def safe_int(value: Union[str, int, None], default: int = 0) -> int:
    """Safely convert a value to integer with a default."""
    if value is None:
        return default
    
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def safe_float(value: Union[str, float, None], default: float = 0.0) -> float:
    """Safely convert a value to float with a default."""
    if value is None:
        return default
    
    try:
        return float(value)
    except (ValueError, TypeError):
        return default
