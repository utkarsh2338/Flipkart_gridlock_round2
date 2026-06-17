// ===== VisionGuard AI — Simulated Detection Data =====

const KARNATAKA_PLATES = [
  'KA 01 AB 1234', 'KA 02 CD 5678', 'KA 03 EF 9012', 'KA 04 GH 3456',
  'KA 05 MX 4821', 'KA 09 JK 7890', 'KA 12 LM 2345', 'KA 14 NP 6789',
  'KA 19 QR 0123', 'KA 22 ST 4567', 'KA 41 UV 8901', 'KA 50 WX 2345',
  'KA 51 YZ 6789', 'KA 53 AB 0124', 'KA 55 CD 4568', 'KA 03 MH 9921',
];

const CAMERA_IDS = [
  'CAM-001 Silk Board Junction',
  'CAM-007 Hebbal Flyover',
  'CAM-012 KR Puram Signal',
  'CAM-018 MG Road',
  'CAM-023 Marathahalli Bridge',
  'CAM-029 Electronic City Phase 1',
  'CAM-034 Tin Factory',
  'CAM-039 Yeshwanthpur Circle',
  'CAM-042 Koramangala 5th Block',
  'CAM-048 Jayanagar 4th Block',
  'CAM-055 Whitefield Main Road',
  'CAM-061 Banashankari Circle',
];

export const VIOLATION_TYPES = {
  HELMET: {
    id: 'helmet',
    name: 'Helmet Non-Compliance',
    icon: '🪖',
    severity: 'high',
    color: '#ff4444',
    description: 'Two-wheeler rider/pillion without helmet',
  },
  SEATBELT: {
    id: 'seatbelt',
    name: 'Seatbelt Non-Compliance',
    icon: '🔗',
    severity: 'high',
    color: '#ff4444',
    description: 'Driver/passenger without seatbelt',
  },
  TRIPLE_RIDING: {
    id: 'triple_riding',
    name: 'Triple Riding',
    icon: '👥',
    severity: 'high',
    color: '#ff4444',
    description: 'More than 2 persons on a two-wheeler',
  },
  WRONG_SIDE: {
    id: 'wrong_side',
    name: 'Wrong-Side Driving',
    icon: '↩️',
    severity: 'high',
    color: '#ff4444',
    description: 'Vehicle driving against traffic flow',
  },
  STOP_LINE: {
    id: 'stop_line',
    name: 'Stop-Line Violation',
    icon: '⛔',
    severity: 'medium',
    color: '#ff8c00',
    description: 'Vehicle crossed stop line during red signal',
  },
  RED_LIGHT: {
    id: 'red_light',
    name: 'Red-Light Violation',
    icon: '🚦',
    severity: 'high',
    color: '#ff4444',
    description: 'Vehicle passed intersection on red signal',
  },
  ILLEGAL_PARKING: {
    id: 'illegal_parking',
    name: 'Illegal Parking',
    icon: '🅿️',
    severity: 'medium',
    color: '#ff8c00',
    description: 'Vehicle parked in no-parking zone',
  },
};

const VEHICLE_TYPES = ['Two-Wheeler', 'Car', 'Auto-Rickshaw', 'Bus', 'Truck', 'SUV'];

const VIOLATION_KEYS = Object.keys(VIOLATION_TYPES);

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generateTimestamp() {
  const now = new Date();
  const offset = Math.floor(Math.random() * 3600000); // within last hour
  return new Date(now.getTime() - offset);
}

// Generate bounding boxes that simulate realistic traffic detections
export function generateBoundingBoxes(imgWidth, imgHeight) {
  const boxes = [];
  const numDetections = Math.floor(randomBetween(2, 5));

  for (let i = 0; i < numDetections; i++) {
    const w = randomBetween(imgWidth * 0.12, imgWidth * 0.28);
    const h = randomBetween(imgHeight * 0.15, imgHeight * 0.35);
    const x = randomBetween(imgWidth * 0.05, imgWidth * 0.7);
    const y = randomBetween(imgHeight * 0.15, imgHeight * 0.55);

    const isViolation = Math.random() > 0.3;
    const violationType = isViolation ? VIOLATION_TYPES[randomFrom(VIOLATION_KEYS)] : null;
    const vehicleType = randomFrom(VEHICLE_TYPES);

    boxes.push({
      id: `det-${Date.now()}-${i}`,
      x, y, w, h,
      type: isViolation ? 'violation' : 'vehicle',
      label: isViolation ? violationType.name : vehicleType,
      shortLabel: isViolation
        ? violationType.name.replace(' Non-Compliance', '').replace(' Violation', '')
        : vehicleType,
      color: isViolation ? violationType.color : '#00c853',
      vehicleType,
      confidence: isViolation ? randomBetween(85, 99) : randomBetween(90, 99.5),
      violation: violationType,
    });

    // Add license plate box for some detections
    if (Math.random() > 0.4) {
      const plateW = w * 0.45;
      const plateH = h * 0.12;
      const plateX = x + (w - plateW) / 2;
      const plateY = y + h * 0.72;
      boxes.push({
        id: `plate-${Date.now()}-${i}`,
        x: plateX, y: plateY, w: plateW, h: plateH,
        type: 'plate',
        label: randomFrom(KARNATAKA_PLATES),
        shortLabel: randomFrom(KARNATAKA_PLATES),
        color: '#ffd600',
        vehicleType,
        confidence: randomBetween(88, 99),
        violation: null,
      });
    }
  }

  return boxes;
}

