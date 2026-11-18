import * as THREE from 'three';
import { box, cyl, disc, place } from '../core/materials.js';
import { bake } from '../core/bake.js';
import * as F from './furniture.js';
import { crowd } from './people.js';
import { tree, planter } from './site.js';

/*
 * Mini escenas para las tarjetas de servicios.
 * Devuelven { group, update, focus, site, height, actors } igual que los edificios.
 */

function finish(group, statics, dyn, extra) {
  statics.forEach(bake);
  return { group, update: t => dyn.forEach(d => d.update(t)), actors: dyn.filter(d => d.spec).map(d => d.spec), ...extra };
}

/** 01 · Diseño: estudio con mesa de planos, maqueta que se arma en líneas y equipo trabajando. */
export function designScene(M) {
  const group = new THREE.Group();
  const st = new THREE.Group(); group.add(st);
  disc(st, M.woodLight, 8, 0.08, 0.08);
  box(st, M.white, 9, 3.2, 0.2, 0, 1.68, -4.2);
  box(st, M.glass, 4, 2, 0.03, 1.5, 1.9, -4.08, { shadow: false });
  place(st, F.bookshelf(M, 2.2, 2.4), -3, 0.08, -3.9);
  place(st, F.artFrame(M, 1.1, 0.8, M.fabricSand), -0.6, 2.1, -4.08);

  // Mesa grande con planos extendidos, rollos y lámpara
  const table = F.desk(M, 3.4, 1.8); place(st, table, 0, 0.08, 0);
  box(st, M.white, 2.6, 0.01, 1.4, -0.2, 0.875, 0, { shadow: false });
  for (let i = 0; i < 7; i++) box(st, M.metal, 2.2, 0.004, 0.012, -0.2, 0.882, -0.55 + i * 0.18, { shadow: false });
  for (let i = 0; i < 4; i++) box(st, M.metal, 0.012, 0.004, 1.2, -1.2 + i * 0.65, 0.882, 0, { shadow: false });
  for (let i = 0; i < 3; i++) { const r = cyl(st, i % 2 ? M.fabricSand : M.white, 0.05, 0.05, 0.9, 1.35, 0.92, -0.5 + i * 0.12, 8); r.rotation.x = Math.PI / 2; }
  place(st, F.floorLamp(M), -2.4, 0.08, -1.2);
  place(st, F.plant(M, 1.4), 3.5, 0.08, -3.6);
  place(st, F.workstation(M), 2.8, 0.08, 1.4, -Math.PI / 2);

  // Maqueta en líneas (torre escalonada) que gira sobre la mesa
  const lines = new THREE.Group(); lines.position.set(0.9, 0.88, 0);
  let y = 0;
  for (const [w, h, d] of [[0.9, 0.35, 0.7], [0.75, 0.35, 0.6], [0.6, 0.35, 0.5], [0.42, 0.35, 0.36]]) {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), M.line);
    l.position.y = y + h / 2; lines.add(l); y += h;
  }
  box(lines, M.white, 0.9, 0.04, 0.7, 0, 0.02, 0);
  group.add(lines);

  const people = crowd({
    idlers: [{ x: -0.9, y: 0.08, z: 1.35, ry: Math.PI - 0.3 }, { x: 0.6, y: 0.08, z: 1.45, ry: Math.PI + 0.4, act: 'look' }],
    sitters: [{ x: 2.2, y: 0.08, z: 1.4, ry: Math.PI / 2 }],
    walkers: [{ path: [[-3.8, -2.6], [3.8, -2.6]], speed: 0.5, y: 0.08 }],
  }, 4);
  group.add(people.group);
  const spin = { update: t => { lines.rotation.y = t * 0.4; } };
  return finish(group, [st], [people, spin], { focus: 4.6, site: 8, height: 2.5 });
}

