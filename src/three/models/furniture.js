import * as THREE from 'three';
import { box, cyl } from '../core/materials.js';

/*
 * Mobiliario low-poly en escala real (metros).
 * Cada función devuelve un THREE.Group apoyado en y = 0.
 */

export function desk(M, w = 1.4, d = 0.7) {
  const g = new THREE.Group();
  box(g, M.woodLight, w, 0.05, d, 0, 0.74, 0);
  for (const sx of [-1, 1]) box(g, M.metal, 0.05, 0.72, d * 0.9, sx * (w / 2 - 0.05), 0.36, 0);
  return g;
}

export function chair(M, mat = M.fabric) {
  const g = new THREE.Group();
  box(g, mat, 0.46, 0.08, 0.46, 0, 0.46, 0);           // asiento
  box(g, mat, 0.46, 0.5, 0.07, 0, 0.75, -0.2);          // respaldo
  cyl(g, M.metal, 0.03, 0.03, 0.42, 0, 0.21, 0, 6);     // pata central
  box(g, M.metal, 0.5, 0.03, 0.06, 0, 0.02, 0);         // base en cruz
  box(g, M.metal, 0.06, 0.03, 0.5, 0, 0.02, 0);
  return g;
}

export function computer(M) {
  const g = new THREE.Group();
  box(g, M.metal, 0.6, 0.36, 0.03, 0, 0.32, 0);         // marco del monitor
  box(g, M.screen, 0.56, 0.32, 0.01, 0, 0.32, 0.017, { shadow: false });
  box(g, M.metal, 0.05, 0.14, 0.05, 0, 0.07, -0.02);    // soporte
  box(g, M.metal, 0.22, 0.015, 0.16, 0, 0.008, -0.02);
  box(g, M.concreteDark, 0.42, 0.015, 0.13, 0, 0.008, 0.22); // teclado
  return g;
}

/** Escritorio + silla + computadora. Mira hacia +z (la persona se sienta en +z). */
export function workstation(M) {
  const g = new THREE.Group();
  g.add(desk(M));
  const pc = computer(M); pc.position.set(0, 0.765, -0.12); g.add(pc);
  const c = chair(M); c.position.set(0, 0, 0.6); c.rotation.y = Math.PI; g.add(c);
  return g;
}

export function sofa(M, w = 2.2, mat = M.fabricWarm) {
  const g = new THREE.Group();
  box(g, mat, w, 0.42, 0.9, 0, 0.21, 0);
  box(g, mat, w, 0.45, 0.22, 0, 0.6, -0.34);
  for (const sx of [-1, 1]) box(g, mat, 0.2, 0.32, 0.9, sx * (w / 2 - 0.1), 0.55, 0);
  return g;
}

export function coffeeTable(M) {
  const g = new THREE.Group();
  box(g, M.wood, 1.1, 0.06, 0.6, 0, 0.4, 0);
  for (const [x, z] of [[-.48, -.24], [.48, -.24], [-.48, .24], [.48, .24]]) box(g, M.metal, 0.04, 0.38, 0.04, x, 0.19, z);
  return g;
}

export function rug(M, w = 2.6, d = 1.8) {
  const g = new THREE.Group();
  box(g, M.rug, w, 0.015, d, 0, 0.008, 0, { shadow: false }).receiveShadow = true;
  return g;
}

export function plant(M, h = 1.2) {
  const g = new THREE.Group();
  cyl(g, M.pot, 0.2, 0.15, 0.35, 0, 0.175, 0, 8);
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(h * 0.35, 0), M.leaf);
  leaves.position.y = 0.35 + h * 0.35; leaves.scale.y = 1.4; leaves.castShadow = true;
  g.add(leaves);
  return g;
}

export function floorLamp(M) {
  const g = new THREE.Group();
  cyl(g, M.metal, 0.015, 0.015, 1.5, 0, 0.75, 0, 6);
  cyl(g, M.metal, 0.16, 0.16, 0.02, 0, 0.01, 0, 10);
  const shade = cyl(g, M.lamp, 0.12, 0.2, 0.25, 0, 1.55, 0, 10);
  shade.castShadow = false;
  return g;
}

export function bed(M) {
  const g = new THREE.Group();
  box(g, M.wood, 1.7, 0.3, 2.1, 0, 0.15, 0);
  box(g, M.white, 1.6, 0.18, 2.0, 0, 0.39, 0.02);
  box(g, M.fabric, 1.62, 0.06, 1.2, 0, 0.5, 0.42);
  box(g, M.wood, 1.7, 0.9, 0.08, 0, 0.45, -1.06);
  return g;
}

