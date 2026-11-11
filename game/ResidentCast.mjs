import {updateGroomDistance} from "./CharacterGroom.mjs";
import * as THREE from "./vendor/three/three.module.min.js";

import { attachPortraitHead, loadPortraitFace } from "./ResidentPortrait.mjs";

const asset = name => new URL("assets/residents/"+name,import.meta.url);
const regions = ["asagi","brunnen","santa-lucia","juniperwell","beaverton","saint-aurel","ambaro","karuk"];
const outfits = [
 ["#4c5148","#62503b","#435563"], ["#394251","#655b4c","#43463c"],
 ["#9a7759","#775647","#605440"], ["#5e6047","#784e3d","#474a40"],
 ["#62584d","#54606b","#584639"], ["#727258","#5b6965","#856956"],
 ["#8b6c50","#6f6845","#68555b"], ["#46514d","#676662","#564940"]
];
const {lerp,clamp,smoothstep} = THREE.MathUtils;
const vector = (x,y,z) => new THREE.Vector3(x,y,z);
const builds = [
 [.96,.99,.96], [1.06,1.03,1.03], [1.12,.97,1.09],
 [.95,1.06,.95], [1.04,1.01,1.07], [1.09,1.04,1.02]
];
const namedBuilds = {
 sae:{body:[1.01,1,1.02],head:[.99,1,.96]},
 elise:{body:[1.01,1.015,1.01],head:[.95,.98,.96]},
 grandmother:{body:[1.06,.99,1.04],head:[.94,.98,.96]}
};
const residentHeadSizes=[[.119,.126],[.126,.136],[.120,.138],[.129,.123],[.124,.131],[.122,.140]];
const namedHeadSizes={sae:[.109,.115],elise:[.114,.109],grandmother:[.115,.121]};

async function decode(label){
 const response=await fetch(asset(label+".bin"));
 if(!response.ok)throw Error("Resident mesh "+label+": "+response.status);
 const buffer=await new Response(response.body.pipeThrough(new DecompressionStream("deflate"))).arrayBuffer();
 const data=new DataView(buffer), count=data.getUint32(0,true), length=data.getUint32(4,true), neck=data.getFloat32(8,true);
 const positions=new Float32Array(count*3), normals=new Float32Array(count*3), uv=new Float32Array(count*2);
 let offset=16;
 for(let i=0;i<count;i++,offset+=13){
  for(let k=0;k<3;k++){
   positions[i*3+k]=data.getInt16(offset+k*2,true)/16000;
   normals[i*3+k]=data.getInt8(offset+6+k)/127;
  }
  for(let k=0;k<2;k++)uv[i*2+k]=data.getUint16(offset+9+k*2,true)/65535;
 }
 const indices=new Uint16Array(length);
 for(let i=0;i<length;i++,offset+=2)indices[i]=data.getUint16(offset,true);
 const image=await createImageBitmap(new Blob([buffer.slice(offset)],{type:"image/jpeg"}));
 const map=new THREE.Texture(image);
 map.colorSpace=THREE.SRGBColorSpace;
 map.flipY=false;
 map.anisotropy=4;
 map.needsUpdate=true;
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
 geometry.setAttribute("normal",new THREE.BufferAttribute(normals,3));
 geometry.setAttribute("uv",new THREE.BufferAttribute(uv,2));
 geometry.setIndex(new THREE.BufferAttribute(indices,1));
 return {geometry,neck,material:new THREE.MeshStandardMaterial({map,roughness:.92,side:THREE.DoubleSide})};
}

function joint(parent,x,y,z=0){
 const group=new THREE.Group();
 group.position.set(x,y,z);
 parent.add(group);
 return group;
}

function sharedModel(source){
 const geometry=source.geometry.clone();
 const positions=geometry.attributes.position, index=geometry.index.array, clothing=[];
 for(let i=0;i<index.length;i+=3){
  const a=index[i], b=index[i+1], c=index[i+2];
  if(Math.max(positions.getY(a),positions.getY(b),positions.getY(c))<.861)clothing.push(a,b,c);
 }
 geometry.setIndex(new THREE.BufferAttribute(Uint16Array.from(clothing),1));
 return {...source,geometry};
}

