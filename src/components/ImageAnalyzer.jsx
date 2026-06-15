import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Upload,
  ImagePlus,
  Loader2,
  ScanLine,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { PREPROCESSING_STEPS } from '../data/mockData';

// ===== Animated SVG Checkmark =====
function AnimatedCheck() {
  return (
    <svg className="check-svg w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="#00c853" strokeWidth="1.5" fill="rgba(0,200,83,0.1)" />
      <path
        d="M4.5 8.5 L7 11 L11.5 5.5"
        stroke="#00c853"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function ImageAnalyzer({
  uploadedImage,
  boundingBoxes,
  isProcessing,
  processingStep,
  completedSteps,
  onImageUpload,
  highlightedBoxId,
  liveDemoMode,
}) {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showScanLine, setShowScanLine] = useState(false);
  const [animatedBoxes, setAnimatedBoxes] = useState([]);
  const [imageReady, setImageReady] = useState(false);

  // Handle file drop/select
  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onImageUpload(e.target.result, { w: img.naturalWidth, h: img.naturalHeight });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  // Reset imageReady when image changes
  useEffect(() => {
    if (uploadedImage) {
      setImageReady(false);
      const timer = setTimeout(() => setImageReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [uploadedImage]);

  // Animate bounding boxes appearing one at a time
  useEffect(() => {
    if (boundingBoxes.length === 0) {
      setAnimatedBoxes([]);
      return;
    }

    setShowScanLine(true);
    setAnimatedBoxes([]);

    const timers = boundingBoxes.map((box, idx) =>
      setTimeout(() => {
        setAnimatedBoxes(prev => [...prev, box]);
      }, 200 + idx * 300)
    );

    const scanTimer = setTimeout(() => setShowScanLine(false), 1500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(scanTimer);
    };
  }, [boundingBoxes]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadedImage) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const maxWidth = canvas.parentElement.clientWidth;
      const scale = maxWidth / img.naturalWidth;
      canvas.width = maxWidth;
      canvas.height = img.naturalHeight * scale;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / img.naturalWidth;
      const scaleY = canvas.height / img.naturalHeight;

      animatedBoxes.forEach((box) => {
        const x = box.x * scaleX;
        const y = box.y * scaleY;
        const w = box.w * scaleX;
        const h = box.h * scaleY;

        const isHighlighted = highlightedBoxId === box.id;
        const lineWidth = isHighlighted ? 3 : 2;
        const alpha = isHighlighted ? 1 : 0.85;

        if (isHighlighted) {
          ctx.shadowColor = box.color;
          ctx.shadowBlur = 20;
        }

        // Semi-transparent fill
        ctx.fillStyle = box.color + '12';
        ctx.globalAlpha = alpha;
        ctx.fillRect(x, y, w, h);

        // Corner accents only (L-shaped corners — premium look)
        ctx.strokeStyle = box.color;
        ctx.lineWidth = lineWidth + 1;
        ctx.globalAlpha = alpha;
        const cornerLen = Math.min(w, h) * 0.22;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(x, y + cornerLen);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerLen, y);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerLen, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + cornerLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x, y + h - cornerLen);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + cornerLen, y + h);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerLen, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y + h - cornerLen);
        ctx.stroke();

        // Thin border for structure
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeRect(x, y, w, h);
        ctx.globalAlpha = alpha;

        // Pill-shaped label
        ctx.shadowBlur = 0;
        const label = box.shortLabel;
        const conf = box.confidence.toFixed(1) + '%';
        const text = `${label}  ${conf}`;
        ctx.font = `600 ${Math.max(10, Math.min(12, w * 0.065))}px Inter, sans-serif`;
        const tm = ctx.measureText(text);
        const lPad = 8;
        const lH = 20;
        const lW = tm.width + lPad * 2;
        const lX = x;
        const lY = y - lH - 4;
        const lR = 10;

        // Rounded pill background
        ctx.fillStyle = box.color;
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.moveTo(lX + lR, lY);
        ctx.lineTo(lX + lW - lR, lY);
        ctx.quadraticCurveTo(lX + lW, lY, lX + lW, lY + lR);
        ctx.lineTo(lX + lW, lY + lH - lR);
        ctx.quadraticCurveTo(lX + lW, lY + lH, lX + lW - lR, lY + lH);
        ctx.lineTo(lX + lR, lY + lH);
        ctx.quadraticCurveTo(lX, lY + lH, lX, lY + lH - lR);
        ctx.lineTo(lX, lY + lR);
        ctx.quadraticCurveTo(lX, lY, lX + lR, lY);
        ctx.closePath();
        ctx.fill();

        // Label text
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1;
        ctx.fillText(text, lX + lPad, lY + 14);

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });
    };
    img.src = uploadedImage;
  }, [uploadedImage, animatedBoxes, highlightedBoxId]);

  return (
    <div className="flex flex-col gap-3">
      {/* Section Header */}
      <div className="section-header">
        <ScanLine className="w-4 h-4 text-cyan-accent" />
        <h2 className="text-sm font-semibold text-white/90 tracking-wide">Input & Processing</h2>
        {liveDemoMode && (
          <span className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert-red opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-alert-red" />
            </span>
            <span className="text-[10px] font-bold text-alert-red uppercase tracking-widest">LIVE</span>
          </span>
        )}
      </div>

      {/* Upload Zone / Canvas */}
      {!uploadedImage ? (
        <div
          className={`upload-zone flex flex-col items-center justify-center py-16 px-6 cursor-pointer ${isDragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          id="upload-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
            id="file-input"
          />
          <div className="animate-float">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4 mx-auto border border-white/[0.06] shadow-lg shadow-cyan-accent/5">
              <ImagePlus className="w-8 h-8 text-cyan-accent/60" />
            </div>
          </div>
          <p className="text-sm font-medium text-white/70 mb-1">
            Drop traffic image here
          </p>
          <p className="text-xs text-navy-300">
            or click to browse • PNG, JPG, WEBP
          </p>
          <div className="flex items-center gap-2 mt-5">
            <Upload className="w-3.5 h-3.5 text-navy-400" />
            <span className="text-[10px] text-navy-400 uppercase tracking-wider">
              Supports CCTV snapshots & dashcam footage
            </span>
          </div>
        </div>
      ) : (
        <div className={`canvas-container relative ${imageReady ? 'animate-fade-in-scale' : 'opacity-0'}`}>
          <canvas ref={canvasRef} className="w-full" />

          {/* Scan Line */}
          {showScanLine && <div className="scan-line" />}

          {/* Processing Overlay with Skeleton */}
          {isProcessing && (
            <div className="processing-overlay">
              <div className="absolute inset-4 flex flex-col gap-3 pointer-events-none">
                <div className="skeleton-block w-3/4 h-4" />
                <div className="skeleton-block w-1/2 h-4" />
                <div className="skeleton-block w-full h-20" />
                <div className="skeleton-block w-2/3 h-4" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-cyan-accent animate-spin mb-3" />
                <p className="text-sm font-semibold text-white/90 mb-1">Analyzing Image...</p>
                <p className="text-[11px] text-navy-300 font-mono">Running YOLOv8x pipeline</p>
                <div className="w-48 h-1.5 bg-white/[0.06] rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-accent to-purple-500 rounded-full animate-processing" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preprocessing Pipeline */}
      {uploadedImage && (
        <div className="glass-card p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-3.5 h-3.5 text-cyan-accent" />
            <span className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.1em]">
              Preprocessing Pipeline
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {PREPROCESSING_STEPS.map((step, idx) => {
              const isCompleted = completedSteps.includes(idx);
              const isActive = processingStep === idx && !isCompleted;
              return (
                <div
                  key={idx}
                  className={`flex flex-col rounded-lg transition-all duration-300 px-3 py-2 ${
                    isCompleted
                      ? 'step-completed'
                      : isActive
                      ? 'animate-shimmer bg-cyan-accent/[0.04]'
                      : 'opacity-30'
                  }`}
                  style={{
                    animationDelay: `${idx * 300}ms`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {isCompleted ? (
                      <AnimatedCheck />
                    ) : isActive ? (
                      <Loader2 className="w-3.5 h-3.5 text-cyan-accent animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-navy-500/50 shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${
                      isCompleted ? 'text-success-green' : isActive ? 'text-cyan-accent' : 'text-navy-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {/* Progress bar under each step */}
                  {(isCompleted || isActive) && (
                    <div className="step-progress-bar ml-6 mt-1">
                      {isCompleted && <div className="step-progress-fill" />}
                      {isActive && (
                        <div className="h-full bg-gradient-to-r from-cyan-accent/60 to-cyan-accent/20 rounded animate-processing" style={{ width: '70%' }} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detection Summary */}
      {boundingBoxes.length > 0 && !isProcessing && (
        <div className="glass-card p-3.5 animate-fade-in-scale" style={{ opacity: 0, animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-accent" />
            <span className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.1em]">Detection Summary</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { count: boundingBoxes.filter(b => b.type === 'vehicle').length, label: 'Vehicles', color: 'text-success-green' },
              { count: boundingBoxes.filter(b => b.type === 'violation').length, label: 'Violations', color: 'text-alert-red' },
              { count: boundingBoxes.filter(b => b.type === 'plate').length, label: 'Plates', color: 'text-warning-orange' },
            ].map((item, i) => (
              <div key={i} className="bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.04]">
                <p className={`text-lg font-bold ${item.color} font-mono`}>{item.count}</p>
                <p className="text-[10px] text-navy-300 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Another */}
      {uploadedImage && !isProcessing && !liveDemoMode && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary w-full flex items-center justify-center gap-2"
          id="upload-another-btn"
        >
          <Upload className="w-3.5 h-3.5" />
          Analyze Another Image
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </button>
      )}
    </div>
  );
}
