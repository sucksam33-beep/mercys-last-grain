"use strict";
// Regional groups are ordered like regions[].animals. Prey areas mark habitat, never bait.
const wildlifeSiteProfiles=[
 [
  ["brush","grass","덤불 아래 낮은 몸숨김 자리","연한 풀과 새순"],["roots","nuts","개울가 뿌리와 덤불","도토리와 뿌리"],
  ["grove","grass","침엽수 숲과 촘촘한 덤불","숲 가장자리의 연한 풀과 새순"],["cave","fruit","숲속 바위 틈과 그늘","산딸기와 숲 열매"],
  ["wind","grass","바람을 가리는 숲 가장자리","트인 초지의 풀"]
 ],[
  ["brush","seed","울창한 풀숲","풀씨와 낙엽 속 곤충"],["roots","nuts","참나무 뿌리와 관목 그늘","도토리와 뿌리"],
  ["cave","tracks","바위와 뿌리 사이 굴","사슴이 드나드는 숲길"],["grove","browse","참나무 숲 가장자리","풀과 낮은 잎"],
  ["wind","grass","둔덕 뒤 바람 그늘","강변 초지"]
 ],[
  ["burrow","desert","사암이 포개진 바위 틈","연한 풀과 선인장"],["cave","cactus","협곡 바위 그늘","가시배 선인장과 뿌리"],
  ["cave","tracks","바위 밑 굴","설치류가 다니는 관목 사이"],["ledge","desert","가파른 사암 턱과 돌 틈","바위 사이 마른 풀과 낮은 관목"],
  ["wind","desert","바람을 가리는 낮은 암릉","가뭄에 강한 관목과 풀"]
 ],[
  ["roots","nuts","소나무 아래 숲 가장자리","낙엽 사이 씨앗과 열매"],["existing","browse","연못가 둑과 가지 더미","물가의 버드나무 새가지"],
  ["brush","browse","관목이 우거진 비탈","관목의 어린 가지와 잎"],["wind","grass","전나무 가장자리 바람 그늘","숲과 맞닿은 풀밭"],
  ["wind","grass","고원 둔덕 뒤 쉼터","바람이 트이는 고원 초지"]
 ],[
  ["roots","browse","침엽수 아래 가지와 고사목","눈 위로 나온 어린 가지와 겨울눈"],["burrow","flowers","고산 바위 밑으로 이어지는 굴","바위 사이 풀과 꽃"],
  ["cave","tracks","바위 그늘의 굴","와피티가 지나가는 길"],["wind","browse","소나무 가장자리 몸숨김 자리","초지의 풀과 어린 가지"],
  ["wind","grass","바람을 가리는 자갈 능선","칼더 분지의 열린 풀밭"]
 ],[
  ["reeds","aquatic","촘촘한 갈대 가장자리","얕은 물의 수초와 씨앗"],["roots","aquatic","수로 둑의 뿌리와 굴","수초 줄기와 뿌리"],
  ["reeds","tracks","물에 잠기지 않는 덤불 둔덕","작은 포유류가 지나는 제방"],["reeds","fish","갈대가 드리운 늪 가장자리","물고기가 모이는 얕은 여울"],
  ["reeds","grass","갈대 뒤 진흙 둔덕","범람원에 난 풀과 사초"]
 ],[
  ["brush","seed","관목 아래 숨을 자리","풀씨와 땅 위의 곤충"],["roots","fruit","방풍림의 뒤엉킨 뿌리","떨어진 과일과 뿌리"],
  ["roots","tracks","숲속 쓰러진 나무와 뿌리","작은 동물이 오가는 숲 바닥"],["wind","grass","관목과 바위가 만드는 바람 그늘","트인 사바나의 풀"],
  ["brush","browse","관목 그늘과 낮은 바위","관목의 잎과 어린 가지"]
 ],[
  ["brush","browse","눈 위로 드러난 낮은 침엽수 가지","버드나무와 어린 가지"],["existing","fish","만 가장자리의 낮은 바위","물고기가 모이는 만"],
  ["cave","tracks","바람을 막는 바위 굴","툰드라의 발자국 길"],["reeds","browse","물가의 관목과 사초","물가 관목의 어린 가지"],
  ["wind","grass","추운 초원의 바람 그늘","바람이 눈을 걷어낸 풀밭"]
 ]
];
function wildlifeSitePoint(anchor,angle,radius,minHeight,maxHeight=Infinity,reachable){
 const choices=[];
 for(let i=0;i<16;i++){
  const turn=angle+(i%2?-1:1)*Math.ceil(i/2)*Math.PI/8;
  const x=anchor.x+Math.cos(turn)*radius,z=anchor.z+Math.sin(turn)*radius;
  if(x<7||x>633||z<17||z>406)continue;
  const y=terrainSurface(x,z);
  if(y<minHeight||y>maxHeight||!fitsTree(x,z,52))continue;
  const grade=Math.abs(terrainSurface(x+.55,z)-terrainSurface(x-.55,z))+
   Math.abs(terrainSurface(x,z+.55)-terrainSurface(x,z-.55));
  choices.push({x,y,z,score:grade+i*.075});

 }
 return choices.sort((a,b)=>a.score-b.score).find(point=>!reachable||reachable(point))??{x:anchor.x,y:anchor.height,z:anchor.z};
}
function planWildlifeSite(region,index,anchor){
 const [shelter,food]=wildlifeSiteProfiles[region][index];
 if(shelter==="grove"||shelter==="burrow"){
  const cover=region===0?[616,347]:region===1?[592,96]:region===2?[542,281]:[411.8,384.6];
  const feed=region===0?[610,369]:region===1?[574,78]:region===2?[551,288]:[422,386];
  const point=([x,z])=>({x,z,y:terrainSurface(x,z)});
  return {region,index,shelter,food,anchor,cover:point(cover),feed:point(feed)};
 }
 const goal=wildlifeAtlasData[region][index].path.at(-1);
 const angle=Math.atan2(anchor.z-goal[1],anchor.x-goal[0]);
 const forage=food==="fish"||food==="aquatic";
 const aquatic=forage||["wetland","coast","streambank"].includes(wildlifeHabitats[region][index]);
 const feed=wildlifeSitePoint(anchor,angle-1.25,food==="fish"?7.5:6.8,forage?1.35:2.23,forage?2.46:Infinity,
  point=>wildlifeTrail(anchor,point,aquatic).length>0);
 const cover=wildlifeSitePoint(anchor,angle+.7,shelter==="ledge"?4.4:5.5,2.18,Infinity,
  point=>wildlifeTrail(feed,point,aquatic).length>0);
 return {region,index,shelter,food,anchor,cover,feed};
}
function wildlifePlantTuft(x,y,z,scale,tint,random){
 for(let i=0;i<6;i++){
  const a=random()*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a),h=scale*(.45+random()*.73);
  const root=[x+dx*scale*.12,y,z+dz*scale*.12],tip=[x+dx*scale*.49,y+h,z+dz*scale*.49];
  const base=scale*(.036+random()*.032);
  triangle([root[0]-dz*base,y,root[2]+dx*base],[root[0]+dz*base,y,root[2]-dx*base],tip,shade(tint,.75+random()*.46));
 }
}
function wildlifeBrush(x,y,z,h,tint,wood,random){
 for(let i=0;i<6;i++){
  const angle=random()*Math.PI*2,spread=h*(.24+random()*.47),height=h*(.58+random()*.53);
  const tip=[x+Math.cos(angle)*spread,y+height,z+Math.sin(angle)*spread];
  tube([x,y-.06,z],tip,h*.037,h*.010,wood,surface.bark,5);
  crown(...tip,h*.39,h*.35,shade(tint,.76+random()*.48));
 }
}
function paintBighornSandstone(anchor){
 const layers=["#94563c","#ae7350","#c58a59","#976044"].map(color);
 const random=rand(64980);
 for(let band=0;band<11;band++){
  const z0=anchor.z-8+band*1.86+(random()-.5)*1.15;
  const start=anchor.x-9+random()*5;
  const length=7.5+random()*10;
  const width=.35+random()*.72;
  let previous;
  for(let i=0;i<=Math.ceil(length/.55);i++){
   const t=i/Math.ceil(length/.55),x=start+t*length;
   const z=z0+Math.sin(t*5+band*.6)*.45+(x-anchor.x)*.16;
   const edge=width*(.20+.80*Math.sin(Math.PI*t));
   const top=terrainSurface(x,z),bottom=terrainSurface(x,z+edge);
   const line=[[x,top+.054,z],[x,bottom+.076,z+edge]];
   if(previous){
    const tint=shade(layers[band%layers.length],.88+random()*.23);
    quad(previous[1],line[1],line[0],previous[0],tint,surface.rock);
   }
   previous=line;
  }
 }
 for(let i=0;i<17;i++){
  const x=anchor.x-8+random()*13,z=anchor.z-6+random()*18;
  const y=terrainSurface(x,z),size=.26+random()*1.18;
  shoreStone(x,y-size*.17,z,size*1.6,size,.13+size*.24,841+i,i%3===0?"#af6f48":"#95654c");
 }
}
function drawDeerGrove(cover,leaf,wood,random){
 for(const [i,[dx,dz,height]] of [[-3.8,1,4.1],[2,1.4,4.6],[-2,-2.7,5.1],[2.5,-3.7,4.9],[-4.8,-2,4.2],[.2,-5,5.4]].entries()){
  const x=cover.x+dx,z=cover.z+dz,y=terrainSurface(x,z);
  tube([x,y-.12,z],[x+.09,y+height*.96,z],.15,.045,wood,surface.bark,8);
  for(let layer=0;layer<4;layer++){
   const t=layer/4,r=1.14-t*.64;
   taper(x+.02*layer,y+height*(.32+t*.58),z,height*(.36-t*.18),r,.035,
    shade(leaf,.51+t*.18+(i%3)*.04),7);
  }
  wildlifeBrush(x+.6,y,z+.32,.87+random()*.44,shade(leaf,.73),wood,random);
 }
}
function drawMarmotBurrow(cover,feed,tint){
 const distance=Math.hypot(feed.x-cover.x,feed.z-cover.z)||1;
 const dx=(feed.x-cover.x)/distance,dz=(feed.z-cover.z)/distance;
 const at=(side,front,height)=>[cover.x-dz*side+dx*front,cover.y+height,cover.z+dx*side+dz*front];
 const mouth=at(0,-.21,.30),inside=color("#252019");
 const rim=(angle)=>at(Math.cos(angle)*.58,-.17,Math.max(.025,.30+Math.sin(angle)*.34));
 for(let i=0;i<12;i++)triangle(mouth,rim(i*Math.PI/6),rim((i+1)*Math.PI/6),inside,0);
 for(const [i,[side,front,w,d,rise]] of [[-.66,0,1.0,1.45,.64],[.67,.02,1.0,1.28,.67],[-.39,-.88,1.15,1.19,.75],[.67,-.80,1.2,1.09,.84],[0,-1.42,1.5,1.3,.71]].entries()){
  const [x,,z]=at(side,front,0);
  shoreStone(x,terrainSurface(x,z)-.12,z,w,d,rise,643+i,tint);
 }
 const [x,,z]=at(0,-.29,0);
 shoreStone(x,cover.y+.49,z,1.58,1.18,.43,157,tint);
 const soil=color("#625441");
 for(let i=0;i<8;i++){
  const [x,,z]=at((i%4-1.5)*.22,.19+Math.floor(i/4)*.31,0);
  const y=terrainSurface(x,z)+.035;
  triangle([x-.12,y,z-.08],[x+.12,y,z-.05],[x+.09,y+.022,z+.095],shade(soil,.87+(i%3)*.13));
 }
}
function drawWildlifeHabitatSites(sites){
 for(const site of sites){
  const {region,index,anchor,cover,feed,shelter,food}=site;
  if(region===2&&index===3)paintBighornSandstone(anchor);
  const random=rand(81724+region*1829+index*113);
  const leaf=color(r().grass),reed=color(region===2?"#a19a60":"#768a58");
  const wood=color(region===2?"#77543a":"#584738"),dark=color("#30251b");
  const stone=districtArt[region]?.rock??"#8f8a73";
  const rock=(x,z,w,d,h,seed)=>shoreStone(x,terrainSurface(x,z)-.1,z,w,d,h,seed,stone);
  if(shelter==="burrow")drawMarmotBurrow(cover,feed,stone);
  if(shelter==="grove")drawDeerGrove(cover,leaf,wood,random);
  if(shelter==="cave"||shelter==="ledge"||shelter==="wind"){
   const large=shelter==="ledge"?1.8:shelter==="cave"?1.2:.79;
   const {x,y,z}=cover;
   for(let i=0;i<5;i++){
    const off=(i-2)*large*.78;
    rock(x+off,z+.62+Math.abs(off)*.25,large*(1.25+random()*.5),large*(.86+random()*.5),large*(.40+random()*.31),index*201+i);
   }
   if(shelter==="cave"){
    const from=[x-large*.45,y+.31,z+.16],to=[x+large*.48,y+.30,z+.18];
    tube(from,to,.25,.27,dark,surface.rock,7);
    shoreStone(x,y+.47,z+.49,large*1.5,large*.99,large*.44,177+index,stone);
   }
  }
  if(shelter==="roots"){
   const {x,y,z}=cover;
   tube([x-1.9,terrainSurface(x-1.9,z)+.13,z],[x+.92,y+.43,z+.57],.25,.38,wood,surface.bark,9);
   for(let j=0;j<5;j++){
    const a=j*Math.PI*.4;
    const px=x+.78+Math.cos(a)*1.36,pz=z+.48+Math.sin(a)*1.36;
    tube([x+.78,y+.35,z+.48],[px,terrainSurface(px,pz)+.07,pz],.115,.027,wood,surface.bark,6);
   }
  }
  if(shelter==="reeds"||shelter==="brush"||shelter==="roots"){
   for(let j=0;j<9;j++){
    const angle=j*2.399,x=cover.x+Math.cos(angle)*(1.3+random()*1.6),z=cover.z+Math.sin(angle)*(1.3+random()*1.6);
    const y=terrainSurface(x,z);
    if(y<1.55)continue;
    if(shelter==="reeds")wildlifePlantTuft(x,y,z,1.10+random()*.64,reed,random);
    else if(j<6)wildlifeBrush(x,y,z,.52+random()*.63,leaf,wood,random);
   }
  }
  for(let i=0;i<18;i++){
   const angle=i*2.399,radius=.35+Math.sqrt(i)*.69;
   const x=feed.x+Math.cos(angle)*radius,z=feed.z+Math.sin(angle)*radius,y=terrainSurface(x,z);
   if(food==="fish"&&y<2.06&&y>1.14){
    if(i%3===0){
     const yy=wildlifeWaterLevel-.14,length=.23+random()*.11;
     triangle([x-length,yy,z],[x+length,yy,z-.07],[x+length,yy,z+.07],color("#627f77"));
    }
    if(i%4===0)wildlifePlantTuft(x,y,z,.47,reed,random);
   }else if(food==="aquatic"&&y>1.32&&y<2.64)wildlifePlantTuft(x,y,z,.58+random()*.35,reed,random);
   else if(food==="tracks"&&i<9&&y>2.17){
    if(i<3)tube([x-.08,y+.025,z],[x+.11,y+.041,z+.09],.022,.027,color("#aea18a"),0,5);
    const px=feed.x+i*.44,pz=feed.z+(i%2?.18:-.18),py=terrainSurface(px,pz)+.027;
    triangle([px-.11,py,pz-.08],[px+.13,py,pz-.04],[px-.03,py+.008,pz+.105],shade(wood,.73+random()*.12));
   }else if(y>2.15&&food!=="tracks"&&food!=="fish"&&food!=="aquatic"){
    if((food==="browse"||food==="fruit")&&i%3===0)wildlifeBrush(x,y,z,.48+random()*.38,leaf,wood,random);
    else if(food==="cactus"&&i%4===0){
     taper(x,y,z,.56,.085,.055,reed,6);
     crown(x,y+.43,z,.37,.37,shade(reed,.91+random()*.25));
     crown(x+.14,y+.56,z,.11,.11,color("#905641"));
    }else wildlifePlantTuft(x,y,z,.18+random()*.47,region===2?reed:leaf,random);
    if((food==="flowers"||food==="fruit"||food==="nuts"||food==="seed")&&i%3===0)
     crown(x+.08,y+(food==="flowers"?.19:.055),z,.084,.071,color(food==="flowers"?"#d6b57e":food==="fruit"?"#a4513d":"#a68347"));
   }
  }
 }
}
function wildlifeClimbRoute(region,index,x,z){
 if(region!==2||index!==3)return null;
 const start=terrainSurface(x,z);
 let best=null;
 for(let i=0;i<20;i++){
  const angle=i*Math.PI/10,dx=Math.cos(angle)*9.2,dz=Math.sin(angle)*9.2;
  let y=start,valid=true;
  for(let j=1;j<=12;j++){
   const t=j/12,next=terrainSurface(x+dx*t,z+dz*t);
   if(next-y<-.14||next-y>1.27){valid=false;break;}
   y=next;
  }
  if(valid&&y-start>=2.4&&(!best||y>best.height))best={dx,dz,height:y};
 }
 return best;
}
function wildlifeFeaturePose(animal,time){
 const {x,z,member,climb}=animal;
 if(climb){
  const phase=(time/15800+member*.127)%1;
  const t=terrainEase(.08,.60,phase)*(1-terrainEase(.76,1,phase));
  const a=x+climb.dx*t,b=z+climb.dz*t,y=terrainSurface(a,b);
  const uphill=Math.atan2(-climb.dz,climb.dx),turn=Math.PI*terrainEase(.65,.77,phase);
  const slope=terrainSurface(a+climb.dx*.043,b+climb.dz*.043)-terrainSurface(a-climb.dx*.043,b-climb.dz*.043);
  return {x:a,z:b,y,rotation:uphill+turn,incline:cap(slope*.35,-.36,.36)*Math.cos(turn),climb:t};
 }
 if(s.region!==5||animal.target.action.index!==3)return null;
 const phase=time%18600/18600,travel=terrainEase(.10,.67,phase)*(1-terrainEase(.80,1,phase));
 const a=x+3.4*travel,b=z-22*travel,floor=terrainSurface(a,b),waterline=wildlifeWaterLevel;
 const wet=terrainEase(.04,.28,waterline-floor),dive=terrainEase(.34,.62,phase)*(1-terrainEase(.79,.94,phase));
 const y=lerp(floor,waterline-.13-dive*1.05,wet);
 return {x:a,z:b,y,rotation:Math.atan2(22,3.4)+Math.PI*terrainEase(.73,.81,phase),
  wet,waterline,dive,slip:.34*dive,wake:(1-dive*.84)*wet};
}
