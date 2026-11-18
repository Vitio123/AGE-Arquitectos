import * as THREE from 'three';

/** Paleta de la marca (sRGB). Debe coincidir con las variables de main.css. */
export const PAL = {
  bg: 0x0b0b0c,      // --bg
  card: 0x141416,    // fondo de tarjetas con maqueta
  sand: 0xf6d3a1,    // degradado: arena
  peach: 0xec9b6c,   // degradado: durazno
  lilac: 0xb38cff,   // degradado: lila
};

/**
 * Materiales compartidos por todos los modelos.
 * Tonos de maqueta: blancos cálidos, maderas claras, verdes salvia,
 * y los acentos durazno / lila de la marca (jacarandás, guayacanes, luces).
 */
export function createMaterials() {
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
  const flat = (color, o = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...o });
  const glow = (color, emissive, emissiveIntensity) =>
    new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, roughness: 0.4 });

  return {
    // Construcción
    concrete:     std(0xdcd6cc, { roughness: 0.9 }),
    concreteDark: std(0x7a746d, { roughness: 0.9 }),
    white:        std(0xf3f0ea, { roughness: 0.6 }),
    plaster:      std(0xe8d5bd, { roughness: 0.92 }),
    terracotta:   std(0xc4774f, { roughness: 0.85 }),
    brick:        std(0xa8603f, { roughness: 0.95 }),
    wood:         std(0x9b6a45, { roughness: 0.7 }),
    woodLight:    std(0xd1aa7c, { roughness: 0.7 }),
    metal:        std(0x2b2b30, { roughness: 0.4, metalness: 0.7 }),
    bronze:       std(0xd2a27a, { roughness: 0.4, metalness: 0.45 }),
    roof:         std(0x3f3a37, { roughness: 0.75, metalness: 0.15 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xa7bccb, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.28,
      envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false,
    }),
    glassDark:    std(0x3b3f48, { roughness: 0.2, metalness: 0.4 }),
    water: new THREE.MeshPhysicalMaterial({
      color: 0x5aa8b6, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.88, envMapIntensity: 2,
    }),
    solar:        std(0x1d2740, { roughness: 0.25, metalness: 0.6 }),
    tank:         std(0x1f1f22, { roughness: 0.6 }),

    // Exterior
    ground:     std(0x1c1a19, { roughness: 1 }),
    grass:      std(0x5d6a4c, { roughness: 1 }),
    grassDark:  std(0x4a5640, { roughness: 1 }),
    sand:       std(0xd9c39f, { roughness: 1 }),
    paving:     std(0xa39b92, { roughness: 0.95 }),
    pavingDark: std(0x726c66, { roughness: 0.95 }),
    plaza:      std(0x57524d, { roughness: 0.95 }),
    plazaJoint: std(0x3f3b38, { roughness: 1 }),
    asphalt:    std(0x2e2d30, { roughness: 0.95 }),
    stripe:     std(0xeeeae2, { roughness: 0.8 }),
    stone:      flat(0xbdb4a8),
    trunk:      flat(0x5a4130),
    leaf:       flat(0x6f7f55),
    leaf2:      flat(0x55653f),
    leafLilac:  flat(0xa48bd8),   // jacarandá
    leafPeach:  flat(0xe9a272),   // guayacán / ponciana
    hedge:      flat(0x4f5e3d),

    // Interior
    fabric:     std(0x6e6a80, { roughness: 1 }),
    fabricWarm: std(0xc27c58, { roughness: 1 }),
    fabricSand: std(0xe2cba6, { roughness: 1 }),
    rug:        std(0x8a7663, { roughness: 1 }),
    pot:        std(0xcdbba5, { roughness: 0.9 }),
    book:       flat(0x8d5b45),
    screen:     glow(0x0d1a24, 0x7fc0ff, 0.9),
    lamp:       glow(0xfff1d6, 0xffbe6e, 2.2),
    warm:       glow(0xffe2b8, 0xffb46b, 1.1),
    sign:       glow(0xffffff, 0xf6d3a1, 1.6),
    accent:     glow(0xec9b6c, 0xec9b6c, 1.4),
    lilacGlow:  glow(0xb38cff, 0xb38cff, 1.2),

    // Líneas (modo "plano / concepto")
    line:     new THREE.LineBasicMaterial({ color: PAL.sand, transparent: true, opacity: 0.9 }),
    lineSoft: new THREE.LineBasicMaterial({ color: PAL.lilac, transparent: true, opacity: 0.45 }),
  };
}

/** Crea una caja, la posiciona y la agrega al padre. */
export function box(parent, mat, w, h, d, x = 0, y = 0, z = 0, { shadow = true } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow && !mat.transparent;
  m.receiveShadow = shadow;
  parent.add(m);
  return m;
}

/** Cilindro simple. */
export function cyl(parent, mat, rTop, rBot, h, x = 0, y = 0, z = 0, seg = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = !mat.transparent;
  parent.add(m);
  return m;
}

/** Disco (terreno redondo). y = cara superior. */
export function disc(parent, mat, r, h, y = 0, seg = 72) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
  m.position.y = y - h / 2;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** Coloca un objeto (posición + giro) dentro de un padre. */
export function place(parent, obj, x, y, z, ry = 0) {
  obj.position.set(x, y, z); obj.rotation.y = ry; parent.add(obj); return obj;
}

/** Libera geometrías de un objeto y sus hijos. */
export function disposeTree(obj) {
  obj.traverse(o => { if (o.geometry) o.geometry.dispose(); });
}