// Generate violation results from bounding boxes
export function generateViolationResults(boxes) {
  return boxes
    .filter(b => b.type === 'violation')
    .map((b, idx) => {
      const associatedPlate = boxes.find(
        p => p.type === 'plate' && Math.abs(p.x - b.x) < b.w
      );
      return {
        id: `viol-${Date.now()}-${idx}`,
        type: b.violation,
        confidence: b.confidence,
        vehicleType: b.vehicleType,
        licensePlate: associatedPlate ? associatedPlate.label : randomFrom(KARNATAKA_PLATES),
        timestamp: generateTimestamp(),
        cameraId: randomFrom(CAMERA_IDS),
        boxId: b.id,
        severity: b.violation.severity,
      };
    });
}

// Generate a single live detection event for the ticker
export function generateLiveEvent() {
  const violation = VIOLATION_TYPES[randomFrom(VIOLATION_KEYS)];
  const camera = randomFrom(CAMERA_IDS);
  return {
    id: `live-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    text: `${camera}: ${violation.icon} ${violation.name} detected`,
    severity: violation.severity,
    timestamp: new Date(),
  };
}

// Hourly violation distribution (simulated)
export function generateHourlyData() {
  const hours = [];
  for (let h = 0; h < 24; h++) {
    const label = `${h.toString().padStart(2, '0')}:00`;
    // Peak hours have more violations
    const isPeak = (h >= 8 && h <= 10) || (h >= 17 && h <= 20);
    const base = isPeak ? 35 : 8;
    hours.push({
      hour: label,
      violations: Math.floor(base + Math.random() * (isPeak ? 25 : 15)),
      resolved: Math.floor(base * 0.7 + Math.random() * 10),
    });
  }
  return hours;
}

// Violation type breakdown for donut chart
export function generateViolationBreakdown() {
  return [
    { name: 'Helmet', value: 342, fill: '#ff4444' },
    { name: 'Red Light', value: 186, fill: '#ff6b6b' },
    { name: 'Triple Riding', value: 124, fill: '#ff8c00' },
    { name: 'Wrong Side', value: 98, fill: '#ffa726' },
    { name: 'Stop Line', value: 76, fill: '#ffca28' },
    { name: 'Seatbelt', value: 67, fill: '#ab47bc' },
    { name: 'Illegal Parking', value: 52, fill: '#7c4dff' },
  ];
}

// Preprocessing step labels
export const PREPROCESSING_STEPS = [
  { label: 'Noise reduction (BM3D)', delay: 400 },
  { label: 'CLAHE contrast enhancement', delay: 700 },
  { label: 'Motion deblur (Wiener filter)', delay: 1000 },
  { label: 'White balance correction', delay: 1200 },
  { label: 'Resolution upscaling (ESRGAN)', delay: 1500 },
];

// Summary stats
export function generateSummaryStats() {
  return {
    totalToday: 945,
    totalThisWeek: 6234,
    mostCommon: 'Helmet Non-Compliance',
    detectionAccuracy: 96.3,
    avgProcessingTime: '47ms',
    camerasActive: 48,
    challansIssued: 723,
    revenueToday: '₹4,33,800',
  };
}

// Generate a larger historical archive set (25 entries)
export function generateHistoricalArchive() {
  const archive = [];
  const now = new Date();
  
  const statuses = ['Pending', 'Challan Sent', 'Paid', 'Dismissed'];
  for (let i = 0; i < 25; i++) {
    const violation = VIOLATION_TYPES[randomFrom(VIOLATION_KEYS)];
    const vehicleType = randomFrom(VEHICLE_TYPES);
    const licensePlate = randomFrom(KARNATAKA_PLATES);
    const cameraId = randomFrom(CAMERA_IDS);
    
    // Generate timestamp spanning back 7 days
    const daysAgo = randomBetween(0.05, 7);
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Status distribution
    let status = 'Pending';
    const rand = Math.random();
    if (rand > 0.7) status = 'Paid';
    else if (rand > 0.3) status = 'Challan Sent';
    else if (rand > 0.95) status = 'Dismissed';

    archive.push({
      id: `viol-hist-${10000 + i}-${Math.floor(Math.random() * 1000)}`,
      type: violation,
      confidence: randomBetween(75, 99.5),
      vehicleType,
      licensePlate,
      timestamp,
      cameraId,
      severity: violation.severity,
      status,
      // Simulated frame telemetry
      telemetry: {
        speed: Math.floor(randomBetween(35, 95)),
        speedLimit: 60,
        lane: Math.floor(randomBetween(1, 4)),
        bbox: {
          x: Math.floor(randomBetween(10, 50)),
          y: Math.floor(randomBetween(25, 55)),
          w: Math.floor(randomBetween(20, 35)),
          h: Math.floor(randomBetween(30, 45)),
        }
      }
    });
  }
  
  return archive.sort((a, b) => b.timestamp - a.timestamp);
}
