import {MathUtils,Quaternion} from "./vendor/three/three.module.min.js";

const {clamp,euclideanModulo:wrap,smoothstep,lerp}=MathUtils;
const attacks=new Set(["light","heavy","skill"]);
const swordNames=new Set(["여행자의 검","짧은 검"]);
const spearMotions=new Set(["spear","winter-spear"]);
const envelope=p=>smoothstep(p,0,.15)*(1-smoothstep(p,.73,1));
const contactSample=(phase,impact,source)=>phase<=impact?
 lerp(0,source,phase/impact):lerp(source,1,(phase-impact)/(1-impact));

export async function loadPlayerMotion(){
 const response=await fetch(new URL("./assets/mercy-motion.json",import.meta.url));
 if(!response.ok)throw Error("Player motion asset: "+response.status);
 return response.json();
}

export class PlayerMotion {
 constructor(actor,clips){
  this.actor=actor;
  this.clips=Object.fromEntries(Object.entries(clips).map(([key,clip])=>[
   key,{...clip,tracks:actor.bones.flatMap(bone=>clip.tracks[bone.name]?[[bone,clip.tracks[bone.name]]]:[])}
  ]));
  this.first=new Quaternion();
  this.second=new Quaternion();
  this.seam=new Quaternion();
  this.airborne=false;
  this.landing=1;
 }
 apply(name,phase,weight,allow=()=>true,seam=0){
  if(weight<=.001)return;
  const clip=this.clips[name];
  const frame=clamp(phase,0,1)*(clip.frames-1);
  const lower=Math.floor(frame),upper=Math.min(lower+1,clip.frames-1);
  for(const [bone,values] of clip.tracks){
   if(!allow(bone.name))continue;
   this.first.fromArray(values,lower*4).normalize();
   this.second.fromArray(values,upper*4).normalize();
   this.first.slerp(this.second,frame-lower);
   if(seam)this.first.slerp(this.seam.fromArray(values).normalize(),seam);
   bone.quaternion.slerp(this.first,weight);
  }
 }
 loop(name,phase,weight,allow){
  // Join the ends over the last tenth of the cycle.
  const seam=smoothstep(phase,.90,1);
  this.apply(name,phase,weight,allow,seam);
 }
 update({active,airborne,dt,speed,combat,hit}){
  if(!active){this.airborne=false;this.landing=1;return;}
  if(this.airborne&&!airborne)this.landing=0;
  this.airborne=airborne;
  this.landing=Math.min(1,this.landing+dt/.34);
  if(airborne)return;
  const actor=this.actor;
  if(hit>=0&&hit<1){
   this.apply("hit",hit,.80*envelope(hit),name=>!/(?:Leg|Foot|Toe)/.test(name));
  }else if(combat){
   const phase=combat.phase??0;
   if(combat.kind==="guard"){
    const raise=combat.raise??1;
    this.apply("guard",lerp(.16,.70,raise),.62*raise,name=>!/(?:Leg|Foot|Toe|Right)/.test(name));
   }else if(combat.kind==="roll"||combat.kind==="backstep"){
    this.apply("dodge",phase,.73*envelope(phase));
   }else if(spearMotions.has(combat.motion)&&combat.attack){
    this.apply("thrust",contactSample(phase,combat.contactPhase??.47,.34),.73*envelope(phase));
   }else if(attacks.has(combat.kind)&&combat.hand==="right"&&swordNames.has(combat.weapon)){
    this.apply("slash",contactSample(phase,combat.contactPhase??.54,.57),.84*envelope(phase));
   }
  }else if(this.landing<1){
   const phase=this.landing;
   const absorb=smoothstep(phase,0,.16)*(1-smoothstep(phase,.38,1));
   this.apply("land",lerp(.20,.94,phase),.74*absorb);
  }else{
   const walk=smoothstep(speed,.06,1.1);
   this.loop("idle",wrap(actor.idleTime/this.clips.idle.duration,1),.58*(1-walk));
   this.loop("walk",wrap(actor.walkPhase-.23,1),.56*walk*(1-actor.runBlend));
   this.loop("run",wrap(actor.runPhase-.28,1),.56*walk*actor.runBlend);
  }
  actor.root.updateMatrixWorld(true);
 }
}