/** Mesa redonda de café con 2 sillas. */
export function cafeTable(M) {
  const g = new THREE.Group();
  cyl(g, M.white, 0.38, 0.38, 0.04, 0, 0.75, 0, 14);
  cyl(g, M.metal, 0.03, 0.03, 0.73, 0, 0.37, 0, 6);
  cyl(g, M.metal, 0.22, 0.22, 0.02, 0, 0.01, 0, 10);
  for (const a of [0, Math.PI]) {
    const c = new THREE.Group();
    box(c, M.woodLight, 0.4, 0.05, 0.4, 0, 0.45, 0);
    box(c, M.woodLight, 0.4, 0.4, 0.04, 0, 0.67, -0.19);
    for (const [x, z] of [[-.17, -.17], [.17, -.17], [-.17, .17], [.17, .17]]) box(c, M.metal, 0.03, 0.44, 0.03, x, 0.22, z);
    c.position.set(Math.sin(a) * 0.62, 0, Math.cos(a) * 0.62);
    c.rotation.y = a + Math.PI;
    g.add(c);
  }
  return g;
}

export function counter(M, w = 3) {
  const g = new THREE.Group();
  box(g, M.wood, w, 1.0, 0.6, 0, 0.5, 0);
  box(g, M.white, w + 0.1, 0.05, 0.7, 0, 1.02, 0);
  return g;
}

/** Sala de oficina: N puestos en fila. */
export function officeRow(M, n = 3, gap = 1.8) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const ws = workstation(M);
    ws.position.x = (i - (n - 1) / 2) * gap;
    g.add(ws);
  }
  return g;
}

/** Sala de estar: sofá, mesa, alfombra, lámpara y planta. */
export function livingSet(M) {
  const g = new THREE.Group();
  g.add(rug(M));
  const s = sofa(M); s.position.z = -0.8; g.add(s);
  const t = coffeeTable(M); t.position.z = 0.2; g.add(t);
  const l = floorLamp(M); l.position.set(1.5, 0, -0.9); g.add(l);
  const p = plant(M); p.position.set(-1.6, 0, -0.9); g.add(p);
  return g;
}

/** Tumbona; respaldo hacia -z. Superficie a 0.42 m. */
export function lounger(M, mat = M.white) {
  const g = new THREE.Group();
  box(g, M.wood, 0.72, 0.3, 1.95, 0, 0.15, 0);
  box(g, mat, 0.68, 0.1, 1.3, 0, 0.36, 0.3);
  const back = box(g, mat, 0.68, 0.1, 0.7, 0, 0.52, -0.62);
  back.rotation.x = 0.55;
  return g;
}

/** Mesa de comedor con N sillas por lado (eje largo en x). */
export function diningSet(M, n = 3) {
  const g = new THREE.Group();
  const w = n * 0.7 + 0.4;
  box(g, M.woodLight, w, 0.05, 0.95, 0, 0.75, 0);
  for (const sx of [-1, 1]) box(g, M.metal, 0.06, 0.72, 0.8, sx * (w / 2 - 0.15), 0.36, 0);
  for (let i = 0; i < n; i++) for (const sz of [-1, 1]) {
    const c = new THREE.Group();
    box(c, M.wood, 0.42, 0.05, 0.42, 0, 0.47, 0);
    box(c, M.wood, 0.42, 0.42, 0.04, 0, 0.7, -0.2);
    for (const [x, z] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) box(c, M.metal, 0.03, 0.46, 0.03, x, 0.23, z);
    c.position.set((i - (n - 1) / 2) * 0.7, 0, sz * 0.62);
    c.rotation.y = sz > 0 ? Math.PI : 0;
    g.add(c);
  }
  cyl(g, M.lamp, 0.22, 0.22, 0.05, 0, 2.2, 0, 10).castShadow = false;
  return g;
}

/** Cocina en línea (muebles bajos + altos) a lo largo de x, de espaldas a -z, con isla. */
export function kitchen(M, w = 3.2) {
  const g = new THREE.Group();
  box(g, M.white, w, 0.88, 0.6, 0, 0.44, 0);
  box(g, M.concreteDark, w + 0.02, 0.04, 0.62, 0, 0.9, 0);
  box(g, M.white, w, 0.7, 0.35, 0, 1.85, -0.12);
  box(g, M.metal, 0.6, 0.02, 0.4, w / 4, 0.93, 0);
  box(g, M.metal, 0.5, 0.02, 0.4, -w / 4, 0.93, 0);
  box(g, M.woodLight, w * 0.6, 0.92, 0.9, 0, 0.46, 1.5);                // isla
  box(g, M.white, w * 0.6 + 0.1, 0.04, 1.0, 0, 0.94, 1.5);
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 0.6;
    cyl(g, M.metal, 0.02, 0.02, 0.75, x, 0.37, 2.25, 5);
    cyl(g, M.wood, 0.18, 0.18, 0.05, x, 0.76, 2.25, 8);
  }
  for (const x of [-0.5, 0.5]) cyl(g, M.lamp, 0.12, 0.16, 0.18, x, 2.0, 1.5, 8).castShadow = false;
  return g;
}

