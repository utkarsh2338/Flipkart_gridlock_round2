import React from 'react';
import { Radio, Wifi } from 'lucide-react';

export default function LiveTicker({ events, liveDemoMode }) {
  if (!events || events.length === 0) return null;

  // Duplicate for seamless infinite scroll
  const tickerItems = [...events, ...events];

  return (
    <div className="ticker-bar py-2.5 relative flex items-center shrink-0">
      {/* Live Badge */}
      <div className="flex items-center gap-2 px-4 pr-5 border-r border-white/[0.06] shrink-0 z-20">
        <div className="relative">
          <Radio className={`w-3.5 h-3.5 ${liveDemoMode ? 'text-alert-red' : 'text-cyan-accent'}`} />
          {liveDemoMode && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-alert-red rounded-full animate-ping" />
          )}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${liveDemoMode ? 'text-alert-red' : 'text-cyan-accent'}`}>
          LIVE FEED
        </span>
        <Wifi className="w-3 h-3 text-navy-400" />
      </div>

      {/* Scrolling Ticker with mask fade */}
      <div className="ticker-mask overflow-hidden flex-1 ml-0">
        <div className="ticker-content">
          {tickerItems.map((event, idx) => (
            <React.Fragment key={`${event.id}-${idx}`}>
              {/* Glowing separator dot */}
              <span className="text-cyan-accent/50 mx-3 text-[6px] shrink-0" style={{ textShadow: '0 0 6px rgba(0,212,255,0.5)' }}>●</span>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    event.severity === 'high'
                      ? 'bg-alert-red shadow-[0_0_6px_rgba(255,68,68,0.5)]'
                      : 'bg-warning-orange shadow-[0_0_6px_rgba(255,140,0,0.4)]'
                  }`}
                />
                <span className="text-[11px] text-navy-200 whitespace-nowrap">
                  {event.text}
                </span>
                <span className="text-[10px] text-navy-400/60 font-mono whitespace-nowrap">
                  {event.timestamp.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
