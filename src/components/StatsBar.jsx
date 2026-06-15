import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Camera,
  ShieldCheck,
  IndianRupee,
  BarChart3,
  Target,
  FileCheck2,
} from 'lucide-react';

// ===== Animated Counter Hook =====
function useAnimatedCounter(target, duration = 1500) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(target);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const num = typeof target === 'number' ? target : parseFloat(String(target).replace(/[^0-9.]/g, ''));
    if (isNaN(num)) {
      setCount(target);
      return;
    }

    // Flash on value change
    if (prevTarget.current !== target) {
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
      prevTarget.current = target;
    }

    const startTime = Date.now();
    const startVal = 0;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (num - startVal) * eased;
      setCount(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return { count, flash };
}

// ===== Mini Sparkline (inline SVG) =====
function Sparkline({ color = '#00d4ff', data }) {
  const points = data || [3, 7, 4, 8, 5, 9, 6];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 48;
  const h = 18;
  const pathPoints = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / range) * h * 0.8 - h * 0.1;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="sparkline-container" viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={pathPoints}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StatsBar({ stats, violationCount }) {
  const items = [
    {
      icon: AlertTriangle,
      label: 'Violations Today',
      rawValue: violationCount,
      suffix: '',
      color: 'text-alert-red',
      borderColor: '#ff4444',
      sparkData: [12, 18, 14, 22, 19, 28, 24],
      isNumeric: true,
    },
    {
      icon: TrendingUp,
      label: 'This Week',
      rawValue: stats.totalThisWeek,
      suffix: '',
      color: 'text-warning-orange',
      borderColor: '#ff8c00',
      sparkData: [40, 52, 48, 61, 55, 58, 62],
      isNumeric: true,
    },
    {
      icon: Target,
      label: 'Detection Accuracy',
      rawValue: stats.detectionAccuracy,
      suffix: '%',
      color: 'text-success-green',
      borderColor: '#00c853',
      sparkData: [94, 95, 95.2, 95.8, 96, 96.1, 96.3],
      isNumeric: true,
      decimals: 1,
    },
    {
      icon: Camera,
      label: 'Active Cameras',
      rawValue: stats.camerasActive,
      suffix: '',
      color: 'text-cyan-accent',
      borderColor: '#00d4ff',
      sparkData: [42, 44, 45, 46, 48, 48, 48],
      isNumeric: true,
    },
    {
      icon: FileCheck2,
      label: 'Challans Issued',
      rawValue: stats.challansIssued,
      suffix: '',
      color: 'text-purple-400',
      borderColor: '#a855f7',
      sparkData: [50, 68, 72, 85, 91, 98, 72],
      isNumeric: true,
    },
    {
      icon: IndianRupee,
      label: 'Revenue Today',
      rawValue: stats.revenueToday,
      suffix: '',
      color: 'text-emerald-400',
      borderColor: '#34d399',
      sparkData: [2.1, 2.8, 3.2, 3.5, 3.9, 4.1, 4.3],
      isNumeric: false,
    },
    {
      icon: ShieldCheck,
      label: 'Most Common',
      rawValue: 'No Helmet',
      suffix: '',
      color: 'text-rose-400',
      borderColor: '#fb7185',
      sparkData: [28, 32, 35, 31, 38, 34, 34],
      isNumeric: false,
      small: true,
    },
    {
      icon: BarChart3,
      label: 'Avg Latency',
      rawValue: stats.avgProcessingTime,
      suffix: '',
      color: 'text-cyan-accent',
      borderColor: '#00d4ff',
      sparkData: [52, 50, 49, 48, 47, 47, 47],
      isNumeric: false,
    },
  ];

  return (
    <div className="stats-scroll flex items-center gap-3 px-4 py-2.5 overflow-x-auto border-b border-white/[0.03]">
      {items.map((item, idx) => (
        <StatChip key={idx} item={item} index={idx} />
      ))}
    </div>
  );
}

function StatChip({ item, index }) {
  const { count, flash } = useAnimatedCounter(
    item.isNumeric ? item.rawValue : 0,
    1500
  );

  const displayValue = item.isNumeric
    ? (item.decimals
        ? count.toFixed(item.decimals)
        : Math.round(count).toLocaleString()
      ) + item.suffix
    : item.rawValue;

  return (
    <div
      className={`stat-chip flex items-center gap-3 shrink-0 animate-slide-up ${flash ? 'animate-count-flash' : ''}`}
      style={{
        animationDelay: `${index * 70}ms`,
        opacity: 0,
        '--stat-border': item.borderColor,
      }}
    >
      {/* Colored left border */}
      <style>{`
        .stat-chip:nth-child(${index + 1})::before {
          background: ${item.borderColor};
          box-shadow: 0 0 8px ${item.borderColor}40;
        }
      `}</style>

      <div className={`p-2 rounded-xl bg-white/[0.03]`}>
        <item.icon className={`w-4 h-4 ${item.color} animate-icon-pulse`} />
      </div>
      <div className="relative">
        <p className="text-[9px] text-navy-300 uppercase tracking-[0.1em] font-medium">{item.label}</p>
        <p className={`${item.small ? 'text-xs' : 'text-sm'} font-bold text-white/90 font-mono`}>
          {displayValue}
        </p>
      </div>
      <Sparkline color={item.borderColor} data={item.sparkData} />
    </div>
  );
}
