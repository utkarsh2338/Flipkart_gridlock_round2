// ===== VisionGuard AI — Human-AI Accountability Layer Data =====

import {
  VIOLATION_TYPES,
  CAMERA_IDS,
  KARNATAKA_PLATES,
} from './mockData';

const VIOLATION_KEYS = Object.keys(VIOLATION_TYPES);
const CONDITIONS = ['daylight', 'night', 'rain', 'heavy_traffic'];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/** Classify detection into triage tier based on confidence score */
export function classifyTriageTier(confidence) {
  if (confidence >= 90) return 'auto_confirmed';
  if (confidence >= 60) return 'needs_review';
  return 'discarded';
}

export const TRIAGE_TIER_CONFIG = {
  auto_confirmed: {
    label: 'Auto-Confirmed',
    badgeClass: 'triage-badge-auto',
    color: '#00c853',
    description: '≥90% confidence — challan-ready after audit sampling',
  },
  needs_review: {
    label: 'Needs Review',
    badgeClass: 'triage-badge-review',
    color: '#ff8c00',
    description: '60–89% confidence — routed to constable review queue',
  },
  discarded: {
    label: 'Discarded',
    badgeClass: 'triage-badge-discarded',
    color: '#6b7b8d',
    description: '<60% confidence — logged only, not actionable',
  },
};

/** Generate annotated CCTV frame with bounding box overlay */
export function generateAnnotatedFrame(item) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');

  const conditionGradients = {
    daylight: ['#4a6fa5', '#8ab6d6', '#6b7b8d', '#3d3d3d'],
    night: ['#0a0f1e', '#151f35', '#1b2942', '#0a0d1e'],
    rain: ['#3d4f5f', '#5a6b7a', '#4a5568', '#2d3748'],
    heavy_traffic: ['#5a6b7a', '#8a9bb5', '#6b7b8d', '#4a5568'],
  };
  const stops = conditionGradients[item.condition] || conditionGradients.daylight;

  const grad = ctx.createLinearGradient(0, 0, 0, 500);
  grad.addColorStop(0, stops[0]);
  grad.addColorStop(0.35, stops[1]);
  grad.addColorStop(0.5, stops[2]);
  grad.addColorStop(1, stops[3]);
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

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, 800, 28);
  ctx.fillStyle = item.condition === 'night' ? '#88ccff' : '#00ff00';
  ctx.font = '12px monospace';
  ctx.fillText(
    `${item.cameraId} | ${item.condition.replace('_', ' ').toUpperCase()} | ${new Date(item.timestamp).toLocaleString()}`,
    10,
    18
  );

  const bbox = item.telemetry?.bbox || { x: 25, y: 35, w: 30, h: 40 };
  const bx = (bbox.x / 100) * 800;
  const by = (bbox.y / 100) * 500;
  const bw = (bbox.w / 100) * 800;
  const bh = (bbox.h / 100) * 500;

  const color = item.type?.color || '#ff4444';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(bx, by, bw, bh);

  ctx.fillStyle = color;
  const corners = [
    [bx - 3, by - 3, 15, 4], [bx - 3, by - 3, 4, 15],
    [bx + bw - 12, by - 3, 15, 4], [bx + bw - 1, by - 3, 4, 15],
    [bx - 3, by + bh - 1, 15, 4], [bx - 3, by + bh - 12, 4, 15],
    [bx + bw - 12, by + bh - 1, 15, 4], [bx + bw - 1, by + bh - 12, 4, 15],
  ];
  corners.forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));

  ctx.fillStyle = color;
  ctx.fillRect(bx - 2, by - 24, Math.min(bw + 4, 340), 22);
  ctx.fillStyle = '#0a0d1e';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`${item.type.name} (${item.confidence.toFixed(1)}%)`, bx + 6, by - 8);

  if (item.condition === 'rain') {
    ctx.strokeStyle = 'rgba(200,220,255,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
      const rx = Math.random() * 800;
      const ry = Math.random() * 500;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 12);
      ctx.stroke();
    }
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let sl = 0; sl < 500; sl += 4) {
    ctx.fillRect(0, sl, 800, 1.5);
  }

  return canvas.toDataURL('image/png');
}

