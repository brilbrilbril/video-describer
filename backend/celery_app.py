from celery import Celery
from config import settings

app = Celery(
    'video_describer',
    broker=settings.celery_redis_broker,
    backend=settings.celery_redis_backend,
    include=["tasks"]
)