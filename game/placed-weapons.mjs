import * as THREE from "./vendor/three/three.module.min.js";
import { loadFalWeapon } from "./fal-weapon.mjs";
const lengths={staff:1.35,bow:1.02,knife:.33,heavyaxe:.88,harpoon:1.53,"winter-spear":1.48};
export function createPlacedWeapons(){
 const root=new THREE.Group(),entries=new Map();
 function update(items){
  const visible=new Set(items.map(item=>item.key));
  for(const [key,group] of entries)if(!visible.has(key)){
   if(group.userData.previewMaterial){group.userData.previewMaterial.dispose();group.traverse(node=>node.geometry?.dispose());}
   root.remove(group);entries.delete(key);
  }
  for(const item of items){
   if(entries.has(item.key))continue;
   const group=new THREE.Group();
   entries.set(item.key,group);
   group.position.set(item.x,item.y+.04,item.z);
   group.rotation.y=item.yaw;root.add(group);
   if(Number.isInteger(item.grade)){
    const material=new THREE.MeshStandardMaterial({color:0xc5db9c,transparent:true,opacity:.52});
    group.userData.previewMaterial=material;
    for(let i=0;i<3;i++){
     const mesh=new THREE.Mesh(new THREE.BoxGeometry(.18,.16,[.60,.87,.96,1.04][item.grade]),material);
     mesh.position.set((i%2-.5)*.2,.08+Math.floor(i/2)*.17,0);group.add(mesh);
    }
    continue;
   }
   loadFalWeapon(item.url,item.id,item.shape,lengths[item.shape]??1.1,true).then(model=>{
    if(entries.get(item.key)!==group)return;
    const resting=new THREE.Group();resting.rotation.x=Math.PI/2;
    resting.add(model);
    const bounds=new THREE.Box3().setFromObject(resting,true),center=bounds.getCenter(new THREE.Vector3());
    resting.position.set(-center.x,-bounds.min.y,-center.z);group.add(resting);
   }).catch(error=>console.warn("배치 무기 모델을 불러오지 못했습니다.",item.id,error));
  }
 }
 return {root,update};
}
