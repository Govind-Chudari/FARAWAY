import asyncio
import uuid
import math
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text

from shared.database.connection import settings, Base
from shared.models.segment import Segment
from shared.models.train import Train
from shared.models.drone import Drone
from shared.models.maintenance_crew import MaintenanceCrew
from shared.models.agent_decision import AgentDecision
from shared.models.incident import Incident
from shared.models.work_order import WorkOrder
from shared.models.acoustic_event import AcousticEvent

# Core cities
MUMBAI = (19.0760, 72.8777)
DELHI = (28.7041, 77.1025)
CHENNAI = (13.0827, 80.2707)
KOLKATA = (22.5726, 88.3639)
BANGALORE = (12.9716, 77.5946)

ROUTES = [
    {"name": "MUM-DEL", "start": MUMBAI, "end": DELHI, "distance": 1400},
    {"name": "DEL-KOL", "start": DELHI, "end": KOLKATA, "distance": 1500},
    {"name": "KOL-CHN", "start": KOLKATA, "end": CHENNAI, "distance": 1600},
    {"name": "CHN-MUM", "start": CHENNAI, "end": MUMBAI, "distance": 1300},
    {"name": "MUM-BLR", "start": MUMBAI, "end": BANGALORE, "distance": 1000},
]

def generate_geometry(start_coord, end_coord, start_pct, end_pct, num_points=5):
    lat1, lon1 = start_coord
    lat2, lon2 = end_coord
    
    t_start = start_pct
    t_end = end_pct
    
    coords = []
    for i in range(num_points):
        t = t_start + (t_end - t_start) * (i / max(1, num_points - 1))
        # Add slight curvature
        lat = lat1 + (lat2 - lat1) * t
        lon = lon1 + (lon2 - lon1) * t + math.sin(t * 10) * 0.1
        coords.append([lon, lat])
        
    return {"type": "LineString", "coordinates": coords}

async def seed():
    print("Connecting to Neon PostgreSQL...")
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        print("Creating tables if they don't exist...")
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        print("Truncating old data...")
        await session.execute(text("TRUNCATE TABLE trains CASCADE"))
        await session.execute(text("TRUNCATE TABLE acoustic_events CASCADE"))
        await session.execute(text("TRUNCATE TABLE agent_decisions CASCADE"))
        await session.execute(text("TRUNCATE TABLE work_orders CASCADE"))
        await session.execute(text("TRUNCATE TABLE incidents CASCADE"))
        await session.execute(text("TRUNCATE TABLE segments CASCADE"))
        await session.execute(text("TRUNCATE TABLE drones CASCADE"))
        await session.execute(text("TRUNCATE TABLE maintenance_crews CASCADE"))

        print("Seeding Indian Railway Segments...")
        segments = []
        for route in ROUTES:
            num_segs = 10
            for i in range(num_segs):
                start_pct = i / num_segs
                end_pct = (i + 1) / num_segs
                km_start = start_pct * route["distance"]
                km_end = end_pct * route["distance"]
                
                seg = Segment(
                    id=uuid.uuid4(),
                    code=f"{route['name']}-KM{int(km_start)}",
                    route=route['name'],
                    from_station=route['name'].split("-")[0] if i == 0 else f"WP-{int(km_start)}",
                    to_station=route['name'].split("-")[1] if i == num_segs - 1 else f"WP-{int(km_end)}",
                    km_start=round(km_start, 2),
                    km_end=round(km_end, 2),
                    line_type="high_speed",
                    health_index=100,
                    status="normal",
                    geometry=generate_geometry(route["start"], route["end"], start_pct, end_pct)
                )
                segments.append(seg)
        session.add_all(segments)
        
        print("Seeding Trains...")
        trains = []
        import random
        import sys
        
        # Read from CLI argument, default to 20 per route (100 total for 5 routes)
        try:
            trains_per_route = int(sys.argv[1]) if len(sys.argv) > 1 else 20
        except ValueError:
            trains_per_route = 20
            
        print(f"Seeding {trains_per_route} trains per route (Total: {len(ROUTES) * trains_per_route} trains)...")
        
        for i, route in enumerate(ROUTES):
            for j in range(trains_per_route):
                origin = route['name'].split("-")[0]
                destination = route['name'].split("-")[1]
                t = Train(
                    id=uuid.uuid4(),
                    number=str(12000 + i*100 + j),
                    name=f"{origin}-{destination} Express {j+1}",
                    origin=origin,
                    destination=destination,
                    latitude=route['start'][0] + random.uniform(-0.5, 0.5),
                    longitude=route['start'][1] + random.uniform(-0.5, 0.5),
                    speed_kmh=random.uniform(70, 130),
                    status="running",
                    passenger_count=random.randint(400, 1200),
                    delay_minutes=0
                )
                trains.append(t)
        session.add_all(trains)
        
        print("Seeding Drones...")
        drones = [
            Drone(call_sign="UAV-MUM-1", status="patrolling", battery_pct=94.5, speed_kmh=120.0, latitude=MUMBAI[0], longitude=MUMBAI[1]),
            Drone(call_sign="UAV-DEL-1", status="standby", battery_pct=100.0, speed_kmh=0.0, latitude=DELHI[0], longitude=DELHI[1]),
            Drone(call_sign="UAV-CHN-1", status="patrolling", battery_pct=45.2, speed_kmh=90.0, latitude=CHENNAI[0], longitude=CHENNAI[1]),
            Drone(call_sign="UAV-KOL-1", status="charging", battery_pct=12.0, speed_kmh=0.0, latitude=KOLKATA[0], longitude=KOLKATA[1]),
        ]
        session.add_all(drones)
        
        print("Seeding Maintenance Crews...")
        crews = [
            MaintenanceCrew(name="Alpha-West", zone="Western", specialization="Tracks", current_location="Mumbai"),
            MaintenanceCrew(name="Bravo-North", zone="Northern", specialization="Electrical", current_location="Delhi"),
            MaintenanceCrew(name="Charlie-South", zone="Southern", specialization="Tracks", current_location="Chennai"),
        ]
        session.add_all(crews)
        
        await session.commit()
        print("Successfully seeded core infrastructure!")

if __name__ == "__main__":
    asyncio.run(seed())
