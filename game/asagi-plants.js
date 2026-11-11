"use strict";

function curvedPlantLeaf(x,y,z,angle,height,reach,width,tint,fold=.20,material=47){
 const forwardX=Math.cos(angle),forwardZ=Math.sin(angle);
 const blade=(t,side)=>{
  const spread=width*Math.sin(Math.PI*(.09+t*.91))*(1-.48*t);
  const lateral=side*spread;
  const outward=reach*t*t;
  return [
   x+forwardX*outward-forwardZ*lateral,
   y+height*(1.26*t-.31*t*t)-Math.abs(lateral)*fold,
   z+forwardZ*outward+forwardX*lateral
  ];
 };
 const emit=(a,b,c,weights,shadeValue)=>{
  const n=unit(cross(sub(b,a),sub(c,a)));
  const leafColor=shade(tint,shadeValue);
  for(const [i,v] of [a,b,c].entries())verts.push(...v,...n,...shade(leafColor,.72+.28*weights[i]),material+.39*weights[i]);
 };
 for(const [a,b] of [[0,.36],[.36,.70],[.70,1]]){
  const midA=blade(a,0),midB=blade(b,0);
  for(const side of [-1,1]){
   const edgeA=blade(a,side),edgeB=blade(b,side);
   emit(midA,edgeA,midB,[a,a,b],.76+.30*a+(side===1?.07:0));
   if(b<1)emit(edgeA,edgeB,midB,[a,b,b],.78+.31*a);
  }
 }
}
function ricePlant(x,y,z,random){
 const angle=random()*Math.PI*2,height=.31+random()*.23;
 if(wildGroundPlant(x,y,z,height*1.35,angle,58,true))return;
 const palette=mix(color("#517034"),color("#a4ae61"),random()*.80);
 for(let i=0;i<5;i++){
  const direction=angle+i*2.399;
  curvedPlantLeaf(x+Math.cos(direction)*.028,y,z+Math.sin(direction)*.028,direction,
   height*(.61+random()*.53),.12+random()*.21,.021+random()*.017,shade(palette,.76+random()*.42),.66);
 }
 if(random()<.28){
  const stemTop=y+height*1.06;
  tube([x,y,z],[x+.035,stemTop,z+.025],.009,.004,shade(palette,.81),47.19,4);
  for(let i=0;i<4;i++){
   const t=i/4,dir=angle+i*2.3;
   curvedPlantLeaf(x+.035,stemTop-t*.11,z+.025,dir,.014,.067*(.64+t),.012,
    shade(color("#aba268"),.84+random()*.27),.36);
  }
 }
}
const groundCoverChunks=new Map();
const groundCoverTile=24;
const grassTones=["#647644","#78824c","#52643d","#8a8255"];

// The material fraction is bend weight. Roots carry zero weight.
function coverBlade(x,y,z,angle,height,reach,width,tint,material,curved){
 const dx=Math.cos(angle),dz=Math.sin(angle);
 const a=[x-dz*width,y,z+dx*width],b=[x+dz*width,y,z-dx*width];
 const tip=[x+dx*reach,y+height,z+dz*reach];
 const emit=(p,q,r,weights)=>{
  const normal=unit(cross(sub(q,p),sub(r,p)));
  for(const [i,point] of [p,q,r].entries()){
   const weight=weights[i],light=.64+.36*weight;
   verts.push(...point,...normal,tint[0]*light,tint[1]*light,tint[2]*light,material+.39*weight);
  }
 };
 if(curved){
  const knee=[x+dx*reach*.29,y+height*.58,z+dz*reach*.29];
  const left=[knee[0]-dz*width*.73,knee[1],knee[2]+dx*width*.73];
  const right=[knee[0]+dz*width*.73,knee[1],knee[2]-dx*width*.73];
  emit(a,b,left,[0,0,.55]);emit(b,right,left,[0,.55,.55]);emit(left,right,tip,[.55,.55,1]);
 }else emit(a,b,tip,[0,0,1]);
}

