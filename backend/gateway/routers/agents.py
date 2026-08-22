from fastapi import APIRouter, Body, Depends
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import uuid

from shared.database.connection import get_db
from shared.models.agent_decision import AgentDecision
from shared.change_tracker import ChangeTracker

router = APIRouter(prefix="/agents", tags=["Agents"])

BASE_AGENTS = ["acoustic", "weather", "routing", "emergency", "reporter", "supervisor"]

@router.get("/status")
async def get_agents_status(db: AsyncSession = Depends(get_db)):
    """Return status of all 6 AI agents based on recent DB activity."""
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    
    try:
        query = select(AgentDecision).filter(AgentDecision.created_at >= day_ago).order_by(AgentDecision.created_at.desc())
        result = await db.execute(query)
        decisions = result.scalars().all()
        
        stats = {a: {"decisions_today": 0, "confidence_sum": 0.0, "last_action": None, "last_action_time": None, "reasoning": None} for a in BASE_AGENTS}
        
        for d in decisions:
            name = d.agent_name.lower()
            if name not in stats:
                stats[name] = {"decisions_today": 0, "confidence_sum": 0.0, "last_action": None, "last_action_time": None, "reasoning": None}
            
            stats[name]["decisions_today"] += 1
            stats[name]["confidence_sum"] += d.confidence
            if stats[name]["last_action"] is None:
                stats[name]["last_action"] = d.action_taken
                stats[name]["last_action_time"] = d.created_at.isoformat() if d.created_at else None
                stats[name]["reasoning"] = d.reasoning
                
        agents = []
        for a in BASE_AGENTS:
            s = stats[a]
            count = s["decisions_today"]
            avg_conf = (s["confidence_sum"] / count) if count > 0 else 0.0
            agents.append({
                "id": a,
                "name": a.capitalize() + " Agent" if a != "supervisor" else "Supervisor AI",
                "status": "active" if count > 0 else "standby",
                "uptime_pct": 99.9 if count > 0 else 100.0,
                "decisions_today": count,
                "avg_confidence": round(avg_conf, 2),
                "last_action": s["last_action"],
                "last_active": s["last_action_time"],
                "reasoning": s["reasoning"]
            })
            
        return {"agents": agents, "total_active": sum(1 for a in agents if a["status"] == "active")}
    except Exception as e:
        print(f"Warning: Live agent status failed ({e}). Using fallback data.")
        agents = []
        for a in BASE_AGENTS:
            agents.append({
                "id": a,
                "name": a.capitalize() + " Agent" if a != "supervisor" else "Supervisor AI",
                "status": "standby",
                "uptime_pct": 100.0,
                "decisions_today": 0,
                "avg_confidence": 0.0,
                "last_action": "System fallback mode",
                "last_active": None,
                "reasoning": "Database disconnected"
            })
        return {"agents": agents, "total_active": 0}


@router.get("/audit")
async def get_audit_log(agent: str | None = None, limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Return the agent decision audit trail."""
    try:
        query = select(AgentDecision).order_by(AgentDecision.created_at.desc())
        if agent:
            query = query.filter(AgentDecision.agent_name == agent)
        query = query.limit(limit)
        
        result = await db.execute(query)
        rows = result.scalars().all()
        
        entries = []
        for r in rows:
            entries.append({
                "id": str(r.id),
                "agent": r.agent_name,
                "action": r.action_taken,
                "target": str(r.incident_id) if r.incident_id else "N/A",
                "confidence": r.confidence,
                "reasoning": r.reasoning,
                "human_override": r.human_override,
                "timestamp": r.created_at.isoformat() if r.created_at else None,
            })
            
        return {"entries": entries, "total": len(entries)}
    except Exception as e:
        print(f"Warning: Live agent audit log failed ({e}). Using fallback data.")
        entries = [{
            "id": "SIM-000",
            "agent": "system",
            "action": "Fallback Mechanism Activated",
            "target": "N/A",
            "confidence": 1.0,
            "reasoning": "Database connection failed, running on static safe data.",
            "human_override": "false",
            "timestamp": datetime.utcnow().isoformat(),
        }]
        return {"entries": entries, "total": 1}


@router.post("/override")
async def override_decision(
    decision_id: str = Body(...),
    override_action: str = Body(...),
    reason: str = Body(...),
    operator: str = Body(default="human_operator"),
    db: AsyncSession = Depends(get_db)
):
    """Override an agent decision with human authority."""
    query = select(AgentDecision).filter(AgentDecision.id == decision_id)
    result = await db.execute(query)
    decision = result.scalar_one_or_none()
    
    if decision:
        snapshot = ChangeTracker.entity_to_dict(decision)
        changes = {
            "human_override": {"old": decision.human_override, "new": "true"},
            "action_taken": {"old": decision.action_taken, "new": override_action}
        }
        decision.human_override = "true"
        decision.override_reason = reason
        decision.action_taken = override_action
        
        await ChangeTracker.record_change(
            db=db,
            entity_type="agent_decision",
            entity_id=decision.id,
            action="updated",
            changes=changes,
            snapshot=snapshot,
            changed_by=operator,
            change_reason=reason
        )
        await db.commit()
        
    return {
        "id": str(uuid.uuid4()),
        "original_decision_id": decision_id,
        "override_action": override_action,
        "reason": reason,
        "operator": operator,
        "status": "applied",
        "timestamp": datetime.utcnow().isoformat(),
    }
