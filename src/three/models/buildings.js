import * as THREE from 'three';
import { box, cyl, disc, place } from '../core/materials.js';
import { bake } from '../core/bake.js';
import * as F from './furniture.js';
import { crowd } from './people.js';
import { tree, palm, hedge, planter, bench, streetLamp, bollard, umbrella, fence, street, traffic, car, herd } from './site.js';

/*
 * Maquetas de proyectos con interiores amoblados, paisaje y personas.
 * Todas devuelven:
 *   group   → raíz
 *   parts   → subgrupos estáticos (ya horneados) que la portada hace "brotar" en orden
 *   update  → anima personas, autos y animales (llamar cada frame con t en segundos)
 *   focus   → radio de lo importante (para encuadrar la cámara)
 *   site    → radio del terreno (el fundido radial termina ahí)
 *   height  → altura aproximada
 *   actors  → specs de personas (para la prueba de colisiones)
 *
 * Las rutas de las personas están trazadas para no pisar piscinas ni atravesar
 * árboles, muebles o paredes (ver scripts de prueba en el README del modelo).
 */

function kit() {
  const group = new THREE.Group();
  const parts = [];
  const add = () => { const g = new THREE.Group(); group.add(g); parts.push(g); return g; };
  const dyn = [];
  const live = obj => { group.add(obj.group); dyn.push(obj); return obj; };
  const finish = extra => {
    parts.forEach(bake);
    return {
      group, parts,
      update: t => dyn.forEach(d => d.update(t)),
      actors: dyn.filter(d => d.spec).map(d => d.spec),
      ...extra,
    };
  };
  return { group, add, live, finish };
}

/** Fila de parteluces sobre un vano. */
function mullions(parent, M, x0, x1, y, h, z, step = 1.4, axis = 'x') {
  const L = x1 - x0, n = Math.max(1, Math.round(L / step));
  for (let i = 1; i < n; i++) {
    const p = x0 + (L * i) / n;
    if (axis === 'x') box(parent, M.metal, 0.05, h, 0.08, p, y, z);
    else box(parent, M.metal, 0.08, h, 0.05, z, y, p);
  }
}

/** Auto estacionado (no se mueve). */
function parked(parent, seed, x, y, z, ry) {
  const c = car(seed); c.position.set(x, y, z); c.rotation.y = ry; parent.add(c); return c;
}

/* ===================================================================== */
/*  Casa moderna (portada y "Casa ZC")                                   */
/* ===================================================================== */

