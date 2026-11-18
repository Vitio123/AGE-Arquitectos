import * as THREE from 'three';
import { makeRenderer, makeEnv, addLights, autoResize, visibility, isMobile, clamp, smooth, easeOut } from '../core/common.js';
import { createMaterials, PAL } from '../core/materials.js';
import { officeTower } from '../models/tower.js';

/*
 * Sección "Del plano a la obra": el edificio se construye mientras haces scroll.
 *   0.00–0.25  Concepto   → se dibuja el plano en el piso y suben los volúmenes en líneas
 *   0.25–0.50  Estructura → columnas, núcleo y losas; aparece la grúa y los obreros
 *   0.50–0.75  Envolvente → muro cortina, aletas, balcones, azotea y letrero
 *   0.75–1.00  Interiores → muebles, luces, paisaje, oficinistas y peatones
 * La cámara empieza casi en planta (se lee el plano) y baja a vista de peatón.
 */
const STAGES = { concepto: [0.0, 0.24], estructura: [0.2, 0.5], envolvente: [0.46, 0.76], interior: [0.72, 0.95] };
const WORKS = [0.22, 0.74];   // la obra (grúa, cerco, obreros) existe sólo en este tramo

export function initProcess(section, host, { onStep, onProgress } = {}) {
  const renderer = makeRenderer();
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const bg = new THREE.Color(PAL.bg);
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 26, 46);          // fundido radial (ver core/fade.js)
  scene.environment = makeEnv(renderer);
  addLights(scene, { size: 36 });

  const M = createMaterials();
  const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 64), M.ground);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);

  const tower = officeTower(M, { floors: isMobile ? 5 : 6 });
  scene.add(tower.group);
  const floors = Math.max(...tower.items.map(o => o.userData.floor)) + 1;

  const camera = new THREE.PerspectiveCamera(isMobile ? 46 : 34, 1, 0.5, 400);
  autoResize(renderer, camera, host, (w, h) => {
    if (w > 760) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.22, w, h);
  });

  // Progreso del scroll dentro de la sección
  let progress = 0, shown = 0, lastStep = -1;
  const readProgress = () => {
    const r = section.getBoundingClientRect();
    const total = r.height - innerHeight;
    progress = clamp(-r.top / (total || 1));
  };
  addEventListener('scroll', readProgress, { passive: true });
  addEventListener('resize', readProgress);
  readProgress();

  /** Progreso local (0..1) de un elemento según su etapa y nivel. */
  const local = (stage, floor, p) => {
    const [a, b] = STAGES[stage];
    const span = (b - a) / floors;
    return easeOut(clamp((p - a - floor * span * 0.8) / (span * 1.8)));
  };

  function apply(p) {
    for (const o of tower.items) {
      const { stage, floor, mode, base } = o.userData;
      if (mode === 'temp') { o.visible = p > WORKS[0] && p < WORKS[1]; continue; }
      const k = local(stage, floor, p);
      o.visible = k > 0.001;
      if (!o.visible) continue;
      if (mode === 'plan') o.scale.set(k, 1, k);
      else if (mode === 'lines' || mode === 'grow') o.scale.y = Math.max(k, 0.001);
      else if (mode === 'drop') o.position.y = base + (1 - k) * 6;
      else if (mode === 'pop') o.scale.setScalar(0.85 + 0.15 * k);
      else if (mode === 'toggle') o.visible = k > 0.5;
    }
    // Las líneas del plano se atenúan cuando aparece la obra; las luces se encienden al final
    M.line.opacity = 0.95 - 0.8 * smooth(0.3, 0.62, p);
    M.lineSoft.opacity = 0.5 - 0.42 * smooth(0.3, 0.62, p);
    const lights = smooth(0.72, 0.95, p);
    M.warm.emissiveIntensity = 0.15 + 1.2 * lights;
    M.sign.emissiveIntensity = 0.2 + 2.2 * lights;
    M.accent.emissiveIntensity = 0.2 + 1.6 * lights;
  }

  const isVisible = visibility(host);
  const clock = new THREE.Clock();
  const target = new THREE.Vector3();
  const H = tower.height;

  renderer.setAnimationLoop(() => {
    if (!isVisible()) return;
    const t = clock.getElapsedTime();
    shown += (progress - shown) * 0.12;   // suavizado
    apply(shown);
    tower.update(t);

    const step = Math.min(3, Math.floor(shown * 4 + 0.02));
    if (step !== lastStep) { lastStep = step; onStep && onStep(step); }
    onProgress && onProgress(shown);

    // Cámara: de vista de planta (alta y cenital) a vista de peatón
    const e = smooth(0, 1, shown);
    const dist = (isMobile ? 96 : 84) - e * 12;
    const elev = 1.15 - e * 0.85;
    const theta = -0.85 + shown * 1.45 + Math.sin(t * 0.15) * 0.03;
    target.set(0, 1 + e * H * 0.42, 0);
    camera.position.set(
      Math.sin(theta) * Math.cos(elev) * dist,
      target.y + Math.sin(elev) * dist,
      Math.cos(theta) * Math.cos(elev) * dist,
    );
    camera.lookAt(target);
    renderer.render(scene, camera);
  });
}
