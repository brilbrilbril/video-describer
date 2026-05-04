from core.entities import FrameJob
from core.entities import FrameJob
from core.ports import LLMClientPort, StreamPublisherPort

class DescribeFrameUseCase:
    def __init__(self, llm_client: LLMClientPort, publisher: StreamPublisherPort):
        self._llm_client = llm_client
        self._publisher = publisher
 
    def execute(self, job: FrameJob, previous_description: str = None) -> str:
        if previous_description:
            prompt = (
                f"<Previous frame>: {previous_description}\n</Previous frame>\n\n"
                "Describe what is happening in this new frame in details."
            )
        else:
            prompt = "Describe this image in details."
 
        full_description = ""
 
        for event in self._llm_client.describe_stream(job.frame_b64_string, prompt=prompt):
            print(f"[Use case] Got event: {event}", flush=True)
 
            if event["type"] == "token":
                self._publisher.publish_token(job, event["value"])
                full_description += event["value"]
 
            elif event["type"] == "timings":
                print(f"[Use Case] publishing timings: {event}")
                self._publisher.publish_timings(job, event)
 
        self._publisher.publish_done(job)
 
        print(f"[Use Case] Done: {full_description[:50]}")
        return full_description