export function modernHouse(M, { ground = 'grass', pool = true, slats = true } = {}) {
  const { add, live, finish } = kit();
  const beach = ground === 'sand';

  // --- Terreno: jardín redondo, calle, muro de fachada y setos
  const site = add();
  disc(site, beach ? M.sand : M.grass, 19, 0.04, 0.04);
  site.add(street(M, { z: 15, len: 64, width: 6.5, walk: 2.2, crossAt: -9 }));
  for (const [x0, x1] of [[-15, -1.6], [0.1, 5.3], [9.6, 15]]) {
    box(site, M.concrete, x1 - x0, 1.0, 0.25, (x0 + x1) / 2, 0.5, 8.8);
    box(site, M.woodLight, x1 - x0, 0.06, 0.32, (x0 + x1) / 2, 1.03, 8.8);
  }
  for (const sx of [-1, 1]) { const h = hedge(M, 20.4); h.rotation.y = Math.PI / 2; h.position.set(sx * 15, 0.04, -1.8); site.add(h); }
  place(site, hedge(M, 30.7), 0, 0.04, -12.2);
  const ramp = box(site, M.paving, 2.8, 0.1, 1.5, 7.6, 0.27, 8.7); ramp.rotation.x = 0.17;
  for (const x of [-16, 4, 22]) place(site, streetLamp(M), x, 0.15, 11.45, -Math.PI / 2);
  for (const x of [-14, -2, 10]) place(site, tree(M, 0.85, 1), x, 0.15, 20.4);

  // --- Plataforma con escalones
  const base = add();
  box(base, M.concrete, 22, 0.4, 16, 0, 0.2, 0);
  box(base, M.concrete, 1.4, 0.27, 0.3, -0.4, 0.135, 8.15);
  box(base, M.concrete, 1.4, 0.13, 0.3, -0.4, 0.065, 8.45);

  // --- Núcleo de escalera en concreto con ventana vertical
  const core = add();
  box(core, M.concreteDark, 2.4, 7.2, 2.4, -6.6, 4.0, -2.3);
  box(core, M.glassDark, 0.3, 5, 0.02, -6.6, 4.4, -1.09, { shadow: false });

  // --- Primer piso: caja de vidrio con sala, cocina y comedor
  const gf = add();
  box(gf, M.concrete, 0.3, 2.8, 7, -8.15, 1.8, 0);
  box(gf, M.concrete, 12, 2.8, 0.25, -2, 1.8, -3.4);
  box(gf, M.glass, 12, 2.8, 0.03, -2, 1.8, 3.5, { shadow: false });
  box(gf, M.glass, 0.03, 2.8, 7, 4, 1.8, 0, { shadow: false });
  mullions(gf, M, -8, 4, 1.8, 2.8, 3.5);
  mullions(gf, M, -3.5, 3.5, 1.8, 2.8, 4, 1.75, 'z');
  box(gf, M.woodLight, 11.8, 0.02, 6.8, -2, 0.41, 0, { shadow: false }).receiveShadow = true;
  box(gf, M.warm, 10, 0.04, 0.3, -2, 3.17, 0.4, { shadow: false });
  place(gf, F.livingSet(M), -3, 0.42, 1.0);
  place(gf, F.kitchen(M, 3.2), 1.6, 0.42, -2.95);
  place(gf, F.diningSet(M, 3), 1.6, 0.42, 1.6);
  place(gf, F.bookshelf(M, 1.8, 2.2), -7.8, 0.42, 1.8, Math.PI / 2);
  place(gf, F.artFrame(M, 1.6, 1.0), -3, 2.0, -3.26);
  place(gf, F.plant(M, 1.6), 3.4, 0.42, 2.8);

  // --- Segundo piso en voladizo: estudio + dormitorio + terraza lateral
  const up = add();
  box(up, M.concrete, 17.2, 0.3, 7.5, 0.4, 3.35, 0);
  box(up, M.accent, 17.2, 0.05, 0.05, 0.4, 3.18, 3.77, { shadow: false });  // línea de luz bajo el voladizo
  box(up, M.white, 15.6, 0.35, 8, 1.5, 6.6, 0);
  box(up, M.white, 0.3, 3, 7.5, -6, 5.0, 0);
  box(up, M.white, 0.3, 3, 7.5, 9, 5.0, 0);
  box(up, M.white, 15, 3, 0.3, 1.5, 5.0, -3.6);
  box(up, M.glass, 14.4, 2.9, 0.03, 1.5, 4.95, 3.7, { shadow: false });
  mullions(up, M, -5.8, 8.8, 4.95, 2.9, 3.7, 2);
  if (slats) for (let x = 4.2; x <= 8.6; x += 0.32) box(up, M.wood, 0.08, 2.9, 0.12, x, 4.95, 3.86);
  box(up, M.woodLight, 14.8, 0.02, 7.3, 1.5, 3.51, 0, { shadow: false }).receiveShadow = true;
  box(up, M.warm, 13, 0.04, 0.4, 1.5, 6.4, 0, { shadow: false });
  place(up, F.officeRow(M, 3, 2), -1.2, 3.52, -1.4);
  place(up, F.bed(M), 6.6, 3.52, -1.8);
  place(up, F.floorLamp(M), 5.2, 3.52, -2.8);
  place(up, F.bookshelf(M, 1.6, 2), 3, 3.52, -3.27);
  place(up, F.plant(M), -5.2, 3.52, 2.8);
  // terraza lateral sobre el primer piso
  box(up, M.glass, 0.03, 1.0, 7.4, -8.15, 4.0, 0, { shadow: false });
  box(up, M.glass, 2.2, 1.0, 0.03, -7.1, 4.0, 3.7, { shadow: false });
  place(up, planter(M, 1.8, 0.6, 0.45), -7.1, 3.5, 2.7);
  place(up, F.cafeTable(M), -7.1, 3.5, -0.2, Math.PI / 2);
  // columnas esbeltas bajo el voladizo y auto en la cochera
  for (const x of [6.6, 8.7]) for (const z of [-3.4, 3.4]) cyl(up, M.metal, 0.09, 0.09, 2.8, x, 1.8, z, 8);
  // azotea: parapeto, deck y pérgola
  for (const [w, d, x, z] of [[15.6, 0.15, 1.5, 3.93], [15.6, 0.15, 1.5, -3.93], [0.15, 8, -6.23, 0], [0.15, 8, 9.23, 0]]) box(up, M.white, w, 0.45, d, x, 7.0, z);
  box(up, M.wood, 6, 0.06, 4, 4.8, 6.81, 0.6);
  for (const x of [2, 7.6]) for (const z of [-1.2, 2.4]) box(up, M.metal, 0.1, 2.3, 0.1, x, 7.95, z);
  for (let x = 2; x <= 7.6; x += 0.4) box(up, M.wood, 0.08, 0.12, 3.8, x, 9.1, 0.6);
  place(up, planter(M, 3, 0.7, 0.5), -2.2, 6.78, 3.2);

  // --- Piscina, deck y tumbonas
  const outdoor = add();
  if (pool) {
    box(outdoor, M.concrete, 8.6, 0.12, 3.6, -5.5, 0.46, 6.0);
    box(outdoor, M.water, 8.0, 0.1, 3.0, -5.5, 0.53, 6.0, { shadow: false }).receiveShadow = true;
  }
  box(outdoor, M.wood, 3.6, 0.1, 3.6, 2.2, 0.45, 6.0);
  place(outdoor, F.lounger(M), 1.2, 0.5, 6.0);
  place(outdoor, F.lounger(M, M.fabricSand), 2.6, 0.5, 6.0);
  place(outdoor, umbrella(M, M.fabricWarm), 3.6, 0.5, 5.0);
  if (!pool) place(outdoor, F.livingSet(M), -5.5, 0.4, 6.0);

  // --- Vegetación
  const green = add();
  const T = beach ? (s, v) => palm(M, s * 1.1, v) : (s, v) => tree(M, s, v);
  [[-13, 4, 1.0, 3], [-12.5, -9.6, 1.1, 2], [12.5, -9.8, 1.0, 0], [13, 4.5, 1, 1], [-13.2, -3, 0.9, 1], [13, -3.5, 0.9, 4]]
    .forEach(([x, z, s, v]) => place(green, T(s, v), x, 0.04, z));

  // --- Personas, autos
  const extras = new THREE.Group(); extras.userData.dynamic = true;
  parked(extras, 0.3, 7.6, 0.4, 0, -Math.PI / 2);
  live({ group: extras, update() {} });
  live(traffic([{ z: 13.4, dir: 1, speed: 6, n: 2, len: 64 }, { z: 16.6, dir: -1, speed: 5, n: 1, len: 64 }], 3));
  live(crowd({
    walkers: [
      { path: [[-24, 10.0], [24, 10.0]], speed: 1.25, y: 0.15 },
      { path: [[24, 19.0], [-24, 19.0]], speed: 1.05, y: 0.15 },
      { path: [[-5.5, 2.7], [-0.3, 2.7]], speed: 0.8, y: 0.42 },
      { path: [[-4.5, 1.6], [7.5, 1.6]], speed: 0.75, y: 3.52, offset: 0.4 },
      { path: [[-9.4, 3.85], [-0.6, 3.85]], speed: 0.9, y: 0.4 },
      { path: [[-10, -10], [10, -10]], speed: 0.7, y: 0.04 },
    ],
    sitters: [
      { x: -3.2, y: 3.52, z: -0.8, ry: Math.PI }, { x: -1.2, y: 3.52, z: -0.8, ry: Math.PI }, { x: 0.8, y: 3.52, z: -0.8, ry: Math.PI },
      { x: 0.9, y: 0.42, z: 2.22, ry: Math.PI, talk: true }, { x: 2.3, y: 0.42, z: 0.98, ry: 0, talk: true },
    ],
    idlers: [
      { x: 2.0, y: 0.5, z: 7.4, ry: Math.PI / 2 }, { x: 3.0, y: 0.5, z: 7.4, ry: -Math.PI / 2, act: 'look' },
      { x: 2.2, y: 0.42, z: -2.25, ry: Math.PI, act: 'look' },
    ],
    liers: [{ x: 1.2, y: 0.92, z: 6.85, ry: 0 }],
  }, 3));

  return finish({ focus: 13, site: 19, height: 9 });
}

