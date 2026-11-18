import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/*
 * Personas low-poly estilo PlayStation 1.
 *  - Esqueleto real: cadera → torso → cabeza, hombro → codo → mano, muslo → rodilla → pie.
 *  - Ciclo de caminata con rodillas que se doblan, contrarrotación de hombros,
 *    balanceo de cadera, rebote del cuerpo y codos que acompañan.
 *  - La pose se actualiza a 15 cuadros por segundo (animación "escalonada" de PS1)
 *    y los vértices se ajustan a una rejilla de pantalla (el temblor típico de PS1).
 *  - Un solo material con colores por vértice para todas las personas (pocos cambios de estado).
 */

const PS1_FPS = 15;
const STRIDE = 1.3;           // metros por ciclo completo de caminata
const quant = t => Math.floor(t * PS1_FPS) / PS1_FPS;

const SKINS = [0xe6bf9a, 0xc99067, 0x9a6444, 0x6e432c, 0xf0cfae];
const TOPS = [0xec9b6c, 0xf2ede4, 0x2f3a56, 0x6f7f55, 0xb38cff, 0x232327, 0xc4774f, 0xf6d3a1, 0x8a96b3, 0xe6e0d4];
const BOTTOMS = [0x232a3d, 0x2b2b2e, 0x5c4a3a, 0x45464f, 0xd8cbb3, 0x3b4a5e];
const HAIR = [0x17110e, 0x3a281c, 0x5e3f26, 0x0e0e0f, 0x8a5a36];
const SHOES = [0x1b1b1d, 0xf0ece6, 0x5a3d2a];

/* ---------- Material compartido (colores por vértice + temblor PS1) ---------- */

