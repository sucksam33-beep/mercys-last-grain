import * as THREE from "./vendor/three/three.module.min.js";
import {refineWildlife} from "./WildlifeAnatomy.mjs?v=behavior";

const districts=["asagi","brunnen","santa-lucia","juniperwell","beaverton","saint-aurel","ambaro","karuk"];
// Adult nose-to-tail lengths, ordered as in each district's wildlife list.
const lengths=[
 [.65,1.65,1.75,1.95,2.65],[.87,1.8,1.55,2.15,3.05],
 [.46,1.03,1.33,1.65,3.05],[1.05,1.05,1.92,2.45,3.05],
 [.48,.69,1.55,2.45,3.15],[.65,.85,1.43,3.4,2.85],
 [.59,1.38,1.69,2.45,3.45],[.60,1.7,1.55,2.9,5.0]
];
// These animals face screen right in the asset contact sheet. The rest face left.
const reverseFacing=new Set(["brunnen-01","juniperwell-02","beaverton-02","saint-aurel-04","karuk-02","karuk-05"]);
const groundBounce=[0x918966,0x8c906e,0xbb8b5e,0x938463,0x7d8b72,0x727e65,0xa29b6a,0x97a6ae];

function tuneWildlifeMaterial(material,uniforms,hare=false){
 material.metalness=0;
 material.roughness=Math.max(.85,material.roughness??.85);
 if(!material.isMeshStandardMaterial)return;
 material.customProgramCacheKey=()=>hare?"regional-wildlife-hare":"regional-wildlife-v1";
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.uniforms.wildWaterline=material.userData.wildWaterline??={value:-1000};
  shader.uniforms.wildMotion=material.userData.wildMotion??={value:new THREE.Vector3()};
  shader.vertexShader=shader.vertexShader
   .replace("#include <common>","#include <common>\nvarying vec3 vWildPosition; attribute vec3 wildHead; attribute vec4 wildFoot; uniform vec3 wildMotion;")
   .replace("#include <begin_vertex>","#include <begin_vertex>\ntransformed+=wildHead*wildMotion.x; transformed+=wildFoot.xyz*sin(wildMotion.y+wildFoot.w)*wildMotion.z;")
   .replace("#include <worldpos_vertex>","#include <worldpos_vertex>\nvWildPosition=(modelMatrix*vec4(transformed,1.0)).xyz;");
  if(hare)shader.vertexShader=shader.vertexShader
   .replace("#include <common>","#include <common>\nattribute vec3 hareFlex; uniform vec3 wildAir;")
   .replace("#include <begin_vertex>","#include <begin_vertex>\nfloat idle=wildAir.y*1.12+modelMatrix[3].x*.67+modelMatrix[3].z*.47; transformed+=hareFlex*(sin(idle)*.48+pow(max(0.,sin(idle*.59)),11.)*.62);");
  shader.fragmentShader=shader.fragmentShader
   .replace("#include <clipping_planes_fragment>","#include <clipping_planes_fragment>\nif(vWildPosition.y<wildWaterline)discard;")
   .replace("#include <common>",`#include <common>
varying vec3 vWildPosition;
uniform vec3 wildGround,wildFog,wildEye;
uniform vec4 wildClimate;
uniform float wildWaterline;
uniform vec3 wildAir;
float wildHash(vec2 p){
 p=fract(p*vec2(.1031,.0973));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);
}
float wildNoise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(wildHash(i),wildHash(i+vec2(1,0)),f.x),mix(wildHash(i+vec2(0,1)),wildHash(i+1.),f.x),f.y);
}`)
   .replace("#include <color_fragment>",`#include <color_fragment>
float wildLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
diffuseColor.rgb=mix(vec3(wildLuma),diffuseColor.rgb,.86-wildClimate.y*.12);
diffuseColor.rgb=mix(diffuseColor.rgb,sqrt(max(diffuseColor.rgb,vec3(0.0)))*.44,.16);
`)
   .replace("#include <opaque_fragment>",`
float wildUp=normalize(inverseTransformDirection(normal,viewMatrix)).y;
float wildBounce=(1.-smoothstep(-.35,.76,wildUp))*(.17+.10*wildClimate.x);
vec3 wildBounceTint=mix(vec3(1.),wildGround/max(dot(wildGround,vec3(.2126,.7152,.0722)),.12),wildBounce);
float wildExposure=mix(.80,1.08,wildClimate.z)*(1.-.16*wildClimate.y);
outgoingLight*=wildBounceTint*wildExposure;
#include <opaque_fragment>`)
   .replace("#include <fog_fragment>",`
float wildLayer=exp(-max(vWildPosition.y-wildEye.y,0.)*.029);
float wildDrift=.75+.25*wildNoise((wildEye.xz+vWildPosition.xz)*.006+vec2(wildAir.y*.017*wildAir.z,0.));
float wildDensity=.00104+wildClimate.w*.00036+wildAir.x*(.0017+.014*wildLayer)*wildDrift;
float wildHaze=1.-exp(-distance(wildEye,vWildPosition)*wildDensity);
gl_FragColor.rgb=mix(gl_FragColor.rgb,wildFog,wildHaze);`);
 };
}

