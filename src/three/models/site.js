import * as THREE from 'three';
import { box, cyl, place } from '../core/materials.js';
import { vcBuild, vcMaterial, taper, limb } from './people.js';

/*
 * Kit de exteriores: vegetación, mobiliario urbano, calles y tránsito.
 * Todo en metros, apoyado en y = 0.
 */

const hash = (x, y, z, s) => { const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + s) * 43758.5453; return h - Math.floor(h); };

/** Icosaedro "abollado" (copas low-poly orgánicas). */
function blob(r, seed = 0, rough = 0.32) {
  const g = new THREE.IcosahedronGeometry(r, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const f = 1 + (hash(x, y, z, seed) - 0.5) * rough;
    p.setXYZ(i, x * f, y * f, z * f);
  }
  g.computeVertexNormals();
  return g;
}

function crown(parent, mat, r, x, y, z, seed, sy = 1) {
  const m = new THREE.Mesh(blob(r, seed), mat);
  m.position.set(x, y, z); m.scale.y = sy;
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}

/* ---------- Vegetación ---------- */

/**
 * Árbol. variant:
 *  0 copa redonda · 1 ciprés · 2 jacarandá (lila) · 3 guayacán (durazno) · 4 molle (copa amplia)
 */
export function tree(M, s = 1, variant = 0) {
  const g = new THREE.Group();
  const v = variant % 5;
  const seed = variant * 7.31 + s * 3.1;
  const trunkH = [1.9, 0.9, 2.2, 2.0, 1.7][v] * s;
  cyl(g, M.trunk, 0.1 * s, 0.17 * s, trunkH, 0, trunkH / 2, 0, 6);

  if (v === 0) {
    crown(g, M.leaf, 1.15 * s, 0, trunkH + 0.75 * s, 0, seed);
    crown(g, M.leaf2, 0.8 * s, 0.55 * s, trunkH + 0.35 * s, 0.3 * s, seed + 1);
    crown(g, M.leaf, 0.75 * s, -0.5 * s, trunkH + 0.5 * s, -0.35 * s, seed + 2);
  } else if (v === 1) {
    crown(g, M.leaf2, 0.7 * s, 0, trunkH + 1.6 * s, 0, seed, 2.6);
  } else if (v === 2 || v === 3) {
    const mat = v === 2 ? M.leafLilac : M.leafPeach;
    // Ramas abiertas y copa ancha y plana
    for (const a of [0.5, -0.6]) {
      const b = cyl(g, M.trunk, 0.05 * s, 0.08 * s, 1.2 * s, Math.sin(a) * 0.35 * s, trunkH + 0.35 * s, 0, 5);
      b.rotation.z = -a;
    }
    crown(g, mat, 1.0 * s, 0.55 * s, trunkH + 0.95 * s, 0.1 * s, seed, 0.6);
    crown(g, mat, 0.95 * s, -0.6 * s, trunkH + 0.85 * s, -0.2 * s, seed + 1, 0.6);
    crown(g, mat, 0.8 * s, 0, trunkH + 1.25 * s, 0.4 * s, seed + 2, 0.6);
    crown(g, M.leaf2, 0.55 * s, 0.1 * s, trunkH + 0.7 * s, -0.5 * s, seed + 3, 0.7);
  } else {
    crown(g, M.leaf2, 1.4 * s, 0, trunkH + 0.75 * s, 0, seed, 0.55);
    crown(g, M.leaf, 1.0 * s, 0.7 * s, trunkH + 1.05 * s, 0.2 * s, seed + 1, 0.55);
  }
  return g;
}

