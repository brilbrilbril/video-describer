from typing import Generator

from openai import OpenAI

from config import settings
from core.ports import LLMClientPort


class OpenAILLMClient(LLMClientPort):
    def __init__(self, api_key: str, model: str = settings.model_name):
        self._client = OpenAI(base_url=settings.llama_server_url, api_key=api_key)
        self._model = model

    def describe_stream(
        self, frame_b64: str, prompt: str
    ) -> Generator[dict, None, None]:
        with self._client.chat.completions.create(
            model=self._model,
            messages=[
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "You are a helpful assistant that specialises in describing images. "
                                "You will be given an image and an optional previous description. "
                                "Your task is to describe the image in detail."
                            ),
                        }
                    ],
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{frame_b64}"},
                        },
                        {"type": "text", "text": prompt},
                    ],
                },
            ],
            extra_body={"chat_template_kwargs": {"enable_thinking": False}},
            stream=True,
            max_tokens=500,
            timeout=60.0,
        ) as stream:
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield {"type": "token", "value": chunk.choices[0].delta.content}

                if hasattr(chunk, "timings"):
                    t = chunk.timings
                    yield {
                        "type": "timings",
                        "prompt_tokens": t.get("prompt_n"),
                        "generated_tokens": t.get("predicted_n"),
                        "token_speed_per_second": t.get("predicted_per_second"),
                    }