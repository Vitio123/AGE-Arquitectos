import './styles/main.css';

import { initNav } from './ui/nav.js';
import { initReveal, initCounters, initTilt } from './ui/effects.js';
import { initProjects } from './ui/projects.js';

import { webglOK } from './three/core/common.js';
import { initHero } from './three/scenes/hero.js';
import { initProcess } from './three/scenes/process.js';
import { createGallery } from './three/scenes/gallery.js';
import { modernHouse, gableHouse, pavilion, storefront } from './three/models/buildings.js';
import { designScene, buildScene, interiorScene } from './three/models/icons.js';

const $ = id => document.getElementById(id);

// Maquetas 3D por tipo de proyecto
const MODELS = {
  modern: modernHouse,
  gable: gableHouse,
  pavilion,
  store: storefront,
};
const SERVICE_SCENES = { design: designScene, build: buildScene, interior: interiorScene };

const hasGL = webglOK();
const gallery = hasGL ? createGallery() : null;
const fallback = el => {
  el.insertAdjacentHTML('afterend', '<div class="webgl-fallback">Tu navegador no soporta WebGL</div>');
};

/* ---------- UI básica ---------- */
initNav();
$('year').textContent = new Date().getFullYear();

/* ---------- Lightbox ---------- */
const lb = $('lightbox');
let removeLive = null;
let lastFocus = null;

function openProject(p) {
  lastFocus = document.activeElement;
  $('lbTag').textContent = p.tag;
  $('lbTitle').textContent = p.name;
  $('lbLoc').textContent = `${p.loc}, Perú`;

  const img = $('lbImg');
  const oldCanvas = $('lbCanvas');
  // Canvas nuevo cada vez: un canvas 2D ya usado por la galería no se puede reasignar limpio
  const canvas = oldCanvas.cloneNode(false);
  oldCanvas.replaceWith(canvas);

  if (p.img) {
    img.src = p.img; img.alt = p.name; img.hidden = false; canvas.hidden = true;
  } else {
    img.hidden = true; canvas.hidden = false;
    if (gallery) {
      removeLive = gallery.addLive(canvas, M => MODELS[p.model](M, p.opts), { angle: 0.5, spin: 0.1, zoom: 0.82 });
    }
  }

  lb.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  $('lbClose').focus();
}

function closeProject() {
  lb.classList.remove('is-open');
  document.body.style.overflow = '';
  if (removeLive) { removeLive(); removeLive = null; }
  if (lastFocus) lastFocus.focus();
}

$('lbClose').addEventListener('click', closeProject);
lb.addEventListener('click', e => { if (e.target === lb) closeProject(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('is-open')) closeProject(); });

/* ---------- Proyectos ---------- */
initProjects({
  onCardMedia(canvas, p) {
    if (!gallery) return fallback(canvas);
    gallery.add(canvas, M => MODELS[p.model](M, p.opts), { angle: 0.3 + Math.random() * 0.7 });
  },
  onOpen: openProject,
});

/* ---------- Servicios (mini escenas) ---------- */
document.querySelectorAll('canvas[data-scene]').forEach(canvas => {
  const factory = SERVICE_SCENES[canvas.dataset.scene];
  if (!factory) return;
  if (!gallery) return fallback(canvas);
  gallery.add(canvas, factory, { angle: 0.75, spin: 0.25, sway: 0.45, zoom: 0.8, elevation: 0.55 });
});

/* ---------- Escenas grandes ---------- */
if (hasGL) {
  initHero($('hero3d'));

  const steps = [...document.querySelectorAll('#steps .step')];
  const bar = $('processBar');
  initProcess($('proceso'), $('process3d'), {
    onStep: i => steps.forEach((s, k) => s.classList.toggle('is-active', k === i)),
    onProgress: p => { bar.style.width = `${(p * 100).toFixed(1)}%`; },
  });
} else {
  for (const h of [$('hero3d'), $('process3d')])
    h.innerHTML = '<div class="webgl-fallback">Tu navegador no soporta WebGL</div>';
}

/* ---------- Formulario → mailto ---------- */
$('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const nombre = $('fNombre').value.trim();
  const email = $('fEmail').value.trim();
  const tipo = $('fTipo').value || 'Sin especificar';
  const msg = $('fMsg').value.trim();
  const subject = `Consulta de proyecto — ${nombre}`;
  const body = `Nombre: ${nombre}\nEmail: ${email}\nTipo de proyecto: ${tipo}\n\n${msg}`;
  location.href = `mailto:age.arquitec@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

/* ---------- Efectos ---------- */
initReveal();
initCounters();
initTilt('.project, .service-card');
