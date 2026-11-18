import * as THREE from 'three';
import { makeRenderer, makeEnv, isMobile, reduceMotion } from '../core/common.js';
import { createMaterials, PAL } from '../core/materials.js';

/*
 * Galería 3D en vivo con UN solo WebGLRenderer.
 * Cada tarjeta tiene un <canvas> 2D; el renderer dibuja la escena de la
 * tarjeta y la copia al canvas. Sólo se animan las tarjetas visibles,
 * a 15 fps (look PS1 y bajo consumo en celular).
 *
 * El terreno se funde en círculo hacia PAL.card, que es el mismo color de
 * fondo de las tarjetas en CSS (--card): no se ve ningún borde del piso.
 *
 * Uso:
 *   const gallery = createGallery();
 *   gallery.add(canvas, M => modernHouse(M), { angle: 0.8 });
 */

const FPS = 15;

export function createGallery() {
  const renderer = makeRenderer({ alpha: true, shadows: true, preserve: true });
  renderer.setPixelRatio(1);
  const env = makeEnv(renderer);
  const M = createMaterials();
  const views = new Set();

  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      const v = e.target.__view;
      if (!v) continue;
      v.visible = e.isIntersecting;
      if (e.isIntersecting && !v.built) build(v);
    }
  }, { rootMargin: '300px 0px' });

  function build(v) {
    const model = v.factory(M);
    const focus = model.focus ?? 10, site = model.site ?? focus * 1.8;

    const scene = new THREE.Scene();
    scene.environment = env;
    scene.fog = new THREE.Fog(PAL.card, site * 0.5, site * 0.97);   // termina antes del borde del disco
    scene.add(new THREE.HemisphereLight(0xf4efe7, 0x2a221b, 0.85));
    const sun = new THREE.DirectionalLight(0xffe2c2, 2.3);
    sun.position.set(-14, 22, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    const s = site * 0.8;
    Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 120 });
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xb7a2ff, 0.35);
    rim.position.set(16, 10, -18);
    scene.add(rim);
    scene.add(model.group);

    const camera = new THREE.PerspectiveCamera(30, 4 / 3, 0.5, 500);
    v.scene = scene; v.camera = camera; v.model = model;
    v.center = new THREE.Vector3(0, (model.height ?? 6) * 0.3, 0);
    v.dist = (focus / Math.sin(THREE.MathUtils.degToRad(15))) * (v.opts.zoom ?? 0.95);
    v.elev = v.opts.elevation ?? 0.45;
    v.built = true;
    v.draw(0);
  }

  function add(canvas, factory, opts = {}) {
    const ctx = canvas.getContext('2d');
    const v = { canvas, ctx, factory, opts, visible: false, built: false, angle: opts.angle ?? 0.7 };
    v.draw = t => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(devicePixelRatio, isMobile ? 1.5 : 2);
      const W = Math.round(w * dpr), H = Math.round(h * dpr);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      renderer.setSize(W, H, false);
      v.camera.aspect = W / H; v.camera.updateProjectionMatrix();
      // En tarjetas angostas (celular) se aleja un poco para que entre el edificio
      const fit = Math.max(1, 1.25 / v.camera.aspect);
      // sway → vaivén (para escenas en corte que no deben verse desde atrás); si no, giro continuo
      const a = v.angle + (reduceMotion ? 0 : opts.sway ? Math.sin(t * (opts.spin ?? 0.3)) * opts.sway : t * (opts.spin ?? 0.06));
      const d = v.dist * fit;
      v.camera.position.set(
        v.center.x + Math.sin(a) * d * Math.cos(v.elev),
        v.center.y + Math.sin(v.elev) * d,
        v.center.z + Math.cos(a) * d * Math.cos(v.elev),
      );
      v.camera.lookAt(v.center);
      v.model.update && v.model.update(t);
      renderer.render(v.scene, v.camera);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(renderer.domElement, 0, 0, W, H);
      if (!v.ready) { v.ready = true; canvas.classList.add('is-loaded'); }
    };
    canvas.__view = v;
    views.add(v);
    io.observe(canvas);
    return v;
  }

  /** Vista extra, siempre activa (ej. lightbox). Devuelve función para quitarla. */
  function addLive(canvas, factory, opts) {
    const v = add(canvas, factory, opts);
    v.visible = true;
    if (!v.built) build(v);
    return () => { io.unobserve(canvas); views.delete(v); };
  }

  const clock = new THREE.Clock();
  let last = 0;
  function loop() {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    const t = clock.getElapsedTime();
    if (t - last < 1 / FPS) return;
    last = t;
    for (const v of views) if (v.visible && v.built) v.draw(t);
  }
  loop();

  return { add, addLive };
}