function sharedActor(entry,portrait,body,region,index){
 const fabric=body.material.clone();
 fabric.color.set(outfits[region][index%3]).lerp(new THREE.Color(0xffffff),.68);
 const actor=namedActor({label:"sae"}, {...body,material:fabric});
 actor.named=false;
 const variant=(index*5+region*3)%builds.length, build=builds[variant];
 actor.body.scale.set(...build);
 actor.head.scale.set(1,1,1);
 const [height,width]=residentHeadSizes[variant];
 attachPortraitHead(actor,portrait,entry.label,{height,width,chin:.004});
 actor.root.scale.setScalar(1.78+(index%5)*.022);
 return actor;
}

function segmentDistance(point,a,b){
 const axis=b.clone().sub(a), relative=point.clone().sub(a);
 return relative.addScaledVector(axis,-clamp(relative.dot(axis)/axis.lengthSq(),0,1)).lengthSq();
}

function namedActor(entry,model){
 const root=new THREE.Group(), body=joint(root,0,0);
 const bones=[], guides=[];
 function bone(parent,x,y,z){
  const item=new THREE.Bone();
  item.position.set(x,y,z);
  parent.add(item);
  bones.push(item);
  return item;
 }
 const hip=bone(body,0,.51,0), chest=bone(hip,0,.19,0), head=bone(chest,0,.16,0);
 const legs=[],arms=[];
 const positions=model.geometry.attributes.position;
 let width=0;
 for(let i=0;i<positions.count;i++){
  if(positions.getY(i)>.49&&positions.getY(i)<.79)width=Math.max(width,Math.abs(positions.getX(i)));
 }
 width=clamp(width,.22,.40);
 for(const side of [-1,1]){
  const upper=bone(hip,side*.074,-.01,0), knee=bone(upper,0,-.235,.005), foot=bone(knee,0,-.206,-.005);
  const shoulder=bone(chest,side*width*.48,.06,0), elbow=bone(shoulder,side*width*.27,-.112,0), wrist=bone(elbow,side*width*.21,-.142,.005);
  legs.push({hip:upper,knee,foot});
  arms.push({shoulder,elbow,wrist});
 }
 body.updateMatrixWorld(true);
 const point=vector(0,0,0);
 const world=bones.map(item=>item.getWorldPosition(vector()));
 function guide(item,tip){
  const index=bones.indexOf(item);
  guides[index]=[world[index],tip instanceof THREE.Bone?world[bones.indexOf(tip)]:tip];
 }
 guide(hip,chest);guide(chest,head);guide(head,vector(0,1,0));
 for(let i=0;i<2;i++){
  const {hip:upper,knee,foot}=legs[i], {shoulder,elbow,wrist}=arms[i];
  const side=i===0?-1:1;
  guide(upper,knee);guide(knee,foot);guide(foot,vector(side*.074,.014,.067));
  guide(shoulder,elbow);guide(elbow,wrist);guide(wrist,vector(side*width,.410,.016));
 }
 const skinIndex=new Uint16Array(positions.count*4), skinWeight=new Float32Array(skinIndex.length);
 const namedLegMix=entry.label==="sae"?1:.74;
 if(!model.geometry.hasAttribute("skinIndex")){
 const handBlend=new Float32Array(positions.count);
 const armInfluences=new Float32Array(positions.count);
 for(let i=0;i<positions.count;i++){
  point.fromBufferAttribute(positions,i);
  const {x,y}=point, side=x<0?0:1, weights=new Map();
  const add=(item,weight)=>{const index=bones.indexOf(item);weights.set(index,(weights.get(index)??0)+weight);};
  function chain(items,weight){
   const scores=items.map(item=>{const distance=segmentDistance(point,...guides[bones.indexOf(item)]);return 1/(.00038+distance)**2;});
   const total=scores.reduce((a,b)=>a+b,0);
   items.forEach((item,k)=>add(item,weight*scores[k]/total));
  }
  const sideX=Math.abs(x);
  const handGate=smoothstep(y,.377,.414)*(1-smoothstep(y,.493,.55));
  const outerHand=smoothstep(sideX,width*.70,width*.88)*handGate;
  const sleeve=smoothstep(sideX,width*.46,width*.75)*smoothstep(y,.40,.53)*(1-smoothstep(y,.76,.84));
  const armMix=Math.max(outerHand,sleeve);
  const wristMix=smoothstep(outerHand,.18,.78)*(1-smoothstep(y,.466,.525));
  handBlend[i]=wristMix;
  armInfluences[i]=armMix;
  const legMix=(1-smoothstep(y,.43,.57))*(1-armMix)*namedLegMix;
  const headMix=smoothstep(y,.829,.904)*(1-armMix);
  chain(Object.values(arms[side]),armMix*(1-wristMix));
  add(arms[side].wrist,armMix*wristMix);
  chain(Object.values(legs[side]),legMix);
  add(head,headMix);
  const trunk=Math.max(0,1-armMix-legMix-headMix), chestMix=smoothstep(y,.55,.74);
  add(hip,trunk*(1-chestMix));add(chest,trunk*chestMix);
  const best=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4);
  const total=best.reduce((sum,[,weight])=>sum+weight,0);
  best.forEach(([index,weight],k)=>{skinIndex[i*4+k]=index;skinWeight[i*4+k]=weight/total;});
 }
 // Shorten the hand toward the bind wrist while keeping its UVs and cuff anchors.
 for(let i=0;i<positions.count;i++){
  const weight=handBlend[i]*armInfluences[i];
  if(weight<.001)continue;
  point.fromBufferAttribute(positions,i);
  const wrist=world[bones.indexOf(arms[point.x<0?0:1].wrist)];
  point.y+=(wrist.y-point.y)*.17*weight;
  point.x+=(wrist.x-point.x)*.045*weight;
  positions.setXYZ(i,point.x,point.y,point.z);
 }
 positions.needsUpdate=true;
 model.geometry.computeBoundingBox();
 model.geometry.computeBoundingSphere();
 model.geometry.setAttribute("handBlend",new THREE.BufferAttribute(handBlend,1));
 model.geometry.setAttribute("skinIndex",new THREE.BufferAttribute(skinIndex,4));
 model.geometry.setAttribute("skinWeight",new THREE.BufferAttribute(skinWeight,4));
 }
 const material=model.material.clone();
 material.roughness=.88;
 const handTone={value:new THREE.Color("#9b7761")};
 material.onBeforeCompile=shader=>{
  shader.uniforms.handTone=handTone;
  shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nattribute float handBlend; varying float vHandBlend;")
   .replace("#include <begin_vertex>","#include <begin_vertex>\nvHandBlend=handBlend;");
  shader.fragmentShader=shader.fragmentShader.replace("#include <common>","#include <common>\nvarying float vHandBlend; uniform vec3 handTone;")
   .replace("#include <color_fragment>","#include <color_fragment>\nfloat handLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)); vec3 matched=handTone*(.45+.55*clamp(handLuma/.28,0.0,2.0)); diffuseColor.rgb=mix(diffuseColor.rgb,matched,vHandBlend*.21);");
 };
 material.customProgramCacheKey=()=>"returning-waters-resident-skin";
 const mesh=new THREE.SkinnedMesh(model.geometry,material);
 body.add(mesh);
 mesh.bind(new THREE.Skeleton(bones));
 mesh.frustumCulled=false;
 const build=namedBuilds[entry.label];
 body.scale.set(...build.body);
 head.scale.set(...build.head);
 root.scale.setScalar(entry.label==="grandmother"?1.69:1.88);
 const feet=[];
 for(let i=0;i<positions.count;i+=3)if(positions.getY(i)<.022)feet.push(i);
 return {root,body,head,legs,arms,hip,mesh,feet,handTone,named:true};
}

