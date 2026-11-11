"use strict";
const wildlifeReactions={
 hare:[9,6,.30,4.9,"hop"],bird:[11,7,.28,4.5,"flutter"],boar:[11,7,.62,5.1,"rush"],
 wolf:[15,9,.81,4.7,"watch"],deer:[15,9,.53,7.0,"bound"],bear:[13,7,.95,4.0,"watch"],
 bison:[13,7,.92,4.5,"rush"],sheep:[13,8,.42,5.3,"bound"],camel:[13,8,.72,4.5,"rush"],
 beaver:[9,6,.28,3.7,"swim"],seal:[13,8,.65,3.5,"swim"],alligator:[12,7,.32,4.1,"swim"],
 cat:[13,7,.66,5.2,"watch"],zebra:[16,10,.40,7.0,"bound"],rhino:[12,7,.92,4.6,"rush"],
 mammoth:[14,8,1.12,3.3,"rush"]
};
// Species that share meshes can still have different reactions.
const wildlifeSpeciesReactions={
 "1:0":[10,6,.20,5.0,"flutter"],"2:2":[12,7,.58,5.3,"watch"],
 "3:0":[13,7,.54,4.6,"flutter"],"3:2":[14,8,.43,6.4,"bound"],"3:3":[16,10,.78,6.0,"bound"],
 "4:0":[9,5,.40,4.0,"flutter"],"4:1":[9.4,6.7,.76,4.6,"burrow"],"4:3":[16,9,.82,5.8,"bound"],
 "5:0":[12,7,.23,4.4,"swim"],"5:1":[8,5,.26,3.6,"swim"],"5:2":[12,7,.83,4.3,"watch"],
 "6:0":[13,8,.32,5.1,"flutter"],"7:0":[10,6,.20,5.3,"hop"],"7:2":[17,10,.92,4.3,"watch"],"7:3":[13,7,.95,5.1,"rush"]
};
function wildlifeJourney(a,b,swim){
 const distance=Math.hypot(b.x-a.x,b.z-a.z);
 const steps=Math.max(1,Math.ceil(distance/.8));
 let y=terrainSurface(a.x,a.z);
 for(let i=1;i<=steps;i++){
  const t=i/steps,x=lerp(a.x,b.x,t),z=lerp(a.z,b.z,t),next=terrainSurface(x,z);
  if(x<5||x>635||z<13||z>407||(!swim&&next<2.06))return false;
  if(Math.abs(next-y)>(swim?1.55:1.12)||supportAt(x,z,next)===null&&next>=2.06)return false;
  y=next;
 }
 return true;
}
function wildlifeTrail(a,b,swim){
 if(wildlifeJourney(a,b,swim))return [b];
 const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||1;
 for(const side of [2.8,-2.8,5.6,-5.6,9,-9]){
  const turn={x:(a.x+b.x)/2-dz/d*side,z:(a.z+b.z)/2+dx/d*side};
  if(wildlifeJourney(a,turn,swim)&&wildlifeJourney(turn,b,swim))return [turn,b];
 }
 return [];
}
function createWildlifeBehavior(animal,site){
 const {region,index}=site;
 const traits=wildlifeSpeciesReactions[region+":"+index]??wildlifeReactions[wildlifeKinds[region][index]];
 const [notice,close,delay,speed,style]=traits;
 const aquatic=style==="swim"||animal.aquatic||site.food==="aquatic";
 const angle=animal.member*2.39996;
 const spread=(site.shelter==="burrow"?.42:.62)*Math.sqrt(animal.member)*(.78+.26*animal.range);
 const offset={x:site.feed.x+Math.cos(angle)*spread,z:site.feed.z+Math.sin(angle)*spread};
 const home=animal.restRock?{x:animal.restRock.x,z:animal.restRock.z}:{x:animal.x,z:animal.z};
 const foodCandidates=[offset,site.feed,home];
 const feed=foodCandidates.find(point=>wildlifeTrail(home,point,aquatic).length)??home;
 const farCover=site.shelter==="grove"?{x:site.cover.x+Math.cos(angle)*spread,z:site.cover.z+Math.sin(angle)*spread}:site.cover;
 const cover=[farCover,site.cover,home].find(point=>wildlifeTrail(feed,point,aquatic).length)??home;
 const feature=animal.climb?15800:region===5&&index===3?18600:animal.waterRoute&&!animal.restRock?(animal.seal?19000:13200):animal.restRock?12000:0;
 return {mode:"food",home,feed,cover,feature,notice,close,delay,speed,style,aquatic,
  burrow:site.shelter==="burrow",conceal:["burrow","cave","grove","existing"].includes(site.shelter),
  x:home.x,z:home.z,angle:0,clock:null,since:0,arrived:null,path:null,hidden:false,swing:0};
}
function turnWildlife(current,wanted,amount){
 const difference=Math.atan2(Math.sin(wanted-current),Math.cos(wanted-current));
 return current+cap(difference,-amount,amount);
}
function moveWildlife(state,goal,speed,dt){
 if(!state.path){
  state.path=wildlifeTrail(state,goal,state.aquatic);
  if(!state.path.length){
   const from=wildlifeTrail(state,state.home,state.aquatic),to=wildlifeTrail(state.home,goal,state.aquatic);
   if(from.length&&to.length)state.path=[...from,...to];
  }
 }
 const point=state.path[0];
 if(!point)return Math.hypot(goal.x-state.x,goal.z-state.z)<.35;
 const dx=point.x-state.x,dz=point.z-state.z,d=Math.hypot(dx,dz);
 const step=Math.min(d,speed*dt);
 if(d>.001){
  state.x+=dx*step/d;state.z+=dz*step/d;
  state.angle=turnWildlife(state.angle,Math.atan2(-dz,dx),dt*(state.mode==="flee"?12:6));
  state.swing+=step*(state.style==="bound"?5.1:7.5);
 }
 if(d<=step+.015)state.path.shift();
 return !state.path.length;
}
function changeWildlifeMode(state,mode,time){
 state.mode=mode;state.since=time;state.path=null;state.arrived=null;
 state.hidden=mode==="hidden";
}
function wildlifeAlarm(state,time){
 if(state.style!=="burrow"||gameplayPaused||time-(wildlifeAlarm.last??-Infinity)<1050)return;
 const volume=Number(localStorage.getItem("returning-waters-volume")??100)/100;
 if(!(volume>0))return;
 prepareSluiceAudio();
 const audio=sluiceAudio;
 if(!audio)return;
 wildlifeAlarm.last=time;
 const whistle=()=>{
  if(gameplayPaused||audio.state!=="running")return;
  const now=audio.currentTime,tone=audio.createOscillator(),gain=audio.createGain();
  tone.frequency.setValueAtTime(1940,now);
  tone.frequency.linearRampToValueAtTime(2690,now+.065);
  tone.frequency.exponentialRampToValueAtTime(1780,now+.20);
  gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(.037*volume+.0001,now+.033);
  gain.gain.exponentialRampToValueAtTime(.0001,now+.205);
  tone.connect(gain).connect(audio.destination);tone.start(now);tone.stop(now+.22);
 };
 if(audio.state==="running")whistle();
 else audio.resume().then(whistle,()=>{});

}
function updateWildlifeBehavior(animal,time){
 const state=animal.behavior;
 if(state.clock===null)state.since=time;
 const dt=state.clock===null?0:cap((time-state.clock)*.001,0,.105);
 state.clock=time;
 const danger=time<(state.threatUntil??0)?state.threat:null;
 const playerDistance=Math.hypot(player.x-state.x,player.y-state.z);
 const distance=danger?pursuitGap(state,danger):playerDistance;
 const clock=time-state.since;
 let speed=0,head=0,rear=0,sink=0,authored=null;
 switch(state.mode){
  case "hidden":
  case "shelter":
   if(time>=(state.fearUntil??0)&&Math.min(playerDistance,Math.hypot(player.x-state.feed.x,player.y-state.feed.z))>state.notice+5&&clock>1800)
    changeWildlifeMode(state,"food",time);
   else if(state.hidden)return {hidden:true};
   break;
  case "watch":
   const threat=danger??{x:player.x,z:player.y};
   state.angle=turnWildlife(state.angle,Math.atan2(state.z-threat.z,threat.x-state.x),dt*9);
   rear=state.style==="burrow"?terrainEase(0,260,clock)*(1-terrainEase(460,700,clock))*.64:0;
   head=-.35;
   if(!danger&&distance>state.notice+2)changeWildlifeMode(state,"food",time);
   else if(danger?clock>140+animal.member*32:clock>state.delay*1000&&(distance<state.close||clock>(state.delay+.7)*1000)){
    wildlifeAlarm(state,time);
    changeWildlifeMode(state,"flee",time);
   }
   break;
  case "flee":{
   speed=state.speed*lerp(.91,1.08,animal.pace-.54)*terrainEase(0,380,clock);
   const arrived=moveWildlife(state,state.cover,speed,dt);
   if(arrived)changeWildlifeMode(state,state.burrow?"enter":state.conceal?"hidden":"shelter",time);
   else if(!state.path?.length&&clock>1800)changeWildlifeMode(state,"watch",time);
   break;
  }
  case "enter":{
   const progress=terrainEase(0,390,clock),angle=state.angle;
   sink=progress*.58;
   state.x=state.cover.x+Math.cos(angle)*progress*.42;
   state.z=state.cover.z-Math.sin(angle)*progress*.42;
   if(clock>=390)changeWildlifeMode(state,"hidden",time);
   break;
  }
  default:
   if(!danger&&state.hunt&&playerDistance>=4.5){speed=wildlifeHuntStep(state,time,dt);break;}
   if(state.mode==="chase"||state.mode==="stalk")changeWildlifeMode(state,"food",time);
   if(danger||distance<state.notice){
    changeWildlifeMode(state,"watch",time);
    break;
   }
   if(state.mode==="feature"){
    authored=wildlifeFeaturePose(animal,clock)??wildlifeShorePose(animal,clock);
    if(authored){state.x=authored.x;state.z=authored.z;state.angle=authored.rotation;}
    if(clock>=state.feature)changeWildlifeMode(state,"food",time);
    break;
   }
   if(state.mode==="home"){
    speed=1.5;
    if(moveWildlife(state,state.home,speed,dt))changeWildlifeMode(state,"feature",time);
    break;
   }
   speed=1.5;
   if(moveWildlife(state,state.feed,speed,dt)){
    speed=0;
    state.arrived??=time;
    const eating=time-state.arrived;
    const amount=terrainEase(0,380,eating);
    head=amount*(.74+.19*Math.sin(eating*.009+animal.offset)+.07*Math.sin(eating*.022));
    if(state.feature&&eating>7800+animal.member*260)changeWildlifeMode(state,"home",time);
   }
 }
 if(state.hidden)return {hidden:true};
 if(authored)return authored;
 const floor=terrainSurface(state.x,state.z),wet=state.aquatic?terrainEase(.045,.36,wildlifeWaterLevel-floor):0;
 const y=lerp(floor,wildlifeWaterLevel-.15,wet)-sink;
 const bound=state.mode==="flee"&&(state.style==="bound"||state.style==="hop"||state.style==="flutter");
 return {x:state.x,z:state.z,y,rotation:state.angle,head,rear,speed,stride:state.swing,wet,waterline:wildlifeWaterLevel,
  lift:bound?Math.max(0,Math.sin(state.swing))*(state.style==="bound"?.29:.17):0};
}
