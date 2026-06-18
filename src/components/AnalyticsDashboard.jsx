import React, { useMemo, useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  Area, AreaChart, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  Download,
  Clock,
  Trophy,
  AlertTriangle,
  Camera,
  Gauge,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { generateHourlyData, generateViolationBreakdown } from '../data/mockData';

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

function KpiCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="glass-card-premium analytics-kpi">
      <div className="analytics-kpi-icon" style={{ color: accent, borderColor: `${accent}30` }}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="analytics-kpi-value" style={{ color: accent }}>{value}</p>
        <p className="analytics-kpi-label">{label}</p>
      </div>
    </div>
  );
}

function RankingBar({ name, count, maxCount, rank, delay }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const pct = (count / maxCount) * 100;
  const rankClass = rank === 1 ? 'rank-gold' : rank === 2 ? 'rank-silver' : rank === 3 ? 'rank-bronze' : '';

  return (
    <div className="flex items-center gap-3 py-1.5 group cursor-default hover:bg-white/[0.02] rounded-lg px-1 transition-colors">
      <span className={`text-xs font-extrabold font-mono w-5 shrink-0 ${rankClass || 'text-navy-400'}`}>
        #{rank}
      </span>
      <span className="text-[11px] text-navy-200 w-36 lg:w-44 shrink-0 truncate group-hover:text-white/80 transition-colors">
        {name}
      </span>
      <div className="flex-1 h-2.5 bg-white/[0.04] rounded-full overflow-hidden min-w-[80px]">
        <div
          className="h-full bg-gradient-to-r from-warning-orange to-alert-red rounded-full transition-all duration-700 group-hover:shadow-[0_0_8px_rgba(255,140,0,0.3)]"
          style={{
            width: mounted ? `${pct}%` : '0%',
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
      <span className="text-xs font-mono font-bold text-white/70 w-8 text-right shrink-0">
        {count}
      </span>
    </div>
  );
}

function TopOffenders({ violations }) {
  const plateCounts = useMemo(() => {
    const counts = {};
    violations.forEach(v => {
      const plate = v.licensePlate || 'Unknown';
      counts[plate] = (counts[plate] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [violations]);

  return (
    <div className="glass-card p-4 md:p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-3.5 h-3.5 text-alert-red" />
        <span className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-heading)' }}>
          Top Offenders
        </span>
      </div>
      {plateCounts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <AlertTriangle className="w-8 h-8 text-navy-500 mb-2 opacity-50" />
          <p className="text-xs text-navy-400">No session violations yet</p>
          <p className="text-[10px] text-navy-500 mt-1">Upload an image on Dashboard to populate</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 flex-1">
          {plateCounts.map(([plate, count], idx) => {
            const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-default';
            const countClass = count >= 5 ? 'high' : 'medium';
            return (
              <div key={plate} className="top-offender-item">
                <div className={`offender-rank ${rankClass}`}>{idx + 1}</div>
                <div className="offender-plate">{plate}</div>
                <div className={`offender-count-badge ${countClass}`}>
                  <span className="text-sm font-bold">{count}</span>
                  <span className="offender-count-label">Violations</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
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

  const peakHour = useMemo(() => {
    const peak = hourlyData.reduce((best, h) => (h.violations > best.violations ? h : best), hourlyData[0]);
    return peak?.hour ?? '—';
  }, [hourlyData]);

  return (
    <div className="analytics-dashboard w-full flex flex-col gap-5 md:gap-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="section-header">
          <BarChart3 className="w-4 h-4 text-cyan-accent" />
          <h2 className="text-sm font-semibold text-white/90 tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>
            Traffic Analytics
          </h2>
        </div>
        <button
          className="btn-secondary btn-glow flex items-center gap-1.5 text-xs self-start sm:self-auto"
          onClick={onExportCSV}
          id="export-csv-btn"
        >
          <Download className="w-3 h-3" />
          Export CSV
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard icon={TrendingUp} label="Violations Today" value={stats?.totalToday?.toLocaleString() ?? '—'} accent="#00d4ff" />
        <KpiCard icon={Receipt} label="Challans Issued" value={stats?.challansIssued?.toLocaleString() ?? '—'} accent="#00c853" />
        <KpiCard icon={Camera} label="Active Cameras" value={stats?.camerasActive ?? '—'} accent="#ff8c00" />
        <KpiCard icon={Gauge} label="Avg Latency" value={stats?.avgProcessingTime ?? '—'} accent="#ab47bc" />
      </div>

      {/* Full-width hourly chart */}
      <div className="glass-card-premium p-4 md:p-5 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-accent" />
            <span className="text-xs font-semibold text-white/80 uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-heading)' }}>
              Violations by Hour — 24h Trend
            </span>
          </div>
          <span className="text-[10px] text-navy-400 font-mono">
            Peak: <span className="text-warning-orange font-semibold">{peakHour}</span>
          </span>
        </div>
        <div className="analytics-chart-hourly w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#4a6085', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fill: '#4a6085', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,212,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="violations"
                stroke="#ff4444"
                strokeWidth={2.5}
                fill="url(#violGrad2)"
                dot={false}
                activeDot={{ r: 5, fill: '#ff4444', stroke: '#020817', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                stroke="#00c853"
                strokeWidth={2}
                fill="url(#resolvedGrad2)"
                dot={false}
                activeDot={{ r: 4, fill: '#00c853', stroke: '#020817', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-[3px] bg-alert-red rounded-full" />
            <span className="text-[10px] text-navy-300">Violations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-[3px] bg-success-green rounded-full" />
            <span className="text-[10px] text-navy-300">Resolved</span>
          </div>
        </div>
      </div>

      {/* Breakdown + side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 w-full">
        {/* Donut — spans 7 cols */}
        <div className="lg:col-span-7 glass-card-premium p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-cyan-accent" />
            <span className="text-xs font-semibold text-white/80 uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-heading)' }}>
              Violation Breakdown
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            <div className="analytics-donut-wrap relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius="58%"
                    outerRadius="88%"
                    paddingAngle={2}
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
              <div className="donut-center-text">
                <p className="text-3xl font-extrabold font-mono" style={{ color: 'var(--color-cyan-accent)' }}>{animatedTotal}</p>
                <p className="text-[9px] text-navy-300 uppercase tracking-[0.15em] font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Total</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 flex-1 w-full min-w-0">
              {breakdownData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 group cursor-default hover:bg-white/[0.02] rounded-lg px-2 py-1.5 transition-colors">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 transition-transform group-hover:scale-125"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs text-navy-200 truncate flex-1 group-hover:text-white/80 transition-colors">
                    {item.name}
                  </span>
                  <span className="text-xs font-mono font-semibold text-white/70 shrink-0">
                    {item.value}
                  </span>
                  <span className="text-[10px] font-mono text-navy-500 shrink-0 w-10 text-right">
                    {((item.value / totalViolations) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top offenders — 5 cols */}
        <div className="lg:col-span-5">
          <TopOffenders violations={violations} />
        </div>
      </div>

      {/* Session rankings — full width */}
      <div className="glass-card-premium p-4 md:p-5 w-full">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-warning-orange" />
          <span className="text-xs font-semibold text-white/80 uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-heading)' }}>
            Current Session — Violation Rankings
          </span>
        </div>
        {topViolations.length === 0 ? (
          <p className="text-xs text-navy-400 text-center py-6">No violations detected in this session yet.</p>
        ) : (
          <div className="flex flex-col gap-1 w-full">
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
        )}
      </div>
    </div>
  );
}
