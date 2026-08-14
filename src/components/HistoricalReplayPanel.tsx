import type { FC } from 'react';
import type { HistoricalEclipse } from '../data/historicalEclipses';
import type { HistoricalScenario } from '../data/historicalScenarios';

interface HistoricalReplayPanelProps {
  eclipse: HistoricalEclipse;
  scenario: HistoricalScenario;
  currentTimestamp: number;
  onExit: () => void;
}

export const HistoricalReplayPanel: FC<HistoricalReplayPanelProps> = ({ eclipse, scenario, currentTimestamp, onExit }) => {
  const progress = Math.min(100, Math.max(0, ((currentTimestamp - scenario.start) / (scenario.end - scenario.start)) * 100));
  const activeIndex = Math.min(scenario.waypoints.length - 1, Math.floor((progress / 100) * scenario.waypoints.length));

  return (
    <section className="w-[min(300px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#07111e]/90 shadow-2xl backdrop-blur-xl">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">Archive replay</div>
          <button onClick={onExit} className="rounded-md border border-white/10 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-slate-400 hover:border-cyan-300/30 hover:text-cyan-200">Exit</button>
        </div>
        <h2 className="mt-2 text-lg font-semibold text-white">{eclipse.title}</h2>
        <div className="mt-1 text-[11px] font-mono uppercase tracking-wider text-amber-200">{eclipse.date}</div>
      </div>
      <div className="space-y-4 px-4 py-4">
        <div className="grid grid-cols-2 gap-3 text-xs"><div><div className="text-[9px] font-mono uppercase tracking-wider text-slate-500">Duration</div><div className="mt-1 text-slate-200">{eclipse.duration}</div></div><div><div className="text-[9px] font-mono uppercase tracking-wider text-slate-500">Region</div><div className="mt-1 truncate text-slate-200">{eclipse.region}</div></div></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-300 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        <div className="border-t border-white/10 pt-3"><div className="mb-2 flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-slate-500"><span>Path checkpoint</span><span>{Math.round(progress)}%</span></div><div className="text-sm font-medium text-slate-200">{scenario.waypoints[activeIndex]?.name ?? 'Route in progress'}</div><div className="mt-1 text-[11px] font-mono text-cyan-200">{scenario.waypoints[activeIndex]?.coords.lat.toFixed(1)}° {scenario.waypoints[activeIndex]?.coords.lon.toFixed(1)}°</div></div>
        <p className="text-[11px] leading-5 text-slate-500">Archive replay uses a representative route overview for visual exploration; consult the linked catalog for authoritative contact timings.</p>
      </div>
    </section>
  );
};
