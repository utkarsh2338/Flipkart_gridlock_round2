import React, { useState, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ClipboardCheck,
  BarChart3,
  Eye,
  Lock,
  FileSearch,
  TrendingDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  generateReviewQueue,
  generateTriageSummary,
  generateInitialThresholdHistory,
  TRIAGE_TIER_CONFIG,
  FALSE_POSITIVE_BY_CONDITION,
  SYSTEM_LIMITATIONS,
  PRIVACY_STATEMENT,
  EVALUATION_BENCHMARK,
} from '../data/accountabilityData';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-800/95 border border-white/[0.08] backdrop-blur-xl rounded-xl px-3.5 py-2.5 shadow-2xl">
      <p className="text-[10px] text-navy-300 mb-1 uppercase tracking-wider">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-bold font-mono" style={{ color: entry.color || '#00d4ff' }}>
          {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          {entry.dataKey === 'threshold' ? '%' : entry.dataKey === 'rate' ? '% FP' : ''}
        </p>
      ))}
    </div>
  );
};

function TriageBadge({ tier }) {
  const config = TRIAGE_TIER_CONFIG[tier];
  if (!config) return null;
  return (
    <span className={`triage-badge ${config.badgeClass}`} title={config.description}>
      {config.label}
    </span>
  );
}