/** Palmera con tronco curvo y hojas caídas. */
export function palm(M, s = 1, seed = 0) {
  const g = new THREE.Group();
  const n = 5, segH = 0.9 * s, lean = 0.06 + (seed % 3) * 0.03;
  let x = 0, y = 0;
  for (let i = 0; i < n; i++) {
    const r0 = (0.17 - i * 0.015) * s;
    const c = cyl(g, M.trunk, r0 * 0.85, r0, segH, x, y + segH / 2, 0, 6);
    c.rotation.z = -lean * (i + 1);
    x += Math.sin(lean * (i + 1)) * segH; y += Math.cos(lean * (i + 1)) * segH;
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + seed;
    const frond = new THREE.Group();
    frond.position.set(x, y, 0); frond.rotation.y = a;
    for (let k = 0; k < 3; k++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.42 * s * (1 - k * 0.25), 0.03, 0.75 * s), k % 2 ? M.leaf2 : M.leaf);
      leaf.position.set(0, 0.15 * s - k * k * 0.22 * s, (0.35 + k * 0.65) * s);
      leaf.rotation.x = 0.15 + k * 0.38;
      leaf.castShadow = true; frond.add(leaf);
    }
    g.add(frond);
  }
  crown(g, M.trunk, 0.22 * s, x, y, 0, seed);
  return g;
}

export function shrub(M, r = 0.5, mat = M.hedge, seed = 0) {
  const g = new THREE.Group();
  crown(g, mat, r, 0, r * 0.7, 0, seed, 0.8);
  return g;
}

/** Seto recto a lo largo de x. */
export function hedge(M, len, h = 0.9, d = 0.7) {
  const g = new THREE.Group();
  box(g, M.hedge, len, h, d, 0, h / 2, 0);
  for (let x = -len / 2 + 0.5; x < len / 2; x += 1.1) crown(g, M.hedge, 0.42, x, h, 0, x, 0.6);
  return g;
}

/** Macetero rectangular con arbustos. */
export function planter(M, w = 2, d = 0.8, h = 0.5, mat = M.concrete) {
  const g = new THREE.Group();
  box(g, mat, w, h, d, 0, h / 2, 0);
  box(g, M.grassDark, w - 0.12, 0.04, d - 0.12, 0, h + 0.01, 0, { shadow: false });
  for (let x = -w / 2 + 0.45; x < w / 2 - 0.2; x += 0.7) crown(g, M.hedge, 0.33, x, h + 0.25, 0, x * 3, 0.8);
  return g;
}

/* ---------- Mobiliario urbano ---------- */

export function bench(M) {
  const g = new THREE.Group();
  box(g, M.concrete, 0.25, 0.42, 0.5, -0.7, 0.21, 0);
  box(g, M.concrete, 0.25, 0.42, 0.5, 0.7, 0.21, 0);
  for (let i = 0; i < 4; i++) box(g, M.woodLight, 1.8, 0.05, 0.11, 0, 0.45, -0.18 + i * 0.12);
  return g;
}

export function streetLamp(M, h = 4.2) {
  const g = new THREE.Group();
  cyl(g, M.metal, 0.05, 0.07, h, 0, h / 2, 0, 6);
  box(g, M.metal, 0.9, 0.06, 0.12, 0.4, h, 0);
  box(g, M.lamp, 0.42, 0.05, 0.16, 0.7, h - 0.05, 0, { shadow: false });
  return g;
}

export function bollard(M) {
  const g = new THREE.Group();
  cyl(g, M.metal, 0.07, 0.07, 0.65, 0, 0.325, 0, 6);
  cyl(g, M.lamp, 0.072, 0.072, 0.08, 0, 0.55, 0, 6).castShadow = false;
  return g;
}

export function umbrella(M, mat = M.fabricSand) {
  const g = new THREE.Group();
  cyl(g, M.metal, 0.03, 0.03, 2.3, 0, 1.15, 0, 6);
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.45, 8), mat);
  top.position.y = 2.25; top.castShadow = true; g.add(top);
  return g;
}

