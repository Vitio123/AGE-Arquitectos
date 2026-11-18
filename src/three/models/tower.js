import * as THREE from 'three';
import { box, cyl, disc, place } from '../core/materials.js';
import { bake } from '../core/bake.js';
import * as F from './furniture.js';
import { crowd } from './people.js';
import { tree, hedge, planter, bench, streetLamp, street, traffic } from './site.js';

/*
 * Torre de oficinas para la sección "Del plano a la obra".
 *
 * Cada elemento animable es un Group (ya horneado) con userData:
 *   stage → 'concepto' | 'estructura' | 'envolvente' | 'interior'
 *   floor → nivel (0 = lobby) para escalonar la aparición
 *   mode  → 'lines'  líneas del plano que suben desde el piso
 *           'grow'   crece en altura desde el piso del nivel
 *           'drop'   baja desde arriba a su lugar
 *           'pop'    aparece con un pequeño rebote
 *           'toggle' aparece de golpe a mitad de su etapa
 *           'temp'   sólo existe durante la obra (grúa, cerco, obreros)
 *   base  → posición y final
 */

const LOBBY_H = 4.2, H = 3.4, B = 0.3;   // alturas: lobby, pisos tipo, zócalo
const X = [-9.75, -3.25, 3.25, 9.75], Z = [-6.5, 0, 6.5];
const HW = 10.95, HD = 7.6;              // medio ancho / medio fondo de losa
const SET = 4.45;                        // el último piso termina en x = SET (terraza al este)
const CORE = { x0: HW, x1: HW + 4, z0: -5, z1: 1 };

export const levelY = f => (f === 0 ? B : B + LOBBY_H + (f - 1) * H);
const levelH = f => (f === 0 ? LOBBY_H : H);

/* ---------- utilidades ---------- */

function segLines(segs, mat) {
  const pts = [];
  for (const [a, b] of segs) pts.push(new THREE.Vector3(...a), new THREE.Vector3(...b));
  return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat);
}

/** Aristas de una caja con el origen en su base. */
function edgeBox(w, h, d, x, z, mat) {
  const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
  g.translate(x, h / 2, z);
  return new THREE.LineSegments(g, mat);
}

function circle(r, x, z, y, mat) {
  const pts = [];
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; pts.push(new THREE.Vector3(x + Math.cos(a) * r, y, z + Math.sin(a) * r)); }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
}

/** Letras de píxeles (3×5) hechas con cajas, mirando a +z. */
const GLYPHS = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  G: ['###', '#..', '#.#', '#.#', '###'],
  E: ['###', '#..', '##.', '#..', '###'],
};
function pixelText(parent, mat, text, cell, x0, y0, z) {
  [...text].forEach((ch, li) => GLYPHS[ch].forEach((row, r) => [...row].forEach((c, k) => {
    if (c === '#') box(parent, mat, cell * 0.92, cell * 0.92, 0.12, x0 + (li * 4 + k) * cell, y0 + (4 - r) * cell, z, { shadow: false });
  })));
}

/* ---------- torre ---------- */

