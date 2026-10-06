import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function batchCabin(scene, dynamicRoots) {
  scene.updateMatrixWorld(true);
  const repeated = new Map();
  const excluded = object => {
    for (let parent = object; parent; parent = parent.parent) if (dynamicRoots.has(parent)) return true;
    return false;
  };
  const candidates = [];
  scene.traverse(object => {
    if (object.isMesh && !Array.isArray(object.material) && !object.material.transparent && !excluded(object)) candidates.push(object);
  });
  const zoneKey = object => Math.floor(object.matrixWorld.elements[14] / 1.5);
  const flagsKey = object => `${object.material.uuid}:${object.castShadow}:${object.receiveShadow}:${zoneKey(object)}`;
  for (const object of candidates) {
    const key = `${object.geometry.uuid}:${flagsKey(object)}`;
    if (!repeated.has(key)) repeated.set(key, []);
    repeated.get(key).push(object);
  }
  const merged = new Map();
  let instances = 0, batches = 0;
  const removedGeometry = new Set();
  for (const objects of repeated.values()) {
    if (objects.length < 3) {
      for (const object of objects) {
        const key = flagsKey(object);
        if (!merged.has(key)) merged.set(key, []);
        merged.get(key).push(object);
      }
      continue;
    }
    const source = objects[0];
    const batch = new THREE.InstancedMesh(source.geometry, source.material, objects.length);
    batch.castShadow = source.castShadow; batch.receiveShadow = source.receiveShadow;
    objects.forEach((object, index) => {
      batch.setMatrixAt(index, object.matrixWorld);
      object.removeFromParent();
    });
    batch.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    batch.computeBoundingSphere();
    scene.add(batch); instances += objects.length; batches++;
  }
  // Keep depth zones separate so culling can still reject the rear cabin.
  for (const objects of merged.values()) {
    if (objects.length < 2) continue;
    const geometries = objects.map(object => {
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      return geometry.applyMatrix4(object.matrixWorld);
    });
    const geometry = mergeGeometries(geometries);
    geometries.forEach(item => item.dispose());
    if (!geometry) continue;
    const source = objects[0];
    const batch = new THREE.Mesh(geometry, source.material);
    batch.castShadow = source.castShadow; batch.receiveShadow = source.receiveShadow;
    geometry.computeBoundingSphere();
    objects.forEach(object => { removedGeometry.add(object.geometry); object.removeFromParent(); });
    scene.add(batch); batches++;
  }
  const retained = new Set();
  scene.traverse(object => { if (object.geometry) retained.add(object.geometry); });
  removedGeometry.forEach(geometry => { if (!retained.has(geometry)) geometry.dispose(); });
  scene.updateMatrixWorld(true);
  scene.traverse(object => { if (!excluded(object)) object.matrixAutoUpdate = false; });
  scene.matrixWorldAutoUpdate = false;
  return { instances, batches };
}