let sharedMat = null;
function peopleMat() {
  if (sharedMat) return sharedMat;
  sharedMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  sharedMat.onBeforeCompile = s => {
    s.vertexShader = s.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      // PS1: los vértices "saltan" a una rejilla de baja resolución
      vec2 ps1Grid = vec2(320.0, 180.0);
      gl_Position.xy = floor(gl_Position.xy / gl_Position.w * ps1Grid + 0.5) / ps1Grid * gl_Position.w;`);
  };
  sharedMat.customProgramCacheKey = () => 'ps1-people';
  return sharedMat;
}

/* ---------- Geometría ---------- */

const geoCache = new Map();
const tmpColor = new THREE.Color();

function paint(geo, hex) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  if (g.attributes.uv) g.deleteAttribute('uv');
  tmpColor.setHex(hex);
  const n = g.attributes.position.count, c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { c[i * 3] = tmpColor.r; c[i * 3 + 1] = tmpColor.g; c[i * 3 + 2] = tmpColor.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  g.clearGroups();
  return g;
}

/** Caja trapezoidal (más ancha arriba o abajo). */
function taper(wTop, wBot, h, dTop, dBot) {
  const g = new THREE.BoxGeometry(1, h, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const top = p.getY(i) > 0;
    p.setX(i, p.getX(i) * (top ? wTop : wBot));
    p.setZ(i, p.getZ(i) * (top ? dTop : dBot));
  }
  g.computeVertexNormals();
  return g;
}

/** Extremidad de 6 lados que cuelga de su articulación (pivote arriba). */
const limb = (rTop, rBot, len) => new THREE.CylinderGeometry(rTop, rBot, len, 6).translate(0, -len / 2, 0);

/** Une piezas [geo, color, x, y, z] en una sola geometría con color por vértice. */
function build(key, pieces) {
  if (geoCache.has(key)) return geoCache.get(key);
  const list = pieces.map(([geo, color, x = 0, y = 0, z = 0]) => paint(geo.translate(x, y, z), color));
  const g = mergeGeometries(list, false);
  list.forEach(l => l.dispose());
  geoCache.set(key, g);
  return g;
}

function mesh(geo) {
  const m = new THREE.Mesh(geo, peopleMat());
  m.castShadow = true;
  return m;
}

/* ---------- Persona ---------- */

/**
 * Crea una persona. seed (0..1) define colores, peinado y ropa.
 * Devuelve un Group con userData.rig (articulaciones) — mira hacia +z, pies en y = 0.
 */
export function person(seed = Math.random(), { hat = null } = {}) {
  const r = i => (Math.sin((seed + i) * 9301.17 + i * 13.7) * 0.5 + 0.5);
  const pick = (arr, i) => arr[Math.floor(r(i) * arr.length) % arr.length];
  const skin = pick(SKINS, 1), top = pick(TOPS, 2), bottom = pick(BOTTOMS, 3), hair = pick(HAIR, 4), shoe = pick(SHOES, 5);
  const longHair = r(6) > 0.55, skirt = longHair && r(7) > 0.6, shortSleeve = r(8) > 0.5, bag = r(9) > 0.78;
  const k = (o) => `${o}|${skin}|${top}|${bottom}|${hair}|${shoe}|${+longHair}|${+skirt}|${+shortSleeve}|${+bag}|${hat}`;

  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const hips = new THREE.Group(); hips.position.y = 0.93; body.add(hips);

  // Pelvis (o falda)
  hips.add(mesh(skirt
    ? build(k('skirt'), [[taper(0.33, 0.44, 0.42, 0.21, 0.3), bottom, 0, -0.15, 0]])
    : build(k('pelvis'), [[taper(0.34, 0.31, 0.2, 0.21, 0.19), bottom, 0, -0.03, 0], [taper(0.35, 0.35, 0.04, 0.22, 0.22), 0x1c1c1e, 0, 0.06, 0]])));

  // Torso + cuello (+ mochila)
  const spine = new THREE.Group(); spine.position.y = 0.08; hips.add(spine);
  const torsoParts = [
    [taper(0.42, 0.32, 0.44, 0.23, 0.19), top, 0, 0.22, 0],
    [new THREE.CylinderGeometry(0.05, 0.055, 0.09, 6), skin, 0, 0.48, 0],
  ];
  if (bag) torsoParts.push([new THREE.BoxGeometry(0.28, 0.32, 0.12), 0x3a3530, 0, 0.24, -0.16]);
  spine.add(mesh(build(k('torso'), torsoParts)));

  // Cabeza con cara (nariz y ojos) y pelo
  const head = new THREE.Group(); head.position.y = 0.5; spine.add(head);
  const headParts = [
    [taper(0.21, 0.17, 0.23, 0.22, 0.19), skin, 0, 0.12, 0],
    [new THREE.BoxGeometry(0.04, 0.05, 0.04), skin, 0, 0.1, 0.11],
    [new THREE.BoxGeometry(0.035, 0.022, 0.01), 0x111111, -0.048, 0.145, 0.106],
    [new THREE.BoxGeometry(0.035, 0.022, 0.01), 0x111111, 0.048, 0.145, 0.106],
  ];
  if (hat === 'hardhat') {
    headParts.push([taper(0.2, 0.25, 0.11, 0.22, 0.27), 0xf2b84b, 0, 0.27, 0], [new THREE.BoxGeometry(0.26, 0.02, 0.1), 0xf2b84b, 0, 0.22, 0.14]);
  } else {
    headParts.push([taper(0.22, 0.235, 0.08, 0.22, 0.24), hair, 0, 0.255, -0.005]);
    headParts.push(longHair
      ? [new THREE.BoxGeometry(0.235, 0.34, 0.07), hair, 0, 0.08, -0.095]
      : [new THREE.BoxGeometry(0.225, 0.13, 0.05), hair, 0, 0.17, -0.1]);
  }
  head.add(mesh(build(k('head'), headParts)));

  // Brazos: hombro → codo → mano
  const arm = side => {
    const shoulder = new THREE.Group(); shoulder.position.set(side * 0.235, 0.41, 0); spine.add(shoulder);
    shoulder.add(mesh(build(k('upper'), [[limb(0.06, 0.05, 0.29), top]])));
    const elbow = new THREE.Group(); elbow.position.y = -0.29; shoulder.add(elbow);
    elbow.add(mesh(build(k('fore'), [
      [limb(0.047, 0.04, 0.25), shortSleeve ? skin : top],
      [new THREE.BoxGeometry(0.06, 0.1, 0.045), skin, 0, -0.3, 0],
    ])));
    return { shoulder, elbow };
  };
  const L = arm(-1), R = arm(1);

  // Piernas: cadera → rodilla → pie
  const leg = side => {
    const thigh = new THREE.Group(); thigh.position.set(side * 0.095, -0.04, 0); hips.add(thigh);
    thigh.add(mesh(build(k('thigh'), [[limb(0.085, 0.065, 0.43), skirt ? skin : bottom]])));
    const knee = new THREE.Group(); knee.position.y = -0.43; thigh.add(knee);
    knee.add(mesh(build(k('shin'), [[limb(0.06, 0.047, 0.38), skirt ? skin : bottom]])));
    const ankle = new THREE.Group(); ankle.position.y = -0.38; knee.add(ankle);
    ankle.add(mesh(build(k('foot'), [[new THREE.BoxGeometry(0.1, 0.08, 0.25), shoe, 0, -0.04, 0.05]])));
    return { thigh, knee, ankle };
  };
  const LL = leg(-1), RL = leg(1);

  const s = 0.92 + r(10) * 0.12;
  g.scale.setScalar(s);
  g.userData.dynamic = true;
  g.userData.rig = {
    body, hips, spine, head,
    shoulderL: L.shoulder, elbowL: L.elbow, shoulderR: R.shoulder, elbowR: R.elbow,
    thighL: LL.thigh, kneeL: LL.knee, ankleL: LL.ankle, thighR: RL.thigh, kneeR: RL.knee, ankleR: RL.ankle,
  };
  return g;
}

/* ---------- Poses ---------- */

function reset(r) {
  r.body.position.set(0, 0, 0); r.body.rotation.set(0, 0, 0);
  for (const j of ['hips', 'spine', 'head', 'shoulderL', 'elbowL', 'shoulderR', 'elbowR', 'thighL', 'kneeL', 'ankleL', 'thighR', 'kneeR', 'ankleR'])
    r[j].rotation.set(0, 0, 0);
}

/** Caminata. ph = fase del ciclo en radianes (ligada a la distancia recorrida). */
export function poseWalk(p, ph) {
  const r = p.userData.rig; reset(r);
  const s = Math.sin(ph), c = Math.cos(ph);
  // Piernas: el muslo va y viene; la rodilla se dobla en la fase de vuelo
  const aL = -0.5 * s, aR = 0.5 * s;
  const kL = 0.08 + 1.05 * Math.pow(Math.max(0, c), 1.3);
  const kR = 0.08 + 1.05 * Math.pow(Math.max(0, -c), 1.3);
  r.thighL.rotation.x = aL; r.kneeL.rotation.x = kL; r.ankleL.rotation.x = -(aL + kL) * 0.55;
  r.thighR.rotation.x = aR; r.kneeR.rotation.x = kR; r.ankleR.rotation.x = -(aR + kR) * 0.55;
  // Cuerpo: rebote (2 por ciclo), peso de lado a lado, cadera y hombros en contrafase
  r.body.position.y = Math.abs(c) * 0.04 - 0.02;
  r.body.position.x = s * 0.025;
  r.hips.rotation.y = 0.16 * s;
  r.hips.rotation.z = 0.05 * c;
  r.spine.rotation.y = -0.3 * s;
  r.spine.rotation.x = 0.06;
  r.head.rotation.y = 0.12 * s;
  r.head.rotation.x = -0.04;
  // Brazos: opuestos a las piernas, el codo se dobla al ir hacia adelante
  r.shoulderL.rotation.set(0.5 * s, 0, -0.07);
  r.shoulderR.rotation.set(-0.5 * s, 0, 0.07);
  r.elbowL.rotation.x = -(0.2 + 0.6 * Math.max(0, -s));
  r.elbowR.rotation.x = -(0.2 + 0.6 * Math.max(0, s));
}

/** Sentado en una silla (asiento a ~0.5 m) usando la computadora o conversando. */
export function poseSit(p, t, typing = true) {
  const r = p.userData.rig; reset(r);
  r.body.position.y = -0.36;
  r.thighL.rotation.x = r.thighR.rotation.x = -Math.PI / 2 + 0.06;
  r.thighL.rotation.z = 0.04; r.thighR.rotation.z = -0.04;
  r.kneeL.rotation.x = Math.PI / 2 - 0.1; r.kneeR.rotation.x = Math.PI / 2 + 0.05;
  r.spine.rotation.x = 0.1 + Math.sin(t * 0.8) * 0.02;
  if (typing) {
    r.shoulderL.rotation.set(-0.55, 0, -0.12); r.shoulderR.rotation.set(-0.55, 0, 0.12);
    r.elbowL.rotation.x = -0.95 + Math.sin(t * 11) * 0.07;
    r.elbowR.rotation.x = -0.95 + Math.sin(t * 11 + 2.1) * 0.07;
    r.head.rotation.x = 0.12 + Math.sin(t * 0.9) * 0.05;
    r.head.rotation.y = Math.sin(t * 0.45) * 0.25;
  } else {
    // Conversando en la mesa: manos sobre la mesa y gesto ocasional
    const g = Math.max(0, Math.sin(t * 1.4));
    r.shoulderL.rotation.set(-0.45, 0, -0.1); r.elbowL.rotation.x = -1.1;
    r.shoulderR.rotation.set(-0.45 - g * 0.5, 0, 0.15); r.elbowR.rotation.x = -1.1 - g * 0.5;
    r.head.rotation.y = Math.sin(t * 0.7) * 0.35; r.head.rotation.x = Math.sin(t * 1.9) * 0.06;
  }
}

/** De pie. act: 'talk' (conversa), 'phone' (habla por celular), 'work' (martilla en obra), 'look' (observa). */
export function poseIdle(p, t, act = 'talk') {
  const r = p.userData.rig; reset(r);
  const w = Math.sin(t * 0.6);                 // pasa el peso de una pierna a otra
  r.body.position.x = 0.025 * w;
  r.hips.rotation.z = 0.05 * w;
  r.spine.rotation.z = -0.04 * w;
  r.kneeL.rotation.x = 0.18 * Math.max(0, w); r.kneeR.rotation.x = 0.18 * Math.max(0, -w);
  r.thighL.rotation.x = -0.06 * Math.max(0, w); r.thighR.rotation.x = -0.06 * Math.max(0, -w);
  r.spine.rotation.x = 0.02 + Math.sin(t * 2) * 0.015;  // respira
  r.shoulderL.rotation.z = -0.06; r.shoulderR.rotation.z = 0.06;
  r.elbowL.rotation.x = r.elbowR.rotation.x = -0.15;

  if (act === 'talk') {
    const g = Math.max(0, Math.sin(t * 1.3));
    r.shoulderR.rotation.set(-0.3 - g * 0.35, 0, 0.18);
    r.elbowR.rotation.x = -1.0 - Math.sin(t * 2.7) * 0.3;
    r.head.rotation.x = Math.sin(t * 1.9) * 0.08;
    r.head.rotation.y = Math.sin(t * 0.5) * 0.3;
  } else if (act === 'phone') {
    // Mira el celular con las dos manos y escribe con el pulgar
    r.shoulderL.rotation.set(-0.42, 0, 0.12); r.elbowL.rotation.x = -1.45;
    r.shoulderR.rotation.set(-0.38, 0, -0.12); r.elbowR.rotation.x = -1.4 + Math.sin(t * 9) * 0.04;
    r.head.rotation.x = 0.38 + Math.sin(t * 0.7) * 0.04; r.head.rotation.y = Math.sin(t * 0.3) * 0.08;
  } else if (act === 'work') {
    const hit = Math.abs(Math.sin(t * 4.5));
    r.spine.rotation.x = 0.4; r.head.rotation.x = 0.25;
    r.kneeL.rotation.x = r.kneeR.rotation.x = 0.35; r.thighL.rotation.x = r.thighR.rotation.x = -0.35;
    r.body.position.y = -0.04;
    r.shoulderR.rotation.set(-1.5 + hit * 0.8, 0, 0.1); r.elbowR.rotation.x = -0.6 - hit * 0.5;
    r.shoulderL.rotation.set(-0.9, 0, -0.1); r.elbowL.rotation.x = -0.4;
  } else {
    // Observa: manos atrás, mira alrededor
    r.shoulderL.rotation.set(0.35, 0, -0.1); r.shoulderR.rotation.set(0.35, 0, 0.1);
    r.elbowL.rotation.x = r.elbowR.rotation.x = -0.5;
    r.head.rotation.y = Math.sin(t * 0.35) * 0.6; r.head.rotation.x = -0.1;
  }
}

/** Echado en una tumbona, cabeza hacia -z. */
export function poseLie(p, t) {
  const r = p.userData.rig; reset(r);
  r.body.rotation.x = -Math.PI / 2 + 0.32;
  r.body.position.y = 0.12;
  r.kneeL.rotation.x = 0.25 + Math.sin(t * 0.3) * 0.1; r.thighL.rotation.x = -0.25;
  r.shoulderL.rotation.set(-2.7, 0, -0.2); r.elbowL.rotation.x = -1.9;
  r.shoulderR.rotation.set(0.1, 0, 0.12); r.elbowR.rotation.x = -0.2 + Math.sin(t * 0.5) * 0.1;
  r.head.rotation.x = 0.25; r.head.rotation.y = Math.sin(t * 0.25) * 0.3;
}

/* ---------- Grupos con comportamiento ---------- */

/**
 * spec: {
 *   walkers: [{ path:[[x,z],...], speed, y, offset, loop }],   // loop=false → ida y vuelta
 *   sitters: [{ x,y,z, ry, talk }],                            // y = piso; el asiento queda a 0.5 m
 *   idlers:  [{ x,y,z, ry, act }],
 *   liers:   [{ x,y,z, ry }],                                  // y = superficie de la tumbona
 * }
 * Devuelve { group, update(t), spec }.
 */
export function crowd(spec, seed = 1, { hat = null } = {}) {
  const group = new THREE.Group();
  group.userData.dynamic = true;
  const actors = [];
  let n = 0;
  const next = () => (seed * 0.137 + (n++) * 0.618) % 1;
  const make = () => person(next(), { hat });

  for (const w of spec.walkers || []) {
    let pts = w.path.map(([x, z]) => new THREE.Vector3(x, w.y || 0, z));
    if (w.loop === false && pts.length > 2) pts = [...pts, ...pts.slice(1, -1).reverse()];
    const segs = [];
    let total = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const len = a.distanceTo(b);
      if (len < 1e-3) continue;
      segs.push({ a, b, len, start: total });
      total += len;
    }
    const p = make(); group.add(p);
    actors.push({ type: 'walk', p, segs, total, speed: w.speed || 1.1, offset: (w.offset ?? next()) * total });
  }
  for (const s of spec.sitters || []) {
    const p = make(); p.position.set(s.x, s.y || 0, s.z); p.rotation.y = s.ry || 0;
    group.add(p); actors.push({ type: 'sit', p, phase: next() * 10, typing: !s.talk });
  }
  for (const s of spec.idlers || []) {
    const p = make(); p.position.set(s.x, s.y || 0, s.z); p.rotation.y = s.ry || 0;
    group.add(p); actors.push({ type: 'idle', p, phase: next() * 10, act: s.act || 'talk' });
  }
  for (const s of spec.liers || []) {
    const p = make(); p.position.set(s.x, s.y || 0, s.z); p.rotation.y = s.ry || 0;
    group.add(p); actors.push({ type: 'lie', p, phase: next() * 10 });
  }

  const tmp = new THREE.Vector3();
  function update(t) {
    const tq = quant(t);
    for (const a of actors) {
      if (a.type === 'walk') {
        const d = ((a.offset + tq * a.speed) % a.total + a.total) % a.total;
        const seg = a.segs.find(s => d >= s.start && d < s.start + s.len) || a.segs[0];
        tmp.lerpVectors(seg.a, seg.b, (d - seg.start) / seg.len);
        a.p.position.copy(tmp);
        a.p.rotation.y = Math.atan2(seg.b.x - seg.a.x, seg.b.z - seg.a.z);
        poseWalk(a.p, ((a.offset + tq * a.speed) / STRIDE) * Math.PI * 2);
      } else if (a.type === 'sit') poseSit(a.p, tq + a.phase, a.typing);
      else if (a.type === 'lie') poseLie(a.p, tq + a.phase);
      else poseIdle(a.p, tq + a.phase, a.act);
    }
  }
  update(0);
  return { group, update, spec };
}

/* Utilidades compartidas con otros modelos con color por vértice (autos, caballos). */
export { build as vcBuild, peopleMat as vcMaterial, taper, limb };
