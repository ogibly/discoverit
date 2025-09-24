"""
Configuration management for DiscoverIT API.
"""
import os
from typing import List
from pydantic import validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Database
    database_url: str = "postgresql://discoverit:DiscoverIT4DB@postgres:5432/discoverit"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    allowed_origins: List[str] = ["http://localhost:5173", "http://frontend:5173"]
    
    # Logging
    log_level: str = "INFO"
    sql_debug: bool = False
    
    # Scanner Configuration
    default_scanner_url: str = "http://scanner:8001"
    scan_timeout: int = 300
    max_concurrent_scans: int = 5
    max_discovery_depth: int = 3
    
    # Default Networks
    default_subnets: List[str] = [
        "172.18.0.0/16",    # Docker Compose default network
        "172.17.0.0/16",    # Docker default bridge network
        "192.168.0.0/16",   # Common home/office networks
        "10.0.0.0/8",       # Common corporate networks
        "172.16.0.0/12"     # Private network range
    ]
    
    @validator('allowed_origins', pre=True)
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
