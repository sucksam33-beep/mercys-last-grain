import {createWhiteHorse} from "./white-horse-rig.mjs?v=fal-coat-strands";
import {PlayerMotion,loadPlayerMotion} from "./PlayerMotion.mjs?v=granary-landing";
import {addGenzoGroom,updateGroomDistance} from "./CharacterGroom.mjs";
import {makeSoilProps} from "./SoilOpening.mjs";
import * as THREE from "./vendor/three/three.module.min.js";
import { GLTFLoader } from "./vendor/three/GLTFLoader.js";
import { createAsagiRiverbank } from "./asagi-riverbank.mjs";
import { createGeneratedExteriors } from "./generated-exteriors.mjs";
import { sampleToolPose,toolHandWeight,toolBrakingLoad } from "./tool-poses.mjs";
import { createCraftGear } from "./craft-gear.mjs";
import { createPlacedWeapons } from "./placed-weapons.mjs";
import { createHammerDisplays } from "./hammer-displays.mjs";
import { createMaterialDisplays } from "./material-displays.mjs";
import { createAsagiProps } from "./asagi-props.mjs";
import { createResidentCast } from "./ResidentCast.mjs";

import {createWildlifeModels} from "./WildlifeModels.mjs?v=behavior";

const loader = new GLTFLoader();
const vector = (...values) => new THREE.Vector3(...values);
const direction = (from, to) => to.clone().sub(from).normalize();
const worldPosition = bone => bone.getWorldPosition(vector());
const smooth = (start,end,time) => THREE.MathUtils.smoothstep(time,start,end);
const up = vector(0,1,0);
const angleDelta = (from,to) => Math.atan2(Math.sin(to-from),Math.cos(to-from));
const wrap = phase => THREE.MathUtils.euclideanModulo(phase,1);

// Touchdown and toe-off measured in the source walk and run cycles.
const stance = [
 {walk:[.23,.76],run:[.28,.53]},
 {walk:[.72,1.23],run:[.76,1.02]}
];
function contactWeight(phase,[start,end]){
 const time=wrap(phase-start);
 return smooth(0,.075,time)*(1-smooth(end-start-.075,end-start,time));
}
const names = bone => bone.name.toLowerCase().replace(/[^a-z0-9]/g,"").replace(/mixamorig\d*/g,"");
function boneEnd(bones, ...suffixes){
 for(const suffix of suffixes){
  const match=bones.find(bone=>names(bone).endsWith(suffix));
  if(match)return match;
 }
}

function setDirection(bone, child, target, bendPlane){
 const origin=worldPosition(bone);
 const from=direction(origin,worldPosition(child));
 const to=direction(origin,target);
 if(from.lengthSq()<.01||to.lengthSq()<.01)return;
 const rotation=new THREE.Quaternion().setFromUnitVectors(from,to).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
 if(bendPlane){
  const {from:oldNormal,to:newNormal}=bendPlane;
  const normal=oldNormal.clone().applyQuaternion(new THREE.Quaternion().setFromUnitVectors(from,to));
  const roll=Math.atan2(to.dot(normal.clone().cross(newNormal)),normal.dot(newNormal));
  rotation.premultiply(new THREE.Quaternion().setFromAxisAngle(to,THREE.MathUtils.clamp(roll,-.78,.78)));
 }
 const parent=bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
 bone.quaternion.copy(parent.multiply(rotation));
 bone.updateWorldMatrix(false,true);
}

function segmentDistance(a,b,c,d){
 const u=b.clone().sub(a),v=d.clone().sub(c),w=a.clone().sub(c);
 const aa=u.lengthSq(),bb=u.dot(v),cc=v.lengthSq(),dd=u.dot(w),ee=v.dot(w);
 const determinant=aa*cc-bb*bb;
 const clamp=THREE.MathUtils.clamp;
 let t=determinant>1e-8?clamp((bb*ee-cc*dd)/determinant,0,1):0;
 const q=clamp((bb*t+ee)/Math.max(cc,1e-8),0,1);
 t=clamp((bb*q-dd)/Math.max(aa,1e-8),0,1);
 return w.addScaledVector(u,t).addScaledVector(v,-q).length();
}

function solveLimb(arm, target, bendDirection, alignRoll=false){
 const [upper,lower,hand]=arm;
 if(!upper||!lower||!hand)return;
 const shoulder=worldPosition(upper), elbow=worldPosition(lower), wrist=worldPosition(hand);
 const a=elbow.distanceTo(shoulder), b=wrist.distanceTo(elbow);
 const axis=direction(shoulder,target);
 const distance=THREE.MathUtils.clamp(shoulder.distanceTo(target),Math.abs(a-b)+.001,a+b-.001);
 if(a<.001||b<.001||axis.lengthSq()<.01)return;
 const bend=bendDirection.clone().addScaledVector(axis,-bendDirection.dot(axis)).normalize();
 const along=(a*a-b*b+distance*distance)/(2*distance);
 const joint=shoulder.clone().addScaledVector(axis,along).addScaledVector(bend,Math.sqrt(Math.max(0,a*a-along*along)));
 const end=shoulder.clone().addScaledVector(axis,distance);
 if(alignRoll)aimArm(arm,joint,end);
 else{
  setDirection(upper,lower,joint);
  setDirection(lower,hand,end);
 }
}

function aimArm(arm,elbow,wrist){
 const [upper,lower,hand]=arm;
 const shoulder=worldPosition(upper);
 const oldElbow=worldPosition(lower);
 const oldNormal=direction(shoulder,oldElbow).cross(direction(oldElbow,worldPosition(hand)));
 const newNormal=direction(shoulder,elbow).cross(direction(elbow,wrist));
 const plane=oldNormal.lengthSq()>.008&&newNormal.lengthSq()>.008?
  {from:oldNormal.normalize(),to:newNormal.normalize()}:null;
 setDirection(upper,lower,elbow,plane);
 setDirection(lower,hand,wrist);
}

function poseHorseRider(actor,horse,facing,speed,dt){
 const forward=vector(Math.sin(facing),0,Math.cos(facing));
 const lateral=vector(Math.cos(facing),0,-Math.sin(facing));
 const stride=horse.stridePhase*Math.PI*2;
 const trot=smooth(2.3,4.0,speed)*(1-smooth(5.6,7.0,speed));
 const gallop=smooth(6.1,11.8,speed);
 const seat=horse.seat();
 const pelvis=seat.clone().addScaledVector(forward,.11*gallop-.026*trot*Math.sin(stride*2));
 pelvis.y+=.10+.068*trot*(.5-.5*Math.cos(stride*2-.35))+.027*gallop*Math.sin(stride);
 actor.place(seat.toArray(),facing,0,dt,false,null);
 if(actor.hips){
  actor.root.position.add(pelvis.clone().sub(worldPosition(actor.hips)));
  actor.root.updateMatrixWorld(true);
 }
 if(actor.spine){
  const lean=.06+.52*gallop+.073*trot*Math.cos(stride*2-.38)+.05*gallop*Math.sin(stride);
  const axis=lateral.clone().applyQuaternion(actor.spine.parent.getWorldQuaternion(new THREE.Quaternion()).invert());
  actor.spine.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,lean));
  actor.spine.updateWorldMatrix(false,true);
 }
 for(const [i,{chain}] of actor.legs.entries()){
  const side=i===0?1:-1,foot=chain[2];
  const boot=foot?.getWorldQuaternion(new THREE.Quaternion());
  const stirrup=seat.clone().addScaledVector(lateral,side*(.42+.035*gallop)).addScaledVector(forward,.21-.11*gallop);
  stirrup.y-=.62-.12*gallop;
  const bend=forward.clone().addScaledVector(lateral,side*.93);
  solveLimb(chain,stirrup,bend);
  if(boot){
   boot.premultiply(new THREE.Quaternion().setFromAxisAngle(lateral,.19+.10*gallop));
   foot.quaternion.copy(foot.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(boot));
   foot.updateWorldMatrix(false,true);
  }
 }
 for(const [i,arm] of actor.arms.entries()){
  const side=i===0?1:-1;
  const grip=seat.clone().addScaledVector(lateral,side*.19).addScaledVector(forward,.46+.31*gallop);
  grip.y+=.48-.08*gallop+.02*trot*Math.sin(stride*2);
  solveLimb(arm,grip,vector(0,-1,0).addScaledVector(lateral,side*.35),true);
 }
}

