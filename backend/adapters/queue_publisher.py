import json

import redis

from config import settings
from core.entities import FrameJob
from core.ports import JobQueuePort, StreamPublisherPort


class CeleryJobQueue(JobQueuePort):
    def publish_all(self, jobs: list[FrameJob]) -> None:
        from celery import chain
        from tasks import describe_frame

        task_signatures = [
            describe_frame.s(
                job.task_id,
                job.frame_number,
                job.timestamps,
                job.frame_b64_string,
            )
            for job in jobs
        ]
        chain(*task_signatures).delay(None)


class RedisStreamPublisher(StreamPublisherPort):
    def __init__(self):
        self._r = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db,
        )

    def _channel(self, job: FrameJob) -> str:
        return f"stream:{job.task_id}"

    def publish_token(self, job: FrameJob, token: str) -> None:
        self._r.publish(
            self._channel(job),
            json.dumps(
                {"type": "token", "frame_number": job.frame_number, "token": token}
            ),
        )

    def publish_timings(self, job: FrameJob, timings: dict) -> None:
        self._r.publish(
            self._channel(job),
            json.dumps(
                {"type": "timings", "frame_number": job.frame_number, **timings}
            ),
        )

    def publish_done(self, job: FrameJob) -> None:
        self._r.publish(
            self._channel(job),
            json.dumps({"type": "done", "frame_number": job.frame_number}),
        )