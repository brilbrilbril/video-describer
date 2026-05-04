from dataclasses import dataclass

@dataclass
class FrameJob:
    frame_number: int
    timestamps: float
    frame_b64_string: str
    task_id: str = None
    