class RiggedActor {
 constructor(source, walking, running, size){
  this.root=new THREE.Group();
  this.model=source.scene;
  this.root.add(this.model);
  const bounds=new THREE.Box3().setFromObject(this.model,true);
  const center=bounds.getCenter(vector());
  const scale=size/(bounds.max.y-bounds.min.y);
  this.model.scale.multiplyScalar(scale);
  this.model.position.add(vector(-center.x*scale,-bounds.min.y*scale,-center.z*scale));
  this.root.updateMatrixWorld(true);
  this.bones=[];
  this.model.traverse(node=>{
   if(node.isBone)this.bones.push(node);
   if(node.isSkinnedMesh){
    node.frustumCulled=false;
    node.material.emissiveIntensity=.12;
    node.material.metalness=Math.min(node.material.metalness,.35);
   }
  });
  if(!this.bones.length)throw Error("The imported character does not contain a skeleton.");
  this.bind=this.bones.map(bone=>({rotation:bone.quaternion.clone(),position:bone.position.clone()}));
  this.arms=["left","right"].map(side=>{
   const s=side[0];
   return [
    boneEnd(this.bones,side+"arm",side+"upperarm","upperarm"+s),
    boneEnd(this.bones,side+"forearm",side+"lowerarm","forearm"+s,"lowerarm"+s,side+"elbow"),
    boneEnd(this.bones,side+"hand","hand"+s,side+"wrist")
   ];
  });
  if(this.arms.some(arm=>arm.some(bone=>!bone)))throw Error("The imported character is missing arm joints.");
  this.fingers=this.arms.map((arm,index)=>{
   const side=index===0?"Left":"Right";
   return ["Thumb","Index","Middle","Ring","Little"].map(name=>{
    const prefix=side+name;
    const joints=[1,2,3].map(segment=>arm[2].getObjectByName(prefix+segment));
    const tip=arm[2].getObjectByName(prefix+"Tip");
    if(!tip||joints.some(joint=>!joint?.userData.fingerAxis))throw Error("Missing finger rig: "+prefix);
    return {joints,tip,axes:joints.map(joint=>vector(...joint.userData.fingerAxis))};
   });
  });
  this.fingerTipRest=new Map(this.fingers.flat().map(({tip})=>[tip,tip.position.clone()]));
  this.neck=boneEnd(this.bones,"neck");
  this.head=boneEnd(this.bones,"head");
  this.hips=boneEnd(this.bones,"hips","pelvis");
  this.spine=boneEnd(this.bones,"spine");
  this.forwardLean=0;
  this.leanAxis=vector();
  this.leanRotation=new THREE.Quaternion();
  this.armBones=new Set();
  for(const [upper,lower,hand] of this.arms){
   for(const bone of [upper.parent,upper,lower,hand])this.armBones.add(bone.name);
  }
  this.turnLoad=0;
  this.support=null;
  this.lastYaw=0;
  this.legs=["left","right"].map(side=>{
   const chain=[boneEnd(this.bones,side+"upleg",side+"thigh"),boneEnd(this.bones,side+"leg",side+"shin"),boneEnd(this.bones,side+"foot")];
   const foot=chain[2];
   return {chain,sole:foot?Math.max(.065,worldPosition(foot).y):.13,
    rest:foot?.getWorldQuaternion(new THREE.Quaternion()),lock:null};
  });
  this.phase=.31;
  this.runBlend=0;
  this.lastPosition=null;
  this.walkWeight=0;
  this.armWeight=0;
  this.idleTime=0;
  this.striding=Boolean(walking);
  this.runOffset=-.075;
  this.runPhase=0;
  this.walkPhase=0;
  this.lastGrounded=false;
  const toe=boneEnd(this.bones,"lefttoebase","lefttoe","toel");
  const foot=boneEnd(this.bones,"leftfoot","footl");
  this.forward=toe&&foot&&worldPosition(toe).z<worldPosition(foot).z?Math.PI:0;
  this.mixer=new THREE.AnimationMixer(this.model);
  const motion=(clip,stride)=>{
   if(!clip)return null;
   const centered=clip.clone();
   centered.tracks=centered.tracks.filter(track=>
    (track.name.endsWith(".quaternion")&&!this.armBones.has(track.name.slice(0,-11)))||
    (stride&&/hips\.position$/i.test(track.name)));
   const hipTrack=centered.tracks.find(track=>track.name.endsWith(".position"));
   const hips=boneEnd(this.bones,"hips");
   if(hipTrack&&hips){
    const values=hipTrack.values;
    let average=0;
    for(let i=1;i<values.length;i+=3)average+=values[i];
    average/=values.length/3;
    for(let i=0;i<values.length;i+=3){
     values[i]=hips.position.x;
     values[i+1]=hips.position.y+(values[i+1]-average)*.64;
     values[i+2]=hips.position.z;
    }
   }
   return {action:this.mixer.clipAction(centered).play(),duration:centered.duration};
  };
  this.walk=motion(walking?.animations[0]??source.animations[0],!!walking);
  this.run=motion(running?.animations[0],!!running);
 }
 place(position,facing,speed,dt,grounded=false,combat=null){
  this.root.position.fromArray(position);
  this.root.rotation.y=facing+this.forward;
  const root=this.root.position;
  const distance=this.lastPosition?Math.hypot(root.x-this.lastPosition.x,root.z-this.lastPosition.z):0;
  const reset=!grounded||!this.lastGrounded||distance>1.6;
  this.lastGrounded=grounded;
  this.lastPosition=root.clone();
  if(reset){
   this.phase=.31;
   this.runBlend=0;
   this.forwardLean=0;
   this.armWeight=0;
   this.turnLoad=0;
   this.support=null;
   for(const leg of this.legs)leg.lock=null;
  }
  const yaw=this.root.rotation.y;
  const turn=reset||dt<=0?0:angleDelta(this.lastYaw,yaw)/dt;
  this.lastYaw=yaw;
  const loading=grounded?smooth(1.25,4.5,Math.abs(turn))*smooth(.12,.8,speed):0;
  this.turnLoad=THREE.MathUtils.lerp(this.turnLoad,loading,1-Math.exp(-dt*14));
  const running=this.run?smooth(5.2,7.4,speed):0;
  this.runBlend=THREE.MathUtils.lerp(this.runBlend,running,1-Math.exp(-dt*9));
  const walkLean=.26*smooth(.06,1.35,speed);
  const sprintLean=.28*smooth(4.9,9.0,speed)+.038*smooth(9,13.2,speed);
  this.forwardLean=THREE.MathUtils.lerp(this.forwardLean,grounded?walkLean+sprintLean:0,1-Math.exp(-dt*11));
  const stride=THREE.MathUtils.lerp(2.12,4.32+.48*smooth(8.8,13.2,speed),this.runBlend);
  if(!reset)this.phase=wrap(this.phase+Math.max(distance/stride,this.turnLoad*dt*.76));
  this.walkPhase=this.phase;
  this.runPhase=wrap(this.phase+this.runOffset);
  this.bones.forEach((bone,i)=>{
   bone.quaternion.copy(this.bind[i].rotation);
   bone.position.copy(this.bind[i].position);
  });
  const walking=smooth(.06,.95,speed);
  this.walkWeight=this.striding?walking:0;
  this.armWeight=THREE.MathUtils.lerp(this.armWeight,this.walkWeight,1-Math.exp(-dt*13));
  if(grounded)this.idleTime+=dt;
  if(this.walk){
   this.walk.action.setEffectiveWeight(this.walkWeight*(1-this.runBlend));
   this.walk.action.time=this.walkPhase*this.walk.duration;
   if(this.run){
    this.run.action.setEffectiveWeight(this.walkWeight*this.runBlend);
    this.run.action.time=this.runPhase*this.run.duration;
   }
   this.mixer.update(0);
  }
  this.root.updateMatrixWorld(true);
  if(this.neck)this.neck.position.multiplyScalar(.91);
  if(this.head)this.head.position.multiplyScalar(.88);
  for(const [index,arm] of this.arms.entries()){
   arm[2].position.multiplyScalar(.96);
   for(const {joints,tip} of this.fingers[index]){
    joints[0].position.y*=.90;
    for(const segment of joints.slice(1))segment.position.multiplyScalar(.94);
    tip.position.copy(this.fingerTipRest.get(tip)).multiplyScalar(.94);
   }
  }
  this.root.updateMatrixWorld(true);
  if(this.hips&&this.turnLoad>.005){
   if(!this.support?.lock||this.contact(this.legs.indexOf(this.support))<.17){
    this.support=this.legs.filter(leg=>leg.lock).sort((a,b)=>
     this.contact(this.legs.indexOf(b))-this.contact(this.legs.indexOf(a)))[0];
   }
   if(this.support?.lock){
    const lock=this.support.lock;
    const shift=lock.position.clone().sub(worldPosition(this.hips));
    shift.y=0;
    shift.clampLength(0,.48).multiplyScalar(.42*this.turnLoad);
    shift.y=-.10*this.turnLoad;
    const parent=this.hips.parent;
    this.hips.position.copy(parent.worldToLocal(worldPosition(this.hips).add(shift)));
    const lag=THREE.MathUtils.clamp(angleDelta(yaw,lock.yaw),-.58,.58)*this.turnLoad;
    const axis=up.clone().applyQuaternion(parent.getWorldQuaternion(new THREE.Quaternion()).invert());
    this.hips.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,lag));
    this.hips.updateWorldMatrix(false,true);
   }
  }else this.support=null;
  const exertion=combat?.motion?Math.sin(Math.PI*combat.phase):0;
  const toolLean=exertion*({pick:.23,heavyaxe:.19,axe:.13,shears:.18,spear:.11,"winter-spear":.08,staff:.11}[combat?.motion]??.03);
  if(this.spine&&this.forwardLean+toolLean>.001){
   this.leanAxis.set(Math.cos(facing),0,-Math.sin(facing))
    .applyQuaternion(this.spine.parent.getWorldQuaternion(this.leanRotation).invert());
   this.spine.quaternion.premultiply(this.leanRotation.setFromAxisAngle(this.leanAxis,this.forwardLean+toolLean));
   this.spine.updateWorldMatrix(false,true);
  }
  if(grounded&&combat?.motion&&this.hips&&speed<.6){
   const phase=combat.phase;
   const weight=Math.sin(Math.PI*phase);
   const windup=smooth(.04,.28,phase)*(1-smooth(.31,.53,phase));
   const follow=smooth(.29,.59,phase)*(1-smooth(.65,1,phase));
   const forward=vector(Math.sin(facing),0,Math.cos(facing));
   const travel=({axe:.085,pick:.09,heavyaxe:.13,javelin:.14,harpoon:.13,spear:.14,"winter-spear":.10,hook:-.11,rod:.07,staff:.09}[combat.motion]??.025);
   const braking=toolBrakingLoad(combat);
   const shift=travel*(follow-.55*windup)-.035*braking;
   const low=({pick:combat.target?.length?.23:.11,heavyaxe:.10,shears:.17,staff:.06,spear:.06,"winter-spear":.045,shield:.065}[combat.motion]??.035)*weight;
   const turn=({axe:-.20,heavyaxe:-.21,javelin:-.34,harpoon:-.29,knife:-.23,bow:-.28,longbow:-.34}[combat.motion]??0)*weight;
   const parent=this.hips.parent;
   const pos=worldPosition(this.hips).add(vector(0,-low-.023*braking,0)).addScaledVector(forward,shift);
   this.hips.position.copy(parent.worldToLocal(pos));
   const axis=up.clone().applyQuaternion(parent.getWorldQuaternion(new THREE.Quaternion()).invert());
   this.hips.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,turn*(windup-.64*follow)));
   this.hips.updateWorldMatrix(false,true);
  }
  this.toolTorso=null;
  if(combat?.motion&&this.hips){
   const left=worldPosition(this.arms[0][0]),right=worldPosition(this.arms[1][0]);
   const width=left.distanceTo(right);
   const lateral=direction(left,right);
   const chest=left.lerp(right,.5).addScaledVector(up,-.14);
   const pelvis=worldPosition(this.hips).addScaledVector(up,.08);
   this.toolTorso=[-.16,.16].map(offset=>({
    top:chest.clone().addScaledVector(lateral,width*offset),
    bottom:pelvis.clone().addScaledVector(lateral,width*offset*.72),
    radius:THREE.MathUtils.clamp(width*.30,.115,.18)
   }));
  }
  this.poseArms(grounded,combat);
  const grip=grounded?THREE.MathUtils.lerp(.13,.26,this.armWeight):0;
  for(let side=0;side<2;side++)this.poseGrip(side,THREE.MathUtils.lerp(grip,.62,toolHandWeight(combat,side)));
 }
 contact(index){
  const timing=stance[index];
  return THREE.MathUtils.lerp(contactWeight(this.walkPhase,timing.walk),
   contactWeight(this.runPhase,timing.run),this.runBlend);
 }
 poseArms(grounded,combat){
  const tool=sampleToolPose(combat);
  const yaw=this.root.rotation.y-this.forward;
  const forward=vector(Math.sin(yaw),0,Math.cos(yaw));
  const lateral=vector(Math.cos(yaw),0,-Math.sin(yaw));
  const swing=Math.cos((this.phase-.23)*Math.PI*2);
  const forwardArc=THREE.MathUtils.lerp(.29,.43,this.runBlend);
  const backArc=THREE.MathUtils.lerp(.72,1.19,this.runBlend);
  for(const [index,arm] of this.arms.entries()){
   const shoulder=worldPosition(arm[0]);
   const elbow=worldPosition(arm[1]);
   const wrist=worldPosition(arm[2]);
   const side=Math.sign(shoulder.clone().sub(this.root.position).dot(lateral));
   const stride=swing*(index===0?-1:1);
   const relaxedArc=grounded?-.065+(index===0?.043:-.032)+Math.sin(this.idleTime*1.6+index*.95)*.016:0;
   const relaxedFlex=grounded?(index===0?.42:.34):.20;
   const movingArc=Math.max(stride,0)*forwardArc+Math.min(stride,0)*backArc
    -THREE.MathUtils.lerp(.09,.22,this.runBlend);
   const movingFlex=.35+this.runBlend*.57+Math.max(0,stride)*.10;
   let arc=THREE.MathUtils.lerp(relaxedArc,movingArc,this.armWeight);
   let flex=THREE.MathUtils.lerp(relaxedFlex,movingFlex,this.armWeight);
   let spread=.14;
   if(tool){
    const engagement=toolHandWeight(combat,index);
    const phase=combat.phase??0;
    const counter=Math.sin(Math.PI*phase)*(combat.motion==="javelin"||combat.motion==="harpoon"?.24:.10);
    const i=index===0?3:0;
    arc=THREE.MathUtils.lerp(arc+counter,tool[i],engagement);
    flex=THREE.MathUtils.lerp(flex+counter*.55,tool[i+1],engagement);
    spread=THREE.MathUtils.lerp(.09,tool[i+2],engagement);
   }
   else if(combat?.kind==="guard"){arc=.68;flex=.91;}
   else if(combat&&(combat.twoHanded||index===(combat.hand==="left"?0:1))){
    const strike=Math.sin(Math.PI*combat.phase);
    arc+=(combat.twoHanded?.47:0)+strike*(combat.kind==="light"?1.38:1.83);
    flex+=strike*.34;
   }
   const upper=vector(0,-Math.cos(arc),0).addScaledVector(forward,Math.sin(arc))
    .addScaledVector(lateral,side*spread).normalize();
   const lower=vector(0,-Math.cos(arc+flex),0).addScaledVector(forward,Math.sin(arc+flex))
    .addScaledVector(lateral,side*.055).normalize();
   const joint=shoulder.clone().addScaledVector(upper,shoulder.distanceTo(elbow));
   const end=joint.clone().addScaledVector(lower,elbow.distanceTo(wrist));
   if(tool){
    if(this.toolArmClearance(shoulder,joint,end)<0)this.solveToolArm(index,end,upper);
    else{
     setDirection(arm[0],arm[1],joint);
     setDirection(arm[1],arm[2],end);
    }
   }else aimArm(arm,joint,end);
  }
 }
 poseJump(facing,speed,time,velocity){
  const forward=vector(Math.sin(facing),0,Math.cos(facing));
  const lateral=vector(Math.cos(facing),0,-Math.sin(facing));
  const ease=smooth(0,.12,time);
  const tuck=ease*smooth(-4.4,-.45,velocity)*(1-smooth(2.8,5.1,velocity));
  const reach=smooth(.4,5.5,speed);
  const extension=(1-smooth(-4.7,-1.2,velocity))*ease;
  for(const [i,leg] of this.legs.entries()){
   const [,knee,foot]=leg.chain;
   if(!knee||!foot)continue;
   const stagger=i===0?1:-1;
   const target=worldPosition(foot).addScaledVector(forward,tuck*(.055+stagger*(.025+.08*reach))+extension*stagger*.048);
   target.y+=tuck*(i===0?.30:.23)+extension*.035;
   solveLimb(leg.chain,target,forward);
  }
  for(const [i,arm] of this.arms.entries()){
   const side=i===0?1:-1;
   const amount=ease*(.64+.36*tuck);
   const target=worldPosition(arm[2]).addScaledVector(forward,amount*(.10+.08*side*reach))
    .addScaledVector(lateral,amount*side*.07);
   target.y+=amount*.09+tuck*.12;
   const bend=forward.clone().multiplyScalar(.65).addScaledVector(lateral,side*.55);
   solveLimb(arm,target,bend);
  }
  if(this.spine){
   const axis=lateral.clone().applyQuaternion(this.spine.parent.getWorldQuaternion(this.leanRotation).invert());
   this.spine.quaternion.premultiply(this.leanRotation.setFromAxisAngle(axis,(.06+.16*reach)*tuck));
  }
  this.root.updateMatrixWorld(true);
 }
 groundFeet(groundAt){
  const yaw=this.root.rotation.y;
  const facing=yaw-this.forward;
  const forward=vector(Math.sin(facing),0,Math.cos(facing));
  for(const [index,leg] of this.legs.entries()){
   const [hip,knee,foot]=leg.chain;
   if(!hip||!knee||!foot)continue;
   const animated=worldPosition(foot);
   const target=animated.clone();
   const reach=target.clone().sub(this.root.position).dot(forward);
   const frontLimit=THREE.MathUtils.lerp(.37,.52,this.runBlend);
   const backLimit=THREE.MathUtils.lerp(.43,.62,this.runBlend);
   const strideTrim=reach-THREE.MathUtils.clamp(reach,-backLimit,frontLimit);
   target.addScaledVector(forward,-strideTrim*this.walkWeight);
   const phaseContact=this.contact(index);
   const contact=THREE.MathUtils.lerp(1,phaseContact,this.walkWeight);
   const ground=groundAt(target.x,target.z);
   if(phaseContact<.015||this.walkWeight<.06)leg.lock=null;
   else if(!leg.lock&&phaseContact>.015&&this.walkWeight>.06&&Number.isFinite(ground)){
    leg.lock={position:vector(target.x,ground+leg.sole,target.z),yaw};
   }
   let planted=contact;
   let footYaw=yaw;
   if(leg.lock){
    const {position,yaw:lockedYaw}=leg.lock;
    const turn=Math.atan2(Math.sin(yaw-lockedYaw),Math.cos(yaw-lockedYaw));
    const offset=Math.hypot(position.x-target.x,position.z-target.z);
    const loaded=leg===this.support?this.turnLoad:0;
    const twist=1-smooth(.55+loaded*.40,1.25+loaded*.35,Math.abs(turn));
    planted*=twist*(1-smooth(.42,.88,offset));
    // Keep a planted foot in world space until the leg approaches full extension.
    const hipPosition=worldPosition(hip);
    const reach=hipPosition.distanceTo(worldPosition(knee))+worldPosition(knee).distanceTo(animated);
    const extension=hipPosition.distanceTo(position)/Math.max(.01,reach);
    const release=1-smooth(.98,1.02,extension);
   planted=Math.max(planted,phaseContact*twist*release);
    const weight=planted*this.walkWeight;
    target.x=THREE.MathUtils.lerp(target.x,position.x,weight);
    target.z=THREE.MathUtils.lerp(target.z,position.z,weight);
    footYaw-=turn*weight;
   }
   const height=groundAt(target.x,target.z);
   if(!Number.isFinite(height))continue;
   const sole=height+leg.sole;
   target.y=THREE.MathUtils.lerp(animated.y,sole,planted);
   const clearance=THREE.MathUtils.lerp(.17,.30,this.runBlend);
   const excessLift=Math.max(0,target.y-sole-clearance);
   target.y-=excessLift*this.walkWeight*.88;
   // A swinging foot may clear a slope or ledge without snapping down to it.
   target.y=Math.max(target.y,sole);
   target.y=THREE.MathUtils.clamp(target.y,animated.y-.32,animated.y+.38);
   const footRotation=foot.getWorldQuaternion(new THREE.Quaternion());
   if(target.distanceToSquared(animated)>.000004){
    const origin=worldPosition(hip);
    const bend=worldPosition(knee).sub(origin);
    const axis=direction(origin,animated);
    bend.addScaledVector(axis,-bend.dot(axis));
    const kneeYaw=THREE.MathUtils.lerp(yaw,footYaw,.62*this.turnLoad)-this.forward;
    const forward=vector(Math.sin(kneeYaw),0,Math.cos(kneeYaw));
    const pole=bend.lengthSq()>.001?bend.normalize().lerp(forward,.55*this.turnLoad):forward;
    solveLimb(leg.chain,target,pole);
   }
   const sample=(dx,dz)=>{
    const h=groundAt(target.x+dx,target.z+dz);
    return Number.isFinite(h)&&Math.abs(h-height)<.15?h:height;
   };
   const normal=vector(
    THREE.MathUtils.clamp((sample(-.16,0)-sample(.16,0))/.32,-.48,.48),
    1,
    THREE.MathUtils.clamp((sample(0,-.16)-sample(0,.16))/.32,-.48,.48)
   ).normalize();
   const aligned=new THREE.Quaternion().setFromUnitVectors(up,normal)
    .multiply(new THREE.Quaternion().setFromAxisAngle(up,footYaw)).multiply(leg.rest);
   footRotation.slerp(aligned,planted);
   foot.quaternion.copy(foot.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(footRotation));
   foot.updateWorldMatrix(false,true);
  }
 }
 poseGrip(side,closed){
  // Thumb opposition and index flex are fitted to each sculpted hand.
  const pinch=this.striding?
   [[[-.23,.312,.098],[.15,.441,.277]],[[-.23,.34,.115],[.23,.401,.346]]]:
   [[[-.23,.329,.046],[.366,.554,.392]],[[.02,.079,-.105],[.429,.544,.379]]];
  const grip=[...pinch[side],[.45,.76,.48],[.50,.83,.54],[.53,.82,.58]];
  for(const [index,{joints,axes}] of this.fingers[side].entries()){
   joints.forEach((joint,segment)=>{
    const relax=segment===0?.08:.10;
    joint.quaternion.setFromAxisAngle(axes[segment],relax+grip[index][segment]*closed);
   });
  }
  this.arms[side][2].updateWorldMatrix(false,true);
 }
 toolPalm(side,pinch=false){
  if(pinch)return this.gripPoint(side);
  const fingers=this.fingers[side];
  const knuckles=worldPosition(fingers[1].joints[0]).lerp(worldPosition(fingers[4].joints[0]),.48);
  const curled=worldPosition(fingers[2].joints[1]).lerp(worldPosition(fingers[3].joints[1]),.5);
  return knuckles.lerp(curled,.28);
 }
 inwardPalm(side){
  const hand=this.arms[side][2],finger=this.fingers[side][2];
  const wrist=worldPosition(hand),knuckle=worldPosition(finger.joints[0]);
  const axis=direction(wrist,knuckle);
  const normal=finger.axes[0].clone().cross(finger.joints[1].position)
   .applyQuaternion(finger.joints[0].getWorldQuaternion(new THREE.Quaternion()));
  const waist=(this.hips?worldPosition(this.hips):this.root.position.clone()).sub(wrist);
  waist.y=0;
  normal.addScaledVector(axis,-normal.dot(axis));
  waist.addScaledVector(axis,-waist.dot(axis));
  if(normal.lengthSq()<1e-8||waist.lengthSq()<1e-8)return;
  normal.normalize();waist.normalize();
  const twist=Math.atan2(axis.dot(normal.clone().cross(waist)),normal.dot(waist));
  const rotation=new THREE.Quaternion().setFromAxisAngle(axis,twist)
   .multiply(hand.getWorldQuaternion(new THREE.Quaternion()));
  hand.quaternion.copy(hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rotation));
  hand.updateWorldMatrix(false,true);
 }
 orientToolPalm(side,shaft,amount=1){
  const hand=this.arms[side][2],fingers=this.fingers[side];
  const forward=direction(worldPosition(hand),worldPosition(fingers[2].joints[0]));
  const from=direction(worldPosition(fingers[4].joints[0]),worldPosition(fingers[1].joints[0]));
  const axis=shaft.clone();
  from.addScaledVector(forward,-from.dot(forward)).normalize();
  axis.addScaledVector(forward,-axis.dot(forward));
  if(axis.lengthSq()<.025)return;
  axis.normalize();
  if(from.dot(axis)<0)axis.negate();
  const twist=Math.atan2(forward.dot(from.clone().cross(axis)),from.dot(axis));
  const correction=new THREE.Quaternion().setFromAxisAngle(forward,THREE.MathUtils.clamp(twist*amount,-.54,.54));
  correction.multiply(hand.getWorldQuaternion(new THREE.Quaternion()));
  hand.quaternion.copy(hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(correction));
  hand.updateWorldMatrix(false,true);
 }
 toolArmClearance(shoulder,elbow,wrist){
  if(!this.toolTorso)return Infinity;
  // The upper arm shares the shoulder attachment. Test beyond the joint.
  const upperStart=shoulder.clone().lerp(elbow,.47);
  return Math.min(...this.toolTorso.map(({top,bottom,radius})=>Math.min(
   segmentDistance(upperStart,elbow,top,bottom)-radius-.055,
   segmentDistance(elbow,wrist,top,bottom)-radius-.048
  )));
 }
 solveToolArm(side,target,pole){
  const arm=this.arms[side];
  if(!this.toolTorso){solveLimb(arm,target,pole);return}
  const shoulder=worldPosition(arm[0]),elbow=worldPosition(arm[1]),wrist=worldPosition(arm[2]);
  const a=shoulder.distanceTo(elbow),b=elbow.distanceTo(wrist);
  const yaw=this.root.rotation.y-this.forward;
  const outside=vector(Math.cos(yaw),0,-Math.sin(yaw));
  if(shoulder.clone().sub(worldPosition(this.arms[1-side][0])).dot(outside)<0)outside.negate();
  const forward=vector(Math.sin(yaw),0,Math.cos(yaw));
  const safe=shoulder.clone().addScaledVector(outside,.20).addScaledVector(up,-.42).addScaledVector(forward,.14);
  let best=null;
  for(const blend of [0,.18,.37,.62,1]){
   const desired=target.clone().lerp(safe,blend);
   const delta=desired.clone().sub(shoulder);
   if(delta.lengthSq()<1e-6)continue;
   const axis=delta.clone().normalize();
   const distance=THREE.MathUtils.clamp(delta.length(),Math.abs(a-b)+.012,a+b-.012);
   const end=shoulder.clone().addScaledVector(axis,distance);
   const along=(a*a-b*b+distance*distance)/(2*distance);
   const height=Math.sqrt(Math.max(0,a*a-along*along));
   const base=shoulder.clone().addScaledVector(axis,along);
   const bend=pole.clone().addScaledVector(axis,-pole.dot(axis));
   if(bend.lengthSq()<.002)bend.copy(outside).addScaledVector(axis,-outside.dot(axis));
   bend.normalize();
   for(const turn of [0,-.38,.38,-.78,.78,-1.25,1.25,-1.85,1.85,Math.PI]){
    const joint=base.clone().addScaledVector(bend.clone().applyAxisAngle(axis,turn),height);
    const clearance=this.toolArmClearance(shoulder,joint,end);
    const score=clearance-blend*.08-Math.abs(turn)*.003;
    if(!best||score>best.score)best={joint,end,score};
    if(clearance>=.002){best={joint,end,score};break}
   }
   if(best&&this.toolArmClearance(shoulder,best.joint,best.end)>=.002)break;
  }
  if(best){
   setDirection(arm[0],arm[1],best.joint);
   setDirection(arm[1],arm[2],best.end);
  }
 }
 lockToolPalm(side,target,shaft,{pinch=false,closed=.88,weight=1}={}){
  const arm=this.arms[side],hand=arm[2],yaw=this.root.rotation.y-this.forward;
  const out=vector(Math.cos(yaw),0,-Math.sin(yaw));
  if(worldPosition(arm[0]).sub(worldPosition(this.arms[1-side][0])).dot(out)<0)out.negate();
  out.multiplyScalar(.58);
  const pole=vector(0,-1,0).add(out);
  const grip=this.toolPalm(side,pinch).lerp(target,weight);
  this.poseGrip(side,THREE.MathUtils.lerp(.18,closed,weight));
  // Keep the wrist relative to the forearm during the reach, then correct the palm offset.
  const rest=hand.quaternion.clone();
  for(let pass=0;pass<5;pass++){
   const wrist=grip.clone().add(worldPosition(hand)).sub(this.toolPalm(side,pinch));
   this.solveToolArm(side,wrist,pole);
   hand.quaternion.copy(rest);
   hand.updateWorldMatrix(false,true);
   if(shaft)this.orientToolPalm(side,shaft,.80*weight);
  }
  hand.updateWorldMatrix(false,true);
  return this.toolPalm(side,pinch);
 }
 gripPoint(side){
  const [thumb,index]=this.fingers[side];
  return worldPosition(index.tip).lerp(worldPosition(thumb.tip),.42);
 }
 reach(side,target,weight,closed){
  this.poseGrip(side,closed);
  const arm=this.arms[side];
  if(weight>.001){
   const [upper,lower,hand]=arm;
   const shoulder=worldPosition(upper);
   const out=shoulder.clone().sub(this.root.position);
   out.y=0;
   const yaw=this.root.rotation.y-this.forward;
   const forward=vector(Math.sin(yaw),0,Math.cos(yaw));
   out.addScaledVector(forward,-out.dot(forward)).normalize();
   const pole=vector(0,-1,0).addScaledVector(out,.48);
   const desired=this.gripPoint(side).lerp(target,weight);
   const span=worldPosition(upper).distanceTo(worldPosition(lower))+worldPosition(lower).distanceTo(worldPosition(hand));
   const palmReach=this.gripPoint(side).distanceTo(worldPosition(hand));
   const extension=desired.clone().sub(shoulder).clampLength(0,span*.985+palmReach*.78);
   desired.copy(shoulder).add(extension);
   const wrist=worldPosition(hand);
   const rest=arm.map(bone=>bone.quaternion.clone());
   wrist.add(desired.clone().sub(this.gripPoint(side)));
   for(let pass=0;pass<5;pass++){
    arm.forEach((bone,index)=>bone.quaternion.copy(rest[index]));
    upper.updateWorldMatrix(false,true);
    solveLimb(arm,wrist,pole,true);
    const localAxis=forward.clone().cross(up)
     .applyQuaternion(lower.getWorldQuaternion(new THREE.Quaternion()).invert());
    hand.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(localAxis,.24*weight));
    hand.updateWorldMatrix(false,true);
    const error=desired.clone().sub(this.gripPoint(side));
    if(error.lengthSq()<.000004)break;
    wrist.addScaledVector(error,.70);
   }
  }
  return this.gripPoint(side);
 }
}

