import uuid
from sqlalchemy import Column, String, Float, SmallInteger, DateTime, JSON, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from shared.database.connection import Base

class Segment(Base):
    __tablename__ = "segments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, unique=True, nullable=False)
    route = Column(String, nullable=False)
    from_station = Column(String, nullable=False)
    to_station = Column(String, nullable=False)
    km_start = Column(Float, nullable=False)
    km_end = Column(Float, nullable=False)
    line_type = Column(String, nullable=False, default="main")
    health_index = Column(SmallInteger, default=100)
    status = Column(String, default="normal")
    geometry = Column(JSON, nullable=True)
    last_inspected = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_archived = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    archived_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