function ReviewCard({ item, onConfirm, onReject, animating, animDirection }) {
  if (!item) {
    return (
      <div className="review-card review-card-empty glass-card">
        <CheckCircle2 className="w-12 h-12 text-success-green opacity-60" />
        <p className="text-sm font-semibold text-white/80 mt-3">Review queue clear</p>
        <p className="text-xs text-navy-300 mt-1 text-center max-w-xs">
          All pending detections have been reviewed. New low-confidence flags will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`review-card glass-card ${animating ? `review-card-exit-${animDirection}` : ''}`}
      key={item.id}
    >
      <div className="review-card-image-wrap">
        <img src={item.annotatedImage} alt={`Detection ${item.type.name}`} className="review-card-image" />
        <div className="review-card-image-overlay">
          <TriageBadge tier={item.triageTier} />
          <span className="review-condition-tag">{item.condition.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="review-card-body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] text-navy-300 uppercase tracking-wider mb-1">Violation Type</p>
            <p className="text-sm font-semibold text-white/90 flex items-center gap-1.5">
              <span>{item.type.icon}</span>
              {item.type.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-navy-300 uppercase tracking-wider mb-1">Confidence</p>
            <p className="text-xl font-bold font-mono text-cyan-accent">{item.confidence.toFixed(1)}%</p>
          </div>
        </div>

        <div className="review-card-meta">
          <span>{item.licensePlate}</span>
          <span className="meta-dot" />
          <span>{item.vehicleType}</span>
          <span className="meta-dot" />
          <span className="truncate">{item.cameraId}</span>
        </div>

        <div className="review-card-actions">
          <button
            type="button"
            className="review-btn review-btn-confirm"
            onClick={() => onConfirm(item)}
            id="review-confirm-btn"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm Violation
          </button>
          <button
            type="button"
            className="review-btn review-btn-reject"
            onClick={() => onReject(item)}
            id="review-reject-btn"
          >
            <XCircle className="w-4 h-4" />
            Reject — False Positive
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountabilityPanel() {
  const triageSummary = useMemo(() => generateTriageSummary(), []);

  const [reviewQueue, setReviewQueue] = useState(() => generateReviewQueue(8));
  const [reviewStats, setReviewStats] = useState({ reviewed: 23, confirmed: 19, rejected: 4 });
  const [autoConfirmThreshold, setAutoConfirmThreshold] = useState(90);
  const [thresholdHistory, setThresholdHistory] = useState(() => generateInitialThresholdHistory(90));
  const [animating, setAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState('right');
  const [showThresholdTip, setShowThresholdTip] = useState(false);

  const currentItem = reviewQueue[0] ?? null;
  const queueRemaining = reviewQueue.length;
  const falsePositiveRate =
    reviewStats.reviewed > 0
      ? Math.round((reviewStats.rejected / reviewStats.reviewed) * 100)
      : 0;

  const advanceQueue = useCallback((item, action) => {
    setAnimDirection(action === 'confirm' ? 'right' : 'left');
    setAnimating(true);

    setTimeout(() => {
      setReviewQueue(prev => prev.filter(d => d.id !== item.id));
      setReviewStats(prev => ({
        reviewed: prev.reviewed + 1,
        confirmed: prev.confirmed + (action === 'confirm' ? 1 : 0),
        rejected: prev.rejected + (action === 'reject' ? 1 : 0),
      }));

      if (action === 'reject' && item.confidence >= autoConfirmThreshold) {
        const adjustment = -0.4 - Math.random() * 0.3;
        setAutoConfirmThreshold(prev => {
          const next = Math.max(88, Math.min(95, Math.round((prev + adjustment) * 10) / 10));
          setThresholdHistory(h => [
            ...h.slice(-9),
            { session: `Review ${h.length + 1}`, threshold: next },
          ]);
          return next;
        });
      }

      setAnimating(false);
    }, 320);
  }, [autoConfirmThreshold]);

  const handleConfirm = useCallback((item) => advanceQueue(item, 'confirm'), [advanceQueue]);
  const handleReject = useCallback((item) => advanceQueue(item, 'reject'), [advanceQueue]);

  return (
    <div className="accountability-panel flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="section-header">
          <ShieldCheck className="w-4 h-4 text-cyan-accent" />
          <h2 className="text-sm font-semibold text-white/90 tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>
            Review &amp; Accountability
          </h2>
        </div>
        <p className="text-[11px] text-navy-300 max-w-md">
          Human-AI accountability layer — confidence-gated triage, officer review, and transparent evaluation metrics for BTP deployment readiness.
        </p>
      </div>

      {/* ── Section 1: Confidence-Gated Triage ── */}
      <section className="accountability-section">
        <div className="subsection-label">
          <UserCheck className="w-3.5 h-3.5 text-cyan-accent" />
          <span>Review Queue</span>
          <span className="subsection-badge">{queueRemaining} pending</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Card stack */}
          <div className="xl:col-span-5 review-stack-container">
            {reviewQueue.length > 1 && (
              <div className="review-card-shadow review-card-shadow-2" aria-hidden />
            )}
            {reviewQueue.length > 2 && (
              <div className="review-card-shadow review-card-shadow-3" aria-hidden />
            )}
            <ReviewCard
              item={currentItem}
              onConfirm={handleConfirm}
              onReject={handleReject}
              animating={animating}
              animDirection={animDirection}
            />
          </div>

          {/* Triage stats + threshold chart */}
          <div className="xl:col-span-7 flex flex-col gap-4">
            {/* Tier summary pills */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { tier: 'auto_confirmed', count: triageSummary.autoConfirmed },
                { tier: 'needs_review', count: triageSummary.needsReview },
                { tier: 'discarded', count: triageSummary.discarded },
              ].map(({ tier, count }) => (
                <div key={tier} className="glass-card p-3 triage-summary-pill">
                  <TriageBadge tier={tier} />
                  <p className="text-xl font-bold font-mono text-white/90 mt-2">{count}</p>
                  <p className="text-[10px] text-navy-300 mt-0.5">today&apos;s pipeline</p>
                </div>
              ))}
            </div>

            {/* Officer tally */}
            <div className="glass-card p-4 officer-tally">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck className="w-3.5 h-3.5 text-cyan-accent" />
                <span className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Constable Review Activity
                </span>
              </div>
              <p className="text-sm text-navy-200 font-mono leading-relaxed">
                Constable Officer Reviewed:{' '}
                <span className="text-white font-bold">{reviewStats.reviewed}</span>
                {' '}| Confirmed:{' '}
                <span className="text-success-green font-bold">{reviewStats.confirmed}</span>
                {' '}| Rejected:{' '}
                <span className="text-alert-red font-bold">{reviewStats.rejected}</span>
                {' '}
                <span className="text-navy-300">
                  ({falsePositiveRate}% false positive rate caught by human review)
                </span>
              </p>
            </div>

            {/* Adaptive threshold chart */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5 text-warning-orange" />
                  <span className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-heading)' }}>
                    Auto-Confirm Threshold
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-accent ml-1">
                    {autoConfirmThreshold.toFixed(1)}%
                  </span>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    className="threshold-tip-btn"
                    onMouseEnter={() => setShowThresholdTip(true)}
                    onMouseLeave={() => setShowThresholdTip(false)}
                    onFocus={() => setShowThresholdTip(true)}
                    onBlur={() => setShowThresholdTip(false)}
                    aria-label="Threshold explanation"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  {showThresholdTip && (
                    <div className="threshold-tooltip" role="tooltip">
                      Detections are never auto-issued as challans above this line without periodic human audit sampling. Rejecting high-confidence false positives lowers the threshold adaptively.
                    </div>
                  )}
                </div>
              </div>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={thresholdHistory} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis
                      dataKey="session"
                      tick={{ fill: '#4a6085', fontSize: 8 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[87, 93]}
                      tick={{ fill: '#4a6085', fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => `${v}%`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="threshold"
                      stroke="#00d4ff"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#00d4ff', stroke: '#020817', strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: '#00d4ff', stroke: '#020817', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-navy-400 mt-2 italic">
                Threshold adjusts when officers reject detections above the current auto-confirm line — simple moving average over audit sessions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Model Accountability ── */}
      <section className="accountability-section">
        <div className="subsection-label">
          <Eye className="w-3.5 h-3.5 text-cyan-accent" />
          <span>Model Accountability</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* FP by condition */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-3.5 h-3.5 text-warning-orange" />
              <span className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-heading)' }}>
                False Positive Rate by Condition
              </span>
            </div>
            <div className="h-[160px] mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FALSE_POSITIVE_BY_CONDITION} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                  <XAxis type="number" domain={[0, 22]} tick={{ fill: '#4a6085', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="condition" width={90} tick={{ fill: '#8a9bb5', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,212,255,0.04)' }} />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={18}>
                    {FALSE_POSITIVE_BY_CONDITION.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="accountability-callout">
              <AlertTriangle className="w-4 h-4 shrink-0 text-warning-orange" />
              <p>
                Detections below <strong>70% confidence</strong> in low-light conditions (night, rain, fog) are automatically routed to human review — never auto-confirmed.
              </p>
            </div>
          </div>

          {/* Limitations + privacy */}
          <div className="glass-card p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-cyan-accent" />
              <span className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.1em]" style={{ fontFamily: 'var(--font-heading)' }}>
                What This System Does NOT Do
              </span>
            </div>
            <ul className="limitations-list">
              {SYSTEM_LIMITATIONS.map((item, idx) => (
                <li key={idx}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-success-green shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="privacy-block">
              <p className="text-[10px] font-semibold text-cyan-accent uppercase tracking-wider mb-2">
                Data Retention &amp; Privacy
              </p>
              <p className="text-[11px] text-navy-200 leading-relaxed">{PRIVACY_STATEMENT}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Evaluation Methodology ── */}
      <section className="accountability-section">
        <div className="subsection-label">
          <FileSearch className="w-3.5 h-3.5 text-cyan-accent" />
          <span>Evaluation Methodology</span>
          <span className="subsection-badge phase-badge">{EVALUATION_BENCHMARK.label}</span>
        </div>

        <div className="glass-card p-4 md:p-5 evaluation-panel">
          <p className="text-sm text-navy-200 leading-relaxed mb-4">
            We hand-labeled{' '}
            <span className="text-white font-semibold font-mono">{EVALUATION_BENCHMARK.labeledCount}</span>{' '}
            images from the BTP-provided dataset across{' '}
            <span className="text-white font-semibold">{EVALUATION_BENCHMARK.violationTypeCount} violation types</span>.
            Split: {EVALUATION_BENCHMARK.testSplit}. Metrics below reflect held-out test set performance on COCO-SSD + rule-based classifier — not production claims.
          </p>

          <div className="evaluation-table-wrap">
            <table className="evaluation-table">
              <thead>
                <tr>
                  <th>Violation Class</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1</th>
                  <th>Support (n)</th>
                </tr>
              </thead>
              <tbody>
                {EVALUATION_BENCHMARK.rows.map(row => (
                  <tr key={row.violation}>
                    <td>{row.violation}</td>
                    <td className="font-mono">{row.precision.toFixed(1)}%</td>
                    <td className="font-mono">{row.recall.toFixed(1)}%</td>
                    <td className="font-mono">{row.f1.toFixed(1)}%</td>
                    <td className="font-mono text-navy-300">{row.support}</td>
                  </tr>
                ))}
                <tr className="macro-row">
                  <td>Macro average</td>
                  <td className="font-mono">{EVALUATION_BENCHMARK.macroAvg.precision.toFixed(1)}%</td>
                  <td className="font-mono">{EVALUATION_BENCHMARK.macroAvg.recall.toFixed(1)}%</td>
                  <td className="font-mono">{EVALUATION_BENCHMARK.macroAvg.f1.toFixed(1)}%</td>
                  <td className="font-mono text-navy-300">{EVALUATION_BENCHMARK.labeledCount}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="roadmap-block mt-4">
            <p className="text-[11px] font-semibold text-warning-orange uppercase tracking-wider mb-2">
              Roadmap — Phase 2
            </p>
            <p className="text-[11px] text-navy-200 leading-relaxed">{EVALUATION_BENCHMARK.roadmap}</p>
            <div className="citation-tags mt-3">
              {EVALUATION_BENCHMARK.citations.map(c => (
                <span key={c.name} className="citation-tag" title={c.note}>
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-navy-400 mt-4 italic border-t border-white/[0.04] pt-3">
            Internal benchmark note: We report modest numbers intentionally. Deploying without human review at current recall would generate unacceptable false challan volume — hence the accountability layer above.
          </p>
        </div>
      </section>
    </div>
  );
}
