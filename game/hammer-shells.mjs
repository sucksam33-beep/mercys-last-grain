import * as THREE from "./vendor/three/three.module.min.js";
import {mergeGeometries} from "./vendor/three/BufferGeometryUtils.js";

const hammerSurfaceLibrary={
 wood:["wood_planks_grey","weathered-siding"],
 roof:["roof_tiles_14","roof_tiles_14"],
 stone:["stone_wall_02","stone_wall_02"]
};
const hammerTextures=new Map();
function hammerTexture(file,color){
 const key=file+":"+color;
 if(hammerTextures.has(key))return hammerTextures.get(key);
 const texture=new THREE.TextureLoader().load("assets/"+file+".jpg");
 texture.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.anisotropy=4;hammerTextures.set(key,texture);
 return texture;
}
export function gradeHammerMaterial(material,finish){
 // Broad exposure, mineral dust and fine wear are separate from the grain map.
 const weight=finish==="object"?.27:finish==="leather"?.29:finish==="stone"?.52:.73;
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\n varying vec3 vHammerPoint;")
   .replace("#include <begin_vertex>","#include <begin_vertex>\n vHammerPoint=position;");
  shader.fragmentShader=shader.fragmentShader.replace("#include <common>",`#include <common>
   varying vec3 vHammerPoint;
   float hammerGrain(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  `).replace("#include <color_fragment>",`#include <color_fragment>
   float hammerLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(hammerLuma),${finish==="object"?".42":".22"});
   ${finish==="wood"?"diffuseColor.rgb=pow(max(diffuseColor.rgb,vec3(0.)),vec3(.75))*vec3(1.16,1.12,1.07);":finish==="stone"?"diffuseColor.rgb=pow(max(diffuseColor.rgb,vec3(0.)),vec3(.86));":""}
   vec3 hp=vHammerPoint;
   float hammerAge=smoothstep(.16,.85,.5+.27*sin(hp.x*5.3+hp.z*3.1)+.20*cos(hp.y*6.4-hp.z*2.7));
   float hammerDust=(1.-smoothstep(.08,.61,hp.y))*(.46+.38*sin(hp.x*8.4+hp.z*5.2));
   float hammerDetail=hammerGrain(floor(hp*116.))-.5;
   float hammerWear=smoothstep(.46,.92,hammerGrain(floor(hp*44.)));
   diffuseColor.rgb*=1.+${weight.toFixed(2)}*((hammerAge-.42)*.30+hammerDetail*.105+hammerWear*.047);
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.87,.93,.87),hammerDust*${weight.toFixed(2)});
  `);
 };
 material.customProgramCacheKey=()=>"hammer-finish-"+finish;
 return material;
}