const keyRingRadius=.048;

function makeKey(){
 const key=new THREE.Group();
 const material=new THREE.MeshStandardMaterial({color:0xc08d4f,metalness:.46,roughness:.32});
 const ring=new THREE.Mesh(new THREE.TorusGeometry(keyRingRadius,.007,12,28),material);
 ring.position.y=-keyRingRadius;
 const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.101,14),material);
 shaft.position.y=-.138;
 const teeth=new THREE.Mesh(new THREE.BoxGeometry(.033,.022,.014),material);
 teeth.position.set(.011,-.184,0);
 key.add(ring,shaft,teeth);
 return key;
}

async function loadCharacter(url,size,walkUrl,runUrl){
 const [gltf,walk,run]=await Promise.all([loader.loadAsync(url),walkUrl?loader.loadAsync(walkUrl):null,
  runUrl?loader.loadAsync(runUrl):null]);
 return new RiggedActor(gltf,walk,run,size);
}

function setStationPosition(model){
 const bounds=new THREE.Box3().setFromObject(model,true);
 const span=bounds.getSize(vector()), middle=bounds.getCenter(vector());
 const alongX=span.x>=span.z;
 const turn=alongX?0:Math.PI/2;
 const factor=14/Math.max(span.x,span.z);
 const transform=new THREE.Group();
 model.position.sub(vector(middle.x,bounds.min.y,middle.z));
 transform.rotation.y=turn;
 transform.scale.set(factor,7.05/span.y,factor);
 transform.add(model);
 return transform;
}


