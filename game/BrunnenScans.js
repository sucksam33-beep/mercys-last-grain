"use strict";
let cityScanLoad,cityScanTexture,cityScanModels,cityScanUniform;
const cityScanNames=["house","boat","crate"];

function loadCityScans(){
 if(cityScanLoad||gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)<8)return;
 const files=["scan-house.jpg","scan-boat.png","scan-crate.jpg","rough_linen-diff.jpg"];
 const images=Promise.all(files.map(file=>new Promise((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>resolve(image);
  image.onerror=reject;
  image.src="assets/brunnen/"+file;
 })));
 const meshes=Promise.all(cityScanNames.map(async name=>{
  const response=await fetch("assets/brunnen/scan-"+name+".bin");
  if(!response.ok)throw Error(name);
  const data=new Float32Array(await response.arrayBuffer());
  if(!data.length||data.length%24)throw Error(name);
  return [name,data];
 }));
 cityScanLoad=Promise.all([images,meshes]).then(([textures,models])=>{
  const tile=Math.min(1024,gl.getParameter(gl.MAX_TEXTURE_SIZE)/2);
  const atlas=document.createElement("canvas");
  atlas.width=atlas.height=tile*2;
  const ctx=atlas.getContext("2d");
  textures.forEach((image,i)=>ctx.drawImage(image,(i%2)*tile,Math.floor(i/2)*tile,tile,tile));
  const texture=gl.createTexture();
  gl.activeTexture(gl.TEXTURE7);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
  setTextureFiltering();
  gl.activeTexture(gl.TEXTURE0);
  cityScanTexture=texture;
  cityScanModels=Object.fromEntries(models);
  if(s.region===1)loadedScene="";
 }).catch(()=>console.warn("브뤼넨 스캔 에셋을 불러오지 못했습니다."));
}
function bindCityScans(){
 cityScanUniform??=gl.getUniformLocation(graphics.program,"cityScanAtlas");
 gl.uniform1i(cityScanUniform,cityScanTexture?7:0);
 if(cityScanTexture){
  gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,cityScanTexture);gl.activeTexture(gl.TEXTURE0);
 }
}

function cityScan(name,x,y,z,w,h,d,angle=0,door=null,brightness=1){
 if(name==="crate"&&asagiPropsReady()){
  addAsagiProp("closed-wood-crate",x,y,z,w,h,d,angle);
  return true;
 }
 const model=cityScanModels?.[name];
 if(!model)return false;
 const slot=cityScanNames.indexOf(name),cos=Math.cos(angle),sin=Math.sin(angle);
 const vertex=i=>{
  const px=model[i]*w,pz=model[i+2]*d,nx=model[i+3]/w,nz=model[i+5]/d;
  return [px*cos+pz*sin,model[i+1]*h,pz*cos-px*sin,nx*cos+nz*sin,model[i+4]/h,nz*cos-nx*sin,model[i+6],model[i+7]];
 };
 const emit=v=>verts.push(x+v[0],y+v[1],z+v[2],...v.slice(3),slot+(brightness-1.)*.5,65);
 // Remove scan geometry from the existing door aperture. Keep the collision shell.
 const cut=door&&[
  v=>v[2]-door.front,v=>door.half-v[0],v=>v[0]+door.half,
  v=>door.top-v[1],v=>v[1]-.24
 ];
 for(let i=0;i<model.length;i+=24){
  let polygon=[vertex(i),vertex(i+8),vertex(i+16)];
  if(!cut||cut.some(plane=>polygon.every(v=>plane(v)<=0))){
   polygon.forEach(emit);continue;
  }
  for(const plane of cut){
   const inside=[],outside=[];
   polygon.forEach((a,j)=>{
    const b=polygon[(j+1)%polygon.length],da=plane(a),db=plane(b);
    (da>=0?inside:outside).push(a);
    if((da>=0)!==(db>=0)){
     const edge=mix(a,b,da/(da-db));
     inside.push(edge);outside.push(edge);
    }
   });
   for(let j=1;j<outside.length-1;j++){emit(outside[0]);emit(outside[j]);emit(outside[j+1]);}
   polygon=inside;
   if(polygon.length<3)break;
  }
 }
 return true;
}

function cityCloth(corners,tint){
 const normal=unit(cross(sub(corners[1],corners[0]),sub(corners[2],corners[0])));
 for(const i of [0,1,2,0,2,3])verts.push(...corners[i],...normal,...tint,66);
}
