import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ObservationStation, LatLon } from '../types';
import { OBSERVATION_STATIONS, UMBRA_PATH_WAYPOINTS } from '../data/eclipseData';
import { getUmbraPosition, getSubSolarPoint, latLonToVector3 } from '../utils/astronomy';

interface Earth3DProps {
  currentTimestamp: number;
  selectedStation: ObservationStation | null;
  umbraPath?: { time: number; coords: LatLon; name?: string }[];
  onSelectStation: (station: ObservationStation) => void;
  cameraMode: 'free' | 'follow-shadow' | 'focused-station' | 'top-down' | 'spain-fixed';
  showPathLine: boolean;
  showPenumbra: boolean;
  showDayNightTerminator: boolean;
  showCelestialIcons?: boolean;
  onCameraModeChange: (mode: 'free' | 'follow-shadow' | 'focused-station' | 'top-down' | 'spain-fixed') => void;
  onDropCustomPin: (coords: LatLon) => void;
  onTogglePathLine?: () => void;
  onTogglePenumbra?: () => void;
  onToggleTerminator?: () => void;
  onToggleCelestialIcons?: () => void;
  cameraResetTrigger?: number;
  onUserInteract?: () => void;
}

const EARTH_RADIUS = 100;

// Module-level texture cache for celestial badges
const celestialTextureCache: Record<string, THREE.CanvasTexture> = {};

