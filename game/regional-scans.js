"use strict";

const regionalScanNames=["ambaro-limestone"];
const regionalScanData=new Map();
let regionalScanTexture;

async function loadRegionalScans(){
 const tile=512, atlas=document.createElement("canvas");
 atlas.width=2048;atlas.height=1536;
 const context=atlas.getContext("2d");
 const results=await Promise.allSettled(regionalScanNames.map(async(name,index)=>{
  const slot=index+8;
  const response=await fetch("assets/regional/"+name+".glb");
  if(!response.ok)throw new Error(name+" model unavailable");
  const bytes=await response.arrayBuffer(), header=new DataView(bytes);
  if(header.getUint32(0,true)!==0x46546c67)throw new Error(name+" GLB is malformed");
  const jsonLength=header.getUint32(12,true), binary=28+jsonLength;
  const gltf=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,jsonLength)));
  const primitive=gltf.meshes[0].primitives[0];
  const read=index=>{
   const accessor=gltf.accessors[index], view=gltf.bufferViews[accessor.bufferView];
   const start=binary+(view.byteOffset||0)+(accessor.byteOffset||0);
   const width={SCALAR:1,VEC2:2,VEC3:3}[accessor.type];
   const ArrayType={5125:Uint32Array,5123:Uint16Array,5126:Float32Array}[accessor.componentType];
   if(!ArrayType||view.byteStride)throw new Error(name+" uses an unsupported mesh layout");
   return new ArrayType(bytes,start,accessor.count*width);
  };
  const p=read(primitive.attributes.POSITION), uv=read(primitive.attributes.TEXCOORD_0);
  const normals=primitive.attributes.NORMAL===undefined?null:read(primitive.attributes.NORMAL);
  const indices=read(primitive.indices);
  const texIndex=gltf.materials[primitive.material].pbrMetallicRoughness.baseColorTexture.index;
  const tex=gltf.textures[texIndex];
  const source=gltf.images[tex.source??tex.extensions.EXT_texture_webp.source];
  const image=gltf.bufferViews[source.bufferView];
  const data=new Uint8Array(bytes,binary+(image.byteOffset||0),image.byteLength);
  const bitmap=await createImageBitmap(new Blob([data],{type:source.mimeType}));
  context.drawImage(bitmap,slot%4*tile,Math.floor(slot/4)*tile,tile,tile);
  bitmap.close();
  const {min,max}=gltf.accessors[primitive.attributes.POSITION];
  return {name,slot,p,uv,normals,indices,min,max};
 }));
 for(const result of results){
  if(result.status==="fulfilled")regionalScanData.set(result.value.name,result.value);
  else console.warn("Regional model unavailable",result.reason);
 }
 if(!regionalScanData.size)return;
 regionalScanTexture=gl.createTexture();
 gl.activeTexture(gl.TEXTURE11);gl.bindTexture(gl.TEXTURE_2D,regionalScanTexture);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
 setTextureFiltering();
 gl.activeTexture(gl.TEXTURE0);
 loadedScene="";
}

function placeRegionalScan(name,x,y,z,w,h,d,angle=0){
 const model=regionalScanData.get(name);
 if(!model)return false;
 const {p,uv,normals,indices,min,max,slot}=model;
 const sx=w/Math.max(max[0]-min[0],.001),sy=h/Math.max(max[1]-min[1],.001),sz=d/Math.max(max[2]-min[2],.001);
 const midX=(min[0]+max[0])*.5,midZ=(min[2]+max[2])*.5;
 const c=Math.cos(angle),s=Math.sin(angle);
 const point=i=>{
  const a=(p[i*3]-midX)*sx,b=(p[i*3+2]-midZ)*sz;
  return [x+a*c+b*s,y+(p[i*3+1]-min[1])*sy,z+b*c-a*s];
 };
 for(let i=0;i<indices.length;i+=3){
  const ids=[indices[i],indices[i+1],indices[i+2]], corners=ids.map(point);
  const face=normals?null:unit(cross(sub(corners[1],corners[0]),sub(corners[2],corners[0])));
  for(let j=0;j<3;j++){
   const k=ids[j],nx=normals?normals[k*3]/sx:0,ny=normals?normals[k*3+1]/sy:0,nz=normals?normals[k*3+2]/sz:0;
   const normal=face??unit([nx*c+nz*s,ny,nz*c-nx*s]);
   verts.push(...corners[j],...normal,uv[k*2],uv[k*2+1],1,90+slot);
  }
 }
 return true;
}

