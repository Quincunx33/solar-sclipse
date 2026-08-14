import React, { useMemo } from 'react';
import { ObservationStation, TelemetryReadout } from '../types';
import { formatSecondsToUTC } from '../utils/astronomy';

interface SkyViewPanelProps {
  selectedStation: ObservationStation | null;
  telemetry: TelemetryReadout;
  currentTimestamp: number;
}

export const SkyViewPanel: React.FC<SkyViewPanelProps> = ({
  selectedStation,
  telemetry,
  currentTimestamp
}) => {
  if (!selectedStation) return null;

  const { obscurationPercentage, currentPhase, sunAltitudeDegrees } = telemetry;
  const isTotality = currentPhase === 'TOTALITY!';
  const isDiamondRing = currentPhase === 'Diamond Ring!';
  const isSunset = sunAltitudeDegrees <= 0;

  // Mathematically and astronomically accurate Moon position relative to Sun (Topocentric Horizon View)
  // In the late afternoon sky looking west (Northern Hemisphere), the Moon enters from below / lower-right
  // and exits towards above / upper-left across the solar disk.
  const obscurationRatio = Math.min(100, Math.max(0, obscurationPercentage)) / 100;
  const isEgress = currentPhase === 'Partial (Egress)' || (telemetry.timeToNextPhase?.includes('Eclipse ends') ?? false);
  
  // Base trajectory angle for the 2026 August sunset eclipse (~65° in the local horizon frame)
  // Ingress: Moon approaches from lower-right (+X, +Y in screen coordinates)
  // Egress: Moon moves away towards upper-left (-X, -Y in screen coordinates)
  const trajectoryAngleRad = 1.13; // ~65 degrees downwards
  const activeAngle = isEgress ? (trajectoryAngleRad + Math.PI) : trajectoryAngleRad;
  const distancePx = isTotality ? 0 : (1.0 - obscurationRatio) * 165;
  const moonX = Math.cos(activeAngle) * distancePx;
  const moonY = Math.sin(activeAngle) * distancePx;

  // Sophisticated dynamic sky color calculation
  const skyBackgroundStyle = useMemo(() => {
    if (isSunset) {
      return {
        background: 'linear-gradient(to bottom, #0f0a14 0%, #2a1220 60%, #4a1c1d 100%)'
      };
    }
    if (isTotality) {
      return {
        background: 'radial-gradient(circle at center, #0a0e1a 0%, #030508 60%, #000000 100%)'
      };
    }
    
    const t = obscurationRatio;
    if (t > 0.85) {
      const factor = (t - 0.85) / 0.15;
      const topColor = `rgba(${Math.round(14 - factor * 10)}, ${Math.round(24 - factor * 18)}, ${Math.round(48 - factor * 35)}, 1)`;
      const bottomColor = `rgba(${Math.round(24 - factor * 18)}, ${Math.round(38 - factor * 30)}, ${Math.round(72 - factor * 55)}, 1)`;
      return { background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)` };
    } else {
      const factor = t / 0.85;
      const topColor = `rgba(${Math.round(28 - factor * 14)}, ${Math.round(65 - factor * 41)}, ${Math.round(135 - factor * 87)}, 1)`;
      const bottomColor = `rgba(${Math.round(70 - factor * 46)}, ${Math.round(130 - factor * 92)}, ${Math.round(210 - factor * 138)}, 1)`;
      return { background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)` };
    }
  }, [obscurationRatio, isTotality, isSunset]);

  return (
    <div className="w-full md:w-88 lg:w-96 xl:w-[410px] bg-[#050505]/95 backdrop-blur-2xl border border-white/20 rounded overflow-hidden shadow-2xl flex flex-col shrink-0 font-sans select-none">
      {/* Architectural Header */}
      <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-3.5 border-b border-white/20 bg-black/60">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,242,254,0.8)]" title="Live Sky Camera Feed" />
          <span className="text-xs lg:text-[13px] font-mono tracking-[0.2em] uppercase text-slate-300 font-bold">
            GROUND SKY VIEW
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs lg:text-[13px] text-slate-400">
          <span>ALT</span>
          <span className="text-white font-bold">{sunAltitudeDegrees.toFixed(1)}°</span>
        </div>
      </div>

      {/* Central Celestial Stage */}
      <div 
        className="relative w-full h-48 sm:h-56 lg:h-64 flex flex-col items-center justify-center overflow-hidden transition-colors duration-700"
        style={skyBackgroundStyle}
      >
        {/* Subtle Astronomical Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Stars in Deep Darkness */}
        {(isTotality || obscurationPercentage > 90) && (
          <div className="absolute inset-0 pointer-events-none transition-opacity duration-1000">
            <div className="absolute top-[20%] left-[25%] w-1 h-1 rounded-full bg-white opacity-80 shadow-[0_0_6px_#fff]" />
            <div className="absolute top-[35%] left-[70%] w-1.5 h-1.5 rounded-full bg-cyan-100 opacity-90 shadow-[0_0_8px_#a5f3fc]" title="Venus" />
            <div className="absolute bottom-[30%] left-[30%] w-1 h-1 rounded-full bg-amber-100 opacity-70" />
            <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 rounded-full bg-orange-200 opacity-85 shadow-[0_0_8px_#fed7aa]" title="Mercury" />
          </div>
        )}

        {/* Horizon Sunset Glow Notice */}
        {isSunset && (
          <div className="absolute bottom-3 px-3 py-1 rounded-sm bg-black/80 border border-rose-500/40 backdrop-blur-md z-30">
            <span className="text-[11px] lg:text-xs font-mono tracking-widest uppercase text-rose-400 font-bold">
              BELOW HORIZON • {sunAltitudeDegrees.toFixed(1)}°
            </span>
          </div>
        )}

        {/* The Celestial Canvas */}
        <div className="relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40 lg:w-44 lg:h-44 my-auto">
          {/* 1. Scientific Corona Glow */}
          {isTotality && (
            <div className="absolute -inset-12 flex items-center justify-center pointer-events-none">
              <div className="absolute w-[190%] h-[190%] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.28)_0%,rgba(186,230,253,0.1)_45%,transparent_70%)] blur-md animate-pulse" />
              <div className="absolute w-[150%] h-[150%] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.5)_0%,rgba(224,242,254,0.18)_50%,transparent_75%)] blur-sm" />
              <div className="absolute w-36 h-36 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full border border-white/40 shadow-[0_0_28px_rgba(255,255,255,0.9)]" />
            </div>
          )}

          {/* 2. Diamond Ring Effect */}
          {isDiamondRing && (
            <div 
              className={`absolute z-30 pointer-events-none flex items-center justify-center ${
                isEgress ? 'bottom-[15%] right-[18%]' : 'top-[15%] left-[18%]'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_20px_#fff,0_0_40px_#38bdf8]" />
              <div className="absolute w-20 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
              <div className="absolute h-20 w-[1px] bg-gradient-to-b from-transparent via-white to-transparent" />
            </div>
          )}

          {/* 3. The Sun Disc */}
          <div
            className={`w-36 h-36 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full transition-colors duration-500 relative z-10 ${
              isTotality
                ? 'bg-black shadow-[0_0_18px_rgba(255,255,255,0.6)]'
                : 'bg-gradient-to-br from-[#fffbeb] via-[#fef08a] to-[#f59e0b] shadow-[0_0_40px_rgba(251,191,36,0.4)]'
            }`}
          />

          {/* 4. The Moon Disc */}
          <div
            className="absolute w-36 h-36 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full bg-[#050505] z-20 transition-transform duration-100 ease-out"
            style={{
              transform: `translate(${moonX}px, ${moonY}px)`
            }}
          />
        </div>
      </div>

      {/* Yugo Nakamura Style Typography Readout & Status */}
      <div className="px-4 py-3 lg:px-6 lg:py-3.5 bg-black/80 border-t border-white/20 flex flex-col gap-2.5">
        <div className="flex items-center justify-between font-mono text-xs lg:text-sm">
          <span className="text-slate-400 tracking-wider uppercase text-[11px] lg:text-xs font-medium">Phase</span>
          <span className="text-white font-bold tracking-widest uppercase">{currentPhase}</span>
        </div>
        <div className="flex items-center justify-between font-mono text-xs lg:text-sm">
          <span className="text-slate-400 tracking-wider uppercase text-[11px] lg:text-xs font-medium">Obscuration</span>
          <span className="text-amber-400 font-extrabold tracking-widest">{obscurationPercentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};