const shadowResolution=32, shadowPixels=new Uint8Array(shadowResolution**2*4);
for(let y=0;y<shadowResolution;y++)for(let x=0;x<shadowResolution;x++){
 const r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);
 shadowPixels[(y*shadowResolution+x)*4+3]=Math.round(255*(1-smoothstep(r,.12,1)));
}
const shadowTexture=new THREE.DataTexture(shadowPixels,shadowResolution,shadowResolution);
shadowTexture.magFilter=THREE.LinearFilter;
shadowTexture.minFilter=THREE.LinearFilter;
shadowTexture.needsUpdate=true;
const shadowGeometry=new THREE.PlaneGeometry(.91,1.16);
const shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,opacity:.30,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
function addContactShadow(actor){
 const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);
 shadow.rotation.x=-Math.PI/2;
 actor.shadow=shadow;
 actor.root.add(shadow);
}

function pose(actor,position,yaw,stride,effort){
 const step=stride*Math.PI*2, sway=Math.sin(step);
 actor.root.position.set(...position);
 actor.root.rotation.y=yaw;
 actor.body.position.y=(1-Math.cos(step*2))*.014*effort;
 actor.body.rotation.z=Math.sin(step)*.025*effort;
 actor.head.rotation.y=Math.sin(step*.5)*.027;
 actor.head.rotation.z=-actor.body.rotation.z*.38;
 for(let i=0;i<2;i++){
  const phase=step+i*Math.PI;
  const {hip,knee,foot}=actor.legs[i], {shoulder,elbow}=actor.arms[i];
  const lift=Math.max(0,Math.cos(phase));
  const range=.30;
  hip.rotation.x=(Math.sin(phase)*range-lift*.14)*effort;
  knee.rotation.x=(lift*.66+.06)*effort;
  foot.rotation.x=(-hip.rotation.x-knee.rotation.x)*.70;
  shoulder.rotation.z=(i===0?1:-1)*.085;
  shoulder.rotation.x=-Math.sin(phase)*.22*effort;
  elbow.rotation.x=-(.055+Math.max(0,-Math.sin(phase))*.19)*effort;
 }
 actor.root.updateMatrixWorld(true);
 let sole=Infinity;
 for(const vertex of actor.feet){
  actor.mesh.getVertexPosition(vertex,solePoint);
  sole=Math.min(sole,actor.mesh.localToWorld(solePoint).y);
 }
 if(Number.isFinite(sole))actor.root.position.y+=clamp(position[1]-sole,-.13,.10);
 actor.shadow.position.y=(position[1]-actor.root.position.y+.023)/actor.root.scale.y;
}

