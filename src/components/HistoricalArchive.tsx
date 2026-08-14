import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { ExternalLink, Search, X, Clock3, MapPinned, Sparkles } from 'lucide-react';
import { HISTORICAL_ECLIPSES } from '../data/historicalEclipses';

interface HistoricalArchiveProps {
  onClose: () => void;
  onReplay: (id: string) => void;
}

export const HistoricalArchive: FC<HistoricalArchiveProps> = ({ onClose, onReplay }) => {
  const [query, setQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<'all' | 'ancient' | 'modern'>('all');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return HISTORICAL_ECLIPSES.filter((eclipse) => {
      const matchesQuery = !normalized || [eclipse.title, eclipse.date, eclipse.region, eclipse.significance].join(' ').toLowerCase().includes(normalized);
      const matchesEra = selectedYear === 'all' || (selectedYear === 'ancient' ? eclipse.year < 1800 : eclipse.year >= 1800);
      return matchesQuery && matchesEra;
    });
  }, [query, selectedYear]);

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-[#050711]/96 backdrop-blur-xl">
      <div className="mx-auto min-h-full w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <header className="mb-7 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" /> Archive / Totality
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Solar eclipses that changed how we see the sky</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">A curated record of notable total eclipses, from early historical accounts to modern scientific milestones. Dates and durations follow the cited source catalogs.</p>
          </div>
          <button onClick={onClose} className="eclipse-control rounded-xl p-2.5" aria-label="Close archive"><X className="h-5 w-5" /></button>
        </header>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="eclipse-control flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2.5 sm:max-w-md">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" placeholder="Search year, place, or story" />
          </label>
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {(['all', 'ancient', 'modern'] as const).map((era) => (
              <button key={era} onClick={() => setSelectedYear(era)} className={`rounded-lg px-3 py-2 text-[10px] font-mono uppercase tracking-wider transition ${selectedYear === era ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-500 hover:text-slate-200'}`}>{era}</button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500"><span>{filtered.length} records</span><span>total eclipses only</span></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((eclipse) => (
            <article key={eclipse.id} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[0.06]">
              <div className="mb-5 flex items-start justify-between gap-3"><div><div className="text-2xl font-semibold tracking-tight text-white">{eclipse.year < 0 ? `${Math.abs(eclipse.year)} BCE` : eclipse.year}</div><div className="mt-1 text-[11px] font-mono uppercase tracking-wider text-cyan-300">{eclipse.date}</div></div><span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-amber-200">{eclipse.type}</span></div>
              <h2 className="mb-2 text-base font-semibold text-slate-100">{eclipse.title}</h2>
              <p className="mb-4 min-h-[72px] text-sm leading-6 text-slate-400">{eclipse.significance}</p>
              <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-xs"><div className="flex gap-2 text-slate-400"><Clock3 className="h-3.5 w-3.5 text-amber-300" /><span>{eclipse.duration}</span></div><div className="flex gap-2 text-slate-400"><MapPinned className="h-3.5 w-3.5 text-cyan-300" /><span className="truncate">{eclipse.region}</span></div></div>
              <div className="mt-4 flex items-center justify-between gap-3"><button onClick={() => onReplay(eclipse.id)} className="rounded-lg bg-cyan-400/15 px-2.5 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-400/25">Replay simulation</button><a href={eclipse.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-cyan-300">{eclipse.sourceLabel}<ExternalLink className="h-3 w-3" /></a></div>
            </article>
          ))}
        </div>
        {!filtered.length && <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-500">No eclipse matches that search.</div>}
        <p className="mt-7 text-xs leading-5 text-slate-600">Historical associations can be uncertain; the archive separates documented scientific milestones from traditional or literary attributions. Sources: NASA Solar Eclipse Catalog and timeanddate historical summary.</p>
      </div>
    </div>
  );
};