export function officeTower(M, { floors = 6 } = {}) {
  const group = new THREE.Group();
  const items = [];
  const top = floors;                         // último nivel (retranqueado)
  const height = levelY(top) + H;

  const item = (stage, floor, mode, y = 0) => {
    const g = new THREE.Group();
    g.position.y = y;
    g.userData = { stage, floor, mode, base: y };
    group.add(g); items.push(g);
    return g;
  };

  /* ===== Base permanente: plaza, calle, zócalo ===== */
  const plaza = new THREE.Group(); group.add(plaza);
  disc(plaza, M.plaza, 32, 0.04, 0.04);
  for (let v = -28; v <= 28; v += 2.4) {
    box(plaza, M.plazaJoint, 0.05, 0.005, 56, v, 0.043, 0, { shadow: false });
    box(plaza, M.plazaJoint, 56, 0.005, 0.05, 0, 0.043, v, { shadow: false });
  }
  plaza.add(street(M, { z: 17, len: 76, width: 7, walk: 2.6, crossAt: 0 }));
  bake(plaza);

  /* ===== 01 Concepto: plano en el piso + volúmenes en líneas ===== */
  const plan = item('concepto', 0, 'plan', 0.07);
  const ax = [];
  for (const x of X) ax.push([[x, 0, -HD - 4], [x, 0, HD + 4]]);
  for (const z of Z) ax.push([[-HW - 4, 0, z], [HW + 8, 0, z]]);
  plan.add(segLines(ax, M.lineSoft));
  X.forEach(x => plan.add(circle(0.7, x, -HD - 4.7, 0, M.lineSoft)));
  Z.forEach(z => plan.add(circle(0.7, HW + 8.7, z, 0, M.lineSoft)));
  const planSegs = [];
  const rect = (x0, z0, x1, z1) => planSegs.push([[x0, 0, z0], [x1, 0, z0]], [[x1, 0, z0], [x1, 0, z1]], [[x1, 0, z1], [x0, 0, z1]], [[x0, 0, z1], [x0, 0, z0]]);
  rect(-HW, -HD, HW, HD);
  rect(CORE.x0, CORE.z0, CORE.x1, CORE.z1);
  rect(3.6, -7.2, 10.5, -1.2);                                               // sala de reuniones
  for (const x of X) for (const z of Z) rect(x - 0.3, z - 0.3, x + 0.3, z + 0.3);
  rect(-6, HD, 6, HD + 1.8);
  plan.add(segLines(planSegs, M.line));

  for (let f = 0; f <= top; f++) {
    const g = item('concepto', f, 'lines', levelY(f));
    const x1 = f === top ? SET : HW;
    g.add(edgeBox(x1 + HW, levelH(f), HD * 2, (x1 - HW) / 2, 0, M.line));
    g.add(edgeBox(CORE.x1 - CORE.x0, levelH(f), CORE.z1 - CORE.z0, (CORE.x0 + CORE.x1) / 2, (CORE.z0 + CORE.z1) / 2, M.lineSoft));
  }

  /* ===== 02 Estructura: zócalo, columnas, núcleo y losas ===== */
  const plinth = item('estructura', 0, 'grow', 0);
  box(plinth, M.concrete, HW * 2, B, HD * 2, 0, B / 2, 0);                     // zócalo
  box(plinth, M.concrete, 12, B, 1.8, 0, B / 2, HD + 0.9);                     // terraza de acceso
  box(plinth, M.concrete, 12, B * 0.5, 0.3, 0, B * 0.25, HD + 1.95);           // escalón
  box(plinth, M.concrete, CORE.x1 - CORE.x0, B, CORE.z1 - CORE.z0, (CORE.x0 + CORE.x1) / 2, B / 2, (CORE.z0 + CORE.z1) / 2);
  for (let f = 0; f <= top; f++) {
    const y0 = levelY(f), h = levelH(f);
    const cols = item('estructura', f, 'grow', y0);
    for (const x of X) for (const z of Z) {
      if (f === top && x > SET) continue;
      cyl(cols, M.concrete, 0.3, 0.3, h - 0.3, x, (h - 0.3) / 2, z, 10);
    }
    // núcleo de concreto con ranuras de vidrio
    const cx = (CORE.x0 + CORE.x1) / 2, cz = (CORE.z0 + CORE.z1) / 2;
    box(cols, M.concreteDark, CORE.x1 - CORE.x0, h, CORE.z1 - CORE.z0, cx, h / 2, cz);
    box(cols, M.glassDark, 0.5, h - 0.8, 0.04, cx - 1, h / 2, CORE.z1 + 0.01, { shadow: false });
    box(cols, M.glassDark, 0.04, h - 0.8, 0.5, CORE.x1 + 0.01, h / 2, cz, { shadow: false });

    const slab = item('estructura', f, 'drop', y0 + h - 0.3);
    const x1 = f === top ? SET : HW;
    box(slab, M.concrete, x1 + HW, 0.3, HD * 2, (x1 - HW) / 2, 0.15, 0);
  }
  // remate del núcleo (sala de máquinas)
  const coreTop = item('estructura', top, 'grow', levelY(top) + H);
  box(coreTop, M.concreteDark, CORE.x1 - CORE.x0, 2.6, CORE.z1 - CORE.z0, (CORE.x0 + CORE.x1) / 2, 1.3, (CORE.z0 + CORE.z1) / 2);

  /* ===== Obra (sólo durante estructura y envolvente) ===== */
  const works = item('estructura', 0, 'temp', 0);
  works.userData.temp = true;
  // cerco de obra
  for (const [w, d, x, z] of [[34, 0.1, 0, 10.6], [34, 0.1, 0, -11.5], [0.1, 22.1, -17, -0.45], [0.1, 22.1, 17, -0.45]]) box(works, M.white, w, 2.2, d, x, 1.14, z);
  box(works, M.accent, 34, 0.06, 0.12, 0, 2.2, 10.65, { shadow: false });
  // materiales apilados
  for (let i = 0; i < 4; i++) box(works, M.wood, 2.2, 0.25, 1.2, -14.5, 0.17 + i * 0.27, -8 + (i % 2) * 0.1);
  for (let i = 0; i < 6; i++) cyl(works, M.metal, 0.05, 0.05, 3.5, -15, 0.1 + i * 0.1, -4, 6).rotation.z = Math.PI / 2;
  // grúa torre
  const crane = new THREE.Group(); crane.position.set(15, 0.04, 8); works.add(crane);
  const yellow = new THREE.MeshStandardMaterial({ color: 0xf2b84b, roughness: 0.6 });
  const mastH = height + 6;
  for (const [x, z] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) box(crane, yellow, 0.12, mastH, 0.12, x, mastH / 2, z);
  for (let y = 1; y < mastH; y += 1.6) for (const [w, d, x, z] of [[1, 0.06, 0, -0.45], [1, 0.06, 0, 0.45], [0.06, 1, -0.45, 0], [0.06, 1, 0.45, 0]]) box(crane, yellow, w, 0.06, d, x, y, z, { shadow: false });
  box(crane, M.concreteDark, 2.4, 0.6, 2.4, 0, 0.3, 0);
  const jib = new THREE.Group(); jib.position.y = mastH; jib.userData.dynamic = true; crane.add(jib);
  box(jib, yellow, 26, 0.5, 0.6, 7, 0.25, 0);
  box(jib, yellow, 1.4, 1.2, 1.2, 0, 0.9, 0);
  box(jib, M.concreteDark, 2, 1.2, 1.2, -5, -0.3, 0);
  box(jib, M.metal, 0.04, 9, 0.04, 16, -4.5, 0, { shadow: false });
  box(jib, M.wood, 2.4, 0.3, 1, 16, -9.1, 0);

  /* ===== 03 Envolvente ===== */
  for (let f = 0; f <= top; f++) {
    const y0 = levelY(f), h = levelH(f) - 0.3;
    const env = item('envolvente', f, 'grow', y0);
    const x1 = f === top ? SET : HW;
    const gx0 = -HW + 0.4, gx1 = x1 - 0.4, gz = HD - 0.4;
    const cxm = (gx0 + gx1) / 2, wl = gx1 - gx0;

    if (f === 0) {
      // Lobby: vidrio retranqueado, puerta y marquesina
      box(env, M.glass, wl, h, 0.03, cxm, h / 2, gz - 1.2, { shadow: false });
      box(env, M.glass, wl, h, 0.03, cxm, h / 2, -gz, { shadow: false });
      box(env, M.glass, 0.03, h, gz * 2, gx0, h / 2, 0, { shadow: false });
      for (let x = gx0 + 2; x < gx1; x += 2) box(env, M.metal, 0.06, h, 0.1, x, h / 2, gz - 1.2);
      box(env, M.metal, 2.4, 2.6, 0.12, 0, 1.3, gz - 1.18);
      box(env, M.glassDark, 2.1, 2.4, 0.02, 0, 1.25, gz - 1.1, { shadow: false });
      box(env, M.white, 9, 0.25, 3.4, 0, h + 0.05, HD + 0.9);
      box(env, M.accent, 9, 0.04, 0.05, 0, h - 0.1, HD + 2.6, { shadow: false });
      continue;
    }

    // Muro cortina en las 4 caras
    box(env, M.glass, wl, h, 0.03, cxm, h / 2, gz, { shadow: false });
    box(env, M.glass, wl, h, 0.03, cxm, h / 2, -gz, { shadow: false });
    box(env, M.glass, 0.03, h, gz * 2, gx0, h / 2, 0, { shadow: false });
    box(env, M.glass, 0.03, h, gz * 2, gx1, h / 2, 0, { shadow: false });
    // Antepecho oscuro y canto de losa claro (ritmo horizontal)
    for (const z of [gz + 0.02, -gz - 0.02]) box(env, M.glassDark, wl, 0.85, 0.03, cxm, 0.42, z, { shadow: false });
    for (const x of [gx0 - 0.02, gx1 + 0.02]) box(env, M.glassDark, 0.03, 0.85, gz * 2, x, 0.42, 0, { shadow: false });
    box(env, M.white, x1 + HW + 0.1, 0.32, 0.12, (x1 - HW) / 2, h + 0.15, HD + 0.02);
    // Aletas de bronce que giran: forman una ola en la fachada sur
    let i = 0;
    for (let x = gx0 + 0.6; x < gx1 - 0.3; x += 1.15, i++) {
      const fin = box(env, M.bronze, 0.07, h, 0.55, x, h / 2, gz + 0.45);
      fin.rotation.y = 0.75 * Math.sin(f * 0.55 + i * 0.32);
    }
    // Fachada oeste: aletas más espaciadas
    i = 0;
    for (let z = -gz + 0.8; z < gz - 0.3; z += 1.6, i++) {
      const fin = box(env, M.bronze, 0.55, h, 0.07, gx0 - 0.45, h / 2, z);
      fin.rotation.y = 0.6 * Math.sin(f * 0.7 + i * 0.5);
    }
    // Balcones en pisos pares (oeste)
    if (f % 2 === 0 && f !== top) {
      box(env, M.concrete, 2.2, 0.22, 7, -HW - 1.1, -0.11, 0);
      box(env, M.glass, 0.03, 1.0, 7, -HW - 2.18, 0.5, 0, { shadow: false });
      place(env, planter(M, 6, 0.5, 0.45), -HW - 0.6, 0, 0, Math.PI / 2);
    }
  }

  // Azotea: parapeto, paneles solares, máquinas, corona de luz y letrero AGE en el núcleo
  const roof = item('envolvente', top, 'drop', levelY(top) + H);
  for (const [w, d, x, z] of [[SET + HW, 0.2, (SET - HW) / 2, HD], [SET + HW, 0.2, (SET - HW) / 2, -HD], [0.2, HD * 2, -HW, 0], [0.2, HD * 2, SET, 0]]) box(roof, M.white, w, 0.9, d, x, 0.45, z);
  box(roof, M.accent, SET + HW, 0.05, 0.05, (SET - HW) / 2, 0.92, HD + 0.08, { shadow: false });
  for (let x = -9; x < 1.5; x += 2.2) for (const z of [-4.5, -1.8]) { const p = box(roof, M.solar, 1.8, 0.05, 1.2, x, 0.6, z); p.rotation.x = -0.4; }
  for (const [x, z] of [[-6, 3.5], [-2.5, 3.5]]) { box(roof, M.white, 2, 1.2, 1.6, x, 0.6, z); cyl(roof, M.metal, 0.5, 0.5, 0.1, x, 1.25, z, 12); }
  const coreSign = item('envolvente', top, 'drop', levelY(top) + H);
  pixelText(coreSign, M.sign, 'AGE', 0.3, CORE.x0 + 0.3, 0.7, CORE.z1 + 0.08);

  // Terraza del último piso (sobre el nivel top-1, al este): deck, pérgola y maceteros
  const terrace = item('envolvente', top, 'drop', levelY(top));
  box(terrace, M.wood, HW - SET - 0.6, 0.06, HD * 2 - 1, (HW + SET) / 2, 0.03, 0);
  box(terrace, M.glass, 0.03, 1.1, HD * 2, HW - 0.05, 0.55, 0, { shadow: false });
  for (const z of [-HD + 0.1, HD - 0.1]) box(terrace, M.glass, HW - SET, 1.1, 0.03, (HW + SET) / 2, 0.55, z, { shadow: false });
  for (const z of [-4, 4]) for (const x of [SET + 1, HW - 1]) box(terrace, M.metal, 0.1, 2.6, 0.1, x, 1.3, z);
  for (let z = -4; z <= 4; z += 0.45) box(terrace, M.wood, HW - SET - 1.6, 0.12, 0.08, (HW + SET) / 2, 2.62, z);
  place(terrace, planter(M, 5, 0.6, 0.5), (HW + SET) / 2, 0.06, -HD + 0.8);

  /* ===== 04 Interiores ===== */
  for (let f = 0; f <= top; f++) {
    const y0 = levelY(f) + 0.01;
    const inn = item('interior', f, 'pop', y0);
    const x1 = f === top ? SET : HW;
    box(inn, M.warm, x1 + HW - 2, 0.04, 0.35, (x1 - HW) / 2, levelH(f) - 0.33, -3.2, { shadow: false });
    box(inn, M.warm, x1 + HW - 2, 0.04, 0.35, (x1 - HW) / 2, levelH(f) - 0.33, 3.2, { shadow: false });

    if (f === 0) {
      place(inn, F.counter(M, 4), 0, 0, -3);
      place(inn, F.bookshelf(M, 3.2, 2.4), 0, 0, -4.4);
      place(inn, F.livingSet(M), -6, 0, 1.5);
      place(inn, F.livingSet(M), 6, 0, 1.5);
      for (const x of [-9.4, 9.4]) place(inn, F.plant(M, 2.2), x, 0, 5.4);
      place(inn, F.artFrame(M, 3, 1.6), -6, 2.4, -7.0);
      continue;
    }
    // Oficina abierta (oeste) + sala según el piso (este)
    place(inn, F.officeRow(M, 4, 1.8), -5, 0, -3.2);
    place(inn, F.officeRow(M, 4, 1.8), -5, 0, 3.2, Math.PI);
    place(inn, F.plant(M, 1.4), -9.6, 0, 1.2);
    if (f === top) { place(inn, F.meetingTable(M, 3), 0, 0, -4.5); continue; }
    const kind = f % 3;
    if (kind === 0) place(inn, F.meetingTable(M, 3), 6.5, 0, -3.5);
    else if (kind === 1) place(inn, F.kitchen(M, 3.2), 6.5, 0, -6.6);
    else { place(inn, F.diningSet(M, 4), 6.5, 0, -3.5); place(inn, F.bookshelf(M, 3, 2.2), 6.5, 0, -6.95); }
    if (kind !== 1) {
      box(inn, M.glass, 6.9, 2.8, 0.03, 7.05, 1.4, -1.2, { shadow: false });
      box(inn, M.glass, 0.03, 2.8, 6, 3.6, 1.4, -4.2, { shadow: false });
    }
    place(inn, F.livingSet(M), 6.5, 0, 4.2);
  }

  /* ===== Paisaje (aparece con los interiores) ===== */
  const land = item('interior', 0, 'toggle', 0);
  for (const [x0, x1, z0, z1] of [[-24, -13.5, -8, 7], [17.5, 25, -9, 5]]) {
    box(land, M.concrete, x1 - x0, 0.3, z1 - z0, (x0 + x1) / 2, 0.15, (z0 + z1) / 2);
    box(land, M.grass, x1 - x0 - 0.3, 0.05, z1 - z0 - 0.3, (x0 + x1) / 2, 0.31, (z0 + z1) / 2);
  }
  [[-17.5, -5, 1.2, 2], [-19.5, 2.5, 1.1, 3], [-16, 4.5, 0.9, 1], [-21.5, -2, 1, 0], [21, -5.5, 1.2, 3], [21.5, 1.5, 1.1, 2], [23, -1.5, 0.9, 1]]
    .forEach(([x, z, s, v]) => place(land, tree(M, s, v), x, 0.3, z));
  place(land, hedge(M, 9.4, 0.7, 0.6), -18.75, 0.3, 6.3);
  for (const z of [-3, 3]) place(land, bench(M), -13.0, 0.04, z, Math.PI / 2);
  for (const x of [-8.5, 8.5]) place(land, planter(M, 3, 0.8, 0.55), x, 0.04, 8.5);
  for (const x of [-22, -8, 8, 22]) place(land, streetLamp(M), x, 0.15, 13.25, -Math.PI / 2);
  for (const x of [-20, -7, 6, 19]) place(land, tree(M, 0.9, 1), x, 0.15, 23.1);

  items.forEach(it => { if (it.userData.mode !== 'lines' && it.userData.mode !== 'plan') bake(it); });

  /* ===== Personas y tránsito ===== */
  const cars = traffic([{ z: 15.25, dir: 1, speed: 7, n: 3, len: 76 }, { z: 18.75, dir: -1, speed: 6, n: 2, len: 76 }], 21);
  group.add(cars.group);

  // Obreros con casco durante la obra
  const workers = crowd({
    walkers: [
      { path: [[-9, 10.2], [9, 10.2]], speed: 0.8, y: 0.04 },
      { path: [[-12.2, -9], [-12.2, 8]], speed: 0.7, y: 0.04 },
      { path: [[-8, 1.2], [8, 1.2]], speed: 0.6, y: levelY(2) + 0.01 },
    ],
    idlers: [
      { x: 14, y: 0.04, z: -8, ry: -Math.PI / 2, act: 'work' },
      { x: 12.5, y: 0.04, z: 5.5, ry: -2.3, act: 'look' },
      { x: 2, y: levelY(3) + 0.01, z: 1.5, ry: 0.3, act: 'work' },
    ],
  }, 31, { hat: 'hardhat' });
  const wItem = item('estructura', 0, 'temp', 0);
  wItem.userData.temp = true;
  wItem.add(workers.group);

  // Oficinistas, visitantes y peatones
  const sitters = [];
  for (let f = 1; f <= top; f++) {
    [-7.7, -5.9, -4.1, -2.3].forEach((x, i) => {
      if ((f + i) % 3 !== 0) sitters.push({ x, y: levelY(f) + 0.01, z: -2.6, ry: Math.PI });
      if ((f + i) % 2 === 0) sitters.push({ x, y: levelY(f) + 0.01, z: 2.6, ry: 0 });
    });
    if (f % 3 === 0 && f !== top) sitters.push({ x: 5.7, y: levelY(f) + 0.01, z: -2.72, ry: Math.PI, talk: true }, { x: 7.3, y: levelY(f) + 0.01, z: -4.28, ry: 0, talk: true });
  }
  const people = crowd({
    walkers: [
      { path: [[-30, 12.0], [30, 12.0]], speed: 1.25, y: 0.15 },
      { path: [[30, 12.6], [-30, 12.6]], speed: 1.05, y: 0.15, offset: 0.3 },
      { path: [[30, 21.6], [-30, 21.6]], speed: 1.1, y: 0.15 },
      { path: [[-24, 10.35], [-6.5, 10.35]], speed: 0.9, y: 0.04 },
      { path: [[-12.2, -10], [-12.2, 9.4]], speed: 0.8, y: 0.04, offset: 0.5 },
      { path: [[0, 5.2], [0, -1.8]], speed: 0.7, y: B + 0.01 },
      { path: [[-8, 1.2], [8, 1.2]], speed: 0.7, y: levelY(2) + 0.01 },
      { path: [[8, 1.2], [-8, 1.2]], speed: 0.6, y: levelY(4) + 0.01, offset: 0.4 },
    ],
    sitters: [...sitters, { x: -13.0, y: 0.04, z: -3.3, ry: Math.PI / 2 }, { x: -13.0, y: 0.04, z: 3.4, ry: Math.PI / 2, talk: true }],
    idlers: [
      { x: 0.8, y: B + 0.01, z: -3.7, ry: 0 },
      { x: 5.0, y: levelY(1) + 0.01, z: 2.0, ry: Math.PI / 2 }, { x: 5.9, y: levelY(1) + 0.01, z: 2.1, ry: -Math.PI / 2, act: 'phone' },
      { x: 8.2, y: levelY(top) + 0.06, z: 2.5, ry: -1.2, act: 'look' },
      { x: 3.6, y: 0.15, z: 11.1, ry: 0.4, act: 'phone' },
    ],
  }, 21);
  const pItem = item('interior', 0, 'toggle', 0);
  pItem.add(people.group);

  const update = t => {
    jib.rotation.y = Math.sin(t * 0.18) * 0.9 + 0.6;
    cars.update(t);
    if (wItem.visible) workers.update(t);
    if (pItem.visible) people.update(t);
  };

  return { group, items, update, height, actors: [workers.spec, people.spec] };
}