// Fit the construction faces and openings
// coincide with the same dimensions used by snapping and collision.
export function fitHammerShell(item,scene){
 const {id,w,h,d}=item;
 const supported=new Set(["plain-wall","half-wall","window-wall","doorway-wall","stone-arch","gable","partition","hinged-door","sliding-door","double-door","shutter","wind-screen","window-trim","flat-roof","shed-roof","gable-roof","corner-roof","ridge","eave","entry-awning","floor","plinth","post","beam","stairs","ramp","ladder","bench","hearth","reed-screen","workbench","planter"]);
 if(!supported.has(id))return null;
 let source;
 scene.traverse(node=>{if(!source&&node.isMesh)source=(Array.isArray(node.material)?node.material[0]:node.material)?.map?.image;});
 const stone=["stone-arch","plinth","hearth"].includes(id);
 const leather=id==="wind-screen";
 const tiled=["shed-roof","gable-roof","corner-roof","ridge","eave","entry-awning"].includes(id);
 const finish=stone?"stone":leather?"leather":"wood";
 const maps=hammerSurfaceLibrary[finish];
 let map=maps?hammerTexture(maps[0],true):null;
 if(!map&&source?.width>=32&&source?.height>=32){
  try{
   const atlas=document.createElement("canvas");atlas.width=atlas.height=128;
   const ctx=atlas.getContext("2d",{willReadFrequently:true});
   ctx.drawImage(source,0,0,128,128);
   const data=ctx.getImageData(0,0,128,128).data;
   let best={score:-Infinity,x:0,y:0};
   for(let y=4;y<108;y+=4)for(let x=4;x<108;x+=4){
    let valid=0,luma=0,detail=0,previous=0;
    for(let dy=0;dy<20;dy+=2)for(let dx=0;dx<20;dx+=2){
     const i=((y+dy)*128+x+dx)*4,r=data[i],g=data[i+1],b=data[i+2];
     const l=.24*r+.68*g+.08*b;
     if(data[i+3]>220&&l>49&&l<209&&r>b-5){valid++;luma+=l;detail+=dx?Math.abs(l-previous):0;}
     previous=l;
    }
    const score=valid*3+Math.min(detail/52,16)-Math.abs(luma/Math.max(valid,1)-125)*.24;
    if(score>best.score)best={score,x,y};
   }
   if(best.score>180){
    const tile=document.createElement("canvas");tile.width=tile.height=80;
    tile.getContext("2d").drawImage(atlas,best.x,best.y,20,20,0,0,80,80);
    map=new THREE.CanvasTexture(tile);map.colorSpace=THREE.SRGBColorSpace;
   }
  }catch(error){console.warn("건축 재질 견본",id,error);}
 }
 const group=new THREE.Group();
 const finishMaterial=(surface,shade=0xffffff)=>{
  const tex=hammerSurfaceLibrary[surface];
  return gradeHammerMaterial(new THREE.MeshStandardMaterial({
   map:tex?hammerTexture(tex[0],true):map,color:shade,roughness:.92,
   normalMap:tex?hammerTexture(tex[1]+"-normal",false):null,
   normalScale:new THREE.Vector2(.20,.20),
   emissive:0x6d6251,emissiveIntensity:.08
  }),surface);
 };
 const base=finishMaterial(finish,stone?0xe1d6c7:leather?0xd8b99c:0xe5d7c0);
 const frame=finishMaterial(finish,stone?0xc7bcab:0xbfae95);
 const tones=stone?[0xf1e7db,0xd7d2c5,0xe7dcc8,0xd7c5af,0xf0e4d5]:
  leather?[0xe8c9ae,0xdcbf9e,0xddbd9c,0xd9ba9a,0xf0cfad]:
  [0xece2d1,0xd0c6b7,0xd9ccb8,0xe5d4b8,0xc7c1b4];
 const panelColors=tones.map(t=>finishMaterial(finish,t));
 const roofColors=tiled?[0xd9d1bd,0xc9c7b7,0xccc1aa,0xd4c8b3,0xc9c2ae].map(t=>finishMaterial("roof",t)):panelColors;
 const texturePatch=(geometry,u,v,uw,vh)=>{
  const uv=geometry.getAttribute("uv");
  for(let i=0;i<uv.count;i++)uv.setXY(i,u+uv.getX(i)*uw,v+uv.getY(i)*vh);
  return geometry;
 };
 const add=(geometry,material,x,y,z,rx=0,rz=0)=>{
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.rotation.set(rx,0,rz);group.add(mesh);return mesh;
 };
 const box=(x,y,z,width,height,depth,m=base,rx=0,rz=0)=>add(new THREE.BoxGeometry(width,height,depth),m,x,y,z,rx,rz);
 const boards=(cx,low,cz,width,height,depth)=>{
  if(width<=.04||height<=.035)return;
  box(cx,low+height/2,cz,width,height,depth*.78,frame);
  const n=Math.max(1,Math.round(width/.18));
  for(let i=0;i<n;i++){
   const plank=box(cx+((i+.5)/n-.5)*width,low+height/2,cz,width/n-.004,height,depth,panelColors[(i*3+Math.floor(i/5))%5]);
   if(!leather)texturePatch(plank.geometry,.027+(i*5%8)*.119,(i%4)*.12,.079,Math.max(.3,height*.50));
  }
 };
 const trim=(low,high)=>{
  for(const side of [-1,1])box(side*(w/2-.045),h/2,0,.09,h,d,frame);
  box(0,high-.048,0,w,.096,d,frame);
  if(low)box(0,.046,0,w,.092,d,frame);
 };
 function slab(low,depth=d,width=w){
  box(0,low+h*.49,0,width,h*.94,depth,frame);
  for(let i=0;i<10;i++){
   const plank=box((i-4.5)*width/10,low+h*.5,0,width/10-.004,h,depth,panelColors[(i*3)%5]);
   texturePatch(plank.geometry,.027+(i*5%8)*.119,(i%3)*.17,.082,depth*.55);
  }
 }
 function roofPanel(zA,zB,yA,yB,x=0,width=w,rotate=false){
  const dz=zB-zA,dy=yB-yA,l=Math.hypot(dz,dy),rx=-Math.atan2(dy,dz);
  const panel=new THREE.Group();panel.position.set(x,(yA+yB)*.5,(zA+zB)*.5);
  if(rotate){panel.rotation.y=Math.PI*.5;panel.position.set((zA+zB)*.5,(yA+yB)*.5,x);}
  group.add(panel);
  const beam=new THREE.Mesh(new THREE.BoxGeometry(width,.09,l),frame);beam.rotation.x=rx;panel.add(beam);
  const rows=Math.max(1,Math.ceil(l/.22));
  for(let i=0;i<rows;i++){
   const t=(i+.5)/rows-.5;
   for(let k=0;k<10;k++){
    const tile=new THREE.BoxGeometry(width/10-.004,.06,l/rows+.015);
    if(tiled)texturePatch(tile,k/10,i*.69/rows,1/10,.69/rows);
    const m=new THREE.Mesh(tile,roofColors[(i*3+k)%5]);
    m.position.set((k-4.5)*width/10,t*dy+.045,t*dz);m.rotation.x=rx;panel.add(m);
   }
  }
 }
 if(["plain-wall","half-wall","partition","reed-screen"].includes(id)){
  boards(0,0,0,w,h,d*.78);trim(true,h);
 }else if(["doorway-wall","window-wall"].includes(id)){
  const opening=1.16,side=(w-opening)/2,sill=id==="window-wall"?1:0,top=id==="window-wall"?1.83:2.03;
  for(const sign of [-1,1]){
   boards(sign*(opening/2+side/2),0,0,side,h,d*.76);
   box(sign*(opening/2+.03),h/2,0,.06,h,d,frame);
  }
  if(sill){boards(0,0,0,opening,sill,d*.76);box(0,sill-.027,0,opening,.054,d,frame);}
  boards(0,top,0,opening,h-top,d*.76);box(0,top+.034,0,opening,.068,d,frame);
  trim(false,h);
 }else if(id==="stone-arch"){
  const opening=1.35,leg=(w-opening)*.5,curve=.36,spring=h-curve-.19;
  for(const side of [-1,1])for(let i=0;i<6;i++)box(side*(w/2-leg/2),(i+.5)*spring/6,0,leg-.012,spring/6-.009,d,panelColors[i%5]);
  for(let i=0;i<11;i++){
   const a=Math.PI*(i+.5)/11;
   box(Math.cos(a)*.86,spring+Math.sin(a)*.41,0,.37,.237,d,panelColors[i%5],0,a);
  }
 }else if(id==="gable"){
  const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,h);shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:d*.82,bevelEnabled:false});
  const uv=geometry.getAttribute("uv"),positions=geometry.getAttribute("position");
  for(let i=0;i<uv.count;i++)uv.setXY(i,positions.getX(i)/w+.5,positions.getY(i)/h);
  add(geometry,base,0,0,-d*.41);
  for(const side of [-1,1])box(side*w*.25,h*.5,0,Math.hypot(w/2,h),.065,d,frame,0,-side*Math.atan2(h,w/2));
 }else if(["hinged-door","sliding-door","double-door","shutter","wind-screen","window-trim"].includes(id)){
  const border=.06;
  if(id!=="window-trim")boards(0,0,0,w,h,d*.72);
  for(const side of [-1,1]){
   box(side*(w/2-border/2),h/2,0,border,h,d,frame);
   box(0,h/2+side*(h/2-border/2),0,w,border,d,frame);
  }
  if(id==="double-door")box(0,h/2,0,.06,h,d,frame);
  if(["hinged-door","double-door","shutter"].includes(id))box(0,h*.70,d*.35,w*.87,.065,d*.29,frame);
 }else if(id==="flat-roof"||id==="floor"){
  slab(0);
 }else if(id==="gable-roof"){
  roofPanel(-d/2,0,.034,h-.075);roofPanel(0,d/2,h-.075,.034);
 }else if(id==="shed-roof"){
  roofPanel(-d/2,d/2,h-.075,.065);
 }else if(id==="corner-roof"){
  for(const side of [-1,1])roofPanel(-d/2,d/2,.065,h-.075,side*w/4,w*.5,side===1);
 }else if(id==="ridge"){
  roofPanel(-d/2,0,.055,h-.065);roofPanel(0,d/2,h-.065,.055);
 }else if(id==="eave"||id==="entry-awning"){
  const low=id==="eave"?.07:h-.33;
  roofPanel(-d/2,d/2,h-.075,low);
  if(id==="entry-awning")for(const side of [-1,1])box(side*(w/2-.10),low/2,d*.39,.15,low,.15,frame);
 }else if(id==="plinth"){
  for(let z=0;z<3;z++)for(let x=0;x<5;x++)box(((x+.5)/5-.5)*w,h/2,((z+.5)/3-.5)*d,w/5-.014,h,d/3-.014,panelColors[(x+z)%5]);
 }else if(id==="stairs"){
  for(let i=0;i<6;i++)box(0,h*(i+1)/12,d*(.5-(i+.5)/6),w,h*(i+1)/6,d/6,panelColors[i%5]);
 }else if(id==="ramp"){
  roofPanel(-d/2,d/2,h-.075,.065);
 }else if(id==="ladder"){
  for(const side of [-1,1])box(side*w*.43,h/2,0,.08,h,d*.24,frame);
  for(let i=0;i<8;i++)box(0,(i+.6)*h/8,0,w,.065,d*.30);
 }else if(id==="bench"||id==="workbench"){
  const top=id==="bench"?.09:.16;
  box(0,h-top/2,0,w,top,d);
  for(const x of [-w*.38,w*.38])for(const z of [-d*.34,d*.34])box(x,(h-top)/2,z,.10,h-top,.10,frame);
  if(id==="workbench")box(0,.28,0,w*.86,.07,d*.76);
 }else if(id==="hearth"){
  box(0,.1,0,w,.2,d);
  for(const side of [-1,1])for(let i=0;i<4;i++)box(side*w*.385,.29+i*.19,0,w*.23,.182,d,panelColors[i]);
  box(0,h*.75,-d*.15,w*.72,h*.48,d*.68,frame);
 }else if(id==="planter"){
  box(0,.05,0,w,.10,d,frame);
  for(const side of [-1,1]){
   box(0,h/2,side*d*.44,w,h,d*.12);
   box(side*w*.46,h/2,0,w*.08,h,d);
  }
 }else box(0,h*.5,0,w,h,d);
 group.updateMatrixWorld(true);
 const batches=new Map();
 group.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const entries=batches.get(mesh.material)??[];
  entries.push(mesh.geometry.applyMatrix4(mesh.matrixWorld));
  batches.set(mesh.material,entries);
 });
 const fitted=new THREE.Group();
 for(const [material,geometries] of batches){
  const geometry=mergeGeometries(geometries);
  for(const piece of geometries)piece.dispose();
  fitted.add(new THREE.Mesh(geometry,material));
 }
 return fitted;
}



