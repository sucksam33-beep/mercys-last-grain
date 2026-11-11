"use strict";
const whiteHorse={region:-1,x:0,z:0,y:0,yaw:0,speed:0,called:false,riding:false,route:[],repath:0};
let horseAudio;
function horseWhistleSound(){
 try{
  horseAudio??=new AudioContext();
  horseAudio.resume().catch(()=>{});
  const t=horseAudio.currentTime,voice=horseAudio.createOscillator(),gain=horseAudio.createGain();
  voice.frequency.setValueAtTime(1430,t);voice.frequency.exponentialRampToValueAtTime(1950,t+.12);
  voice.frequency.exponentialRampToValueAtTime(1670,t+.38);
  gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(.07,t+.045);
  gain.gain.exponentialRampToValueAtTime(.001,t+.43);
  voice.connect(gain).connect(horseAudio.destination);voice.start(t);voice.stop(t+.44);
 }catch{}
}
function horsePassage(x,z,from=Infinity){
 if(x<5||x>635||z<13||z>watershedSouth(s.region)-1)return null;
 if(s.region===0&&riverDist(x,z)<12&&!onAsagiBridge(x,z))return null;
 const origin=Number.isFinite(from)?from:terrainSurface(x,z);
 const y=supportAt(x,z,origin,.55);
 if(y===null||y<watershedWaterLevel+.14||Math.abs(y-origin)>.75)return null;
 for(const [dx,dz] of [[.46,0],[-.46,0],[0,.46],[0,-.46]]){
  const edge=supportAt(x+dx,z+dz,y,.55);
  if(edge===null||Math.abs(edge-y)>.62)return null;
 }
 return y;
}
function horseLine(a,b){
 const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/1.15));
 let y=a.y;
 for(let i=1;i<=count;i++){
  const x=lerp(a.x,b.x,i/count),z=lerp(a.z,b.z,i/count);
  const floor=horsePassage(x,z,y);
  if(floor===null||Math.abs(floor-y)>.75)return false;
  y=floor;
 }
 return true;
}
function horseApproachPoints(min,max){
 const list=[];
 for(const distance of [min,max])for(let i=0;i<16;i++){
  const angle=facing+Math.PI+i*Math.PI/8,x=player.x+Math.sin(angle)*distance,z=player.y+Math.cos(angle)*distance;
  const y=horsePassage(x,z);
  if(y!==null&&Math.abs(y-playerSupport())<(min>5?8:1.8))list.push({x,y,z});
 }
 return list;
}
function callWhiteHorse(){
 if(!graphics||!riggedScene||opening.open||$("dialog").open||whiteHorse.riding)return;
 ensureWorld();
 riggedScene.prepareHorse();
 horseWhistleSound();
 const stops=horseApproachPoints(1.9,3.3);
 let spawn=null,stop=null;
 if(whiteHorse.region===s.region){
  spawn={x:whiteHorse.x,y:whiteHorse.y,z:whiteHorse.z};
  stop=stops.find(point=>horseLine(spawn,point));
 }
 if(!stop){
  for(const candidate of [...horseApproachPoints(19,28),...horseApproachPoints(11,15)]){
   stop=stops.find(point=>horseLine(candidate,point));
   if(stop){spawn=candidate;break;}
  }
 }
 if(!stop){log("말이 접근할 수 있는 넓은 길에서 다시 불러 봐.");return;}
 Object.assign(whiteHorse,spawn,{region:s.region,speed:0,called:true,route:[stop],repath:.55});
 whiteHorse.yaw=Math.atan2(stop.x-spawn.x,stop.z-spawn.z);
 log("휘파람을 듣고 백마가 달려옵니다.");
}
function toggleHorseMount(){
 const h=whiteHorse;
 if(!riggedScene?.horseReady||opening.open||$("dialog").open||h.region!==s.region)return false;
 if(h.riding){
  if(h.speed>1.5){log("말을 멈춘 뒤 내릴 수 있습니다.");return true;}
  const sides=[1,-1].map(i=>({x:h.x+i*Math.cos(h.yaw)*1.35,z:h.z-i*Math.sin(h.yaw)*1.35}));
  const landing=sides.find(p=>horsePassage(p.x,p.z,h.y)!==null);
  if(!landing){log("옆에 발을 디딜 자리가 필요합니다.");return true;}
  h.riding=false;player.x=landing.x;player.y=landing.z;walkHeight=horsePassage(landing.x,landing.z,h.y);
  stopMoving();log("백마에서 내렸습니다.");return true;
 }
 if(h.speed>1.1||jumpVelocity!==null||Math.hypot(h.x-player.x,h.z-player.y)>3)return false;
 h.called=false;h.riding=true;horseThrottle=1.9;marker=target=null;stopMoving();
 player.x=h.x;player.y=h.z;facing=h.yaw;walkHeight=h.y;
 log("백마에 탔습니다. 이동하면서 Shift를 누르면 질주합니다.");return true;
}
function updateWhiteHorse(dt){
 const h=whiteHorse;
 if(h.riding){
  Object.assign(h,{region:s.region,x:player.x,z:player.y,y:playerSupport(),yaw:facing,speed:movement.speed});return;
 }
 if(h.region!==s.region||!h.called)return;
 const goal=h.route[0],dx=goal.x-h.x,dz=goal.z-h.z,distance=Math.hypot(dx,dz);
 if(distance<.15){h.speed=0;h.called=false;h.route=[];log("백마가 도착했습니다. R 또는 Y로 타세요.");return;}
 const speed=Math.min(9,Math.sqrt(distance*8));
 h.speed=lerp(h.speed,speed,1-Math.exp(-dt*4));
 const length=Math.min(distance,h.speed*dt),x=h.x+dx/distance*length,z=h.z+dz/distance*length,y=horsePassage(x,z,h.y);
 if(y===null){h.called=false;h.speed=0;return;}
 Object.assign(h,{x,y,z,yaw:Math.atan2(dx,dz)});
}
function whiteHorseView(){
 const h=whiteHorse;
 return h.region===s.region?{x:h.x,y:h.y,z:h.z,yaw:h.yaw,speed:h.speed,riding:h.riding}:null;
}

let horseThrottle=1.9;
function rideTargetSpeed(dt,input,sprint){
 const goal=sprint&&input?12.4:1.9;
 horseThrottle=cap(horseThrottle+cap(goal-horseThrottle,-dt*4.6,dt*2.45),1.9,12.4);
 return horseThrottle;
}
