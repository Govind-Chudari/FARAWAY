import uuid
from sqlalchemy import Column, String, Float, DateTime, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from shared.database.connection import Base

class Drone(Base):
    __tablename__ = "drones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    call_sign = Column(String, unique=True, nullable=False)
    status = Column(String, default="standby")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    altitude = Column(Float, nullable=True)
    battery_pct = Column(Float, default=100.0)
    mission = Column(String, nullable=True)
    speed_kmh = Column(Float, default=0.0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_archived = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    archived_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