function mountainLandmarkRoof(x,z,w,d,eave,wall,karuk){
 const rise=w*(karuk?.31:.24),peak=eave+rise,run=w*.56,span=d*.56;
 const metal=color(karuk?"#606d71":"#74716a"),trim=color(karuk?"#515d63":"#665448");
 for(const side of [-1,1]){
  const edge=x+run*side;
  const ridgeBack=[x,peak,z-span],edgeBack=[edge,eave,z-span];
  const edgeFront=[edge,eave,z+span],ridgeFront=[x,peak,z+span];
  const corners=side>0?[ridgeFront,edgeFront,edgeBack,ridgeBack]:[edgeFront,ridgeFront,ridgeBack,edgeBack];
  quad(...corners,shade(metal,side>0?.87:1.08),surface.slate);
  for(let along=-span+.16;along<span;along+=karuk?.42:.31){
   const variation=.86+.18*Math.sin(along*17.23);
   tube([x,peak+.035,z+along],[edge,eave+.035,z+along],.026,.026,shade(metal,variation),0,5);
  }
  tube([edge,eave-.03,z-span],[edge,eave-.03,z+span],.07,.07,trim,0,5);
 }
 tube([x,peak+.035,z-span],[x,peak+.035,z+span],.075,.075,trim,0,6);
 for(const side of [-1,1]){
  const edge=z+side*d*.5;
  const low=eave+rise*(1-w*.5/run)+.014;
  const material=karuk?0:surface.wall;
  const a=[x-w*.5,eave,edge],b=[x+w*.5,eave,edge];
  const c=[x+w*.5,low,edge],leftTop=[x-w*.5,low,edge];
  triangle(a,b,c,wall,material,[0,0,side]);
  triangle(a,c,leftTop,wall,material,[0,0,side]);
  triangle(leftTop,[x,peak+.014,edge],c,wall,material,[0,0,side]);
 }
}

function buildRegionalLanding(wetland=false){
 const z=271, outer=471, bank=Array.from({length:32},(_,i)=>474+i).find(x=>terrainSurface(x,z)>2.7)??493;
 const deck=Math.max(2.91,terrainSurface(bank,z)+.12), width=4.6;
 const wood=color(wetland?"#8b8374":"#80705a"),dark=color(wetland?"#5f5b4e":"#5e5344");
 for(let x=outer;x<bank+.2;x+=.39){
  const tone=.82+.26*(.5+.5*Math.sin(x*123.67));
  box(x,deck-.15,z,.384,.15,width,shade(wood,tone),0,101);
  for(const edge of [-1,1])for(const offset of [-.087,.087])
   rounded(x+offset,deck+.001,z+edge*(width*.5-.25),.018,.008,.018,dark,0,5);
 }
 const center=(outer+bank)*.5;
 if(asagiPropsReady()){
  for(const [name,x,offset,yaw] of [["closed-wood-crate",outer+3,1.42,.12],["open-wood-crate",outer+4.15,1.42,-.14]]){
   addAsagiProp(name,x,deck,z+offset,.91,.62,.66,yaw);
   addSurface(x,z+offset,.91,.66,deck,deck+.62,false);
  }
 }
 addSurface(center,z,bank-outer+.43,width,deck-.20,deck);
 for(const side of [-1,1]){
  const edge=z+side*(width*.5-.28);
  box(center,deck-.40,edge,bank-outer+.38,.26,.19,dark,0,101);
  for(let x=outer+.35;x<bank;x+=3.25){
   const y=Math.min(terrainSurface(x,edge)-.23,deck-.72);
   tube([x,y,edge],[x,deck+.34,edge],.15,.12,dark,101,9);
   if(x+2.3<bank)tube([x,deck-.92,edge],[x+2.3,deck-.27,edge],.093,.093,wood,101,6);
   if(wetland)rounded(x,deck-.26,edge+side*.14,.063,.059,.033,color("#625043"),0);
   if(x<outer+4)for(let turn=0;turn<4;turn++)tube([x,deck+.19+turn*.023,edge],[x,deck+.212+turn*.023,edge],.152,.153,color("#8a785b"),0,10);
  }
 }
 for(let i=0;i<5;i++){
  const x=bank+.32+i*.58;
  const samples=[x-.29,x+.29].flatMap(a=>[-1.35,1.35].map(d=>terrainSurface(a,z+d)));
  const top=Math.max(Math.max(...samples)+.06,deck-(i+1)*.14),base=Math.min(...samples)-.12;
  if(top-base>.11)box(x,base,z,.61,top-base-.09,2.7,dark,0,surface.foundation);
  solidBox(x,top-.09,z,.61,.09,2.7,wood,101);
 }
 for(let i=0;i<4;i++){
  const top=deck-.20*(i+1),x=outer-.3-i*.47;
  solidBox(x,top-.12,z,.49,.12,1.75,wood,101);
 }
 const random=rand(519782);
 for(let i=0;i<135;i++){
  const a=bank-3+random()*13,b=z+(random()-.5)*34;
  if(Math.abs(b-z)<3||roadDist(a,b)<2.8)continue;
  const ground=terrainSurface(a,b);
  if(ground<1.76||ground>3.85)continue;
  const wet=ground<2.62,size=.08+random()*.23;
  rounded(a,ground-.025,b,size,size*.43,size*.71,
   shade(color(wet?"#777970":"#9d9584"),.75+random()*.48),surface.foundation);
  if(!wet&&i%5===0)for(let k=0;k<5;k++)
   curvedPlantLeaf(a,ground,b,k*2.399+i,.34+random()*.36,.15,.027,color("#6a744c"),.48);
 }
 aimBox(wetland?"생오렐 선착장":"암바로 선착장",center,z,bank-outer,width,deck-.45,deck+.33);
}

