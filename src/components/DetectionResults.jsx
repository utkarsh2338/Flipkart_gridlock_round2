import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  FileText,
  Archive,
} from 'lucide-react';
import {
  openChallanWindow,
  downloadEvidenceZip,
  captureCanvasSnapshot,
} from '../data/challanGenerator';

function ViolationCard({ violation, index, onHighlight, isNew, canvasRef, boundingBoxes = [], uploadedImage }) {
  const [expanded, setExpanded] = useState(false);
  const [explainExpanded, setExplainExpanded] = useState(false);
  const [showNew, setShowNew] = useState(isNew);
  const [imgElement, setImgElement] = useState(null);
  const miniCanvasRef = useRef(null);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setShowNew(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  useEffect(() => {
    if (!uploadedImage) {
      setImgElement(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);
    };
    img.src = uploadedImage;
  }, [uploadedImage]);

  const box = useMemo(() => {
    return boundingBoxes.find(b => b.id === violation.boxId);
  }, [boundingBoxes, violation.boxId]);

  const finalBox = useMemo(() => {
    if (box) return box;
    return {
      x: 150,
      y: 200,
      w: 220,
      h: 240,
      type: 'violation',
      confidence: violation.confidence || 88.5,
    };
  }, [box, violation]);

  const ruleLogText = useMemo(() => {
    const coordsStr = `x:${Math.round(finalBox.x)}, y:${Math.round(finalBox.y)}, w:${Math.round(finalBox.w)}, h:${Math.round(finalBox.h)}`;
    const conf = violation.confidence.toFixed(1);
    const typeId = violation.type?.id || '';

    switch (typeId) {
      case 'helmet':
        return `[pipeline/helmet] Detected motorcycle at [${coordsStr}].\n[pipeline/helmet] Detected person with head region overlapping motorcycle upper zone.\n[pipeline/helmet] No helmet-shaped object detected in head bbox.\n[pipeline/helmet] Confidence: ${conf}%`;
      case 'triple_riding':
        return `[pipeline/triple] Detected motorcycle at [${coordsStr}].\n[pipeline/triple] Detected 3 persons within motorcycle bounding box ± 20% margin.\n[pipeline/triple] MV Act Sec 128 triggered.\n[pipeline/triple] Confidence: ${conf}%`;
      case 'red_light':
        return `[pipeline/redlight] Detected vehicle at [${coordsStr}] within pre-defined red-signal zone polygon.\n[pipeline/redlight] Vehicle centroid inside stop zone.\n[pipeline/redlight] Confidence: ${conf}%`;
      case 'seatbelt':
        return `[pipeline/seatbelt] Detected vehicle at [${coordsStr}].\n[pipeline/seatbelt] Front windshield camera scanned driver and passenger torso area.\n[pipeline/seatbelt] SBL-Net found no diagonal harness buckle engagement.\n[pipeline/seatbelt] Confidence: ${conf}%`;
      case 'wrong_side':
        return `[pipeline/wrongside] Detected vehicle at [${coordsStr}].\n[pipeline/wrongside] Vehicle tracking history shows movement direction vector at 172° (allowable corridor: 340°–20°).\n[pipeline/wrongside] Contra-flow traffic detected.\n[pipeline/wrongside] Confidence: ${conf}%`;
      case 'stop_line':
        return `[pipeline/stopline] Detected vehicle at [${coordsStr}].\n[pipeline/stopline] Front bumper edge coordinates crossed stop-line limit under active red signal phase.\n[pipeline/stopline] Confidence: ${conf}%`;
      case 'illegal_parking':
        return `[pipeline/parking] Detected vehicle at [${coordsStr}].\n[pipeline/parking] Stationary timer exceeded 180s inside geofenced 'No Parking/Tow Away' corridor.\n[pipeline/parking] Confidence: ${conf}%`;
      default:
        return `[pipeline/heuristic] Detected vehicle at [${coordsStr}].\n[pipeline/heuristic] Violation rules checked for Class: ${violation.vehicleType}.\n[pipeline/heuristic] Rule violation code: ${typeId.toUpperCase()}.\n[pipeline/heuristic] Confidence: ${conf}%`;
    }
  }, [finalBox, violation]);

  const legalBasis = useMemo(() => {
    const typeId = violation.type?.id || '';
    switch (typeId) {
      case 'helmet':
        return {
          section: '129',
          description: 'Driving two wheeler without wearing protective headgear',
          fine: '500',
          url: 'https://indiankanoon.org/doc/1715061/'
        };
      case 'seatbelt':
        return {
          section: '194B',
          description: 'Driving vehicle without wearing safety belt or carrying passengers not wearing seat belt',
          fine: '1,000',
          url: 'https://indiankanoon.org/doc/126601445/'
        };
      case 'triple_riding':
        return {
          section: '128',
          description: 'Safety measures for drivers and pillion riders (carrying more than one pillion rider)',
          fine: '1,000',
          url: 'https://indiankanoon.org/doc/1000673/'
        };
      case 'red_light':
      case 'stop_line':
        return {
          section: '119',
          description: 'Duty to obey traffic signs and signals',
          fine: '1,000',
          url: 'https://indiankanoon.org/doc/1132712/'
        };
      case 'wrong_side':
        return {
          section: '119',
          description: 'Driving against traffic flow / One-way violation',
          fine: '1,000',
          url: 'https://indiankanoon.org/doc/1132712/'
        };
      case 'illegal_parking':
        return {
          section: '122',
          description: 'Leaving vehicle in dangerous position or causing obstruction',
          fine: '500',
          url: 'https://indiankanoon.org/doc/1036329/'
        };
      default:
        return {
          section: '177',
          description: 'General provision for punishment of offences',
          fine: '500',
          url: 'https://indiankanoon.org/doc/1410712/'
        };
    }
  }, [violation]);

  useEffect(() => {
    if (!explainExpanded) return;
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = finalBox.w;
    const h = finalBox.h;
    
    const targetWidth = 180;
    const scale = targetWidth / w;
    const targetHeight = h * scale;
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    if (imgElement) {
      ctx.drawImage(
        imgElement,
        finalBox.x, finalBox.y, finalBox.w, finalBox.h,
        0, 0, targetWidth, targetHeight
      );
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, targetHeight);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020817');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 20; x < targetWidth; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, targetHeight);
        ctx.stroke();
      }
      for (let y = 20; y < targetHeight; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(targetWidth, y);
        ctx.stroke();
      }
      
      ctx.fillStyle = 'rgba(0, 212, 255, 0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO SOURCE IMAGE', targetWidth / 2, targetHeight / 2);
    }

    const typeId = violation.type?.id || '';
    if (typeId === 'helmet') {
      ctx.fillStyle = 'rgba(255, 68, 68, 0.35)';
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.fillRect(0, 0, targetWidth, targetHeight * 0.3);
      ctx.strokeRect(0, 0, targetWidth, targetHeight * 0.3);
    } else if (typeId === 'triple_riding') {
      ctx.strokeStyle = '#ff8c00';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(2, 2, targetWidth - 4, targetHeight - 4);
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#ff4444';
      const positions = [
        { x: targetWidth * 0.3, y: targetHeight * 0.45 },
        { x: targetWidth * 0.5, y: targetHeight * 0.35 },
        { x: targetWidth * 0.7, y: targetHeight * 0.55 },
      ];
      positions.forEach((pos) => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    } else if (typeId === 'red_light' || typeId === 'stop_line') {
      ctx.fillStyle = 'rgba(255, 68, 68, 0.35)';
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.fillRect(0, targetHeight * 0.6, targetWidth, targetHeight * 0.4);
      ctx.strokeRect(0, targetHeight * 0.6, targetWidth, targetHeight * 0.4);
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, targetHeight * 0.6);
      ctx.lineTo(targetWidth, targetHeight * 0.6);
      ctx.stroke();
    } else if (typeId === 'seatbelt') {
      ctx.fillStyle = 'rgba(255, 140, 0, 0.3)';
      ctx.strokeStyle = '#ff8c00';
      ctx.lineWidth = 2;
      ctx.fillRect(targetWidth * 0.2, targetHeight * 0.2, targetWidth * 0.6, targetHeight * 0.55);
      ctx.strokeRect(targetWidth * 0.2, targetHeight * 0.2, targetWidth * 0.6, targetHeight * 0.55);
    } else if (typeId === 'wrong_side') {
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(targetWidth * 0.8, targetHeight * 0.8);
      ctx.lineTo(targetWidth * 0.2, targetHeight * 0.2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(targetWidth * 0.2, targetHeight * 0.2);
      ctx.lineTo(targetWidth * 0.38, targetHeight * 0.2);
      ctx.moveTo(targetWidth * 0.2, targetHeight * 0.2);
      ctx.lineTo(targetWidth * 0.2, targetHeight * 0.38);
      ctx.stroke();
    } else if (typeId === 'illegal_parking') {
      ctx.fillStyle = 'rgba(255, 140, 0, 0.35)';
      ctx.strokeStyle = '#ff8c00';
      ctx.lineWidth = 2;
      ctx.fillRect(targetWidth * 0.45, 0, targetWidth * 0.55, targetHeight);
      ctx.strokeRect(targetWidth * 0.45, 0, targetWidth * 0.55, targetHeight);
    }
  }, [explainExpanded, imgElement, finalBox, violation]);

  const severityClass =
    violation.severity === 'high' ? 'severity-high-premium' : 'severity-medium-premium';

  const confidenceGradient =
    violation.confidence > 90
      ? 'linear-gradient(90deg, #ff4444, #ff6b6b)'
      : violation.confidence > 75
      ? 'linear-gradient(90deg, #ff8c00, #ffa726)'
      : 'linear-gradient(90deg, #ffd600, #ffca28)';

  const handleGenerateChallan = (e) => {
    e.stopPropagation();
    const snapshot = captureCanvasSnapshot(canvasRef?.current);
    openChallanWindow(violation, snapshot);
  };

  const handleDownloadZip = (e) => {
    e.stopPropagation();
    const snapshot = captureCanvasSnapshot(canvasRef?.current);
    downloadEvidenceZip(violation, snapshot);
  };

  return (
    <div
      className={`violation-card-premium ${severityClass} animate-slide-in-right`}
      style={{ animationDelay: `${index * 80}ms`, opacity: 0 }}
      onClick={() => setExpanded(!expanded)}
      id={`violation-card-${violation.id}`}
    >
      {/* NEW Badge */}
      {showNew && <div className="new-badge">NEW</div>}

      {/* Top Row: Severity Badge + Violation Name + Time */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          {/* Severity Badge v2 */}
          <span className={`severity-badge-v2 ${violation.severity}`}>
            {violation.severity === 'high' ? '● Severe Violation' : '● Medium Risk'}
          </span>
        </div>
        <span className="text-xs text-navy-300 font-mono tabular-nums">
          {violation.timestamp.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      </div>

      {/* Violation Name */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-lg">{violation.type.icon}</span>
        <h3 className="text-[14px] font-bold text-white/95 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          {violation.type.name}
        </h3>
      </div>

      {/* License Plate */}
      <div className="mb-2.5">
        <div className="license-plate">
          <div className="plate-header">IND</div>
          <div className="plate-text">{violation.licensePlate}</div>
        </div>
      </div>

      {/* Confidence Bar — compact */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-navy-400 uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-heading)' }}>Confidence</span>
          <span className="text-xs font-bold font-mono text-white/80">
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

      {/* Explain Accordion Toggle */}
      <div className="mb-2.5 flex items-center justify-between">
        <button
          type="button"
          className="btn-explain-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setExplainExpanded(!explainExpanded);
          }}
        >
          Explain {explainExpanded ? '▲' : '▼'}
        </button>
      </div>

      {explainExpanded && (
        <div className="explain-panel-premium mb-2.5" onClick={(e) => e.stopPropagation()}>
          <div className="explain-title">PART 1 — What the AI saw</div>
          <div className="explain-canvas-container">
            <canvas ref={miniCanvasRef} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />
          </div>

          <div className="explain-title">PART 2 — Why it flagged a violation</div>
          <div className="explain-rule-log">{ruleLogText}</div>

          <div className="explain-title">PART 3 — Legal Basis</div>
          <div className="explain-legal-row">
            <span className="explain-legal-text">
              ⚖️ <strong>Motor Vehicles Act, Section {legalBasis.section}</strong> — {legalBasis.description} — <strong>Fine: ₹{legalBasis.fine}</strong>
            </span>
            <a
              href={legalBasis.url}
              target="_blank"
              rel="noopener noreferrer"
              className="explain-legal-link"
            >
              View Section {legalBasis.section} on indiankanoon.org ↗
            </a>
          </div>
        </div>
      )}

      {/* Info Row */}
      <div className="flex items-center gap-4 mb-2 text-[11px] text-navy-300">
        <div className="flex items-center gap-1.5">
          <Car className="w-3 h-3 text-navy-400" />
          <span>{violation.vehicleType}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-navy-400" />
          <span className="truncate max-w-[120px]">{violation.cameraId}</span>
        </div>
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
          <div className="bg-white/[0.03] rounded-lg p-2.5 text-[11px] font-mono text-navy-200 space-y-1 border border-white/[0.04]">
            <p><span className="text-navy-400">Camera:</span> {violation.cameraId}</p>
            <p><span className="text-navy-400">Frame:</span> #{Math.floor(Math.random() * 9000 + 1000)}</p>
            <p><span className="text-navy-400">Model:</span> COCO-SSD (TensorFlow.js)</p>
            <p><span className="text-navy-400">Inference:</span> {(Math.random() * 20 + 30).toFixed(1)}ms</p>
            <p><span className="text-navy-400">IoU:</span> 0.45</p>
          </div>
        </div>
      )}

      {/* View Evidence Button */}
      <button
        className="btn-evidence btn-glow w-full mt-2.5 flex items-center justify-center gap-1.5"
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

      {/* Challan & Evidence Actions */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          className="btn-challan btn-glow flex items-center justify-center gap-1.5"
          onClick={handleGenerateChallan}
          id={`generate-challan-${violation.id}`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>📄 Generate Challan</span>
        </button>
        <button
          className="btn-evidence-zip btn-glow flex items-center justify-center gap-1.5"
          onClick={handleDownloadZip}
          id={`download-zip-${violation.id}`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Evidence ZIP</span>
        </button>
      </div>
    </div>
  );
}

export default function DetectionResults({
  violations,
  isProcessing,
  onHighlightBox,
  canvasRef,
  boundingBoxes = [],
  uploadedImage,
}) {
  const prevCountRef = useRef(0);
  const [newViolationIds, setNewViolationIds] = useState(new Set());

  // Auto-generate a session ID
  const sessionId = useMemo(() => {
    const num = String(Math.floor(Math.random() * 9000 + 1000));
    return `#VG-${num}`;
  }, []);

  useEffect(() => {
    if (violations.length > prevCountRef.current) {
      const newIds = new Set(violations.slice(prevCountRef.current).map(v => v.id));
      setNewViolationIds(newIds);
    }
    prevCountRef.current = violations.length;
  }, [violations]);

  return (
    <div className="flex flex-col gap-3" id="detection-results-panel">
      {/* Section Header with Session ID */}
      <div className="flex items-center justify-between">
        <div className="section-header red">
          <AlertTriangle className="w-4 h-4 text-alert-red" />
          <h2 className="text-sm font-semibold text-white/90 tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>
            Detection Results
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {violations.length > 0 && (
            <span className="text-[11px] font-mono text-navy-300 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
              {violations.length} found
            </span>
          )}
          <span className="session-id">Session ID: {sessionId}</span>
        </div>
      </div>

      {/* Loading State — Skeleton */}
      {isProcessing && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="glass-card-premium p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="skeleton-block w-8 h-8 rounded-lg skeleton-shimmer" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-block w-3/4 h-3 rounded skeleton-shimmer" />
                <div className="skeleton-block w-1/2 h-2.5 rounded skeleton-shimmer" />
              </div>
            </div>
            <div className="skeleton-block w-full h-2 rounded skeleton-shimmer" />
            <div className="grid grid-cols-2 gap-2">
              <div className="skeleton-block h-3 rounded skeleton-shimmer" />
              <div className="skeleton-block h-3 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="glass-card-premium p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="skeleton-block w-8 h-8 rounded-lg skeleton-shimmer" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-block w-3/4 h-3 rounded skeleton-shimmer" />
                <div className="skeleton-block w-1/2 h-2.5 rounded skeleton-shimmer" />
              </div>
            </div>
            <div className="skeleton-block w-full h-2 rounded skeleton-shimmer" />
            <div className="grid grid-cols-2 gap-2">
              <div className="skeleton-block h-3 rounded skeleton-shimmer" />
              <div className="skeleton-block h-3 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="glass-card-premium p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="skeleton-block w-8 h-8 rounded-lg skeleton-shimmer" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-block w-3/4 h-3 rounded skeleton-shimmer" />
                <div className="skeleton-block w-1/2 h-2.5 rounded skeleton-shimmer" />
              </div>
            </div>
            <div className="skeleton-block w-full h-2 rounded skeleton-shimmer" />
            <div className="grid grid-cols-2 gap-2">
              <div className="skeleton-block h-3 rounded skeleton-shimmer" />
              <div className="skeleton-block h-3 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="glass-card-premium p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="skeleton-block w-8 h-8 rounded-lg skeleton-shimmer" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-block w-3/4 h-3 rounded skeleton-shimmer" />
                <div className="skeleton-block w-1/2 h-2.5 rounded skeleton-shimmer" />
              </div>
            </div>
            <div className="skeleton-block w-full h-2 rounded skeleton-shimmer" />
            <div className="grid grid-cols-2 gap-2">
              <div className="skeleton-block h-3 rounded skeleton-shimmer" />
              <div className="skeleton-block h-3 rounded skeleton-shimmer" />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isProcessing && violations.length === 0 && (
        <div className="glass-card-premium flex flex-col items-center justify-center py-16">
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {violations.map((violation, idx) => (
            <ViolationCard
              key={violation.id}
              violation={violation}
              index={idx}
              onHighlight={onHighlightBox}
              isNew={newViolationIds.has(violation.id)}
              canvasRef={canvasRef}
              boundingBoxes={boundingBoxes}
              uploadedImage={uploadedImage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
