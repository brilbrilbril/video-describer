import { useRef, useState } from 'react';
import './LandingPage.css';

const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

export default function LandingPage({ onFile }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Only video files are accepted.');
      return;
    }
    setError(null);
    onFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="landing">
      <div className="landing__grid-bg" />

      <div className="landing__header">
        <div className="landing__tag">
          <span className="landing__tag-dot" />
          AI Frame Describer
        </div>
        <h1 className="landing__title">
          Understand your video,<br />
          <span>frame by frame</span>
        </h1>
        <p className="landing__subtitle">
          Upload a clip and receive AI-generated descriptions for each frame at your chosen interval.
        </p>
      </div>

      <div
        className={`landing__dropzone${dragOver ? ' landing__dropzone--drag' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        aria-label="Upload video"
      >
        <div className="landing__dropzone-icon">
          <UploadIcon />
        </div>
        <p className="landing__dropzone-title">Drop your video here</p>
        <p className="landing__dropzone-hint">or click to browse files</p>

        <div className="landing__formats">
          {['MP4', 'MOV', 'AVI', 'WebM', 'MKV'].map((f) => (
            <span key={f} className="landing__format-badge">{f}</span>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {error && (
        <p className="landing__error">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12" stroke="var(--bg-base)" strokeWidth="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="var(--bg-base)" strokeWidth="2"/></svg>
          {error}
        </p>
      )}
    </div>
  );
}
