import React from 'react';
import { Shield, Cpu } from 'lucide-react';

/**
 * Full-screen overlay shown while the COCO-SSD model loads.
 * Displays animated progress bar with percentage and branding.
 */
export default function ModelLoadingOverlay({ progress, visible }) {
  if (!visible) return null;

  const displayProgress = Math.round(progress);

  return (
    <div className={`model-loading-overlay ${!visible ? 'fade-out' : ''}`}>
      {/* Background glow effects */}
      <div className="model-loading-glow model-loading-glow-1" />
      <div className="model-loading-glow model-loading-glow-2" />

      {/* Grid pattern */}
      <div className="model-loading-grid" />

      <div className="model-loading-content">
        {/* Logo */}
        <div className="model-loading-logo">
          <div className="model-loading-icon-ring">
            <Cpu className="model-loading-icon" />
          </div>
        </div>

        {/* Title */}
        <h2 className="model-loading-title">
          <span className="gradient-text">Loading AI Model</span>
        </h2>
        <p className="model-loading-subtitle">
          Initializing COCO-SSD Object Detection
        </p>

        {/* Progress Bar */}
        <div className="model-loading-progress-container">
          <div className="model-loading-progress-track">
            <div
              className="model-loading-progress-fill"
              style={{ width: `${displayProgress}%` }}
            />
            <div
              className="model-loading-progress-glow"
              style={{ left: `${displayProgress}%` }}
            />
          </div>
          <div className="model-loading-progress-info">
            <span className="model-loading-progress-text">
              {displayProgress < 100 ? 'Loading AI Model...' : 'Model Ready!'}
            </span>
            <span className="model-loading-progress-percent">
              {displayProgress}%
            </span>
          </div>
        </div>

        {/* TensorFlow.js Badge */}
        <div className="model-loading-badge">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" style={{ marginRight: 6 }}>
            <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="#FF6F00" opacity="0.8"/>
            <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12V2z" fill="#FFA726" opacity="0.6"/>
          </svg>
          <span>Powered by TensorFlow.js</span>
        </div>

        {/* Loading dots */}
        <div className="model-loading-dots">
          <span className="model-loading-dot" style={{ animationDelay: '0s' }} />
          <span className="model-loading-dot" style={{ animationDelay: '0.15s' }} />
          <span className="model-loading-dot" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  );
}
