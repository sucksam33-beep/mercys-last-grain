import * as THREE from "./vendor/three/three.module.min.js";

// Dimensions are in world metres. Set dressing stays off the walkable route.
const props = {
 reed: [
  [188, 150, .80, .2], [193, 157, .65, 2.1],
  [411, 194, .93, .4], [410, 196, .71, 1.8],
  [452, 192, .95, 2.2], [453, 194, .75, 4.3],
  [489, 268, 1.05, .9], [488, 278, .88, 2.9], [486, 285, .82, 1.6]
 ],
 boulder: [
  [104, 129, .75, .6], [180, 150, .62, 2.4], [400, 196, .68, 1.7],
  [453, 193, .88, 2.4], [487, 278, .75, 3.1]
 ],
 stump: [[113, 132, .55, 1.1], [220, 183, .72, 2.8], [493, 267, .53, .6]],
 wall: [
  [486.2, 279.9, 1.15, -1.82], [485.86, 281.25, 1.15, -1.82],
  [485.52, 282.60, 1.15, -1.82], [485.18, 283.95, 1.15, -1.82]
 ]
};

export function createAsagiRiverbank(loader) {
 const root = new THREE.Group();
 const instances = [];
 const loaded = [];
 for (const [kind, placements] of Object.entries(props)) {
  loader.loadAsync(`assets/asagi-bank-${kind}.glb`).then(({scene}) => {
   const bounds = new THREE.Box3().setFromObject(scene);
   const dimensions = bounds.getSize(new THREE.Vector3());
   if (dimensions.toArray().some(size => !Number.isFinite(size) || size <= 0)) {
    throw new Error("Invalid model bounds");
   }
   const center = bounds.getCenter(new THREE.Vector3());
   scene.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
   scene.traverse(node => {
    if (!node.isMesh) return;
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
     material.metalness = 0;
     material.roughness = kind === "wall" ? .65 : .88;
    }
   });
   for (const [x, z, size, yaw] of placements) {
    const pivot = new THREE.Group();
    pivot.add(scene.clone());
    pivot.scale.setScalar(size / dimensions.y);
    if (kind === "wall") {
     pivot.scale.x = 1.46 / dimensions.x;
     pivot.scale.z = .85 / dimensions.z;
    }
    pivot.rotation.y = yaw;
    root.add(pivot);
    instances.push({pivot, kind, x, z});
   }
   loaded.push(kind);
  }).catch(error => console.warn(`Asagi riverbank ${kind}:`, error));
 }
 return {
  root,
  get loaded() { return [...loaded]; },
  update(visible, terrainAt, time) {
   root.visible = visible;
   if (!visible) return;
   for (const {pivot, kind, x, z} of instances) {
    if (terrainAt && pivot.position.x !== x) {
     pivot.position.set(x, terrainAt(x, z) - (kind === "wall" ? .30 : .07), z);
    }
    if (kind === "reed") {
     pivot.rotation.z = Math.sin(time * .00175 + x * .12 + z * .24) * .055;
    }
   }
  }
 };
}
