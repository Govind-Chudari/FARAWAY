import json
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from shared.models.change_record import ChangeRecord
from gateway.websocket.manager import sio
from shared.events.definitions import EventTypes

class ChangeTracker:
    """Records meaningful entity changes to the change_records table."""
    
    @staticmethod
    def _json_serial(obj):
        """JSON serializer for objects not serializable by default json code"""
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, uuid.UUID):
            return str(obj)
        raise TypeError(f"Type {type(obj)} not serializable")

    @staticmethod
    def entity_to_dict(entity, exclude: set = None) -> dict:
        """Convert SQLAlchemy model instance to serializable dict for snapshots."""
        if exclude is None:
            exclude = {"_sa_instance_state", "created_at", "updated_at", "deleted_at", "archived_at"}
        else:
            exclude.add("_sa_instance_state")
            
        result = {}
        for k, v in entity.__dict__.items():
            if k not in exclude:
                # Handle basic serialization to avoid JSON errors later
                if isinstance(v, uuid.UUID):
                    result[k] = str(v)
                elif isinstance(v, datetime):
                    result[k] = v.isoformat()
                else:
                    result[k] = v
        return result

    @staticmethod
    def compute_diff(old_dict: dict, new_dict: dict, exclude_fields: set = None) -> dict:
        """Compute field-level diff between old and new entity states."""
        if exclude_fields is None:
            exclude_fields = {"_sa_instance_state", "updated_at", "created_at"}
        
        diff = {}
        all_keys = set(old_dict.keys()).union(set(new_dict.keys()))
        for key in all_keys:
            if key in exclude_fields:
                continue
            old_val = old_dict.get(key)
            new_val = new_dict.get(key)
            if old_val != new_val:
                diff[key] = {"old": old_val, "new": new_val}
        return diff
    
    @staticmethod
    async def record_change(
        db: AsyncSession,
        entity_type: str,
        entity_id: uuid.UUID,
        action: str,            # "created" | "updated" | "archived" | "deleted" | "restored"
        changes: dict = None,   # Field-level diff
        snapshot: dict = None,  # Full entity state
        changed_by: str = "system",
        change_reason: str = None,
    ) -> ChangeRecord:
        """Insert a change record and broadcast via WebSocket."""
        
        record = ChangeRecord(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            changes=changes,
            snapshot=snapshot,
            changed_by=changed_by,
            change_reason=change_reason
        )
        
        db.add(record)
        # Flush to get the ID but don't commit yet (let the caller commit)
        await db.flush()
        
        # Broadcast the change event
        event_payload = {
            "id": str(record.id),
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "action": action,
            "changed_by": changed_by,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await sio.emit(EventTypes.CHANGE_RECORDED, event_payload)
        
        return record
