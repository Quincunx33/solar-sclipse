import { ObservationStation, LatLon } from '../types';

export type HistoricalScenario = {
  id: string;
  title: string;
  dateLabel: string;
  start: number;
  end: number;
  waypoints: { time: number; coords: LatLon; name?: string }[];
  stations: ObservationStation[];
};

const time = (seconds: number) => {
  const h = Math.floor(seconds / 3600) % 24;
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const route = (
  id: string,
  title: string,
  dateLabel: string,
  points: [number, number, string][],
  totalitySeconds = 120,
): HistoricalScenario => {
  const waypoints = points.map(([lat, lon, name], index) => ({
    time: index * 200 + 100,
    coords: { lat, lon },
    name,
  }));

  const start = 30;
  const end = points.length * 200 + 100;

  const stations: ObservationStation[] = points.map(([lat, lon, name], index) => {
    const center = index * 200 + 100;
    const startPartial = Math.max(0, center - 70);
    const startTotality = Math.max(0, center - totalitySeconds / 2);
    const endTotality = Math.min(end, center + totalitySeconds / 2);
    const endPartial = Math.min(end, center + 90);
    return {
      id: `${id}-station-${index}`,
      name,
      country: 'Ocean',
      countryCode: 'INTL',
      coords: { lat, lon },
      description: `Historical replay observation point along the ${title} totality path.`,
      weatherProspects: 'Archive route estimate',
      eclipseTimes: {
        startPartial: time(startPartial),
        startTotality: time(startTotality),
        peakTotality: time(center),
        endTotality: time(endTotality),
        endPartial: time(endPartial),
        durationSeconds: totalitySeconds,
      },
      maxSunAltitude: Math.max(8, 65 - Math.abs(lat) * 0.45),
    };
  });

  return { id, title, dateLabel, start, end, waypoints, stations };
};

export const HISTORICAL_SCENARIOS: Record<string, HistoricalScenario> = {
  '2134-bce': route('2134-bce', 'Ancient China Eclipse', 'July 22, 2134 BCE', [[28, 112, 'Ancient China'], [30, 120, 'Yangtze Basin'], [35, 132, 'East Asian Coast']], 180),
  '585-bce': route('585-bce', 'Thales / Halys Eclipse', 'May 28, 585 BCE', [[35, 18, 'Aegean Approach'], [39, 35, 'Halys River Region'], [43, 52, 'Anatolian Plateau']], 300),
  '1715': route('1715', "Halley’s Eclipse", 'May 3, 1715', [[48, -12, 'Atlantic Approach'], [51, -1, 'England'], [48, 18, 'Central Europe']], 240),
  '1851': route('1851', 'First Corona Photograph', 'July 28, 1851', [[48, -28, 'North Atlantic'], [56, 12, 'Northern Europe'], [62, 40, 'Baltic Approach']], 210),
  '1868': route('1868', 'Helium Eclipse', 'August 18, 1868', [[6, 55, 'Indian Ocean'], [20, 78, 'India'], [25, 102, 'Southeast Asia']], 360),
  '1919': route('1919', 'Eddington Eclipse', 'May 29, 1919', [[-8, -48, 'Brazilian Coast'], [2, -20, 'Equatorial Atlantic'], [12, 10, 'West Africa']], 360),
  '1991': route('1991', 'Longest Eclipse of the Century', 'July 11, 1991', [[18, -155, 'Hawaii'], [20, -105, 'Mexico'], [10, -75, 'Central America']], 420),
  '1999': route('1999', 'European Totality', 'August 11, 1999', [[45, -10, 'Atlantic Approach'], [50, 0, 'Western Europe'], [40, 35, 'Turkey']], 150),
  '2009': route('2009', 'Longest Total Eclipse of the 21st Century', 'July 22, 2009', [[14, 55, 'Arabian Sea'], [25, 80, 'India'], [28, 120, 'China'], [20, 155, 'Pacific']], 390),
  '2017': route('2017', 'Great American Eclipse', 'August 21, 2017', [[44, -125, 'Oregon'], [38, -95, 'Great Plains'], [33, -80, 'South Carolina']], 160),
  '2024': route('2024', 'North American Totality', 'April 8, 2024', [[20, -110, 'Mazatlán'], [25, -100, 'Texas'], [40, -75, 'Eastern Canada']], 270),
};

export const getHistoricalScenario = (id: string) => HISTORICAL_SCENARIOS[id];
export const getScenarioStations = (scenario?: HistoricalScenario) => scenario?.stations ?? [];
