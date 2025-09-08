from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, unique=True, index=True)
    mac = Column(String, nullable=True)
    vendor = Column(String, nullable=True)
    last_seen = Column(DateTime)

    scans = relationship("Scan", back_populates="device", cascade="all, delete-orphan")

class ScanTask(Base):
    __tablename__ = "scan_tasks"
    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    target = Column(String)
    status = Column(String, default="running") # running, completed, cancelled, failed
    scan_type = Column(String)

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
    labels = Column(String) # JSON serialized
    custom_fields = Column(String) # JSON serialized

    ips = relationship("IPAddress", back_populates="asset", cascade="all, delete-orphan")

class IPAddress(Base):
    __tablename__ = "ip_addresses"
    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))

    asset = relationship("Asset", back_populates="ips")