/** Sala de reuniones: mesa larga con sillas de oficina. */
export function meetingTable(M, n = 3) {
  const g = new THREE.Group();
  const w = n * 0.8 + 0.4;
  box(g, M.white, w, 0.05, 1.1, 0, 0.75, 0);
  box(g, M.metal, w * 0.6, 0.7, 0.25, 0, 0.37, 0);
  for (let i = 0; i < n; i++) for (const sz of [-1, 1]) {
    const c = chair(M, M.fabric);
    c.position.set((i - (n - 1) / 2) * 0.8, 0, sz * 0.78);
    c.rotation.y = sz > 0 ? Math.PI : 0;
    g.add(c);
  }
  return g;
}

export function bookshelf(M, w = 1.6, h = 2) {
  const g = new THREE.Group();
  box(g, M.wood, w, h, 0.35, 0, h / 2, 0);
  const rows = Math.floor(h / 0.4);
  for (let r = 0; r < rows; r++) {
    const y = 0.25 + r * 0.4;
    let x = -w / 2 + 0.12;
    while (x < w / 2 - 0.2) {
      const bw = 0.05 + ((x * 31 + r * 7) % 1 + 1) % 1 * 0.07, bh = 0.22 + ((x * 17) % 1 + 1) % 1 * 0.1;
      box(g, (r + Math.round(x * 10)) % 3 ? M.book : M.fabricSand, bw, bh, 0.22, x + bw / 2, y + bh / 2, 0.1, { shadow: false });
      x += bw + 0.015;
    }
  }
  return g;
}

/** Cuadro en la pared (mirando a +z). */
export function artFrame(M, w = 1.2, h = 0.8, mat = M.fabricWarm) {
  const g = new THREE.Group();
  box(g, M.metal, w, h, 0.04, 0, 0, 0, { shadow: false });
  box(g, mat, w - 0.12, h - 0.12, 0.02, 0, 0, 0.025, { shadow: false });
  return g;
}

/** Escalera recta de un piso (sube hacia +z). */
export function stairs(M, rise = 3.2, run = 4.2, w = 1.1, mat = M.concrete) {
  const g = new THREE.Group();
  const n = Math.round(rise / 0.18), h = rise / n, d = run / n;
  for (let i = 0; i < n; i++) box(g, mat, w, h, d, 0, h * (i + 0.5), d * (i + 0.5));
  box(g, M.metal, 0.04, 0.9, run, w / 2, rise / 2 + 0.45, run / 2).rotation.x = -Math.atan2(rise, run);
  return g;
}

/** TV sobre mueble bajo (mirando a +z). */
export function mediaWall(M, w = 2.2) {
  const g = new THREE.Group();
  box(g, M.wood, w, 0.45, 0.42, 0, 0.225, 0);
  box(g, M.metal, 1.4, 0.8, 0.05, 0, 1.25, -0.1);
  box(g, M.screen, 1.32, 0.72, 0.01, 0, 1.25, -0.07, { shadow: false });
  return g;
}

/** Barra/mostrador de café con máquina y vitrina. */
export function cafeBar(M, w = 4) {
  const g = counter(M, w);
  box(g, M.metal, 0.5, 0.45, 0.4, -w / 2 + 0.6, 1.27, -0.05);
  box(g, M.glass, 1.2, 0.4, 0.5, w / 2 - 0.9, 1.25, 0, { shadow: false });
  box(g, M.wood, w, 1.4, 0.3, 0, 1.9, -1.1);                       // repisa trasera
  for (let x = -w / 2 + 0.3; x < w / 2 - 0.2; x += 0.25) box(g, M.white, 0.1, 0.14, 0.1, x, 1.85, -1.0, { shadow: false });
  box(g, M.metal, 1.6, 0.8, 0.04, 0, 2.95, -1.0);
  box(g, M.sign, 1.5, 0.7, 0.01, 0, 2.95, -0.97, { shadow: false });   // pizarra del menú
  return g;
}