function placeScannedLandforms(region){
 if(region!==6)return;
 const name="ambaro-limestone",parts=[[140,155,6.4,7.2,5.4,.28],[144,154,4.8,4.8,4.3,-.32],[147,155,3.8,2.8,4.2,.62]];
 for(const [x,z,w,h,d,angle] of parts){
  if(roadDist(x,z)<4)continue;
  const y=Math.min(terrainSurface(x,z),terrainSurface(x,z-d*.33),terrainSurface(x,z+d*.33))-h*.31;
  if(placeRegionalScan(name,x,y,z,w,h,d,angle)){
   addSurface(x,z,w*.62,d*.62,y,y+h*.78,false);
  }
 }
}

function buildRegionalShallowRiver(){
 const cells=24;
 const edge=(x,z,width,i)=>{
  const px=x+(width+10)*(2*i/cells-1);
  const depth=Math.max(0,2.12-terrainSurface(px,z));
  return [px,2.12,z,0,1,0,depth,0,0,103];
 };
 for(let z=-30;z<460;z+=2){
  const a=riverCrossSection(z),b=riverCrossSection(z+2);
  for(let i=0;i<cells;i++){
   const p=edge(a.x,z,a.width,i),q=edge(b.x,z+2,b.width,i);
   const r=edge(b.x,z+2,b.width,i+1),s=edge(a.x,z,a.width,i+1);
   verts.push(...p,...q,...r,...p,...r,...s);
  }
 }
}

