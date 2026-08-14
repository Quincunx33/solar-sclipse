import React from 'react';
import { ObservationStation, TelemetryReadout } from '../types';
import { OBSERVATION_STATIONS } from '../data/eclipseData';
import { MapPin, Eye, ChevronDown, Compass, RefreshCw } from 'lucide-react';

interface TelemetryPanelProps {
  selectedStation: ObservationStation | null;
  stations?: ObservationStation[];
  telemetry: TelemetryReadout;
  onSelectStation: (station: ObservationStation) => void;
  onOpenSkyView?: () => void;
  onClearCustomPin?: () => void;
  isAutoTracking?: boolean;
  onToggleAutoTrack?: () => void;
  trackingMode?: 'auto' | 'manual' | 'spain-fixed';
  onSelectTrackingMode?: (mode: 'auto' | 'manual' | 'spain-fixed') => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  selectedStation,
  stations = OBSERVATION_STATIONS,
  telemetry,
  onSelectStation,
  onClearCustomPin,
  isAutoTracking = false,
  onToggleAutoTrack,
  trackingMode = isAutoTracking ? 'auto' : 'manual',
  onSelectTrackingMode
}) => {
  if (!selectedStation) {
    return (
      <div className="eclipse-glass w-full md:w-88 lg:w-96 xl:w-[410px] rounded-2xl p-5 text-slate-400 font-mono text-xs">
        [ SELECT_STATION_TO_MONITOR ]
      </div>
    );
  }

  const getFlagEmoji = (code: string) => {
    switch (code) {
      case 'GL': return '🇬🇱';
      case 'IS': return '🇮🇸';
      case 'ES': return '🇪🇸';
      case 'CUSTOM': return '📍';
      case 'INTL': return '🌊';
      default: return '🌐';
    }
  };

  const durationMin = Math.floor(selectedStation.eclipseTimes.durationSeconds / 60);
  const durationSec = selectedStation.eclipseTimes.durationSeconds % 60;
  const durationFormatted = `${durationMin}m ${durationSec}s`;

  return (
    <div className="eclipse-glass w-full md:w-88 lg:w-96 xl:w-[410px] rounded-2xl p-4 md:p-5 lg:p-6 flex flex-col justify-start text-slate-200 shrink-0 font-sans select-none">
      <div>
        {/* Architectural Header */}
        <div className="border-b border-white/10 pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,242,254,0.8)]" title="Active Telemetry Link" />
            <h2 className="eclipse-panel-label text-xs lg:text-[13px] font-mono uppercase font-bold">
              OBSERVATION POINT
            </h2>
          </div>

          {selectedStation.isCustom && trackingMode !== 'auto' && onClearCustomPin && (
            <button
              onClick={onClearCustomPin}
              className="text-slate-400 hover:text-white text-xs font-mono tracking-wider uppercase underline underline-offset-4"
            >
              Reset Pin
            </button>
          )}
        </div>

        {/* 2-Mode Tracking Bar */}
        <div className="grid grid-cols-2 gap-1.5 mb-4 bg-black/70 p-1.5 rounded border border-white/15 font-mono text-xs lg:text-[13px] shadow-inner">
          <button
            onClick={() => {
              if (onSelectTrackingMode) onSelectTrackingMode('auto');
              else if (onToggleAutoTrack && !isAutoTracking) onToggleAutoTrack();
            }}
            className={`py-2 px-2 rounded-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              trackingMode === 'auto'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,242,254,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Auto-tracking: Automatically track the center of the Moon's umbral shadow across the Earth"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${trackingMode === 'auto' ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
            <span className="truncate">AUTO</span>
          </button>

          <button
            onClick={() => {
              if (onSelectTrackingMode) onSelectTrackingMode('manual');
              else if (onToggleAutoTrack && isAutoTracking) onToggleAutoTrack();
            }}
            className={`py-2 px-2 rounded-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              trackingMode === 'manual'
                ? 'bg-white/15 text-white border border-white/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Manual mode: Free globe rotation and manual station selection without forced camera movement"
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">MANUAL</span>
          </button>
        </div>

        {/* Country & Station Title */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2.5 mb-1">
            <span className="text-2xl lg:text-3xl leading-none">{getFlagEmoji(selectedStation.countryCode)}</span>
            <span className="text-xl lg:text-2xl font-extrabold text-white tracking-tight uppercase">
              {selectedStation.country === 'Ocean' ? 'Custom Point' : selectedStation.country}
            </span>
          </div>
          <div className="text-sm lg:text-base font-mono text-cyan-300 font-bold tracking-wide pl-9 lg:pl-10">
            {selectedStation.name}
          </div>
        </div>

        {/* Precise Location Selector Box */}
        <div className="relative mb-5 group">
          <div className="w-full bg-black/80 border border-white/20 group-hover:border-cyan-500/50 transition-colors rounded px-4 py-3 flex items-center justify-between text-xs lg:text-sm font-mono text-slate-300 shadow-inner">
            <div className="flex items-center gap-2.5 truncate">
              <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate text-white/90">
                {selectedStation.coords.lat >= 0 ? `${selectedStation.coords.lat.toFixed(4)}° N` : `${Math.abs(selectedStation.coords.lat).toFixed(4)}° S`},{' '}
                {selectedStation.coords.lon >= 0 ? `${selectedStation.coords.lon.toFixed(4)}° E` : `${Math.abs(selectedStation.coords.lon).toFixed(4)}° W`}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </div>

          <select
            value={selectedStation.id}
            onChange={(e) => {
              const found = stations.find((s) => s.id === e.target.value);
              if (found) onSelectStation(found);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            {stations.map((station) => (
              <option key={station.id} value={station.id} className="bg-[#050505] text-white py-1.5 font-mono text-xs lg:text-sm">
                {getFlagEmoji(station.countryCode)} {station.name} ({station.country})
              </option>
            ))}
            {selectedStation.isCustom && (
              <option value={selectedStation.id} className="bg-[#050505] text-emerald-400 font-bold font-mono text-xs lg:text-sm">
                📍 {selectedStation.name}
              </option>
            )}
          </select>
        </div>

        {/* Minimalist Grid Data Table */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 mt-4 text-xs font-mono border-t border-white/10 pt-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] lg:text-xs tracking-wider text-slate-400 uppercase font-medium">Totality Duration</span>
            <span className="text-base lg:text-lg font-bold text-white tracking-wide">{durationFormatted}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] lg:text-xs tracking-wider text-slate-400 uppercase font-medium">Magnitude</span>
            <span className="text-base lg:text-lg font-bold text-white tracking-wide">1.028</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] lg:text-xs tracking-wider text-slate-400 uppercase font-medium">Sun Altitude</span>
            <span className="text-base lg:text-lg font-bold text-white tracking-wide">{telemetry.sunAltitudeDegrees.toFixed(1)}°</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] lg:text-xs tracking-wider text-slate-400 uppercase font-medium">Obscuration</span>
            <span className="text-base lg:text-lg font-bold text-amber-400 tracking-wide">{telemetry.obscurationPercentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

