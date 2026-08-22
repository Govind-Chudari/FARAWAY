import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, SmallInteger, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from shared.database.connection import Base

class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment_id = Column(UUID(as_uuid=True), ForeignKey("segments.id"), nullable=False)
    priority = Column(String, nullable=False, default="P1")
    health_index_at_creation = Column(SmallInteger, nullable=True)
    crew_id = Column(UUID(as_uuid=True), ForeignKey("maintenance_crews.id"), nullable=True)
    status = Column(String, default="pending")
    description = Column(Text, nullable=True)
    estimated_hours = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    is_archived = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    archived_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
