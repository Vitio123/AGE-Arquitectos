import './style.css';
import './ui.js';
import { createBuildingViewer, webglOK } from './viewer.js';

const heroHost = document.getElementById('hero3d');
const viewerHost = document.getElementById('viewer3d');

if (!webglOK()) {
  for (const h of [heroHost, viewerHost])
    h.innerHTML = '<div class="webgl-fallback">Tu navegador no soporta WebGL</div>';
} else {
  // Hero: rotación lenta, sin controles
  createBuildingViewer(heroHost, {
    background: 0x141414,
    params: { niveles: 7 },
    camera: [34, 20, 30],
    autoRotate: true, autoRotateSpeed: 0.6,
  });

  // Visor completo
  const V = createBuildingViewer(viewerHost, { background: 0x141414, zoom: true, pan: true, screenshots: true });
  const { P, build, renderer, controls } = V;
  const $ = id => document.getElementById(id);
  const parse = s => {
    const a = s.split(',').map(t => Number(t.trim())).filter(n => !isNaN(n)).sort((a, b) => a - b);
    return a.length >= 2 ? a.map(n => n - a[0]) : null;
  };

  $('niveles').oninput = e => { P.niveles = +e.target.value; $('vN').textContent = P.niveles; build(); };
  $('h').oninput       = e => { P.h = +e.target.value; $('vH').textContent = P.h.toFixed(1); build(); };
  $('explode').oninput = e => { P.explode = +e.target.value; $('vE').textContent = P.explode.toFixed(1); build(); };
  $('corte').oninput   = e => { P.corte = +e.target.value; $('vC').textContent = Math.round(P.corte * 100) + '%'; build(); };
  $('ejesX').onchange  = e => { const a = parse(e.target.value); if (a) { P.ejesX = a; build(); } };
  $('ejesY').onchange  = e => { const a = parse(e.target.value); if (a) { P.ejesY = a; build(); } };
  $('bModo').onclick = e => {
    P.modo = P.modo === 'acabado' ? 'estructura' : 'acabado';
    e.currentTarget.classList.toggle('on', P.modo === 'estructura');
    build();
  };
  $('bRot').onclick = e => {
    controls.autoRotate = !controls.autoRotate;
    e.currentTarget.classList.toggle('on', controls.autoRotate);
  };
  $('bPng').onclick = () => {
    const a = document.createElement('a');
    a.download = 'age-edificio.png';
    a.href = renderer.domElement.toDataURL('image/png');
    a.click();
  };
}