function laidStone(x,y,z,w,h,d,seed){
 const random=rand(seed),tint=shade(color("#918879"),.79+random()*.35);
 const b=Math.min(.045,w*.12,d*.12,h*.16);
 box(x,y,z,w,h-b,d,tint,0,surface.foundation);
 box(x,y+h-b,z,w-2*b,b,d-2*b,shade(tint,1.05),0,surface.foundation);
}
function masonryRetainingFace(length,faceAt,normal,topAt,bottomAt,seed,waterfront=false){
 const random=rand(seed);
 const mortar=color(waterfront?"#555346":"#625f53");
 const stoneBase=color(waterfront?"#968c75":"#9c9685");
 const position=(u,y,push)=>{
  const [x,z]=faceAt(u);
  return [x+normal[0]*push,y,z+normal[1]*push];
 };
 const divisions=Math.ceil(length/.42);
 let maxRise=0;
 for(let i=0;i<divisions;i++){
  const a=i*length/divisions,b=(i+1)*length/divisions;
  const topA=topAt(a),topB=topAt(b),bottomA=bottomAt(a),bottomB=bottomAt(b);
  maxRise=Math.max(maxRise,topA-bottomA,topB-bottomB);
  quad(position(a,bottomA,-.074),position(b,bottomB,-.074),position(b,topB,-.074),position(a,topA,-.074),mortar,105);
 }
 let depth=0,row=0;
 while(depth<maxRise){
  const rise=(waterfront?.33:.27)*(.72+random()*.62);
  const boundary=(u,i)=>i===0?0:.046*Math.sin(u*2.46+i*2.1)+.022*Math.sin(u*7.73+i*1.3);
  const jointTop=u=>topAt(u)-depth+boundary(u,row);
  const jointBottom=u=>topAt(u)-depth-rise+boundary(u,row+1);
  for(let from=0;from<length;){
   const span=(waterfront?.88:.68)*(.49+random()*1.08);
   const to=length-from<span+.22?length:from+span;
   const gap=.012+random()*.034,lo=from+gap*.5,hi=to-gap*.5;
   from=to;
   if(hi-lo<.09)continue;
   const mid=(lo+hi)*.5,grade=bottomAt(mid);
   if(jointTop(mid)<grade-.14)continue;
   const bevel=.033+random()*.045,spread=hi-lo,projection=.023+random()*.066;
   const crest=(u)=>Math.max(grade-.09,jointTop(u)-.008-random()*.022);
   const base=(u)=>Math.min(jointTop(u)-.072,Math.max(bottomAt(u)-.13,jointBottom(u)+.008+random()*.025));
   const low=base(mid),high=crest(mid);
   if(high-low<.048)continue;
   const c=Math.min(spread*.24,bevel),r=Math.min((high-low)*.26,bevel);
   const corners=[
    [lo+c,base(lo+c)],[hi-c*.72,base(hi-c*.72)],
    [hi,base(hi)+r],[hi,crest(hi)-r*.85],
    [hi-c*.55,crest(hi-c*.55)],[lo+c*.90,crest(lo+c*.90)],
    [lo,crest(lo)-r],[lo,base(lo)+r*.73]
   ];
   const inset=position(mid,(low+high)*.5,projection+random()*.016);
   const edge=corners.map(([u,y])=>position(u,y,projection*(.57+random()*.26)));
   const back=corners.map(([u,y])=>position(u,y,-.086));
   let tint=shade(stoneBase,.74+random()*.46);
   const wet=waterfront?(1-terrainEase(2.13,2.91,(low+high)*.5))*.74:0;
   const dirt=(1-terrainEase(.03,.48,low-grade))*(.14+random()*.21);
   tint=mix(tint,color(waterfront?"#4d5544":"#615a43"),Math.max(wet,dirt));
   for(let i=0;i<8;i++){
    const j=(i+1)%8;
    triangle(inset,edge[i],edge[j],shade(tint,.94+random()*.09),105,[normal[0],0,normal[1]]);
    quad(back[i],back[j],edge[j],edge[i],shade(tint,.83+random()*.13),105);
   }
  }
  depth+=rise;
  row++;
 }
}

