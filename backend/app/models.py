from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, unique=True, index=True)
    mac = Column(String, nullable=True)
    vendor = Column(String, nullable=True)
    last_seen = Column(DateTime)

    scans = relationship("Scan", back_populates="device")

class Scan(Base):
    __tablename__ = "scans"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    timestamp = Column(DateTime)
    scan_data = Column(String)  # JSON serialized
    status = Column(String, default="completed")

    device = relationship("Device", back_populates="scans")
