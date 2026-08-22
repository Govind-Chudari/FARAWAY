import asyncio
import uuid
import random
import httpx
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text

# Assuming settings is importable or define DATABASE_URL directly
from shared.database.connection import settings
from shared.models.train import Train
from shared.models.segment import Segment

# Static seed data for Trains if the database is empty
INITIAL_TRAINS = [
    {"number": "12951", "name": "Mumbai Rajdhani Express", "origin": "BCT", "destination": "NDLS", "speed_kmh": 128.5, "passenger_count": 952},
    {"number": "12301", "name": "Howrah Rajdhani Express", "origin": "HWH", "destination": "NDLS", "speed_kmh": 115.0, "passenger_count": 1104},
    {"number": "12621", "name": "Tamil Nadu Express", "origin": "MAS", "destination": "NDLS", "speed_kmh": 98.2, "passenger_count": 1450},
    {"number": "12657", "name": "Chennai Mail", "origin": "SBC", "destination": "MAS", "speed_kmh": 72.0, "passenger_count": 1200},
    {"number": "12259", "name": "Sealdah Duronto Express", "origin": "SDAH", "destination": "NDLS", "speed_kmh": 110.0, "passenger_count": 780},
    {"number": "22691", "name": "Rajdhani Express", "origin": "SBC", "destination": "NZM", "speed_kmh": 112.3, "passenger_count": 890},
]

async def seed_trains_if_empty(session, segments):
    res = await session.execute(text("SELECT COUNT(*) FROM trains"))
    count = res.scalar()
    if count > 0:
        return

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Database empty! Seeding {len(INITIAL_TRAINS)} live trains...")
    
    # Extract segment IDs to assign trains to random initial segments
    segment_ids = [s.id for s in segments] if segments else [None]

    train_objs = []
    for t_data in INITIAL_TRAINS:
        train = Train(
            id=uuid.uuid4(),
            number=t_data["number"],
            name=t_data["name"],
            origin=t_data["origin"],
            destination=t_data["destination"],
            status="running",
            speed_kmh=t_data["speed_kmh"],
            passenger_count=t_data["passenger_count"],
            delay_minutes=random.choice([0, 0, 0, 5, 12, 35]),
            latitude=20.0 + random.uniform(-5, 5),
            longitude=77.0 + random.uniform(-5, 5),
            bearing=random.uniform(0, 360),
            current_segment_id=random.choice(segment_ids) if segment_ids[0] else None
        )
        train_objs.append(train)
        
    session.add_all(train_objs)
    await session.commit()
    print("Trains seeded successfully!")

async def simulate_train_movement(session):
    # Fetch all trains
    from sqlalchemy.future import select
    result = await session.execute(select(Train))
    trains = result.scalars().all()

    for train in trains:
        if train.status == "running":
            # Simulate GPS movement
            train.latitude += random.uniform(-0.01, 0.01)
            train.longitude += random.uniform(-0.01, 0.01)
            # Slight speed variations
            train.speed_kmh = max(0, train.speed_kmh + random.uniform(-2.0, 2.0))
            
            # 10% chance to increase/decrease delay
            if random.random() < 0.10:
                train.delay_minutes = max(0, train.delay_minutes + random.randint(-2, 5))
            
            # If delay > 30, maybe status changes to warning
            if train.delay_minutes > 60:
                train.status = "warning"
            elif train.delay_minutes <= 15:
                train.status = "running"
    
    await session.commit()

async def simulate_track_health(session, segments):
    if not segments: return
    
    # Pick a few random segments to degrade
    degraded = random.sample(segments, min(len(segments), 3))
    for seg in degraded:
        # Decrease health by 1-3 points
        seg.health_index = max(0, seg.health_index - random.randint(1, 3))
        
        # Update status based on health
        if seg.health_index < 40:
            seg.status = "critical"
        elif seg.health_index < 70:
            seg.status = "warning"
        else:
            seg.status = "normal"
            
    await session.commit()

async def trigger_acoustic_anomaly(segment_code):
    """Sends a POST request to the API to trigger a websocket Red Alert"""
    try:
        async with httpx.AsyncClient() as client:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] INJECTING CRITICAL ANOMALY on {segment_code}!")
            # Triggering via the demo injection route so the UI sees it instantly
            await client.post(
                "http://localhost:8000/api/v1/demo/trigger-anomaly",
                json={"segment_id": segment_code},
                timeout=2.0
            )
    except Exception as e:
        print(f"Failed to trigger anomaly (is the FastAPI server running?): {e}")

async def run_simulation():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    print("============== RAILNERV LIVE SIMULATION ENGINE ==============")
    print("Connecting to Neon Database...")
    
    while True:
        try:
            async with async_session() as session:
                from sqlalchemy.future import select
                res = await session.execute(select(Segment))
                segments = res.scalars().all()
                await seed_trains_if_empty(session, segments)
                await simulate_train_movement(session)
                await simulate_track_health(session, segments)
                
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Tick completed: Updated {len(segments)} segments and trains.")
        except Exception as e:
            print(f"Simulation tick error: {e}")
            
        await asyncio.sleep(2)

async def run_anomaly_spammer():
    # Fetch segments once to pick from
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    segments = []
    while not segments:
        try:
            async with async_session() as session:
                from sqlalchemy.future import select
                res = await session.execute(select(Segment))
                segments = res.scalars().all()
        except Exception:
            pass
        await asyncio.sleep(2)
        
    while True:
        # Trigger anomaly very frequently (every 10-15 seconds)
        await asyncio.sleep(random.randint(10, 15))
        critical_seg = random.choice(segments)
        await trigger_acoustic_anomaly(critical_seg.code)

async def main():
    await asyncio.gather(
        run_simulation(),
        run_anomaly_spammer()
    )

if __name__ == "__main__":
    asyncio.run(main())
