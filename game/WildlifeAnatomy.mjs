import * as THREE from "./vendor/three/three.module.min.js";

// Head length, head width, crown/ear height, chest width, hindquarter width, leg height.
const profiles=[
 [[-.08,-.10,.13,-.04,.21,.06],[.13,-.10,-.08,.14,-.09,-.08],[-.03,-.13,.06,-.09,-.05,.10],[-.10,.17,-.02,.13,.08,-.06],[-.03,.12,.07,.18,-.06,.05]],
 [[-.03,-.06,.04,.05,-.07,.05],[.16,-.08,-.06,.19,-.07,-.09],[.04,.09,-.10,.15,-.05,.05],[.10,-.06,.02,.12,.04,.06],[-.03,.05,.01,.16,-.09,.11]],
 [[-.12,.07,-.14,.08,.12,-.10],[-.12,.04,-.05,.12,-.08,-.10],[.12,-.17,.11,-.15,-.13,.12],[-.06,.11,.04,.14,-.02,.03],[.08,-.14,.03,-.11,-.07,.13]],
 [[-.03,-.08,.10,.13,.13,.07],[-.08,.13,-.11,.10,.18,-.12],[-.01,-.11,.15,-.09,-.04,.10],[.08,.03,.02,.16,.02,.08],[-.06,.14,-.08,.22,-.08,-.02]],
 [[-.10,.04,-.05,.13,.15,-.04],[-.10,.14,-.13,.11,.17,-.12],[.03,.08,-.06,.14,-.05,.06],[.09,.01,.02,.17,.02,.09],[-.06,.18,-.06,.24,-.10,-.01]],
 [[.04,-.06,-.04,.07,.12,-.07],[.06,.08,-.10,.11,.16,-.10],[.08,-.11,.11,-.08,-.07,.12],[.12,.15,-.10,.10,.01,-.08],[.01,.15,.04,.16,-.02,.03]],
 [[-.07,-.04,.10,.12,.14,.04],[.09,-.03,.13,.13,-.04,-.06],[.13,-.08,-.04,-.06,-.08,-.07],[.06,-.06,.03,.09,.04,.08],[-.06,.23,-.04,.17,.07,-.08]],
 [[-.08,-.02,.06,.04,.18,.05],[-.09,.13,-.10,.12,.08,-.12],[.01,.09,-.10,.15,.04,.06],[.13,.08,.04,.15,-.09,.15],[-.03,.15,-.06,.18,.06,-.06]]
];
const ornamented=new Set(["0:2","0:4","1:3","1:4","2:3","3:2","3:3","3:4","4:3","4:4","5:4","7:3"]);
const juvenileCoats={
 "0:1":[1.15,1.05,.82],"0:4":[1.18,1.04,.88],"1:1":[1.15,1.05,.82],
 "2:1":[1.21,.97,.78],"3:0":[1.12,1.03,.85],"3:4":[1.20,.99,.83],
 "4:4":[1.20,.99,.83],"5:0":[1.12,1.04,.77],"6:0":[1.16,1.02,.79],"6:3":[1.11,1.02,.92]
};
const smooth=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);

