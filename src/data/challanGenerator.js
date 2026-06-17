// ===== VisionGuard — Karnataka e-Challan Generator =====

// ── MV Act Section Mappings ──
const VIOLATION_MV_ACT = {
  helmet: {
    section: 'Sec 129, Motor Vehicles Act, 1988',
    fine: 500,
    code: 'MVA-129',
  },
  seatbelt: {
    section: 'Sec 138(3), Motor Vehicles Act, 1988',
    fine: 1000,
    code: 'MVA-138(3)',
  },
  triple_riding: {
    section: 'Sec 128, Motor Vehicles Act, 1988',
    fine: 1000,
    code: 'MVA-128',
  },
  wrong_side: {
    section: 'Sec 119, Motor Vehicles Act, 1988',
    fine: 1500,
    code: 'MVA-119',
  },
  stop_line: {
    section: 'Sec 119, Motor Vehicles Act, 1988',
    fine: 1000,
    code: 'MVA-119',
  },
  red_light: {
    section: 'Sec 119, Motor Vehicles Act, 1988',
    fine: 1000,
    code: 'MVA-119',
  },
  illegal_parking: {
    section: 'Sec 122, Motor Vehicles Act, 1988',
    fine: 500,
    code: 'MVA-122',
  },
};

// ── Generate a unique challan number ──
function generateChallanNumber() {
  const seq = String(Math.floor(10000 + Math.random() * 90000));
  return `KA/BTP/2026/${seq}`;
}

// ── Capture the annotated canvas as data URL ──
export function captureCanvasSnapshot(canvasElement) {
  if (!canvasElement) return null;
  try {
    return canvasElement.toDataURL('image/png');
  } catch {
    return null;
  }
}

