import base64
from typing import Iterator

import cv2

from core.entities import FrameJob
from core.ports import VideoReaderPort


class CV2VideoReader(VideoReaderPort):
    def __init__(self, video_path: str, interval: int = 2):
        self._path = video_path
        self._interval = interval

    def read_frames(self) -> Iterator[FrameJob]:
        cap = cv2.VideoCapture(self._path)

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        step = int(self._interval * fps)

        for frame_number in range(0, total_frames, step):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            ret, frame = cap.read()

            if not ret:
                continue

            _, buffer = cv2.imencode(".jpg", frame)
            b64_frame = base64.b64encode(buffer).decode("utf-8")

            yield FrameJob(
                frame_number=frame_number,
                timestamps=frame_number / fps,
                frame_b64_string=b64_frame,
            )

        cap.release()