/* ===================================================================== */
/*  Casa con techo a dos aguas (urbana o de campo con caballos)          */
/* ===================================================================== */

export function gableHouse(M, { long = false, wall = 'white' } = {}) {
  const { add, live, finish } = kit();
  const W = long ? 14 : 9, D = 7, H = 3.2, P = 0.3;   // P = altura del zócalo
  const wm = M[wall] || M.white;

  // --- Terreno
  const site = add();
  disc(site, M.grass, long ? 24 : 18, 0.04, 0.04);
  if (long) {
    box(site, M.sand, 52, 0.03, 3, 0, 0.055, 12).receiveShadow = true;                  // camino de tierra
    box(site, M.sand, 3, 0.03, 8, -2, 0.055, 7.2).receiveShadow = true;
    // corral con establo
    site.add(fence(M, [[12, -9], [24, -9], [24, 6], [12, 6], [12, -1]]));
    box(site, M.sand, 11.6, 0.02, 14.6, 18, 0.05, -1.5).receiveShadow = true;
    const barn = new THREE.Group();
    box(barn, M.wood, 6, 2.8, 4, 0, 1.4, 0);
    const r1 = box(barn, M.roof, 6.6, 0.15, 2.7, 0, 3.3, -1.0); r1.rotation.x = 0.55;
    const r2 = box(barn, M.roof, 6.6, 0.15, 2.7, 0, 3.3, 1.0); r2.rotation.x = -0.55;
    box(barn, M.woodLight, 1.6, 2.1, 0.06, 0, 1.05, 2.02);
    place(site, barn, 20, 0.04, -12.5);
    for (const [x, z] of [[14, -7.5], [14, 4.5]]) { box(site, M.wood, 1.6, 0.4, 0.5, x, 0.24, z); box(site, M.water, 1.4, 0.05, 0.35, x, 0.42, z, { shadow: false }); }
  } else {
    site.add(street(M, { z: D / 2 + 9.5, len: 60, width: 6.5, walk: 2.2 }));
    for (const x of [-12, 8]) place(site, streetLamp(M), x, 0.15, D / 2 + 5.9, -Math.PI / 2);
    site.add(fence(M, [[-W / 2 - 4, D / 2 + 3.7], [-1, D / 2 + 3.7]], 0.9, M.white));
    site.add(fence(M, [[1, D / 2 + 3.7], [5.4, D / 2 + 3.7]], 0.9, M.white));
  }
  // camino de piedras y estacionamiento
  for (let z = D / 2 + 3.0; z < D / 2 + 3.8; z += 0.7) box(site, M.stone, 1.0, 0.06, 0.5, 0, 0.07, z);
  box(site, M.paving, 2.8, 0.05, 7.6, W / 2 + 2.6, 0.065, 0.3).receiveShadow = true;

  // --- Zócalo, muros y vidrio
  const body = add();
  box(body, M.concrete, W + 0.6, P, D + 0.6, 0, P / 2, 0);
  box(body, wm, W, H, 0.25, 0, P + H / 2, -D / 2);
  box(body, wm, 0.25, H, D, -W / 2, P + H / 2, 0);
  box(body, wm, 0.25, H, D, W / 2, P + H / 2, 0);
  box(body, M.glass, W - 0.5, H - 0.2, 0.03, 0, P + H / 2, D / 2, { shadow: false });
  mullions(body, M, -W / 2, W / 2, P + H / 2, H, D / 2, 1.6);
  box(body, M.wood, 1.1, 2.3, 0.08, 0, P + 1.15, D / 2 + 0.02);
  for (const sx of [-1, 1]) box(body, M.glass, 0.03, 1.4, 2.2, sx * (W / 2 + 0.13), P + 1.8, -0.5, { shadow: false });
  box(body, M.woodLight, W - 0.4, 0.02, D - 0.4, 0, P + 0.01, 0, { shadow: false }).receiveShadow = true;
  box(body, M.warm, W - 1, 0.04, 0.3, 0, P + H - 0.08, 0, { shadow: false });
  // porche de madera con escalones
  box(body, M.wood, W, 0.12, 2.4, 0, P + 0.05, D / 2 + 1.5);
  box(body, M.wood, 1.6, 0.15, 0.4, 0, 0.14, D / 2 + 2.9);
  for (const sx of [-1, 1]) cyl(body, M.wood, 0.08, 0.08, H, sx * (W / 2 - 0.2), P + H / 2, D / 2 + 2.5, 6);
  place(body, F.lounger(M, M.fabricSand), -W / 2 + 1, P + 0.11, D / 2 + 1.5, Math.PI / 2);

  // --- Interior
  const inside = add();
  const y0 = P + 0.02;
  place(inside, F.livingSet(M), -W / 4, y0, 0.6);
  place(inside, F.kitchen(M, 2.8), W / 4, y0, -3.0);
  place(inside, F.diningSet(M, 2), W / 4, y0, 1.6);
  place(inside, F.mediaWall(M, 2), -W / 4, y0, -3.1);
  if (long) { place(inside, F.bed(M), -W / 2 + 1.4, y0, -1.6); place(inside, F.bookshelf(M), -W / 2 + 0.3, y0, 1.8, Math.PI / 2); }

  // --- Techo a dos aguas con alero, hastial vidriado y chimenea
  const roofG = add();
  const half = D / 2 + 0.7, rise = 2.5, slope = Math.hypot(half, rise), ang = Math.atan2(rise, half);
  for (const s of [-1, 1]) {
    const r = box(roofG, M.roof, W + 1.2, 0.2, slope, 0, P + H + rise / 2, (s * half) / 2);
    r.rotation.x = s * ang;
    const f = box(roofG, M.wood, W + 1.22, 0.24, 0.12, 0, P + H + 0.02, s * half);
    f.rotation.x = s * ang;
  }
  const tri = new THREE.Shape();
  tri.moveTo(-D / 2, 0); tri.lineTo(D / 2, 0); tri.lineTo(0, rise - 0.1); tri.closePath();
  const triGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.2, bevelEnabled: false });
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(triGeo.clone(), s < 0 ? wm : M.glass);
    m.rotation.y = Math.PI / 2; m.position.set(s * (W / 2) - 0.1, P + H, 0);
    m.castShadow = s < 0; m.receiveShadow = true; roofG.add(m);
  }
  box(roofG, M.brick, 0.7, 2.2, 0.7, -W / 4, P + H + 1.6, -1.2);
  box(roofG, M.concreteDark, 0.85, 0.1, 0.85, -W / 4, P + H + 2.75, -1.2);

  // --- Vegetación
  const green = add();
  const trees = long
    ? [[-W / 2 - 3, 3, 1.1, 3], [-W / 2 - 4, -5, 1.3, 2], [4, -8, 1.2, 4], [-3, -8.5, 1, 0], [26.5, 3, 1.1, 0], [-12, 8, 0.9, 1]]
    : [[-W / 2 - 3, 3, 1.1, 3], [-W / 2 - 3.5, -4.5, 1.3, 2], [W / 2 + 3.4, -5.5, 1.1, 0], [1.5, -7.5, 1, 4]];
  trees.forEach(([x, z, s, v]) => place(green, tree(M, s, v), x, 0.04, z));
  for (const x of [-W / 2 + 0.5, W / 2 - 0.5]) place(green, planter(M, 1.4, 0.6, 0.4, M.wood), x, 0.04, D / 2 + 3.0);

  // --- Vida
  const extras = new THREE.Group(); extras.userData.dynamic = true;
  parked(extras, long ? 0.6 : 0.15, W / 2 + 2.6, 0.09, 1.0, -Math.PI / 2);
  live({ group: extras, update() {} });
  const walkers = [{ path: [[-W / 2 + 1.0, 2.85], [W / 2 - 1.0, 2.85]], speed: 0.6, y: y0 }];
  if (long) walkers.push({ path: [[-22, 12], [8, 12]], speed: 1.0, y: 0.07 });
  else {
    walkers.push({ path: [[-22, D / 2 + 5.0], [22, D / 2 + 5.0]], speed: 1.1, y: 0.15 });
    walkers.push({ path: [[22, D / 2 + 13.8], [-22, D / 2 + 13.8]], speed: 0.95, y: 0.15 });
    live(traffic([{ z: D / 2 + 8.0, dir: 1, speed: 5.5, n: 1, len: 60 }, { z: D / 2 + 11.0, dir: -1, speed: 6.5, n: 2, len: 60 }], 5));
  }
  live(crowd({
    walkers,
    sitters: [{ x: W / 4 - 0.35, y: y0, z: 2.22, ry: Math.PI, talk: true }],
    idlers: [{ x: -W / 4 + 1.6, y: y0, z: 2.0, ry: 2.5 }, { x: 0.8, y: P + 0.11, z: D / 2 + 1.6, ry: Math.PI, act: 'phone' }],
    liers: [],
  }, long ? 7 : 5));
  if (long) live(herd([[16, -4, 0.6], [19.5, 1.5, 2.4], [21, -6, -1.2]], 0.2));

  return finish({ focus: long ? 15 : 10.5, site: long ? 24 : 18, height: 7 });
}

