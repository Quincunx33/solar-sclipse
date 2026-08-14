import React, { useState, useEffect } from 'react';
import { RotateCcw, Maximize2, Minimize2, Info, BookOpen } from 'lucide-react';

interface HeaderClocksProps {
  currentTimestamp: number;
  dateLabel?: string;
  onResetCamera?: () => void;
  onOpenInfo?: () => void;
  onOpenArchive?: () => void;
}

interface TimeComponent {
  timeStr: string;
  ampm: string;
}

function getTimeComponentsForOffset(utcSeconds: number, offsetHours: number): TimeComponent {
  const localSeconds = ((utcSeconds + offsetHours * 3600) % 86400 + 86400) % 86400;
  const h24 = Math.floor(localSeconds / 3600) % 24;
  const mins = Math.floor((localSeconds % 3600) / 60);

  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;

  return {
    timeStr: `${h12}:${String(mins).padStart(2, '0')}`,
    ampm,
  };
}

export const HeaderClocks: React.FC<HeaderClocksProps> = ({
  currentTimestamp,
  dateLabel = 'AUG 12, 2026',
  onResetCamera,
  onOpenInfo,
  onOpenArchive,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Greenland (East Greenland / Totality Path on Aug 12 is GMT-1 / UTC-1)
  const greenlandTime = getTimeComponentsForOffset(currentTimestamp, -1);
  // Iceland (GMT / UTC+0)
  const icelandTime = getTimeComponentsForOffset(currentTimestamp, 0);
  // Spain (CEST / UTC+2)
  const spainTime = getTimeComponentsForOffset(currentTimestamp, 2);

  return (
    <header className="eclipse-header w-full px-2 py-2 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 z-30 text-white font-sans select-none shrink-0 relative">
      {/* Spacer on left for symmetry on wide screens */}
      <div className="hidden lg:flex items-center gap-2 w-36 shrink-0">
        <span className="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(253,224,71,0.9)]" />
        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-400">Eclipse Lab</span>
      </div>

      {/* Main Centered Clocks Bar: responsive, non-wrapping, jitter-free with tight unified units */}
      <div className="order-3 sm:order-none basis-full sm:basis-auto flex-1 flex items-center justify-between sm:justify-center flex-nowrap gap-1 sm:gap-5 md:gap-8 lg:gap-12 min-w-0 px-0 sm:px-2 pt-1 sm:pt-0 border-t border-white/10 sm:border-0">
        {/* Date: {dateLabel} */}
        <div className="shrink-0 text-[8px] sm:text-xs md:text-sm lg:text-base font-semibold text-slate-300 tracking-[0.08em] sm:tracking-[0.16em] text-slate-300 uppercase whitespace-nowrap">
          {dateLabel}
        </div>

        {/* 1. Greenland: 🇬🇱 3:00 PM WGST (GMT-1) */}
        <div className="flex items-center shrink-0">
          <span className="text-xs sm:text-lg md:text-2xl lg:text-3xl leading-none select-none drop-shadow-sm mr-0.5 sm:mr-1.5" role="img" aria-label="Greenland flag">
            🇬🇱
          </span>
          <span className="text-xs sm:text-lg md:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-none tabular-nums font-mono sm:font-sans">
            {greenlandTime.timeStr}
          </span>
          <div className="ml-1 flex flex-col justify-center text-left leading-[1.05] shrink-0">
            <span className="text-[7px] sm:text-[9px] md:text-[11px] lg:text-xs font-bold text-white tracking-tight uppercase leading-none">
              {greenlandTime.ampm}
            </span>
            <span className="hidden sm:block text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-semibold text-slate-300 tracking-tight uppercase leading-none mt-0.5">
              WGST
            </span>
          </div>
        </div>

        {/* 2. Iceland: 🇮🇸 4:00 PM GMT (GMT+0) */}
        <div className="flex items-center shrink-0">
          <span className="text-xs sm:text-lg md:text-2xl lg:text-3xl leading-none select-none drop-shadow-sm mr-0.5 sm:mr-1.5" role="img" aria-label="Iceland flag">
            🇮🇸
          </span>
          <span className="text-xs sm:text-lg md:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-none tabular-nums font-mono sm:font-sans">
            {icelandTime.timeStr}
          </span>
          <div className="ml-1 flex flex-col justify-center text-left leading-[1.05] shrink-0">
            <span className="text-[7px] sm:text-[9px] md:text-[11px] lg:text-xs font-bold text-white tracking-tight uppercase leading-none">
              {icelandTime.ampm}
            </span>
            <span className="hidden sm:block text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-semibold text-slate-300 tracking-tight uppercase leading-none mt-0.5">
              GMT
            </span>
          </div>
        </div>

        {/* 3. Spain: 🇪🇸 6:00 PM CEST (GMT+2) */}
        <div className="flex items-center shrink-0">
          <span className="text-xs sm:text-lg md:text-2xl lg:text-3xl leading-none select-none drop-shadow-sm mr-0.5 sm:mr-1.5" role="img" aria-label="Spain flag">
            🇪🇸
          </span>
          <span className="text-xs sm:text-lg md:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-none tabular-nums font-mono sm:font-sans">
            {spainTime.timeStr}
          </span>
          <div className="ml-1 flex flex-col justify-center text-left leading-[1.05] shrink-0">
            <span className="text-[7px] sm:text-[9px] md:text-[11px] lg:text-xs font-bold text-white tracking-tight uppercase leading-none">
              {spainTime.ampm}
            </span>
            <span className="hidden sm:block text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-semibold text-slate-300 tracking-tight uppercase leading-none mt-0.5">
              CEST
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Archive, Info, Reset Button and Toggle Fullscreen Button */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
        {onOpenArchive && (
          <button
            onClick={onOpenArchive}
            className="eclipse-control flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-mono font-medium uppercase tracking-wider sm:px-2.5 sm:py-1.5 sm:text-[11px]"
            title="Open historical eclipse archive"
          >
            <BookOpen className="h-3 w-3 text-amber-300" />
            <span className="hidden sm:inline">Archive</span>
          </button>
        )}

        {onOpenInfo && (
          <button
            onClick={onOpenInfo}
            className="eclipse-control flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] uppercase tracking-wider font-medium font-mono"
            title="Data Sources & Attributions"
          >
            <Info className="w-3 h-3 text-cyan-300" />
            <span className="hidden sm:inline">Info</span>
          </button>
        )}

        {onResetCamera && (
          <button
            onClick={onResetCamera}
            className="eclipse-control flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] uppercase tracking-wider font-medium font-mono"
            title="Reset Camera & Auto-tracking"
          >
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}

        <button
          onClick={toggleFullscreen}
          className="eclipse-control flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] uppercase tracking-wider font-medium font-mono"
          title={isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-3 h-3 text-amber-400" />
          ) : (
            <Maximize2 className="w-3 h-3 text-amber-400" />
          )}
          <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>
      </div>
    </header>
  );
};
