import { useState, useRef, useCallback } from 'react';

const BASE_URL = 'http://localhost:8000';

export function useVideoDescriber() {
  const [frames, setFrames] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const eventSourceRef = useRef(null);

  const reset = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setFrames([]);
    setStatus('idle');
    setError(null);
    setJobId(null);
  }, []);

  const run = useCallback(async (videoFile, interval) => {
    if (!videoFile) return;

    reset();
    setStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('interval', interval);

      const res = await fetch(`${BASE_URL}/describe`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed (${res.status}): ${res.statusText}`);

      const data = await res.json();

      // extract task_ids from jobs array and join as comma-separated string
      const taskIds = data.jobs.map((j) => j.task_id).join(',');
      setJobId(taskIds);

      // pre-populate frames immediately in order using the job metadata
      setFrames(
        data.jobs.map((j) => ({
          id: j.task_id,
          frameNumber: j.frame_number,
          timestamp: j.timestamp,
          description: '',
          isStreaming: true,
        }))
      );

      setStatus('streaming');

      const es = new EventSource(`${BASE_URL}/stream?task_ids=${taskIds}`);
      eventSourceRef.current = es;

      const totalFrames = data.jobs.length;
      const completedSet = new Set();

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);

          if (parsed.type === 'token') {
            setFrames((prev) =>
              prev.map((f) =>
                f.frameNumber === parsed.frame_number
                  ? { ...f, description: f.description + parsed.token }
                  : f
              )
            );
          } else if (parsed.type === 'timings') {
            setFrames((prev) =>
              prev.map((f) =>
                f.frameNumber === parsed.frame_number
                  ? { ...f, timings: {
                      promptTokens: parsed.prompt_tokens,
                      generatedTokens: parsed.generated_tokens,
                      speed: parsed.token_speed_per_second,
                    }}
                  : f
              )
            );
          } else if (parsed.type === 'done') {
            // deduplicate: backend sends done twice per frame
            if (completedSet.has(parsed.frame_number)) return;
            completedSet.add(parsed.frame_number);

            setFrames((prev) =>
              prev.map((f) =>
                f.frameNumber === parsed.frame_number
                  ? { ...f, isStreaming: false }
                  : f
              )
            );

            if (completedSet.size >= totalFrames) {
              setStatus('done');
              es.close();
              eventSourceRef.current = null;
            }
          }
          // ignore 'timings' and other unknown types
        } catch {
          // malformed event, skip
        }
      };

      es.onerror = () => {
        setFrames((prev) => prev.map((f) => ({ ...f, isStreaming: false })));
        setStatus('done');
        es.close();
        eventSourceRef.current = null;
      };
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [reset]);

  const completedCount = frames.filter((f) => !f.isStreaming).length;
  const totalCount = frames.length;
  const isActive = status === 'uploading' || status === 'streaming';

  return {
    frames,
    status,
    error,
    jobId,
    run,
    reset,
    completedCount,
    totalCount,
    isActive,
  };
}