import './VideoPanel.css';

const VideoFileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VideoPanel({
  videoFile,
  videoUrl,
  interval,
  onIntervalChange,
  onRun,
  onReset,
  status,
  error,
  completedCount,
  totalCount,
  isActive,
}) {
  const isStreaming = status === 'streaming';
  const isDone = status === 'done';
  const showStats = isStreaming || isDone || totalCount > 0;

  return (
    <div className="video-panel">
      <div className="video-panel__player-wrap">
        <video src={videoUrl} controls />
      </div>

      <div className="video-panel__settings">
        <div className="video-panel__file-info">
          <div className="video-panel__file-icon">
            <VideoFileIcon />
          </div>
          <span className="video-panel__file-name">{videoFile?.name}</span>
          <span className="video-panel__file-size">{formatBytes(videoFile?.size)}</span>
        </div>

        <div>
          <div className="video-panel__interval-label">
            <span>Frame interval</span>
            <span>
              <span className="video-panel__interval-value">{interval}</span>
              <span className="video-panel__interval-unit">sec</span>
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={interval}
            disabled={isActive}
            onChange={(e) => onIntervalChange(Number(e.target.value))}
          />
          <div className="video-panel__tick-row">
            <span>1s</span>
            <span>15s</span>
            <span>30s</span>
          </div>
        </div>

        <div className="video-panel__actions">
          <button
            className="video-panel__btn-run"
            disabled={isActive}
            onClick={onRun}
          >
            {status === 'uploading' ? (
              <><SpinnerIcon /> Uploading…</>
            ) : isStreaming ? (
              <><SpinnerIcon /> Processing…</>
            ) : isDone ? (
              <><PlayIcon /> Re-run</>
            ) : (
              <><PlayIcon /> Generate descriptions</>
            )}
          </button>
          <button className="video-panel__btn-reset" onClick={onReset}>
            ← New video
          </button>
        </div>

        {error && <p className="video-panel__error">{error}</p>}
      </div>

      {showStats && (
        <div className="video-panel__stats">
          <div className="video-panel__stat">
            <p className="video-panel__stat-label">Frames done</p>
            <p className="video-panel__stat-value">{completedCount}</p>
          </div>
          <div className="video-panel__stat">
            <p className="video-panel__stat-label">Status</p>
            <p className={`video-panel__stat-value${isStreaming ? ' video-panel__stat-value--streaming' : isDone ? ' video-panel__stat-value--done' : ''}`}>
              {isStreaming ? 'Streaming' : isDone ? 'Complete' : 'Ready'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
