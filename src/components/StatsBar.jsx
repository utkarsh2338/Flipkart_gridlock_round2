import React, { useState, useEffect, useRef } from 'react';

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
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="sparkline-wrap">
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
      label: 'Violations Today',
      rawValue: violationCount,
      suffix: '',
      colorClass: '',
      sparkColor: '#ff4444',
      sparkData: [12, 18, 14, 22, 19, 28, 24],
      isNumeric: true,
      iconEmoji: '📊',
    },
    {
      label: 'This Week',
      rawValue: stats.totalThisWeek,
      suffix: '',
      colorClass: '',
      sparkColor: '#ff8c00',
      sparkData: [40, 52, 48, 61, 55, 58, 62],
      isNumeric: true,
      iconEmoji: '📈',
    },
    {
      label: 'Accuracy',
      rawValue: stats.detectionAccuracy,
      suffix: '%',
      colorClass: 'success',
      sparkColor: '#00c853',
      sparkData: [94, 95, 95.2, 95.8, 96, 96.1, 96.3],
      isNumeric: true,
      decimals: 1,
      iconEmoji: '⚡',
    },
    {
      label: 'Revenue',
      rawValue: stats.revenueToday,
      suffix: '',
      colorClass: 'revenue',
      sparkColor: '#34d399',
      sparkData: [2.1, 2.8, 3.2, 3.5, 3.9, 4.1, 4.3],
      isNumeric: false,
      sub: '+12% vs last week',
      iconEmoji: '💰',
    },
    {
      label: 'Hotspot',
      rawValue: 'Silk Board',
      suffix: '',
      colorClass: 'warning',
      sparkColor: '#ff8c00',
      sparkData: [28, 32, 35, 31, 38, 34, 34],
      isNumeric: false,
      sub: 'High violation cluster',
      iconEmoji: '📍',
    },
    {
      label: 'System',
      rawValue: '99.9%',
      suffix: '',
      colorClass: 'success',
      sparkColor: '#00c853',
      sparkData: [99.5, 99.7, 99.8, 99.9, 99.9, 99.9, 99.9],
      isNumeric: false,
      sub: 'Uptime Stable',
      iconEmoji: '🖥️',
    },
  ];

  return (
    <div className="stats-scroll flex items-center gap-4 px-6 py-4 overflow-x-auto border-b border-white/[0.03]">
      {items.map((item, idx) => (
        <StatCardV2 key={idx} item={item} index={idx} />
      ))}
    </div>
  );
}

function StatCardV2({ item, index }) {
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
      className={`stat-card-v2 flex-1 shrink-0 animate-slide-up ${flash ? 'animate-count-flash' : ''}`}
      style={{
        animationDelay: `${index * 70}ms`,
        opacity: 0,
      }}
    >
      <div className="stat-label">
        <span>{item.label}</span>
        <span className="stat-icon text-base">{item.iconEmoji}</span>
      </div>
      <div className={`stat-value ${item.colorClass}`}>
        {displayValue}
      </div>
      {item.sub && (
        <div className="stat-sub">
          {item.sub.startsWith('+') ? (
            <span className="trend">{item.sub}</span>
          ) : (
            <span>{item.sub}</span>
          )}
        </div>
      )}
      <Sparkline color={item.sparkColor} data={item.sparkData} />
    </div>
  );
}
