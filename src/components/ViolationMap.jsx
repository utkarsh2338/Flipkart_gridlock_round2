import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Map, Layers, Radio, Eye } from 'lucide-react';

// ===== Camera Locations in Bengaluru =====
export const CAMERA_LOCATIONS = [
  { id: 'cam-001', name: 'Silk Board Junction', lat: 12.9177, lng: 77.6237, intensity: 0.9 },
  { id: 'cam-018', name: 'MG Road', lat: 12.9757, lng: 77.6011, intensity: 0.6 },
  { id: 'cam-012', name: 'KR Puram', lat: 13.0092, lng: 77.6968, intensity: 0.7 },
  { id: 'cam-055', name: 'Whitefield', lat: 12.9698, lng: 77.7500, intensity: 0.5 },
  { id: 'cam-007', name: 'Hebbal', lat: 13.0358, lng: 77.5970, intensity: 0.65 },
  { id: 'cam-029', name: 'Electronic City', lat: 12.8458, lng: 77.6618, intensity: 0.55 },
  { id: 'cam-042', name: 'Koramangala', lat: 12.9352, lng: 77.6245, intensity: 0.75 },
  { id: 'cam-039', name: 'Yeshwantpur', lat: 13.0234, lng: 77.5548, intensity: 0.4 },
];

