import * as THREE from "./vendor/three/three.module.min.js";

import { createEstateWorkbench } from "./estate-workbench.mjs";
import { fitHammerShell, gradeHammerMaterial } from "./hammer-shells.mjs";

export function createHammerDisplays(loader){
 const root=new THREE.Group(),cache=new Map(),visible=new Map();
 const previewRoot=new THREE.Group();root.add(previewRoot);
 const blockedMaterial=new THREE.MeshBasicMaterial({
  color:0xe44b41,transparent:true,opacity:.72,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1
 });
 let pending=0,previewModel=null,previewBlocked=null;
 function load(item){
  if(item.id==="estate-workbench"){
   cache.set(item.id,{model:createEstateWorkbench()});
   return;
  }
  const entry={model:null};
  cache.set(item.id,entry);pending++;
  loader.loadAsync(item.asset).then(({scene})=>{
   const shell=fitHammerShell(item,scene);
   if(shell){entry.model=shell;return;}
   const bounds=new THREE.Box3().setFromObject(scene,true);
   const size=bounds.getSize(new THREE.Vector3());
   // Thin, wide pieces always face the same way relative to the 2.4 m wall edge.
   if(item.w>item.d*2&&size.z>size.x*1.15){
    scene.rotation.y+=Math.PI*.5;
    bounds.setFromObject(scene,true);bounds.getSize(size);
   }
   if(![size.x,size.y,size.z].every(n=>Number.isFinite(n)&&n>.0001))throw Error("Invalid model bounds");
   const center=bounds.getCenter(new THREE.Vector3());
   const model=new THREE.Group();
   scene.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));
   model.add(scene);
   scene.traverse(mesh=>{
    if(!mesh.isMesh)return;
    if(!mesh.geometry.hasAttribute("normal"))mesh.geometry.computeVertexNormals();
    for(const mat of [mesh.material].flat()){
     if(mat.isMeshStandardMaterial){mat.roughness=.88;mat.metalness=0;gradeHammerMaterial(mat,"object");}
    }
   });
   model.scale.set(item.w/size.x,item.h/size.y,item.d/size.z);
   entry.model=model;
  }).catch(error=>console.warn("건축 모델을 불러오지 못했습니다.",item.id,error)).finally(()=>pending--);
 }
 function updatePreview(item){
  previewRoot.visible=false;
  if(!item)return;
  if(!cache.has(item.id)&&pending<4)load(item);
  const model=cache.get(item.id)?.model;
  if(!model)return;
  const blocked=Boolean(item.problem);
  if(previewModel!==model||previewBlocked!==blocked){
   previewRoot.clear();
   const shape=model.clone(true);
   if(blocked)shape.traverse(node=>{if(node.isMesh){node.material=blockedMaterial;node.renderOrder=30;}});
   previewRoot.add(shape);
   previewModel=model;previewBlocked=blocked;
  }
  previewRoot.position.set(item.x,item.y,item.z);previewRoot.rotation.y=item.yaw;
  previewRoot.visible=true;
 }
 function update(items,player,preview){
  updatePreview(preview);
  const near=items.filter(item=>Math.hypot(item.x-player[0],item.z-player[2])<90);
  const keys=new Set(near.map(item=>item.key));
  for(const [key,group] of visible)if(!keys.has(key)){root.remove(group);visible.delete(key);}
  for(const item of near){
   const placed=visible.get(item.key);
   if(placed){placed.position.set(item.x,item.y,item.z);placed.rotation.y=item.yaw;continue;}
   if(!cache.has(item.id)&&pending<4)load(item);
   const model=cache.get(item.id)?.model;
   if(!model)continue;
   const group=new THREE.Group();group.position.set(item.x,item.y,item.z);group.rotation.y=item.yaw;
   group.add(model.clone(true));root.add(group);visible.set(item.key,group);
  }
 }
 return {root,update,ready:id=>Boolean(cache.get(id)?.model)};
}


