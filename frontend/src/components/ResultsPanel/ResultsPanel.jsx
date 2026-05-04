import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './ResultsPanel.css';

const SpinnerIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IdleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

function formatTimestamp(ts) {
  if (ts == null) return null;
  const secs = Math.round(ts);
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function TimingsBar({ timings }) {
  if (!timings) return null;
  return (
    <div className="frame-card__timings">
      <span className="frame-card__timings-item">
        <span className="frame-card__timings-label">speed</span>
        <span className="frame-card__timings-value">{timings.speed.toFixed(1)} tok/s</span>
      </span>
      <span className="frame-card__timings-sep" />
      <span className="frame-card__timings-item">
        <span className="frame-card__timings-label">generated</span>
        <span className="frame-card__timings-value">{timings.generatedTokens} tok</span>
      </span>
      <span className="frame-card__timings-sep" />
      <span className="frame-card__timings-item">
        <span className="frame-card__timings-label">prompt</span>
        <span className="frame-card__timings-value">{timings.promptTokens} tok</span>
      </span>
    </div>
  );
}

function FrameCard({ frameNumber, timestamp, description, isStreaming, timings }) {
  return (
    <div className={`frame-card ${isStreaming ? 'frame-card--streaming' : 'frame-card--done'}`}>
      <div className="frame-card__meta">
        <div className="frame-card__left">
          <span className="frame-card__badge">Frame {frameNumber}</span>
          {timestamp != null && (
            <span className="frame-card__timestamp">{formatTimestamp(timestamp)}</span>
          )}
        </div>
        <div className={`frame-card__status ${isStreaming ? 'frame-card__status--streaming' : 'frame-card__status--done'}`}>
          {isStreaming ? <><SpinnerIcon /> generating</> : <><CheckIcon /> done</>}
        </div>
      </div>

      <TimingsBar timings={timings} />
      <div className="frame-card__markdown">
        {description ? (
          <>
            <ReactMarkdown>{description}</ReactMarkdown>
            {isStreaming && <span className="frame-card__cursor" />}
          </>
        ) : isStreaming ? (
          <span className="frame-card__placeholder">
            Waiting for tokens<span className="frame-card__cursor" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function ResultsPanel({ frames, status }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (frames.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [frames]);

  const isIdle = status === 'idle' || status === 'error';
  const isUploading = status === 'uploading';

  return (
    <div className="results-panel">
      <div className="results-panel__header">
        <h2 className="results-panel__title">Generated descriptions</h2>
        {frames.length > 0 && (
          <span className="results-panel__count">
            {frames.length} frame{frames.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {frames.length === 0 ? (
        <div className="results-panel__empty">
          <div className="results-panel__empty-icon">
            {isUploading ? <SpinnerIcon /> : <IdleIcon />}
          </div>
          <p className="results-panel__empty-label">
            {isUploading ? 'Uploading video…' : 'Hit "Generate descriptions" to begin.'}
          </p>
        </div>
      ) : (
        <>
          {frames.map((frame) => (
            <FrameCard
              key={frame.id}
              frameNumber={frame.frameNumber}
              timestamp={frame.timestamp}
              description={frame.description}
              isStreaming={frame.isStreaming}
              timings={frame.timings}
            />
          ))}
          <div ref={bottomRef} />
        </>
      )}
    </div>
  );
}