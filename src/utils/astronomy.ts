import { LatLon, TelemetryReadout, CountryTimeInfo, ObservationStation } from '../types';
import { UMBRA_PATH_WAYPOINTS, COUNTRY_TIMEZONE_CONFIG, OBSERVATION_STATIONS } from '../data/eclipseData';

/**
 * Format UTC time in seconds since midnight to 12-hour format without seconds (e.g. 5:00PM)
 */
export function formatSecondsToUTC(seconds: number): string {
  const h24 = Math.floor(seconds / 3600) % 24;
  const mins = Math.floor((seconds % 3600) / 60);
  
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  
  return `${h12}:${String(mins).padStart(2, '0')}${ampm}`;
}

export function formatSecondsTo12h(seconds: number): string {
  return formatSecondsToUTC(seconds);
}

/**
 * Get country time info including formatted local time and active status
 */
export function getCountryTimes(currentTimestampSeconds: number): CountryTimeInfo[] {
  // Check active windows based on timestamp
  // Greenland totality window ~16:34 - 16:40 UTC
  const isGreenlandTotality = currentTimestampSeconds >= 59600 && currentTimestampSeconds <= 59950;
  const isGreenlandActive = currentTimestampSeconds >= 56200 && currentTimestampSeconds <= 63380;

  // Iceland totality window ~17:45 - 17:50 UTC
  const isIcelandTotality = currentTimestampSeconds >= 63900 && currentTimestampSeconds <= 64180;
  const isIcelandActive = currentTimestampSeconds >= 60400 && currentTimestampSeconds <= 67600;

  // Spain totality window ~18:25 - 18:33 UTC
  const isSpainTotality = currentTimestampSeconds >= 66400 && currentTimestampSeconds <= 66800;
  const isSpainActive = currentTimestampSeconds >= 63000 && currentTimestampSeconds <= 69000;

  return COUNTRY_TIMEZONE_CONFIG.map((config) => {
    const localSeconds = (currentTimestampSeconds + config.utcOffsetHours * 3600 + 86400) % 86400;
    let isTotality = false;
    let isActive = false;

    if (config.country === 'Greenland') {
      isTotality = isGreenlandTotality;
      isActive = isGreenlandActive;
    } else if (config.country === 'Iceland') {
      isTotality = isIcelandTotality;
      isActive = isIcelandActive;
    } else if (config.country === 'Spain') {
      isTotality = isSpainTotality;
      isActive = isSpainActive;
    }

    return {
      country: config.country,
      code: config.code,
      timezoneName: config.timezoneName,
      utcOffsetHours: config.utcOffsetHours,
      localTimeFormatted: formatSecondsToUTC(localSeconds),
      isEclipseActiveNow: isActive,
      isTotalityNow: isTotality,
      flagEmoji: config.flagEmoji
    };
  });
}

/**
 * Helper: Spherical Linear Interpolation (3D Slerp) for Great-Circle Geodesic trajectory.
 * Interpolates on the 3D unit sphere to eliminate all 2D lat/lon coordinate singularities,
 * inflections, and artificial "bumps" near high latitudes (Greenland/Arctic).
 */
function slerp3D(coord1: LatLon, coord2: LatLon, t: number): LatLon {
  const rad = Math.PI / 180;
  const lat1 = coord1.lat * rad;
  const lon1 = coord1.lon * rad;
  const lat2 = coord2.lat * rad;
  const lon2 = coord2.lon * rad;

  // Convert to 3D Cartesian unit vectors
  const v1 = [
    Math.cos(lat1) * Math.cos(lon1),
    Math.cos(lat1) * Math.sin(lon1),
    Math.sin(lat1)
  ];
  const v2 = [
    Math.cos(lat2) * Math.cos(lon2),
    Math.cos(lat2) * Math.sin(lon2),
    Math.sin(lat2)
  ];

  const dot = Math.max(-1, Math.min(1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]));
  const omega = Math.acos(dot);

  let x: number, y: number, z: number;
  if (omega < 1e-6) {
    x = (1 - t) * v1[0] + t * v2[0];
    y = (1 - t) * v1[1] + t * v2[1];
    z = (1 - t) * v1[2] + t * v2[2];
  } else {
    const sinOmega = Math.sin(omega);
    const s1 = Math.sin((1 - t) * omega) / sinOmega;
    const s2 = Math.sin(t * omega) / sinOmega;
    x = s1 * v1[0] + s2 * v2[0];
    y = s1 * v1[1] + s2 * v2[1];
    z = s1 * v1[2] + s2 * v2[2];
  }

  const len = Math.hypot(x, y, z);
  x /= len; y /= len; z /= len;

  const lat = Math.asin(z) * (180 / Math.PI);
  const lon = Math.atan2(y, x) * (180 / Math.PI);
  return { lat, lon };
}

