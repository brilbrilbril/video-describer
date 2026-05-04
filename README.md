# Video Frame Describer Backend

A backend service that extracts frames from an uploaded video at a configurable interval, then describes each frame using an LLM (via an OpenAI-compatible endpoint). Descriptions are streamed back to the client in real time via Server-Sent Events (SSE).

**Stack:** FastAPI · Celery · Redis · OpenCV · OpenAI-compatible LLM (llama-server / OpenAI)

---

## Prerequisites

- Python 3.11+
- Redis (running locally or via Docker)
- *An OpenAI-compatible LLM endpoint (e.g. llama-server, OpenAI API)* **

** Make sure you are running the LLM endpoint, even through APIs, as long as it's compatible with OpenAI SDK
---

## Installation

**1. Clone the repo**

```bash
git clone https://github.com/brilbrilbril/video-describer.git
cd backend
```

**2. Create and activate a virtual environment**

```bash
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
.venv\Scripts\activate         # Windows
```

**3. Install dependencies**

```bash
pip install -r requirements.txt
```

**4. Configure environment variables**

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

`.env` reference:

```env
# LLM endpoint (llama-server or OpenAI)
LLAMA_SERVER_URL=http://localhost:8080/v1
MODEL_NAME=your-model-name
API_KEY=your-api-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Celery (uses Redis as broker and backend)
CELERY_REDIS_BROKER=redis://localhost:6379/1
CELERY_REDIS_BACKEND=redis://localhost:6379/2
```

---

## Running

You need three processes running simultaneously: Redis, the FastAPI server, and the Celery worker.

**1. Start Redis**

```bash
# If using Docker
docker run -d -p 6379:6379 redis
```

**2. Start the Celery worker**

```bash
celery -A celery_app worker --loglevel=info
```

**3. Start the FastAPI server**

```bash
uvicorn main:app --reload --port 8000
```

---

## Usage

**Upload a video for processing**

```bash
curl -X POST http://localhost:8000/describe \
  -F "file=@/path/to/video.mp4" \
  -F "interval=2"
```

`interval` is the number of seconds between sampled frames.

Response:

```json
{
  "status": "queued",
  "jobs": [
    { "task_id": "abc-123", "frame_number": 0, "timestamp": 0.0 },
    { "task_id": "def-456", "frame_number": 60, "timestamp": 2.0 }
  ]
}
```

**Stream the results**

Take the `task_id` values from the response and pass them as a comma-separated list:

```bash
curl -N "http://localhost:8000/stream?task_ids=abc-123,def-456"
```

SSE event types:

| Type | Description |
|------|-------------|
| `token` | A streamed token from the LLM |
| `timings` | Token speed and count for the frame |
| `done` | Frame description complete |

---

## Project Structure

```
backend/
  core/
    entities.py          # FrameJob dataclass
    ports.py             # Port interfaces (ABCs)
    use_cases.py         # DescribeFrameUseCase
  adapters/              # Driven adapters (implement ports)
    llm_client.py        # OpenAILLMClient
    queue_publisher.py   # RedisStreamPublisher, CeleryJobQueue
    video_reader.py      # CV2VideoReader
  entrypoints/           # Driving adapters (call the core)
    http/main.py         # FastAPI routes
    worker/tasks.py      # Celery task definitions
  celery_app.py
  config.py
```

# FrameDescribe

A React frontend for AI-powered video frame description. Upload a video, set a frame interval, and get streaming AI-generated descriptions for each frame.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- Your FastAPI backend running on `http://localhost:8000`

---

## Installation

**1. Clone the repo and navigate to the frontend**

```bash
git clone https://github.com/brilbrilbril/video-describer.git
cd frontend
```

**2. Install dependencies**

```bash
npm install
npm install react-markdown
```

---

## Running

**Start the frontend**

```bash
npm run dev
```

Opens at `http://localhost:5173`.

---

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx                          # Phase router + shared state
│   ├── index.css                        # Global design tokens and base styles
│   ├── hooks/
│   │   └── useVideoDescriber.js         # All API and SSE streaming logic
│   └── components/
│       ├── LandingPage/
│       │   ├── LandingPage.jsx          # Drag-and-drop upload zone
│       │   └── LandingPage.css
│       ├── WorkspacePage/
│       │   ├── WorkspacePage.jsx        # Topbar + two-column layout
│       │   └── WorkspacePage.css
│       ├── VideoPanel/
│       │   ├── VideoPanel.jsx           # Video player, interval slider, controls
│       │   └── VideoPanel.css
│       └── ResultsPanel/
│           ├── ResultsPanel.jsx         # Streaming frame cards with markdown
│           └── ResultsPanel.css
├── index.html
├── package.json
└── vite.config.js
```