const doorway={minX:5.50,maxX:6.31,minY:.27,maxY:3.03,minZ:-.45,maxZ:1.82};

function stationLeafGeometry(geometry,source){
 const position=geometry.getAttribute("position"),index=geometry.getIndex();
 const corners=new Float32Array(position.count*3),point=vector();
 for(let i=0;i<position.count;i++){
  point.fromBufferAttribute(position,i).applyMatrix4(source);
  point.toArray(corners,i*3);
 }
 const selected=[],count=index?index.count:position.count;
 const low=[doorway.minX,doorway.minY,doorway.minZ],high=[doorway.maxX,doorway.maxY,doorway.maxZ];
 for(let i=0;i<count;i+=3){
  const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,c=index?index.getX(i+2):i+2;
  let inside=true;
  for(let k=0;k<3;k++){
   const x=corners[a*3+k],y=corners[b*3+k],z=corners[c*3+k];
   if(Math.max(x,y,z)<low[k]||Math.min(x,y,z)>high[k]){inside=false;break;}
  }
  if(inside)selected.push(a,b,c);
 }
 const result=new THREE.BufferGeometry();
 for(const [name,attribute] of Object.entries(geometry.attributes))result.setAttribute(name,attribute);
 result.setIndex(selected);
 result.boundingSphere=geometry.boundingSphere;
 return result;
}
function prepareStationDoor(station){
 const parts=[];
 const damp={value:0};
 const uniformBounds=(minZ,maxZ)=>({min:vector(doorway.minX,doorway.minY,minZ),max:vector(doorway.maxX,doorway.maxY,maxZ)});
 const cutMaterial=(material,source,bounds,keep)=>{
  const out=material.clone();
  if(keep)out.side=THREE.DoubleSide;
  out.onBeforeCompile=shader=>{
   shader.uniforms.stationSource={value:source};
   shader.uniforms.stationDoorMin={value:bounds.min};
   shader.uniforms.stationDoorMax={value:bounds.max};
   shader.uniforms.stationDamp=damp;
   shader.vertexShader="uniform mat4 stationSource; varying vec3 vStationSource;\n"+shader.vertexShader.replace(
    "#include <begin_vertex>","#include <begin_vertex>\n vStationSource=(stationSource*vec4(position,1.0)).xyz;");
   shader.fragmentShader="uniform vec3 stationDoorMin,stationDoorMax; uniform float stationDamp; varying vec3 vStationSource;\n"+
    shader.fragmentShader.replace("#include <clipping_planes_fragment>",
     "#include <clipping_planes_fragment>\n bool door=all(greaterThanEqual(vStationSource,stationDoorMin)) && all(lessThanEqual(vStationSource,stationDoorMax));\n if("+ (keep?"!door":"door") +") discard;")
    .replace("#include <color_fragment>",`#include <color_fragment>
     vec3 p=vStationSource;
     float runoff=smoothstep(.32,.88,sin(p.x*9.6+p.z*7.1)*.64+sin(p.x*18.3-p.z*12.7+p.y*.88)*.36);
     float baseWet=(1.-smoothstep(.12,.93,p.y))*(.72+.28*sin(p.x*3.9+p.z*4.2));
     diffuseColor.rgb*=mix(vec3(1.07,1.035,.98),vec3(.64,.73,.64),
      clamp(baseWet*(.26+stationDamp*.43)+runoff*(.12+stationDamp*.17),0.,.8));
    `);
  };
  out.customProgramCacheKey=()=>keep?"asagi-station-door-leaf-v1":"asagi-station-door-shell-v1";
  return out;
 };
 station.updateMatrixWorld(true);
 station.traverse(node=>{if(node.isMesh)parts.push({node,material:node.material,source:node.matrixWorld.clone()})});
 for(const part of parts)part.leafGeometry=stationLeafGeometry(part.node.geometry,part.source);
 const root=new THREE.Group(),hinges=[];
 for(const [min,max,pivotZ,sign] of [[doorway.minZ,.72,doorway.minZ,-1],[.72,doorway.maxZ,doorway.maxZ,1]]){
  const pivot=new THREE.Group();
  pivot.position.set(6.04,0,pivotZ);
  root.add(pivot);hinges.push({pivot,sign});
  const offset=new THREE.Matrix4().makeTranslation(-6.04,0,-pivotZ);
  for(const {leafGeometry,material,source} of parts){
   const leaf=new THREE.Mesh(leafGeometry,cutMaterial(material,source,uniformBounds(min,max),true));
   leaf.matrixAutoUpdate=false;leaf.matrix.copy(offset).multiply(source);
   pivot.add(leaf);
  }
 }
 for(const {node,material,source} of parts)
  node.material=cutMaterial(material,source,uniformBounds(doorway.minZ,doorway.maxZ),false);
 return {root,hinges,progress:0,damp};
}
window.createRiggedScene=async function(canvas,gl){
 if(!(gl instanceof WebGL2RenderingContext))return null;
 const exteriors=createGeneratedExteriors(loader);
 const [prince,genzo,stationResult,motionClips]=await Promise.all([
  loadCharacter("assets/prince.glb",2.44,"assets/prince-walk.glb","assets/prince-run.glb"),
  loadCharacter("assets/genzo.glb",2.19),
  loader.loadAsync("assets/asagi-station.glb").catch(()=>null),
  loadPlayerMotion().catch(error=>{console.warn(error);return null;}),
  exteriors.engineLoaded
 ]);
 const playerMotion=motionClips?new PlayerMotion(prince,motionClips):null;
 addGenzoGroom(genzo);
 const station=stationResult?setStationPosition(stationResult.scene):null;
 const renderer=new THREE.WebGLRenderer({canvas,context:gl,antialias:true});
 renderer.autoClear=false;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.02;
 const scene=new THREE.Scene();
 scene.fog=new THREE.Fog(0xffffff,26,750);
 const sky=new THREE.HemisphereLight(0xe4eaf2,0x79724c,2.15);
 const sun=new THREE.DirectionalLight(0xffdbb0,2.55);
 const sunlight=new THREE.Color(0xffdbb0),nightLight=new THREE.Color(0xb2c4df);
 const key=makeKey(),soilProps=makeSoilProps();
 const camera=new THREE.PerspectiveCamera();
 camera.matrixAutoUpdate=false;
 camera.matrixWorldAutoUpdate=false;
 const wildlifeModels=createWildlifeModels(loader);
 scene.add(sky,sun,key,prince.root,genzo.root,wildlifeModels.root,soilProps.jar,soilProps.lantern);
 const doors=station?prepareStationDoor(station):null;
 if(station)scene.add(station,doors.root);
 const riverbank=createAsagiRiverbank(loader);
 const props=createAsagiProps(loader);
 const materials=createMaterialDisplays(loader);
 scene.add(materials.root);
 const craftingGear=createCraftGear(prince);
 const placedWeapons=createPlacedWeapons();scene.add(placedWeapons.root);
 const hammerDisplays=createHammerDisplays(loader);scene.add(hammerDisplays.root);
 const floatingCargo=new THREE.Mesh(new THREE.BoxGeometry(.52,.25,.37),new THREE.MeshStandardMaterial({color:0x827359,roughness:.96}));
 const flyingShaft=new THREE.Mesh(new THREE.CylinderGeometry(.015,.013,1,6).rotateX(Math.PI*.5),new THREE.MeshStandardMaterial({color:0xb69b6b,roughness:.9}));
 floatingCargo.visible=flyingShaft.visible=false;scene.add(floatingCargo,flyingShaft);
 const harpoonGeometry=new THREE.BufferGeometry();
 harpoonGeometry.setAttribute("position",new THREE.BufferAttribute(new Float32Array(9),3));
 const harpoonLine=new THREE.Line(harpoonGeometry,new THREE.LineBasicMaterial({color:0x938169}));
 harpoonLine.frustumCulled=false;
 scene.add(harpoonLine);
 const whiteHorseModel=createWhiteHorse(loader);scene.add(whiteHorseModel.root);
 const crowd=createResidentCast();
 scene.add(riverbank.root,exteriors.root,props.root,crowd.root);
 let previous=0;
 return {
  beginWildlife:wildlifeModels.begin,
  prepareHorse:whiteHorseModel.load,
  get horseReady(){return whiteHorseModel.ready;},
  placeWildlife:wildlifeModels.place,
  hasStation:!!station,
  residentCastReady:crowd.ready,prepareSoilCast:crowd.prepareSoil,
  beginAsagiProps:props.begin,
  beginMaterialDisplays:materials.begin,
  fishingToolTip:craftingGear.fishingTip,
  toolLaunchPoint:craftingGear.launchPoint,
  addMaterialDisplay:materials.add,
  materialDisplayReady:materials.ready,
  materialDisplaysChanged:materials.changed,
  hammerModelReady:hammerDisplays.ready,
  addAsagiProp:props.add,
  get asagiPropsReady(){return props.ready;},
  get livingPropsReady(){return props.livingReady;},
  hasLivingProp:props.has,
  get hasLocomotive(){return exteriors.hasLocomotive;},
  beginHouseExteriors:exteriors.begin,
  addHouseExterior:exteriors.add,
  houseExteriorReady:exteriors.ready,
  get riverbankAssets(){return riverbank.loaded;},
  get stationDoorProgress(){return doors?.progress??1;},
  draw({width,height,time,projection,view,horse,light,daylight,damp,dusk=0,villageNight=0,inside=false,player,facing,speed,gear,salvage,projectile,placed,construction,constructionPreview,groundAt,terrainAt,asagi,stationOpen,stationY,platformY,filmTime,train,region,fog,weather,residents,namedResidents,eye,combat,airborne,jumpTime,jumpVelocity,hit,soilShot,seedJar}){
   const dt=Math.min(.075,Math.max(0,(time-previous)*.001));
   previous=time;
   camera.projectionMatrix.fromArray(projection);
   camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
   camera.matrixWorldInverse.fromArray(view);
   camera.matrixWorld.copy(camera.matrixWorldInverse).invert();
   sun.position.fromArray(light).multiplyScalar(20);
   const sunlit=THREE.MathUtils.smoothstep(daylight,.11,.60);
   sun.color.copy(nightLight).lerp(sunlight,sunlit);
   sun.color.lerp(sunlight,dusk*.58);
   const cloud=THREE.MathUtils.smoothstep(weather.cover,.28,.92);
   sun.color.lerp(nightLight,cloud*.30);
   sun.intensity=(.33+daylight*2.10+dusk*.39)*(1.-.72*cloud);
   sky.intensity=(.50+daylight*1.47+dusk*.19)*(1.-.08*cloud);
   const exposure=1.02-.16*cloud-.04*weather.rain+(inside?.09:0);
   renderer.toneMappingExposure=THREE.MathUtils.lerp(renderer.toneMappingExposure,exposure,1-Math.exp(-dt*5.5));
   scene.fog.color.setRGB(...fog,THREE.SRGBColorSpace);
   scene.fog.far=750-335*weather.haze-110*cloud;
   riverbank.update(asagi,terrainAt,time);
   exteriors.update(train,player,villageNight);
   props.update(region,player,weather,daylight);
   const {genzo:genzoRoute,...otherResidents}=namedResidents;
   crowd.update(region,residents,otherResidents,time,eye);
   const grounded=filmTime===null;
   wildlifeModels.root.visible=grounded;
   if(grounded)wildlifeModels.environment(region,fog,eye,weather,daylight,damp,time,terrainAt);
   whiteHorseModel.update(grounded?horse:null,dt,groundAt,weather.wind);
   const mounted=Boolean(grounded&&horse?.riding);
   if(mounted)poseHorseRider(prince,whiteHorseModel,facing,horse.speed,dt);
   else prince.place(player,facing,grounded?speed:0,dt,grounded&&!airborne,combat);
   if(grounded&&airborne)prince.poseJump(facing,speed,jumpTime,jumpVelocity);
   playerMotion?.update({active:grounded&&!mounted,airborne,dt,speed,combat,hit});
   if(grounded&&!airborne&&!mounted&&groundAt)prince.groundFeet(groundAt);
   if(grounded&&!mounted&&!combat?.motion){
    const bow=["bow","longbow"].includes(gear?.weapon?.[3]);
    if(!gear?.offhand&&(!gear?.weapon||!bow))prince.inwardPalm(0);
    if(!gear?.weapon||bow)prince.inwardPalm(1);
   }
   craftingGear.update(gear,combat);
   const tetherTarget=combat?.motion==="harpoon"&&combat.released&&(projectile?.position??salvage);
   harpoonLine.visible=Boolean(tetherTarget);
   if(tetherTarget){
    const grip=prince.toolPalm(0);
    const line=harpoonLine.geometry.attributes.position;
    line.setXYZ(0,grip.x,grip.y,grip.z);
    line.setXYZ(1,(grip.x+tetherTarget[0])*.5,(grip.y+tetherTarget[1])*.5-.12,(grip.z+tetherTarget[2])*.5);
    line.setXYZ(2,...tetherTarget);
    line.needsUpdate=true;
   }
   placedWeapons.update(placed??[]);
   flyingShaft.visible=Boolean(projectile);
   if(projectile){flyingShaft.position.fromArray(projectile.position);flyingShaft.rotation.set(-(projectile.pitch??0),projectile.yaw,0,"YXZ");flyingShaft.scale.z=projectile.length;}
   floatingCargo.visible=Boolean(salvage);
   if(salvage){floatingCargo.position.fromArray(salvage);floatingCargo.rotation.y=time*.003;}
   genzo.root.visible=asagi&&(!soilShot||Boolean(soilShot.genzo));
   if(station){
    station.visible=asagi;
    station.position.set(90,stationY,99);
    doors.root.visible=asagi;
    doors.root.position.copy(station.position);
    doors.damp.value=damp;
    doors.progress=THREE.MathUtils.clamp(doors.progress+(stationOpen?1:-1)*dt/0.68,0,1);
    const curve=smooth(0,1,doors.progress);
    for(const {pivot,sign} of doors.hinges)pivot.rotation.y=sign*curve*Math.PI*.49;
   }
   const keyScene=asagi&&filmTime!==null&&filmTime>=3.44&&filmTime<7.48;
   key.visible=keyScene&&filmTime<6.91;
   if(asagi){
    const missionPosition=filmTime===null&&!soilShot?genzoRoute?.points[0]:null;
    genzo.place(missionPosition??[94.46,platformY+.11,117.72],missionPosition?0:-Math.PI/2,0,dt,Boolean(missionPosition));
    if(keyScene){
     const t=filmTime;
     const release=5.26;
     const offer=smooth(3.48,4.92,t)*(1-smooth(5.36,6.11,t));
     const take=smooth(3.91,5.16,t)*(1-smooth(6.98,7.48,t));
     const shared=vector(93.94,platformY+1.42,117.98);
     const giver=genzo.reach(1,shared,offer,1-smooth(release,5.45,t));

     // Each hand grips a separate point on the same ring.
     const approach=smooth(5.51,6.38,t);
     const insert=smooth(6.38,6.91,t);
     key.rotation.set(insert*.26,.38+approach*.45,.04+approach*.45-insert*.31);
     const rim=vector(-keyRingRadius,-keyRingRadius,0).applyQuaternion(key.quaternion);
     const receiveTarget=shared.clone().lerp(giver,1-smooth(release,5.45,t)).add(rim);

     // Bring the key to the mouth of the left coat pocket, then lower it inside.
     const yaw=prince.root.rotation.y-prince.forward;
     const forward=vector(Math.sin(yaw),0,Math.cos(yaw));
     const left=vector(Math.cos(yaw),0,-Math.sin(yaw));
     const hip=worldPosition(prince.hips);
     const pocketMouth=hip.clone().addScaledVector(forward,.22).addScaledVector(left,.38).add(vector(0,.08,0));
     const pocketInside=hip.clone().addScaledVector(forward,.13).addScaledVector(left,.24).add(vector(0,-.13,0));
     const target=receiveTarget.lerp(pocketMouth,approach).lerp(pocketInside,insert);
     const closed=smooth(5.02,5.22,t)*(1-smooth(6.91,7.04,t));
     const receiver=prince.reach(0,target,take,closed);
     key.position.copy(t<release?giver:receiver.clone().sub(rim));
    }
   }
   function positionSoilProps(){
    const jar=soilShot?soilShot.jar:seedJar;
    soilProps.jar.visible=Boolean(jar);
    if(jar){soilProps.jar.position.fromArray(jar);soilProps.jar.rotation.y=soilShot?.princeHands?2.6:0;}
    const lantern=soilShot?.lantern;
    soilProps.lantern.visible=Boolean(lantern);
    if(lantern){
     soilProps.lantern.position.fromArray(lantern);
     soilProps.lantern.scale.setScalar(soilShot?.lanternInHand?.75:1);
     if(soilShot?.lanternInHand){
      const grip=crowd.wrist("child",1);
      if(grip)soilProps.lantern.position.copy(grip).add(vector(.022,-.184,.035));
     }
    }
    if(soilShot?.genzo){
     const {position,yaw}=soilShot.genzo;
     genzo.place(position,yaw,0,dt,true);
     if(lantern){
      const grip=genzo.reach(1,vector(lantern[0],lantern[1]+.06,lantern[2]+.12),.92,.30);
      soilProps.lantern.position.copy(grip).add(vector(.053,-.076,-.070));
     }
    }
    if(soilShot?.princeHands&&jar){
     prince.reach(0,vector(jar[0]-.233,jar[1]+.22,jar[2]+.11),.96,.57);
     prince.reach(1,vector(jar[0]+.233,jar[1]+.22,jar[2]+.11),.96,.57);
    }
   }
   positionSoilProps();
   updateGroomDistance(genzo.head,Math.hypot(genzo.root.position.x-eye[0],genzo.root.position.z-eye[2]));
   renderer.resetState();
   renderer.setViewport(0,0,width,height);
   materials.update(player);
   hammerDisplays.update(construction??[],player,constructionPreview);
   renderer.render(scene,camera);
   renderer.resetState();
  }
 };
};
