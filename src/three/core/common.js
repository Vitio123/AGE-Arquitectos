import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import './fade.js';   // niebla radial: debe cargarse antes de compilar materiales

export const isMobile =
  matchMedia('(max-width: 760px)').matches || matchMedia('(pointer: coarse)').matches;
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const easeOut = t => 1 - Math.pow(1 - t, 3);
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

export function makeRenderer({ alpha = false, shadows = !isMobile, preserve = false } = {}) {
  const r = new THREE.WebGLRenderer({
    antialias: !isMobile || devicePixelRatio < 2,
    alpha, preserveDrawingBuffer: preserve, powerPreference: 'high-performance',
  });
  r.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = shadows;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  return r;
}

export function makeEnv(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  return tex;
}

export function addLights(scene, { shadows = !isMobile, size = 30 } = {}) {
  scene.add(new THREE.HemisphereLight(0xf4efe7, 0x2a221b, 0.7));
  const sun = new THREE.DirectionalLight(0xffe2c2, 2.4);
  sun.position.set(-18, 28, 16);
  if (shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: 120 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
  }
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xb7a2ff, 0.45);   // contraluz lila (acento de la marca)
  rim.position.set(20, 12, -24);
  scene.add(rim);
  return sun;
}

/** Ajusta el tamaño del renderer al contenedor. onResize(w, h) opcional. */
export function autoResize(renderer, camera, host, onResize) {
  const ro = new ResizeObserver(() => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    onResize && onResize(w, h);
  });
  ro.observe(host);
}

/** Devuelve una función que indica si el contenedor está en pantalla (para pausar el render). */
export function visibility(host) {
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(host);
  return () => visible && !document.hidden;
}