const groundCoverBiomes=[
 [.89,grassTones],
 [.82,["#687a41","#89904e","#526c38","#9a8a56"]],
 [.38,["#917744","#a58d52","#757148","#b39761"]],
 [.88,["#526c38","#627b46","#7e8751","#8b7f50"]],
 [.80,["#4f7046","#648555","#697955","#97865e"]],
 [.96,["#597745","#738b4e","#486c48","#8e9858"]],
 [.71,["#77834b","#96a15c","#617844","#ae985f"]],
 [.53,["#667254","#798263","#5b7160","#9b8d6b"]]
];
function resetGroundCover(){
 for(const chunk of groundCoverChunks.values()){
  if(chunk.base.buffer)gl.deleteBuffer(chunk.base.buffer);
  if(chunk.detail?.buffer)gl.deleteBuffer(chunk.detail.buffer);
 }
 groundCoverChunks.clear();
}
function buildGroundCoverTile(bx,bz,quality,detail=false){
 const region=s.region,[density,palette]=groundCoverBiomes[region];
 const random=rand(84737+region*5911+bx*7351+bz*1721+(detail?31223:0));
 const size=groundCoverTile,spacing=detail?[.76,.56,.47][quality]:[1.13,.91,.78][quality];
 const savedVerts=verts,material=detail?78:49;
 const tones=palette.map(color),fresh=color(region===2?"#848852":"#889c56"),straw=color("#b29a62");
 verts=[];
 for(let dz=0;dz<size;dz+=spacing)for(let dx=0;dx<size;dx+=spacing){
  const x=bx+dx+random()*Math.min(spacing,size-dx),z=bz+dz+random()*Math.min(spacing,size-dz);
  if(x<1||x>639||z<5||z>watershedSouth(region)+3)continue;
  const road=Math.min(roadDist(x,z),roadVergeDistance(region,x,z)-1.15),river=riverDist(x,z),bank=channelWidth(z);
  if(road<2.95||dirtTrailDistance(region,x,z)<1.38||river<bank||onVillageWalk(x,z)||!fitsTree(x,z,.52))continue;
  if(region===1&&brunnenCityPaving(x,z))continue;
  if(region===0&&asagiPaddies.some(p=>paddyEdge(p,x,z)>-.16))continue;
  const y=terrainSurface(x,z);
  if(y<2.24)continue;
  const verge=terrainEase(2.95,5.2,road),wet=1-cap((river-bank)/23,0,1);
  const patch=.57+.24*Math.sin(x*.29+z*.17)*Math.sin(z*.24-x*.09)+.16*Math.sin(x*.085-z*.075);
  const upper=1-.78*terrainEase(region===7?82:122,region===7?142:195,y);
  const incline=Math.abs(terrainSurface(x+.55,z)-y)+Math.abs(terrainSurface(x,z+.55)-y);
  const rock=1-.90*terrainEase(.54,1.13,incline);
  if(random()>(.52+patch*density*.72+wet*.25)*upper*rock*verge)continue;
  const support=supportAt(x,z,y+.12);
  if(support===null||support>y+.12)continue;
  const angle=random()*Math.PI*2,stem=random();
  const dry=cap(.20+(1-density)*.53-wet*.18+Math.sin(x*.075-z*.039)*.10,.09,.68);
  const tall=!detail&&road>5.6&&stem<.20+wet*.13;
  const height=tall?.43+random()*.46:detail?.11+random()*.17:.17+random()*.23;
  if(!detail&&stem<.58){
   const slot=wet>.61?56:stem<dry*.60?55:stem>.51&&wildAccentsReady?(region===7?61:60):tall?54:57;
   if(wildGroundPlant(x,y,z,height*1.30,angle,slot,tall||slot===57||slot>=60))continue;
  }
  const blades=tall?5:detail?3:4;
  for(let k=0;k<blades;k++){
   const direction=angle+k*2.399;
   const paletteTone=tones[Math.floor(random()*tones.length)];
   const tint=random()<dry?mix(paletteTone,straw,.49+random()*.44):mix(paletteTone,fresh,random()*.69);
   const spread=tall?.14:.10;
   const px=x+Math.cos(direction)*spread,pz=z+Math.sin(direction)*spread;
   const ground=terrainSurface(px,pz);
   coverBlade(px,ground-.018,pz,direction,height*(.62+random()*.58),
    (.14+random()*.17)*(tall?1.14:1),tall?.020+random()*.016:.014+random()*.017,tint,material,tall);
  }
 }
 const count=verts.length/10;
 const buffer=count?gl.createBuffer():null;
 if(buffer)upload(buffer);
 verts=savedVerts;
 return {buffer,count};
}
let groundCoverQuality=-1;
function drawGroundCover(mesh,eye,quality){
 if(quality!==groundCoverQuality){resetGroundCover();groundCoverQuality=quality}
 const range=[44,61,78][quality],size=groundCoverTile;
 const cx=Math.floor(eye[0]/size),cz=Math.floor(eye[2]/size);
 const nearby=[];
 for(let row=cz-4;row<=cz+4;row++)for(let col=cx-4;col<=cx+4;col++){
  const x=col*size,z=row*size;
  if(x+size<1||x>639||z+size<5||z>415)continue;
  const distance=Math.hypot(x+size*.5-eye[0],z+size*.5-eye[2]);
  if(distance<=range+size*.5)nearby.push({key:col+","+row,x,z,distance});
 }
 const detailRange=[22,32,39][quality];
 for(const [key,chunk] of groundCoverChunks){
  const distance=Math.hypot(chunk.x+size*.5-eye[0],chunk.z+size*.5-eye[2]);
  if(distance>detailRange+size*1.4&&chunk.detail){
   if(chunk.detail.buffer)gl.deleteBuffer(chunk.detail.buffer);
   chunk.detail=null;
  }
  if(distance>range+size*1.35){
   if(chunk.base.buffer)gl.deleteBuffer(chunk.base.buffer);
   groundCoverChunks.delete(key);
  }
 }
 nearby.sort((a,b)=>a.distance-b.distance);
 let budget=2;
 for(const {key,x,z,distance} of nearby){
  let chunk=groundCoverChunks.get(key);
  if(!chunk&&budget>0){
   chunk={base:buildGroundCoverTile(x,z,quality),detail:null,x,z};
   groundCoverChunks.set(key,chunk);budget--;
  }
  if(!chunk)continue;
  if(!chunk.detail&&budget>0&&distance<detailRange+size*.72){
   chunk.detail=buildGroundCoverTile(x,z,quality,true);budget--;
  }
  if(chunk.base.buffer)mesh(chunk.base.buffer,chunk.base.count,[0,0,0],0);
  if(chunk.detail?.buffer)mesh(chunk.detail.buffer,chunk.detail.count,[0,0,0],0);
 }
}