/** Cerco de postes y travesaños a lo largo de una polilínea [[x,z],...]. */
export function fence(M, pts, h = 1.1, mat = M.wood) {
  const g = new THREE.Group();
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0);
    const seg = new THREE.Group();
    seg.position.set(x0, 0, z0); seg.rotation.y = a;
    const n = Math.max(1, Math.round(len / 2));
    for (let k = 0; k <= n; k++) box(seg, mat, 0.12, h, 0.12, 0, h / 2, (len * k) / n);
    for (const y of [h * 0.45, h * 0.9]) box(seg, mat, 0.06, 0.1, len, 0, y, len / 2);
    g.add(seg);
  }
  return g;
}

/* ---------- Calles ---------- */

/** Calle a lo largo de x en z, con veredas, sardineles, línea discontinua y cruce peatonal. */
export function street(M, { z = 0, len = 60, width = 7, walk = 2.4, crossAt = null } = {}) {
  const g = new THREE.Group();
  box(g, M.asphalt, len, 0.06, width, 0, 0.03, z, { shadow: false }).receiveShadow = true;
  for (let x = -len / 2 + 1; x < len / 2; x += 3) box(g, M.stripe, 1.5, 0.01, 0.14, x, 0.065, z, { shadow: false });
  for (const side of [-1, 1]) {
    const zc = z + side * (width / 2 + 0.08);
    box(g, M.concrete, len, 0.18, 0.16, 0, 0.09, zc);
    box(g, M.paving, len, 0.15, walk, 0, 0.075, z + side * (width / 2 + 0.16 + walk / 2)).receiveShadow = true;
  }
  if (crossAt !== null) for (let k = -width / 2 + 0.5; k < width / 2; k += 0.8) box(g, M.stripe, 2.8, 0.01, 0.42, crossAt, 0.065, z + k, { shadow: false });
  return g;
}

/* ---------- Vehículos y animales (color por vértice, mismo estilo PS1 que las personas) ---------- */

const CAR_COLORS = [0xf2ede4, 0x2a2a2e, 0xd9c39f, 0xc4774f, 0x2f3a56, 0x8a96b3, 0x6f7f55, 0xb38cff];

/** Auto low-poly mirando a +x. */
export function car(seed = 0) {
  const c = CAR_COLORS[Math.floor(Math.abs(seed) * 97) % CAR_COLORS.length];
  const wheel = () => new THREE.CylinderGeometry(0.33, 0.33, 0.26, 8).rotateX(Math.PI / 2);
  const geo = vcBuild(`car|${c}`, [
    [taper(1, 1, 0.62, 1.8, 1.8).scale(4.2, 1, 1), c, 0, 0.6, 0],
    [taper(0.78, 1, 0.55, 1.35, 1.65).scale(2.3, 1, 1), 0x1d2129, -0.2, 1.18, 0],
    [new THREE.BoxGeometry(1.75, 0.05, 1.32), c, -0.2, 1.47, 0],
    [new THREE.BoxGeometry(0.05, 0.12, 0.4), 0xfff1d6, 2.1, 0.72, 0.6],
    [new THREE.BoxGeometry(0.05, 0.12, 0.4), 0xfff1d6, 2.1, 0.72, -0.6],
    [new THREE.BoxGeometry(0.05, 0.12, 0.4), 0xd0432f, -2.1, 0.75, 0.6],
    [new THREE.BoxGeometry(0.05, 0.12, 0.4), 0xd0432f, -2.1, 0.75, -0.6],
    [wheel(), 0x141414, 1.35, 0.33, 0.82], [wheel(), 0x141414, -1.35, 0.33, 0.82],
    [wheel(), 0x141414, 1.35, 0.33, -0.82], [wheel(), 0x141414, -1.35, 0.33, -0.82],
  ]);
  const m = new THREE.Mesh(geo, vcMaterial());
  m.castShadow = true;
  m.userData.dynamic = true;
  return m;
}

