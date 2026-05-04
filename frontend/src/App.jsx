import { useState, useRef, useEffect } from 'react';
import './index.css';
import LandingPage from './components/LandingPage/LandingPage';
import WorkspacePage from './components/WorkspacePage/WorkspacePage';
import { useVideoDescriber } from './hooks/useVideoDescriber';

export default function App() {
  const [phase, setPhase] = useState('landing'); // 'landing' | 'workspace'
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [interval, setInterval_] = useState(5);
  const prevVideoUrl = useRef(null);

  const {
    frames,
    status,
    error,
    jobId,
    run,
    reset: resetDescriber,
    completedCount,
    totalCount,
    isActive,
  } = useVideoDescriber();

  useEffect(() => {
    return () => {
      if (prevVideoUrl.current) URL.revokeObjectURL(prevVideoUrl.current);
    };
  }, []);

  const handleFile = (file) => {
    if (prevVideoUrl.current) URL.revokeObjectURL(prevVideoUrl.current);
    const url = URL.createObjectURL(file);
    prevVideoUrl.current = url;
    setVideoFile(file);
    setVideoUrl(url);
    setPhase('workspace');
  };

  const handleReset = () => {
    resetDescriber();
    if (prevVideoUrl.current) {
      URL.revokeObjectURL(prevVideoUrl.current);
      prevVideoUrl.current = null;
    }
    setVideoFile(null);
    setVideoUrl(null);
    setPhase('landing');
  };

  const handleRun = () => {
    run(videoFile, interval);
  };

  if (phase === 'landing') {
    return <LandingPage onFile={handleFile} />;
  }

  return (
    <WorkspacePage
      videoFile={videoFile}
      videoUrl={videoUrl}
      interval={interval}
      onIntervalChange={setInterval_}
      onRun={handleRun}
      onReset={handleReset}
      status={status}
      error={error}
      frames={frames}
      completedCount={completedCount}
      totalCount={totalCount}
      isActive={isActive}
      jobId={jobId}
    />
  );
}
