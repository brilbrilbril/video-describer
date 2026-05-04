import asyncio
import json
import os
import shutil
import tempfile
import uuid

import redis
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from adapters.queue_publisher import CeleryJobQueue
from adapters.video_reader import CV2VideoReader
from config import settings
from core.ports import JobQueuePort, VideoReaderPort

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

job_queue: JobQueuePort = CeleryJobQueue()


@app.post("/describe")
async def describe_video(file: UploadFile = File(...), interval: int = Form(...)):
    print(f"INTERVAL: {interval}")

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
    except Exception as e:
        raise e

    jobs = []

    try:
        reader: VideoReaderPort = CV2VideoReader(tmp_path, interval=interval)

        for frame in reader.read_frames():
            frame.task_id = str(uuid.uuid4())
            jobs.append(frame)

    except Exception as e:
        print(f"Error reading frames: {e}")
        raise e
    finally:
        os.remove(tmp_path)

    job_queue.publish_all(jobs)

    return {
        "status": "queued",
        "jobs": [
            {
                "task_id": job.task_id,
                "frame_number": job.frame_number,
                "timestamp": job.timestamps,
            }
            for job in jobs
        ],
    }


@app.get("/stream")
async def stream_result(task_ids: str):
    ids = task_ids.split(",")

    async def event_generator():
        r = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db,
        )
        pubsub = r.pubsub()
        pubsub.subscribe(*[f"stream:{tid}" for tid in ids])

        done_count = 0
        total = len(ids)
        loop = asyncio.get_event_loop()

        while True:
            message = await loop.run_in_executor(
                None,
                lambda: pubsub.get_message(
                    ignore_subscribe_messages=True, timeout=1.0
                ),
            )

            if message is None:
                await asyncio.sleep(0.01)
                continue

            data = json.loads(message["data"])
            yield f"data: {json.dumps(data)}\n\n"

            if data["type"] == "done":
                done_count += 1
                if done_count == total:
                    break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )