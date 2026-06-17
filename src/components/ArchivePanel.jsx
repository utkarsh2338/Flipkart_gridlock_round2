import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertTriangle,
  FileText,
  Archive,
  MapPin,
  Car,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  Gauge,
  HelpCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { openChallanWindow, downloadEvidenceZip } from '../data/challanGenerator';
import { VIOLATION_TYPES } from '../data/mockData';

// Helper to format date nicely
function formatDateTime(date) {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// Map status to visual class and icon
const STATUS_CONFIG = {
  'Pending': {
    color: '#ff9800',
    bg: 'rgba(255, 152, 0, 0.1)',
    border: 'rgba(255, 152, 0, 0.25)',
    icon: Clock
  },
  'Challan Sent': {
    color: '#00e5ff',
    bg: 'rgba(0, 229, 255, 0.1)',
    border: 'rgba(0, 229, 255, 0.25)',
    icon: FileText
  },
  'Paid': {
    color: '#00e676',
    bg: 'rgba(0, 230, 118, 0.1)',
    border: 'rgba(0, 230, 118, 0.25)',
    icon: CheckCircle2
  },
  'Dismissed': {
    color: '#90a4ae',
    bg: 'rgba(144, 164, 174, 0.1)',
    border: 'rgba(144, 164, 174, 0.25)',
    icon: XCircle
  }
};

export default function ArchivePanel({ archive, setArchive }) {
  const [searchPlate, setSearchPlate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [sortBy, setSortBy] = useState('date-newest');
  
  const [expandedId, setExpandedId] = useState(null);

  // Extract unique camera locations for the filter
  const cameraLocations = useMemo(() => {
    const locations = new Set();
    archive.forEach(item => {
      if (item.cameraId) {
        // Get just the name portion of CAM-001 Name
        const parts = item.cameraId.split(' ');
        const name = parts.slice(1).join(' ') || item.cameraId;
        locations.add(name);
      }
    });
    return Array.from(locations);
  }, [archive]);

  // Filter and Sort Archive Data
  const filteredArchive = useMemo(() => {
    const now = new Date();
    
    return archive
      .filter(item => {
        // Search plate
        const matchesPlate = item.licensePlate.toLowerCase().includes(searchPlate.toLowerCase().trim());
        
        // Filter type
        const matchesType = filterType === 'all' || item.type.id === filterType;
        
        // Filter severity
        const matchesSeverity = filterSeverity === 'all' || item.severity === filterSeverity;
        
        // Filter status
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        
        // Filter location
        let matchesLocation = true;
        if (filterLocation !== 'all') {
          matchesLocation = item.cameraId.toLowerCase().includes(filterLocation.toLowerCase());
        }
        
        // Filter Date Range
        let matchesDate = true;
        if (filterDate !== 'all') {
          const diffTime = Math.abs(now - item.timestamp);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (filterDate === 'today') {
            matchesDate = item.timestamp.toDateString() === now.toDateString();
          } else if (filterDate === 'yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            matchesDate = item.timestamp.toDateString() === yesterday.toDateString();
          } else if (filterDate === 'week') {
            matchesDate = diffDays <= 7;
          }
        }
        
        return matchesPlate && matchesType && matchesSeverity && matchesStatus && matchesLocation && matchesDate;
      })
      .sort((a, b) => {
        if (sortBy === 'date-newest') return b.timestamp - a.timestamp;
        if (sortBy === 'date-oldest') return a.timestamp - b.timestamp;
        if (sortBy === 'confidence-highest') return b.confidence - a.confidence;
        if (sortBy === 'confidence-lowest') return a.confidence - b.confidence;
        
        // Default
        return b.timestamp - a.timestamp;
      });
  }, [archive, searchPlate, filterType, filterSeverity, filterStatus, filterLocation, filterDate, sortBy]);

  // Reset all search filters
  const handleResetFilters = () => {
    setSearchPlate('');
    setFilterType('all');
    setFilterSeverity('all');
    setFilterStatus('all');
    setFilterLocation('all');
    setFilterDate('all');
    setSortBy('date-newest');
  };

  // Toggle row expansion
  const toggleRow = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Handle status update
  const handleUpdateStatus = (id, newStatus) => {
    setArchive(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: newStatus };
      }
      return item;
    }));
  };

  // Generate Challan from Archive Row
  const handleGenerateChallan = (e, item) => {
    e.stopPropagation();
    
    // Create a mock canvas/CCTV overlay snapshot for printing
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    
    // Draw high-tech background
    ctx.fillStyle = '#0a0d1e';
    ctx.fillRect(0, 0, 800, 500);
    
    // Simulated CCTV Grid lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 800; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 500); ctx.stroke();
    }
    for (let y = 0; y < 500; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
    }

    // Telemetry display
    ctx.fillStyle = '#00e5ff';
    ctx.font = '14px monospace';
    ctx.fillText(`CAM TELEMETRY SOURCE: ${item.cameraId.toUpperCase()}`, 30, 40);
    ctx.fillText(`GPS LOC: 12°58'21"N 77°35'44"E`, 30, 60);
    ctx.fillText(`TIMESTAMP: ${item.timestamp.toISOString()}`, 30, 80);
    ctx.fillText(`PLATE OCR: ${item.licensePlate}`, 30, 100);
    ctx.fillText(`VEHICLE: ${item.vehicleType.toUpperCase()}`, 30, 120);

    // Speed details
    if (item.telemetry) {
      const speedColor = item.telemetry.speed > item.telemetry.speedLimit ? '#ff3333' : '#00ff00';
      ctx.fillStyle = speedColor;
      ctx.fillText(`SPEED: ${item.telemetry.speed} km/h (LIMIT: ${item.telemetry.speedLimit} km/h)`, 30, 150);
    }
    
    // Draw target marker / crosshair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(400, 250, 60, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(320, 250); ctx.lineTo(480, 250); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(400, 170); ctx.lineTo(400, 330); ctx.stroke();

    // Draw bounding box matching simulated coords
    const bbox = item.telemetry?.bbox || { x: 25, y: 35, w: 30, h: 40 };
    const bx = (bbox.x / 100) * 800;
    const by = (bbox.y / 100) * 500;
    const bw = (bbox.w / 100) * 800;
    const bh = (bbox.h / 100) * 500;
    
    const color = item.severity === 'high' ? '#ff3333' : '#ffaa00';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);

    // Corner bracket styles on bbox
    ctx.fillStyle = color;
    ctx.fillRect(bx - 3, by - 3, 15, 4);
    ctx.fillRect(bx - 3, by - 3, 4, 15);
    ctx.fillRect(bx + bw - 12, by - 3, 15, 4);
    ctx.fillRect(bx + bw - 1, by - 3, 4, 15);
    ctx.fillRect(bx - 3, by + bh - 1, 15, 4);
    ctx.fillRect(bx - 3, by + bh - 12, 4, 15);
    ctx.fillRect(bx + bw - 12, by + bh - 1, 15, 4);
    ctx.fillRect(bx + bw - 1, by + bh - 12, 4, 15);
    
    // OCR label tag
    ctx.fillStyle = color;
    ctx.fillRect(bx - 2, by - 24, bw + 4, 22);
    ctx.fillStyle = '#0a0d1e';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${item.type.name} (${item.confidence.toFixed(1)}%)`, bx + 6, by - 8);

    // Scanline effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let sl = 0; sl < 500; sl += 4) {
      ctx.fillRect(0, sl, 800, 1.5);
    }
    
    // Vignette
    const grad = ctx.createRadialGradient(400, 250, 200, 400, 250, 450);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    const snapshot = canvas.toDataURL('image/png');
    openChallanWindow(item, snapshot);
  };

  // ZIP download helper
  const handleDownloadZip = (e, item) => {
    e.stopPropagation();
    downloadEvidenceZip(item, null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filters panel */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <Filter className="w-5 h-5 text-cyan-accent" />
              <h2 className="text-sm font-bold text-white/95 uppercase tracking-widest" style={{ fontFamily: 'var(--font-heading)' }}>
                Historical Records Filter
              </h2>
            </div>
            <span className="text-[11px] font-mono font-bold text-cyan-accent bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full shadow-sm">
              {filteredArchive.length} of {archive.length} Items Found
            </span>
          </div>
          <button 
            onClick={handleResetFilters}
            className="flex items-center gap-2 text-xs font-semibold text-navy-200 hover:text-cyan-accent transition-all bg-white/[0.03] hover:bg-white/[0.06] px-4 py-2 rounded-xl border border-white/[0.06] active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Filters
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Plate Search */}
          <div className="flex flex-col gap-2 col-span-1 md:col-span-2 lg:col-span-2">
            <label className="text-[11px] text-navy-300 uppercase tracking-widest font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Search License Plate
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <input
                type="text"
                placeholder="e.g. KA 51 YZ 6789"
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                className="w-full bg-navy-950/60 hover:bg-navy-950/90 border border-white/[0.08] focus:border-cyan-accent/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white/90 placeholder-navy-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Violation Type */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-navy-300 uppercase tracking-widest font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Violation
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-navy-950/60 hover:bg-navy-950/90 border border-white/[0.08] focus:border-cyan-accent/50 rounded-xl py-2.5 px-4 text-sm text-white/90 outline-none transition-all cursor-pointer"
            >
              <option value="all">All Violations</option>
              {Object.entries(VIOLATION_TYPES).map(([key, val]) => (
                <option key={key} value={val.id}>
                  {val.name}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-navy-300 uppercase tracking-widest font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Severity
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full bg-navy-950/60 hover:bg-navy-950/90 border border-white/[0.08] focus:border-cyan-accent/50 rounded-xl py-2.5 px-4 text-sm text-white/90 outline-none transition-all cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="high">Severe Violation</option>
              <option value="medium">Medium Risk</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-navy-300 uppercase tracking-widest font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-navy-950/60 hover:bg-navy-950/90 border border-white/[0.08] focus:border-cyan-accent/50 rounded-xl py-2.5 px-4 text-sm text-white/90 outline-none transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Challan Sent">Challan Sent</option>
              <option value="Paid">Paid</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-navy-300 uppercase tracking-widest font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Date Range
            </label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-navy-950/60 hover:bg-navy-950/90 border border-white/[0.08] focus:border-cyan-accent/50 rounded-xl py-2.5 px-4 text-sm text-white/90 outline-none transition-all cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
            </select>
          </div>

        </div>

        {/* Location & Sorting Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-white/[0.04]">
          {/* Location */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-navy-300 uppercase tracking-widest font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Camera Location
            </label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full bg-navy-950/60 hover:bg-navy-950/90 border border-white/[0.08] focus:border-cyan-accent/50 rounded-xl py-2.5 px-4 text-sm text-white/90 outline-none transition-all cursor-pointer"
            >
              <option value="all">All Locations</option>
              {cameraLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-navy-300 uppercase tracking-widest font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-navy-950/60 hover:bg-navy-950/90 border border-white/[0.08] focus:border-cyan-accent/50 rounded-xl py-2.5 px-4 text-sm text-white/90 outline-none transition-all cursor-pointer"
            >
              <option value="date-newest">Date: Newest First</option>
              <option value="date-oldest">Date: Oldest First</option>
              <option value="confidence-highest">Confidence: Highest</option>
              <option value="confidence-lowest">Confidence: Lowest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Archive List / Table */}
      <div className="glass-card overflow-hidden">
        {filteredArchive.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-12 h-12 text-navy-600 mb-3 animate-pulse" />
            <h3 className="text-base font-bold text-white/90 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              No violations matched search filters
            </h3>
            <p className="text-xs text-navy-300 max-w-xs">
              Try modifying your criteria, resetting search parameters, or choosing a wider date range.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="archive-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="py-4 px-6 font-bold text-[11px] text-navy-300 uppercase tracking-widest border-b border-white/[0.06]">
                      ID / Status
                    </th>
                    <th className="py-4 px-6 font-bold text-[11px] text-navy-300 uppercase tracking-widest border-b border-white/[0.06]">
                      Violation
                    </th>
                    <th className="py-4 px-6 font-bold text-[11px] text-navy-300 uppercase tracking-widest border-b border-white/[0.06]">
                      Vehicle Plate
                    </th>
                    <th className="py-4 px-6 font-bold text-[11px] text-navy-300 uppercase tracking-widest border-b border-white/[0.06]">
                      Date &amp; Time
                    </th>
                    <th className="py-4 px-6 font-bold text-[11px] text-navy-300 uppercase tracking-widest border-b border-white/[0.06]">
                      Location
                    </th>
                    <th className="py-4 px-6 font-bold text-[11px] text-navy-300 uppercase tracking-widest border-b border-white/[0.06]">
                      Severity
                    </th>
                    <th className="py-4 px-6 font-bold text-[11px] text-navy-300 uppercase tracking-widest border-b border-white/[0.06] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredArchive.map((item) => {
                    const isExpanded = expandedId === item.id;
                    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG['Pending'];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <React.Fragment key={item.id}>
                        {/* Standard Table Row */}
                        <tr 
                          onClick={() => toggleRow(item.id)}
                          className={`cursor-pointer hover:bg-white/[0.02] transition-colors border-l-2 ${
                            isExpanded 
                              ? 'bg-white/[0.015] border-cyan-accent shadow-[inset_3px_0_0_0_#00e5ff]' 
                              : item.severity === 'high' ? 'border-alert-red/30' : 'border-alert-yellow/30'
                          }`}
                        >
                          {/* ID & Status */}
                          <td className="py-5 px-6">
                            <div className="flex flex-col gap-2">
                              <span className="text-xs font-mono font-bold text-white/95">
                                {item.id.replace('viol-hist-', 'VG-')}
                              </span>
                              {/* Visual status pill */}
                              <span 
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase py-1 px-3 rounded-full border max-w-fit"
                                style={{ 
                                  color: statusConfig.color, 
                                  backgroundColor: statusConfig.bg, 
                                  borderColor: statusConfig.border 
                                }}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {item.status}
                              </span>
                            </div>
                          </td>

                          {/* Violation */}
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <span className="text-xl bg-white/[0.04] p-2 rounded-xl border border-white/[0.06] shadow-sm flex items-center justify-center w-10 h-10 shrink-0">{item.type.icon}</span>
                              <div>
                                <div className="text-sm font-bold text-white/90 leading-tight">
                                  {item.type.name}
                                </div>
                                <div className="text-[11px] font-mono text-navy-300 mt-1">
                                  Conf: <span className="text-cyan-accent font-semibold">{item.confidence.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Plate */}
                          <td className="py-5 px-6">
                            <div className="license-plate shadow-sm">
                              <div className="plate-header">IND</div>
                              <div className="plate-text">{item.licensePlate}</div>
                            </div>
                          </td>

                          {/* Date/Time */}
                          <td className="py-5 px-6 font-mono text-xs text-navy-200">
                            {formatDateTime(item.timestamp)}
                          </td>

                          {/* Location */}
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-1.5 text-xs text-white/85">
                              <MapPin className="w-3.5 h-3.5 text-navy-400" />
                              <span>{item.cameraId.split(' ').slice(1).join(' ')}</span>
                            </div>
                          </td>

                          {/* Severity */}
                          <td className="py-5 px-6">
                            <span className={`severity-badge-v2 ${item.severity}`}>
                              {item.severity === 'high' ? '● Severe' : '● Medium'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2.5">
                              <button
                                onClick={(e) => handleGenerateChallan(e, item)}
                                className="btn-challan flex items-center justify-center p-2 rounded-xl border border-cyan-accent/20 hover:border-cyan-accent bg-cyan-accent/5 hover:bg-cyan-accent/15 text-cyan-accent transition-all active:scale-95 cursor-pointer"
                                title="📄 Generate Challan"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDownloadZip(e, item)}
                                className="btn-evidence-zip flex items-center justify-center p-2 rounded-xl border border-navy-500/30 hover:border-navy-500 bg-white/[0.03] text-navy-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                                title="Evidence ZIP"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleRow(item.id)}
                                className="flex items-center justify-center p-2 rounded-xl text-navy-400 hover:text-white transition-colors cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Sub-Row (Evidence & Telemetry) */}
                        {isExpanded && (
                          <tr className="bg-white/[0.005]">
                            <td colSpan="7" className="py-4 px-6 border-b border-white/[0.06]">
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                                
                                {/* Left Column: Simulated High-tech CCTV Overlay Frame */}
                                <div className="lg:col-span-7 flex flex-col gap-2">
                                  <div className="text-[10px] text-navy-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                                    <Camera className="w-3.5 h-3.5 text-cyan-accent" />
                                    Archived Telemetry Overlay Frame
                                  </div>
                                  
                                  {/* Simulated CCTV Frame */}
                                  <div className="relative rounded-lg overflow-hidden border border-white/[0.08] aspect-video bg-[#050713]">
                                    {/* Grid background pattern */}
                                    <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                                    
                                    {/* Radar scanning radial gradient */}
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.05)_0%,transparent_70%)] animate-pulse" />

                                    {/* Scanlines */}
                                    <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-5" />

                                    {/* Digital Telemetry HUD */}
                                    <div className="absolute top-3 left-4 right-4 flex justify-between font-mono text-[9px] text-cyan-accent font-bold tracking-wider pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1">
                                          <span className="h-1.5 w-1.5 rounded-full bg-alert-red animate-ping" />
                                          <span>REC [ARCHIVED]</span>
                                        </div>
                                        <div>{item.cameraId.toUpperCase()}</div>
                                        <div>GPS: 12.97° N | 77.59° E</div>
                                      </div>
                                      <div className="text-right flex flex-col gap-1">
                                        <div>{item.timestamp.toISOString().replace('T', ' ').substring(0, 19)}</div>
                                        <div>RESOL: 1920x1080 30FPS</div>
                                        <div>SRC: TRAFFIC_OCR_ENGINE_v4</div>
                                      </div>
                                    </div>

                                    {/* Bounding box simulation */}
                                    {item.telemetry && (
                                      <div 
                                        className="absolute border-2 pointer-events-none flex flex-col justify-between"
                                        style={{
                                          left: `${item.telemetry.bbox.x}%`,
                                          top: `${item.telemetry.bbox.y}%`,
                                          width: `${item.telemetry.bbox.w}%`,
                                          height: `${item.telemetry.bbox.h}%`,
                                          borderColor: item.severity === 'high' ? '#ff4444' : '#ff8c00',
                                          boxShadow: `0 0 12px ${item.severity === 'high' ? 'rgba(255,68,68,0.3)' : 'rgba(255,140,0,0.3)'}`
                                        }}
                                      >
                                        {/* Brackets in corners */}
                                        <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2" style={{ borderColor: item.severity === 'high' ? '#ff4444' : '#ff8c00' }} />
                                        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2" style={{ borderColor: item.severity === 'high' ? '#ff4444' : '#ff8c00' }} />
                                        <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2" style={{ borderColor: item.severity === 'high' ? '#ff4444' : '#ff8c00' }} />
                                        <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2" style={{ borderColor: item.severity === 'high' ? '#ff4444' : '#ff8c00' }} />

                                        {/* Target Overlay Label */}
                                        <div 
                                          className="absolute -top-5 left-0 px-1.5 py-0.5 text-[8px] font-bold font-mono text-black rounded uppercase tracking-wider"
                                          style={{ backgroundColor: item.severity === 'high' ? '#ff4444' : '#ff8c00' }}
                                        >
                                          {item.type.name.replace(' Non-Compliance', '').replace(' Violation', '')} ({item.confidence.toFixed(1)}%)
                                        </div>
                                      </div>
                                    )}

                                    {/* Speed Overlay Indicator */}
                                    {item.telemetry && (
                                      <div className="absolute bottom-3 left-4 flex items-center gap-1.5 font-mono text-[10px] bg-black/60 border border-white/10 px-2.5 py-1 rounded backdrop-blur-sm pointer-events-none">
                                        <Gauge className="w-3.5 h-3.5 text-navy-300" />
                                        <span className="text-navy-300">SPEED:</span>
                                        <span className={item.telemetry.speed > item.telemetry.speedLimit ? 'text-alert-red font-bold animate-pulse' : 'text-success-green font-bold'}>
                                          {item.telemetry.speed} km/h
                                        </span>
                                        <span className="text-navy-500">/</span>
                                        <span className="text-navy-400">{item.telemetry.speedLimit} Limit</span>
                                      </div>
                                    )}

                                    {/* OCR Overlay Plate Indicator */}
                                    <div className="absolute bottom-3 right-4 font-mono text-[9px] bg-black/60 border border-white/10 px-2 py-1 rounded backdrop-blur-sm pointer-events-none text-cyan-accent">
                                      PLATE_OCR: {item.licensePlate}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Column: Violation Details & Status Changer */}
                                <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
                                  <div className="space-y-3">
                                    <div className="text-[10px] text-navy-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                                      <Shield className="w-3.5 h-3.5 text-cyan-accent" />
                                      Administrative Panel
                                    </div>

                                    {/* Details block */}
                                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3.5 font-mono text-[11px] text-navy-200 space-y-1.5">
                                      <div className="flex justify-between border-b border-white/[0.04] pb-1.5 mb-1.5">
                                        <span className="text-navy-400">Record ID</span>
                                        <span className="font-bold text-white/90">{item.id}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-navy-400">Vehicle Type</span>
                                        <span>{item.vehicleType}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-navy-400">Location</span>
                                        <span className="truncate max-w-[200px]" title={item.cameraId}>{item.cameraId}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-navy-400">Model Inference</span>
                                        <span>COCO-SSD TF.js (96.3% Acc)</span>
                                      </div>
                                      <div className="flex justify-between border-t border-white/[0.04] pt-1.5 mt-1.5">
                                        <span className="text-navy-400">Fine Section</span>
                                        <span className="text-alert-yellow">{item.type.id === 'helmet' ? 'Sec 129 MV Act' : item.type.id === 'red_light' || item.type.id === 'wrong_side' || item.type.id === 'stop_line' ? 'Sec 119 MV Act' : item.type.id === 'triple_riding' ? 'Sec 128 MV Act' : item.type.id === 'seatbelt' ? 'Sec 138(3) MV Act' : 'Sec 122 MV Act'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-navy-400">Fine Amount</span>
                                        <span className="font-bold text-white/90">₹{item.type.id === 'helmet' || item.type.id === 'illegal_parking' ? '500' : item.type.id === 'wrong_side' ? '1,500' : '1,000'}</span>
                                      </div>
                                    </div>

                                    {/* Administrative Action: Update Status */}
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] text-navy-400 uppercase tracking-wider font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                                        Update Challan Status
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <select
                                          value={item.status}
                                          onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                                          className="bg-navy-950/80 border border-white/[0.08] focus:border-cyan-accent/50 rounded-lg py-2 px-3 text-xs text-white/90 outline-none transition-all cursor-pointer flex-1"
                                        >
                                          <option value="Pending">Pending</option>
                                          <option value="Challan Sent">Challan Sent</option>
                                          <option value="Paid">Paid</option>
                                          <option value="Dismissed">Dismissed</option>
                                        </select>
                                        <span className="text-[10px] text-navy-400 font-mono italic">Changes persist instantly</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                                    <button
                                      onClick={(e) => handleGenerateChallan(e, item)}
                                      className="btn-challan py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-cyan-accent hover:bg-cyan-accent-hover text-black transition-colors cursor-pointer"
                                    >
                                      <FileText className="w-4 h-4" />
                                      Print e-Challan
                                    </button>
                                    <button
                                      onClick={(e) => handleDownloadZip(e, item)}
                                      className="btn-evidence-zip py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-white/90 transition-all cursor-pointer"
                                    >
                                      <Archive className="w-4 h-4" />
                                      Download Evidence
                                    </button>
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="block lg:hidden divide-y divide-white/[0.06]">
              {filteredArchive.map((item) => {
                const isExpanded = expandedId === item.id;
                const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG['Pending'];
                const StatusIcon = statusConfig.icon;

                return (
                  <div 
                    key={item.id}
                    className={`p-5 flex flex-col gap-4 hover:bg-white/[0.01] transition-colors border-l-3 ${
                      isExpanded 
                        ? 'bg-white/[0.015] border-cyan-accent' 
                        : item.severity === 'high' ? 'border-alert-red/30' : 'border-alert-yellow/30'
                    }`}
                  >
                    {/* Card Header: ID & Status + Time */}
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-mono font-bold text-white/95">
                          {item.id.replace('viol-hist-', 'VG-')}
                        </span>
                        <span 
                          className="inline-flex items-center gap-1 text-[9px] font-bold uppercase py-0.5 px-2.5 rounded-full border"
                          style={{ 
                            color: statusConfig.color, 
                            backgroundColor: statusConfig.bg, 
                            borderColor: statusConfig.border 
                          }}
                        >
                          <StatusIcon className="w-2.5 h-2.5" />
                          {item.status}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-navy-300">
                        {formatDateTime(item.timestamp)}
                      </span>
                    </div>

                    {/* Card Body: Violation Info & License Plate */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg bg-white/[0.04] p-2 rounded-xl border border-white/[0.06] flex items-center justify-center w-10 h-10 shrink-0">{item.type.icon}</span>
                        <div>
                          <h4 className="text-xs font-bold text-white/90">{item.type.name}</h4>
                          <span className="text-[10px] font-mono text-navy-400">Conf: {item.confidence.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div className="license-plate">
                        <div className="plate-header">IND</div>
                        <div className="plate-text">{item.licensePlate}</div>
                      </div>
                    </div>

                    {/* Card Meta: Camera & Severity */}
                    <div className="flex items-center justify-between text-xs text-navy-200">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-navy-400" />
                        <span>{item.cameraId.split(' ').slice(1).join(' ')}</span>
                      </div>
                      <span className={`severity-badge-v2 ${item.severity} scale-90`}>
                        {item.severity === 'high' ? '● Severe' : '● Medium'}
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleGenerateChallan(e, item)}
                        className="btn-challan py-2 px-3 rounded-xl border border-cyan-accent/20 hover:border-cyan-accent bg-cyan-accent/5 hover:bg-cyan-accent/15 text-cyan-accent flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Challan
                      </button>
                      <button
                        onClick={(e) => handleDownloadZip(e, item)}
                        className="btn-evidence-zip py-2 px-3 rounded-xl border border-navy-500/30 hover:border-navy-500 bg-white/[0.03] text-navy-300 hover:text-white flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        ZIP
                      </button>
                      <button
                        onClick={() => toggleRow(item.id)}
                        className="flex items-center justify-center p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-navy-300 hover:text-white cursor-pointer animate-none"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Expanded Detail view inside Card */}
                    {isExpanded && (
                      <div className="mt-2 pt-4 border-t border-white/[0.06] flex flex-col gap-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        {/* Telemetry frame HUD */}
                        <div className="relative rounded-lg overflow-hidden border border-white/[0.08] aspect-video bg-[#050713]">
                          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.05)_0%,transparent_70%)] animate-pulse" />
                          <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-5" />

                          <div className="absolute top-2 left-3 right-3 flex justify-between font-mono text-[8px] text-cyan-accent font-bold tracking-wider pointer-events-none">
                            <div className="flex flex-col">
                              <div>REC [ARCHIVED]</div>
                              <div>{item.cameraId.split(' ')[0]}</div>
                            </div>
                            <div className="text-right">
                              {item.timestamp.toISOString().substring(0, 10)}
                            </div>
                          </div>

                          {item.telemetry && (
                            <div 
                              className="absolute border border-dashed pointer-events-none"
                              style={{
                                left: `${item.telemetry.bbox.x}%`,
                                top: `${item.telemetry.bbox.y}%`,
                                width: `${item.telemetry.bbox.w}%`,
                                height: `${item.telemetry.bbox.h}%`,
                                borderColor: item.severity === 'high' ? '#ff4444' : '#ff8c00',
                              }}
                            />
                          )}

                          {item.telemetry && (
                            <div className="absolute bottom-2 left-3 font-mono text-[8px] bg-black/60 px-1.5 py-0.5 rounded text-navy-300">
                              SPD: {item.telemetry.speed} km/h
                            </div>
                          )}
                        </div>

                        {/* Telemetry Details */}
                        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 font-mono text-[10px] text-navy-200 space-y-1">
                          <div className="flex justify-between border-b border-white/[0.04] pb-1.5 mb-1.5">
                            <span className="text-navy-400">Fine Section</span>
                            <span className="text-alert-yellow font-bold">
                              {item.type.id === 'helmet' ? 'Sec 129 MV Act' : item.type.id === 'red_light' || item.type.id === 'wrong_side' || item.type.id === 'stop_line' ? 'Sec 119 MV Act' : item.type.id === 'triple_riding' ? 'Sec 128 MV Act' : 'Sec 122 MV Act'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-navy-400">Fine Amount</span>
                            <span className="font-bold text-white/90">₹{item.type.id === 'helmet' || item.type.id === 'illegal_parking' ? '500' : '1,000'}</span>
                          </div>
                        </div>

                        {/* Status Change */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-navy-300 uppercase tracking-widest font-bold">Update Status</label>
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                            className="bg-navy-950/80 border border-white/[0.08] focus:border-cyan-accent/50 rounded-lg py-2 px-3 text-xs text-white/90 outline-none transition-all cursor-pointer w-full"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Challan Sent">Challan Sent</option>
                            <option value="Paid">Paid</option>
                            <option value="Dismissed">Dismissed</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