/**
 * Get interpolated umbra center coordinates for the current timestamp using 3D Geodesic Slerp
 * based on exact NASA/Espenak Besselian elements via astronomy-engine.
 */
export function getUmbraPosition(timeSeconds: number, routeWaypoints = UMBRA_PATH_WAYPOINTS): LatLon | null {
  const waypoints = routeWaypoints;
  const len = waypoints.length;
  if (len === 0 || timeSeconds < waypoints[0].time || timeSeconds > waypoints[len - 1].time) {
    return null;
  }

  for (let i = 0; i < len - 1; i++) {
    const w1 = waypoints[i];
    const w2 = waypoints[i + 1];
    if (timeSeconds >= w1.time && timeSeconds <= w2.time) {
      const duration = w2.time - w1.time;
      const t = duration > 0 ? (timeSeconds - w1.time) / duration : 0;
      return slerp3D(w1.coords, w2.coords, t);
    }
  }

  return waypoints[len - 1].coords;
}

/**
 * Calculate Great-Circle Distance between two LatLon coordinates in kilometers
 */
export function calculateDistanceKm(coord1: LatLon, coord2: LatLon): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lon - coord1.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate Sub-Solar Point (where the sun is overhead) for August 12, 2026
 */
export function getSubSolarPoint(timeSeconds: number): LatLon {
  // On Aug 12, Sun declination is approx +14.85 degrees North
  const declination = 14.85;
  // Longitude progresses westward at 15 degrees per hour.
  // At 12:00 UTC (43200s), sub-solar longitude is around 0° (Greenwich meridian equation of time adjustment ~ -5m -> ~ +1.2° E)
  const hoursSinceNoon = (timeSeconds - 43200) / 3600;
  let lon = -1 * (hoursSinceNoon * 15) + 1.2;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;
  return { lat: declination, lon };
}

/**
 * Calculate Sun Altitude (elevation above horizon in degrees) for August 12, 2026
 * using the standard NOAA Solar Calculator / Jean Meeus Astronomical Algorithms.
 * Computes exact fractional year, equation of time (-5.35 min), daily solar declination (+15.13°),
 * hour angle, and atmospheric refraction correction for precise low-horizon observation.
 */
export function calculateSunAltitude(coords: LatLon, timeSeconds: number): number {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  const hours = timeSeconds / 3600;
  // August 12 is Day 224 of the year 2026
  const dayOfYear = 224;
  const fractionalYear = (2 * Math.PI / 365) * (dayOfYear - 1 + (hours - 12) / 24);

  // NOAA Equation of Time in minutes
  const eqtime = 229.18 * (
    0.000075 + 
    0.001868 * Math.cos(fractionalYear) - 
    0.032077 * Math.sin(fractionalYear) - 
    0.014615 * Math.cos(2 * fractionalYear) - 
    0.040849 * Math.sin(2 * fractionalYear)
  );

  // Solar Declination in radians (approx +15.13° on Aug 12, 2026)
  const declRad = 0.006918 - 
    0.399912 * Math.cos(fractionalYear) + 
    0.070257 * Math.sin(fractionalYear) - 
    0.006758 * Math.cos(2 * fractionalYear) + 
    0.000907 * Math.sin(2 * fractionalYear) - 
    0.002697 * Math.cos(3 * fractionalYear) + 
    0.00148 * Math.sin(3 * fractionalYear);

  // Solar Time Offset in minutes: 4 minutes per degree longitude
  const timeOffsetMin = eqtime + 4 * coords.lon;
  const trueSolarTimeMin = (hours * 60 + timeOffsetMin + 1440) % 1440;

  // Hour Angle in radians (-180° to +180°)
  let haDeg = trueSolarTimeMin / 4 - 180;
  if (haDeg < -180) haDeg += 360;
  if (haDeg > 180) haDeg -= 360;
  const haRad = haDeg * rad;

  const latRad = coords.lat * rad;

  // Geometric zenith angle and elevation
  const csz = Math.sin(latRad) * Math.sin(declRad) + Math.cos(latRad) * Math.cos(declRad) * Math.cos(haRad);
  const trueAltDeg = Math.asin(Math.max(-1, Math.min(1, csz))) * deg;

  // Atmospheric refraction correction for true visual horizon alignment (Bennett's formula)
  let apparentAlt = trueAltDeg;
  if (trueAltDeg > -1.0) {
    const h = Math.max(-0.5, trueAltDeg);
    const rMinutes = 1.02 / Math.tan((h + 10.3 / (h + 5.11)) * rad);
    apparentAlt = trueAltDeg + rMinutes / 60.0;
  }

  return Math.round(apparentAlt * 10) / 10;
}