function disposeModel(model){
 const resources=new Set();
 model.traverse(node=>{
  if(!node.isMesh)return;
  resources.add(node.geometry);
  for(const material of [].concat(node.material)){
   resources.add(material);
   for(const value of Object.values(material))if(value?.isTexture)resources.add(value);
  }
 });
 for(const resource of resources)resource.dispose();
}

export function createWildlifeModels(loader){
 const root=new THREE.Group();
 const models=new Map();
 const uniforms={
  wildGround:{value:new THREE.Color()},wildFog:{value:new THREE.Vector3()},wildEye:{value:new THREE.Vector3()},
  wildClimate:{value:new THREE.Vector4()},wildAir:{value:new THREE.Vector3()}
 };
 const shadowGeometry=new THREE.PlaneGeometry(2,2);
 const shadowMaterial=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,
  vertexShader:`varying vec2 spot;void main(){spot=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec2 spot;void main(){
   float r=dot(spot,spot);
   gl_FragColor=vec4(.065,.058,.046,(1.-smoothstep(.08,1.,r))*.34);
  }`
 });
 const up=new THREE.Vector3(0,0,1),normal=new THREE.Vector3();
 let district=-1;

 function begin(region){
  if(district!==region){
   district=region;
   for(const {instances,model,young} of models.values()){
    if(!instances)continue;
    for(const instance of instances.values()){
     root.remove(instance);
     for(const material of instance.userData.materials)material.dispose();
    }
    young.traverse(node=>{if(node.isMesh)node.geometry.dispose()});
    disposeModel(model);
   }
   models.clear();
  }
  root.visible=true;
  for(const {instances} of models.values())if(instances)
   for(const instance of instances.values())instance.visible=false;
 }

 function place(region,index,x,y,z,rotation,member=0,ageScale=1,shape=[1,1,1],coat=[1,1,1],water=null){
  if(district!==region)return null;
  const prior=models.get(index);
  if(!prior||(prior.retryAt<=performance.now()&&prior.attempt<3)){
   const id=districts[region]+"-"+String(index+1).padStart(2,"0");
   const pending={attempt:(prior?.attempt??0)+1};
   models.set(index,pending);
   loader.loadAsync("assets/wildlife/"+id+".glb").then(({scene:model})=>{
    if(models.get(index)!==pending){disposeModel(model);return}
    model.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(model,true);
    const size=bounds.getSize(new THREE.Vector3());
    const width=Math.max(size.x,size.z);
    if(!Number.isFinite(width)||width<.001||size.y<.001){
     disposeModel(model);
     pending.retryAt=Infinity;
     return;
    }
    const scale=lengths[region][index]/width;
    const broadX=size.x>=size.z;
    const yaw=(broadX?Math.PI:Math.PI*.5)+(reverseFacing.has(id)?Math.PI:0);
    const originals=new Set();
    model.traverse(node=>{if(node.isMesh)originals.add(node.geometry)});
    const young=model.clone(true);
    refineWildlife(young,bounds,yaw,region,index,true);
    refineWildlife(model,bounds,yaw,region,index);
    for(const geometry of originals)geometry.dispose();
    const boundsByAge=[];
    for(const variant of [model,young]){
     variant.updateMatrixWorld(true);
     const fitted=new THREE.Box3().setFromObject(variant,true);
     const center=fitted.getCenter(new THREE.Vector3());
     center.y=fitted.min.y;
     variant.position.sub(center);
     const dimensions=fitted.getSize(new THREE.Vector3()).multiplyScalar(scale);
     boundsByAge.push({height:dimensions.y,length:Math.max(dimensions.x,dimensions.z),width:Math.min(dimensions.x,dimensions.z)});
    }
    model.traverse(node=>{
     if(!node.isMesh)return;
     for(const material of [].concat(node.material))tuneWildlifeMaterial(material,uniforms,region===0&&index===0);
    });
    Object.assign(pending,{instances:new Map(),model,young,scale,yaw,boundsByAge});
   }).catch(error=>{
    if(models.get(index)!==pending)return;
    pending.retryAt=performance.now()+1500*pending.attempt;
    console.warn("Wildlife model unavailable:",id,error);
   });
  }
  const entry=models.get(index);
  if(!entry.instances)return null;
  if(!entry.instances.has(member)){
   const instance=new THREE.Group();
   const animal=new THREE.Group();
   const variant=(ageScale<1?entry.young:entry.model).clone(true);
   const dimensions=entry.boundsByAge[ageScale<1?1:0];
   const oriented=new THREE.Group();
   oriented.rotation.y=entry.yaw;
   oriented.add(variant);
   animal.add(oriented);
   animal.scale.fromArray(shape).multiplyScalar(entry.scale*ageScale);
   const materials=new Map();
   const tintMaterial=base=>{
    if(!materials.has(base)){
     const material=base.clone();
     material.color?.multiply(new THREE.Color().setRGB(...coat));
     tuneWildlifeMaterial(material,uniforms,region===0&&index===0);
     materials.set(base,material);
    }
    return materials.get(base);
   };
   variant.traverse(node=>{
    if(node.isMesh)node.material=Array.isArray(node.material)?node.material.map(tintMaterial):tintMaterial(node.material);
   });
   const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);
   instance.add(animal,shadow);
   instance.userData={animal,shadow,ageScale,dimensions,length:dimensions.length*shape[0],width:dimensions.width*shape[2],
    materials:[...materials.values()],travelPhase:0,stepWeight:0,prior:null};
   entry.instances.set(member,instance);
   root.add(instance);
  }
  const instance=entry.instances.get(member);
  instance.visible=true;
  const motion=instance.userData;
  const distance=motion.prior?Math.hypot(x-motion.prior[0],z-motion.prior[1]):0;
  if(distance<1.4)motion.travelPhase=(motion.travelPhase+distance/Math.max(.40,motion.length*.79))%1;
  motion.stepWeight+=((distance>.003&&distance<1.4?1:0)-motion.stepWeight)*.22;
  motion.prior=[x,z];
  const gait=motion.travelPhase*Math.PI*2,weight=motion.stepWeight;
  const wet=water?.wet??0,slip=water?.slip??0;
  motion.animal.position.y=Math.sin(gait)**2*.035*weight*ageScale*(1-wet);
  motion.animal.rotation.x=Math.sin(gait)*(.024*weight+.042*wet);
  motion.animal.rotation.z=Math.cos(gait)*(.028*weight+.035*wet)-slip*.16+(water?.incline??0)+(water?.rear??0);
  for(const material of motion.materials){
   const clip=material.userData.wildWaterline??={value:-1000};
   clip.value=wet>.05?water.waterline-.015:-1000;
   const pose=material.userData.wildMotion??={value:new THREE.Vector3()};
   pose.value.set(water?.head??0,water?.stride??gait,Math.min(1,(water?.speed??0)/3));
  }
  instance.position.set(x,y-.012,z);
  instance.userData.animal.rotation.y=rotation;
  return motion.dimensions;
 }

 function environment(region,fog,eye,weather,daylight,damp,time,terrainAt){
  uniforms.wildGround.value.setHex(groundBounce[region]);
  uniforms.wildFog.value.fromArray(fog);
  uniforms.wildEye.value.fromArray(eye);
  uniforms.wildClimate.value.set(damp,weather.cover,daylight,region===0?1:0);
  uniforms.wildAir.value.set(weather.haze,time*.001,weather.wind);
  for(const {instances} of models.values())if(instances)
   for(const instance of instances.values()){
    if(!instance.visible)continue;
    const {x,y,z}=instance.position;
    const {animal,shadow,ageScale,length,width}=instance.userData;
    const ground=terrainAt(x,z);
    shadow.visible=ground>2.19&&Math.abs(ground-y)<.18;
    if(!shadow.visible)continue;
    normal.set(terrainAt(x-.45,z)-terrainAt(x+.45,z),.9,terrainAt(x,z-.45)-terrainAt(x,z+.45)).normalize();
    shadow.position.set(0,ground-y+.035,0);
    shadow.quaternion.setFromUnitVectors(up,normal);
    shadow.rotateZ(animal.rotation.y);
    shadow.scale.set(length*ageScale*.58,Math.max(.17,width*ageScale*.85),1);
   }
 }

 return {root,begin,place,environment};
}
