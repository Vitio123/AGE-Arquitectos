import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createBuildingViewer(host, opts = {}) {
  const P = {
    niveles: 5, h: 3.0,
    ejesX: [0, 5.7, 11.4, 17.1], ejesY: [0, 5, 10],
    col: [0.30, 0.50], viga: [0.25, 0.50], losa: 0.20, volado: 0.6,
    explode: 0, corte: 1, modo: 'acabado',
    ...opts.params,
  };
  const bg = opts.background ?? 0x141414;

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!opts.screenshots });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, 70, 180);

  const camera = new THREE.PerspectiveCamera(opts.fov ?? 40, 1, 0.1, 500);
  camera.position.set(...(opts.camera ?? [30, 22, 32]));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = !!opts.pan;
  controls.minDistance = 12;
  controls.maxDistance = 120;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.autoRotate = !!opts.autoRotate && !reduceMotion;
  controls.autoRotateSpeed = opts.autoRotateSpeed ?? 0.8;

  // Zoom con rueda sólo después de hacer clic dentro (no bloquea el scroll de la página)
  controls.enableZoom = false;
  if (opts.zoom) {
    renderer.domElement.addEventListener('pointerdown', () => { controls.enableZoom = true; });
    renderer.domElement.addEventListener('pointerleave', () => { controls.enableZoom = false; });
  }

  scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, 0.7));
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.2);
  sun.position.set(25, 40, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 140 });
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(bg).offsetHSL(0, 0, 0.01), roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000);
  const mat = o => new THREE.MeshStandardMaterial({ clippingPlanes: [clip], clipShadows: true, ...o });
  const M = {
    concreto: mat({ color: 0xcfcbc4, roughness: 0.85 }),
    viga:     mat({ color: 0xb4b0a9, roughness: 0.8 }),
    losa:     mat({ color: 0xe4e1dc, roughness: 0.9 }),
    marco:    mat({ color: 0x1b1b1b, roughness: 0.4, metalness: 0.6 }),
    acento:   mat({ color: 0xf0f0f0, roughness: 0.5, metalness: 0.1, emissive: 0x222222 }),
    vidrio:   new THREE.MeshPhysicalMaterial({
      color: 0x9fb4bd, roughness: 0.05, transparent: true, opacity: 0.28,
      side: THREE.DoubleSide, depthWrite: false, clippingPlanes: [clip],
    }),
  };
  const lineMat = new THREE.LineBasicMaterial({ color: 0x3a3a3a });

  const building = new THREE.Group();
  scene.add(building);

  function box(w, h, d, x, y, z, m) {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z);
    o.castShadow = m !== M.vidrio;
    o.receiveShadow = true;
    building.add(o);
    return o;
  }
  function line(a, b) {
    building.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat));
  }
  function clear() {
    building.traverse(o => o.geometry && o.geometry.dispose());
    building.clear();
  }

  let first = true;
  function build() {
    clear();
    const X = P.ejesX, Y = P.ejesY, cx = X.at(-1) / 2, cy = Y.at(-1) / 2;
    const [cb, ch] = P.col, [vb, vh] = P.viga, e = P.losa, v = P.volado, est = P.modo === 'estructura';
    const W = X.at(-1) + cb + 2 * v, D = Y.at(-1) + ch + 2 * v;

    // Ejes en planta
    for (const x of X) line(new THREE.Vector3(x - cx, 0.01, -cy - 3), new THREE.Vector3(x - cx, 0.01, cy + 3));
    for (const y of Y) line(new THREE.Vector3(-cx - 3, 0.01, y - cy), new THREE.Vector3(cx + 3, 0.01, y - cy));

    let top = 0;
    for (let i = 0; i < P.niveles; i++) {
      const base = i * (P.h + P.explode);
      top = base + P.h;
      const hc = P.h - e;
      // Columnas
      for (const x of X) for (const y of Y) box(cb, hc, ch, x - cx, base + hc / 2, y - cy, est ? M.acento : M.concreto);
      // Vigas
      for (const y of Y) for (let k = 0; k < X.length - 1; k++)
        box(X[k + 1] - X[k], vh, vb, (X[k] + X[k + 1]) / 2 - cx, top - e - vh / 2, y - cy, M.viga);
      for (const x of X) for (let k = 0; k < Y.length - 1; k++)
        box(vb, vh, Y[k + 1] - Y[k], x - cx, top - e - vh / 2, (Y[k] + Y[k + 1]) / 2 - cy, M.viga);
      // Losa
      box(W, e, D, 0, top - e / 2, 0, M.losa);
      // Fachada de vidrio con parteluces
      if (!est) {
        const gy = base + hc / 2;
        const pX = (x0, x1, z) => {
          const L = x1 - x0 - cb;
          box(L, hc, 0.02, (x0 + x1) / 2 - cx, gy, z, M.vidrio);
          const n = Math.max(1, Math.round(L / 1.4));
          for (let j = 1; j < n; j++) box(0.05, hc, 0.08, x0 + cb / 2 + L * j / n - cx, gy, z, M.marco);
        };
        const pZ = (y0, y1, x) => {
          const L = y1 - y0 - ch;
          box(0.02, hc, L, x, gy, (y0 + y1) / 2 - cy, M.vidrio);
          const n = Math.max(1, Math.round(L / 1.4));
          for (let j = 1; j < n; j++) box(0.08, hc, 0.05, x, gy, y0 + ch / 2 + L * j / n - cy, M.marco);
        };
        for (let k = 0; k < X.length - 1; k++) { pX(X[k], X[k + 1], -cy - ch / 2 + 0.04); pX(X[k], X[k + 1], cy + ch / 2 - 0.04); }
        for (let k = 0; k < Y.length - 1; k++) { pZ(Y[k], Y[k + 1], -cx - cb / 2 + 0.04); pZ(Y[k], Y[k + 1], cx + cb / 2 - 0.04); }
      }
    }
    // Parapeto
    const hp = 1.0, t = 0.15;
    box(W, hp, t, 0, top + hp / 2, -D / 2 + t / 2, M.concreto);
    box(W, hp, t, 0, top + hp / 2, D / 2 - t / 2, M.concreto);
    box(t, hp, D, -W / 2 + t / 2, top + hp / 2, 0, M.concreto);
    box(t, hp, D, W / 2 - t / 2, top + hp / 2, 0, M.concreto);

    clip.constant = (top + hp) * P.corte + 0.001;
    if (first) { controls.target.set(0, top / 2, 0); first = false; }
  }

  // Tamaño
  new ResizeObserver(() => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }).observe(host);

  // Renderiza sólo cuando está en pantalla
  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(host);
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    controls.update();
    renderer.render(scene, camera);
  });

  build();
  return { P, build, renderer, controls };
}

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch { return false; }
}