/* ===================================================================== */
/*  Pabellón / café (playa, plaza o jardín)                              */
/* ===================================================================== */

export function pavilion(M, { ground = 'grass', beach = false } = {}) {
  const { add, live, finish } = kit();
  const floor = beach || ground === 'sand' ? M.sand : ground === 'paving' ? M.paving : M.grass;

  // --- Terreno
  const site = add();
  disc(site, floor, 22, 0.04, 0.04);
  if (beach) {
    box(site, M.water, 70, 0.06, 30, 0, 0.03, -26.5, { shadow: false }).receiveShadow = true;
    for (let x = -30; x < 30; x += 1.6) box(site, M.white, 1.2, 0.02, 0.18, x, 0.07, -11.4 + Math.sin(x) * 0.25, { shadow: false });
  } else if (ground === 'paving') {
    site.add(street(M, { z: 14, len: 60, width: 6.5, walk: 2.2 }));
    for (let x = -18; x <= 18; x += 3) box(site, M.pavingDark, 0.06, 0.01, 20, x, 0.045, 0, { shadow: false });
  } else {
    box(site, M.paving, 2.2, 0.03, 8, 0, 0.055, 9.5).receiveShadow = true;
  }

  // --- Deck
  const deck = add();
  box(deck, M.wood, 16, 0.2, 11, 0, 0.1, 0);
  box(deck, M.wood, 3, 0.1, 0.5, 0, 0.05, 5.75);

  // --- Estructura: techo fino con canto de luz, columnas, caja de vidrio
  const struct = add();
  box(struct, M.white, 16.5, 0.3, 11.5, 0, 3.75, 0);
  box(struct, M.accent, 16.5, 0.05, 0.05, 0, 3.58, 5.76, { shadow: false });
  for (let x = -7.8; x <= 7.8; x += 0.5) box(struct, M.woodLight, 0.06, 0.16, 11.3, x, 3.52, 0, { shadow: false });
  for (const x of [-7.6, -2.5, 2.5, 7.6]) for (const z of [-5.2, 5.2]) cyl(struct, M.metal, 0.08, 0.08, 3.5, x, 1.95, z, 8);
  box(struct, M.glass, 9, 3.4, 0.03, 0, 1.9, 2.5, { shadow: false });
  box(struct, M.glass, 9, 3.4, 0.03, 0, 1.9, -2.5, { shadow: false });
  box(struct, M.glass, 0.03, 3.4, 5, -4.5, 1.9, 0, { shadow: false });
  box(struct, M.glass, 0.03, 3.4, 5, 4.5, 1.9, 0, { shadow: false });
  mullions(struct, M, -4.5, 4.5, 1.9, 3.4, 2.5, 1.5);
  box(struct, M.warm, 8, 0.04, 4, 0, 3.58, 0, { shadow: false });
  // guirnalda de luces al frente
  for (let i = 0; i <= 40; i++) {
    const x = -7.6 + (15.2 * i) / 40, sag = Math.sin((i / 40) * Math.PI * 3) ** 2;
    box(struct, M.lamp, 0.07, 0.07, 0.07, x, 3.25 - sag * 0.35, 5.35, { shadow: false });
  }

  // --- Interior y terraza
  const interior = add();
  place(interior, F.cafeBar(M, 4), 0, 0.2, -1.2);
  place(interior, F.plant(M, 1.5), -3.8, 0.2, -1.9);
  place(interior, F.plant(M, 1.2), 3.8, 0.2, 1.9);
  place(interior, F.cafeTable(M), -2.6, 0.2, 1.2);
  place(interior, F.cafeTable(M), 2.4, 0.2, 1.2);
  const tables = [[-6.6, -3.4], [-6.6, 0], [-6.6, 3.4], [6.6, -3.4], [6.6, 0], [6.6, 3.4]];
  tables.forEach(([x, z]) => place(interior, F.cafeTable(M), x, 0.2, z));
  for (const x of [-5, 5]) place(interior, planter(M, 3, 0.6, 0.5, M.wood), x, 0.2, -4.9);
  if (beach) {
    for (const x of [-6, -2.5, 2.5, 6]) {
      place(interior, F.lounger(M, x > 0 ? M.fabricSand : M.white), x, 0.04, 11.5);
      if (x < 0) place(interior, umbrella(M, x < -4 ? M.fabricWarm : M.fabricSand), x + 1.4, 0.04, 10.5);
    }
  } else {
    for (const x of [-5.5, 5.5]) place(interior, bench(M), x, 0.04, 8.0);
    for (const x of [-9.5, 9.5]) place(interior, bollard(M), x, 0.04, 6.2);
  }

  // --- Vegetación
  const green = add();
  const tr = (x, z, s, v) => place(green, beach ? palm(M, s, v) : tree(M, s, v), x, 0.04, z);
  tr(-11, 7, 1.1, 3); tr(11, -7, 1.2, 0); tr(11.5, 6.5, 1, 2); tr(-11, -7, 1, 4); tr(-14, 0, 0.9, 1); tr(14, 0.5, 0.9, 1);

  // --- Vida
  const sitters = [];
  tables.forEach(([x, z], i) => {
    if (i % 3 !== 1) sitters.push({ x, y: 0.2, z: z + 0.62, ry: Math.PI, talk: true });
    if (i % 2 === 0) sitters.push({ x, y: 0.2, z: z - 0.62, ry: 0, talk: true });
  });
  sitters.push({ x: -2.6, y: 0.2, z: 1.82, ry: Math.PI, talk: true }, { x: 2.4, y: 0.2, z: 0.58, ry: 0, talk: true });
  const walkers = [
    { path: [[-5.4, -3.2], [5.4, -3.2], [5.4, 3.2], [-5.4, 3.2]], speed: 0.6, y: 0.2 },
    { path: [[-15, 9.2], [15, 9.2]], speed: 1.1, y: 0.04 },
    { path: [[15, -9.6], [-15, -9.6]], speed: 0.9, y: 0.04 },
  ];
  if (ground === 'paving') {
    walkers[1].path = [[-24, 10.4], [24, 10.4]]; walkers[1].y = 0.15;
    live(traffic([{ z: 12.4, dir: 1, speed: 6, n: 2, len: 60 }, { z: 15.6, dir: -1, speed: 5, n: 1, len: 60 }], 9));
  }
  const liers = beach ? [{ x: -6, y: 0.46, z: 12.35, ry: 0 }, { x: 2.5, y: 0.46, z: 12.35, ry: 0 }] : [];
  live(crowd({
    walkers, sitters, liers,
    idlers: [{ x: 0.6, y: 0.2, z: -1.85, ry: 0, act: 'look' }, { x: 1.0, y: 0.2, z: -0.3, ry: Math.PI, act: 'phone' }],
  }, beach ? 11 : 9));

  return finish({ focus: 11.5, site: 22, height: 5 });
}

