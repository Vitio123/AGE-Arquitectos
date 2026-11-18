import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/*
 * "Hornea" un grupo estático: junta todas sus mallas en una sola malla por material.
 * Pasa de cientos de draw calls a unos pocos, así podemos poner mucho más detalle.
 * No toca objetos marcados con userData.dynamic (personas, autos) ni sus hijos.
 */
export function bake(root) {
  if (globalThis.__NO_BAKE) return root;
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const remove = [];

  (function walk(o) {
    if (o.userData.dynamic) return;
    if (o.isMesh && !o.isInstancedMesh && o !== root) {
      const key = `${o.material.uuid}|${+o.castShadow}|${+o.receiveShadow}`;
      let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal') geo.deleteAttribute(k);
      geo.clearGroups();
      geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, list: [] });
      buckets.get(key).list.push(geo);
      remove.push(o);
    }
    for (const c of o.children) walk(c);
  })(root);

  for (const o of remove) { o.geometry.dispose(); o.removeFromParent(); }
  // Quita grupos vacíos que quedaron
  (function prune(o) {
    for (const c of [...o.children]) {
      prune(c);
      if (c.type === 'Group' && !c.children.length && !c.userData.dynamic) c.removeFromParent();
    }
  })(root);

  for (const { mat, cast, recv, list } of buckets.values()) {
    const merged = mergeGeometries(list, false);
    list.forEach(g => g.dispose());
    const m = new THREE.Mesh(merged, mat);
    m.castShadow = cast; m.receiveShadow = recv;
    root.add(m);
  }
  return root;
}