/**
 * Calculate telemetry readout for any location at current timestamp
 */
export function calculateTelemetry(
  coords: LatLon,
  timeSeconds: number,
  stationId?: string,
  routeWaypoints = UMBRA_PATH_WAYPOINTS,
  stations = OBSERVATION_STATIONS,
): TelemetryReadout {
  const umbraPos = getUmbraPosition(timeSeconds, routeWaypoints);
  const sunAlt = calculateSunAltitude(coords, timeSeconds);

  // If station is known, use exact station timeline windows for high precision
  const station = stations.find((s) => s.id === stationId);
  if (station) {
    const parseTimeToSec = (str: string) => {
      const [h, m, s] = str.split(':').map(Number);
      return h * 3600 + m * 60 + (s || 0);
    };

    const tStart = parseTimeToSec(station.eclipseTimes.startPartial);
    const tTotalityStart = parseTimeToSec(station.eclipseTimes.startTotality);
    const tTotalityEnd = parseTimeToSec(station.eclipseTimes.endTotality);
    const tEnd = parseTimeToSec(station.eclipseTimes.endPartial);
    const tPeak = parseTimeToSec(station.eclipseTimes.peakTotality);

    let obscuration = 0;
    let phase: TelemetryReadout['currentPhase'] = 'No Eclipse';
    let timeToNext = 'N/A';

    if (timeSeconds < tStart) {
      obscuration = 0;
      phase = 'No Eclipse';
      const diff = tStart - timeSeconds;
      timeToNext = `C1 in ${Math.floor(diff / 60)}m ${diff % 60}s`;
    } else if (timeSeconds >= tStart && timeSeconds < tTotalityStart) {
      // Ingress partial
      const progress = (timeSeconds - tStart) / (tTotalityStart - tStart);
      // Sine easing curve for moon overlapping solar disk
      obscuration = Math.min(99.9, Math.round((Math.sin((progress * Math.PI) / 2) * 99.9) * 10) / 10);
      
      if (tTotalityStart - timeSeconds <= 15) {
        phase = 'Diamond Ring!';
      } else {
        phase = 'Partial (Ingress)';
      }
      const diff = tTotalityStart - timeSeconds;
      timeToNext = `Totality in ${Math.floor(diff / 60)}m ${diff % 60}s`;
    } else if (timeSeconds >= tTotalityStart && timeSeconds <= tTotalityEnd) {
      obscuration = 100.0;
      phase = 'TOTALITY!';
      const diff = tTotalityEnd - timeSeconds;
      timeToNext = `Totality ends in ${diff}s`;
    } else if (timeSeconds > tTotalityEnd && timeSeconds <= tEnd) {
      const progress = (timeSeconds - tTotalityEnd) / (tEnd - tTotalityEnd);
      obscuration = Math.max(0, Math.round((Math.cos((progress * Math.PI) / 2) * 99.9) * 10) / 10);
      
      if (timeSeconds - tTotalityEnd <= 15) {
        phase = 'Diamond Ring!';
      } else {
        phase = 'Partial (Egress)';
      }
      const diff = tEnd - timeSeconds;
      timeToNext = `Eclipse ends in ${Math.floor(diff / 60)}m ${diff % 60}s`;
    } else {
      obscuration = 0;
      phase = 'No Eclipse';
      timeToNext = 'Eclipse Completed';
    }

    if (sunAlt <= 0 && phase !== 'No Eclipse') {
      phase = 'Sunset During Eclipse';
    }

    const distToUmbra = umbraPos ? Math.round(calculateDistanceKm(coords, umbraPos)) : 9999;

    return {
      obscurationPercentage: obscuration,
      sunAltitudeDegrees: sunAlt,
      currentPhase: phase,
      timeToNextPhase: timeToNext,
      distanceToUmbraKm: distToUmbra
    };
  }

  // Generic calculation for custom coordinates based on distance to Umbra
  if (!umbraPos) {
    return {
      obscurationPercentage: 0,
      sunAltitudeDegrees: sunAlt,
      currentPhase: 'No Eclipse',
      timeToNextPhase: 'N/A',
      distanceToUmbraKm: 9999
    };
  }

  const distKm = calculateDistanceKm(coords, umbraPos);
  // Umbra core radius ~120 km -> 100% totality
  // Penumbra radius ~3500 km -> partial from 99% down to 0%
  let obscuration = 0;
  let phase: TelemetryReadout['currentPhase'] = 'No Eclipse';

  if (distKm <= 120) {
    obscuration = 100.0;
    phase = 'TOTALITY!';
  } else if (distKm <= 150) {
    obscuration = 99.8;
    phase = 'Diamond Ring!';
  } else if (distKm <= 3500) {
    const norm = 1 - (distKm - 120) / (3500 - 120);
    obscuration = Math.max(0.1, Math.round(norm * 99.5 * 10) / 10);
    phase = 'Partial (Ingress)';
  }

  if (sunAlt <= 0 && phase !== 'No Eclipse') {
    phase = 'Sunset During Eclipse';
  }

  return {
    obscurationPercentage: obscuration,
    sunAltitudeDegrees: sunAlt,
    currentPhase: phase,
    timeToNextPhase: 'Calculated dynamically',
    distanceToUmbraKm: Math.round(distKm)
  };
}

