from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Port(BaseModel):
    port: int
    proto: str
    state: str
    service: Optional[str]
    class Config:
       orm_mode = True

class ScanOut(BaseModel):
    timestamp: datetime
    ports: List[Port]
    class Config:
       orm_mode = True

class DeviceOut(BaseModel):
    id: int
    ip: str
    mac: Optional[str]
    vendor: Optional[str]
    last_seen: datetime
    class Config:
        orm_mode = True

class IPAddressBase(BaseModel):
    ip: str

class IPAddressCreate(IPAddressBase):
    pass

class IPAddress(IPAddressBase):
    id: int
    asset_id: int

    class Config:
        orm_mode = True

class AssetBase(BaseModel):
    name: str
    mac: Optional[str] = None
    owner: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    scan_data: Optional[str] = None
    labels: Optional[str] = None
    custom_fields: Optional[str] = None

class AssetCreate(AssetBase):
    ips: List[IPAddressCreate] = []

class Asset(AssetBase):
    id: int
    ips: List[IPAddress] = []

    class Config:
        orm_mode = True
