import uuid
from sqlalchemy import Column, String, Text, DateTime, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from shared.database.connection import Base

class ChangeRecord(Base):
    __tablename__ = "change_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String, nullable=False, index=True)   # "segment" | "train" | "incident" | "work_order" | "drone"
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)     # FK to the changed entity
    action = Column(String, nullable=False, index=True)   # "created" | "updated" | "archived" | "deleted" | "restored"
    changes = Column(JSON, nullable=True)                  # {"field": {"old": ..., "new": ...}, ...}
    snapshot = Column(JSON, nullable=True)                  # Full entity state at time of change
    changed_by = Column(String, nullable=False, default="system") # "system" | "agent:acoustic" | "operator:admin"
    change_reason = Column(Text, nullable=True)                  # Optional human/agent reason
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