const getCelestialTexture = (type: 'sun_surface' | 'moon_surface' | 'sun_sky' | 'moon_sky'): THREE.CanvasTexture => {
  if (celestialTextureCache[type]) return celestialTextureCache[type];

  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 384, 192);

  const isSun = type.startsWith('sun');
  const isSurface = type.endsWith('surface');

  const centerX = 192;
  const centerY = 55;
  const radius = isSurface ? 36 : 28;

  const grad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius * 2.5);
  if (isSun) {
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(251, 191, 36, 0.95)');
    grad.addColorStop(0.7, 'rgba(245, 158, 11, 0.35)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  } else {
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.35, 'rgba(56, 189, 248, 0.9)');
    grad.addColorStop(0.7, 'rgba(14, 165, 233, 0.35)');
    grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = isSun ? '#fffbeb' : '#0f172a';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = isSun ? '#f59e0b' : '#38bdf8';
  ctx.stroke();

  ctx.font = `${isSurface ? 32 : 24}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isSun ? '☀️' : '🌑', centerX, centerY + 2);

  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = isSun ? '#fde047' : '#7dd3fc';

  let label = '';
  if (type === 'sun_surface') label = 'SUN (SUB-SOLAR)';
  else if (type === 'moon_surface') label = 'MOON (UMBRA)';
  else if (type === 'sun_sky') label = 'SUN DIRECTION';
  else if (type === 'moon_sky') label = 'MOON DIRECTION';

  ctx.fillText(label, centerX, centerY + radius * 1.6);

  const texture = new THREE.CanvasTexture(canvas);
  celestialTextureCache[type] = texture;
  return texture;
};

// Generate great-circle arc points between two coordinates on the globe
const getPathPosition = (path: { time: number; coords: LatLon }[], timestamp: number): LatLon | null => {
  if (!path.length) return null;
  if (timestamp <= path[0].time) return path[0].coords;
  if (timestamp >= path[path.length - 1].time) return path[path.length - 1].coords;
  for (let i = 1; i < path.length; i += 1) {
    const previous = path[i - 1];
    const next = path[i];
    if (timestamp <= next.time) {
      const ratio = (timestamp - previous.time) / (next.time - previous.time);
      return { lat: previous.coords.lat + (next.coords.lat - previous.coords.lat) * ratio, lon: previous.coords.lon + (next.coords.lon - previous.coords.lon) * ratio };
    }
  }
  return path[path.length - 1].coords;
};

const generateGreatCircleArc = (coord1: LatLon, coord2: LatLon, radius: number, segments = 40): THREE.Vector3[] => {
  const v1 = new THREE.Vector3(...latLonToVector3(coord1.lat, coord1.lon, 1)).normalize();
  const v2 = new THREE.Vector3(...latLonToVector3(coord2.lat, coord2.lon, 1)).normalize();

  const dot = Math.min(1, Math.max(-1, v1.dot(v2)));
  const omega = Math.acos(dot);
  const points: THREE.Vector3[] = [];

  if (omega < 0.0001) {
    points.push(v1.clone().multiplyScalar(radius));
    points.push(v2.clone().multiplyScalar(radius));
    return points;
  }

  const sinOmega = Math.sin(omega);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = Math.sin((1 - t) * omega) / sinOmega;
    const b = Math.sin(t * omega) / sinOmega;
    const pt = new THREE.Vector3()
      .addScaledVector(v1, a)
      .addScaledVector(v2, b)
      .multiplyScalar(radius);
    points.push(pt);
  }
  return points;
};

export const Earth3D: React.FC<Earth3DProps> = ({
  currentTimestamp,
  selectedStation,
  umbraPath = UMBRA_PATH_WAYPOINTS,
  onSelectStation,
  cameraMode,
  showPathLine,
  showPenumbra,
  showDayNightTerminator,
  showCelestialIcons = false,
  onCameraModeChange,
  onDropCustomPin,
  onTogglePathLine,
  onTogglePenumbra,
  onToggleTerminator,
  onToggleCelestialIcons,
  cameraResetTrigger = 0,
  onUserInteract
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Dynamic Scene Elements
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const atmosphereMeshRef = useRef<THREE.Mesh | null>(null);
  const pathLineRef = useRef<THREE.Line | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const stationMarkersRef = useRef<THREE.Group | null>(null);
  const celestialIconsRef = useRef<THREE.Group | null>(null);

  // Raycaster for click interaction
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Target camera position for animation
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const userCameraOverrideRef = useRef<boolean>(false);
  const onCameraModeChangeRef = useRef(onCameraModeChange);
  const onTogglePathLineRef = useRef(onTogglePathLine);
  const onTogglePenumbraRef = useRef(onTogglePenumbra);
  const onToggleTerminatorRef = useRef(onToggleTerminator);
  const onToggleCelestialIconsRef = useRef(onToggleCelestialIcons);
  const onUserInteractRef = useRef(onUserInteract);

  useEffect(() => {
    onCameraModeChangeRef.current = onCameraModeChange;
    onTogglePathLineRef.current = onTogglePathLine;
    onTogglePenumbraRef.current = onTogglePenumbra;
    onToggleTerminatorRef.current = onToggleTerminator;
    onToggleCelestialIconsRef.current = onToggleCelestialIcons;
    onUserInteractRef.current = onUserInteract;
  }, [onCameraModeChange, onTogglePathLine, onTogglePenumbra, onToggleTerminator, onToggleCelestialIcons, onUserInteract]);

  // Reset user override when cameraResetTrigger fires
  useEffect(() => {
    userCameraOverrideRef.current = false;
  }, [cameraResetTrigger]);

  // Generate fallback Day Earth texture
  const generateFallbackDayTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Ocean base
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0, '#0a192f');
    grad.addColorStop(0.5, '#0e2b4c');
    grad.addColorStop(1, '#0a192f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
    ctx.lineWidth = 2;
    for (let y = 0; y <= 1024; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(2048, y);
      ctx.stroke();
    }
    for (let x = 0; x <= 2048; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }

    // Continents approximations
    ctx.fillStyle = 'rgba(230, 245, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(800, 180, 250, 120, -0.2, 0, Math.PI * 2); // Greenland area
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.ellipse(960, 210, 35, 25, 0, 0, Math.PI * 2); // Iceland
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(1000, 360, 90, 60, 0.1, 0, Math.PI * 2); // Spain & Iberian Peninsula
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  // Generate fallback Night Earth lights texture
  const generateFallbackNightTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Dark deep ocean
    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, 2048, 1024);

    // Glowing city clusters
    ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 1024;
      const r = Math.random() * 2.5 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  // Generate fallback water texture (white for ocean, black for land approximation)
  const generateFallbackWaterTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff'; // ocean default
    ctx.fillRect(0, 0, 512, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040a);
    sceneRef.current = scene;

    // Subtle Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCoords = [];
    for (let i = 0; i < 1500; i++) {
      const x = (Math.random() - 0.5) * 3500;
      const y = (Math.random() - 0.5) * 3500;
      const z = (Math.random() - 0.5) * 3500;
      if (Math.sqrt(x * x + y * y + z * z) > 300) {
        starCoords.push(x, y, z);
      }
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0.7 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(0, 80, 310);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1.35;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 120;
    controls.maxDistance = 1000;

    const domEl = renderer.domElement;

    // Drag detection: only drag (pointer move with button down) triggers userCameraOverride.
    // Zoom (wheel) intentionally does NOT trigger userCameraOverride so auto-tracking continues at custom zoom level.
    let pointerDownPos = { x: 0, y: 0 };
    let isPointerDown = false;

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (dx * dx + dy * dy > 16) {
        // Drag threshold reached: user is actively orbiting/rotating the globe
        isDraggingRef.current = true;
        userCameraOverrideRef.current = true;
        targetCamPosRef.current = null;
        onUserInteractRef.current?.();
      }
    };

    const onPointerUp = () => {
      isPointerDown = false;
      isDraggingRef.current = false;
    };

    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.2);
    sunLight.position.set(500, 150, 300);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // 1. Scientifically Accurate Custom Earth Shader (Day/Night texture blending + 3D Elliptical Lunar Shadow)
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 96, 96);
    const fallbackDay = generateFallbackDayTexture();
    const fallbackNight = generateFallbackNightTexture();
    const fallbackWater = generateFallbackWaterTexture();

    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        u_day_texture: { value: fallbackDay },
        u_night_texture: { value: fallbackNight },
        u_water_texture: { value: fallbackWater },
        u_sun_pos: { value: new THREE.Vector3(1, 0, 0) },
        u_umbra_pos: { value: new THREE.Vector3(0, 1, 0) },
        u_has_umbra: { value: 1.0 },
        u_show_penumbra: { value: 1.0 },
        u_show_terminator: { value: 1.0 },
        u_contrast: { value: 1.15 },
        u_brightness: { value: 0.70 },
        u_gamma: { value: 0.30 },
        u_saturation: { value: 0.95 },
        u_night_brightness: { value: 1.60 },
        u_ocean_specular: { value: 0.15 },
        u_terminator_glow: { value: 0.10 },
        u_umbra_ring_glow: { value: 0.00 }
      },
      vertexShader: `
        varying vec3 vNormalWorld;
        varying vec3 vPositionWorld;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vNormalWorld = normalize(normalMatrix * normal);
          // For sphere centered at origin, normalize(position) gives exact unit surface normal vector
          vPositionWorld = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D u_day_texture;
        uniform sampler2D u_night_texture;
        uniform sampler2D u_water_texture;
        uniform vec3 u_sun_pos;
        uniform vec3 u_umbra_pos;
        uniform float u_has_umbra;
        uniform float u_show_penumbra;
        uniform float u_show_terminator;
        uniform float u_contrast;
        uniform float u_brightness;
        uniform float u_gamma;
        uniform float u_saturation;
        uniform float u_night_brightness;
        uniform float u_ocean_specular;
        uniform float u_terminator_glow;
        uniform float u_umbra_ring_glow;

        varying vec3 vNormalWorld;
        varying vec3 vPositionWorld;
        varying vec2 vUv;

        void main() {
          vec3 dayColor = texture2D(u_day_texture, vUv).rgb;
          vec3 nightColor = texture2D(u_night_texture, vUv).rgb;
          float isWater = texture2D(u_water_texture, vUv).r;

          // 1. Crystal Clear Earth Tone (Refined photorealistic balance with manual dat.gui controls)
          vec3 luma = vec3(dot(dayColor, vec3(0.299, 0.587, 0.114)));
          dayColor = mix(luma, dayColor, u_saturation);
          dayColor = pow(dayColor, vec3(u_gamma)) * u_brightness;
          dayColor = (dayColor - 0.5) * u_contrast + 0.5;
          dayColor = max(vec3(0.0), dayColor);
          
          // Elevate deep oceans to a clear, elegant sapphire-teal balance
          if (isWater > 0.5) {
            dayColor = mix(dayColor, dayColor * vec3(0.92, 1.08, 1.25), 0.35);
          }

          // Soften night texture contrast and enhance city light warmth
          nightColor = pow(nightColor, vec3(0.80)) * u_night_brightness + vec3(0.015, 0.02, 0.03);

          // 2. Calculate Sun Illumination & Day-Night Terminator
          vec3 sunDir = normalize(u_sun_pos);
          float ndotl = dot(vPositionWorld, sunDir);
          
          // Smooth, crisp day/night terminator
          float terminatorWidth = 0.07;
          float dayFactor = smoothstep(-terminatorWidth, terminatorWidth, ndotl);
          
          if (u_show_terminator < 0.5) {
            dayFactor = 1.0;
          }

          // Warm atmospheric sunset terminator glow along the day/night boundary
          float terminatorGlow = smoothstep(-0.10, 0.03, ndotl) * (1.0 - smoothstep(0.0, 0.15, ndotl));
          vec3 sunsetTint = vec3(0.98, 0.55, 0.25); // refined sunset copper glow

          // 3. Scientifically Accurate Solar Eclipse Shadow (Umbra + Penumbra + Twilight Ring)
          float shadowDarkness = 0.0;
          float umbraRingGlow = 0.0;
          
          if (u_has_umbra > 0.5 && ndotl > -0.15) {
            vec3 umbraDir = normalize(u_umbra_pos);
            vec3 toPoint = vPositionWorld - umbraDir;
            float alongSun = dot(toPoint, sunDir);
            vec3 perpVec = toPoint - alongSun * sunDir;
            float distFromAxis = length(perpVec);
            
            float umbraRadius = 0.014; // ~100 km pitch-black totality core
            float penumbraRadius = 0.58; // ~3700 km wide partial eclipse zone
            
            if (distFromAxis <= umbraRadius) {
              // Deep pitch-black totality core (only 1% ambient starlight reaches ground)
              shadowDarkness = mix(0.992, 0.965, smoothstep(0.0, umbraRadius, distFromAxis));
            } else if (distFromAxis < penumbraRadius && u_show_penumbra > 0.5) {
              // Non-linear scientific solar obscuration curve (proportional to overlapping lunar/solar discs)
              float t = (distFromAxis - umbraRadius) / (penumbraRadius - umbraRadius);
              float obscuration = pow(1.0 - clamp(t, 0.0, 1.0), 1.85);
              shadowDarkness = obscuration * 0.94;
            }
            
            // 360° Umbral Sunset Twilight Halo
            float ringDistance = abs(distFromAxis - umbraRadius * 1.35);
            umbraRingGlow = exp(-ringDistance * 85.0) * smoothstep(-0.05, 0.2, ndotl);
            
            // Apply shadow only where sun reaches
            shadowDarkness *= smoothstep(-0.1, 0.05, ndotl);
          }

          // 4. Combine day, night, and solar eclipse shadow
          // Effective daylight reaches surface only where not blocked by Moon's shadow
          float effectiveSunlight = dayFactor * (1.0 - shadowDarkness);
          vec3 finalColor = mix(nightColor, dayColor, smoothstep(0.0, 0.12, effectiveSunlight));

          // Add realistic ocean specular reflection (Sun Glint on water!)
          if (isWater > 0.5 && effectiveSunlight > 0.02) {
            vec3 viewDir = normalize(cameraPosition - (vPositionWorld * 100.0));
            vec3 halfDir = normalize(sunDir + viewDir);
            float spec = pow(max(0.0, dot(vNormalWorld, halfDir)), 32.0);
            finalColor += vec3(1.0, 0.92, 0.80) * spec * effectiveSunlight * u_ocean_specular;
          }

          // Add sunset terminator glow where sunlight is grazing the horizon (Controlled by GUI)
          if (u_show_terminator > 0.5 && u_terminator_glow > 0.001) {
            finalColor += sunsetTint * terminatorGlow * (1.0 - shadowDarkness) * u_terminator_glow;
          }

          // Add 360° Umbral Twilight Ring (Golden Sunset Halo around Totality Core, Controlled by GUI)
          if (umbraRingGlow > 0.0 && u_umbra_ring_glow > 0.001) {
            vec3 umbraHaloColor = vec3(0.96, 0.62, 0.15); // Solar Gold corona ring
            finalColor += umbraHaloColor * umbraRingGlow * u_umbra_ring_glow;
          }

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Asynchronously load high-res NASA Blue Marble, Earth at Night & Specular Water CDN textures
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    
    textureLoader.load(
      'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        earthMat.uniforms.u_day_texture.value = tex;
        earthMat.needsUpdate = true;
      }
    );

    textureLoader.load(
      'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        earthMat.uniforms.u_night_texture.value = tex;
        earthMat.needsUpdate = true;
      }
    );

    textureLoader.load(
      'https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png',
      (tex) => {
        tex.anisotropy = maxAniso;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        earthMat.uniforms.u_water_texture.value = tex;
        earthMat.needsUpdate = true;
      }
    );

    // 2. Atmosphere Glow Halo (soft atmospheric white-blue)
    const atmosGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.016, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      uniforms: {
        u_umbra_pos: { value: new THREE.Vector3(0, 1, 0) },
        u_sun_pos: { value: new THREE.Vector3(1, 0, 0) },
        u_has_umbra: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPositionWorld;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vPositionWorld = normalize(worldPos.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 u_umbra_pos;
        uniform vec3 u_sun_pos;
        uniform float u_has_umbra;
        varying vec3 vNormal;
        varying vec3 vPositionWorld;
        void main() {
          float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
          
          float shadowDarkness = 0.0;
          if (u_has_umbra > 0.5) {
            vec3 umbraDir = normalize(u_umbra_pos);
            vec3 sunDir = normalize(u_sun_pos);
            vec3 toPoint = vPositionWorld - umbraDir;
            float alongSun = dot(toPoint, sunDir);
            vec3 perpVec = toPoint - alongSun * sunDir;
            float distFromAxis = length(perpVec);
            
            float umbraRadius = 0.014;
            float penumbraRadius = 0.58;
            if (distFromAxis <= umbraRadius) {
              shadowDarkness = 0.99;
            } else if (distFromAxis < penumbraRadius) {
              float t = (distFromAxis - umbraRadius) / (penumbraRadius - umbraRadius);
              shadowDarkness = pow(1.0 - clamp(t, 0.0, 1.0), 1.85) * 0.94;
            }
          }
          
          gl_FragColor = vec4(0.35, 0.65, 0.95, 1.0) * max(0.0, intensity) * 0.85 * (1.0 - shadowDarkness);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    const atmosphereMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosphereMesh);
    atmosphereMeshRef.current = atmosphereMesh;

    // 3. Path of Totality Line (Semantic Solar Gold / Amber accent line)
    // Sample the 3D Geodesic Slerp astronomical trajectory every 15 seconds for a mathematically pristine curve on the sphere
    const curvePoints: THREE.Vector3[] = [];
    const routeStart = umbraPath[0]?.time ?? 61200;
    const routeEnd = umbraPath[umbraPath.length - 1]?.time ?? 66720;
    for (let t = routeStart; t <= routeEnd; t += Math.max(15, (routeEnd - routeStart) / 360)) {
      const pos = getPathPosition(umbraPath, t);
      if (pos) {
        const vec = latLonToVector3(pos.lat, pos.lon, EARTH_RADIUS * 1.004);
        curvePoints.push(new THREE.Vector3(...vec));
      }
    }
    const pathGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const pathMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2, transparent: true, opacity: 0.95 });
    const pathLine = new THREE.Line(pathGeo, pathMat);
    scene.add(pathLine);
    pathLineRef.current = pathLine;

    // 4. Station Markers Group
    const stationGroup = new THREE.Group();
    scene.add(stationGroup);
    stationMarkersRef.current = stationGroup;

    // 5. Celestial Icons & Sightlines Group
    const celestialGroup = new THREE.Group();
    scene.add(celestialGroup);
    celestialIconsRef.current = celestialGroup;

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera spherical transition if target is set (prevents excessive spinning or diving through Earth)
      if (targetCamPosRef.current && cameraRef.current && controlsRef.current) {
        const curPos = cameraRef.current.position;
        const targetPos = targetCamPosRef.current;

        const curDist = curPos.length();
        const targetDist = targetPos.length();

        const curDir = curPos.clone().normalize();
        const targetDir = targetPos.clone().normalize();

        const dot = Math.max(-1, Math.min(1, curDir.dot(targetDir)));
        const angle = Math.acos(dot);

        if (angle < 0.002 && Math.abs(curDist - targetDist) < 0.5) {
          cameraRef.current.position.copy(targetPos);
          targetCamPosRef.current = null;
        } else {
          // Minimal, calm rotation speed (strictly capped so it never spins excessively)
          const stepAngle = Math.min(angle * 0.035, 0.015);
          const t = angle > 0.0001 ? Math.min(1, stepAngle / angle) : 1;

          // Spherical interpolation between direction vectors
          const qCur = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), curDir);
          const qTarget = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), targetDir);
          qCur.slerp(qTarget, t);

          const newDir = new THREE.Vector3(0, 0, 1).applyQuaternion(qCur).normalize();
          const newDist = THREE.MathUtils.lerp(curDist, targetDist, 0.04);

          cameraRef.current.position.copy(newDir.multiplyScalar(newDist));
        }
      }

      // Animate active Orbital HUD reticle (subtle, clean breathing effect that never hides shadow)
      if (stationMarkersRef.current) {
        const time = Date.now() * 0.003;
        stationMarkersRef.current.children.forEach((group) => {
          if (group.userData && group.userData.isSelected && group.userData.targetRing) {
            const scale = 1.0 + Math.sin(time) * 0.12;
            group.userData.targetRing.scale.set(scale, scale, 1.0);
          }
        });
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, [generateFallbackDayTexture, generateFallbackNightTexture]);

  // Refresh the visible path when the user switches between the live 2026 route and an archive replay.
  useEffect(() => {
    if (!pathLineRef.current || !umbraPath.length) return;
    const routeStart = umbraPath[0].time;
    const routeEnd = umbraPath[umbraPath.length - 1].time;
    const points: THREE.Vector3[] = [];
    for (let t = routeStart; t <= routeEnd; t += Math.max(15, (routeEnd - routeStart) / 360)) {
      const pos = getPathPosition(umbraPath, t);
      if (pos) points.push(new THREE.Vector3(...latLonToVector3(pos.lat, pos.lon, EARTH_RADIUS * 1.004)));
    }
    pathLineRef.current.geometry.dispose();
    pathLineRef.current.geometry = new THREE.BufferGeometry().setFromPoints(points);
  }, [umbraPath]);

  // Update Scene elements when timestamp, selection, or toggles change
  useEffect(() => {
    if (!sceneRef.current) return;

    // Update Sun Position & Umbra Position in Earth Custom Shader
    if (earthMeshRef.current && earthMeshRef.current.material instanceof THREE.ShaderMaterial) {
      const subSolar = getSubSolarPoint(currentTimestamp);
      const sunVec = latLonToVector3(subSolar.lat, subSolar.lon, 1);
      earthMeshRef.current.material.uniforms.u_sun_pos.value.set(...sunVec);
      earthMeshRef.current.material.uniforms.u_show_terminator.value = showDayNightTerminator ? 1.0 : 0.0;

      const umbraPos = getPathPosition(umbraPath, currentTimestamp);
      if (umbraPos) {
        const uVec = latLonToVector3(umbraPos.lat, umbraPos.lon, 1);
        earthMeshRef.current.material.uniforms.u_umbra_pos.value.set(...uVec);
        earthMeshRef.current.material.uniforms.u_has_umbra.value = 1.0;
        earthMeshRef.current.material.uniforms.u_show_penumbra.value = showPenumbra ? 1.0 : 0.0;
        
        if (atmosphereMeshRef.current) {
          const mat = atmosphereMeshRef.current.material as THREE.ShaderMaterial;
          mat.uniforms.u_umbra_pos.value.set(...uVec);
          mat.uniforms.u_has_umbra.value = 1.0;
          mat.uniforms.u_sun_pos.value.set(...sunVec);
        }
      } else {
        earthMeshRef.current.material.uniforms.u_has_umbra.value = 0.0;
        if (atmosphereMeshRef.current) {
          (atmosphereMeshRef.current.material as THREE.ShaderMaterial).uniforms.u_has_umbra.value = 0.0;
        }
      }
    }

    // Update Sun Light direction
    const subSolar = getSubSolarPoint(currentTimestamp);
    const sunLightVec = latLonToVector3(subSolar.lat, subSolar.lon, 500);
    if (sunLightRef.current) {
      sunLightRef.current.position.set(...sunLightVec);
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = showDayNightTerminator ? 0.45 : 0.85;
    }

    // Update Path Line Visibility
    if (pathLineRef.current) {
      pathLineRef.current.visible = showPathLine;
    }

    // Update Station Markers & Custom Observation Pin (Orbital HUD Laser Reticles)
    if (stationMarkersRef.current) {
      while (stationMarkersRef.current.children.length > 0) {
        stationMarkersRef.current.remove(stationMarkersRef.current.children[0]);
      }

      const createOrbitalHud = (coords: { lat: number; lon: number }, isSelected: boolean, label: string, isCustom: boolean = false, stationData?: any) => {
        const pos = latLonToVector3(coords.lat, coords.lon, EARTH_RADIUS * 1.002);
        const hudGroup = new THREE.Group();
        hudGroup.position.set(...pos);
        hudGroup.lookAt(new THREE.Vector3(0, 0, 0));
        hudGroup.userData = { station: stationData, isCustom, isSelected };

        // 1. Core precision point (minimal dot that never obscures map features)
        const coreGeo = new THREE.SphereGeometry(isSelected ? 0.35 : 0.2, 12, 12);
        const coreMat = new THREE.MeshBasicMaterial({ color: isSelected ? (isCustom ? 0x10b981 : 0x00f2fe) : 0xe2e8f0 });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        hudGroup.add(coreMesh);

        // 2. Thin open wireframe target ring (100% transparent to underlying topography)
        const baseRingGeo = new THREE.RingGeometry(isSelected ? 1.5 : 0.9, isSelected ? 1.7 : 1.1, 32);
        const baseRingMat = new THREE.MeshBasicMaterial({
          color: isCustom ? 0x10b981 : (isSelected ? 0x00f2fe : 0x94a3b8),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isSelected ? 0.9 : 0.45
        });
        const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
        hudGroup.add(baseRing);
        if (isSelected) {
          hudGroup.userData.targetRing = baseRing;
        }

        stationMarkersRef.current?.add(hudGroup);
      };

      OBSERVATION_STATIONS.forEach((station) => {
        const isSelected = selectedStation?.id === station.id && !selectedStation?.isCustom;
        createOrbitalHud(station.coords, isSelected, station.name, false, station);
      });

      if (selectedStation?.isCustom) {
        createOrbitalHud(selectedStation.coords, true, selectedStation.name || "Custom Target", true, selectedStation);
      }
    }

    // Update Celestial Icons & Sightline Arcs
    if (celestialIconsRef.current) {
      while (celestialIconsRef.current.children.length > 0) {
        const child = celestialIconsRef.current.children[0] as any;
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
          else child.material.dispose();
        }
        celestialIconsRef.current.remove(child);
      }

      if (showCelestialIcons) {
        const subSolar = getSubSolarPoint(currentTimestamp);
        const umbraPos = getPathPosition(umbraPath, currentTimestamp);

        // 1. Sub-Solar Sun Badge & Surface Ring
        const sunPos = latLonToVector3(subSolar.lat, subSolar.lon, EARTH_RADIUS * 1.05);
        const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: getCelestialTexture('sun_surface'), transparent: true }));
        sunSprite.scale.set(24, 12, 1);
        sunSprite.position.set(...sunPos);
        celestialIconsRef.current.add(sunSprite);

        const sunRingGeo = new THREE.RingGeometry(2.5, 3.1, 32);
        const sunRingMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
        const sunRing = new THREE.Mesh(sunRingGeo, sunRingMat);
        sunRing.position.set(...latLonToVector3(subSolar.lat, subSolar.lon, EARTH_RADIUS * 1.004));
        sunRing.lookAt(new THREE.Vector3(0, 0, 0));
        celestialIconsRef.current.add(sunRing);

        // 2. Sub-Lunar / Umbra Core Moon Badge & Surface Ring
        if (umbraPos) {
          const moonPos = latLonToVector3(umbraPos.lat, umbraPos.lon, EARTH_RADIUS * 1.06);
          const moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: getCelestialTexture('moon_surface'), transparent: true }));
          moonSprite.scale.set(24, 12, 1);
          moonSprite.position.set(...moonPos);
          celestialIconsRef.current.add(moonSprite);

          const moonRingGeo = new THREE.RingGeometry(2.0, 2.6, 32);
          const moonRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
          const moonRing = new THREE.Mesh(moonRingGeo, moonRingMat);
          moonRing.position.set(...latLonToVector3(umbraPos.lat, umbraPos.lon, EARTH_RADIUS * 1.005));
          moonRing.lookAt(new THREE.Vector3(0, 0, 0));
          celestialIconsRef.current.add(moonRing);
        }

        // 3. Line of Sight Arcs & Direction Beams from Selected Station
        if (selectedStation && selectedStation.coords) {
          const stCoords = selectedStation.coords;
          const vecP = new THREE.Vector3(...latLonToVector3(stCoords.lat, stCoords.lon, EARTH_RADIUS));
          const sunDir = new THREE.Vector3(...latLonToVector3(subSolar.lat, subSolar.lon, 1)).normalize();

          // Surface Arc to Sun
          const sunArcPts = generateGreatCircleArc(stCoords, subSolar, EARTH_RADIUS * 1.008, 40);
          if (sunArcPts.length > 1) {
            const sunCurve = new THREE.CatmullRomCurve3(sunArcPts);
            const sunArcGeo = new THREE.TubeGeometry(sunCurve, 40, 0.35, 6, false);
            const sunArcMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.7 });
            celestialIconsRef.current.add(new THREE.Mesh(sunArcGeo, sunArcMat));
          }

          // Sky Beam to Sun
          const sunRayEnd = vecP.clone().addScaledVector(sunDir, 42);
          const sunRayCurve = new THREE.CatmullRomCurve3([vecP, sunRayEnd]);
          const sunRayGeo = new THREE.TubeGeometry(sunRayCurve, 2, 0.35, 6, false);
          const sunRayMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.8 });
          celestialIconsRef.current.add(new THREE.Mesh(sunRayGeo, sunRayMat));

          const sunSkySprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: getCelestialTexture('sun_sky'), transparent: true }));
          sunSkySprite.scale.set(18, 9, 1);
          sunSkySprite.position.copy(vecP.clone().addScaledVector(sunDir, 47));
          celestialIconsRef.current.add(sunSkySprite);

          if (umbraPos) {
            // Surface Arc to Moon/Umbra
            const moonArcPts = generateGreatCircleArc(stCoords, umbraPos, EARTH_RADIUS * 1.009, 40);
            if (moonArcPts.length > 1) {
              const moonCurve = new THREE.CatmullRomCurve3(moonArcPts);
              const moonArcGeo = new THREE.TubeGeometry(moonCurve, 40, 0.35, 6, false);
              const moonArcMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
              celestialIconsRef.current.add(new THREE.Mesh(moonArcGeo, moonArcMat));
            }

            // Sky Beam to Moon
            const vecU = new THREE.Vector3(...latLonToVector3(umbraPos.lat, umbraPos.lon, EARTH_RADIUS));
            const vecM = vecU.clone().addScaledVector(sunDir, 3000);
            const moonDir = new THREE.Vector3().subVectors(vecM, vecP).normalize();

            const moonRayEnd = vecP.clone().addScaledVector(moonDir, 38);
            const moonRayCurve = new THREE.CatmullRomCurve3([vecP, moonRayEnd]);
            const moonRayGeo = new THREE.TubeGeometry(moonRayCurve, 2, 0.35, 6, false);
            const moonRayMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.8 });
            celestialIconsRef.current.add(new THREE.Mesh(moonRayGeo, moonRayMat));

            const moonSkySprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: getCelestialTexture('moon_sky'), transparent: true }));
            moonSkySprite.scale.set(18, 9, 1);
            moonSkySprite.position.copy(vecP.clone().addScaledVector(moonDir, 43));
            celestialIconsRef.current.add(moonSkySprite);
          }
        }
      }
    }

    // Update Camera based on mode (Only auto-animate when user has NOT manually taken control of the camera)
    if (cameraRef.current && controlsRef.current && !isDraggingRef.current && !userCameraOverrideRef.current) {
      const umbraPos = getPathPosition(umbraPath, currentTimestamp);
      const currentDist = cameraRef.current.position.length() || 310;
      const targetDist = Math.max(140, Math.min(800, currentDist));

      if (cameraMode === 'follow-shadow' && umbraPos) {
        const camPos = latLonToVector3(umbraPos.lat, umbraPos.lon, targetDist);
        targetCamPosRef.current = new THREE.Vector3(...camPos);
        controlsRef.current.target.set(0, 0, 0);
      } else if (cameraMode === 'focused-station' && selectedStation) {
        const coords = selectedStation.coords;
        if (coords) {
          const camPos = latLonToVector3(coords.lat, coords.lon, targetDist);
          targetCamPosRef.current = new THREE.Vector3(...camPos);
          controlsRef.current.target.set(0, 0, 0);
        }
      } else if (cameraMode === 'top-down') {
        targetCamPosRef.current = new THREE.Vector3(0, targetDist, 40);
        controlsRef.current.target.set(0, 0, 0);
      } else if (cameraMode === 'spain-fixed') {
        // Fixed center on Spain (Lat 40.8° N, Lon -2.5° W) zoomed out so the entire Earth globe is clearly visible
        const camPos = latLonToVector3(40.8, -2.5, targetDist);
        targetCamPosRef.current = new THREE.Vector3(...camPos);
        controlsRef.current.target.set(0, 0, 0);
      }
    }
  }, [currentTimestamp, selectedStation, cameraMode, cameraResetTrigger, showPathLine, showPenumbra, showDayNightTerminator, showCelestialIcons]);

  // Handle Click on Globe / Markers
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    if (stationMarkersRef.current) {
      const markerIntersects = raycasterRef.current.intersectObjects(stationMarkersRef.current.children, true);
      if (markerIntersects.length > 0) {
        let hit: THREE.Object3D | null = markerIntersects[0].object;
        while (hit && !hit.userData?.station && hit.parent && hit !== stationMarkersRef.current) {
          hit = hit.parent;
        }
        if (hit && hit.userData && hit.userData.station && !hit.userData.isCustom) {
          userCameraOverrideRef.current = true;
          onUserInteractRef.current?.();
          onSelectStation(hit.userData.station);
          onCameraModeChange('focused-station');
          return;
        }
      }
    }

    if (earthMeshRef.current) {
      const earthIntersects = raycasterRef.current.intersectObject(earthMeshRef.current);
      if (earthIntersects.length > 0) {
        const point = earthIntersects[0].point;
        const radius = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
        const lat = 90 - (Math.acos(point.y / radius) * 180) / Math.PI;
        let lon = ((Math.atan2(point.z, -point.x) * 180) / Math.PI) - 180;
        if (lon < -180) lon += 360;

        userCameraOverrideRef.current = true;
        onUserInteractRef.current?.();
        onDropCustomPin({ lat: Math.round(lat * 1000) / 1000, lon: Math.round(lon * 1000) / 1000 });
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] flex-1 bg-transparent overflow-hidden rounded-xl border border-white/15 shadow-2xl">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        onClick={handleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
