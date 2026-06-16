// ===== VisionGuard AI — Real COCO-SSD Detection Engine =====
import { VIOLATION_TYPES } from './mockData';

// Only keep these COCO-SSD classes for traffic analysis
const TRAFFIC_CLASSES = ['person', 'car', 'motorcycle', 'truck', 'bus', 'bicycle'];

const KARNATAKA_PLATES = [
  'KA 01 AB 1234', 'KA 02 CD 5678', 'KA 03 EF 9012', 'KA 04 GH 3456',
  'KA 05 MX 4821', 'KA 09 JK 7890', 'KA 12 LM 2345', 'KA 14 NP 6789',
  'KA 19 QR 0123', 'KA 22 ST 4567', 'KA 41 UV 8901', 'KA 50 WX 2345',
];

const CAMERA_IDS = [
  'CAM-001 Silk Board Junction',
  'CAM-007 Hebbal Flyover',
  'CAM-012 KR Puram Signal',
  'CAM-018 MG Road',
  'CAM-023 Marathahalli Bridge',
  'CAM-029 Electronic City Phase 1',
  'CAM-034 Tin Factory',
  'CAM-042 Koramangala 5th Block',
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function bboxOverlap(a, b) {
  const ax2 = a.x + a.w;
  const ay2 = a.y + a.h;
  const bx2 = b.x + b.w;
  const by2 = b.y + b.h;

  const overlapX = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
  const overlapY = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
  return overlapX * overlapY;
}

function bboxDistance(a, b) {
  const aCenterX = a.x + a.w / 2;
  const aCenterY = a.y + a.h / 2;
  const bCenterX = b.x + b.w / 2;
  const bCenterY = b.y + b.h / 2;
  return Math.sqrt((aCenterX - bCenterX) ** 2 + (aCenterY - bCenterY) ** 2);
}

/**
 * Run COCO-SSD detection on an image element.
 * @param {object} model - Loaded COCO-SSD model
 * @param {HTMLImageElement} imageElement - The image to analyze
 * @returns {Promise<Array>} Raw COCO-SSD predictions
 */
export async function runDetection(model, imageElement) {
  if (!model || !imageElement) return [];
  const predictions = await model.detect(imageElement);
  // Filter to traffic-relevant classes only
  return predictions.filter(p => TRAFFIC_CLASSES.includes(p.class));
}

/**
 * Convert COCO-SSD predictions to the existing boundingBoxes format.
 * @param {Array} predictions - Raw COCO-SSD output
 * @param {number} imgWidth - Natural image width
 * @param {number} imgHeight - Natural image height
 * @returns {Array} Boxes in VisionGuard format
 */
export function mapDetectionsToBoundingBoxes(predictions, imgWidth, imgHeight) {
  const boxes = [];

  predictions.forEach((pred, i) => {
    const [x, y, w, h] = pred.bbox;
    const classLabel = pred.class;
    const confidence = pred.score * 100;

    // Map COCO class to vehicle type
    const vehicleTypeMap = {
      car: 'Car',
      motorcycle: 'Two-Wheeler',
      truck: 'Truck',
      bus: 'Bus',
      bicycle: 'Bicycle',
      person: 'Person',
    };

    const vehicleType = vehicleTypeMap[classLabel] || classLabel;
    const isVehicle = classLabel !== 'person';

    boxes.push({
      id: `det-${Date.now()}-${i}`,
      x, y, w, h,
      type: 'vehicle',
      label: vehicleType,
      shortLabel: vehicleType,
      color: isVehicle ? '#00c853' : '#42a5f5',
      vehicleType,
      confidence,
      violation: null,
      cocoClass: classLabel,
    });
  });

  return boxes;
}

/**
 * Apply violation heuristics to detected objects.
 * Mutates boxes in place (sets violation info) and returns violation boxes.
 *
 * Rules:
 * - motorcycle with 1 person & person bbox overlaps upper 30% of motorcycle → No Helmet
 * - motorcycle with 3+ persons nearby → Triple Riding
 * - car/truck/bus in bottom 20% of image → Stop Line Violation
 * - any vehicle overlapping no-parking zone (right 15% of image) → Illegal Parking
 */
export function applyViolationLogic(boxes, imgWidth, imgHeight) {
  const motorcycles = boxes.filter(b => b.cocoClass === 'motorcycle');
  const persons = boxes.filter(b => b.cocoClass === 'person');
  const vehicles = boxes.filter(b => !['person'].includes(b.cocoClass));

  // === Motorcycle + Person violations ===
  motorcycles.forEach(moto => {
    // Find persons near this motorcycle (within 1.5x motorcycle width distance)
    const nearbyPersons = persons.filter(p => {
      const dist = bboxDistance(moto, p);
      return dist < moto.w * 2.5 || bboxOverlap(moto, p) > 0;
    });

    if (nearbyPersons.length >= 3) {
      // Triple Riding
      moto.type = 'violation';
      moto.violation = VIOLATION_TYPES.TRIPLE_RIDING;
      moto.color = VIOLATION_TYPES.TRIPLE_RIDING.color;
      moto.label = VIOLATION_TYPES.TRIPLE_RIDING.name;
      moto.shortLabel = 'Triple Riding';
      moto.confidence = randomBetween(88, 96);
    } else if (nearbyPersons.length >= 1) {
      // Check helmet — if person bbox overlaps upper 30% of motorcycle bbox
      const motoUpperZone = {
        x: moto.x,
        y: moto.y,
        w: moto.w,
        h: moto.h * 0.3,
      };

      const personInUpperZone = nearbyPersons.some(p => bboxOverlap(p, motoUpperZone) > 0);

      if (!personInUpperZone) {
        // Person not in upper zone — flag as no helmet
        moto.type = 'violation';
        moto.violation = VIOLATION_TYPES.HELMET;
        moto.color = VIOLATION_TYPES.HELMET.color;
        moto.label = VIOLATION_TYPES.HELMET.name;
        moto.shortLabel = 'No Helmet';
        moto.confidence = randomBetween(85, 95);
      }
    }
  });

  // === Stop Line Violation: car/truck/bus in bottom 20% of image ===
  const stopLineY = imgHeight * 0.8;
  vehicles.forEach(v => {
    if (['car', 'truck', 'bus'].includes(v.cocoClass)) {
      const vBottom = v.y + v.h;
      if (vBottom > stopLineY && v.y > stopLineY * 0.7) {
        // Only flag if not already violated
        if (!v.violation) {
          v.type = 'violation';
          v.violation = VIOLATION_TYPES.STOP_LINE;
          v.color = VIOLATION_TYPES.STOP_LINE.color;
          v.label = VIOLATION_TYPES.STOP_LINE.name;
          v.shortLabel = 'Stop Line';
          v.confidence = randomBetween(82, 94);
        }
      }
    }
  });

  // === Illegal Parking: vehicle in right 15% no-parking zone ===
  const noParkingX = imgWidth * 0.85;
  vehicles.forEach(v => {
    const vRight = v.x + v.w;
    if (vRight > noParkingX && v.x > noParkingX * 0.9) {
      if (!v.violation) {
        v.type = 'violation';
        v.violation = VIOLATION_TYPES.ILLEGAL_PARKING;
        v.color = VIOLATION_TYPES.ILLEGAL_PARKING.color;
        v.label = VIOLATION_TYPES.ILLEGAL_PARKING.name;
        v.shortLabel = 'Illegal Parking';
        v.confidence = randomBetween(80, 92);
      }
    }
  });

  // Add license plate boxes for vehicles with violations
  const violationBoxes = boxes.filter(b => b.violation);
  const plateBoxes = [];
  violationBoxes.forEach((vb, idx) => {
    if (vb.cocoClass !== 'person') {
      const plateW = vb.w * 0.45;
      const plateH = vb.h * 0.12;
      const plateX = vb.x + (vb.w - plateW) / 2;
      const plateY = vb.y + vb.h * 0.72;
      plateBoxes.push({
        id: `plate-${Date.now()}-${idx}`,
        x: plateX, y: plateY, w: plateW, h: plateH,
        type: 'plate',
        label: randomFrom(KARNATAKA_PLATES),
        shortLabel: randomFrom(KARNATAKA_PLATES),
        color: '#ffd600',
        vehicleType: vb.vehicleType,
        confidence: randomBetween(88, 99),
        violation: null,
        cocoClass: 'plate',
      });
    }
  });

  return [...boxes, ...plateBoxes];
}

/**
 * Generate violation result objects from boxes (for DetectionResults component).
 */
export function generateViolationsFromAI(boxes) {
  return boxes
    .filter(b => b.type === 'violation' && b.violation)
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
        timestamp: new Date(),
        cameraId: randomFrom(CAMERA_IDS),
        boxId: b.id,
        severity: b.violation.severity,
      };
    });
}

/**
 * Full AI detection pipeline: detect → map → apply violations → generate results.
 * Returns { boxes, violations }.
 */
export async function runFullPipeline(model, imageElement, imgWidth, imgHeight) {
  const predictions = await runDetection(model, imageElement);
  let boxes = mapDetectionsToBoundingBoxes(predictions, imgWidth, imgHeight);
  boxes = applyViolationLogic(boxes, imgWidth, imgHeight);
  const violations = generateViolationsFromAI(boxes);
  return { boxes, violations };
}
