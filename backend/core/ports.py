from abc import ABC, abstractmethod
from typing import Generator, Iterator
 
from core.entities import FrameJob

class LLMClientPort(ABC):
 
    @abstractmethod
    def describe_stream(
        self, frame_b64: str, prompt: str
    ) -> Generator[dict, None, None]:
        """
        Yields dicts of shape:
            {"type": "token",   "value": str}
            {"type": "timings", "prompt_tokens": int,
                                "generated_tokens": int,
                                "token_speed_per_second": float}
        """
        ...
        
class StreamPublisherPort(ABC):
 
    @abstractmethod
    def publish_token(self, job: FrameJob, token: str) -> None: 
        ...
 
    @abstractmethod
    def publish_timings(self, job: FrameJob, timings: dict) -> None: 
        ...
 
    @abstractmethod
    def publish_done(self, job: FrameJob) -> None: 
        ...
        
class JobQueuePort(ABC):
 
    @abstractmethod
    def publish_all(self, jobs: list[FrameJob]) -> None: 
        ...
 
 
class VideoReaderPort(ABC):
 
    @abstractmethod
    def read_frames(self) -> Iterator[FrameJob]: 
        ...