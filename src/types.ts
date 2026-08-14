export interface LatLon {
  lat: number;
  lon: number;
}

export interface EclipseTimeWindow {
  startPartial: string; // UTC HH:MM:SS
  startTotality: string; // UTC HH:MM:SS
  peakTotality: string; // UTC HH:MM:SS
  endTotality: string; // UTC HH:MM:SS
  endPartial: string; // UTC HH:MM:SS
  durationSeconds: number; // Duration of totality in seconds
}

export interface ObservationStation {
  id: string;
  name: string;
  country: 'Greenland' | 'Iceland' | 'Spain' | 'Ocean' | 'Custom';
  countryCode: 'GL' | 'IS' | 'ES' | 'INTL' | 'CUSTOM';
  coords: LatLon;
  elevationMeters?: number;
  description: string;
  weatherProspects: string;
  eclipseTimes: EclipseTimeWindow;
  maxSunAltitude: number; // Degrees at peak
  isCustom?: boolean;
}

export interface EclipseMilestone {
  id: string;
  timeUTC: string; // HH:MM:SS
  timeSeconds: number; // Seconds since midnight UTC
  title: string;
  country: 'Greenland' | 'Iceland' | 'Spain' | 'Global';
  description: string;
  targetCoords?: LatLon;
  stationId?: string;
}

export interface SimulationState {
  currentTimestamp: number; // Seconds since midnight Aug 12, 2026 UTC
  isPlaying: boolean;
  speedMultiplier: number; // 1, 5, 20, 60, 300, 600, 1800
  selectedStationId: string;
  customStation: ObservationStation | null;
  cameraMode: 'free' | 'follow-shadow' | 'focused-station' | 'top-down' | 'spain-fixed';
  showPathLine: boolean;
  showPenumbra: boolean;
  showDayNightTerminator: boolean;
  showCelestialIcons?: boolean;
  showSkyView: boolean;
}

export interface TelemetryReadout {
  obscurationPercentage: number; // 0 to 100
  sunAltitudeDegrees: number;
  currentPhase: 'No Eclipse' | 'Partial (Ingress)' | 'Diamond Ring!' | 'TOTALITY!' | 'Partial (Egress)' | 'Sunset During Eclipse';
  timeToNextPhase: string;
  distanceToUmbraKm: number;
}

export interface CountryTimeInfo {
  country: string;
  code: string;
  timezoneName: string;
  utcOffsetHours: number;
  localTimeFormatted: string;
  isEclipseActiveNow: boolean;
  isTotalityNow: boolean;
  flagEmoji: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'oracle';
  text: string;
  timestamp: string;
}
