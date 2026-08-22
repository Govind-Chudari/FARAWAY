import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from shared.database.connection import Base

class Train(Base):
    __tablename__ = "trains"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    number = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    status = Column(String, default="running")
    speed_kmh = Column(Float, default=0.0)
    passenger_count = Column(Integer, default=0)
    delay_minutes = Column(Integer, default=0)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    bearing = Column(Float, default=0.0)
    current_segment_id = Column(UUID(as_uuid=True), ForeignKey("segments.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_archived = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    archived_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
