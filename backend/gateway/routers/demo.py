from fastapi import APIRouter, Body
from datetime import datetime
import uuid
from gateway.websocket.manager import broadcast_event

router = APIRouter(prefix="/demo", tags=["Demo"])

@router.post("/events/inject")
async def inject_event(
    event_type: str = Body(..., examples=["anomaly:detected"]),
    payload: dict = Body(default={}),
):
    """Inject a synthetic event into the WebSocket stream for demo/testing."""
    payload["_injected"] = True
    payload["_source"] = "rest_api"
    payload["timestamp"] = datetime.utcnow().isoformat()

    await broadcast_event(event_type, payload)

    return {
        "status": "injected",
        "event_type": event_type,
        "payload": payload,
    }

@router.post("/trigger-anomaly")
async def trigger_anomaly(
    segment_id: str = Body(default="seg-mum-del-km402", embed=True),
):
    """Specific endpoint to trigger the Red Alert sequence on all frontend clients."""
    payload = {
        "id": str(uuid.uuid4()),
        "title": "CRITICAL: Acoustic Anomaly",
        "description": f"Rail crack detected on {segment_id}.",
        "severity": "critical",
        "segmentId": segment_id,
        "timestamp": datetime.utcnow().isoformat(),
        "_injected": True
    }
    await broadcast_event("anomaly:detected", payload)
    
    return {"status": "anomaly_triggered", "payload": payload}
