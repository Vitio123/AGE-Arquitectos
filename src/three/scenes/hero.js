import * as THREE from 'three';
import { makeRenderer, makeEnv, addLights, autoResize, visibility, isMobile, reduceMotion, clamp, easeOut } from '../core/common.js';
import { createMaterials, PAL } from '../core/materials.js';
import { modernHouse } from '../models/buildings.js';

/**
 * Escena de portada: casa moderna con interiores, calle y personas.
 * - La casa "brota" del suelo por partes al cargar.
 * - El mundo se disuelve en un círculo suave hacia el fondo (niebla radial),
 *   así el piso no cambia de forma cuando la cámara gira.
 * - La cámara orbita lento, sigue al mouse (escritorio) y gira con el scroll.
 */
export function initHero(host) {
  const renderer = makeRenderer();
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const bg = new THREE.Color(PAL.bg);
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 20, 40);
  scene.environment = makeEnv(renderer);
  addLights(scene, { size: 26 });

  const M = createMaterials();
  const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 64), M.ground);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);

  const house = modernHouse(M);
  scene.add(house.group);
  house.parts.forEach(p => { p.userData.baseY = p.position.y; p.position.y -= 10; });

  // Polvo flotante en tonos de la marca
  const N = isMobile ? 140 : 360;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 26;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.random() * 18;
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: PAL.sand, size: 0.08, transparent: true, opacity: 0.5, depthWrite: false }));
  scene.add(dust);

  const camera = new THREE.PerspectiveCamera(isMobile ? 42 : 34, 1, 0.5, 400);
  const target = new THREE.Vector3(0, 3, 0);

  // Desplaza el encuadre: casa a la derecha (escritorio) o arriba (celular)
  autoResize(renderer, camera, host, (w, h) => {
    if (w > 760) camera.setViewOffset(w, h, -w * 0.17, 0, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.3, w, h);
  });

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!isMobile) {
    addEventListener('pointermove', e => {
      pointer.tx = (e.clientX / innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  }

  const isVisible = visibility(host);
  const clock = new THREE.Clock();
  const radius = isMobile ? 54 : 48;

  renderer.setAnimationLoop(() => {
    if (!isVisible()) return;
    const t = clock.getElapsedTime();

    house.parts.forEach((p, i) => {
      const k = reduceMotion ? 1 : easeOut(clamp((t - 0.2 - i * 0.2) / 1.3));
      p.position.y = p.userData.baseY - (1 - k) * 10;
    });

    house.update(t);
    dust.rotation.y = t * 0.01;
    dust.position.y = Math.sin(t * 0.3) * 0.3;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    const scrollP = clamp(scrollY / innerHeight);
    const theta = 0.75 + (reduceMotion ? 0 : t * 0.045) + scrollP * 0.9 + pointer.x * 0.25;
    const height = 17 + pointer.y * 2.5 - scrollP * 5;
    camera.position.set(Math.sin(theta) * radius, height, Math.cos(theta) * radius);
    camera.lookAt(target);

    renderer.render(scene, camera);
  });
}