/**
 * Tránsito por carriles paralelos al eje x.
 * lanes: [{ z, dir: 1|-1, speed, n, len }]. Los autos salen y entran por el borde
 * (el borde queda dentro del fundido radial, así que "aparecen" de la oscuridad).
 */
export function traffic(lanes, seed = 1) {
  const group = new THREE.Group();
  group.userData.dynamic = true;
  const cars = [];
  lanes.forEach((L, li) => {
    for (let i = 0; i < L.n; i++) {
      const c = car(seed * 0.31 + li * 0.17 + i * 0.13);
      c.rotation.y = L.dir > 0 ? 0 : Math.PI;
      c.position.set(0, L.y || 0, L.z);
      group.add(c);
      cars.push({ c, L, off: (i / L.n) * L.len + li * 7 });
    }
  });
  function update(t) {
    const tq = Math.floor(t * 15) / 15;
    for (const { c, L, off } of cars) {
      const d = ((off + tq * L.speed) % L.len + L.len) % L.len;
      c.position.x = (d - L.len / 2) * L.dir;
    }
  }
  update(0);
  return { group, update };
}

/** Caballo low-poly que pasta (para la casa de campo). */
export function horse(seed = 0) {
  const COLORS = [0x6b4a33, 0x8a5534, 0xe3dcd0, 0x2a2420];
  const c = COLORS[Math.floor(seed * 11) % COLORS.length], dark = 0x1f1813;
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const mk = (key, pieces) => { const m = new THREE.Mesh(vcBuild(`horse|${key}|${c}`, pieces), vcMaterial()); m.castShadow = true; return m; };
  g.add(mk('body', [
    [taper(0.5, 0.55, 0.62, 1.55, 1.5), c, 0, 1.2, 0],
    [new THREE.BoxGeometry(0.12, 0.7, 0.14), dark, 0, 0.95, -0.82],       // cola
  ]));
  const neck = new THREE.Group(); neck.position.set(0, 1.35, 0.62); g.add(neck);
  neck.add(mk('neck', [
    [taper(0.22, 0.3, 0.85, 0.32, 0.45), c, 0, 0.42, 0],
    [new THREE.BoxGeometry(0.06, 0.75, 0.12), dark, 0, 0.45, -0.18],      // crin
    [taper(0.2, 0.26, 0.55, 0.22, 0.3), c, 0, 1.05, 0.06],                // cabeza
    [new THREE.BoxGeometry(0.06, 0.14, 0.06), c, 0.08, 0.86, -0.08],      // orejas
  ]));
  const legs = [];
  for (const [x, z] of [[-0.17, 0.55], [0.17, 0.55], [-0.17, -0.55], [0.17, -0.55]]) {
    const l = new THREE.Group(); l.position.set(x, 0.95, z); g.add(l);
    l.add(mk('leg', [[limb(0.08, 0.06, 0.85), c], [new THREE.BoxGeometry(0.12, 0.1, 0.14), dark, 0, -0.9, 0.01]]));
    legs.push(l);
  }
  const ph = seed * 10;
  g.userData.update = t => {
    const tq = Math.floor(t * 15) / 15 + ph;
    const graze = 0.5 + 0.5 * Math.sin(tq * 0.35);         // sube y baja la cabeza
    neck.rotation.x = 0.45 + graze * 2.05 + Math.sin(tq * 3) * 0.04 * graze;
    neck.rotation.y = Math.sin(tq * 0.2) * 0.25;
    legs[0].rotation.x = Math.max(0, Math.sin(tq * 0.35 + 2)) * 0.25;
  };
  g.userData.update(0);
  return g;
}

/** Grupo de caballos. spots: [[x, z, ry], ...] */
export function herd(spots, seed = 0) {
  const group = new THREE.Group();
  group.userData.dynamic = true;
  const hs = spots.map(([x, z, ry], i) => place(group, horse((seed + i * 0.37) % 1), x, 0, z, ry));
  return { group, update: t => hs.forEach(h => h.userData.update(t)) };
}