// Custom cyan pulsing camera icon
function createCameraIcon() {
  return window.L.divIcon({
    className: 'camera-marker-icon',
    html: `
      <div class="camera-marker">
        <div class="camera-marker-ping"></div>
        <div class="camera-marker-dot"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// Custom red violation icon
function createViolationIcon() {
  return window.L.divIcon({
    className: 'violation-marker-icon',
    html: `
      <div class="violation-marker">
        <div class="violation-marker-ping"></div>
        <div class="violation-marker-pin">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#ff4444">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

export default function ViolationMap({ violations, liveDemoMode, zones = [], setZones }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const violationMarkersRef = useRef([]);
  const violationCirclesRef = useRef([]);
  const heatLayerRef = useRef(null);
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Geofence zone editor states
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempPoints, setTempPoints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState('RED_LIGHT');

  const zoneLayersRef = useRef([]);
  const drawLayersRef = useRef([]);

  // Initialize the map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Wait for Leaflet to be available
    if (!window.L) {
      const checkInterval = setInterval(() => {
        if (window.L) {
          clearInterval(checkInterval);
          initMap();
        }
      }, 200);
      return () => clearInterval(checkInterval);
    } else {
      initMap();
    }

    function initMap() {
      const map = window.L.map(mapContainerRef.current, {
        center: [12.9716, 77.5946],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark tile layer
      window.L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);

      // Zoom control on the right
      window.L.control.zoom({ position: 'topright' }).addTo(map);

      // Add camera markers
      CAMERA_LOCATIONS.forEach((cam) => {
        const marker = window.L.marker([cam.lat, cam.lng], {
          icon: createCameraIcon(),
        }).addTo(map);

        marker.bindPopup(
          `<div class="map-popup-content">
            <div class="map-popup-title">${cam.name}</div>
            <div class="map-popup-info">
              <span class="map-popup-status">● ACTIVE</span>
              <span class="map-popup-id">${cam.id.toUpperCase()}</span>
            </div>
          </div>`,
          { className: 'vg-popup', closeButton: false }
        );
      });

      mapRef.current = map;
      setMapReady(true);

      // Force resize after render
      setTimeout(() => map.invalidateSize(), 100);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Handle violations — drop pins at random camera locations
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    // Clear previous violation markers
    violationMarkersRef.current.forEach((m) => map.removeLayer(m));
    violationCirclesRef.current.forEach((c) => map.removeLayer(c));
    violationMarkersRef.current = [];
    violationCirclesRef.current = [];

    if (violations.length === 0) return;

    violations.forEach((v, idx) => {
      // Match camera location from violation's cameraId or pick a random one
      const matchedCam = CAMERA_LOCATIONS.find((c) =>
        v.cameraId && v.cameraId.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])
      ) || CAMERA_LOCATIONS[idx % CAMERA_LOCATIONS.length];

      // Slight offset so pins don't stack exactly or use provided coordinate
      const lat = v.lat || (matchedCam.lat + (Math.random() - 0.5) * 0.004);
      const lng = v.lng || (matchedCam.lng + (Math.random() - 0.5) * 0.004);

      // Violation pin marker
      const marker = window.L.marker([lat, lng], {
        icon: createViolationIcon(),
        riseOnHover: true,
      }).addTo(map);

      const popupHtml = `
        <div class="map-popup-content violation">
          <div class="map-popup-title">${v.type.icon} ${v.type.name}</div>
          <div class="map-popup-detail">
            <span>Confidence: <strong>${v.confidence.toFixed(1)}%</strong></span>
            <span>Vehicle: ${v.vehicleType}</span>
            <span>${v.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          <div class="map-popup-severity ${v.severity}">${v.severity.toUpperCase()}</div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'vg-popup violation', closeButton: false });

      // Congestion zone circle
      const circle = window.L.circle([lat, lng], {
        radius: 250 + Math.random() * 150,
        color: '#ff4444',
        fillColor: '#ff4444',
        fillOpacity: 0.08,
        weight: 1,
        opacity: 0.4,
        dashArray: '6 4',
      }).addTo(map);

      violationMarkersRef.current.push(marker);
      violationCirclesRef.current.push(circle);
    });
  }, [violations, mapReady]);

  // Toggle drawing mode
  const toggleDrawMode = useCallback(() => {
    if (isDrawing) {
      cancelDrawing();
    } else {
      setIsDrawing(true);
      setTempPoints([]);
    }
  }, [isDrawing]);

  // Cancel drawing
  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setTempPoints([]);
    setShowModal(false);
    setZoneName('');
    setZoneType('RED_LIGHT');
    
    if (mapRef.current) {
      drawLayersRef.current.forEach(layer => mapRef.current.removeLayer(layer));
      drawLayersRef.current = [];
    }
  }, []);

  // Close polygon
  const handleClosePolygon = useCallback(() => {
    if (tempPoints.length < 3) return;
    setShowModal(true);
  }, [tempPoints]);

  // Save polygon geofence zone
  const saveZone = useCallback(() => {
    if (!zoneName.trim() || tempPoints.length < 3) return;
    const newZone = {
      id: 'zone-' + Date.now(),
      name: zoneName.trim(),
      violationType: zoneType,
      points: tempPoints,
    };
    setZones(prev => [...prev, newZone]);
    cancelDrawing();
  }, [zoneName, zoneType, tempPoints, setZones, cancelDrawing]);

  // Map clicks listener for drawing vertices
  useEffect(() => {
    if (!mapRef.current || !mapReady || !isDrawing) return;
    const map = mapRef.current;

    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;
      setTempPoints(prev => [...prev, [lat, lng]]);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawing, mapReady]);

  // Render temporary drawing layers (vertices markers + polylines)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    // Clear old temporary layers
    drawLayersRef.current.forEach(layer => map.removeLayer(layer));
    drawLayersRef.current = [];

    if (tempPoints.length === 0) return;

    // Draw markers
    tempPoints.forEach((pt, idx) => {
      const isFirst = idx === 0;
      const markerIcon = window.L.divIcon({
        className: 'draw-marker-icon',
        html: `<div class="draw-marker ${isFirst ? 'first' : ''}"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = window.L.marker(pt, { icon: markerIcon }).addTo(map);
      drawLayersRef.current.push(marker);

      if (isFirst) {
        marker.on('click', (e) => {
          window.L.DomEvent.stopPropagation(e);
          if (tempPoints.length >= 3) {
            handleClosePolygon();
          }
        });
      }
    });

    // Draw polyline
    if (tempPoints.length > 1) {
      const polyline = window.L.polyline(tempPoints, {
        color: '#00d4ff',
        weight: 2,
        dashArray: '5 5'
      }).addTo(map);
      drawLayersRef.current.push(polyline);
    }
  }, [tempPoints, mapReady, handleClosePolygon]);

  // Draw configured geofence zone polygons
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    zoneLayersRef.current.forEach(layer => map.removeLayer(layer));
    zoneLayersRef.current = [];

    const zoneColorMap = {
      RED_LIGHT: '#ff4444',
      STOP_LINE: '#ff8c00',
      ILLEGAL_PARKING: '#ffd600',
      WRONG_SIDE: '#8b5cf6',
    };

    const zoneNameMap = {
      RED_LIGHT: 'Red Light Violation',
      STOP_LINE: 'Stop Line Violation',
      ILLEGAL_PARKING: 'No Parking',
      WRONG_SIDE: 'Wrong-Side Driving',
    };

    zones.forEach(zone => {
      const color = zoneColorMap[zone.violationType] || '#00d4ff';
      const polygon = window.L.polygon(zone.points, {
        color: color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 1.5,
      }).addTo(map);

      const popupHtml = `
        <div class="map-popup-content">
          <div class="map-popup-title" style="color: ${color}; font-weight: bold;">🛠️ Geofence: ${zone.name}</div>
          <div class="map-popup-detail" style="margin-top: 4px; font-size: 11px;">
            <span>Enforcing: <strong>${zoneNameMap[zone.violationType] || zone.violationType}</strong></span><br/>
            <span>Status: <strong>ACTIVE</strong></span>
          </div>
        </div>
      `;
      polygon.bindPopup(popupHtml, { className: 'vg-popup', closeButton: false });
      zoneLayersRef.current.push(polygon);
    });
  }, [zones, mapReady]);

  // Heatmap layer toggle
  const toggleHeatmap = useCallback(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    if (heatmapOn) {
      // Remove heatmap
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    } else {
      // Add heatmap
      if (window.L.heatLayer) {
        const heatData = CAMERA_LOCATIONS.map((cam) => [
          cam.lat,
          cam.lng,
          cam.intensity,
        ]);
        heatLayerRef.current = window.L.heatLayer(heatData, {
          radius: 40,
          blur: 30,
          maxZoom: 15,
          max: 1.0,
          gradient: {
            0.2: '#1a237e',
            0.4: '#00bcd4',
            0.6: '#ff9800',
            0.8: '#ff5722',
            1.0: '#ff1744',
          },
        }).addTo(map);
      }
    }
    setHeatmapOn(!heatmapOn);
  }, [heatmapOn, mapReady]);

  return (
    <div className="map-panel-premium glass-card-premium relative" id="violation-map">
      {/* Header */}
      <div className="violation-map-header">
        <div className="flex items-center gap-2">
          <div className="section-header green" style={{ marginBottom: 0 }}>
            <Map className="w-4 h-4 text-success-green" />
            <h2 className="text-sm font-semibold text-white/90 tracking-wide">
              Live Surveillance Map
            </h2>
          </div>
          <span className="text-[10px] text-navy-300 font-mono bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
            Bengaluru
          </span>
          {zones.length > 0 && (
            <span className="text-[10px] text-cyan-accent font-mono bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-800/30">
              Zones configured: {zones.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Active cameras count */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success-green" />
            </span>
            <span className="text-[10px] text-navy-300 font-mono">
              {CAMERA_LOCATIONS.length} Cameras Active
            </span>
          </div>

          {/* Edit Zones button */}
          <button
            onClick={toggleDrawMode}
            className={`map-toggle-btn ${isDrawing ? 'active border-cyan-500 text-cyan-accent' : ''}`}
            id="edit-zones-btn"
            title="Toggle drawing mode to configure custom geofences"
          >
            <Layers className="w-3 h-3 text-cyan-accent" />
            <span>{isDrawing ? 'Drawing...' : 'Edit Zones'}</span>
          </button>

          {/* Heatmap toggle */}
          <button
            onClick={toggleHeatmap}
            className={`map-toggle-btn ${heatmapOn ? 'active' : ''}`}
            id="heatmap-toggle"
          >
            <Layers className="w-3 h-3" />
            <span>Heatmap</span>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="violation-map-container relative">
        <div ref={mapContainerRef} className="violation-map" id="leaflet-map" />

        {/* Map drawing controls overlay */}
        {isDrawing && (
          <div className="map-drawing-hud glass-card-premium">
            <span className="text-[11px] text-white/95 font-medium leading-relaxed font-mono">
              📍 Place 3+ points on map. Click the first (red) point or "Finish Zone" to save.
            </span>
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleClosePolygon}
                disabled={tempPoints.length < 3}
                className="btn-demo-nav active"
                style={{ fontSize: '10px', padding: '4px 10px', height: 'auto' }}
              >
                Finish Zone
              </button>
              <button
                onClick={cancelDrawing}
                className="btn-demo-skip"
                style={{ fontSize: '10px', padding: '4px 10px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Zone Configure Dialog Modal */}
        {showModal && (
          <div className="zone-modal-overlay">
            <div className="zone-modal-card glass-card-premium" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider text-cyan-accent">Configure Geofence Zone</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-navy-300 mb-1 font-mono">Zone Name</label>
                  <input
                    type="text"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="e.g. Silk Board No-Parking Line"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
                
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-navy-300 mb-1 font-mono">Violation Type to Detect</label>
                  <select
                    value={zoneType}
                    onChange={(e) => setZoneType(e.target.value)}
                    className="w-full bg-navy-950 border border-white/[0.08] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    <option value="RED_LIGHT">Red Light Violation</option>
                    <option value="STOP_LINE">Stop Line Violation</option>
                    <option value="ILLEGAL_PARKING">No Parking (Illegal Parking)</option>
                    <option value="WRONG_SIDE">Wrong-Side Driving</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2.5 mt-5">
                <button
                  onClick={() => {
                    setShowModal(false);
                    cancelDrawing();
                  }}
                  className="btn-demo-skip"
                  style={{ fontSize: '10px', padding: '6px 12px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveZone}
                  disabled={!zoneName.trim()}
                  className="btn-demo-nav active"
                  style={{ fontSize: '10px', padding: '6px 12px', height: 'auto' }}
                >
                  Save Zone
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map overlay legend */}
        <div className="map-legend">
          <div className="map-legend-item">
            <span className="map-legend-dot camera" />
            <span>Camera</span>
          </div>
          <div className="map-legend-item">
            <span className="map-legend-dot violation" />
            <span>Violation</span>
          </div>
          {heatmapOn && (
            <div className="map-legend-item">
              <span className="map-legend-gradient" />
              <span>Density</span>
            </div>
          )}
        </div>

        {/* Violation count badge */}
        {violations.length > 0 && (
          <div className="map-violation-count">
            <Radio className="w-3 h-3" />
            <span>{violations.length} Active Alerts</span>
          </div>
        )}
      </div>
    </div>
  );
}
