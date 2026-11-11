import * as T from "./vendor/three/three.module.min.js";
import { GLTFLoader } from "./vendor/three/GLTFLoader.js";

import { prepareFalWeapon, bambooBowString } from "./fal-weapon-cleanup.mjs";

const loader=new GLTFLoader();
const cache=new Map();

function orient(model,id){
 model.updateMatrixWorld(true);
 const points=[], p=new T.Vector3();
 model.traverse(o=>{
  const positions=o.geometry?.attributes.position;
  if(!o.isMesh||!positions)return;
  const step=Math.max(1,Math.floor(positions.count/2600));
  for(let i=0;i<positions.count;i+=step)points.push(p.fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld).clone());
 });
 if(points.length<6)return;
 const mean=points.reduce((sum,v)=>sum.add(v),new T.Vector3()).divideScalar(points.length);
 const covariance=[0,0,0,0,0,0];
 for(const v of points){
  const {x,y,z}=v.sub(mean);
  covariance[0]+=x*x;covariance[1]+=x*y;covariance[2]+=x*z;
  covariance[3]+=y*y;covariance[4]+=y*z;covariance[5]+=z*z;
 }
 const [xx,xy,xz,yy,yz,zz]=covariance;
 function principal(start,other){
  for(let i=0;i<26;i++){
   const {x,y,z}=start;
   start.set(xx*x+xy*y+xz*z,xy*x+yy*y+yz*z,xz*x+yz*y+zz*z);
   if(other)start.addScaledVector(other,-start.dot(other));
   start.normalize();
  }
  return start;
 }
 const main=principal(new T.Vector3(.71,.55,.44));
 const other=principal(new T.Vector3(.32,-.61,.73),main);
 const normal=new T.Vector3().crossVectors(main,other).normalize();
 if(normal.lengthSq()<.5)return;
 const basis=new T.Matrix4().makeBasis(main,other,normal);
 model.quaternion.premultiply(new T.Quaternion().setFromRotationMatrix(basis).invert());
 model.rotateOnWorldAxis(new T.Vector3(0,0,1),id.startsWith("dagger")?.57:1.02);
}

export async function loadFalWeapon(url,id,shape,length,resting=false){
 if(!cache.has(url)){
  const promise=loader.loadAsync(url).then(({scene})=>prepareFalWeapon(scene,id)).catch(error=>{cache.delete(url);throw error});
  cache.set(url,promise);
 }
 const model=(await cache.get(url)).clone(true);
 if(model.userData.restoredBamboo){if(resting)bambooBowString(model);}
 else{
  orient(model,id);
  model.rotateOnWorldAxis(new T.Vector3(0,0,1),Math.PI/2-(id.startsWith("dagger")?.57:1.02));
 }
 const bounds=new T.Box3().setFromObject(model,true);
 const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const scale=length/size.y;
 const gripOffset=shape==="bow"?0:shape==="knife"?length*.25:length*.30;
 model.scale.multiplyScalar(scale);
 model.position.multiplyScalar(scale).sub(center.multiplyScalar(scale));
 model.position.y+=gripOffset;
 model.traverse(node=>{if(node.isMesh)node.userData.falWeapon=true});
 return model;
}
