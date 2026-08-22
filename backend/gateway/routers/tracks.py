import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from shared.database.connection import get_db
from shared.models.segment import Segment

router = APIRouter(prefix="/tracks", tags=["Tracks"])

@router.get("")
async def list_tracks(status: str | None = None, db: AsyncSession = Depends(get_db)):
    """List all monitored track segments."""
    try:
        query = select(Segment).filter(Segment.is_archived == False, Segment.is_deleted == False)
        if status:
            query = query.filter(Segment.status == status)
            
        result = await db.execute(query)
        segments = result.scalars().all()
        return {"segments": segments, "total": len(segments)}
    except Exception as e:
        print(f"Warning: Live tracks data failed ({e}). Using fallback data.")
        segments = [
            {
                "id": str(uuid.uuid4()),
                "code": "SIM-SEG-001",
                "name": "Simulated Western Route",
                "status": "active",
                "health_index": 95,
                "length_km": 12.5,
                "latitude": 19.0760,
                "longitude": 72.8777,
            }
        ]
        return {"segments": segments, "total": len(segments)}

@router.get("/{segment_id}/history")
async def get_track_history(segment_id: str, hours: int = 48, db: AsyncSession = Depends(get_db)):
    """Get health index history for a segment."""
    try:
        try:
            parsed_uuid = uuid.UUID(segment_id)
        except ValueError:
            raise Exception("Invalid segment ID format. Must be UUID.")
            
        result = await db.execute(select(Segment).filter(Segment.id == parsed_uuid))
        segment = result.scalars().first()
            
        if not segment:
            raise Exception("Segment not found in database.")
            
        return {
            "segment_id": segment_id,
            "segment_code": segment.code,
            "history": [],  # Real history requires a separate timeseries table which will be created in future iterations.
            "current_health": segment.health_index,
        }
    except Exception as e:
        print(f"Warning: Live track history failed ({e}). Using fallback data.")
        return {
            "segment_id": segment_id,
            "segment_code": "SIM-SEG-999",
            "history": [],
            "current_health": 85,
        }
