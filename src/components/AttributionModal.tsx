import React, { useEffect } from 'react';
import { X, ExternalLink, Database, Globe, Compass, BookOpen, Layers } from 'lucide-react';

interface AttributionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SourceItem {
  name: string;
  organization: string;
  description: string;
  url?: string;
  badge: string;
}

const ASTRONOMY_SOURCES: SourceItem[] = [
  {
    name: 'NASA GSFC Solar Eclipse Bulletins & Besselian Elements',
    organization: 'NASA Goddard Space Flight Center',
    description:
      'Official Besselian elements, umbral shadow velocity vectors, contact times (C1–C4), central line duration, and Saros 126 ephemeris calculations for the Total Solar Eclipse of August 12, 2026.',
    url: 'https://eclipse.gsfc.nasa.gov/solar.html',
    badge: 'NASA GSFC',
  },
  {
    name: 'Interactive Solar Eclipse Calculations & Central Line Tables',
    organization: 'Xavier M. Jubier / International Astronomical Union',
    description:
      'High-precision geographic path of totality coordinates, umbral path width data, local circumstance tables across Greenland, Iceland, Spain, and the Balearic Sea.',
    url: 'http://xjubier.free.fr/en/site_pages/solar_eclipses/TSE_2026_GoogleMapFull.html',
    badge: 'Ephemeris',
  },
  {
    name: 'Eclipse Predictions & Path Geometry',
    organization: 'Fred Espenak (Mr. Eclipse)',
    description:
      'Topocentric eclipse magnitude, obscuration formulas, solar altitude/azimuth geometry, and timing milestones for August 12, 2026.',
    url: 'https://www.mreclipse.com/',
    badge: 'Predictions',
  },
];

const ALGORITHM_SOURCES: SourceItem[] = [
  {
    name: 'Astronomical Algorithms (2nd Edition)',
    organization: 'Jean Meeus (Willmann-Bell)',
    description:
      'Mathematical formulas for Greenwich Mean Sidereal Time (GMST), solar coordinates, lunar parallax, atmospheric refraction, and spherical chord intersection for disc obscuration calculations.',
    badge: 'Algorithms',
  },
  {
    name: 'Earth Orientation & Coordinate Systems',
    organization: 'US Naval Observatory (USNO) / IAU SOFA',
    description:
      'Standard reference frames for Earth obliquity (23.44°), subsolar point geographic coordinates, and day/night solar terminator vector geometry.',
    url: 'https://www.usno.navy.mil/',
    badge: 'Geodesy',
  },
];

const CARTOGRAPHY_SOURCES: SourceItem[] = [
  {
    name: 'NASA Visible Earth (Blue Marble & Black Marble)',
    organization: 'NASA Earth Observatory',
    description:
      'High-resolution land surface textures, bathymetry, atmospheric Rayleigh scattering models, and night city illumination data.',
    url: 'https://visibleearth.nasa.gov/',
    badge: 'Textures',
  },
  {
    name: 'Natural Earth Cartographic Datasets',
    organization: 'Natural Earth / Public Domain',
    description:
      'Global coastlines, territorial boundaries, and sovereign country metadata for observation stations in Greenland, Iceland, and Spain.',
    url: 'https://www.naturalearthdata.com/',
    badge: 'Boundaries',
  },
  {
    name: 'Three.js WebGL Engine',
    organization: 'Three.js Authors',
    description:
      'Real-time GPU-accelerated 3D planetary rendering, raycasting, dynamic lighting, matrix transformations, and custom atmospheric shader pipeline.',
    url: 'https://threejs.org/',
    badge: 'Graphics',
  },
];

export const AttributionModal: React.FC<AttributionModalProps> = ({ isOpen, onClose }) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#080b11] border border-white/20 rounded-lg shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col text-slate-200 overflow-hidden font-sans select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/15 bg-black/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-mono font-bold tracking-wider text-white uppercase">
                Data Sources & Attributions
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Astronomical ephemeris, geodesic calculations & rendering libraries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          {/* Section 1: Astronomy Ephemeris */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-white/10 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" />
              <span>Solar Eclipse Ephemeris & Besselian Elements</span>
            </div>
            <div className="space-y-3">
              {ASTRONOMY_SOURCES.map((src, i) => (
                <div
                  key={i}
                  className="bg-black/50 border border-white/10 rounded p-3.5 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <span className="font-semibold text-white text-sm">{src.name}</span>
                      <div className="text-[11px] text-slate-400 font-mono">{src.organization}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-[10px] font-mono font-semibold uppercase tracking-wider">
                        {src.badge}
                      </span>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
                          title="Open official documentation in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{src.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Mathematical Algorithms */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-white/10 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>Mathematical Models & Astronomical Algorithms</span>
            </div>
            <div className="space-y-3">
              {ALGORITHM_SOURCES.map((src, i) => (
                <div
                  key={i}
                  className="bg-black/50 border border-white/10 rounded p-3.5 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <span className="font-semibold text-white text-sm">{src.name}</span>
                      <div className="text-[11px] text-slate-400 font-mono">{src.organization}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[10px] font-mono font-semibold uppercase tracking-wider">
                        {src.badge}
                      </span>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-amber-300 transition-colors"
                          title="Open official documentation in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{src.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Geodesy, Textures & Technology */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-white/10 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Cartography, Textures & 3D WebGL Engine</span>
            </div>
            <div className="space-y-3">
              {CARTOGRAPHY_SOURCES.map((src, i) => (
                <div
                  key={i}
                  className="bg-black/50 border border-white/10 rounded p-3.5 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <span className="font-semibold text-white text-sm">{src.name}</span>
                      <div className="text-[11px] text-slate-400 font-mono">{src.organization}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[10px] font-mono font-semibold uppercase tracking-wider">
                        {src.badge}
                      </span>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-emerald-300 transition-colors"
                          title="Open official documentation in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{src.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/15 bg-black/60 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Total Solar Eclipse • August 12, 2026 (Saros 126)</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-sm bg-white/10 hover:bg-white/20 text-white font-medium transition-colors uppercase tracking-wider text-[11px]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
