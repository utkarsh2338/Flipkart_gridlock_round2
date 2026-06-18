import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, X, ChevronRight, ChevronLeft } from 'lucide-react';

const STEPS = [
  {
    title: "Image Upload Zone",
    selector: "#upload-zone",
    text: "Real TensorFlow.js inference — upload any traffic photo. We'll demo with a Bengaluru intersection.",
    action: "loadSample"
  },
  {
    title: "Detection Results",
    selector: ".canvas-container",
    text: "COCO-SSD detects vehicles and persons. Our rule engine maps them to 7 violation types under the Motor Vehicles Act.",
    action: "triggerDetection"
  },
  {
    title: "e-Challan Generator",
    selector: ".btn-challan",
    text: "One click generates a Karnataka e-Challan with the correct MV Act section and fine amount — printable, court-admissible.",
    action: "none"
  },
  {
    title: "Live Surveillance Map",
    selector: "#violation-map",
    text: "Every detection is geo-tagged on MapmyIndia's infrastructure — the same mapping layer BTP uses today.",
    action: "dropMapPin"
  },
  {
    title: "Triage & Accountability",
    selector: ".triage-summary-pill",
    text: "The layer no other team built. 17% of high-confidence detections were false positives — caught by human review before any challan was issued.",
    action: "accountabilityTab"
  },
  {
    title: "Conversational Assistant",
    selector: "#visionguard-assistant-fab",
    text: "Ask the AI assistant anything about session violations, patrol deployment, or MV Act citations.",
    action: "openChatbot"
  }
];

export default function JudgeDemoOverlay({ isActive, onClose, callbacks }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const timerRef = useRef(null);

  // Function to calculate spotlight element position
  const updateCoords = useCallback(() => {
    if (!isActive) return;
    const step = STEPS[currentStep];
    if (!step) return;

    const el = document.querySelector(step.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setCoords(null);
    }
  }, [isActive, currentStep]);

  // Execute step-specific callback actions
  const triggerStepAction = useCallback((stepIndex) => {
    if (!callbacks) return;
    const step = STEPS[stepIndex];
    if (!step) return;

    switch (step.action) {
      case 'loadSample':
        callbacks.onLoadSample();
        break;
      case 'triggerDetection':
        callbacks.onTriggerDetection();
        break;
      case 'dropMapPin':
        callbacks.onSelectTab('dashboard');
        callbacks.onDropMapPin();
        break;
      case 'accountabilityTab':
        callbacks.onSelectTab('accountability');
        break;
      case 'openChatbot':
        callbacks.onOpenChatbot("Which zone needs patrol now?");
        break;
      default:
        break;
    }
  }, [callbacks]);

  // Handle step change
  const goToStep = useCallback((stepIndex) => {
    if (stepIndex < 0 || stepIndex >= STEPS.length) return;
    setCurrentStep(stepIndex);
    triggerStepAction(stepIndex);
  }, [triggerStepAction]);

  // Next step
  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1);
    } else {
      onClose();
    }
  }, [currentStep, goToStep, onClose]);

  // Previous step
  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // Monitor element existence and update coordinates (with retries for tab rendering delay)
  useEffect(() => {
    if (!isActive) return;
    
    let attempts = 0;
    const interval = setInterval(() => {
      const step = STEPS[currentStep];
      if (!step) {
        clearInterval(interval);
        return;
      }
      const el = document.querySelector(step.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        clearInterval(interval);
      } else {
        attempts++;
        if (attempts > 20) { // 2 seconds timeout
          clearInterval(interval);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, currentStep]);

  // Periodically update coordinates on window events
  useEffect(() => {
    if (!isActive) return;
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);
    
    // Also run an interval to keep the spotlight aligned if content shifts
    const alignmentInterval = setInterval(updateCoords, 500);

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
      clearInterval(alignmentInterval);
    };
  }, [isActive, updateCoords]);

  // Tooltip positioning logic (above / below elements dynamically)
  useEffect(() => {
    if (!coords) return;
    
    const padding = 16;
    const tooltipWidth = 330;
    const tooltipHeight = 150; // estimated maximum height
    
    let top = coords.top + coords.height + padding;
    let left = coords.left + coords.width / 2 - tooltipWidth / 2;
    
    // Position above if there isn't enough vertical space below
    if (coords.top + coords.height + padding + tooltipHeight > window.innerHeight) {
      top = coords.top - tooltipHeight - padding;
    }
    
    // Force tooltip within screen edges
    left = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left));
    top = Math.max(16, Math.min(window.innerHeight - tooltipHeight - 16, top));
    
    setTooltipStyle({
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    });
  }, [coords]);

  // Step timer: auto advance every 8 seconds
  useEffect(() => {
    if (!isActive) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      handleNext();
    }, 8000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, currentStep, handleNext]);

  // Keyboard controls: ESC to exit, Left/Right arrow keys
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onClose, handleNext, handlePrev]);

  // Run initial action on activation
  useEffect(() => {
    if (isActive) {
      setCurrentStep(0);
      triggerStepAction(0);
    }
  }, [isActive, triggerStepAction]);

  if (!isActive) return null;

  return (
    <div className="judge-demo-mask-overlay">
      {/* Background Mask Cutout Container */}
      {coords && (
        <div 
          className="judge-demo-spotlight-cutout"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            height: `${coords.height}px`,
          }}
        />
      )}

      {/* Dynamic Floating Tooltip Card */}
      {coords && (
        <div className="judge-demo-tooltip-card glass-card" style={tooltipStyle}>
          <div className="tooltip-header flex items-center justify-between border-b border-white/[0.06] pb-2 mb-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-accent font-mono">
              Step {currentStep + 1} of 6: {STEPS[currentStep].title}
            </span>
            <button 
              onClick={onClose}
              className="text-navy-400 hover:text-white transition-colors"
              aria-label="Close walkthrough"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-navy-100 leading-relaxed font-medium mb-3">
            {STEPS[currentStep].text}
          </p>
          <div className="flex items-center justify-between mt-auto">
            <button 
              onClick={onClose}
              className="text-[10px] font-bold text-navy-400 hover:text-alert-red uppercase tracking-wider transition-colors"
            >
              Exit Walkthrough
            </button>
            <div className="flex items-center gap-1.5">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrev}
                  className="btn-demo-nav"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
              )}
              <button 
                onClick={handleNext}
                className="btn-demo-nav active"
                id="walkthrough-next-btn"
              >
                <span>{currentStep === STEPS.length - 1 ? 'Finish' : 'Next'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Walkthrough Bottom Progress Bar HUD */}
      <div className="judge-demo-progress-hud glass-card">
        <div className="flex items-center justify-between w-full mb-2">
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-cyan-accent animate-pulse" />
            <span className="text-[11px] font-bold text-white/90">
              Guided Demo: {STEPS[currentStep].title}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-navy-300">
              Auto-advancing in 8s • ESC to exit
            </span>
            <button 
              onClick={onClose}
              className="btn-demo-skip"
            >
              Skip Walkthrough
            </button>
          </div>
        </div>
        {/* Progress Bar Track */}
        <div className="hud-progress-track">
          <div 
            className="hud-progress-fill"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