// ── QR Code placeholder (inline SVG) ──
function getQRCodeSVG() {
  // A stylized placeholder QR code rendered as inline SVG
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#fff"/>
      <!-- Position detection patterns -->
      <rect x="5" y="5" width="25" height="25" fill="#1a237e" rx="2"/>
      <rect x="8" y="8" width="19" height="19" fill="#fff" rx="1"/>
      <rect x="11" y="11" width="13" height="13" fill="#1a237e" rx="1"/>
      <rect x="70" y="5" width="25" height="25" fill="#1a237e" rx="2"/>
      <rect x="73" y="8" width="19" height="19" fill="#fff" rx="1"/>
      <rect x="76" y="11" width="13" height="13" fill="#1a237e" rx="1"/>
      <rect x="5" y="70" width="25" height="25" fill="#1a237e" rx="2"/>
      <rect x="8" y="73" width="19" height="19" fill="#fff" rx="1"/>
      <rect x="11" y="76" width="13" height="13" fill="#1a237e" rx="1"/>
      <!-- Data modules -->
      <rect x="35" y="5" width="5" height="5" fill="#1a237e"/>
      <rect x="45" y="5" width="5" height="5" fill="#1a237e"/>
      <rect x="55" y="5" width="5" height="5" fill="#1a237e"/>
      <rect x="35" y="15" width="5" height="5" fill="#1a237e"/>
      <rect x="50" y="15" width="5" height="5" fill="#1a237e"/>
      <rect x="60" y="15" width="5" height="5" fill="#1a237e"/>
      <rect x="35" y="25" width="5" height="5" fill="#1a237e"/>
      <rect x="45" y="25" width="5" height="5" fill="#1a237e"/>
      <rect x="55" y="25" width="5" height="5" fill="#1a237e"/>
      <rect x="5" y="35" width="5" height="5" fill="#1a237e"/>
      <rect x="15" y="35" width="5" height="5" fill="#1a237e"/>
      <rect x="25" y="35" width="5" height="5" fill="#1a237e"/>
      <rect x="40" y="35" width="5" height="5" fill="#1a237e"/>
      <rect x="50" y="35" width="5" height="5" fill="#1a237e"/>
      <rect x="65" y="35" width="5" height="5" fill="#1a237e"/>
      <rect x="75" y="35" width="5" height="5" fill="#1a237e"/>
      <rect x="85" y="35" width="5" height="5" fill="#1a237e"/>
      <rect x="5" y="45" width="5" height="5" fill="#1a237e"/>
      <rect x="20" y="45" width="5" height="5" fill="#1a237e"/>
      <rect x="35" y="45" width="5" height="5" fill="#1a237e"/>
      <rect x="50" y="45" width="5" height="5" fill="#1a237e"/>
      <rect x="60" y="45" width="5" height="5" fill="#1a237e"/>
      <rect x="80" y="45" width="5" height="5" fill="#1a237e"/>
      <rect x="90" y="45" width="5" height="5" fill="#1a237e"/>
      <rect x="10" y="55" width="5" height="5" fill="#1a237e"/>
      <rect x="25" y="55" width="5" height="5" fill="#1a237e"/>
      <rect x="40" y="55" width="5" height="5" fill="#1a237e"/>
      <rect x="55" y="55" width="5" height="5" fill="#1a237e"/>
      <rect x="70" y="55" width="5" height="5" fill="#1a237e"/>
      <rect x="85" y="55" width="5" height="5" fill="#1a237e"/>
      <rect x="35" y="65" width="5" height="5" fill="#1a237e"/>
      <rect x="45" y="65" width="5" height="5" fill="#1a237e"/>
      <rect x="55" y="65" width="5" height="5" fill="#1a237e"/>
      <rect x="70" y="65" width="5" height="5" fill="#1a237e"/>
      <rect x="80" y="65" width="5" height="5" fill="#1a237e"/>
      <rect x="90" y="65" width="5" height="5" fill="#1a237e"/>
      <rect x="35" y="75" width="5" height="5" fill="#1a237e"/>
      <rect x="50" y="75" width="5" height="5" fill="#1a237e"/>
      <rect x="65" y="75" width="5" height="5" fill="#1a237e"/>
      <rect x="75" y="75" width="5" height="5" fill="#1a237e"/>
      <rect x="90" y="75" width="5" height="5" fill="#1a237e"/>
      <rect x="35" y="85" width="5" height="5" fill="#1a237e"/>
      <rect x="45" y="85" width="5" height="5" fill="#1a237e"/>
      <rect x="60" y="85" width="5" height="5" fill="#1a237e"/>
      <rect x="70" y="85" width="5" height="5" fill="#1a237e"/>
      <rect x="80" y="85" width="5" height="5" fill="#1a237e"/>
      <rect x="90" y="85" width="5" height="5" fill="#1a237e"/>
      <!-- Timing patterns -->
      <rect x="5" y="55" width="5" height="5" fill="#1a237e"/>
      <rect x="55" y="5" width="5" height="10" fill="#1a237e" opacity="0.7"/>
    </svg>
  `;
}

// ── Build the challan HTML document ──
function buildChallanHTML(violation, canvasDataUrl) {
  const challanNo = generateChallanNumber();
  const mvAct = VIOLATION_MV_ACT[violation.type.id] || {
    section: 'Sec 177, Motor Vehicles Act, 1988',
    fine: 500,
    code: 'MVA-177',
  };

  const dateStr = violation.timestamp.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = violation.timestamp.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dueDate = new Date(violation.timestamp);
  dueDate.setDate(dueDate.getDate() + 30);
  const dueDateStr = dueDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const evidenceImgTag = canvasDataUrl
    ? `<img src="${canvasDataUrl}" alt="Annotated Evidence" style="width:100%; max-width:600px; border-radius:8px; border:2px solid #1a237e; margin-top:8px;" />`
    : `<div style="width:100%; max-width:600px; height:200px; background:#f5f5f5; border:2px dashed #ccc; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#999; margin-top:8px;">Evidence image unavailable</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>e-Challan ${challanNo} — Karnataka Traffic Police</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      background: #f0f2f5;
      color: #1a1a2e;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .challan-page {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      border: 3px solid #1a237e;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(26, 35, 126, 0.12);
    }

    /* ── Top Banner ── */
    .top-banner {
      background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%);
      padding: 20px 32px;
      display: flex;
      align-items: center;
      gap: 20px;
      position: relative;
      overflow: hidden;
    }
    .top-banner::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
      border-radius: 50%;
    }

    .emblem {
      width: 72px;
      height: 72px;
      background: rgba(255,255,255,0.12);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 2px solid rgba(255,255,255,0.2);
      position: relative;
    }
    .emblem-inner {
      font-size: 36px;
      line-height: 1;
    }
    .emblem-ring {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .banner-text {
      flex: 1;
      position: relative;
      z-index: 1;
    }
    .banner-text .govt-name {
      font-size: 11px;
      font-weight: 600;
      color: rgba(255,255,255,0.7);
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .banner-text .dept-name {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      letter-spacing: 1px;
    }
    .banner-text .echallan-title {
      font-size: 13px;
      font-weight: 600;
      color: #ffd54f;
      letter-spacing: 5px;
      text-transform: uppercase;
      margin-top: 4px;
    }

    .challan-number-badge {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 8px;
      padding: 8px 16px;
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .challan-number-badge .label {
      font-size: 9px;
      font-weight: 600;
      color: rgba(255,255,255,0.6);
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .challan-number-badge .number {
      font-size: 14px;
      font-weight: 800;
      color: #ffd54f;
      font-family: 'Courier New', monospace;
      margin-top: 2px;
      letter-spacing: 0.5px;
    }

    /* ── Red stripe ── */
    .red-stripe {
      height: 4px;
      background: linear-gradient(90deg, #d32f2f, #f44336, #ff5722, #f44336, #d32f2f);
    }

    /* ── Body ── */
    .challan-body {
      padding: 28px 32px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #1a237e;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      margin-bottom: 14px;
      padding-bottom: 6px;
      border-bottom: 2px solid #e8eaf6;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title .dot {
      width: 6px;
      height: 6px;
      background: #1a237e;
      border-radius: 50%;
    }

    /* ── Details Table ── */
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .details-table tr {
      border-bottom: 1px solid #e8eaf6;
    }
    .details-table tr:last-child {
      border-bottom: none;
    }
    .details-table th {
      text-align: left;
      padding: 10px 16px;
      background: #f5f7ff;
      font-weight: 600;
      color: #3949ab;
      width: 200px;
      font-size: 12px;
      letter-spacing: 0.3px;
      vertical-align: top;
    }
    .details-table td {
      padding: 10px 16px;
      font-weight: 500;
      color: #1a1a2e;
      vertical-align: top;
    }

    /* ── Fine Badge ── */
    .fine-amount {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #d32f2f, #c62828);
      color: #fff;
      font-size: 18px;
      font-weight: 800;
      padding: 8px 20px;
      border-radius: 8px;
      letter-spacing: 0.5px;
    }
    .fine-amount .rupee {
      font-size: 14px;
      opacity: 0.8;
    }

    /* ── Violation Badge ── */
    .violation-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #fff3e0;
      color: #e65100;
      font-weight: 700;
      padding: 5px 14px;
      border-radius: 6px;
      border: 1px solid #ffcc02;
      font-size: 12px;
    }

    /* ── Confidence ── */
    .confidence-bar-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .confidence-bar-outer {
      flex: 1;
      max-width: 180px;
      height: 8px;
      background: #e8eaf6;
      border-radius: 4px;
      overflow: hidden;
    }
    .confidence-bar-inner {
      height: 100%;
      border-radius: 4px;
      background: linear-gradient(90deg, #43a047, #66bb6a);
    }
    .confidence-text {
      font-weight: 700;
      font-family: 'Courier New', monospace;
      color: #2e7d32;
      font-size: 14px;
    }

    /* ── Evidence ── */
    .evidence-section {
      margin-top: 24px;
    }
    .evidence-label {
      font-size: 10px;
      color: #666;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 4px;
    }

    /* ── Footer ── */
    .challan-footer {
      background: #f5f7ff;
      border-top: 2px solid #e8eaf6;
      padding: 20px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .footer-left {
      flex: 1;
    }
    .footer-left .pay-text {
      font-size: 13px;
      font-weight: 700;
      color: #1a237e;
      margin-bottom: 4px;
    }
    .footer-left .pay-url {
      font-size: 12px;
      color: #3949ab;
      font-weight: 500;
    }
    .footer-left .due-date {
      font-size: 11px;
      color: #d32f2f;
      font-weight: 600;
      margin-top: 6px;
    }
    .footer-left .disclaimer {
      font-size: 10px;
      color: #888;
      margin-top: 8px;
      line-height: 1.5;
      max-width: 450px;
    }

    .footer-qr {
      flex-shrink: 0;
      text-align: center;
    }
    .footer-qr .qr-label {
      font-size: 9px;
      color: #666;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 6px;
    }

    /* ── Bottom stripe ── */
    .bottom-stripe {
      height: 6px;
      background: linear-gradient(90deg, #ff9800, #f44336, #1a237e, #1565c0);
    }

    /* ── Print Button ── */
    .print-actions {
      max-width: 800px;
      margin: 20px auto;
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .print-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 32px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .print-btn.primary {
      background: linear-gradient(135deg, #1a237e, #1565c0);
      color: #fff;
    }
    .print-btn.primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(26, 35, 126, 0.3);
    }
    .print-btn.secondary {
      background: #fff;
      color: #1a237e;
      border: 2px solid #1a237e;
    }
    .print-btn.secondary:hover {
      background: #e8eaf6;
    }

    /* ── Watermark ── */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 80px;
      font-weight: 900;
      color: rgba(26, 35, 126, 0.03);
      letter-spacing: 10px;
      pointer-events: none;
      white-space: nowrap;
    }

    /* ── Print styles ── */
    @media print {
      body { background: #fff; padding: 0; }
      .challan-page { box-shadow: none; border-radius: 0; border-width: 2px; }
      .print-actions { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- Print Actions -->
  <div class="print-actions">
    <button class="print-btn primary" onclick="window.print()">
      🖨️ Print / Save as PDF
    </button>
    <button class="print-btn secondary" onclick="window.close()">
      ✕ Close
    </button>
  </div>

  <!-- Challan Document -->
  <div class="challan-page" style="position:relative;">
    <div class="watermark">KARNATAKA POLICE</div>

    <!-- Top Banner -->
    <div class="top-banner">
      <div class="emblem">
        <div class="emblem-ring"></div>
        <div class="emblem-inner">⚖️</div>
      </div>
      <div class="banner-text">
        <div class="govt-name">Government of Karnataka</div>
        <div class="dept-name">Karnataka Traffic Police</div>
        <div class="echallan-title">e-CHALLAN</div>
      </div>
      <div class="challan-number-badge">
        <div class="label">Challan No.</div>
        <div class="number">${challanNo}</div>
      </div>
    </div>

    <div class="red-stripe"></div>

    <!-- Body -->
    <div class="challan-body">
      <!-- Violation Details -->
      <div class="section-title"><span class="dot"></span> VIOLATION DETAILS</div>
      <table class="details-table">
        <tr>
          <th>Vehicle Registration</th>
          <td><strong>${violation.licensePlate}</strong></td>
        </tr>
        <tr>
          <th>Vehicle Type</th>
          <td>${violation.vehicleType}</td>
        </tr>
        <tr>
          <th>Violation Type</th>
          <td>
            <span class="violation-badge">
              ${violation.type.icon} ${violation.type.name}
            </span>
          </td>
        </tr>
        <tr>
          <th>Violation Code</th>
          <td>
            <strong>${mvAct.code}</strong>
            <br/><span style="font-size:11px; color:#666;">${mvAct.section}</span>
          </td>
        </tr>
        <tr>
          <th>Fine Amount</th>
          <td>
            <span class="fine-amount">
              <span class="rupee">₹</span>${mvAct.fine.toLocaleString('en-IN')}
            </span>
          </td>
        </tr>
        <tr>
          <th>Date &amp; Time</th>
          <td>${dateStr} &nbsp;|&nbsp; ${timeStr}</td>
        </tr>
        <tr>
          <th>Camera ID &amp; Location</th>
          <td>${violation.cameraId}</td>
        </tr>
        <tr>
          <th>Detection Confidence</th>
          <td>
            <div class="confidence-bar-wrapper">
              <div class="confidence-bar-outer">
                <div class="confidence-bar-inner" style="width:${violation.confidence.toFixed(1)}%"></div>
              </div>
              <span class="confidence-text">${violation.confidence.toFixed(1)}%</span>
            </div>
          </td>
        </tr>
        <tr>
          <th>Severity</th>
          <td>
            <span style="display:inline-flex; align-items:center; gap:4px; font-weight:700; color:${violation.severity === 'high' ? '#d32f2f' : '#e65100'}; text-transform:uppercase; font-size:12px; letter-spacing:1px;">
              ${violation.severity === 'high' ? '🔴' : '🟠'} ${violation.severity}
            </span>
          </td>
        </tr>
      </table>

      <!-- Evidence Section -->
      <div class="evidence-section">
        <div class="section-title"><span class="dot"></span> ANNOTATED EVIDENCE</div>
        ${evidenceImgTag}
        <p class="evidence-label">Auto-captured by VisionGuard AI — COCO-SSD Detection Engine</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="challan-footer">
      <div class="footer-left">
        <div class="pay-text">Pay your fine online</div>
        <div class="pay-url">🌐 <a href="https://parivahan.gov.in" target="_blank" style="color:#3949ab;">https://parivahan.gov.in</a></div>
        <div class="due-date">⚠️ Payment due by: ${dueDateStr}</div>
        <div class="disclaimer">
          This is a computer-generated e-Challan issued by the Karnataka Traffic Police automated 
          violation detection system (VisionGuard AI). In case of disputes, contact the nearest 
          traffic police station within 30 days of issuance with this challan number.
        </div>
      </div>
      <div class="footer-qr">
        ${getQRCodeSVG()}
        <div class="qr-label">Scan to pay</div>
      </div>
    </div>

    <div class="bottom-stripe"></div>
  </div>

  <script>
    // Auto-trigger print dialog shortly after load
    window.addEventListener('load', function() {
      setTimeout(function() {
        // Don't auto-print, let user click button
      }, 500);
    });
  </script>
</body>
</html>`;
}

// ── Open Challan in New Window ──
export function openChallanWindow(violation, canvasDataUrl) {
  const html = buildChallanHTML(violation, canvasDataUrl);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  // Clean up the object URL after the window loads
  if (win) {
    win.addEventListener('load', () => {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
  }
}

// ══════════════════════════════════════════
// ── Evidence ZIP Download (Pure JS) ──
// Uses a minimal ZIP builder — no external dependencies
// ══════════════════════════════════════════

function crc32(data) {
  let crc = 0xffffffff;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16LE(val) {
  return [val & 0xff, (val >> 8) & 0xff];
}

function writeUint32LE(val) {
  return [val & 0xff, (val >> 8) & 0xff, (val >> 16) & 0xff, (val >> 24) & 0xff];
}

function buildZip(files) {
  // files: Array of { name: string, data: Uint8Array }
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    // Local file header
    const local = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04, // signature
      0x14, 0x00,              // version needed
      0x00, 0x00,              // flags
      0x00, 0x00,              // compression (store)
      0x00, 0x00,              // mod time
      0x00, 0x00,              // mod date
      ...writeUint32LE(crc),
      ...writeUint32LE(size),  // compressed size
      ...writeUint32LE(size),  // uncompressed size
      ...writeUint16LE(nameBytes.length),
      0x00, 0x00,              // extra field length
    ]);

    localHeaders.push({ header: local, name: nameBytes, data: file.data, offset });
    offset += local.length + nameBytes.length + file.data.length;

    // Central directory header
    const central = new Uint8Array([
      0x50, 0x4b, 0x01, 0x02, // signature
      0x14, 0x00,              // version made by
      0x14, 0x00,              // version needed
      0x00, 0x00,              // flags
      0x00, 0x00,              // compression
      0x00, 0x00,              // mod time
      0x00, 0x00,              // mod date
      ...writeUint32LE(crc),
      ...writeUint32LE(size),
      ...writeUint32LE(size),
      ...writeUint16LE(nameBytes.length),
      0x00, 0x00,              // extra field length
      0x00, 0x00,              // comment length
      0x00, 0x00,              // disk number start
      0x00, 0x00,              // internal attrs
      0x00, 0x00, 0x00, 0x00,  // external attrs
      ...writeUint32LE(localHeaders[localHeaders.length - 1].offset),
    ]);
    centralHeaders.push({ header: central, name: nameBytes });
  }

  // Calculate sizes
  let centralDirSize = 0;
  centralHeaders.forEach(c => { centralDirSize += c.header.length + c.name.length; });

  // End of central directory
  const eocd = new Uint8Array([
    0x50, 0x4b, 0x05, 0x06,
    0x00, 0x00,              // disk number
    0x00, 0x00,              // disk with central dir
    ...writeUint16LE(files.length),
    ...writeUint16LE(files.length),
    ...writeUint32LE(centralDirSize),
    ...writeUint32LE(offset), // offset of central dir
    0x00, 0x00,              // comment length
  ]);

  // Assemble
  const totalSize = offset + centralDirSize + eocd.length;
  const zip = new Uint8Array(totalSize);
  let pos = 0;

  // Write local file entries
  for (const entry of localHeaders) {
    zip.set(entry.header, pos);
    pos += entry.header.length;
    zip.set(entry.name, pos);
    pos += entry.name.length;
    zip.set(entry.data, pos);
    pos += entry.data.length;
  }

  // Write central directory
  for (const entry of centralHeaders) {
    zip.set(entry.header, pos);
    pos += entry.header.length;
    zip.set(entry.name, pos);
    pos += entry.name.length;
  }

  // Write EOCD
  zip.set(eocd, pos);

  return zip;
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── Download Evidence ZIP ──
export function downloadEvidenceZip(violation, canvasDataUrl) {
  const challanNo = generateChallanNumber();
  const mvAct = VIOLATION_MV_ACT[violation.type.id] || {
    section: 'Sec 177, Motor Vehicles Act, 1988',
    fine: 500,
    code: 'MVA-177',
  };

  // 1. Annotated evidence image
  const imageBytes = canvasDataUrl
    ? dataUrlToUint8Array(canvasDataUrl)
    : new TextEncoder().encode('No evidence image available');
  const imageExt = canvasDataUrl ? 'png' : 'txt';

  // 2. Challan HTML
  const challanHTML = buildChallanHTML(violation, canvasDataUrl);
  const challanBytes = new TextEncoder().encode(challanHTML);

  // 3. JSON metadata
  const metadata = {
    challanNumber: challanNo,
    issuedAt: new Date().toISOString(),
    violation: {
      type: violation.type.name,
      typeId: violation.type.id,
      description: violation.type.description,
      severity: violation.severity,
    },
    vehicle: {
      registration: violation.licensePlate,
      type: violation.vehicleType,
    },
    legalReference: {
      section: mvAct.section,
      code: mvAct.code,
      fineAmount: mvAct.fine,
    },
    detection: {
      confidence: violation.confidence,
      timestamp: violation.timestamp.toISOString(),
      cameraId: violation.cameraId,
      model: 'COCO-SSD (TensorFlow.js)',
    },
    generatedBy: 'VisionGuard AI — Automated Traffic Violation Detection',
  };
  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata, null, 2));

  // Build ZIP
  const prefix = `evidence_${violation.licensePlate.replace(/\s+/g, '_')}`;
  const files = [
    { name: `${prefix}/annotated_evidence.${imageExt}`, data: imageBytes },
    { name: `${prefix}/e_challan.html`, data: challanBytes },
    { name: `${prefix}/metadata.json`, data: metadataBytes },
  ];

  const zipData = buildZip(files);
  const blob = new Blob([zipData], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${prefix}_${challanNo.replace(/\//g, '-')}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
