import React from 'react';
import { HistoricalScenario } from '../data/historicalScenarios';

interface PathMilestone {
  id: string;
  timeUTC: string;
  timeSeconds: number;
  label: string;
  stationId?: string;
  localTime?: string;
  countryFlag?: string;
}

const PATH_MILESTONES: PathMilestone[] = [
  { id: 'm1', timeUTC: '5:00PM (UTS)', timeSeconds: 17 * 3600, label: 'High Arctic / Siberia Umbra Entry' },
  { id: 'm2', timeUTC: '5:35:48PM (UTS)', timeSeconds: 17 * 3600 + 35 * 60 + 48, label: 'Scoresby Sund, Greenland', stationId: 'greenland-ittoqqortoormiit', localTime: 'Local Time: 4:35:48PM WGST (UTC-1)', countryFlag: '🇬🇱' },
  { id: 'm3', timeUTC: '5:47:04PM (UTS)', timeSeconds: 17 * 3600 + 47 * 60 + 4, label: 'Reykjavík, Iceland', stationId: 'iceland-reykjavik', localTime: 'Local Time: 5:47:04PM GMT (UTC+0)', countryFlag: '🇮🇸' },
  { id: 'm4', timeUTC: '5:47:06PM (UTS)', timeSeconds: 17 * 3600 + 47 * 60 + 6, label: 'Greatest Eclipse Point' },
  { id: 'm5', timeUTC: '6:27:23PM (UTS)', timeSeconds: 18 * 3600 + 27 * 60 + 23, label: 'Bilbao (Basque Country)', stationId: 'spain-bilbao', localTime: 'Local Time: 8:27:23PM CEST (UTC+2)', countryFlag: '🇪🇸' },
  { id: 'm6', timeUTC: '6:29:48PM (UTS)', timeSeconds: 18 * 3600 + 29 * 60 + 48, label: 'Zaragoza (Aragón)', stationId: 'spain-zaragoza', localTime: 'Local Time: 8:29:48PM CEST (UTC+2)', countryFlag: '🇪🇸' },
  { id: 'm7', timeUTC: '6:31:05PM (UTS)', timeSeconds: 18 * 3600 + 31 * 60 + 5, label: 'Mallorca Sunset Totality', stationId: 'spain-palma', localTime: 'Local Time: 8:31:05PM CEST (UTC+2)', countryFlag: '🇪🇸' },
  { id: 'm8', timeUTC: '6:31:10PM (UTS)', timeSeconds: 18 * 3600 + 31 * 60 + 10, label: 'Valencia Coast Totality', stationId: 'spain-valencia', localTime: 'Local Time: 8:31:10PM CEST (UTC+2)', countryFlag: '🇪🇸' },
  { id: 'm9', timeUTC: '6:32PM (UTS)', timeSeconds: 18 * 3600 + 32 * 60, label: 'Mediterranean Umbra Exit' },
];

interface PathTimelinePanelProps {
  currentTimestamp: number;
  scenario?: HistoricalScenario | null;
  onSelectMilestone: (timeSeconds: number, stationId?: string) => void;
}

export const PathTimelinePanel: React.FC<PathTimelinePanelProps> = ({
  currentTimestamp,
  scenario,
  onSelectMilestone,
}) => {
  const milestones: PathMilestone[] = scenario
    ? scenario.waypoints.map((waypoint, index) => ({
        id: `${scenario.id}-milestone-${index}`,
        timeUTC: `${Math.floor(waypoint.time / 60)}m ${waypoint.time % 60}s`,
        timeSeconds: waypoint.time,
        label: waypoint.name ?? `Route checkpoint ${index + 1}`,
        stationId: scenario.stations[index]?.id,
      }))
    : PATH_MILESTONES;

  let activeIndex = 0;
  let minDiff = Infinity;
  milestones.forEach((m, idx) => {
    const diff = Math.abs(currentTimestamp - m.timeSeconds);
    if (diff < minDiff) {
      minDiff = diff;
      activeIndex = idx;
    }
  });

  return (
    <div className="w-full md:w-84 lg:w-96 xl:w-[410px] bg-[#050505]/95 backdrop-blur-2xl border border-white/20 rounded p-4 md:p-5 lg:p-6 text-slate-200 shadow-2xl flex flex-col shrink-0 font-sans select-none">
      {/* Architectural Header */}
      <div className="border-b border-white/20 pb-3 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" title="Totality Umbra Path Active" />
          <h2 className="text-xs lg:text-[13px] font-mono tracking-[0.2em] uppercase text-slate-300 font-bold">
            {scenario ? scenario.title : 'PATH OF TOTALITY'}
          </h2>
        </div>
        <span className="text-xs lg:text-[13px] font-mono text-slate-400 uppercase tracking-widest font-medium">TIMELINE</span>
      </div>

      {/* Minimalist Vertical Timeline Tree */}
      <div className="relative flex-1 flex flex-col justify-between py-1 my-1">
        {/* Crisp Connecting Guide Line */}
        <div className="absolute left-[8px] top-4 bottom-4 w-[1px] bg-white/20 -z-0" />

        <div className="flex flex-col gap-4 lg:gap-4.5 relative z-10">
          {            milestones.map((milestone, idx) => {
            const isCurrent = idx === activeIndex;

            return (
              <div
                key={milestone.id}
                onClick={() => onSelectMilestone(milestone.timeSeconds, milestone.stationId)}
                className="flex items-start gap-3.5 group cursor-pointer transition-all"
              >
                {/* Minimal Node */}
                <div className="mt-1 flex items-center justify-center shrink-0">
                  <div
                    className={`rounded-full transition-all duration-300 ${
                      isCurrent
                        ? 'w-4 h-4 bg-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.9)] border-2 border-[#050505] scale-110'
                        : 'w-2.5 h-2.5 bg-slate-600 group-hover:bg-amber-400 group-hover:scale-125 ml-[3px]'
                    }`}
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col -mt-0.5 transition-all duration-200 font-mono flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs lg:text-sm tracking-wider ${
                        isCurrent ? 'text-amber-400 font-bold' : 'text-slate-400 group-hover:text-slate-200 font-medium'
                      }`}
                    >
                      {milestone.timeUTC}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] lg:text-[11px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 uppercase tracking-widest font-bold shadow-sm" title="Current simulated timeline position">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs lg:text-sm mt-0.5 tracking-wide ${
                      isCurrent ? 'text-white font-bold' : 'text-slate-300 group-hover:text-white'
                    }`}
                  >
                    {milestone.label}
                  </span>
                  {milestone.localTime && (
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] lg:text-xs text-cyan-300 font-mono bg-cyan-950/40 border border-cyan-800/60 rounded px-2 py-0.5 w-fit shadow-sm">
                      <span className="text-sm leading-none">{milestone.countryFlag}</span>
                      <span className="font-bold tracking-wide">{milestone.localTime}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
