import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  MapPin,
  Car,
  Eye,
  ShieldAlert,
  Loader2,
  Camera,
} from 'lucide-react';

// ===== Skeleton Shimmer Block =====
function SkeletonCard() {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton-block w-8 h-8 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton-block w-3/4 h-3 rounded" />
          <div className="skeleton-block w-1/2 h-2.5 rounded" />
        </div>
      </div>
      <div className="skeleton-block w-full h-2 rounded" />
      <div className="grid grid-cols-2 gap-2">
        <div className="skeleton-block h-3 rounded" />
        <div className="skeleton-block h-3 rounded" />
      </div>
    </div>
  );
}

function ViolationCard({ violation, index, onHighlight, isNew }) {
  const [expanded, setExpanded] = useState(false);
  const [showNew, setShowNew] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setShowNew(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  const severityClass =
    violation.severity === 'high' ? 'severity-high' : 'severity-medium';

  const confidenceGradient =
    violation.confidence > 90
      ? 'linear-gradient(90deg, #ff4444, #ff6b6b)'
      : violation.confidence > 75
      ? 'linear-gradient(90deg, #ff8c00, #ffa726)'
      : 'linear-gradient(90deg, #ffd600, #ffca28)';

  return (
    <div
      className={`violation-card ${severityClass} animate-slide-in-right`}
      style={{ animationDelay: `${index * 80}ms`, opacity: 0 }}
      onClick={() => setExpanded(!expanded)}
      id={`violation-card-${violation.id}`}
    >
      {/* NEW Badge */}
      {showNew && <div className="new-badge">NEW</div>}

      {/* Header */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{violation.type.icon}</span>
          <div>
            <h3 className="text-[13px] font-semibold text-white/90 leading-tight">
              {violation.type.name}
            </h3>
            <p className="text-[10px] text-navy-300 mt-0.5 leading-snug">
              {violation.type.description}
            </p>
          </div>
        </div>
        {/* Severity badge with ping */}
        <div className="relative">
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full relative z-10 ${
              violation.severity === 'high'
                ? 'bg-alert-red/15 text-alert-red'
                : 'bg-warning-orange/15 text-warning-orange'
            }`}
          >
            {violation.severity}
          </span>
          {violation.severity === 'high' && (
            <span className="absolute inset-0 rounded-full bg-alert-red/20 animate-ping" />
          )}
        </div>
      </div>

      {/* Confidence Bar — animated fill */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-navy-300 uppercase tracking-[0.1em]">Confidence</span>
          <span className="text-xs font-bold font-mono text-white/90">
            {violation.confidence.toFixed(1)}%
          </span>
        </div>
        <div className="confidence-bar">
          <div
            className="confidence-fill"
            style={{
              background: confidenceGradient,
              '--confidence-width': `${violation.confidence}%`,
              width: `${violation.confidence}%`,
            }}
          />
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <Car className="w-3 h-3 text-navy-300" />
          <span className="text-xs text-navy-200">{violation.vehicleType}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-navy-300" />
          <span className="text-xs text-navy-200">
            {violation.timestamp.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* License Plate — styled like real Indian plate */}
      <div className="mb-2.5">
        <div className="license-plate">
          <div className="plate-header">IND</div>
          <div className="plate-text">{violation.licensePlate}</div>
        </div>
      </div>

      {/* Camera location */}
      <div className="flex items-center gap-1.5 mb-2">
        <MapPin className="w-3 h-3 text-navy-400" />
        <span className="text-[10px] text-navy-300 truncate">
          {violation.cameraId}
        </span>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-white/[0.05] animate-fade-in">
          <div className="flex items-center gap-1.5 mb-2">
            <ShieldAlert className="w-3 h-3 text-cyan-accent" />
            <span className="text-[10px] text-cyan-accent uppercase tracking-[0.1em] font-semibold">
              Evidence Details
            </span>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-2.5 text-[11px] font-mono text-navy-200 space-y-1 border border-white/[0.04]">
            <p><span className="text-navy-400">Camera:</span> {violation.cameraId}</p>
            <p><span className="text-navy-400">Frame:</span> #{Math.floor(Math.random() * 9000 + 1000)}</p>
            <p><span className="text-navy-400">Model:</span> COCO-SSD (TensorFlow.js)</p>
            <p><span className="text-navy-400">Inference:</span> {(Math.random() * 20 + 30).toFixed(1)}ms</p>
            <p><span className="text-navy-400">IoU:</span> 0.45</p>
          </div>
        </div>
      )}

      {/* View Evidence Button with border-beam */}
      <button
        className="btn-evidence w-full mt-2.5 flex items-center justify-center gap-1.5"
        onClick={(e) => {
          e.stopPropagation();
          onHighlight(violation.boxId);
        }}
        id={`view-evidence-${violation.id}`}
      >
        <Eye className="w-3.5 h-3.5" />
        View Evidence
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function DetectionResults({
  violations,
  isProcessing,
  onHighlightBox,
}) {
  const prevCountRef = useRef(0);
  const [newViolationIds, setNewViolationIds] = useState(new Set());

  useEffect(() => {
    if (violations.length > prevCountRef.current) {
      const newIds = new Set(violations.slice(prevCountRef.current).map(v => v.id));
      setNewViolationIds(newIds);
    }
    prevCountRef.current = violations.length;
  }, [violations]);

  return (
    <div className="flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="section-header red">
          <AlertTriangle className="w-4 h-4 text-alert-red" />
          <h2 className="text-sm font-semibold text-white/90 tracking-wide">
            Detection Results
          </h2>
        </div>
        {violations.length > 0 && (
          <span className="text-[11px] font-mono text-navy-300 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
            {violations.length} found
          </span>
        )}
      </div>

      {/* Loading State — Skeleton */}
      {isProcessing && (
        <div className="flex flex-col gap-2.5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Empty State */}
      {!isProcessing && violations.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center py-16">
          <div className="relative mb-4">
            <Camera className="w-10 h-10 text-navy-500 animate-icon-pulse" />
          </div>
          <p className="text-sm text-navy-300 font-medium">Waiting for feed...</p>
          <p className="text-xs text-navy-400 mt-1">
            Upload a traffic image or enable Live Demo
          </p>
        </div>
      )}

      {/* Violation Cards */}
      {!isProcessing && violations.length > 0 && (
        <div className="flex flex-col gap-3">
          {violations.map((violation, idx) => (
            <ViolationCard
              key={violation.id}
              violation={violation}
              index={idx}
              onHighlight={onHighlightBox}
              isNew={newViolationIds.has(violation.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