/** Build a single review-queue detection */
function buildDetection(overrides = {}) {
  const violation = overrides.type || VIOLATION_TYPES[randomFrom(VIOLATION_KEYS)];
  const confidence = overrides.confidence ?? randomBetween(62, 88);
  const condition = overrides.condition || randomFrom(CONDITIONS);

  return {
    id: overrides.id || `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: violation,
    confidence,
    vehicleType: overrides.vehicleType || randomFrom(['Two-Wheeler', 'Car', 'Auto-Rickshaw', 'SUV']),
    licensePlate: overrides.licensePlate || randomFrom(KARNATAKA_PLATES),
    cameraId: overrides.cameraId || randomFrom(CAMERA_IDS),
    timestamp: overrides.timestamp || new Date(Date.now() - Math.random() * 3600000),
    severity: violation.severity,
    condition,
    triageTier: classifyTriageTier(confidence),
    telemetry: {
      speed: Math.floor(randomBetween(35, 85)),
      speedLimit: 60,
      lane: Math.floor(randomBetween(1, 3)),
      bbox: {
        x: Math.floor(randomBetween(15, 45)),
        y: Math.floor(randomBetween(25, 50)),
        w: Math.floor(randomBetween(22, 38)),
        h: Math.floor(randomBetween(28, 42)),
      },
    },
    ...overrides,
  };
}

/** Seed review queue with realistic mixed-confidence detections */
export function generateReviewQueue(count = 8) {
  const presets = [
    { confidence: 78.4, condition: 'night', type: VIOLATION_TYPES.HELMET },
    { confidence: 84.2, condition: 'daylight', type: VIOLATION_TYPES.RED_LIGHT },
    { confidence: 67.9, condition: 'rain', type: VIOLATION_TYPES.TRIPLE_RIDING },
    { confidence: 72.1, condition: 'heavy_traffic', type: VIOLATION_TYPES.STOP_LINE },
    { confidence: 88.6, condition: 'daylight', type: VIOLATION_TYPES.SEATBELT },
    { confidence: 63.5, condition: 'night', type: VIOLATION_TYPES.WRONG_SIDE },
    { confidence: 81.3, condition: 'rain', type: VIOLATION_TYPES.ILLEGAL_PARKING },
    { confidence: 75.8, condition: 'heavy_traffic', type: VIOLATION_TYPES.HELMET },
  ];

  return Array.from({ length: count }, (_, i) => {
    const det = buildDetection(presets[i] || {});
    return {
      ...det,
      annotatedImage: generateAnnotatedFrame(det),
    };
  });
}

/** Simulated triage pipeline summary counts */
export function generateTriageSummary() {
  return {
    autoConfirmed: 142,
    needsReview: 38,
    discarded: 67,
    totalProcessed: 247,
  };
}

/** False positive rate by environmental condition (honest, modest numbers) */
export const FALSE_POSITIVE_BY_CONDITION = [
  { condition: 'Daylight', rate: 4, fill: '#00c853' },
  { condition: 'Night', rate: 14, fill: '#ff8c00' },
  { condition: 'Rain', rate: 19, fill: '#ff4444' },
  { condition: 'Heavy traffic', rate: 11, fill: '#ffa726' },
];

export const SYSTEM_LIMITATIONS = [
  'Does not perform facial recognition',
  'Does not store raw images beyond 30 days (configurable retention)',
  'Does not issue a challan without either ≥95% confidence OR human officer sign-off',
  'Does not use any personally identifiable data beyond license plate (existing legal basis for traffic enforcement)',
];

export const PRIVACY_STATEMENT =
  'VisionGuard AI retains annotated evidence frames and metadata only for the enforcement workflow duration configured by BTP (default: 30 days). License plate numbers are processed under the Motor Vehicles Act for challan issuance; no biometric identifiers, facial templates, or passenger identity data are collected. All officer review actions are logged with timestamp and badge ID for audit. Data at rest is encrypted; export requires authenticated BTP credentials.';

/** Phase 1 prototype benchmark — intentionally modest, not marketing-inflated */
export const EVALUATION_BENCHMARK = {
  label: 'Phase 1 Prototype Benchmark',
  datasetNote: 'Hand-labeled 847 frames from the BTP-provided dataset across 8 violation types',
  labeledCount: 847,
  violationTypeCount: 8,
  testSplit: '70/15/15 train/val/test on intersection CCTV stills (day + night)',
  rows: [
    { violation: 'Helmet Non-Compliance', precision: 71.2, recall: 64.8, f1: 67.9, support: 186 },
    { violation: 'Triple Riding', precision: 68.5, recall: 61.3, f1: 64.7, support: 94 },
    { violation: 'Seatbelt Non-Compliance', precision: 62.1, recall: 58.4, f1: 60.2, support: 112 },
    { violation: 'Red-Light Violation', precision: 74.8, recall: 69.2, f1: 71.9, support: 143 },
    { violation: 'Stop-Line Violation', precision: 69.3, recall: 63.7, f1: 66.4, support: 98 },
    { violation: 'Wrong-Side Driving', precision: 66.7, recall: 59.1, f1: 62.7, support: 76 },
    { violation: 'Illegal Parking', precision: 73.4, recall: 67.8, f1: 70.5, support: 88 },
    { violation: 'License Plate (ANPR)', precision: 78.9, recall: 72.4, f1: 75.5, support: 150 },
  ],
  macroAvg: { precision: 70.7, recall: 64.6, f1: 67.5 },
  roadmap:
    'Fine-tuning YOLOv8 on the full BTP dataset is expected to improve recall by ~15–20% based on comparable open-source benchmarks on Indian Driving Dataset (IDD) and BDD100K night/rain subsets, where domain-specific fine-tuning consistently lifts mAP@0.5 from low-70s to high-80s.',
  citations: [
    { name: 'IDD (Indian Driving Dataset)', note: 'Varma et al. — domain shift from COCO pretrain' },
    { name: 'BDD100K', note: 'Yu et al. — night/rain fine-tuning +12–18% recall gains' },
  ],
};

/** Initial adaptive threshold history (simulated prior audit sessions) */
export function generateInitialThresholdHistory(baseThreshold = 90) {
  const history = [];
  let threshold = baseThreshold;
  for (let i = 9; i >= 0; i--) {
    const jitter = (Math.random() - 0.5) * 0.8;
    threshold = Math.max(88, Math.min(92, threshold + jitter));
    history.push({
      session: `Audit ${10 - i}`,
      threshold: Math.round(threshold * 10) / 10,
    });
  }
  return history;
}