const solePoint=vector(0,0,0);

function routePose(resident,time){
 const {points,speed,phase}=resident;
 const travel=(time*speed+phase)%2, reverse=travel>=1;
 const progress=reverse?2-travel:travel;
 const cursor=progress*(points.length-1);
 const index=Math.min(points.length-2,Math.floor(cursor));
 const a=points[index], b=points[index+1], t=cursor-index;
 const position=a.map((value,k)=>lerp(value,b[k],t));
 const length=Math.hypot(b[0]-a[0],b[2]-a[2])*(points.length-1);
 const speedMeters=length*speed*1000;
 const direction=Math.atan2(b[0]-a[0],b[2]-a[2]);
 const turn=Math.min(.12,.60*speed*1000);
 const yaw=direction+Math.PI*smoothstep(travel,1-turn,1+turn)
   -Math.PI*.5*(1-smoothstep(travel,0,turn)) + Math.PI*.5*smoothstep(travel,2-turn,2);
 const effort=clamp(speedMeters/.95,.26,1);
 return {position,yaw,stride:(time*speed+phase)*length/lerp(.57,1.24,effort),effort};
}

export function createResidentCast(){
 const root=new THREE.Group(), groups=new Map();
 const sae=decode("sae"), clothing=sae.then(sharedModel);
 clothing.catch(console.warn);
 const roster=fetch(asset("index.json")).then(response=>{
  if(!response.ok)throw Error("Resident index "+response.status);
  return response.json();
 }).catch(error=>{console.warn(error);return [];});
 function ensure(region){
  if(groups.has(region))return groups.get(region);
  const group={actors:[],named:new Map(),ready:false};
  groups.set(region,group);
  const tasks=roster.then(entries=>{
   const villagers=entries.filter(entry=>entry.region===regions[region]);
   const named=entries.filter(entry=>entry.major&&(region===0?entry.label!=="elise":region===1&&entry.label==="elise"));
   const load=async(entry,index)=>{
    const portraitTask=loadPortraitFace(entry.label);
    const bodyTask=entry.major&&entry.label!=="sae"?decode(entry.label).then(sharedModel):clothing;
    const [portrait,body]=await Promise.all([portraitTask,bodyTask]);
    const actor=entry.major?namedActor(entry,body):sharedActor(entry,portrait,body,region,index);
    if(entry.major){
     const [height,width]=namedHeadSizes[entry.label];
     attachPortraitHead(actor,portrait,entry.label,{height,width,chin:.011});
    }
    addContactShadow(actor);
    actor.handTone.value.setRGB(...portrait.mesh.skin.map(value=>value/255),THREE.SRGBColorSpace);
  actor.root.name=entry.label;
    actor.root.visible=false;
    root.add(actor.root);
    return actor;
   };
   const soilRoleLoads=[];
   const roles={irena:"brunnen-12-canal-maintainer",mara:"brunnen-27-lamplighter",renat:"brunnen-18-cooper",genzo:"asagi-01-rice-grower",child:"asagi-02-rail-clerk",keeper:"brunnen-02-lock-keeper"};
   for(const [role,label] of Object.entries(roles)){
    if(!(region===0||region===1||region===7))continue;
    const entry=entries.find(entry=>entry.label===label);
    if(entry)soilRoleLoads.push(load(entry,0).then(actor=>{if(role==="child")actor.root.scale.multiplyScalar(.64);group.named.set(role,actor);}).catch(console.warn));
   }
   group.soilRoles=Promise.all(soilRoleLoads);
   for(const entry of named)load(entry,0).then(actor=>group.named.set(entry.label,actor)).catch(console.warn);
   return Promise.all(villagers.map(load));
  });
  group.loading=tasks;tasks.then(actors=>{group.actors=actors;group.ready=actors.length>0;}).catch(console.warn);
  return group;
 }
 let last;
 return {root,ready:region=>ensure(region).ready,
  async prepareSoil(){const group=ensure(0);await group.loading;await group.soilRoles;},
  wrist(label,index){return last?.named.get(label)?.arms[index].wrist.getWorldPosition(new THREE.Vector3());},
  update(region,residents,named,time,eye){
   const group=ensure(region);
   if(last!==group&&last){
    for(const actor of [...last.actors,...last.named.values()])actor.root.visible=false;
   }
   last=group;
   group.actors.forEach((actor,i)=>{
    const resident=residents[i];
    if(!resident){actor.root.visible=false;return;}
    const p=routePose(resident,time);
    actor.root.visible=Math.hypot(p.position[0]-eye[0],p.position[2]-eye[2])<95;
    if(actor.root.visible){pose(actor,p.position,p.yaw,p.stride,p.effort);updateGroomDistance(actor.head,Math.hypot(p.position[0]-eye[0],p.position[2]-eye[2]));}
   });
   for(const [label,actor] of group.named){
    const resident=named[label];
    actor.root.visible=!!resident;
    if(resident){
     const p=routePose(resident,time);pose(actor,p.position,resident.yaw??p.yaw,p.stride,p.effort);updateGroomDistance(actor.head,Math.hypot(p.position[0]-eye[0],p.position[2]-eye[2]));
     if(resident.arms){
      for(const [i,{shoulder,elbow}] of actor.arms.entries()){
       shoulder.rotation.x=resident.arms[i]*-.65;
       elbow.rotation.x=resident.arms[i]*-.38;
      }
      actor.root.updateMatrixWorld(true);
     }
    }
   }
  }
 };
}
