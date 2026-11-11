"use strict";
const sealRestRocks=[
 {member:3,x:625.30,z:373.27,w:4.0,d:2.8,rise:.54},
 {member:4,x:616.96,z:368.94,w:3.2,d:2.4,rise:.43},
 {member:10,x:622.41,z:371.39,w:2.6,d:1.9,rise:.34}
];
function wildlifeWaterRoute(region,index,x,z){
 if(index!==1||(region!==3&&region!==7))return null;
 const center=region===3?[531,343]:[632,322];
 const distance=Math.hypot(center[0]-x,center[1]-z);
 for(let d=5;d<=Math.min(distance,19);d+=.65){
  const a=lerp(x,center[0],d/distance),b=lerp(z,center[1],d/distance);
  if(terrainSurface(a,b)<1.45)return {x:a,z:b,swimLength:region===3?5.3:7.2};
 }
 return null;
}
function wildlifeShorePose(animal,time){
 const {waterRoute,restRock,member,seal,x,z}=animal;
 if(!waterRoute||restRock)return null;
 const period=seal?19000:13200;
 const phase=(time/period+member*.173)%1;
 const launch=terrainEase(.18,.43,phase)*(1-terrainEase(.76,.99,phase));
 if(launch===0)return null;
 const dx=waterRoute.x-x,dz=waterRoute.z-z,len=Math.hypot(dx,dz);
 const side=Math.sin(phase*9.4)*.7*terrainEase(.64,.98,launch);
 const swim=waterRoute.swimLength*terrainEase(.43,.60,phase)*(1-terrainEase(.64,.82,phase));
 const a=x+dx*(launch+swim/len)-dz/len*side,b=z+dz*(launch+swim/len)+dx/len*side;
 const floor=terrainSurface(a,b),water=wildlifeWaterLevel;
 const wet=terrainEase(.035,.34,water-floor);
 const y=lerp(floor,water-(seal?.19:.155)+.035*Math.sin(time*.009+member),wet);
 const reverse=phase>.69?Math.PI:0;
 const rotation=Math.atan2(-dz,dx)+reverse+Math.sin(phase*9.4)*wet*.16;
 return {x:a,z:b,y,rotation,wet,waterline:water,slip:seal?terrainEase(.17,.25,phase)*(1-terrainEase(.36,.55,phase)):0};
}
function shoreStone(x,y,z,w,d,rise,seed,tint="#87918d"){
 const random=rand(seed),angles=Array.from({length:9},(_,i)=>i*Math.PI*2/9);
 const outline=angles.map(a=>[Math.cos(a)*(.42+.12*random()),Math.sin(a)*(.42+.12*random())]);
 const rings=[[-.07,.80],[rise*.48,1],[rise,.73]].map(([h,f],level)=>outline.map(([a,b])=>
  [x+a*w*f,y+h+(level===2?(random()-.5)*.035:(random()-.5)*.10),z+b*d*f]));
 const granite=color(tint),wet=shade(granite,.53);
 for(let level=0;level<2;level++)for(let i=0;i<outline.length;i++){
  const j=(i+1)%outline.length,low=rings[level],high=rings[level+1];
  quad(low[i],low[j],high[j],high[i],shade(level?granite:wet,.77+random()*.37),surface.rock);
 }
 for(let i=0;i<outline.length;i++)triangle(rings[2][i],rings[2][(i+1)%outline.length],[x,y+rise+.025,z],
  shade(granite,.91+random()*.21),surface.rock,[0,1,0]);
}
function buildWildlifeWaterScenery(){
 if(s.region===3){
  const random=rand(81937),mud=color("#493b29"),bark=color("#654735"),heart=color("#d8a875");
  const sticks=(a,b,r,tint)=>tube(a,b,r,r*.75,tint,surface.bark,7);
  const spine=t=>370.9+Math.sin(t*Math.PI)*1.9;
  const shoulders=Array.from({length:16},(_,i)=>{
   const t=i/15,x=518+t*17,z=spine(t),top=2.39+.23*Math.sin(Math.PI*t)+random()*.13;
   const width=.76+random()*.28;
   return {x,z,top,width};
  });
  for(let i=1;i<shoulders.length;i++){
   const a=shoulders[i-1],b=shoulders[i];
   const point=(p,side,crest)=>[p.x,crest?p.top:1.32,p.z+side*p.width*(crest?.47:1)];
   quad(point(a,-1,false),point(b,-1,false),point(b,-1,true),point(a,-1,true),shade(mud,.87+random()*.22),surface.wall);
   quad(point(a,1,true),point(b,1,true),point(b,1,false),point(a,1,false),shade(mud,.83+random()*.20),surface.wall);
   quad(point(a,-1,true),point(b,-1,true),point(b,1,true),point(a,1,true),shade(mud,.93+random()*.27),surface.wall);
  }
  for(let i=0;i<86;i++){
   const along=random(),x=518+along*17,z=spine(along)+(random()-.5)*2.0;
   const core=wildlifeWaterLevel-.30+random()*.99,length=1.2+random()*3.6;
   const angle=(i%3===0?.08:1.25)+(random()-.5)*1.58;
   const dx=Math.cos(angle)*length*.5,dz=Math.sin(angle)*length*.5;
   const tint=shade(i%6===0?heart:i%5===0?mud:bark,.72+random()*.52);
   sticks([x-dx,core-.13,z-dz],[x+dx,core+.10,z+dz],.065+random()*.14,tint);
   if(i%4===0)sticks([x,core,z],[x+dx*.31,core+.36,z-dz*.39],.044,bark);
  }
  for(let i=0;i<16;i++){
   const x=518+i*1.1,z=372.2+Math.sin(i*.24)*.95;
   shoreStone(x,wildlifeWaterLevel-.44,z,.90,.86,.33,883+i);
  }
  for(const [i,[x,z,h,r]] of [[507.2,359.0,.89,.28],[511.3,373.1,.64,.24],[516.5,375.2,.53,.18]].entries()){
   const y=terrainSurface(x,z),lean=.08*(i-1);
   tube([x,y-.05,z],[x+lean,y+h*.69,z],r*1.19,r,bark,surface.bark,10);
   tube([x+lean,y+h*.64,z],[x+lean-.055,y+h,z+.04],r,.075,heart,0,8);
   for(let j=0;j<8;j++){
    const a=j*Math.PI/4;
    const from=[x+Math.cos(a)*r*.96,y+h*(.65+(j%3)*.044),z+Math.sin(a)*r*.96];
    const to=[x+lean-.055+Math.cos(a+.11)*.074,y+h-.04,z+.04+Math.sin(a+.11)*.074];
    sticks(from,to,.015,shade(heart,.83+(j%3)*.16));
   }
   for(let j=0;j<8;j++){
    const a=random()*Math.PI*2,d=r+.10+random()*.49,px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d,py=terrainSurface(px,pz)+.028;
    triangle([px-.073,py,pz-.034],[px+.092,py,pz-.017],[px+.024,py+.043,pz+.076],shade(heart,.79+random()*.32),0);
   }
  }
  const a=[514,terrainSurface(514,375.2)+.12,375.2],b=[518.2,terrainSurface(518.2,373.9)+.13,373.9];
  sticks(a,b,.19,bark);
  const end=b.map((v,i)=>v+(b[i]-a[i])*.035);
  tube(b,end,.145,.052,heart,0,7);
 }
 if(s.region===7){
  for(const [i,rock] of sealRestRocks.entries()){
   const {x,z,w,d,rise}=rock,y=terrainSurface(x,z);
   shoreStone(x,y-.065,z,w,d,rise+.065,991+i);
  }
  const random=rand(45723);
  for(let i=0;i<28;i++){
   const x=609+random()*23,z=354+random()*15,y=terrainSurface(x,z);
   if(y<1.24||y>2.68)continue;
   const size=.22+random()*.71;
   shoreStone(x,y-.09,z,size*1.4,size,.10+random()*.23,1153+i);
  }
 }
}
let wildlifeWakeBuffer,wildlifeWakeCount=0;
function prepareWildlifeWake(){
 if(wildlifeWakeBuffer)return;
 const world=verts;
 verts=[];
 const foam=color("#c8ede0");
 for(const side of [-1,1])for(let i=0;i<9;i++){
  const edge=(t,bias)=>[-.07-t*1.65,0,side*(.09+t*t*.70+bias)];
  const t=i/9,u=(i+1)/9;
  quad(edge(t,0),edge(u,0),edge(u,.036*(1-u*.7)),edge(t,.036*(1-t*.7)),shade(foam,1-t*.25),0);
 }
 wildlifeWakeBuffer=gl.createBuffer();
 wildlifeWakeCount=verts.length/10;upload(wildlifeWakeBuffer);
 verts=world;
}
