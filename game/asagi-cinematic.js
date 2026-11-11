"use strict";

const asagiFilm = { duration: 30, started: null, seconds: 0, shot: -1, models: null };
const filmMaterial = {metal:20, steam:21, lamp:22, indigo:23};
const asagiRail = { z: 111, front: 105, arrivalDistance: 86, from: 94, to: 238 };
const smoothCut = (from, to, time) => {
 const t = cap((time-from)/(to-from),0,1);
 return t*t*(3-2*t);
};
function railHeight(x){
 return height(93,118)+.35-(x-93)*.041;
}
function trainFront(time){
 if(time>=24)return asagiRail.front+105*smoothCut(24,30,time);
 return asagiRail.front+asagiRail.arrivalDistance*(1-cap(time/11,0,1))**2.1;
}
function openingHandoffTime(){
 if(asagiFilm.seconds<11||asagiFilm.seconds>=18)return 10;
 return lerp(3.44,7.5,cap((asagiFilm.seconds-11)/7,0,1));
}
function tube(a,b,ra,rb,tint,material=0,sides=20,tipMaterial=material){
 const axis=unit(sub(b,a));
 const u=unit(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0]));
 const v=cross(axis,u);
 const rim=(p,r,n)=>p.map((value,i)=>value+r*n[i]);
 for(let i=0;i<sides;i++){
  const normal=k=>u.map((c,j)=>c*Math.cos(k*2*Math.PI/sides)+v[j]*Math.sin(k*2*Math.PI/sides));
  const n=normal(i),m=normal(i+1);
  const p=rim(a,ra,n),q=rim(a,ra,m),r=rim(b,rb,m),s=rim(b,rb,n);
  for(const [vertex,norm,surface] of [[p,n,material],[q,m,material],[r,m,tipMaterial],[p,n,material],[r,m,tipMaterial],[s,n,tipMaterial]])
   verts.push(...vertex,...norm,...tint,surface);
  triangle(a,q,p,tint,material,axis.map(x=>-x));
  triangle(b,s,r,tint,tipMaterial,axis);
 }
}
function buildRailway(){
 const {z,from,to}=asagiRail;
 const timber=color("#59473a"), iron=color("#575859"), masonry=color("#6e6454");
 for(let x=from;x<to;x+=1){
  const y=railHeight(x);
  box(x,y-.19,z,.24,.15,2.72,timber);
  for(const side of [-1,1]){
   const rail=z+side*.83;
   const next=railHeight(x+1);
   quad([x,y+.042,rail-.055],[x,y+.042,rail+.055],[x+1,next+.042,rail+.055],[x+1,next+.042,rail-.055],iron,filmMaterial.metal);
   tube([x,y-.048,rail],[x+1,next-.048,rail],.052,.052,iron,filmMaterial.metal,6);
  }
 }
 for(let x=from+2;x<to;x+=5){
  const deck=railHeight(x)-.28, ground=height(x,z);
  box(x,deck-.28,z,5.1,.35,2.84,timber,0,8);
  if(deck>ground+.2){
   for(const side of [-1,1]){
    const foot=z+side*1.35, shoulder=z+side*.78;
    box(x,ground-.12,foot,.57,.43,.58,masonry);
    tube([x,ground+.20,foot],[x,deck,shoulder],.16,.13,timber,0,8);
   }
   if(deck-ground>2)tube([x,ground+.6,z-1.28],[x,deck-.2,z+.73],.095,.095,timber,0,8);
  }
 }
 const base=height(93,118);
 addAsagiProp("wood-bench",101.85,base+.11,114.79,1.48,.53,.41,0,0,"station");
 addAsagiProp("oak-barrel",105.60,base+.11,114.96,.63,.78,.63,-.3,0,"station");
 addSurface(97.9,116.15,18.1,3.40,base-.08,base+.11);
 aimBox("역 승강장",97.9,116.15,18.1,3.40,base-.08,base+.11);
 if(!s.asagiTrainDeparted)aimBox("증기기관차",125,z,39.8,2.28,railHeight(145),railHeight(105)+3.9);
 addSurface((from+to)*.5,z,to-from,2.72,railHeight(to)-.57,x=>railHeight(x)-.04);
 if(!s.asagiTrainDeparted)addSurface(125,z,39.8,2.28,railHeight(145),railHeight(105)+4,false);
 for(let x=89;x<107;x+=.26)box(x,base-.08,116.15,.25,.19,3.40,shade(timber,.82+(Math.sin(x*27)+1)*.14),0,8);
 for(const x of [89,92,95,98,101,104,107]){
  box(x,base-.40,116.0,.23,.40,3.53,timber,0,8);
 }
 for(const x of [88.8,107.15]){
  box(x,base-.1,116.15,.13,.24,3.54,timber,0,8);
 }
 const bark=color("#665043"), leaf=color("#667738");
 const treeZ=210, treeX=[270,278,282,286].find(x=>fitsTree(x,treeZ,5));
 if(treeX===undefined)return;
 const id=objectKey("tree",treeX,treeZ);
 if(collected(id))return;
 const action={id,type:"tree",x:treeX,z:treeZ,reach:2.65};
 const treeY=height(treeX,treeZ);
 addSurface(treeX,treeZ,.78,.78,treeY,treeY+5.2,false);
 aimBox("감나무",treeX,treeZ,.8,.8,treeY,treeY+5.2,null,action);
 aimBox("감나무",treeX,treeZ,6.5,6.5,treeY+3.4,treeY+7.3,null,action);
 tube([treeX,treeY,treeZ],[treeX+.32,treeY+5.2,treeZ+.48],.39,.12,bark,0,12);
 const random=rand(792);
 for(let i=0;i<12;i++){
  const angle=i*2.4, reach=1.1+random()*2.6, y=treeY+3.5+random()*3.3;
  const tip=[treeX+Math.cos(angle)*reach,y,treeZ+Math.sin(angle)*reach];
  tube([treeX+.18,treeY+3.05,treeZ+.18],tip,.15,.043,bark,0,9);
  for(let j=0;j<5;j++){
   const x=tip[0]+(random()-.5)*2, z=tip[2]+(random()-.5)*2, h=y+random()*.95;
   rounded(x,h,z,.43+random()*.42,.24+random()*.23,.46+random()*.5,shade(leaf,.68+random()*.48));
   if(j<3)rounded(x,h-.26,z,.16,.17,.16,color(j%2?"#c57731":"#d18b40"));
  }
 }
}
function buildLocomotiveFrame(){
 box(5.4,.61,0,10.8,.40,2.14,color("#282c2a"),0,filmMaterial.metal);
 box(.13,.25,0,.3,.30,2.65,color("#5c241c"),0,filmMaterial.metal);
}
function buildLocomotive(){
 const iron=color("#282c2a"), steel=color("#484843"), brass=color("#ae7942");
 const trim=color("#5c241c"), oak=color("#534131");
 tube([.35,1.91,0],[7.35,1.91,0],.94,.94,iron,filmMaterial.metal,36);
 tube([.24,1.91,0],[.56,1.91,0],.73,.96,steel,filmMaterial.metal,32);
 for(const x of [.65,2.3,3.9,5.45,7.1])tube([x-.04,1.91,0],[x+.04,1.91,0],.958,.958,steel,filmMaterial.metal,32);
 tube([1.2,2.57,0],[1.2,3.55,0],.20,.29,iron,filmMaterial.metal);
 tube([1.2,3.52,0],[1.2,3.61,0],.38,.34,steel,filmMaterial.metal);
 for(const x of [3.7,5.65]){
  rounded(x,2.71,0,.35,.36,.34,brass);
  tube([x,2.73,0],[x,2.98,0],.29,.22,brass,filmMaterial.metal);
 }
 tube([-.02,2.52,0],[.23,2.52,0],.20,.20,brass,filmMaterial.metal);
 tube([-.04,2.52,0],[.02,2.52,0],.16,.16,color("#f5bc62"),filmMaterial.lamp);
 for(const z of [-.91,.91])tube([.01,1.81,z],[6.9,1.81,z],.055,.055,brass,filmMaterial.metal,10);
 box(8.8,1.0,0,2.95,.48,2.37,trim);
 for(const x of [7.4,10.2])for(const z of [-1.04,1.04])box(x,1.42,z,.13,2.01,.14,oak,0,8);
 box(8.8,3.31,0,3.25,.23,2.57,iron,0,filmMaterial.metal);
 box(8.8,2.94,0,2.9,.36,2.27,trim);
 for(const z of [-1.05,1.05])box(8.8,1.43,z,2.85,.62,.16,trim);
}
function buildPassengerCoaches(){
 const iron=color("#282c2a"),steel=color("#484843"),brass=color("#ae7942"),oak=color("#534131");
 for(let car=0;car<3;car++){
  const x=15.45+car*10.5;
  box(x,.70,0,10.0,1.15,2.35,oak,0,8);
  box(x,2.86,0,10.15,.25,2.53,iron,0,filmMaterial.metal);
  box(x,3.08,0,9.98,.15,1.81,steel,0,filmMaterial.metal);
  for(const edge of [-4.86,4.86])box(x+edge,1.82,0,.25,1.06,2.32,oak,0,8);
  for(const z of [-1.17,1.17]){
   for(let i=-4;i<=4;i++){
    box(x+i*1.15,1.73,z,.87,1.06,.055,color("#777669"),0,filmMaterial.metal);
    box(x+i*1.15-.52,1.73,z,.16,1.18,.10,oak,0,8);
   }
   box(x,1.71,z,10.02,.08,.11,brass,0,filmMaterial.metal);
  }
 }
}
function buildWheel(){
 const tire=color("#252624"), steel=color("#65615a");
 tube([0,0,-.115],[0,0,.115],.59,.59,tire,filmMaterial.metal,32);
 for(const z of [-.125,.125]){
  const side=Math.sign(z);
  tube([0,0,z],[0,0,z+side*.035],.495,.495,steel,filmMaterial.metal,28);
  for(let i=0;i<10;i++){
   const a=i*Math.PI/5;
   tube([0,0,z+side*.041],[.45*Math.cos(a),.45*Math.sin(a),z+side*.041],.028,.022,color("#302e2a"),filmMaterial.metal,6);
  }
  tube([0,0,z],[0,0,z+side*.085],.114,.09,tire,filmMaterial.metal,16);
 }
}
function buildGenzo(){
 const cloth=color("#373e43"), skin=color("#a97e5c"), hair=color("#66605a");
 const profile=[
  [.64,.268,.172],[.77,.285,.182],[.94,.262,.162],[1.07,.239,.164],
  [1.20,.244,.175],[1.39,.252,.185],[1.54,.275,.154],[1.61,.191,.128],[1.65,.101,.098]
 ];
 garment(profile.map(([y,w,d])=>[0,y,0,w,d]),cloth,filmMaterial.indigo,.032);
 const lapel=color("#4d5559"), seam=color("#272f35");
 for(const [x,y,z] of [[-.11,1.64,.091],[.10,1.64,.089]]){
  const endX=x<0?.144:-.110, endY=x<0?.92:1.22;
  const a=[x,y,z],b=[x*.60,y-.03,z+.009],c=[endX,endY,.155],d=[endX-.045,endY+.035,.168];
  quad(a,b,c,d,lapel,filmMaterial.indigo);
  tube(a,d,.007,.006,seam,0,8);
 }
 tube([0,1.012,0],[0,1.073,0],.243,.242,color("#4c4037"),filmMaterial.indigo,28);
 for(const side of [-1,1]){
  const x=side*.136;
  garment([[x,.106,-.003,.078,.075],[x,.209,-.004,.087,.083],[x,.317,.003,.092,.091],
   [x,.405,.018,.092,.097],[x,.454,.012,.097,.092],[x,.544,-.005,.106,.099],
   [x,.657,-.014,.116,.105],[x,.766,-.009,.122,.112]],color("#3b3833"),filmMaterial.indigo,.043);
  garment([[x,.015,.064,.088,.167],[x,.047,.065,.089,.165],[x,.084,.056,.084,.146],
   [x,.123,.034,.079,.111],[x,.163,.012,.077,.077]],color("#382e24"),filmMaterial.indigo,.019);
 }
 tube([0,1.565,.002],[0,1.767,0],.083,.094,skin,0,24);
 if(scenery){
  appendModel(scenery.head,0,-.046,-.016,.83,0,surface.genzoFace);
  buildHair(true);
 }else{
  rounded(0,1.80,.01,.148,.192,.130,skin);
  rounded(0,1.78,.119,.029,.053,.040,skin);
  rounded(0,1.92,-.04,.139,.085,.121,hair);
 }
 rounded(0,1.843,-.151,.054,.074,.078,hair);
 garment([[-.304,1.115,.052,.063,.060],[-.304,1.171,.043,.072,.069],[-.302,1.239,.030,.086,.082],
  [-.296,1.313,.016,.091,.090],[-.287,1.375,.009,.096,.094],[-.268,1.473,.004,.108,.105],
  [-.249,1.554,.002,.112,.108],[-.232,1.614,.002,.077,.076]],cloth,filmMaterial.indigo,.038);
 travelerHand(-1,-.304,1.086,.055,29);
}
function buildAsagiFilmModels(){
 const build=fn=>{
  verts=[];
  fn();
  const buffer=gl.createBuffer(),count=verts.length/10;
  upload(buffer);
  verts=[];
  return {buffer,count};
 };
 return {
  engine:build(buildLocomotive),frame:build(buildLocomotiveFrame),coaches:build(buildPassengerCoaches),
  wheel:build(buildWheel),genzo:build(buildGenzo),
  steam:build(()=>{
   rounded(0,0,0,1,.66,.84,color("#e9e0cc"));
   for(let i=9;i<verts.length;i+=10)verts[i]=filmMaterial.steam;
  }),
  action:{buffer:gl.createBuffer(),count:0}
 };
}
function handoffPose(t){
 const offer=smoothCut(3.48,5.00,t), release=smoothCut(5.14,5.46,t), pull=smoothCut(5.35,6.28,t);
 const passing=smoothCut(3.64,4.96,t)*(1-smoothCut(5.82,6.57,t));
 const arc=Math.sin(offer*Math.PI)*.047;
 const hand=[94.98-.77*offer+.77*pull,1.08+.32*offer-.32*pull+arc,118.022];
 const grip=smoothCut(4.93,5.23,t);
 const receive=[93.04+passing*.94,1.02+.30*passing+.067*grip*passing,118.41-.37*passing];
 return {hand,receive,passing,release,grip};
}
function handoffSleeve(shoulder,elbow,wrist,radii,tint,material){
 const sides=24, rings=14, points=[];
 for(let i=0;i<=rings;i++){
  const t=i/rings, u=1-t;
  const center=shoulder.map((v,k)=>u*u*v+2*u*t*elbow[k]+t*t*wrist[k]);
  const axis=unit(shoulder.map((v,k)=>u*(elbow[k]-v)+t*(wrist[k]-elbow[k])));
  const a=unit(cross(axis,[0,0,1])), b=cross(axis,a);
  const radius=t<.5?lerp(radii[0],radii[1],t*2):lerp(radii[1],radii[2],t*2-1);
  for(let j=0;j<sides;j++){
   const angle=j*Math.PI*2/sides;
   const n=a.map((v,k)=>v*Math.cos(angle)+b[k]*Math.sin(angle));
   const r=radius*(1+.027*Math.sin(angle*7+t*32));
   points.push([center.map((v,k)=>v+n[k]*r),n]);
  }
 }
 for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){
  const a=i*sides+j,b=i*sides+(j+1)%sides;
  for(const n of [a,b,b+sides,a,b+sides,a+sides])verts.push(...points[n][0],...points[n][1],...tint,material);
 }
}
function drawHandoff(mesh,models,t){
 const base=height(93,118);
 const {hand,receive,passing,release,grip}=handoffPose(t);
 const origin=[0,base,0];
 if(models.action.time===t){
  mesh(models.action.buffer,models.action.count,origin,0);
  return;
 }
 models.action.time=t;
 verts=[];
 const cloth=color("#414748"), coat=color("#4c3e33"), skin=color("#bc8b66");
 const shoulder=[95.01,1.55,117.99], heroShoulder=[93.01,1.70,118.30];
 const elbow=jointBetween(shoulder,hand,.48,.44,[.02,-1,.15]);
 handoffSleeve(shoulder,elbow,hand,[.115,.092,.062],cloth,filmMaterial.indigo);
 gripHand(hand,-1,.77-.53*release,color("#ab7a57"));
 if(passing>.01){
  const elbow=jointBetween(heroShoulder,receive,.57,.56,[.02,-1,.24]);
  handoffSleeve(heroShoulder,elbow,receive,[.129,.106,.063],coat,11);
  gripHand(receive,1,.07+.71*grip,skin);
 }
 if(t<6.31){
  const transfer=smoothCut(5.08,5.28,t);
  const ring=[
   lerp(hand[0]-.111,receive[0]+.126,transfer),
   lerp(hand[1]-.055,receive[1]-.033,transfer),
   lerp(hand[2]+.028,receive[2]+.024,transfer)
  ];
  const bronze=color("#b0854b"), swing=Math.sin(t*8)*.028*(1-transfer)+Math.sin(t*6)*.013*transfer;
  for(let i=0;i<20;i++){
   const point=k=>[ring[0]+Math.cos(k*Math.PI/10)*.035,ring[1]+Math.sin(k*Math.PI/10)*.035,ring[2]+swing*Math.sin(k*Math.PI/10)];
   tube(point(i),point(i+1),.0068,.0068,bronze,filmMaterial.metal,7);
  }
  tube([ring[0],ring[1]-.031,ring[2]],[ring[0]+swing,ring[1]-.128,ring[2]],.008,.008,bronze,filmMaterial.metal,10);
  box(ring[0]+swing+.016,ring[1]-.128,ring[2],.037,.019,.016,bronze,0,filmMaterial.metal);
 }
 models.action.count=verts.length/10;
 gl.bindBuffer(gl.ARRAY_BUFFER,models.action.buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.DYNAMIC_DRAW);
 verts=[];
 mesh(models.action.buffer,models.action.count,origin,0);
}
function drawAsagiRail(mesh,time,cinematic){
 const models=asagiFilm.models??=buildAsagiFilmModels();
 if(!riggedScene){
  mesh(models.genzo.buffer,models.genzo.count,[95.08,height(93,118),117.76],-Math.PI/2);
  drawHandoff(mesh,models,cinematic?openingHandoffTime():10);
 }
 if(!cinematic&&s.asagiTrainDeparted)return null;
 const t=cinematic?asagiFilm.seconds:11;
 const x=trainFront(t), z=asagiRail.z, y=railHeight(x);
 const origin=[x,y,z];
 if(!riggedScene?.hasLocomotive)mesh(models.engine.buffer,models.engine.count,origin,0,1,-.041);
 mesh(models.frame.buffer,models.frame.count,origin,0,1,-.041);
 mesh(models.coaches.buffer,models.coaches.count,origin,0,1,-.041);
 const axles=[1.3,3.1,5.05,7.04,9.12,12.2,18.8,22.7,29.3,33.2,39.8];
 for(const axle of axles)for(const side of [-1,1]){
  mesh(models.wheel.buffer,models.wheel.count,[x+axle,railHeight(x+axle)+.59,z+side*.85],0,1,(asagiRail.front-x)/.59);
 }
 const drawSteam=cinematic?t:time*.001;
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
 for(let i=0;i<7;i++){
  const age=(drawSteam*.63+i/7)%1, birth=cinematic?trainFront(t-age/.63):x;
  mesh(models.steam.buffer,models.steam.count,
   [birth+1.2+age*2.3,railHeight(birth)+3.63+age*4.1,z-age*1.25],
   i*.44,.19+age*1.45,0,Math.sin(age*Math.PI)*.29);
 }
 gl.depthMask(true);gl.disable(gl.BLEND);
 return origin;
}
function openingCamera(gameEye,gameAt){
 const t=asagiFilm.seconds;
 const base=height(93,118);
 if(t<5){
  const x=trainFront(t)+16;
  return {eye:[x,railHeight(x)+2.18,112.37],at:[x-31,base+3.1,163]};
 }
 if(t<11){
  const x=trainFront(t),u=smoothCut(5,11,t);
  return {eye:[lerp(108,97,u),base+lerp(4.7,2.3,u),lerp(121,119.9,u)],
   at:[x+3,railHeight(x)+1.83,111.7]};
 }
 const closeEye=[93.59,base+1.66,120.28], closeAt=[94.00,base+1.49,117.96];
 if(t<18)return {eye:closeEye,at:closeAt};
 if(t<21.7){
  const u=smoothCut(18,21.7,t);
  return {eye:[lerp(232,238,u),height(232,219)+lerp(6,4.7,u),lerp(219,222,u)],
   at:[lerp(266,258,u),height(254,207)+4,lerp(209,203,u)]};
 }
 if(t<24){
  const u=smoothCut(21.7,24,t);
  return {eye:[lerp(383,390,u),8,lerp(189,193,u)],at:[416,3.15,203]};
 }
 const u=smoothCut(24,30,t);
 return {eye:mix([88.8,base+4.0,121.7],gameEye,u),at:mix([106,base+2.0,123.4],gameAt,u)};
}
function updateOpening(time){
 if(asagiFilm.started===null)asagiFilm.started=time;
 asagiFilm.seconds=cap((time-asagiFilm.started)/1000,0,asagiFilm.duration);
 const t=asagiFilm.seconds;
 const shot=t<5?0:t<11?1:t<18?2:t<24?3:4;
 if(shot!==asagiFilm.shot){
  asagiFilm.shot=shot;
  setOpeningShot(openingShots[shot]);
 }
 if(t>=asagiFilm.duration)finishOpening();
}