export function refineWildlife(model,bounds,yaw,region,index,young=false){
 const [muzzle,head,ear,chest,haunch,leg]=profiles[region][index];
 const key=region+":"+index,coat=juvenileCoats[key];
 const center=bounds.getCenter(new THREE.Vector3()), size=bounds.getSize(new THREE.Vector3());
 const long=Math.max(size.x,size.z),high=size.y;
 const transform=new THREE.Matrix4(),point=new THREE.Vector3();
 const axis=new THREE.Vector3(0,1,0),inverse=new THREE.Matrix4();
 model.updateMatrixWorld(true);
 model.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.geometry.attributes.position)return;
  // Each age has a single mesh variant shared by every individual of this species.
  mesh.geometry=mesh.geometry.clone();
  const geometry=mesh.geometry,position=geometry.attributes.position;
  const prior=geometry.attributes.color;
  const colors=new Float32Array(position.count*3);
  const heads=new Float32Array(position.count*3),feet=new Float32Array(position.count*4);
  const asagiHare=region===0&&index===0;
  const earFlex=asagiHare?new Float32Array(position.count*3):null;
  transform.copy(mesh.matrixWorld);
  inverse.copy(transform).invert();
  const localDirection=new THREE.Matrix3().setFromMatrix4(inverse);
  const headDelta=new THREE.Vector3(),footDelta=new THREE.Vector3();
  const dip=high/long>.66?-1.20:-.71;
  const earVector=asagiHare?new THREE.Vector3(long*.043,0,0).applyAxisAngle(axis,-yaw).applyMatrix3(new THREE.Matrix3().setFromMatrix4(inverse)):null;
  for(let i=0;i<position.count;i++){
   point.fromBufferAttribute(position,i).applyMatrix4(transform).sub(center).applyAxisAngle(axis,yaw);
   const x=point.x/long,y=(point.y+high*.5)/high;
   const face=smooth(.12,.43,x)*smooth(.25,.58,y);
   const crown=smooth(.56,.94,y)*smooth(.09,.29,x);
   const torso=smooth(.19,.53,y)*(1-smooth(.62,.91,y));
   const rear=1-smooth(-.32,.01,x);
   const foot=1-smooth(.03,.36,y);
   point.x+=long*muzzle*face*.20;
   point.z*=1+head*face+torso*(chest*(1-rear)+haunch*rear);
   point.y+=high*(ear*crown*.25+leg*foot*smooth(.03,.29,y)*.23);
   if(asagiHare){
    const earTip=smooth(.68,.96,y)*smooth(-.07,.24,x);
    const hindLeg=rear*smooth(.07,.27,y)*(1-smooth(.35,.68,y));
    point.y+=high*(earTip*.11-hindLeg*.065);
    point.x-=long*hindLeg*.075;
    point.z*=1+hindLeg*.19;
    earFlex.set([earVector.x*earTip,earVector.y*earTip,earVector.z*earTip],i*3);
   }
   if(young){
    point.x-=long*face*.038;
    point.z*=1+face*.13+foot*.10;
    point.y+=high*(face*.035-foot*.045*smooth(0,.22,y));
    if(ornamented.has(key))point.y-=high*smooth(.68,.97,y)*smooth(-.04,.25,x)*.17;
   }
   const flex=smooth(.045,.36,x)*smooth(.19,.57,y);
   const px=point.x-long*.10,py=point.y-high*.035;
   headDelta.set((px*Math.cos(dip)-py*Math.sin(dip)-px)*flex,
    (px*Math.sin(dip)+py*Math.cos(dip)-py)*flex,0).applyAxisAngle(axis,-yaw).applyMatrix3(localDirection);
   heads.set([headDelta.x,headDelta.y,headDelta.z],i*3);
   const step=foot*smooth(.05,.25,Math.abs(x));
   const alternate=(x>0)===(point.z>0)?0:Math.PI;
   footDelta.set(long*.072*step,high*.039*step,0).applyAxisAngle(axis,-yaw).applyMatrix3(localDirection);
   feet.set([footDelta.x,footDelta.y,footDelta.z,alternate],i*4);
   point.applyAxisAngle(axis,-yaw).add(center).applyMatrix4(inverse);
   position.setXYZ(i,point.x,point.y,point.z);
   const upper=smooth(.24,.78,y),mottle=Math.sin(x*39+y*17)*Math.sin(y*28+x*11);
   const variation=1+.035*mottle+.055*(upper-.5);
   const stripe=young&&(key==="0:1"||key==="1:1"||key==="6:1")?
    1+.22*torso*Math.pow(.5+.5*Math.cos(y*58),3):1;
   colors[i*3]=(prior?prior.getX(i):1)*variation*stripe*(young&&coat?coat[0]:1);
   colors[i*3+1]=(prior?prior.getY(i):1)*variation*stripe*(young&&coat?coat[1]:1);
   colors[i*3+2]=(prior?prior.getZ(i):1)*variation*stripe*(young&&coat?coat[2]:1);
  }
  position.needsUpdate=true;
  geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
  geometry.setAttribute("wildHead",new THREE.BufferAttribute(heads,3));
  geometry.setAttribute("wildFoot",new THREE.BufferAttribute(feet,4));
  if(earFlex)geometry.setAttribute("hareFlex",new THREE.BufferAttribute(earFlex,3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  for(const material of [].concat(mesh.material))material.vertexColors=true;
 });
}
