import asyncio
import json
import uuid
import random
from datetime import datetime, timezone
from aiokafka import AIOKafkaProducer
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text

from shared.database.connection import settings
from shared.models.train import Train
from shared.models.segment import Segment
from shared.models.maintenance_crew import MaintenanceCrew

import os
KAFKA_BROKER = os.getenv("KAFKA_BROKER_URL", "localhost:9092")
TOPIC = "railnerv_telemetry"

INITIAL_TRAINS = [
    {"number": "12951", "name": "Mumbai Rajdhani Express", "origin": "MUM", "destination": "DEL", "speed_kmh": 128.5, "passenger_count": 952},
    {"number": "12301", "name": "Howrah Rajdhani Express", "origin": "KOL", "destination": "DEL", "speed_kmh": 115.0, "passenger_count": 1104},
    {"number": "12621", "name": "Tamil Nadu Express", "origin": "CHN", "destination": "DEL", "speed_kmh": 98.2, "passenger_count": 1450},
    {"number": "12657", "name": "Chennai Mail", "origin": "CHN", "destination": "MUM", "speed_kmh": 72.0, "passenger_count": 1200},
    {"number": "12259", "name": "Sealdah Duronto Express", "origin": "KOL", "destination": "DEL", "speed_kmh": 110.0, "passenger_count": 780},
    {"number": "22691", "name": "Rajdhani Express", "origin": "BLR", "destination": "DEL", "speed_kmh": 112.3, "passenger_count": 890},
]

AGENTS = ["acoustic", "weather", "routing", "emergency", "reporter", "supervisor"]

async def fetch_initial_state():
    """Reads DB once to get the segments, crews, and trains to simulate."""
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        from sqlalchemy.future import select
        segments = (await session.execute(select(Segment))).scalars().all()
        crews = (await session.execute(select(MaintenanceCrew))).scalars().all()
        trains = (await session.execute(select(Train))).scalars().all()
        
        # Keep track in memory
        state = {
            "segments": [{"id": str(s.id), "code": s.code, "health_index": s.health_index, "status": s.status} for s in segments],
            "crews": [{"id": str(c.id), "name": c.name} for c in crews],
            "trains": [{"id": str(t.id), "number": t.number, "latitude": t.latitude, "longitude": t.longitude, "speed_kmh": t.speed_kmh, "passenger_count": t.passenger_count, "delay_minutes": t.delay_minutes} for t in trains]
        }
    await engine.dispose()
    return state

async def run_simulation():
    print("============== V3 KAFKA STREAMING SIMULATOR ==============")
    print("Connecting to Kafka...")
    
    # Wait for Kafka to be ready
    producer = None
    for _ in range(10):
        try:
            producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BROKER)
            await producer.start()
            print("Connected to Kafka!")
            break
        except Exception as e:
            print(f"Kafka not ready yet: {e}")
            await asyncio.sleep(2)
            
    if not producer:
        print("Failed to connect to Kafka. Exiting.")
        return

    print("Fetching initial state from DB...")
    state = await fetch_initial_state()
    
    try:
        while True:
            events = []
            now = datetime.now(timezone.utc).isoformat()
            
            # 1. Simulate Trains
            for t in state["trains"]:
                t["latitude"] += random.uniform(-0.02, 0.02)
                t["longitude"] += random.uniform(-0.02, 0.02)
                t["speed_kmh"] = max(0, t["speed_kmh"] + random.uniform(-5.0, 5.0))
                
                if random.random() < 0.2:
                    change = random.randint(-50, 50)
                    t["passenger_count"] = max(0, t["passenger_count"] + change)

                if random.random() < 0.1:
                    t["delay_minutes"] = max(0, t["delay_minutes"] + random.randint(-1, 3))
                    
                events.append({
                    "event_type": "train:position",
                    "payload": {
                        "id": t["id"],
                        "number": t["number"],
                        "latitude": t["latitude"],
                        "longitude": t["longitude"],
                        "speed_kmh": t["speed_kmh"],
                        "passenger_count": t["passenger_count"],
                        "delay_minutes": t["delay_minutes"],
                        "timestamp": now
                    }
                })

            # 2. Simulate Track Health & Anomalies
            if state["segments"]:
                degraded = random.sample(state["segments"], min(len(state["segments"]), 5))
                for seg in degraded:
                    seg["health_index"] = max(0, seg["health_index"] - random.randint(1, 4))
                    if seg["health_index"] < 40:
                        seg["status"] = "critical"
                    elif seg["health_index"] < 70:
                        seg["status"] = "warning"
                    else:
                        seg["status"] = "normal"
                        
                    events.append({
                        "event_type": "track:health",
                        "payload": {
                            "id": seg["id"],
                            "code": seg["code"],
                            "health_index": seg["health_index"],
                            "status": seg["status"],
                            "timestamp": now
                        }
                    })

                # Healing
                for seg in state["segments"]:
                    if seg["status"] in ("critical", "warning") and random.random() < 0.15:
                        seg["health_index"] = min(100, seg["health_index"] + random.randint(30, 60))
                        if seg["health_index"] >= 70:
                            seg["status"] = "normal"
                        elif seg["health_index"] >= 40:
                            seg["status"] = "warning"
                            
                        events.append({
                            "event_type": "track:health",
                            "payload": {
                                "id": seg["id"],
                                "code": seg["code"],
                                "health_index": seg["health_index"],
                                "status": seg["status"],
                                "timestamp": now
                            }
                        })
                        
                # Spawn Acoustic Event
                if random.random() < 0.2:
                    seg = random.choice(state["segments"])
                    event_type = random.choice(["micro_crack", "vibration_anomaly", "boulder_detected"])
                    severity = "warning" if random.random() > 0.3 else "critical"
                    
                    events.append({
                        "event_type": "anomaly:detected",
                        "payload": {
                            "id": str(uuid.uuid4()),
                            "segmentId": seg["id"],
                            "segmentCode": seg["code"],
                            "title": f"Acoustic Anomaly: {event_type}",
                            "description": f"Detected {event_type} on {seg['code']}",
                            "severity": severity,
                            "confidence": random.uniform(0.7, 0.99),
                            "timestamp": now
                        }
                    })

            # 3. Simulate Agent Decisions
            if random.random() < 0.8:
                agent = random.choice(AGENTS)
                actions = ["Re-calibrated sensors", "Checked weather patterns", "Adjusted route weights", "Verified drone telemetry", "System healthy"]
                events.append({
                    "event_type": "agent:decision",
                    "payload": {
                        "agentId": agent,
                        "action": random.choice(actions),
                        "confidence": random.uniform(0.85, 0.99),
                        "timestamp": now
                    }
                })

            # Publish all events to Kafka
            for ev in events:
                await producer.send_and_wait(TOPIC, json.dumps(ev).encode("utf-8"))
                
            print(f"[{now}] Published {len(events)} telemetry events to Kafka.")
            
            # Super fast ticks for dynamic UI
            await asyncio.sleep(0.5)
            
    except Exception as e:
        print(f"Simulation tick error: {e}")
    finally:
        await producer.stop()

if __name__ == "__main__":
    asyncio.run(run_simulation())