function stoneRetainingRun(x,z,length,alongX,side,bottomAt,topAt,seed){
 const face=u=>alongX?[x+u-length*.5,z]:[x,z+u-length*.5];
 masonryRetainingFace(length,face,alongX?[0,side]:[side,0],u=>topAt(...face(u)),u=>bottomAt(...face(u)),seed);
}
function buildAsagiStationMasonry(footing){
 const top=()=>footing.top+.08,bottom=(x,z)=>terrainSurface(x,z)-.13;
 box(90,footing.top-.014,99,13.54,.06,10.72,color("#8d8776"),0,105);
 for(const side of [-1,1]){
  stoneRetainingRun(90,99+side*5.38,13.72,true,side,bottom,top,198+side);
  stoneRetainingRun(90+side*6.69,99,10.91,false,side,bottom,top,867+side);
 }
 const random=rand(5761);
 for(let i=0;i<124;i++){
  const x=83.05+random()*13.9,z=99+(i%2?1:-1)*(5.57+random()*.49);
  const y=terrainSurface(x,z),r=.024+random()*.075;
  rounded(x,y-.014,z,r,r*.4,r*.72,shade(color("#a49c89"),.75+random()*.43),surface.foundation);
 }
}
function buildAsagiStationCladding(floor){
 const cedar=color("#74604b");
 for(const side of [-1,1]){
  const z=99+side*5.08;
  for(let i=0;i<39;i++){
   const x=84.14+i*.303;
   box(x,floor-.14,z,.298,3.71,.092,shade(cedar,.86+.20*(.5+.5*Math.sin(i*12.3))),0,104);
  }
  for(const x of [84.16,88.07,92.02,95.82])box(x,floor-.15,z+side*.045,.145,3.77,.11,shade(cedar,.68),0,101);
  box(90,floor-.14,z+side*.052,11.94,.14,.135,shade(cedar,.67),0,101);
 }
}
function beavertonWarehouseFinish(x,y,z,w,d,h){
 const boards=color("#766756"),iron=color("#5f5a51"),front=z+d*.5+.05;
 for(let i=0;i<Math.ceil(w/.27);i++){
  const a=x-w*.5+.13+i*.27;
  if(a>x+w*.5-.09||Math.abs(a-x)<w*.13)continue;
  box(a,y+.25,front,.238,h-.24,.058,shade(boards,.81+.24*(.5+.5*Math.sin(i*12.1))),0,104);
 }
 for(const side of [-1,1]){
  const a=x+side*w*.32,b=y+h*.49;
  box(a,b-.075,front+.14,w*.218,.11,.27,boards,0,101);
  box(a,b,front+.12,w*.157,h*.223,.055,color("#63777b"),0,32);
  for(const dx of [-.44,0,.44])box(a+dx*w*.173,b-.06,front+.154,.048,h*.26,.085,iron,0,101);
  box(a,b+h*.105,front+.155,w*.165,.043,.084,iron,0,101);
 }
 const top=y+.24,foot=terrainSurface(x,front+2.4),steps=Math.max(3,Math.ceil((top-foot)/.22));
 for(let n=0;n<steps;n++){
  const stride=2.4/steps,b=front+(n+.5)*stride,ground=terrainSurface(x,b);
  const t=Math.max(ground+.043,lerp(top,foot+.075,n/steps)),base=Math.min(ground-.05,t-.13);
  solidBox(x,base,b,2.1,t-base,stride+.02,boards,101);
 }
}
function beavertonRailBed(){
 const z=110,iron=color("#54575a"),rust=color("#675348"),timber=color("#705d4a"),random=rand(387632);
 for(let x=64;x<151;x++){
  const y=terrainSurface(x,z)+.16,next=terrainSurface(x+1,z)+.16;
  for(const side of [-1,1]){
   const edge=z+side*(1.41+random()*.25);
   quad([x,y-.12,z],[x,terrainSurface(x,edge)+.02,edge],[x+1,terrainSurface(x+1,edge)+.02,edge],[x+1,next-.12,z],shade(color("#837c70"),.84+random()*.26),surface.foundation);
   const rail=z+side*.62;
   box(x,y+.025,rail,.28,.028,.23,rust);
   tube([x,y+.068,rail],[x+1,next+.068,rail],.034,.034,rust,0,6);
   tube([x,y+.092,rail],[x+1,next+.092,rail],.028,.028,iron,0,6);
  }
  box(x,y-.08,z,.23,.11,2.16,shade(timber,.81+random()*.36),0,101);
  for(let n=0;n<7;n++){
   const a=x+random(),b=z+(random()-.5)*3.22,size=.028+random()*.071;
   rounded(a,terrainSurface(a,b)+.035,b,size,size*.42,size*.73,shade(color("#85827a"),.72+random()*.46),surface.foundation);
  }
 }
 const end=64.25,y=terrainSurface(end,z);
 for(const side of [-1,1]){
  const edge=z+side*.68;
  box(end,y,edge,.19,.78,.19,timber,0,101);
  tube([end-1.05,terrainSurface(end-1.05,edge)+.10,edge],[end,y+.62,edge],.092,.092,timber,101,6);
 }
 solidBox(end,y+.61,z,.22,.24,1.72,timber,101);
}


