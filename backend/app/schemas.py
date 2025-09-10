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
    custom_fields: Optional[str] = None

class LabelBase(BaseModel):
    name: str

class LabelCreate(LabelBase):
    pass

class Label(LabelBase):
    id: int

    class Config:
        orm_mode = True

class AssetCreate(AssetBase):
    ips: List[IPAddressCreate] = []
    labels: List[int] = []

class AssetGroupBase(BaseModel):
    name: str

class AssetGroupCreate(AssetGroupBase):
    asset_ids: List[int] = []
    labels: List[int] = []

class AssetGroup(AssetGroupBase):
    id: int
    assets: "List[Asset]" = []
    labels: List[Label] = []

    class Config:
        orm_mode = True

class Asset(AssetBase):
    id: int
    ips: List[IPAddress] = []
    labels: List[Label] = []

    class Config:
        orm_mode = True

AssetGroup.update_forward_refs()
Asset.update_forward_refs()

class OperationBase(BaseModel):
    name: str
    api_url: str
    api_method: str
    api_headers: Optional[str] = None
    api_body: Optional[str] = None

class OperationCreate(OperationBase):
    pass

class Operation(OperationBase):
    id: int

    class Config:
        orm_mode = True

class JobBase(BaseModel):
    operation_id: int
    asset_group_id: int
    status: str
    results: Optional[str] = None

class JobCreate(JobBase):
    pass

class Job(JobBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None

    class Config:
        orm_mode = True
