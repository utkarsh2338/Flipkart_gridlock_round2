import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Shield, Zap, Eye, Radio, Volume2, VolumeX } from 'lucide-react';
import StatsBar from './components/StatsBar';
import ImageAnalyzer from './components/ImageAnalyzer';
import DetectionResults from './components/DetectionResults';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LiveTicker from './components/LiveTicker';
import {
  generateBoundingBoxes,
  generateViolationResults,
  generateLiveEvent,
  generateSummaryStats,
  PREPROCESSING_STEPS,
} from './data/mockData';

// ===== Sample Image Generator =====
function generateSampleImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 500);
  grad.addColorStop(0, '#4a6fa5');
  grad.addColorStop(0.35, '#8ab6d6');
  grad.addColorStop(0.5, '#6b7b8d');
  grad.addColorStop(1, '#3d3d3d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 500);

  ctx.fillStyle = '#2c2c2c';
  ctx.fillRect(0, 280, 800, 220);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.setLineDash([30, 20]);
  ctx.beginPath();
  ctx.moveTo(0, 390);
  ctx.lineTo(800, 390);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(200, 360, 250, 4);

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(420, 100, 30, 80);
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(435, 118, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(435, 142, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(435, 166, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#c0392b';
  ctx.fillRect(100, 310, 120, 60);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(110, 315, 100, 25);

  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(350, 330, 40, 55);
  ctx.fillStyle = '#34495e';
  ctx.beginPath();
  ctx.arc(370, 325, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f39c12';
  ctx.fillRect(550, 320, 80, 50);
  ctx.fillStyle = '#e67e22';
  ctx.fillRect(555, 305, 70, 20);

  ctx.fillStyle = '#5a6b7a';
  ctx.fillRect(50, 120, 80, 160);
  ctx.fillRect(600, 80, 100, 200);
  ctx.fillRect(720, 140, 70, 140);

  ctx.fillStyle = '#8ec6e6';
  for (let by = 130; by < 270; by += 25) {
    for (let bx = 60; bx < 120; bx += 20) {
      ctx.fillRect(bx, by, 12, 16);
    }
  }

  ctx.fillStyle = '#2d5a27';
  ctx.beginPath();
  ctx.arc(500, 220, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(497, 245, 6, 35);

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, 800, 28);
  ctx.fillStyle = '#00ff00';
  ctx.font = '12px monospace';
  ctx.fillText('CAM-042 | Silk Board Junction, Bengaluru | ' + new Date().toLocaleString(), 10, 18);

  return canvas.toDataURL('image/png');
}

// ===== Sound Feedback (Web Audio API) =====
function playAlertBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch (_) {}
}

// ===== Splash Screen Component =====
function SplashScreen({ visible }) {
  return (
    <div className={`splash-screen ${!visible ? 'hidden' : ''}`}>
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="sonar-ring"
          style={{ left: '50%', top: '50%' }}
        />
      ))}
      <div className="splash-logo flex flex-col items-center gap-3">
        <Shield className="w-16 h-16 text-cyan-accent" />
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="gradient-text">VisionGuard</span>
            <span className="gradient-text-ai ml-2">AI</span>
          </h1>
          <p className="text-xs text-navy-300 tracking-[0.3em] uppercase mt-1">
            Automated Traffic Violation Detection
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [violations, setViolations] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [liveDemoMode, setLiveDemoMode] = useState(false);
  const [highlightedBoxId, setHighlightedBoxId] = useState(null);
  const [allViolations, setAllViolations] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const stats = generateSummaryStats();
  const liveDemoRef = useRef(null);
  const imgDimRef = useRef({ w: 800, h: 500 });
  const soundRef = useRef(false);

  // Keep ref in sync
  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Initialize live events
  useEffect(() => {
    const initial = Array.from({ length: 8 }, () => generateLiveEvent());
    setLiveEvents(initial);

    const interval = setInterval(() => {
      setLiveEvents(prev => {
        const newEvent = generateLiveEvent();
        return [...prev.slice(-15), newEvent];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Process image (simulated)
  const processImage = useCallback((imageSrc, dimensions) => {
    setUploadedImage(imageSrc);
    imgDimRef.current = dimensions || { w: 800, h: 500 };
    setIsProcessing(true);
    setProcessingStep(-1);
    setCompletedSteps([]);
    setBoundingBoxes([]);
    setViolations([]);
    setHighlightedBoxId(null);

    PREPROCESSING_STEPS.forEach((step, idx) => {
      setTimeout(() => {
        setProcessingStep(idx);
        setCompletedSteps(prev => [...prev, idx]);
      }, step.delay);
    });

    setTimeout(() => {
      const boxes = generateBoundingBoxes(imgDimRef.current.w, imgDimRef.current.h);
      const viols = generateViolationResults(boxes);
      setBoundingBoxes(boxes);
      setViolations(viols);
      setAllViolations(prev => [...prev, ...viols]);
      setIsProcessing(false);

      // Sound alert for high-severity violations
      if (soundRef.current && viols.some(v => v.severity === 'high')) {
        playAlertBeep();
      }
    }, 2000);
  }, []);

  // Live demo mode
  useEffect(() => {
    if (liveDemoMode) {
      const sampleImg = generateSampleImage();
      processImage(sampleImg, { w: 800, h: 500 });

      liveDemoRef.current = setInterval(() => {
        const sampleImg = generateSampleImage();
        processImage(sampleImg, { w: 800, h: 500 });
      }, 5000);
    } else {
      if (liveDemoRef.current) {
        clearInterval(liveDemoRef.current);
        liveDemoRef.current = null;
      }
    }
    return () => {
      if (liveDemoRef.current) clearInterval(liveDemoRef.current);
    };
  }, [liveDemoMode, processImage]);

  const handleHighlightBox = useCallback((boxId) => {
    setHighlightedBoxId(boxId);
    setTimeout(() => setHighlightedBoxId(null), 3000);
  }, []);

  const exportCSV = useCallback(() => {
    const headers = ['Violation Type', 'Confidence', 'Vehicle Type', 'License Plate', 'Camera', 'Timestamp', 'Severity'];
    const rows = (allViolations.length > 0 ? allViolations : violations).map(v => [
      v.type.name,
      v.confidence.toFixed(1) + '%',
      v.vehicleType,
      v.licensePlate,
      v.cameraId,
      v.timestamp.toISOString(),
      v.severity,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visionguard_violations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [violations, allViolations]);

  return (
    <>
      <SplashScreen visible={showSplash} />

      <div className="app-background flex flex-col min-h-screen relative">
        {/* ===== Header ===== */}
        <header className="relative flex items-center justify-between px-6 py-3 bg-navy-900/60 backdrop-blur-xl sticky top-0 z-50 border-b border-white/[0.04]" style={{ position: 'relative', zIndex: 50 }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="w-8 h-8 text-cyan-accent animate-icon-pulse" />
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-success-green rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">
                <span className="gradient-text">VisionGuard</span>
                <span className="gradient-text-ai ml-1.5">AI</span>
              </h1>
              <p className="text-[10px] text-navy-300 tracking-[0.2em] uppercase -mt-0.5">
                Automated Traffic Violation Detection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
              aria-label="Toggle sound"
              id="sound-toggle"
            >
              {soundEnabled
                ? <Volume2 className="w-4 h-4 text-cyan-accent" />
                : <VolumeX className="w-4 h-4 text-navy-400" />
              }
            </button>

            {/* Live Demo Toggle */}
            <div className="flex items-center gap-2.5">
              {liveDemoMode && (
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-green opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success-green" />
                  </span>
                  <span className="text-[10px] font-bold text-success-green uppercase tracking-widest animate-pulse">LIVE</span>
                </div>
              )}
              <span className="text-xs text-navy-300 font-medium">Live Demo</span>
              <button
                onClick={() => setLiveDemoMode(!liveDemoMode)}
                className={`toggle-switch ${liveDemoMode ? 'active' : ''}`}
                aria-label="Toggle live demo mode"
                id="live-demo-toggle"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-navy-300">
              <div className="relative">
                <Eye className="w-3.5 h-3.5" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-success-green rounded-full animate-pulse" />
              </div>
              <span className="font-mono">{stats.camerasActive} Cameras</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Zap className="w-3.5 h-3.5 text-cyan-accent" />
              <span className="text-cyan-accent font-mono font-semibold">{stats.avgProcessingTime}</span>
              <span className="text-navy-400">latency</span>
            </div>
          </div>

          {/* Animated gradient line under header */}
          <div className="header-line absolute bottom-0 left-0 right-0" />
        </header>

        {/* ===== Stats Bar ===== */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <StatsBar stats={stats} violationCount={allViolations.length || stats.totalToday} />
        </div>

        {/* ===== Main 3-Panel Layout ===== */}
        <main className="main-grid flex-1 grid grid-cols-12 gap-4 p-4 min-h-0" style={{ position: 'relative', zIndex: 10 }}>
          {/* LEFT PANEL */}
          <section className="col-span-4 flex flex-col gap-4 min-h-0 overflow-y-auto pr-1">
            <ImageAnalyzer
              uploadedImage={uploadedImage}
              boundingBoxes={boundingBoxes}
              isProcessing={isProcessing}
              processingStep={processingStep}
              completedSteps={completedSteps}
              onImageUpload={processImage}
              highlightedBoxId={highlightedBoxId}
              liveDemoMode={liveDemoMode}
            />
          </section>

          {/* CENTER PANEL */}
          <section className="col-span-4 flex flex-col gap-4 min-h-0 overflow-y-auto px-1">
            <DetectionResults
              violations={violations}
              isProcessing={isProcessing}
              onHighlightBox={handleHighlightBox}
            />
          </section>

          {/* RIGHT PANEL */}
          <section className="col-span-4 flex flex-col gap-4 min-h-0 overflow-y-auto pl-1">
            <AnalyticsDashboard
              violations={allViolations.length > 0 ? allViolations : violations}
              onExportCSV={exportCSV}
              stats={stats}
            />
          </section>
        </main>

        {/* ===== Bottom Ticker ===== */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <LiveTicker events={liveEvents} liveDemoMode={liveDemoMode} />
        </div>
      </div>
    </>
  );
}