/** 02 · Ejecución: obra en curso con grúa, andamio, mezcladora y obreros con casco. */
export function buildScene(M) {
  const group = new THREE.Group();
  const st = new THREE.Group(); group.add(st);
  disc(st, M.sand, 15, 0.05, 0.05);

  // Estructura a medio construir
  const X = [-3, 0, 3], Z = [-2, 1];
  for (let f = 0; f < 3; f++) {
    for (const x of X) for (const z of Z) box(st, M.concrete, 0.3, 2.7, 0.3, x, f * 3 + 1.35, z);
    if (f < 2) box(st, M.concrete, 6.6, 0.25, 3.6, 0, f * 3 + 2.85, -0.5);
  }
  for (const x of X) for (const z of Z) for (let k = 0; k < 4; k++) box(st, M.metal, 0.02, 1.2, 0.02, x - 0.1 + (k % 2) * 0.2, 8.7, z - 0.1 + (k >> 1) * 0.2, { shadow: false });
  box(st, M.brick, 6, 1.4, 0.2, 0, 0.7, -2.2);                               // muro de ladrillo a medias
  box(st, M.brick, 3.2, 2.4, 0.2, -1.4, 4.35, -2.2);
  // Andamio
  for (let x = -3.4; x <= 3.4; x += 1.7) cyl(st, M.metal, 0.03, 0.03, 6, x, 3.05, 1.65, 5);
  for (let yy = 2; yy < 6; yy += 2) box(st, M.wood, 7, 0.06, 0.5, 0, yy, 1.85);
  // Mezcladora, pallets y cerco
  const mixer = new THREE.Group();
  cyl(mixer, M.terracotta, 0.45, 0.6, 1, 0, 1.0, 0, 10).rotation.z = 0.5;
  box(mixer, M.metal, 1.2, 0.1, 0.8, 0, 0.45, 0);
  for (const x of [-0.5, 0.5]) cyl(mixer, M.metal, 0.2, 0.2, 0.1, x, 0.25, 0.42, 8).rotation.x = Math.PI / 2;
  place(st, mixer, 5.3, 0.05, -2.5);
  for (let i = 0; i < 3; i++) box(st, M.brick, 1.1, 0.5, 1.1, -4.6, 0.3 + i * 0.5, -3.6 + (i % 2) * 0.05);
  for (let i = 0; i < 3; i++) box(st, M.wood, 2.4, 0.12, 1, 5.4, 0.12 + i * 0.13, 2.4);
  for (let x = -7; x <= 7; x += 2.33) box(st, M.white, 2.2, 1.8, 0.06, x, 0.95, -5.6);

  // Grúa torre
  const crane = new THREE.Group();
  const yellow = new THREE.MeshStandardMaterial({ color: 0xf2b84b, roughness: 0.6 });
  for (const [x, z] of [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]]) box(crane, yellow, 0.07, 11, 0.07, x, 5.5, z);
  for (let yy = 0.6; yy < 11; yy += 1) {
    box(crane, yellow, 0.6, 0.04, 0.04, 0, yy, -0.28, { shadow: false }); box(crane, yellow, 0.6, 0.04, 0.04, 0, yy, 0.28, { shadow: false });
    box(crane, yellow, 0.04, 0.04, 0.6, -0.28, yy, 0, { shadow: false }); box(crane, yellow, 0.04, 0.04, 0.6, 0.28, yy, 0, { shadow: false });
  }
  box(crane, M.concreteDark, 1.4, 0.4, 1.4, 0, 0.2, 0);
  crane.position.set(-6.2, 0.05, -2.8);
  st.add(crane);
  const jib = new THREE.Group(); jib.position.set(-6.2, 11.25, -2.8); group.add(jib);
  box(jib, yellow, 10, 0.35, 0.35, 2.5, 0, 0);
  box(jib, M.concreteDark, 1.2, 0.8, 0.8, -2.2, -0.2, 0);
  box(jib, yellow, 0.8, 0.8, 0.8, 0, 0.5, 0);
  box(jib, M.metal, 0.03, 4, 0.03, 6, -2, 0, { shadow: false });
  box(jib, M.wood, 1.4, 0.2, 0.7, 6, -4.1, 0);

  const people = crowd({
    walkers: [
      { path: [[-6, 4.2], [6.5, 4.2]], speed: 0.9, y: 0.05 },
      { path: [[-2.4, 0.3], [2.4, 0.3]], speed: 0.6, y: 3.0 },
    ],
    idlers: [
      { x: 4.0, y: 0.05, z: -2.5, ry: Math.PI / 2, act: 'work' },
      { x: -1.5, y: 0.05, z: -1.4, ry: Math.PI, act: 'work' },
      { x: 4.6, y: 0.05, z: 3.4, ry: -0.8, act: 'look' },
      { x: 1.2, y: 2.03, z: 1.85, ry: Math.PI, act: 'work' },
    ],
  }, 8, { hat: 'hardhat' });
  group.add(people.group);
  const swing = { update: t => { jib.rotation.y = Math.sin(t * 0.3) * 0.6; } };
  return finish(group, [st], [people, swing], { focus: 8, site: 15, height: 9 });
}

/** 03 · Interiores: sala-comedor en corte con cocina, luz cálida y personas. */
export function interiorScene(M) {
  const group = new THREE.Group();
  const st = new THREE.Group(); group.add(st);
  disc(st, M.ground, 9, 0.02, 0.02);
  box(st, M.woodLight, 9, 0.1, 7, 0, 0.07, 0).receiveShadow = true;
  box(st, M.plaster, 9, 3.2, 0.2, 0, 1.72, -3.5);
  box(st, M.plaster, 0.2, 3.2, 7, -4.5, 1.72, 0);
  box(st, M.glass, 3, 1.8, 0.03, 1.5, 1.9, -3.39, { shadow: false });
  box(st, M.wood, 2.2, 0.06, 0.3, -2.8, 1.72, -3.3);
  for (let i = 0; i < 5; i++) box(st, i % 2 ? M.book : M.pot, 0.12, 0.25, 0.18, -3.6 + i * 0.35, 1.88, -3.3, { shadow: false });
  place(st, F.artFrame(M, 1.4, 0.9, M.fabricWarm), -4.38, 1.9, -0.6, Math.PI / 2);
  place(st, F.livingSet(M), -2.0, 0.12, -0.6, Math.PI);
  place(st, F.mediaWall(M, 2), -2.0, 0.12, -3.2);
  place(st, F.kitchen(M, 2.6), 2.6, 0.12, -3.0);
  place(st, F.diningSet(M, 2), 2.4, 0.12, 1.4);
  place(st, F.plant(M, 1.6), -3.9, 0.12, 2.8);
  place(st, F.plant(M, 1.1), 4.0, 0.12, -1.0);
  place(st, F.floorLamp(M), -3.9, 0.12, 1.4);
  place(st, F.rug(M, 2.6, 1.8), 2.4, 0.12, 1.4);

  const people = crowd({
    walkers: [{ path: [[-3.0, 2.75], [3.5, 2.75]], speed: 0.55, y: 0.12 }],
    sitters: [{ x: 2.05, y: 0.12, z: 2.02, ry: Math.PI, talk: true }, { x: 2.75, y: 0.12, z: 0.78, ry: 0, talk: true }],
    idlers: [{ x: 2.4, y: 0.12, z: -2.3, ry: Math.PI, act: 'look' }],
  }, 12);
  group.add(people.group);
  return finish(group, [st], [people], { focus: 4.8, site: 9, height: 3 });
}
