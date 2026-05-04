"""
Celery task definitions — composition root for the worker process.

This is the only place that imports both core use cases AND concrete adapters
and wires them together. The core never sees adapter imports.
"""

from celery_app import app
from core.entities import FrameJob
from core.use_cases import DescribeFrameUseCase
from adapters.llm_client import OpenAILLMClient
from adapters.queue_publisher import RedisStreamPublisher
from config import settings


@app.task
def describe_frame(
    previous_description: str | None,
    task_id: str,
    frame_number: int,
    timestamp: float,
    frame_b64: str,
) -> str:
    print(f"[Task] Started frame {frame_number}")

    job = FrameJob(
        task_id=task_id,
        frame_number=frame_number,
        timestamps=timestamp,
        frame_b64_string=frame_b64,
    )

    use_case = DescribeFrameUseCase(
        llm_client=OpenAILLMClient(api_key=settings.api_key),
        publisher=RedisStreamPublisher(),
    )

    return use_case.execute(job=job, previous_description=previous_description)