"use strict";
// Predator and prey indices match each region's existing wildlife roster.
const wildlifePursuitRules=[
 {},{2:{prey:[3],stalk:2.65,chase:8.1,range:55}},
 {2:{prey:[0],stalk:2.4,chase:5.6,range:53}},
 {},{2:{prey:[3,1],stalk:2.5,chase:7.4,range:46}},
 {2:{prey:[1,0],stalk:2.35,chase:6.2,range:41},3:{prey:[0,1],stalk:1.35,chase:5.0,range:25}},
 {2:{prey:[0],stalk:2.3,chase:6.2,range:36}},
 {2:{prey:[0,3],stalk:2.45,chase:6.4,range:42}}
];
const pursuitGap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function updateWildlifePursuits(time){
 const rules=wildlifePursuitRules[s.region];
 if(!Object.keys(rules).length)return;
 const active=wildlife.filter(animal=>animal.seasonAvailable());
 for(const hunter of active){
  const rule=rules[hunter.target.action.index];
  if(!rule||hunter.target.action.juvenile)continue;
  const state=hunter.behavior;
  if(time<(state.huntScan??-Infinity))continue;
  state.huntScan=time+180;
  const playerDistance=Math.hypot(player.x-state.x,player.y-state.z);
  const prey=active.filter(animal=>rule.prey.includes(animal.target.action.index)&&!animal.behavior.hidden&&
   !["enter","shelter"].includes(animal.behavior.mode));
  const sensed=prey.filter(animal=>pursuitGap(state,animal.behavior)<
   animal.behavior.notice*.86+(state.hunt?.charging?2:0));
  for(const member of prey){
   const behavior=member.behavior;
   if(!sensed.some(animal=>animal.target.action.index===member.target.action.index&&pursuitGap(behavior,animal.behavior)<17))continue;
   behavior.threat={x:state.x,z:state.z};
   behavior.threatUntil=time+900;
   behavior.fearUntil=time+4400;
  }
  const eligible=!state.hidden&&!["flee","watch","shelter","enter"].includes(state.mode);
  if(playerDistance<4.5||!eligible||time<(state.huntRest??-Infinity)){
   state.hunt=null;
   continue;
  }

  let hunt=state.hunt;
  const current=hunt?.target;
  if(current&&(!prey.includes(current)||time-hunt.since>15500||pursuitGap(state,current.behavior)>rule.range+14)){
   state.huntRest=time+3800;
   state.hunt=null;
   continue;
  }
  if(!hunt){
   const nearby=prey.map(animal=>({animal,distance:pursuitGap(state,animal.behavior)}))
    .filter(item=>item.distance<=rule.range).sort((a,b)=>a.distance-b.distance);
   const target=nearby.slice(0,3).find(({animal})=>wildlifeTrail(state,animal.behavior,state.aquatic).length)?.animal;
   if(!target)continue;
   hunt=state.hunt={target,rule,since:time,charging:false,repath:time};
  }
  const target=hunt.target.behavior,distance=pursuitGap(state,target);
  hunt.charging ||= distance<16||target.mode==="flee";

 }
}
function wildlifeHuntStep(state,time,dt){
 const hunt=state.hunt;
 const mode=hunt.charging?"chase":"stalk";
 if(state.mode!==mode)changeWildlifeMode(state,mode,time);
 if(time>=hunt.repath){
  hunt.repath=time+220;
  state.path=null;
  hunt.goal={x:hunt.target.behavior.x,z:hunt.target.behavior.z};
 }
 const speed=hunt.charging?hunt.rule.chase:hunt.rule.stalk;
 if(hunt.goal)moveWildlife(state,hunt.goal,speed,dt);
 return speed;
}
