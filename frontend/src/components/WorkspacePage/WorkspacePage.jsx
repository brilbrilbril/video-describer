import VideoPanel from '../VideoPanel/VideoPanel';
import ResultsPanel from '../ResultsPanel/ResultsPanel';
import './WorkspacePage.css';

const SpinnerIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

function StatusPill({ status }) {
  const map = {
    idle: { label: 'Ready', cls: 'idle' },
    uploading: { label: 'Uploading', cls: 'streaming' },
    streaming: { label: 'Streaming', cls: 'streaming' },
    done: { label: 'Complete', cls: 'done' },
    error: { label: 'Error', cls: 'idle' },
  };
  const { label, cls } = map[status] ?? map.idle;
  const isActive = status === 'uploading' || status === 'streaming';

  return (
    <span className={`workspace__status-pill workspace__status-pill--${cls}`}>
      {isActive ? (
        <SpinnerIcon />
      ) : (
        <span className={`workspace__status-dot${isActive ? ' workspace__status-dot--streaming' : ''}`} />
      )}
      {label}
    </span>
  );
}

export default function WorkspacePage({
  videoFile,
  videoUrl,
  interval,
  onIntervalChange,
  onRun,
  onReset,
  status,
  error,
  frames,
  completedCount,
  totalCount,
  isActive,
  jobId,
}) {
  return (
    <div className="workspace">
      <header className="workspace__topbar">
        <div className="workspace__logo">
          <span className="workspace__logo-dot" />
          FrameDescribe
        </div>
        <div className="workspace__topbar-right">
          {jobId && (
            <span className="workspace__job-id">job/{jobId}</span>
          )}
          <StatusPill status={status} />
        </div>
      </header>

      <main className="workspace__body">
        <div className="workspace__left">
          <VideoPanel
            videoFile={videoFile}
            videoUrl={videoUrl}
            interval={interval}
            onIntervalChange={onIntervalChange}
            onRun={onRun}
            onReset={onReset}
            status={status}
            error={error}
            completedCount={completedCount}
            totalCount={totalCount}
            isActive={isActive}
          />
        </div>

        <div className="workspace__right">
          <ResultsPanel frames={frames} status={status} />
        </div>
      </main>
    </div>
  );
}
