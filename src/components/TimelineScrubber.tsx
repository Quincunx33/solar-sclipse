import React from 'react';
import { SIMULATION_START_SECONDS, SIMULATION_END_SECONDS } from '../data/eclipseData';
import { formatSecondsToUTC } from '../utils/astronomy';
import { Play, Pause } from 'lucide-react';

interface TimelineScrubberProps {
  currentTimestamp: number;
  isPlaying: boolean;
  speedMultiplier: number;
  onTimeChange: (newTime: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  startSeconds?: number;
  endSeconds?: number;
  onJumpToMilestone?: (timeSeconds: number, stationId?: string) => void;
}

const SPEED_OPTIONS = [1, 5, 20, 60, 300, 600, 1800];

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  currentTimestamp,
  isPlaying,
  speedMultiplier,
  onTimeChange,
  onTogglePlay,
  onSpeedChange,
  startSeconds = SIMULATION_START_SECONDS,
  endSeconds = SIMULATION_END_SECONDS,
}) => {
  const currentUTCFormatted = formatSecondsToUTC(currentTimestamp);
  const startUTCFormatted = formatSecondsToUTC(startSeconds);
  const endUTCFormatted = formatSecondsToUTC(endSeconds);

  const progressPercent = Math.max(0, Math.min(100, ((currentTimestamp - startSeconds) / Math.max(1, endSeconds - startSeconds)) * 100));

  return (
    <div className="w-full bg-[#050505]/95 backdrop-blur-2xl border-t border-white/20 px-3 py-2 md:px-6 md:py-3.5 flex flex-wrap items-center justify-between gap-4 z-30 text-slate-200 font-sans select-none shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      {/* Desktop Layout (md and up): Play/Pause -> Start -> Slider -> End -> Speed Selector -> Current Time Display */}
      <div className="hidden md:flex items-center justify-between w-full gap-3 max-w-7xl mx-auto font-mono">
        {/* 1. Play / Pause button */}
        <button
          onClick={onTogglePlay}
          className={`w-9 h-9 shrink-0 rounded-sm flex items-center justify-center transition-all border ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'bg-amber-500 text-black font-bold border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:scale-105'
          }`}
          title={isPlaying ? 'Pause Simulation' : 'Play Simulation (Continuous Loop)'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* 2. Start Time */}
        <span className="text-xs text-slate-300 font-bold whitespace-nowrap tracking-wider shrink-0">
          {startUTCFormatted} (UTS)
        </span>

        {/* 3. Slider Track */}
        <div className="relative flex-1 flex items-center h-4 group min-w-[140px] px-1">
          <input
            type="range"
            min={startSeconds}
            max={endSeconds}
            step={5}
            value={currentTimestamp}
            onChange={(e) => onTimeChange(Number(e.target.value))}
            style={{
              background: `linear-gradient(to right, #f59e0b ${progressPercent}%, rgba(255, 255, 255, 0.15) ${progressPercent}%)`
            }}
            className="w-full h-1.5 rounded-sm appearance-none cursor-pointer focus:outline-none transition-all accent-amber-500 group-hover:h-2"
          />
        </div>

        {/* 4. End Time */}
        <span className="text-xs text-slate-300 font-bold whitespace-nowrap tracking-wider shrink-0">
          {endUTCFormatted} (UTS)
        </span>

        {/* 5. Speed Selector (placed immediately to the right of slider/end time) */}
        <select
          value={speedMultiplier}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="px-2.5 py-1.5 rounded-sm bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold hover:bg-cyan-500/25 transition-all tracking-wider text-[11px] cursor-pointer focus:outline-none focus:border-cyan-400 font-mono shrink-0 ml-1"
          title="Select playback speed multiplier"
        >
          {SPEED_OPTIONS.map((spd) => (
            <option key={spd} value={spd} className="bg-slate-900 text-cyan-300 font-mono">
              {spd}x SPEED
            </option>
          ))}
        </select>

        {/* 6. Current Time Display (placed immediately to the right of speed selector) */}
        <div className="text-slate-300 font-medium tracking-wider whitespace-nowrap shrink-0 text-xs pl-1 font-mono">
          <span className="text-white font-bold">{currentUTCFormatted} (UTS)</span>
        </div>
      </div>

      {/* Mobile Layout (below md): compact 2-row scrubber */}
      <div className="flex md:hidden flex-col w-full gap-2 font-mono">
        {/* Row 1: Play/Pause button + Start + Track + End */}
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={onTogglePlay}
            className={`w-7 h-7 shrink-0 rounded-sm flex items-center justify-center transition-all border ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'bg-amber-500 text-black font-bold border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
            }`}
            title={isPlaying ? 'Pause' : 'Play (Loop)'}
          >
            {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
          </button>

          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
            {startUTCFormatted}
          </span>
          <div className="relative flex-1 flex items-center h-4">
            <input
              type="range"
              min={SIMULATION_START_SECONDS}
              max={SIMULATION_END_SECONDS}
              step={5}
              value={currentTimestamp}
              onChange={(e) => onTimeChange(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, #f59e0b ${progressPercent}%, rgba(255, 255, 255, 0.15) ${progressPercent}%)`
              }}
              className="w-full h-1.5 rounded-sm appearance-none cursor-pointer focus:outline-none accent-amber-500"
            />
          </div>
          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
            {endUTCFormatted}
          </span>
        </div>

        {/* Row 2: Speed Selector & Current Time */}
        <div className="flex items-center justify-between w-full">
          <select
            value={speedMultiplier}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="px-2 py-1 rounded-sm bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold hover:bg-cyan-500/25 tracking-wider text-[10px] cursor-pointer focus:outline-none focus:border-cyan-400 font-mono"
            title="Select playback speed multiplier"
          >
            {SPEED_OPTIONS.map((spd) => (
              <option key={spd} value={spd} className="bg-slate-900 text-cyan-300 font-mono">
                {spd}x SPEED
              </option>
            ))}
          </select>

          <div className="text-[11px] text-slate-300 font-bold tracking-wider font-mono">
            {currentUTCFormatted} (UTS)
          </div>
        </div>
      </div>
    </div>
  );
};
