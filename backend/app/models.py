from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

asset_group_association = Table(
    'asset_group_association', Base.metadata,
    Column('asset_id', Integer, ForeignKey('assets.id')),
    Column('asset_group_id', Integer, ForeignKey('asset_groups.id'))
)

asset_label_association = Table(
    'asset_label_association', Base.metadata,
    Column('asset_id', Integer, ForeignKey('assets.id')),
    Column('label_id', Integer, ForeignKey('labels.id'))
)

asset_group_label_association = Table(
    'asset_group_label_association', Base.metadata,
    Column('asset_group_id', Integer, ForeignKey('asset_groups.id')),
    Column('label_id', Integer, ForeignKey('labels.id'))
)

class Label(Base):
    __tablename__ = "labels"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, unique=True, index=True)
    mac = Column(String, nullable=True)
    vendor = Column(String, nullable=True)
    last_seen = Column(DateTime)
    hostname = Column(String, nullable=True)
    os_name = Column(String, nullable=True)
    os_family = Column(String, nullable=True)
    os_version = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    model = Column(String, nullable=True)
    scan_data = Column(String, nullable=True)  # JSON serialized for additional data

    scans = relationship("Scan", back_populates="device", cascade="all, delete-orphan")

class ScanTask(Base):
    __tablename__ = "scan_tasks"
    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    target = Column(String)
    status = Column(String, default="running") # running, completed, cancelled, failed
    scan_type = Column(String)
    progress = Column(Integer, default=0) # Percentage of completion
    current_ip = Column(String, nullable=True) # IP being scanned
    total_ips = Column(Integer, default=0) # Total IPs to scan

class Scan(Base):
    __tablename__ = "scans"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    scan_task_id = Column(Integer, ForeignKey("scan_tasks.id"), nullable=True)
    timestamp = Column(DateTime)
    scan_data = Column(String)  # JSON serialized
    status = Column(String, default="completed")

    device = relationship("Device", back_populates="scans")

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    mac = Column(String, nullable=True)
    owner = Column(String, nullable=True)
    username = Column(String, nullable=True)
    password = Column(String, nullable=True) # Should be encrypted
    scan_data = Column(String) # JSON serialized
    custom_fields = Column(String) # JSON serialized

    ips = relationship("IPAddress", back_populates="asset", cascade="all, delete-orphan")
    groups = relationship("AssetGroup", secondary=asset_group_association, back_populates="assets")
    labels = relationship("Label", secondary=asset_label_association)

class AssetGroup(Base):
    __tablename__ = "asset_groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

    assets = relationship("Asset", secondary=asset_group_association, back_populates="groups")
    labels = relationship("Label", secondary=asset_group_label_association)

class Operation(Base):
    __tablename__ = "operations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    api_url = Column(String)
    api_method = Column(String)
    api_headers = Column(String) # JSON serialized
    api_body = Column(String) # JSON serialized

    jobs = relationship("Job", back_populates="operation")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    operation_id = Column(Integer, ForeignKey("operations.id"))
    asset_ids = Column(String) # JSON serialized
    asset_group_ids = Column(String) # JSON serialized
    status = Column(String, default="running") # running, completed, failed
    results = Column(String) # JSON serialized
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    params = Column(String) # JSON serialized

    operation = relationship("Operation", back_populates="jobs")

class IPAddress(Base):
    __tablename__ = "ip_addresses"
    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))

    asset = relationship("Asset", back_populates="ips")

class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    scanners = Column(String, nullable=True) # JSON serialized list of scanner configs