function brunnenLowerQuay(z){return Math.max(2.74,terrainSurface(canalCenter(z)+18,z)+.11)}
function brunnenUpperQuay(z){
 const center=canalCenter(z);
 return Math.max(terrainSurface(center+26,z)+.16,terrainSurface(center+32,z)+.16,brunnenLowerQuay(z)+.38);
}
function buildBrunnenQuay(){
 const masonry=color("#a09784");
 for(let z=211;z<253;z+=.7){
  const next=Math.min(253,z+.7),mid=(z+next)*.5,center=canalCenter(mid);
  const lower=brunnenLowerQuay(mid);
  for(const [edge,w,base] of [[15.0,8.3,1.66],[23.3,10.6,lower-.21]]){
   const a=canalCenter(z)+edge,b=canalCenter(next)+edge;
   const heightAt=edge<20?brunnenLowerQuay:brunnenUpperQuay;
   const ya=heightAt(z),yb=heightAt(next);
   quad([a,ya,z],[b,yb,next],[b+w,yb,next],[a+w,ya,z],shade(masonry,.83+.18*(.5+.5*Math.sin(z*11.7))),surface.paving);
   addSurface(center+edge+w*.5,mid,w+.36,next-z+.05,base,(x,b)=>heightAt(b));
  }
 }
 for(const edge of [15,23.3]){
  const face=u=>[canalCenter(u+211)+edge,u+211];
  const top=u=>(edge===15?brunnenLowerQuay:brunnenUpperQuay)(u+211)+.032;
  const bottom=u=>edge===15?Math.min(1.72,terrainSurface(...face(u))-.22):brunnenLowerQuay(u+211)-.22;
  masonryRetainingFace(42,face,[-1,0],top,bottom,edge===15?58642:38273,edge===15);
 }
 const rubble=rand(50912);
 for(let i=0;i<66;i++){
  const z=211+rubble()*42,x=canalCenter(z)+14.7-rubble()*1.05;
  const y=terrainSurface(x,z),size=.05+rubble()*.18;
  if(y>2.38)continue;
  rounded(x,y-.018,z,size,size*.50,size*.72,shade(color("#6b6a59"),.78+rubble()*.34),105);
 }
 for(const z of [213.4,227.4,243.2,251.0]){
  const center=canalCenter(z),from=brunnenLowerQuay(z),to=brunnenUpperQuay(z);
  const count=Math.max(3,Math.ceil((to-from)/.24)),stride=5.0/count;
  for(let i=0;i<count;i++){
   const x=center+18.45+(i+.5)*stride,top=lerp(from,to,(i+1)/count);
   addSurface(x,z,stride+.03,1.78,from-.19,top);
   for(const side of [-1,1])laidStone(x,top-.25,z+side*.448,stride+.03,.25,.891,1271+i+Math.round(z));
  }
 }
}

function brunnenCanalFacade(x,y,z,w,d,h){
 const face=x-w*.5-.018,trim=color("#b5a88d"),glass=color("#466064"),oak=color("#544839");
 for(const offset of [-.26,.26]){
  const center=z+offset*d,bottom=y+h*.44,base=bottom+h*.23,rad=Math.min(.48,d*.09);
  box(face-.07,bottom-.14,center,.28,.14,rad*2+.38,trim,0,surface.foundation);
  box(face-.026,bottom,center,.054,base-bottom,rad*2,glass,0,32);
  for(const side of [-1,1])box(face-.07,bottom,center+side*(rad+.065),.17,base-bottom,.13,trim,0,surface.foundation);
  for(let i=0;i<9;i++){
   const a=i*Math.PI/9,b=(i+1)*Math.PI/9;
   const p=(angle,r,x)=>[x,base+Math.sin(angle)*r,center+Math.cos(angle)*r];
   triangle([face-.03,base,center],p(a,rad,face-.03),p(b,rad,face-.03),glass,32,[-1,0,0]);
   quad(p(a,rad,face-.15),p(b,rad,face-.15),p(b,rad+.14,face-.15),p(a,rad+.14,face-.15),shade(trim,.87+(i%3)*.055),surface.foundation);
  }
  box(face-.08,bottom,center,.073,base-bottom+rad*.92,.055,oak,0,104);
  box(face-.08,bottom+(base-bottom)*.62,center,.073,.054,rad*2,oak,0,104);
 }
}
