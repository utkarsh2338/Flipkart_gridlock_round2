import React, { useMemo, useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  Area, AreaChart, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Trophy,
} from 'lucide-react';
import { generateHourlyData, generateViolationBreakdown } from '../data/mockData';

// ===== Animated Counter =====
function useCounter(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const num = typeof target === 'number' ? target : 0;
    if (!num) return;
    const start = Date.now();
    const animate = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(num * eased));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return val;
}

// ===== Custom Tooltip =====
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-800/95 border border-white/[0.08] backdrop-blur-xl rounded-xl px-3.5 py-2.5 shadow-2xl">
      <p className="text-[10px] text-navy-300 mb-1 uppercase tracking-wider">{label || payload[0].name}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-bold font-mono" style={{ color: entry.color || entry.fill }}>
          {entry.value} <span className="text-navy-400 text-xs font-normal">{entry.dataKey || ''}</span>
        </p>
      ))}
    </div>
  );
};

// ===== Ranking Bar with animated width =====
function RankingBar({ name, count, maxCount, rank, delay }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const pct = (count / maxCount) * 100;
  const rankClass = rank === 1 ? 'rank-gold' : rank === 2 ? 'rank-silver' : rank === 3 ? 'rank-bronze' : '';

  return (
    <div className="flex items-center gap-2.5 py-1 group cursor-default hover:bg-white/[0.02] rounded-lg px-1 transition-colors">
      <span className={`text-xs font-extrabold font-mono w-5 ${rankClass || 'text-navy-400'}`}>
        #{rank}
      </span>
      <span className="text-[11px] text-navy-200 flex-1 truncate group-hover:text-white/80 transition-colors">
        {name}
      </span>
      <div className="w-24 h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-warning-orange to-alert-red rounded-full transition-all duration-700 group-hover:shadow-[0_0_8px_rgba(255,140,0,0.3)]"
          style={{
            width: mounted ? `${pct}%` : '0%',
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
      <span className="text-xs font-mono font-bold text-white/70 w-7 text-right">
        {count}
      </span>
    </div>
  );
}

export default function AnalyticsDashboard({ violations, onExportCSV, stats }) {
  const breakdownData = useMemo(() => generateViolationBreakdown(), []);
  const hourlyData = useMemo(() => generateHourlyData(), []);
  const totalViolations = useMemo(() => breakdownData.reduce((s, d) => s + d.value, 0), [breakdownData]);
  const animatedTotal = useCounter(totalViolations);

  const violationCounts = useMemo(() => {
    const counts = {};
    violations.forEach(v => {
      const name = v.type?.name || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [violations]);

  const topViolations = useMemo(() => {
    return Object.entries(violationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [violationCounts]);

  return (
    <div className="flex flex-col gap-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="section-header">
          <BarChart3 className="w-4 h-4 text-cyan-accent" />
          <h2 className="text-sm font-semibold text-white/90 tracking-wide">
            Analytics Dashboard
          </h2>
        </div>
        <button
          className="btn-secondary flex items-center gap-1.5 text-xs"
          onClick={onExportCSV}
          id="export-csv-btn"
        >
          <Download className="w-3 h-3" />
          Export CSV
        </button>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: stats.totalToday, label: 'Today', color: 'text-alert-red', trend: '+12.3%', trendColor: 'text-alert-red' },
          { value: stats.detectionAccuracy + '%', label: 'Accuracy', color: 'text-success-green', trend: '+0.4%', trendColor: 'text-success-green' },
          { value: stats.avgProcessingTime, label: 'Latency', color: 'text-cyan-accent', trend: '-3ms', trendColor: 'text-cyan-accent' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-3 text-center">
            <p className={`text-xl font-extrabold ${s.color} font-mono`}>{s.value}</p>
            <p className="text-[9px] text-navy-300 uppercase tracking-[0.12em] mt-0.5">{s.label}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <ArrowUpRight className={`w-3 h-3 ${s.trendColor}`} />
              <span className={`text-[10px] ${s.trendColor} font-medium`}>{s.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Donut Chart with Center Text */}
      <div className="glass-card p-3.5">
        <div className="flex items-center gap-2 mb-3">
          <PieChartIcon className="w-3.5 h-3.5 text-cyan-accent" />
          <span className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.1em]">
            Violation Breakdown
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-[140px] h-[140px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={62}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                  animationBegin={200}
                  animationDuration={1200}
                >
                  {breakdownData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="donut-center-text">
              <p className="text-lg font-extrabold text-white font-mono">{animatedTotal}</p>
              <p className="text-[8px] text-navy-300 uppercase tracking-wider">Total</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            {breakdownData.map((item, idx) => {
              const pct = ((item.value / totalViolations) * 100).toFixed(1);
              return (
                <div key={idx} className="flex items-center gap-2 group cursor-default hover:bg-white/[0.02] rounded px-1 py-0.5 transition-colors">
                  <div
                    className="w-2.5 h-2.5 rounded-sm shrink-0 transition-transform group-hover:scale-125"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-[11px] text-navy-200 truncate flex-1 group-hover:text-white/80 transition-colors">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-mono text-navy-400">{pct}%</span>
                  <span className="text-[11px] font-mono font-semibold text-white/60 w-7 text-right">
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hourly Area Chart */}
      <div className="glass-card p-3.5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-3.5 h-3.5 text-cyan-accent" />
          <span className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.1em]">
            Violations by Hour
          </span>
        </div>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="violGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff4444" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ff4444" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="resolvedGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00c853" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00c853" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#4a6085', fontSize: 9 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
                tickLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fill: '#4a6085', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,212,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="violations"
                stroke="#ff4444"
                strokeWidth={2}
                fill="url(#violGrad2)"
                dot={false}
                activeDot={{ r: 4, fill: '#ff4444', stroke: '#020817', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                stroke="#00c853"
                strokeWidth={1.5}
                fill="url(#resolvedGrad2)"
                dot={false}
                activeDot={{ r: 3, fill: '#00c853', stroke: '#020817', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-5 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[3px] bg-alert-red rounded-full" />
            <span className="text-[10px] text-navy-300">Violations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[3px] bg-success-green rounded-full" />
            <span className="text-[10px] text-navy-300">Resolved</span>
          </div>
        </div>
      </div>

      {/* Top Violations Ranking */}
      {topViolations.length > 0 && (
        <div className="glass-card p-3.5 animate-fade-in-scale" style={{ opacity: 0, animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-2.5">
            <Trophy className="w-3.5 h-3.5 text-warning-orange" />
            <span className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.1em]">
              Current Session
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            {topViolations.map(([name, count], idx) => (
              <RankingBar
                key={name}
                name={name}
                count={count}
                maxCount={Math.max(...topViolations.map(t => t[1]))}
                rank={idx + 1}
                delay={idx * 120}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
