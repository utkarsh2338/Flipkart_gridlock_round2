import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Map, Layers, Radio, Eye } from 'lucide-react';

// ===== Camera Locations in Bengaluru =====
const CAMERA_LOCATIONS = [
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

export default function ViolationMap({ violations, liveDemoMode }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const violationMarkersRef = useRef([]);
  const violationCirclesRef = useRef([]);
  const heatLayerRef = useRef(null);
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [mapReady, setMapReady] = useState(false);

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

      // Slight offset so pins don't stack exactly
      const lat = matchedCam.lat + (Math.random() - 0.5) * 0.004;
      const lng = matchedCam.lng + (Math.random() - 0.5) * 0.004;

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
    <div className="map-panel-premium glass-card-premium" id="violation-map">
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
      <div className="violation-map-container">
        <div ref={mapContainerRef} className="violation-map" id="leaflet-map" />

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
