import { sampleToolPose,toolHandWeight } from "./tool-poses.mjs";
import * as THREE from "./vendor/three/three.module.min.js";

import {createFittedOutfits} from "./fitted-outfits.mjs";
import { loadFalWeapon } from "./fal-weapon.mjs";
import { GLTFLoader } from "./vendor/three/GLTFLoader.js";

const shieldLoader=new GLTFLoader(),shieldCache=new Map();
const support={heavyaxe:-.24,pick:-.23,staff:.32,hook:.29,spear:-.35,"winter-spear":-.29};
const contactPhase={axe:.56,heavyaxe:.60,pick:.63,shears:.56,rod:.51,staff:.49,javelin:.54,
 bow:.19,longbow:.19,hook:.58,knife:.45,spear:.47,harpoon:.44,"winter-spear":.43};
const strikeTools=new Set(["axe","heavyaxe","pick","knife"]);
const axialTools=new Set(["staff","spear","winter-spear","javelin","harpoon","hook"]);
const rangedTools=new Set(["bow","longbow","javelin","harpoon","rod"]);
const unitY=new THREE.Vector3(0,1,0);
const ease=(a,b,p)=>THREE.MathUtils.smoothstep(p,a,b);

export function createCraftGear(actor){
 const root=new THREE.Group();
 actor.root.add(root);
 const outfits=createFittedOutfits(actor);
 const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.88});
 const wood=material(0x6e5032),iron=material(0x59605d),copper=material(0xa66d46);
 const dyes=[0x7b684c,0x50594c,0xba9670,0x5c6754,0x535960,0x556951,0xaa9764,0x727a80].map(material);
 let last="";
 const groups={};
 const cylinder=(radius,height,mat)=>new THREE.Mesh(new THREE.CylinderGeometry(radius*.91,radius,height,7),mat);
 const box=(w,h,d,mat)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
 function piece(group,mesh,x,y,z){
  mesh.position.set(x,y,z);group.add(mesh);return mesh;
 }
 function weapon(group,shape,region){
  const length={knife:.33,sword:.83,axe:.70,heavyaxe:.88,"winter-spear":1.48,pick:.84,shears:.31,rod:1.72,bow:1.02,longbow:1.44,javelin:1.42,harpoon:1.53,hook:1.36,spear:1.62,staff:1.35}[shape]??1.20;
  group.userData.length=length;
  if(shape==="bow"||shape==="longbow"){
   const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(.13,-length*.5,0),new THREE.Vector3(-.38,0,0),new THREE.Vector3(.13,length*.5,0));
   group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,9,.028,5,false),wood));
   const string=new THREE.BufferGeometry();
   string.setAttribute("position",new THREE.BufferAttribute(new Float32Array(9),3));
   const line=new THREE.Line(string,new THREE.LineBasicMaterial({color:0xcebd96}));
   line.frustumCulled=false;group.add(line);
   group.userData.string=line;
   group.userData.arrow=piece(group,cylinder(.007,.58,wood),0,.05,0);
   group.userData.arrow.rotation.z=Math.PI*.5;
   group.userData.arrow.visible=false;
  }else{
   const splitGrip=shape==="pick"||shape==="heavyaxe";
   if(shape==="rod"){
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.008,.018,length,7,9),wood);
    group.userData.rod=piece(group,shaft,0,length*.34,0);
    group.userData.rodRest=shaft.geometry.attributes.position.array.slice();
   }else if(shape!=="shears"){
    piece(group,cylinder(shape==="knife"?.033:.023,length*(splitGrip?1.12:1),wood),0,length*(splitGrip?.25:.34),0);
   }
   if(["spear","javelin","harpoon","winter-spear"].includes(shape))piece(group,new THREE.Mesh(new THREE.ConeGeometry(.082,.24,4),region===2?copper:iron),0,length*.88,0);
   if(shape==="hook"){
    const bend=new THREE.CubicBezierCurve3(new THREE.Vector3(0,length*.74,0),new THREE.Vector3(.29,length,0),new THREE.Vector3(.28,length*.66,0),new THREE.Vector3(.17,length*.64,0));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(bend,12,.021,6,false),iron));
   }
   if(shape==="knife"){
    const blade=new THREE.Shape();
    blade.moveTo(-.031,.11);blade.lineTo(.048,.11);blade.quadraticCurveTo(.08,.28,-.021,.41);
    blade.lineTo(-.031,.11);
    piece(group,new THREE.Mesh(new THREE.ExtrudeGeometry(blade,{depth:.012,bevelEnabled:false}),copper),0,0,-.006);
   }
   if(shape==="axe"||shape==="heavyaxe")piece(group,box(shape==="heavyaxe"?.34:.24,.19,.045,iron),.10,length*.78,0);
   if(shape==="winter-spear")piece(group,cylinder(.035,.22,dyes[7]),0,.04,0);
   if(shape==="pick"){
    const arc=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.23,length*.72,0),new THREE.Vector3(0,length*.96,0),new THREE.Vector3(.23,length*.74,0));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(arc,8,.023,5,false),iron));
   }
   if(shape==="shears"){
    group.userData.blades=[-1,1].map(side=>{
     const jaw=new THREE.Group();jaw.position.y=.07;group.add(jaw);
     piece(jaw,box(.028,.18,.018,iron),side*.014,.084,0);
     piece(jaw,new THREE.Mesh(new THREE.TorusGeometry(.037,.009,5,10),iron),side*.035,-.095,0);
     return jaw;
    });
   }
   if(shape==="rod")piece(group,cylinder(.049,.035,iron),.032,.15,0).rotation.x=Math.PI/2;
  }
 }
 function build(slot,entry){
  const [id,region,category,shape,model]=entry,mat=dyes[region];
  const group=new THREE.Group();root.add(group);groups[slot]=group;
  if(slot==="weapon"){
   weapon(group,shape,region);
   if(model)loadFalWeapon(model,id,shape,group.userData.length).then(asset=>{
    if(groups.weapon!==group)return;
    for(const part of group.children)if(part!==group.userData.arrow&&part!==group.userData.string)part.visible=false;
    group.add(asset);
   }).catch(error=>console.warn("무기 모델을 불러오지 못했습니다.",id,error));
  }
  else if(slot==="offhand"){
   const face=piece(group,cylinder(.37,.074,wood),0,0,.105);
   face.rotation.x=Math.PI*.5;
   face.scale.z=1.21;
   piece(group,box(.16,.036,.045,iron),0,0,0);
   piece(group,box(.045,.16,.048,wood),.18,-.055,.012);
   if(model){
    if(!shieldCache.has(model))shieldCache.set(model,shieldLoader.loadAsync(model).then(result=>result.scene).catch(error=>{shieldCache.delete(model);throw error;}));
    shieldCache.get(model).then(scene=>{
     if(groups.offhand!==group)return;
     const asset=scene.clone(true),bounds=new THREE.Box3().setFromObject(asset,true);
     const size=bounds.getSize(new THREE.Vector3()),scale=.74/Math.max(size.x,size.y,size.z);
     if(!Number.isFinite(scale))return;
     asset.scale.multiplyScalar(scale);
     asset.position.multiplyScalar(scale).sub(bounds.getCenter(new THREE.Vector3()).multiplyScalar(scale));
     asset.position.z=.10;
     asset.traverse(node=>{if(node.isMesh)node.userData.falWeapon=true;});
     for(const part of group.children)part.visible=false;
     group.add(asset);
    }).catch(error=>console.warn("방패 모델을 불러오지 못했습니다.",id,error));
   }
  }
  else if(slot==="head"){
   piece(group,cylinder(region===6?.31:.17,.055,mat),0,.13,0);
   piece(group,cylinder(.156,.18,mat),0,.14,0);
  }else if(slot==="torso"){
   piece(group,box(.47,.39,.245,mat),0,-.13,0);
   if(category===4)piece(group,box(.36,.23,.05,region===4?iron:mat),0,-.13,.143);
  }else if(slot==="arms"||slot==="feet"){
   for(const side of [-1,1])piece(group,box(.12,slot==="feet"?.19:.25,.15,category===4?copper:mat),side*(slot==="feet"?.13:.28),0,0);
  }
 }
 const point=new THREE.Vector3(),axis=new THREE.Vector3(),rootRotation=new THREE.Quaternion();
 let launch=null,fishing=null,weaponName=null;
 function update(gear,pose){
  const tool=sampleToolPose(pose);
  outfits.update(gear);
  const key=JSON.stringify(gear);
  if(key!==last){
   root.traverse(o=>{if(o.isMesh&&!o.userData.falWeapon)o.geometry.dispose()});root.clear();
   for(const slot of Object.keys(groups))delete groups[slot];
   for(const [slot,entry] of Object.entries(gear??{}))if(slot!=="liner"&&slot!=="coatTier")build(slot,entry);
   last=key;
  }
  launch=fishing=null;weaponName=gear?.weapon?.[0]??null;
  root.visible=Boolean(gear);
  if(!gear)return;
  const scale=actor.root.getWorldScale(point).x||1;
  const bow=["bow","longbow"].includes(gear.weapon?.[3]);
  const weaponHand=bow||pose?.motion!=="shield"&&pose?.hand==="left"?0:1;
  const anchors={weapon:actor.arms[weaponHand][2],offhand:actor.arms[0][2],head:actor.bones.find(bone=>/head$/i.test(bone.name)),torso:actor.spine,arms:actor.spine,feet:actor.hips};
  const offsets={weapon:.02,offhand:0,head:0,torso:.26,arms:.15,feet:-.77};
  for(const [slot,group] of Object.entries(groups)){
   const bone=anchors[slot];
   if(bone)actor.root.worldToLocal(bone.getWorldPosition(point));else point.set(0,slot==="head"?1.7:1.3,0);
   group.position.copy(point);
   group.position.y+=offsets[slot]/scale;
   group.scale.setScalar(1/scale);
   group.rotation.set(slot==="weapon"&&tool&&pose.motion!=="shield"?tool[6]:0,slot==="weapon"&&bow?Math.PI*.5:0,slot==="weapon"?(tool&&bow?-.06:-.42):0);
   group.visible=!outfits.ready(slot);
  }
  if(groups.offhand){
   const shield=groups.offhand,guard=pose?.motion==="shield";
   const raise=guard?ease(0,1,pose.raise??1):0;
   const recoil=guard?pose.recoil??0:0;
   const yaw=actor.root.rotation.y-actor.forward;
   const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
   const normal=forward.clone();
   if(pose?.target&&guard){
    const threat=new THREE.Vector3().fromArray(pose.target).sub(actor.root.position);
    threat.y=0;
    if(threat.lengthSq()>.01)normal.lerp(threat.normalize(),.74).normalize();
   }
   const left=actor.arms[0][0].getWorldPosition(new THREE.Vector3());
   const right=actor.arms[1][0].getWorldPosition(new THREE.Vector3());
   const outside=left.clone().sub(right).normalize();
   const center=left.lerp(right,.5);
   actor.poseGrip(0,.83);
   if(raise>.001){
    const brace=center.addScaledVector(normal,.47-.09*recoil).addScaledVector(outside,.075);
    brace.y-=.24+.035*recoil;
    actor.lockToolPalm(0,brace,null,{closed:.83,weight:raise});
   }
   const grip=actor.toolPalm(0);
   shield.position.copy(actor.root.worldToLocal(grip.clone()));
   const faceNormal=outside.clone().lerp(normal,raise).normalize();
   const strap=actor.arms[0][1].getWorldPosition(new THREE.Vector3()).sub(grip);
   strap.addScaledVector(faceNormal,-strap.dot(faceNormal));
   // Keep the shield upright while the forearm seats into the strap.
   const across=unitY.clone().cross(faceNormal).normalize();
   if(strap.dot(across)<0)across.negate();
   if(strap.lengthSq()>.001)across.lerp(strap.normalize(),.25).normalize();
   const vertical=faceNormal.clone().cross(across).normalize();
   const rotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across,vertical,faceNormal));
   shield.quaternion.copy(actor.root.getWorldQuaternion(rootRotation).invert().multiply(rotation));
   shield.rotateX(-.10*recoil);
  }
  const model=groups.weapon;
  if(!model)return;
  const shape=gear.weapon[3],side=weaponHand;
  const active=Boolean(tool&&pose.motion!=="shield"),phase=active?pose.phase:0;
  const thrown=(shape==="javelin"||shape==="harpoon")&&pose?.released;
  model.visible=!thrown||(shape==="harpoon"&&phase>.87);
  const pinch=shape==="shears";
  if(!model.visible)actor.poseGrip(side,.06);
  else actor.poseGrip(side,pinch?.48:.91);
  const shaft=axis.set(0,1,0).applyQuaternion(model.getWorldQuaternion(new THREE.Quaternion())).normalize();
  const contact=pose?.contactPhase??contactPhase[shape]??.5;
  const aim=active?pose.kind==="draw"?ease(.08,.62,phase):
   ease(contact*.18,contact,phase)*(1-ease(Math.min(.94,contact+.12),1,phase)):0;
  const palm=actor.toolPalm(side,shape==="shears");
  const facing=actor.root.rotation.y-actor.forward;
  const forward=new THREE.Vector3(Math.sin(facing),0,Math.cos(facing));
  const target=pose?.target?new THREE.Vector3().fromArray(pose.target):null;
  const ray=forward.clone();
  if(target){
   ray.copy(target).sub(actor.root.getWorldPosition(new THREE.Vector3()));
   const distance=Math.max(.65,Math.hypot(ray.x,ray.z));
   // Aim long tools from the stance, so an extended hand cannot flip the shaft.
   const chest=shape==="rod"?1.11:shape==="shears"?palm.y-actor.root.position.y:shape==="spear"||shape==="winter-spear"?1.51:1.29;
   const slope=(ray.y-chest)/distance;
   ray.y=0;
   if(ray.lengthSq()<.001)ray.copy(forward);
   ray.normalize();
   ray.y=THREE.MathUtils.clamp(slope,shape==="rod"?-.28:-.66,.42);
  }
  ray.normalize();
  function setWorldRotation(rotation){
   model.quaternion.copy(actor.root.getWorldQuaternion(rootRotation).invert().multiply(rotation));
   shaft.copy(unitY).applyQuaternion(rotation);
  }
  const offset=support[shape];
  const thrust=shape==="spear"||shape==="winter-spear";
  function workingFrame(along,working){
   const x=working.clone().addScaledVector(along,-working.dot(along));
   if(x.lengthSq()<.001)x.set(Math.cos(facing),0,-Math.sin(facing));
   x.normalize();
   const z=x.clone().cross(along).normalize();
   return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,along,z));
  }
  const windup=active?ease(0,contact*.60,phase)*(1-ease(contact*.60,contact,phase)):0;
  if(strikeTools.has(shape)){
   const carry=forward.clone().multiplyScalar(.55-.82*windup);
   carry.y=shape==="knife"?.18:.66+.42*windup;
   const cutting=forward.clone().addScaledVector(unitY,-.48);
   if(shape==="pick")cutting.negate();
   setWorldRotation(workingFrame(carry.normalize(),cutting));
  }else if(axialTools.has(shape)){
   const carry=forward.clone().addScaledVector(unitY,shape==="hook"?.12:.22+.14*windup).normalize();
   const opening=shape==="hook"?unitY.clone().negate():forward.clone().cross(unitY);
   setWorldRotation(workingFrame(carry,opening));
  }
  if(active&&offset&&side===1){
   const natural=actor.toolPalm(0).sub(actor.toolPalm(1)).normalize().multiplyScalar(Math.sign(offset));
   if(natural.lengthSq()>.5&&!axialTools.has(shape)&&!strikeTools.has(shape)){
    const yaw=actor.root.rotation.y-actor.forward;
    const forward=new THREE.Vector3(Math.sin(yaw),.32*(1-Math.sin(Math.PI*phase)),Math.cos(yaw));
    const intended=thrust?forward.lerp(natural,.23).normalize():shaft.clone().lerp(natural,.62).normalize();
    actor.root.getWorldQuaternion(rootRotation).invert();
    const correction=new THREE.Quaternion().setFromUnitVectors(shaft,intended);
    model.quaternion.copy(rootRotation.multiply(correction.multiply(model.getWorldQuaternion(new THREE.Quaternion()))));
    shaft.copy(intended);
   }
  }
  if(aim>0){
   const rotation=model.getWorldQuaternion(new THREE.Quaternion());
   if(bow){
    const rear=ray.clone().negate();
    const upright=unitY.clone().addScaledVector(rear,-unitY.dot(rear)).normalize();
    const normal=rear.clone().cross(upright).normalize();
    const aimed=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(rear,upright,normal));
    setWorldRotation(rotation.slerp(aimed,aim));
   }else{
    const aimed=ray.clone();
    if(strikeTools.has(shape)){
     // The shaft positions the head. The edge or pick point leads the actual strike.
     aimed.y=shape==="knife"?-.20:shape==="pick"?-.66:-.40;
     aimed.normalize();
     const lead=new THREE.Vector3(0,-1,0).addScaledVector(forward,.31);
     const edge=lead.addScaledVector(aimed,-lead.dot(aimed));
     if(edge.lengthSq()<.01)edge.copy(forward).addScaledVector(aimed,-forward.dot(aimed));
     edge.normalize().multiplyScalar(shape==="pick"?-1:1);
     const normal=edge.clone().cross(aimed.normalize()).normalize();
     const desired=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(edge,aimed,normal));
     setWorldRotation(rotation.slerp(desired,aim));
    }else{
     if(!target&&shape==="rod")aimed.y=.23;
     const desired=shape==="hook"?workingFrame(aimed.normalize(),unitY.clone().negate()):new THREE.Quaternion().setFromUnitVectors(shaft,aimed.normalize()).multiply(rotation);
     setWorldRotation(rotation.slerp(desired,aim));
    }
   }
  }
  if(model.visible)actor.orientToolPalm(side,shaft,pinch?.45:.86);
  const socket=new THREE.Vector3(bow?-.125:0,pinch?-.028:thrust?.28:0,0);
  function mount(){
   const palm=actor.root.worldToLocal(actor.toolPalm(side,pinch));
   model.position.copy(palm.sub(socket.clone().applyQuaternion(model.quaternion).multiplyScalar(1/scale)));
   model.updateWorldMatrix(false,true);
  }
  mount();
  if(target&&aim>0&&!rangedTools.has(shape)){
   const length=model.userData.length;
   const tip=({axe:[.22,length*.78,0],heavyaxe:[.27,length*.78,0],pick:[-.23,length*.72,0],
    knife:[.041,.29,0],shears:[0,.22,0],hook:[.18,length*.73,0]})[shape]??[0,length*.88+(thrust?.12:0),0];
   const reach=target.clone().sub(model.localToWorld(new THREE.Vector3(...tip)));
   actor.lockToolPalm(side,actor.toolPalm(side,pinch).add(reach.clampLength(0,.46).multiplyScalar(aim)),shaft,{pinch,closed:pinch?.48:.91});
   mount();
  }
  function lockAssist(hand,local,closed,weight){
   if(weight<=0)return;
   const options={pinch:true,closed,weight};
   for(let i=0;i<3&&weight>.98;i++){
    const target=model.localToWorld(local.clone());
    const reached=actor.lockToolPalm(hand,target,null,options);
    if(reached.distanceToSquared(target)<.000001)return;
    actor.lockToolPalm(side,actor.toolPalm(side).add(reached.sub(target)),shaft);
    mount();
   }
   actor.lockToolPalm(hand,model.localToWorld(local),null,options);
  }
  if(active&&offset&&side===1){
   const shift=shape==="heavyaxe"?-.22-.06*Math.sin(Math.PI*phase):offset;
   const grip=socket.clone().add(new THREE.Vector3(0,shift,0));
   // Leave space in front of the coat for the rear grip during low and cross-body work.
   const primary=actor.toolPalm(1);
   const rear=model.localToWorld(grip.clone());
   const shoulder=actor.arms[1][0].getWorldPosition(new THREE.Vector3());
   const clearance=Math.min(primary.clone().sub(shoulder).dot(forward),rear.clone().sub(shoulder).dot(forward));
   if(Math.min(primary.y,rear.y)<shoulder.y+.06&&clearance<.23){
    actor.lockToolPalm(1,primary.addScaledVector(forward,Math.min(.29,.23-clearance)),shaft);
    mount();
   }
   for(let i=0;i<3&&aim<.82;i++){
    const target=model.localToWorld(grip.clone());
    const reached=actor.lockToolPalm(0,target,shaft);
    if(reached.distanceToSquared(target)<.000004)break;
    const primary=actor.toolPalm(1);
    const intended=reached.sub(primary).normalize().multiplyScalar(Math.sign(shift));
    const angle=shaft.angleTo(intended);
    if(angle>.24)intended.lerp(shaft,1-.24/angle).normalize();
    const correction=new THREE.Quaternion().setFromUnitVectors(shaft,intended);
    actor.root.getWorldQuaternion(rootRotation).invert();
    model.quaternion.copy(rootRotation.multiply(correction.multiply(model.getWorldQuaternion(new THREE.Quaternion()))));
    shaft.copy(intended);
    actor.orientToolPalm(1,shaft,.86);
    mount();
   }
   for(let i=0;i<4;i++){
    const target=model.localToWorld(grip.clone());
    const reached=actor.lockToolPalm(0,target,shaft);
    if(reached.distanceToSquared(target)<.000001)break;
    actor.lockToolPalm(1,actor.toolPalm(1).add(reached.sub(target)),shaft);
    mount();
   }
   const leftTarget=model.localToWorld(grip.clone());
   const leftPalm=actor.lockToolPalm(0,leftTarget,shaft);
   if(leftPalm.distanceToSquared(leftTarget)>.000225){
    const rightShoulder=actor.arms[1][0].getWorldPosition(new THREE.Vector3());
    const leftShoulder=actor.arms[0][0].getWorldPosition(new THREE.Vector3());
    const lateral=leftShoulder.clone().sub(rightShoulder).normalize();
    const center=rightShoulder.clone().lerp(leftShoulder,.5);
    const wanted=actor.toolPalm(1).lerp(leftTarget,.5);
    const baseHeight=THREE.MathUtils.clamp(wanted.y,center.y-.42,center.y+.14);
    const cross=lateral.multiplyScalar(Math.sign(shift));
    const fallback=shaft.clone().lerp(cross,.42).normalize();
    const rotation=model.getWorldQuaternion(new THREE.Quaternion());
    setWorldRotation(new THREE.Quaternion().setFromUnitVectors(shaft,fallback).multiply(rotation));
    for(const depth of [.36,.42,.48]){
     const midpoint=center.clone().addScaledVector(forward,depth);
     midpoint.y=baseHeight;
     actor.lockToolPalm(1,midpoint.addScaledVector(shaft,-shift*.5),shaft);
     mount();
     const target=model.localToWorld(grip.clone());
     if(actor.lockToolPalm(0,target,shaft).distanceToSquared(target)<.0001)break;
    }
   }
  }
  if(model.userData.blades){
   const closed=Math.max(0,1-Math.abs(phase-.56)*5);
   model.userData.blades.forEach((jaw,i)=>{jaw.rotation.z=(i===0?1:-1)*(.34-.29*closed)});
   const weight=active?toolHandWeight(pose,0):0;
   if(weight>0){
    const stem=model.localToWorld(new THREE.Vector3(0,.22,.026));
    actor.lockToolPalm(0,stem,null,{pinch:true,closed:.36,weight});
   }
  }
  if(bow){
   const {string,arrow,length}=model.userData;
   const released=pose?.released;
   const tension=active?(pose.kind==="draw"?phase:released?0:1):0;
   const pull=.13+tension*(shape==="longbow"?.29:.23);
   const positions=string.geometry.attributes.position;
   positions.setXYZ(0,.13,-length*.5,0);positions.setXYZ(1,pull,.052,0);positions.setXYZ(2,.13,length*.5,0);
   positions.needsUpdate=true;
   arrow.position.set(pull-.29,.052,0);arrow.visible=active&&!released;
   if(active&&!released)lockAssist(1,new THREE.Vector3(pull,.052,0),.47,toolHandWeight(pose,1));
   launch=model.localToWorld(new THREE.Vector3(pull-.58,.052,0)).toArray();
  }else{
   const length=model.userData.length;
   if(shape==="rod"){
    const bend=active?-.18*Math.sin(Math.PI*phase)*Math.cos(phase*8):0;
    const {rod,rodRest}=model.userData;
    const positions=rod.geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
     const rise=Math.max(0,(rodRest[i*3+1]+length*.30)/(length*.80));
     positions.setZ(i,rodRest[i*3+2]+bend*rise*rise);
    }
    positions.needsUpdate=true;
    rod.geometry.computeVertexNormals();
    fishing=model.localToWorld(new THREE.Vector3(0,length*.84,bend)).toArray();
    const weight=active?toolHandWeight(pose,0):0;
    if(weight>0)lockAssist(0,new THREE.Vector3(.053,.12,0),.48,weight);
   }
   if(shape==="javelin"||shape==="harpoon")launch=model.localToWorld(new THREE.Vector3(0,.12,0)).toArray();
  }
 }
 return {update,fishingTip:()=>fishing,launchPoint:name=>name===weaponName?launch:null};
}
