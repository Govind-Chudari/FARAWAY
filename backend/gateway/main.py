from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
import uvicorn

from gateway.routers import (
    acoustic,
    agents,
    trains,
    tracks,
    routing,
    weather,
    maintenance,
    drones,
    reports,
    demo,
)
from gateway.websocket.manager import sio
from gateway.middleware.logging import LoggingMiddleware

from contextlib import asynccontextmanager
import asyncio
from gateway.stream_worker import start_consumer

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the Kafka consumer background task
    consumer_task = asyncio.create_task(start_consumer())
    yield
    # Cancel the task on shutdown
    consumer_task.cancel()

app = FastAPI(
    title="RailNerv Sentinel API",
    description="Acoustic Railway Intelligence Network — 6-Agent Autonomous Command Center",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://faraway-railmind.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)

# API Routers
PREFIX = "/api/v1"
app.include_router(acoustic.router, prefix=PREFIX)
app.include_router(agents.router, prefix=PREFIX)
app.include_router(trains.router, prefix=PREFIX)
app.include_router(tracks.router, prefix=PREFIX)
app.include_router(routing.router, prefix=PREFIX)
app.include_router(weather.router, prefix=PREFIX)
app.include_router(maintenance.router, prefix=PREFIX)
app.include_router(drones.router, prefix=PREFIX)
app.include_router(reports.router, prefix=PREFIX)
app.include_router(demo.router, prefix=PREFIX)

# Socket.IO mount
socket_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path="/ws/socket.io")


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0", "agents": 6}


if __name__ == "__main__":
    uvicorn.run("gateway.main:socket_app", host="0.0.0.0", port=8000, reload=True)
