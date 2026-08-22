<div align="center">
  <img src="frontend/public/logo.png" alt="RailMind Logo" width="120" />
  <h1>RailMind — Next-Generation Autonomous Safety & Telemetry Platform for Railways</h1>
  <p><strong>Real-time Multi-Agent Railway Intelligence Platform</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-3.8-231F20?logo=apachekafka)](https://kafka.apache.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostGIS-16-336791?logo=postgresql)](https://postgis.net/)
  [![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
</div>

<hr/>

## 🎯 Problem Statement
This project addresses the critical need for **autonomous, predictive safety monitoring in high-scale railway infrastructure**. Traditional track maintenance is reactive and manual. **RailMind** monitors live telemetry and acoustic sensor data in real-time using a coordinated swarm of specialized AI agents. It correlates geographical data, weather conditions, and acoustic spectrograms to detect micro-cracks and track anomalies *before* they lead to derailments.

## 🔗 Live Demo & Resources
| Resource | Link |
|---|---|
| 🔗 **Frontend (Vercel)** | https://faraway-railmind.vercel.app/ |
| 🔗 **Backend API (Google Cloud)** | http://34.14.128.156:8000/docs |
| 🎥 **Demo Video** | https://youtu.be/fgnzIGJVEu4 |
| 📺 **Pitch Deck Video** | https://youtu.be/Nt07pPpHoVg |
| 📊 **Presentation (PPT)** | [Canva Link](https://canva.link/yqkasi2ax24vv1u) |
| 📂 **Architecture & UML Assets** | [Google Drive Folder](https://drive.google.com/drive/folders/1YbszPm9gUl5ce1vteqLwGV0VWYnPK005) |

*Note: For the hackathon evaluation, the backend can be run locally using Docker Compose, while the frontend is deployable to Vercel.*

---

## 🚀 Round 2 Updates: Entity Lifecycle & Change Tracking
For Round 2, we introduced a **Comprehensive Change History & Lifecycle Management System** to ensure full auditability and operational safety:
* **Entity Lifecycle Manager:** Admins can securely `Archive`, `Restore`, or `Delete` critical assets (Track Segments, Trains, Drones, Work Orders, Incidents) directly from the dashboard.
* **Global Change History:** A dedicated tracking system logs every mutation (Create, Update, Archive, Restore, Delete) across the database.
* **Granular Audit Trails:** The system records *who* made the change (Operator ID), *when* it was made, the *exact reason*, and generates a precise JSON Diff (Old vs. New field values) for every action.

---

## 💻 Tech Stack
| Layer | Technology |
|---|---|
| **Backend API** | Python 3.12, FastAPI, Uvicorn |
| **Frontend** | Next.js 14, React 18, TailwindCSS 4, Framer Motion |
| **ML / AI** | PyTorch (Swin Transformer), Google Gemini API |
| **Event Streaming** | Apache Kafka (Confluent), Kafka-Python, WebSockets |
| **Vector Store** | ChromaDB (Semantic Search & RAG) |
| **Database** | PostgreSQL + PostGIS (Geospatial Data) |
| **Caching** | Redis |
| **Containerization** | Docker, Docker Compose |
| **Visualizations** | Mapbox GL JS, Recharts, D3.js |
| **State Management** | Zustand |

---

## 🧠 Architecture — 6 AI Agents
RailMind utilizes a **Master Supervisor** that routes streaming Kafka telemetry through 6 specialized AI agents running in parallel. Each agent assesses risk and assigns a **Track Health Index (0-100)** to railway segments dynamically.

| # | Agent | Role | Technology |
|---|---|---|---|
| **A1** | **Acoustic Guard** | Processes track-side audio feeds to detect micro-cracks and wheel-flats | Swin Transformer + CNN |
| **A2** | **Weather Intel** | Correlates track stress with severe weather patterns (heat buckling, floods) | OpenWeather API Fusion |
| **A3** | **Routing Engine** | Dynamically reroutes trains away from high-risk or failing track segments | GNN (Graph Neural Networks) |
| **A4** | **Maintenance Dispatch** | Automatically schedules and dispatches repair crews based on degradation predictions | Predictive Analytics |
| **A5** | **Passenger Comms** | Generates real-time delay notifications and safety alerts | ElevenLabs Voice + NLP |
| **A6** | **Supervisor Brain** | The Master Orchestrator. Computes final risk scores and executes Red Alerts | Google Gemini API (LangGraph) |

**Decision Engine Matrix:**
*   **Health Index < 40:** `RED ALERT` → Instant auto-reroute, halt approaching trains, dispatch crew.
*   **Health Index 40-70:** `MONITOR` → Increase telemetry polling rate, schedule weekend inspection.
*   **Health Index > 70:** `PASS` → Safe operations.

---

## 🛠️ How to Run Locally (Quick Start)

### Prerequisites
* Docker & Docker Compose
* Node.js v20+
* Python 3.12+

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YourUsername/RailMind.git
cd RailMind

# 2. Start the Backend Infrastructure (Postgres, Kafka, Redis, ChromaDB, FastAPI)
cd backend
docker-compose up -d --build

# 3. Start the Live Telemetry Simulator (streams synthetic train GPS & acoustic data to Kafka)
python -m scripts.enhanced_simulator

# 4. Start the Frontend Dashboard
cd ../frontend
npm install
npm run dev
```
* **Frontend:** `http://localhost:3000`
* **Backend Docs:** `http://localhost:8000/docs`

---

## 🔑 Environment Variables

Create a `.env` file inside the `backend/` directory:
```env
DATABASE_URL=postgresql+asyncpg://railnerv:railnerv@postgres:5432/railnerv
REDIS_URL=redis://redis:6379
CHROMA_HOST=chromadb
CHROMA_PORT=8000
KAFKA_BROKER_URL=kafka:29092
GEMINI_API_KEY=your_google_gemini_api_key
OPENWEATHER_API_KEY=your_openweather_key
```

Create a `.env.local` file inside the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

---

## 📂 Project Structure

```text
RailMind/
├── frontend/                        # Next.js Frontend Dashboard (React 18)
│   ├── app/                         # App router pages (alerts, trains, health)
│   ├── components/                  # UI Components (Mapbox, KPI Cards, Graphs)
│   ├── public/                      # Static assets & Logo
│   ├── stores/                      # Zustand state management
│   ├── tailwind.config.ts           
│   └── package.json                 
│
├── backend/                         # FastAPI Backend & Event Streaming
│   ├── gateway/                     # Main API entry points & WebSockets
│   ├── services/                    # 6 AI Fraud/Safety Agents logic
│   ├── ml/                          # PyTorch models, Swin Transformer weights
│   ├── scripts/                     # Kafka telemetry simulators & Data seeders
│   ├── infra/                       # Nginx configs
│   ├── docker-compose.yml           # Full infrastructure orchestration
│   ├── requirements.txt             
│   └── alembic/                     # Database migrations
│
└── docs/                            # Architecture diagrams and PRD
```

---

## 📊 Dataset & Machine Learning Models

Due to the lack of publicly available Indian Railway acoustic defect data, **all data is 100% synthetic**, generated by our custom telemetry simulators. The dataset simulates:
*   Thousands of real-time GPS coordinates for active trains.
*   Acoustic signatures matching standard operating frequencies vs. fault frequencies (micro-cracks).
*   Live weather overlays and historical track health degradation over time.

**Model:** Custom-trained **Swin Transformer** (Vision Transformer applied to Audio Spectrograms).
> **Note:** Due to GitHub's 100MB file size limit, the heavy pre-trained model weights (`acoustic_demo.pth`) are hosted externally. [Insert Google Drive Link Here]

### Model Performance (on Synthetic Test Set)
| Model | Metric | Score |
|---|---|---|
| **Swin Transformer (Acoustic Guard)** | Precision | 0.94 |
| | Recall | 0.91 |
| | F1-Score | 0.92 |
| **GNN (Routing Engine)** | Pathfinding Latency | < 50ms |
| **Agent Pipeline** | Total Inference Latency | 150–300ms per event |

---

## ✨ Key Features
* 🔴 **Real-Time Anomaly Detection** — Live Kafka streaming with WebSocket push to the Mapbox dashboard.
* 🧠 **6 Parallel AI Agents** — Swarm intelligence orchestrating everything from acoustic analysis to weather fusion.
* 📊 **Unified Track Health Index** — Weighted composite score determining track safety dynamically.
* 🕸️ **Interactive Geographic Tracking** — Mapbox GL JS visualization of active trains and track segments.
* ⚡ **Redis Fast-Cache** — Millisecond caching for high-frequency telemetry updates.
* 📡 **Supabase/PostGIS Logging** — All high-risk events and geospatial data recorded securely.

---

## ⚠️ Known Limitations
* Trained on synthetic acoustic data; real track-side recording deployments would be required for production fine-tuning.
* Real-time high-throughput streaming with multiple deep learning agents places high CPU/Memory demand on the host infrastructure.
* The Routing Engine currently uses a simplified graph matrix; full IRCTC/CRIS network topology would improve routing accuracy.

---

## 👥 Team
| Name | Contribution |
|---|---|
| **Govind Chudari** | React frontend dashboard, network graph visualizations, UI/UX design |
| **Parth Dehare** | DevOps, Complete Pipelining, Full-stack architecture & deployment |
| **Prasanna Dhotarkar** | ML Engineer, AI agents development, Swin Transformer training |

### Contact
* **Team Name:** RailMind
* **Hackathon:** FAR AWAY Hackathon 2026 — Railway Theme

