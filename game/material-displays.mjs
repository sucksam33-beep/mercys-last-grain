import * as THREE from "./vendor/three/three.module.min.js";

export function createMaterialDisplays(loader){
 const root=new THREE.Group(),cache=new Map(),visible=new Map();
 const plane=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
 const rgba=new Uint8Array(32*32*4);
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){
  const i=(y*32+x)*4,r=Math.hypot((x-15.5)/16,(y-15.5)/16);
  rgba.set([37,33,26,Math.round(59*Math.max(0,1-r)**1.5)],i);
 }
 const shadowMap=new THREE.DataTexture(rgba,32,32);
 shadowMap.needsUpdate=true;
 const shadowMaterial=new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 let region=-1,placements=[],dirtyAt=0,pending=0;
 function dispose(scene){
  scene.traverse(mesh=>{
   if(!mesh.isMesh)return;
   mesh.geometry.dispose();
   for(const material of [mesh.material].flat()){
    for(const value of Object.values(material))if(value?.isTexture)value.dispose();
    material.dispose();
   }
  });
 }
 function begin(nextRegion){
  root.clear();visible.clear();placements=[];
  if(nextRegion===region)return;
  for(const entry of cache.values())if(entry.scene)dispose(entry.scene);
  cache.clear();region=nextRegion;dirtyAt=0;
 }
 function add(item){placements.push(item)}
 function load(key,url){
  const entry={scene:null,size:null};
  cache.set(key,entry);pending++;
  loader.loadAsync(url??"assets/crafting-models/"+key+".glb").then(({scene})=>{
   if(cache.get(key)!==entry){dispose(scene);return}
   const bounds=new THREE.Box3().setFromObject(scene),size=bounds.getSize(new THREE.Vector3());
   if(!Number.isFinite(size.length())||size.length()<.0001){dispose(scene);return}
   const center=bounds.getCenter(new THREE.Vector3());
   scene.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));
   scene.traverse(mesh=>{
    if(!mesh.isMesh)return;
    for(const mat of [mesh.material].flat()){
     mat.roughness=Math.max(.86,mat.roughness??.86);
     mat.metalness=Math.min(.14,mat.metalness??0);
     mat.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader
       .replace("#include <map_fragment>","#include <map_fragment>\n float specimenLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)); diffuseColor.rgb=mix(vec3(specimenLuma),diffuseColor.rgb,.73);")
       .replace("#include <opaque_fragment>","outgoingLight+=diffuseColor.rgb*.15;\n#include <opaque_fragment>");
     };
    }
   });
   entry.scene=scene;entry.size=size;
   if(placements.some(item=>item.key===key&&item.replaceFallback))dirtyAt=performance.now()+190;
  }).catch(error=>console.warn("재료 모델을 불러오지 못했습니다.",key,error)).finally(()=>pending--);
 }
 function build(item,entry){
  const group=new THREE.Group(),model=entry.scene.clone(true),{size}=entry;
  const scale=Math.min(item.width/Math.max(size.x,size.z,.0001),item.height/Math.max(size.y,.0001));
  const fitted=new THREE.Group();fitted.scale.setScalar(scale);fitted.add(model);group.add(fitted);
  const contact=new THREE.Mesh(plane,shadowMaterial);
  contact.scale.set(size.x*scale*1.22,1,size.z*scale*1.22);contact.position.y=.008;
  group.add(contact);
  group.position.set(item.x,item.y,item.z);group.rotation.y=item.yaw;
  root.add(group);return group;
 }
 function update(player){
  const eligible=placements.filter(item=>Math.hypot(player[0]-item.x,player[2]-item.z)<34);
  for(const item of eligible){
   if(!cache.has(item.key)&&pending<4)load(item.key,item.url);
   const entry=cache.get(item.key);
   if(entry?.scene&&!visible.has(item))visible.set(item,build(item,entry));
  }
  const near=new Set(eligible);
  for(const [item,group] of visible)group.visible=near.has(item);
 }
 function changed(){
  if(!dirtyAt||performance.now()<dirtyAt)return false;
  dirtyAt=0;
  return true;
 }
 return {root,begin,add,update,changed,ready:key=>Boolean(cache.get(key)?.scene)};
}
