"use strict";

const characterMotion = { phase: 0, weight: 0, gait: [0,0,0,0], lift: 0 };
function advanceGait(dt, moving, running, speed){
 const m=characterMotion;
 m.weight=lerp(m.weight,moving?1:0,1-Math.exp(-dt*15));
 const cadence=running?cap(speed*.25,.1,2.65):cap(.76+speed*.18,.76,1.42);
 if(moving)m.phase=(m.phase+dt*cadence)%1;
 const feet=[0,.5].flatMap(offset=>{
  const phase=(m.phase+offset)%1;
  const stance=running?.52:.60;
  const extent=cap(speed*stance/(2*cadence),.05,running?.49:.40);
  if(phase<stance)return [lerp(extent,-extent,phase/stance)*m.weight,0];
  const swing=(phase-stance)/(1-stance);
  return [lerp(-extent,extent,swing*swing*(3-2*swing))*m.weight,
   Math.sin(swing*Math.PI)*(running?.25:.16)*m.weight];
 });
 m.gait=feet;
 m.lift=(.019+.018*Math.cos(m.phase*4*Math.PI))*m.weight;
}
function jointBetween(shoulder,wrist,upper,lower,pole){
 const line=sub(wrist,shoulder), length=Math.hypot(...line);
 const axis=unit(line);
 const distance=cap(length,.001,upper+lower-.0001);
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
 const spread=Math.sqrt(Math.max(0,upper*upper-along*along));
 const bend=unit(pole.map((value,i)=>value-axis[i]*dot(pole,axis)));
 return shoulder.map((value,i)=>value+axis[i]*along+bend[i]*spread);
}
function buildHair(elder=false){
 const scale=elder?.83:1, shift=elder?-.046:0, depth=elder?-.016:0;
 const base=color(elder?"#77716a":"#392820");
 const size=elder?.010:.013;
 const random=rand(elder?1731:4167);
 const limit=theta=>{
  const front=Math.max(Math.cos(theta),0), back=Math.max(-Math.cos(theta),0);
  const frontLift=elder?.48:.50;
  return 1.61-frontLift*front+.35*back+.032*Math.sin(theta*8)+.017*Math.sin(theta*19);
 };
 const point=(theta,phi,lift=0)=>{
  const ridge=.004*Math.sin(theta*19+phi*15)+.002*Math.cos(theta*37+phi*20);
  return [Math.sin(theta)*Math.sin(phi)*(.186+ridge+lift)*scale,
   (2.231+Math.cos(phi)*(.263+ridge+lift))*scale+shift,
   (Math.cos(theta)*Math.sin(phi)*(.195+ridge+lift)-.014)*scale+depth];
 };
 for(let row=0;row<14;row++)for(let i=0;i<78;i++){
  const a=i*Math.PI/39,b=(i+1)*Math.PI/39;
  const lo=row/14,hi=(row+1)/14;
  const tint=shade(base,.88+.092*Math.sin(a*17+lo*12)+.050*Math.sin(b*43));
  quad(point(a,lo*limit(a)),point(a,hi*limit(a)),point(b,hi*limit(b)),point(b,lo*limit(b)),tint,27);
 }
 for(let strand=0;strand<460;strand++){
  const a=random()*Math.PI*2;
  const root=limit(a)*(1-random()*.72);
  const length=.12+random()*(elder?.61:.40);
  const bend=(elder?.48:.74)*(Math.sin(a)*.30+.30)+(random()-.5)*.23;
  const tint=shade(base,.83+random()*.43);
  const width=size*(.6+random()*.62);
  for(let j=0;j<6;j++){
   const u=j/6,v=(j+1)/6;
   const theta=t=>a+bend*t;
   const phi=t=>Math.max(.03,root-length*t);
   const rise=t=>.007+Math.sin(t*Math.PI)*(.009+length*.019);
   quad(point(theta(u)-width,phi(u),rise(u)),point(theta(u)+width,phi(u),rise(u)),
    point(theta(v)+width*(1-v*.84),phi(v),rise(v)),point(theta(v)-width*(1-v*.84),phi(v),rise(v)),tint,27);
  }
 }
}
function gripHand(wrist,direction,grip,tint){
 const p=(x,y,z)=>[wrist[0]+direction*x,wrist[1]+y,wrist[2]+z];
 const palm=p(.048,0,0);
 rounded(...palm,.066,.026,.044,tint);
 for(let i=0;i<4;i++){
  const z=(i-1.5)*.021, length=[.063,.083,.078,.058][i];
  const base=p(.089,0,z), knuckle=p(.089+length*.51,-grip*.020,z+.002);
  const tip=p(.089+length*(1-grip*.44),-.002-grip*.058,z+.004);
  tube(base,knuckle,.012,.011,tint,0,10);
  tube(knuckle,tip,.011,.009,tint,0,10);
  rounded(...tip,.010,.010,.010,tint);
 }
 const thumb=p(.040,-.005,.042), hinge=p(.074,-.014,.068-grip*.017);
 const tip=p(.115-grip*.012,-.018-grip*.028,.060-grip*.042);
 tube(thumb,hinge,.016,.013,tint,0,12);
 tube(hinge,tip,.013,.010,tint,0,12);
 rounded(...tip,.011,.012,.010,tint);
}
