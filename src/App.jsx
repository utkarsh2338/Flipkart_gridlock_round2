import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Shield, Zap, Eye, Radio, Volume2, VolumeX,
  Bell, Settings, LayoutDashboard, BarChart3,
  Video, Archive, ShieldCheck,
} from 'lucide-react';
import StatsBar from './components/StatsBar';
import ImageAnalyzer from './components/ImageAnalyzer';
import DetectionResults from './components/DetectionResults';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ArchivePanel from './components/ArchivePanel';
import AccountabilityPanel from './components/AccountabilityPanel';
import LiveTicker from './components/LiveTicker';
import ModelLoadingOverlay from './components/ModelLoadingOverlay';
import VisionGuardAssistant from './components/VisionGuardAssistant';
import ViolationMap from './components/ViolationMap';
import useTFModel from './hooks/useTFModel';
import { runFullPipeline } from './data/aiDetection';
import {
  generateLiveEvent,
  generateSummaryStats,
  PREPROCESSING_STEPS,
  generateHistoricalArchive,
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

// ===== Navigation Tabs =====
const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'live-feed', label: 'Live Feed', icon: Video },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'accountability', label: 'Accountability', icon: ShieldCheck },
];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
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

  const [archiveViolations, setArchiveViolations] = useState(() => {
    const cached = localStorage.getItem('vg_archive_violations');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return parsed.map(v => ({
          ...v,
          timestamp: new Date(v.timestamp)
        }));
      } catch (err) {
        console.error('Error parsing cached archive:', err);
      }
    }
    const generated = generateHistoricalArchive();
    localStorage.setItem('vg_archive_violations', JSON.stringify(generated));
    return generated;
  });

  useEffect(() => {
    localStorage.setItem('vg_archive_violations', JSON.stringify(archiveViolations));
  }, [archiveViolations]);

  const stats = generateSummaryStats();
  const liveDemoRef = useRef(null);
  const imgDimRef = useRef({ w: 800, h: 500 });
  const soundRef = useRef(false);
  const canvasRef = useRef(null);

  // TensorFlow.js model
  const { model, isLoading: modelLoading, loadProgress, error: modelError } = useTFModel();

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

  // Process image with REAL AI detection
  const processImage = useCallback((imageSrc, dimensions) => {
    setUploadedImage(imageSrc);
    imgDimRef.current = dimensions || { w: 800, h: 500 };
    setIsProcessing(true);
    setProcessingStep(-1);
    setCompletedSteps([]);
    setBoundingBoxes([]);
    setViolations([]);
    setHighlightedBoxId(null);

    // Animate preprocessing steps (visual only)
    PREPROCESSING_STEPS.forEach((step, idx) => {
      setTimeout(() => {
        setProcessingStep(idx);
        setCompletedSteps(prev => [...prev, idx]);
      }, step.delay);
    });

    // Run real AI detection
    const imgEl = new Image();
    imgEl.crossOrigin = 'anonymous';
    imgEl.onload = async () => {
      try {
        if (model) {
          const { boxes, violations: viols } = await runFullPipeline(
            model,
            imgEl,
            imgEl.naturalWidth,
            imgEl.naturalHeight
          );

          // Wait for preprocessing animation to finish
          const maxDelay = Math.max(...PREPROCESSING_STEPS.map(s => s.delay));
          const elapsed = performance.now();
          const waitTime = Math.max(0, maxDelay + 500 - elapsed);

          setTimeout(() => {
            setBoundingBoxes(boxes);
            setViolations(viols);
            setAllViolations(prev => [...prev, ...viols]);

            // Add newly detected violations to archive state
            if (viols && viols.length > 0) {
              const newArchiveEntries = viols.map(v => ({
                ...v,
                status: 'Pending',
                telemetry: {
                  speed: Math.floor(40 + Math.random() * 40),
                  speedLimit: 60,
                  lane: Math.floor(1 + Math.random() * 3),
                  bbox: { x: 20, y: 35, w: 25, h: 35 } // simulated overlay for historical frame
                }
              }));
              setArchiveViolations(prev => {
                // Ensure no duplicate IDs
                const filteredPrev = prev.filter(p => !newArchiveEntries.some(n => n.id === p.id));
                return [...newArchiveEntries, ...filteredPrev];
              });
            }

            setIsProcessing(false);

            if (soundRef.current && viols.some(v => v.severity === 'high')) {
              playAlertBeep();
            }
          }, waitTime > 2000 ? 500 : waitTime);
        } else {
          // Model not loaded yet — show empty results after animation
          setTimeout(() => {
            setBoundingBoxes([]);
            setViolations([]);
            setIsProcessing(false);
          }, 2000);
        }
      } catch (err) {
        console.error('Detection failed:', err);
        setTimeout(() => {
          setBoundingBoxes([]);
          setViolations([]);
          setIsProcessing(false);
        }, 2000);
      }
    };
    imgEl.src = imageSrc;
  }, [model]);

  // Live demo mode
  useEffect(() => {
    if (liveDemoMode) {
      const sampleImg = generateSampleImage();
      processImage(sampleImg, { w: 800, h: 500 });

      liveDemoRef.current = setInterval(() => {
        const sampleImg = generateSampleImage();
        processImage(sampleImg, { w: 800, h: 500 });
      }, 6000);
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

  // Show model loading overlay after splash dismisses
  const showModelLoading = !showSplash && modelLoading;

  return (
    <>
      <SplashScreen visible={showSplash} />
      <ModelLoadingOverlay progress={loadProgress} visible={showModelLoading} />

      <div className="app-frame">
        <div className="app-background flex flex-col min-h-screen relative">
          {/* ===== Header ===== */}
          <header className="app-header" style={{ position: 'relative', zIndex: 50 }}>
            {/* Brand */}
            <div className="header-brand">
              <span className="brand-name gradient-text">VISIONGUARD</span>
              <span className="brand-name gradient-text-ai">AI</span>
            </div>

            {/* Navigation Tabs */}
            <nav className="nav-tabs">
              {NAV_TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  id={`nav-tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Right Section: Status + Controls */}
            <div className="header-status">
              {/* Camera Count */}
              <div className="header-chip">
                <span className="dot" />
                <span className="value">{stats.camerasActive}</span>
                <span>Cameras</span>
              </div>

              {/* Latency */}
              <div className="header-chip">
                <span className="value">{stats.avgProcessingTime}</span>
                <span>Latency</span>
              </div>

              {/* Live Demo Toggle */}
              <div className="flex items-center gap-2">
                <span className="live-demo-label text-[10px] text-navy-300 font-medium uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>Live Demo</span>
                <button
                  onClick={() => setLiveDemoMode(!liveDemoMode)}
                  className={`toggle-switch ${liveDemoMode ? 'active' : ''}`}
                  aria-label="Toggle live demo mode"
                  id="live-demo-toggle"
                />
              </div>

              {/* Sound */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="header-icon-btn"
                aria-label="Toggle sound"
                id="sound-toggle"
              >
                {soundEnabled
                  ? <Volume2 className="w-4 h-4" />
                  : <VolumeX className="w-4 h-4" />
                }
              </button>

              {/* Notification Bell */}
              <button className="header-icon-btn relative" id="notification-bell">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-alert-red rounded-full" />
              </button>

              {/* Settings */}
              <button className="header-icon-btn" id="settings-btn">
                <Settings className="w-4 h-4" />
              </button>

              {/* Profile Avatar */}
              <div className="header-avatar" id="profile-avatar">
                VG
              </div>
            </div>

            {/* Animated gradient line */}
            <div className="header-line absolute bottom-0 left-0 right-0" />
          </header>

          {/* ===== Stats Bar ===== */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <StatsBar stats={stats} violationCount={allViolations.length || stats.totalToday} />
          </div>

          {/* ===== Tab Content ===== */}
          {activeTab === 'dashboard' && (
            <>
              {/* Main 2-Panel Layout */}
              <main className="main-grid flex-1 grid grid-cols-12 gap-4 md:gap-6 p-4 md:p-6 min-h-0" style={{ position: 'relative', zIndex: 10 }}>
                {/* LEFT PANEL */}
                <section className="col-span-12 lg:col-span-6 flex flex-col gap-6 min-h-0 overflow-y-auto pr-0 lg:pr-2">
                  <ImageAnalyzer
                    ref={canvasRef}
                    uploadedImage={uploadedImage}
                    boundingBoxes={boundingBoxes}
                    isProcessing={isProcessing}
                    processingStep={processingStep}
                    completedSteps={completedSteps}
                    onImageUpload={processImage}
                    highlightedBoxId={highlightedBoxId}
                    liveDemoMode={liveDemoMode}
                    modelReady={!!model}
                  />
                </section>

                {/* RIGHT PANEL */}
                <section className="col-span-12 lg:col-span-6 flex flex-col gap-6 min-h-0 overflow-y-auto pl-0 lg:pl-2">
                  <DetectionResults
                    violations={violations}
                    isProcessing={isProcessing}
                    onHighlightBox={handleHighlightBox}
                    canvasRef={canvasRef}
                  />
                </section>
              </main>

              {/* Map Panel */}
              <div className="px-4 pb-4 md:px-6 md:pb-6" style={{ position: 'relative', zIndex: 10 }}>
                <ViolationMap
                  violations={violations}
                  liveDemoMode={liveDemoMode}
                />
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <main className="flex-1 p-4 md:p-6 w-full" style={{ position: 'relative', zIndex: 10 }}>
              <div className="max-w-7xl mx-auto w-full">
                <AnalyticsDashboard
                  violations={allViolations.length > 0 ? allViolations : violations}
                  onExportCSV={exportCSV}
                  stats={stats}
                />
              </div>
            </main>
          )}

          {activeTab === 'live-feed' && (
            <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6" style={{ position: 'relative', zIndex: 10 }}>
              <div className="flex flex-col gap-4 md:gap-6">
                <ImageAnalyzer
                  ref={canvasRef}
                  uploadedImage={uploadedImage}
                  boundingBoxes={boundingBoxes}
                  isProcessing={isProcessing}
                  processingStep={processingStep}
                  completedSteps={completedSteps}
                  onImageUpload={processImage}
                  highlightedBoxId={highlightedBoxId}
                  liveDemoMode={liveDemoMode}
                  modelReady={!!model}
                />
              </div>
              <div className="flex flex-col gap-4 md:gap-6">
                <DetectionResults
                  violations={violations}
                  isProcessing={isProcessing}
                  onHighlightBox={handleHighlightBox}
                  canvasRef={canvasRef}
                />
              </div>
            </main>
          )}

          {activeTab === 'archive' && (
            <main className="flex-1 p-4 md:p-6" style={{ position: 'relative', zIndex: 10 }}>
              <div className="max-w-7xl mx-auto">
                <ArchivePanel
                  archive={archiveViolations}
                  setArchive={setArchiveViolations}
                />
              </div>
            </main>
          )}

          {activeTab === 'accountability' && (
            <main className="flex-1 p-4 md:p-6 overflow-y-auto" style={{ position: 'relative', zIndex: 10 }}>
              <div className="max-w-7xl mx-auto">
                <AccountabilityPanel />
              </div>
            </main>
          )}

          {/* ===== Bottom Ticker ===== */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <LiveTicker events={liveEvents} liveDemoMode={liveDemoMode} />
          </div>
        </div>
      </div>
      <VisionGuardAssistant violations={allViolations.length > 0 ? allViolations : violations} archiveData={archiveViolations} />
    </>
  );
}