/**
 * Automatically determine the active observation station based on eclipse progression.
 * In Auto mode, we never show a synthetic "Umbra Center" point; instead, we pin to
 * the upcoming/current station, and a short while after the eclipse totality passes that station,
 * we automatically pin to the next city/station along the path.
 */
export function getAutoTrackingStation(currentTimestamp: number, stations = OBSERVATION_STATIONS): ObservationStation {
  if (stations !== OBSERVATION_STATIONS) {
    const parse = (value: string) => {
      const [h, m, s] = value.split(':').map(Number);
      return h * 3600 + m * 60 + (s || 0);
    };
    const active = stations.find((station) => {
      const start = parse(station.eclipseTimes.startPartial);
      const end = parse(station.eclipseTimes.endPartial);
      return currentTimestamp >= start && currentTimestamp <= end;
    });
    if (active) return active;
    return stations.reduce((closest, station) => {
      const currentPeak = parse(station.eclipseTimes.peakTotality);
      const closestPeak = parse(closest.eclipseTimes.peakTotality);
      return Math.abs(currentPeak - currentTimestamp) < Math.abs(closestPeak - currentTimestamp) ? station : closest;
    }, stations[0]);
  }

  if (currentTimestamp < 63800) {
    // Before 17:43:20 UTC -> Greenland (Scoresby Sund, totality peak at 17:36:53 UTC)
    return OBSERVATION_STATIONS.find((s) => s.id === 'greenland-ittoqqortoormiit') || OBSERVATION_STATIONS[0];
  } else if (currentTimestamp < 65700) {
    // 17:43:20 to 18:15:00 UTC -> Iceland (Reykjavík, totality peak at 17:47:50 UTC)
    return OBSERVATION_STATIONS.find((s) => s.id === 'iceland-reykjavik') || OBSERVATION_STATIONS[1];
  } else if (currentTimestamp < 66540) {
    // 18:15:00 to 18:29:00 UTC -> Spain (Bilbao, totality peak at 18:27:38 UTC)
    return OBSERVATION_STATIONS.find((s) => s.id === 'spain-bilbao') || OBSERVATION_STATIONS[2];
  } else if (currentTimestamp < 66650) {
    // 18:29:00 to 18:30:50 UTC -> Spain (Zaragoza, totality peak at 18:30:30 UTC)
    return OBSERVATION_STATIONS.find((s) => s.id === 'spain-zaragoza') || OBSERVATION_STATIONS[4];
  } else if (currentTimestamp < 66690) {
    // 18:30:50 to 18:31:30 UTC -> Spain (Valencia, totality peak at 18:31:35 UTC)
    return OBSERVATION_STATIONS.find((s) => s.id === 'spain-valencia') || OBSERVATION_STATIONS[5];
  } else {
    // 18:31:30+ UTC -> Spain (Palma de Mallorca, totality peak at 18:31:53 UTC / Sunset)
    return OBSERVATION_STATIONS.find((s) => s.id === 'spain-palma') || OBSERVATION_STATIONS[6] || OBSERVATION_STATIONS[0];
  }
}

/**
 * Format coordinates to clean string: e.g. "64.1466° N, 21.9426° W"
 */
export function formatCoords(coords: LatLon): string {
  const latStr = `${Math.abs(coords.lat).toFixed(4)}° ${coords.lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(coords.lon).toFixed(4)}° ${coords.lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}

/**
 * Convert LatLon (degrees) to Three.js 3D Sphere vector (radius R)
 */
export function latLonToVector3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return [x, y, z];
}