/* ===================================================================== */
/*  Local comercial entre medianeras, con calle y tránsito               */
/* ===================================================================== */

export function storefront(M, { wall = 'concreteDark', floors = 2, warmSign = true } = {}) {
  const { add, live, finish } = kit();
  const W = 11, D = 8, H1 = 3.6, Hn = 3.1, F0 = 0.2;
  const wm = M[wall] || M.concreteDark;
  const SZ = D / 2 + 6;   // eje de la calle

  // --- Terreno, calle, faroles, árboles de la vereda de enfrente
  const site = add();
  disc(site, M.paving, 22, 0.04, 0.04);
  site.add(street(M, { z: SZ, len: 60, width: 7, walk: 2.4, crossAt: 9 }));
  for (const x of [-9, 9]) place(site, streetLamp(M), x, 0.15, SZ - 3.8, -Math.PI / 2);
  for (const x of [-13, -4, 5, 14]) place(site, tree(M, 0.8, 1), x, 0.15, SZ + 5.4);

  // --- Vecinos (contexto urbano)
  const nb = add();
  const neighbor = (x, w, n, mat, seed) => {
    const h = 3.4 + n * 3;
    box(nb, mat, w, h, D + 1, x, h / 2, -0.5);
    box(nb, M.metal, w - 0.6, 2.6, 0.05, x, 1.5, D / 2 + 0.01);                      // persiana
    for (let f = 0; f < n; f++) for (let k = 0; k < Math.max(1, Math.floor(w / 2.6)); k++) {
      const cols = Math.max(1, Math.floor(w / 2.6)), wx = x - w / 2 + (w / cols) * (k + 0.5);
      box(nb, M.glassDark, 1.2, 1.4, 0.05, wx, 3.4 + f * 3 + 1.6, D / 2 + 0.01, { shadow: false });
    }
    box(nb, M.white, w, 0.3, D + 1.2, x, h + 0.15, -0.5);
    cyl(nb, M.tank, 0.55, 0.55, 1.1, x + (seed % 2 ? 1 : -1) * (w / 2 - 1.2), h + 0.85, -1.5, 10);
  };
  neighbor(-W / 2 - 0.1 - 3.5, 7, 3, M.plaster, 1);
  neighbor(-W / 2 - 7.1 - 3.5, 7, 1, M.terracotta, 2);
  neighbor(W / 2 + 0.1 + 4.5, 9, 2, M.white, 3);
  neighbor(W / 2 + 9.1 + 3, 6, 3, M.concreteDark, 4);

  // --- Planta baja: tienda vidriada con marquesina y letrero
  const ground = add();
  box(ground, wm, 0.4, H1, D, -W / 2, H1 / 2, 0);
  box(ground, wm, 0.4, H1, D, W / 2, H1 / 2, 0);
  box(ground, wm, W, H1, 0.3, 0, H1 / 2, -D / 2);
  box(ground, M.concrete, W - 0.4, F0, D - 0.3, 0, F0 / 2, 0);
  box(ground, M.glass, W - 0.6, H1 - 0.4, 0.03, 0, (H1 - 0.4) / 2, D / 2, { shadow: false });
  mullions(ground, M, -W / 2, W / 2, (H1 - 0.4) / 2, H1 - 0.4, D / 2, 2.2);
  box(ground, M.metal, W + 0.8, 0.15, 1.8, 0, H1 - 0.1, D / 2 + 0.9);
  box(ground, M.accent, W + 0.8, 0.04, 0.04, 0, H1 - 0.2, D / 2 + 1.8, { shadow: false });
  box(ground, M.metal, 4.8, 0.8, 0.12, 0, H1 + 0.4, D / 2 + 0.06);
  box(ground, warmSign ? M.sign : M.lilacGlow, 4.5, 0.55, 0.04, 0, H1 + 0.4, D / 2 + 0.13, { shadow: false });
  box(ground, M.woodLight, W - 0.8, 0.02, D - 0.6, 0, F0 + 0.01, 0, { shadow: false }).receiveShadow = true;
  place(ground, F.counter(M, 3.4), 2, F0, -2.4);
  place(ground, F.workstation(M), -3, F0, -2.2);
  place(ground, F.sofa(M, 2), -2.8, F0, 1.6, Math.PI);
  place(ground, F.bookshelf(M, 2.4, 2.4), 2.0, F0, -3.65);
  place(ground, F.plant(M, 1.4), 4.6, F0, 2.8);
  place(ground, F.plant(M, 1.1), -4.6, F0, 2.8);
  box(ground, M.warm, W - 1.2, 0.04, 0.3, 0, H1 - 0.45, 0, { shadow: false });
  for (const x of [-3.5, 3.5]) place(ground, planter(M, 1.6, 0.5, 0.45), x, 0.15, D / 2 + 0.25);

  // --- Pisos altos: vivienda con balcones, celosía, aire acondicionado y tanque
  const upper = add();
  for (let i = 0; i < floors; i++) {
    const y = H1 + i * Hn + Hn / 2;
    box(upper, wm, W, Hn, D, 0, y, 0);
    box(upper, M.glass, W - 1.4, 1.9, 0.03, 0, y + 0.1, D / 2 + 0.01, { shadow: false });
    box(upper, M.warm, W - 1.6, 1.7, 0.02, 0, y + 0.1, D / 2 - 0.05, { shadow: false });
    for (let x = -W / 2 + 1.2; x < W / 2 - 1; x += 0.55) box(upper, M.wood, 0.1, Hn - 0.4, 0.12, x, y, D / 2 + 0.2);
    box(upper, M.concrete, W - 1, 0.15, 1.2, 0, y - Hn / 2 + 0.07, D / 2 + 0.6);
    box(upper, M.glass, W - 1, 1.0, 0.03, 0, y - Hn / 2 + 0.6, D / 2 + 1.18, { shadow: false });
    box(upper, M.white, 0.9, 0.55, 0.4, W / 2 - 0.9, y - 0.6, D / 2 + 0.35);
  }
  const top = H1 + floors * Hn;
  box(upper, M.white, W + 0.4, 0.3, D + 0.4, 0, top + 0.15, 0);
  for (const [w, d, x, z] of [[W + 0.4, 0.15, 0, D / 2 + 0.12], [W + 0.4, 0.15, 0, -D / 2 - 0.12]]) box(upper, M.white, w, 0.6, d, x, top + 0.6, z);
  cyl(upper, M.tank, 0.6, 0.6, 1.2, -W / 2 + 1.5, top + 0.9, -2, 12);
  box(upper, M.metal, 1.6, 0.2, 1.6, -W / 2 + 1.5, top + 0.3, -2);
  for (let i = 0; i < 3; i++) { const p = box(upper, M.solar, 1.6, 0.05, 1, 1 + i * 1.8, top + 0.6, -1.5); p.rotation.x = -0.35; }

  // --- Vida
  live(traffic([{ z: SZ - 1.75, dir: 1, speed: 6, n: 2, len: 60 }, { z: SZ + 1.75, dir: -1, speed: 5, n: 2, len: 60 }], warmSign ? 13 : 17));
  live(crowd({
    walkers: [
      { path: [[-24, D / 2 + 0.95], [24, D / 2 + 0.95]], speed: 1.2, y: 0.15 },
      { path: [[24, D / 2 + 1.8], [-24, D / 2 + 1.8]], speed: 1.0, y: 0.15, offset: 0.5 },
      { path: [[-4, 0.4], [3.6, 0.4]], speed: 0.6, y: F0 },
      { path: [[24, SZ + 4.0], [-24, SZ + 4.0]], speed: 1.1, y: 0.15 },
    ],
    sitters: [{ x: -3, y: F0, z: -1.6, ry: Math.PI }],
    idlers: [{ x: 2, y: F0, z: -3.1, ry: 0 }, { x: 1.4, y: F0, z: -1.5, ry: Math.PI, act: 'phone' }, { x: -7.6, y: 0.15, z: D / 2 + 0.3, ry: 0.4, act: 'look' }],
  }, warmSign ? 13 : 17));

  return finish({ focus: 12, site: 22, height: H1 + floors * Hn + 1.5 });
}
