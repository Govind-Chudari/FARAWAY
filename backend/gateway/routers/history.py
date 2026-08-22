from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional, List
import uuid
from datetime import datetime

from shared.database.connection import get_db
from shared.models.change_record import ChangeRecord

router = APIRouter(prefix="/history", tags=["History"])

def serialize_record(record: ChangeRecord) -> dict:
    return {
        "id": str(record.id),
        "entity_type": record.entity_type,
        "entity_id": str(record.entity_id),
        "action": record.action,
        "changes": record.changes,
        "snapshot": record.snapshot,
        "changed_by": record.changed_by,
        "change_reason": record.change_reason,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }

@router.get("")
async def list_history(
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    changed_by: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(ChangeRecord)
    
    if entity_type:
        query = query.filter(ChangeRecord.entity_type == entity_type)
    if action:
        query = query.filter(ChangeRecord.action == action)
    if changed_by:
        query = query.filter(ChangeRecord.changed_by == changed_by)
    if from_date:
        query = query.filter(ChangeRecord.created_at >= from_date)
    if to_date:
        query = query.filter(ChangeRecord.created_at <= to_date)
        
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # Get records
    query = query.order_by(desc(ChangeRecord.created_at)).limit(limit).offset(offset)
    result = await db.execute(query)
    records = result.scalars().all()
    
    return {
        "records": [serialize_record(r) for r in records],
        "total": total or 0,
        "page": (offset // limit) + 1
    }

@router.get("/{entity_type}/{entity_id}")
async def get_entity_history(
    entity_type: str,
    entity_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        parsed_uuid = uuid.UUID(entity_id)
        query = select(ChangeRecord).filter(
            ChangeRecord.entity_type == entity_type,
            ChangeRecord.entity_id == parsed_uuid
        ).order_by(desc(ChangeRecord.created_at))
    except ValueError:
        return []
    
    result = await db.execute(query)
    records = result.scalars().all()
    return [serialize_record(r) for r in records]

@router.get("/{record_id}/snapshot")
async def get_snapshot(
    record_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    record = await db.get(ChangeRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Change record not found")
    return {"snapshot": record.snapshot}

@router.get("/stats")
async def get_history_stats(db: AsyncSession = Depends(get_db)):
    total_query = select(func.count()).select_from(ChangeRecord)
    total_changes = await db.scalar(total_query)
    
    archive_query = select(func.count()).select_from(ChangeRecord).filter(ChangeRecord.action == "archived")
    total_archives = await db.scalar(archive_query)
    
    delete_query = select(func.count()).select_from(ChangeRecord).filter(ChangeRecord.action == "deleted")
    total_deletions = await db.scalar(delete_query)
    
    restore_query = select(func.count()).select_from(ChangeRecord).filter(ChangeRecord.action == "restored")
    total_restorations = await db.scalar(restore_query)
    
    return {
        "total_changes": total_changes or 0,
        "archives": total_archives or 0,
        "deletions": total_deletions or 0,
        "restorations": total_restorations or 0
    }
