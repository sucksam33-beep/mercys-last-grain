import {buildResidentGroom,portraitHairStyle} from "./CharacterGroom.mjs";
import * as THREE from "./vendor/three/three.module.min.js";

const {lerp,smoothstep}=THREE.MathUtils;
const asset=file=>new URL("assets/residents/faces/"+file,import.meta.url);
const photoLoader=new THREE.TextureLoader();
const color=rgb=>new THREE.Color().setRGB(...rgb.map(v=>v/255),THREE.SRGBColorSpace);
let topology;
const read=async file=>{
 const response=await fetch(asset(file));
 if(!response.ok)throw Error("Resident face "+file+": "+response.status);
 return response.json();
};

export async function loadPortraitFace(label){
 topology??=read("topology.json");
 const [mesh,layout,photo]=await Promise.all([read(label+".json"),topology,photoLoader.loadAsync(asset(label+".jpg").href)]);
 photo.colorSpace=THREE.SRGBColorSpace;
 photo.anisotropy=4;
 const sample=document.createElement("canvas"), image=photo.image;
 sample.width=image.width;sample.height=image.height;
 const context=sample.getContext("2d",{willReadFrequently:true});
 context.drawImage(image,0,0);
 const pixels=context.getImageData(0,0,image.width,image.height).data;
 function skinAt(id,inset){
  const u=lerp(mesh.uv[id*2],mesh.uv[168*2],inset);
  const v=lerp(mesh.uv[id*2+1],mesh.uv[168*2+1],inset);
  const x=Math.round(u*(image.width-1)),y=Math.round((1-v)*(image.height-1));
  return Array.from(pixels.slice((y*image.width+x)*4,(y*image.width+x)*4+3));
 }
 mesh.faceTone=Array.from({length:468},(_,id)=>skinAt(id,0));
 mesh.rim=layout.oval.map(id=>skinAt(id,.055));
 return {mesh,layout,photo};
}

function extendNeck(positions,uv,colors,photoMix,triangles,width,chin,skin,neckline,neckScale){
 // Keep the front of the chin intact and open the underside progressively toward the nape.
 const cut=positions.map((_,i)=>i%3===0?positions[i+1]-chin+.003+.62*(positions[i+2]-positions[152*3+2]):0);
 const kept=[], cuts=new Map(), boundary=[], rim=new Set(), neckNormals=[];
 function crossing(a,b){
  const key=a<b?a+":"+b:b+":"+a;
  if(cuts.has(key))return cuts.get(key);
  const t=cut[a*3]/(cut[a*3]-cut[b*3]), id=positions.length/3;
  for(let k=0;k<3;k++){
   positions.push(lerp(positions[a*3+k],positions[b*3+k],t));
   colors.push(lerp(colors[a*3+k],colors[b*3+k],t));
  }
  for(let k=0;k<2;k++)uv.push(lerp(uv[a*2+k],uv[b*2+k],t));
  photoMix.push(lerp(photoMix[a],photoMix[b],t));
  cuts.set(key,id);
  rim.add(id);
  return id;
 }
 for(let i=0;i<triangles.length;i+=3){
  const tri=triangles.slice(i,i+3), polygon=[];
  for(let j=0;j<3;j++){
   const a=tri[j],b=tri[(j+1)%3], inside=cut[a*3]>=0;
   if(inside)polygon.push(a);
   if(inside!==(cut[b*3]>=0))polygon.push(crossing(a,b));
  }
  for(let j=1;j+1<polygon.length;j++)kept.push(polygon[0],polygon[j],polygon[j+1]);
  for(let j=0;j<polygon.length;j++){
   const a=polygon[j],b=polygon[(j+1)%polygon.length];
   if(rim.has(a)&&rim.has(b))boundary.push([a,b]);
  }
 }
 const center=Array.from(rim).reduce(([x,z],i)=>[x+positions[i*3]/rim.size,z+positions[i*3+2]/rim.size],[0,0]);
 let previous=new Map(Array.from(rim,id=>[id,id]));
 const profile=[[.10,.96],[.22,.91],[.38,.83],[.54,.82],[.70,.84],[.86,.77],[1,.63]];
 for(const [t,radius] of profile){
  const row=new Map();
  for(const id of rim){
   const x=positions[id*3],y=positions[id*3+1],z=positions[id*3+2];
   const theta=Math.atan2((x-center[0])/1.12,z-center[1]), shape=smoothstep(t,.04,.88);
   const neckX=Math.sin(theta)*width*.34*radius*neckScale;
   const neckCenterZ=lerp(-.010,.006,smoothstep(t,.17,.62))-.025*smoothstep(t,.64,1);
   const neckZ=neckCenterZ+Math.cos(theta)*width*.35*radius*neckScale;
   const front=(1+Math.cos(theta))*.5;
   row.set(id,positions.length/3);
   positions.push(lerp(x,neckX,shape),lerp(y,neckline-.004*(1-front),t),lerp(z,neckZ,shape));
   uv.push(uv[id*2],uv[id*2+1]);
   const tint=skin.clone().multiplyScalar(lerp(.88,1.035,front)*lerp(.95,1,t));
   const mix=smoothstep(t,.01,.55);
   colors.push(lerp(colors[id*3],tint.r,mix),lerp(colors[id*3+1],tint.g,mix),lerp(colors[id*3+2],tint.b,mix));
   photoMix.push(photoMix[id]*(1-smoothstep(t,.01,.34)));
   const normal=new THREE.Vector3(Math.sin(theta)/.34,.12-.13*t,Math.cos(theta)/.35).normalize();
   neckNormals.push([row.get(id),normal,smoothstep(t,.13,.69)]);
  }
  for(const [a,b] of boundary)kept.push(previous.get(b),previous.get(a),row.get(a),previous.get(b),row.get(a),row.get(b));
  previous=row;
 }
 const end=positions.length/3;
 positions.push(0,neckline,-.015);uv.push(0,0);colors.push(skin.r,skin.g,skin.b);photoMix.push(0);
 for(const [a,b] of boundary)kept.push(previous.get(b),previous.get(a),end);
 return {triangles:kept,neckNormals};
}

function photoHead({mesh,layout,photo},height,width,chin,neckline,neckScale){
 const positions=[],uv=[...mesh.uv],colors=[],photoMix=[];
 const values=mesh.position;
 for(let i=0;i<468;i++){
  const y=values[i*3+1];
  const hairline=smoothstep(y,.78,.98)*height*.17;
  const x=values[i*3], lateral=smoothstep(Math.abs(x),.23,.51);
  const cheek=smoothstep(y,.12,.31)*(1-smoothstep(y,.67,.82));
  const rawDepth=values[i*3+2];
  const relaxed=lerp(rawDepth,Math.max(-.21,Math.min(.16,rawDepth)),lateral*cheek*.50);
  positions.push(x*width*(1-.060*lateral*cheek),chin+y*height,relaxed*height+.018-hairline);
  const sideSkin=color(mesh.skin).multiplyScalar(lerp(.91,1.04,smoothstep(y,.06,.72)));
  const tone=color(mesh.faceTone[i]).lerp(sideSkin,lateral*.76);
  colors.push(tone.r,tone.g,tone.b);
  photoMix.push(1-lateral*.72);
 }
 const edge=layout.oval;
 edge.forEach((id,i)=>{
  const lateral=smoothstep(Math.abs(values[id*3]),.18,.51);
  const tint=color(mesh.rim[i]).lerp(color(mesh.skin),.46+.40*lateral);
  colors.splice(id*3,3,tint.r,tint.g,tint.b);
  photoMix[id]*=1-.73*lateral;
 });
 const centerY=chin+height*.55, backDepth=height*.66, skin=color(mesh.skin);
 for(let ring=1;ring<=8;ring++){
  const t=ring/9, angle=t*Math.PI/2, radius=Math.cos(angle), back=Math.sin(angle);
  edge.forEach((id,i)=>{
   const x=positions[id*3], y=positions[id*3+1], z=positions[id*3+2];
   const crown=height*.13*back*smoothstep(y,chin+height*.63,chin+height);
   positions.push(x*radius,lerp(centerY,y,radius)+crown,lerp(z,.010,back)-back*backDepth);
   uv.push(lerp(mesh.uv[id*2],mesh.uv[168*2],t*.06),lerp(mesh.uv[id*2+1],mesh.uv[168*2+1],t*.06));
   const tint=color(mesh.rim[i]).lerp(skin,.56+.44*smoothstep(t,.02,.68));
   colors.push(tint.r,tint.g,tint.b);
   photoMix.push(.15*(1-smoothstep(t,0,.23)));
  });
 }
 positions.push(0,centerY,.010-backDepth);uv.push(0,0);colors.push(skin.r,skin.g,skin.b);photoMix.push(0);
 const frontCount=layout.triangles.findIndex(tri=>tri.some(i=>i>=468))*3;
 const indices=layout.triangles.flat();
 let facing=0;
 for(let i=0;i<frontCount;i+=3){
  const [a,b,c]=indices.slice(i,i+3).map(k=>k*3);
  facing+=(positions[b]-positions[a])*(positions[c+1]-positions[a+1])-(positions[c]-positions[a])*(positions[b+1]-positions[a+1]);
 }
 if(facing<0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 const neck=extendNeck(positions,uv,colors,photoMix,indices,width,chin,skin,neckline,neckScale);
 const closedHead=neck.triangles;
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
 geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
 geometry.setAttribute("portraitMix",new THREE.Float32BufferAttribute(photoMix,1));
 geometry.setIndex(closedHead);
 geometry.computeVertexNormals();
 const normals=geometry.attributes.normal, vertexNormal=new THREE.Vector3();
 for(const [id,normal,blend] of neck.neckNormals){
  vertexNormal.fromBufferAttribute(normals,id).lerp(normal,blend).normalize();
  normals.setXYZ(id,vertexNormal.x,vertexNormal.y,vertexNormal.z);
 }
 const scalpTint={value:new THREE.Color(0xffffff)};
 const faceMaterial=new THREE.MeshStandardMaterial({map:photo,vertexColors:true,roughness:.84,side:THREE.DoubleSide});
 faceMaterial.userData.scalpTint=scalpTint;
 faceMaterial.onBeforeCompile=shader=>{
  shader.uniforms.scalpTint=scalpTint;
  shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nattribute float portraitMix; varying float vPortraitMix; attribute float hairRoots; varying float vHairRoots;")
   .replace("#include <begin_vertex>","#include <begin_vertex>\nvPortraitMix=portraitMix; vHairRoots=hairRoots;");
  shader.fragmentShader=shader.fragmentShader.replace("#include <common>","#include <common>\nvarying float vPortraitMix; varying float vHairRoots; uniform vec3 scalpTint;")
   .replace("#include <color_fragment>","")
   .replace("#include <map_fragment>","#include <map_fragment>\ndiffuseColor.rgb=mix(vColor,diffuseColor.rgb,vPortraitMix); diffuseColor.rgb=mix(diffuseColor.rgb,scalpTint,vHairRoots*.96);");
 };
 return new THREE.Mesh(geometry,faceMaterial);
}

const hairStyles={
 crop:[.96,1.79,.035,.17],
 part:[1.03,2.08,.082,.66],
 waves:[1.12,2.17,.108,.52],
 curls:[1.13,2.03,.10,.36],
 bun:[1.01,2.16,.056,.63],
 braid:[1.09,2.31,.085,.55],
 scarf:[1.09,2.24,.033,.19],
 cap:[1.08,1.94,.019,.13],
 sparse:[.95,1.94,.04,.25],
 undercut:[1.06,1.72,.15,.84]
};
const castHair={
 sae:"bun",elise:"waves",grandmother:"braid",
 "asagi-01-rice-grower":"scarf","asagi-02-rail-clerk":"part",
 "brunnen-01-wharf-forewoman":"curls","brunnen-02-lock-keeper":"cap",
 "brunnen-03-courier":"braid","brunnen-04-baker":"curls","brunnen-05-bookbinder":"waves",
 "brunnen-06-boat-hand":"crop","brunnen-07-grocer":"waves","brunnen-08-mason":"curls",
 "brunnen-09-rail-porter":"bald","brunnen-10-retired-boatbuilder":"bun",
 "brunnen-11-seamstress":"curls","brunnen-12-canal-maintainer":"undercut",
 "brunnen-13-inspector":"sparse","brunnen-14-boatwright":"waves",
 "brunnen-15-butcher":"crop","brunnen-16-watchman":"waves",
 "brunnen-17-glazier":"braid","brunnen-18-cooper":"waves","brunnen-19-apprentice":"part",
 "brunnen-20-laundress":"scarf","brunnen-21-customs-officer":"bun","brunnen-22-cook":"undercut",
 "brunnen-23-ferryman":"curls","brunnen-24-florist":"waves","brunnen-25-quay-clerk":"braid",
 "brunnen-26-market-grocer":"waves","brunnen-27-lamplighter":"waves","brunnen-28-cobbler":"curls",
 "brunnen-29-canal-resident":"bun","brunnen-30-constable":"crop","brunnen-31-printmaker":"curls",
 "beaverton-02-mine-surveyor":"cap","beaverton-01-rail-technician":"crop",
 "juniperwell-01-sawmill-worker":"braid","juniperwell-02-timber-grader":"curls",
 "karuk-01-weather-observer":"braid","karuk-02-supply-keeper":"cap",
 "ambaro-01-boat-pilot":"bun","ambaro-02-carpenter":"crop",
 "saint-aurel-01-boat-repairer":"braid","saint-aurel-02-net-mender":"curls",
 "santa-lucia-01-adobe-mason":"braid","santa-lucia-02-reservoir-keeper":"part"
};

function fiberTexture(){
 const width=768,height=256, pixels=new Uint8Array(width*height*4);
 const hash=n=>{const x=Math.sin(n*127.1+31.6)*43758.5453;return x-Math.floor(x);};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const t=y/height, warped=x+2.1*Math.sin(t*Math.PI*2+x*.017)+1.2*Math.sin(t*Math.PI*4+x*.047);
  const strand=Math.floor(warped), fraction=warped-strand;
  const glint=(1-Math.abs(fraction-.50)*2)**3;
  const value=Math.round(255*(.69+.20*hash(strand)+.10*glint+.01*hash(x+y*width)));
  pixels.set([value,value,value,255],(y*width+x)*4);
 }
 const texture=new THREE.DataTexture(pixels,width,height,THREE.RGBAFormat);
 texture.wrapS=THREE.RepeatWrapping;
 texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.magFilter=THREE.LinearFilter;
 texture.generateMipmaps=true;
 texture.anisotropy=4;
 texture.needsUpdate=true;
 return texture;
}
const hairFibers=fiberTexture();

function hairstyle({mesh},height,width,chin,label){
 const salt=Array.from(label).reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,0);
 const style=castHair[label]??"part";
 if(style==="bald")return new THREE.Group();
 const [volume,backLength,asymmetry,sweep]=hairStyles[style];
 const covered=style==="scarf"||style==="cap";
 const side=({sae:1,elise:-1,grandmother:1})[label]??(salt%2?1:-1);
 const part=side*(.24+(salt%11)*.032);
 const namedHair={sae:"#29211a",elise:"#633c28",grandmother:"#77736d"};
 const tint=style==="scarf"?new THREE.Color("#b7ab9a"):style==="cap"?new THREE.Color("#343a40"):namedHair[label]?new THREE.Color(namedHair[label]):color(mesh.hair);
 const positions=[],colors=[],indices=[],texcoords=[], rows=28,around=72;
 const centerY=chin+height*.53,centerZ=-height*.18;
 const coord=id=>mesh.position.slice(id*3,id*3+3);
 const templeLeft=coord(127),templeRight=coord(356),forehead=coord(10);
 const skullX=mesh.position.filter((_,i)=>i%3===0);
 const left=Math.max(.37,-Math.min(...skullX)),right=Math.max(.37,Math.max(...skullX));
 const radiusY=height*(.66+.08*(forehead[1]-(templeLeft[1]+templeRight[1])*.5))*volume;
 const radiusZ=height*(.68+.16*(forehead[2]-(templeLeft[2]+templeRight[2])*.5));
 const material=new THREE.MeshStandardMaterial({vertexColors:true,map:covered?null:hairFibers,roughness:covered?.94:.69,side:THREE.DoubleSide});
 function surface(t,az,lift=0){
  const front=(Math.cos(az)+1)*.5;
  const aroundPart=az-part;
  const lateral=Math.sin(az);
  const radiusX=width*((lateral<0?left:right)+.031)*(covered?1.04:volume);
  const shortSide=style==="undercut"?.34*smoothstep(lateral*side,.15,.82):0;
  const hairline=style==="sparse"?.49:.81+.10*Math.sin(aroundPart*2);
  const edge=lerp(backLength,hairline,front**2.4)+asymmetry*Math.sin(aroundPart*2)*front-shortSide;
  const polar=Math.max(.001,t*edge);
  const wave=Math.sin(aroundPart*(style==="curls"?19:10)+polar*(style==="curls"?15:7));
  const parting=Math.exp(-((Math.sin(aroundPart)*7)**2))*front**3;
  const shape=1+(.010+.012*volume)*wave*Math.sin(polar)-parting*.044+lift;
  return [
   Math.sin(az)*Math.sin(polar)*radiusX*shape+part*height*.075*(1-t),
   centerY+Math.cos(polar)*radiusY*shape,
   centerZ+Math.cos(az)*Math.sin(polar)*radiusZ*shape+height*.23*front**5*Math.sin(polar)
  ];
 }
 function vertex(point,shade,u,v){
  positions.push(...point);colors.push(tint.r*shade,tint.g*shade,tint.b*shade);
  texcoords.push(u,v);
 }
 for(let i=0;i<=rows;i++)for(let j=0;j<=around;j++){
  const t=i/rows,az=j/around*Math.PI*2;
  const fibers=Math.sin(az*(covered?34:83)+Math.sin(t*6)*2.1+salt%7);
  const groups=Math.sin(az*9-t*6+salt%5);
  vertex(surface(t,az),.93+.07*fibers+.08*groups+.08*(1-t),j/around,t);
  if(i<rows&&j<around){
   const a=i*(around+1)+j,b=a+around+1;
   indices.push(a,a+1,b,a+1,b+1,b);
  }
 }
 // Overlapping, tapered locks follow the direction of the part, with an independent ridge per lock.
 const locks=covered?26:style==="curls"?124:112, segments=13;
 for(let lock=0;lock<locks;lock++){
  const az=lock/locks*Math.PI*2, phase=lock*2.399+salt%19;
  const start=.06+.28*(.5+.5*Math.sin(phase));
  const finish=.87+.13*(.5+.5*Math.cos(phase*2));
  const lockWidth=(covered?.079:.039)*(1+.33*Math.sin(phase));
  const twist=style==="curls"?.22:.077;
  for(let i=0;i<=segments;i++){
   const t=i/segments, polar=lerp(start,finish,t);
   const shift=side*sweep*Math.sin(Math.PI*t*.67)*(1-.55*Math.cos(az))
    +Math.sin(t*(style==="curls"?14:6)+phase)*twist*Math.sin(Math.PI*t);
   const span=lockWidth*(.035+.965*Math.sin(Math.PI*t)**.70);
   for(let k=0;k<3;k++){
    const cross=k-1;
    const lift=(.006+.021*(1-Math.abs(cross)))*Math.sin(Math.PI*t)**.65;
    const point=surface(polar,az+shift+cross*span,lift);
    const current=positions.length/3;
    vertex(point,(.99+.13*Math.sin(phase)+.08*Math.cos(t*12+phase))*(k===1?1.14:.96),
     (az+shift+cross*span)/(Math.PI*2)+lock*.131,t);
    if(i>0&&k>0)indices.push(current-4,current-3,current,current-4,current,current-1);
   }
  }
 }
 if(!covered){
  for(let i=0;i<66;i++){
   const az=part+side*.46+i*2.399;
   const front=(Math.cos(az)+1)*.5, curl=style==="curls"?.20:.085;
   const start=.38+.27*(.5+.5*Math.sin(i*1.76));
   const finish=lerp(1.12,1.012,front**3);
   const path=Array.from({length:10},(_,step)=>{
    const t=step/9, sweepAngle=az+side*t*.18+Math.sin(t*4+i)*curl;
    const p=surface(lerp(start,finish,t),sweepAngle,Math.sin(t*Math.PI)*(.044+.064*(i%5)/4));
    return new THREE.Vector3(...p);
   });
   for(let j=0;j<path.length;j++){
    const p=path[j],t=j/(path.length-1);
    const radius=height*.0026*Math.sin(Math.PI*t*.94);
    const current=positions.length/3;
    const tangentX=Math.cos(az),tangentZ=-Math.sin(az);
    vertex([p.x-tangentX*radius,p.y,p.z-tangentZ*radius],1.02,.13+i*.019,t);
    vertex([p.x+tangentX*radius,p.y,p.z+tangentZ*radius],1.26,.133+i*.019,t);
    vertex([p.x,p.y-radius,p.z],1.03,.13+i*.019,t);
    vertex([p.x,p.y+radius,p.z],1.22,.133+i*.019,t);
    if(j>0)for(let k=0;k<=2;k+=2)indices.push(current-4+k,current-3+k,current+k,current-3+k,current+1+k,current+k);
   }
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
 geometry.setAttribute("uv",new THREE.Float32BufferAttribute(texcoords,2));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 const hair=new THREE.Mesh(geometry,material);
 if(style==="bun"||style==="braid"&&label!=="grandmother"){
  const bun=style==="bun", centerX=side*height*.13, centerY=chin+height*.53;
  const strands=bun?10:6;
  for(let i=0;i<strands;i++){
   const wrapMaterial=new THREE.MeshStandardMaterial({color:tint.clone().multiplyScalar(.85+.035*i),map:hairFibers,roughness:.73});
   const points=Array.from({length:35},(_,step)=>{
    const t=step/34, angle=t*Math.PI*(bun?4.1:7.5)+i/strands*Math.PI*2;
    if(bun){
     const radius=height*lerp(.045,.27,Math.sin(Math.PI*t*.82));
     return new THREE.Vector3(centerX+Math.cos(angle)*radius,centerY+Math.sin(angle)*radius*.77,
      -height*(.78+.15*Math.sin(Math.PI*t)+.04*Math.cos(angle*2)));
    }
    const radius=height*lerp(.085,.029,t);
    return new THREE.Vector3(centerX+side*height*t*.18+Math.cos(angle)*radius,centerY-height*.79*t,
     -height*(.69+.11*t)+Math.sin(angle)*radius);
   });
   const curve=new THREE.CatmullRomCurve3(points);
   const strip=new THREE.TubeGeometry(curve,44,height*(bun?.035:.025),7,false);
   hair.add(new THREE.Mesh(strip,wrapMaterial));
  }
 }
 if(style==="cap"){
  const brim=new THREE.Mesh(new THREE.SphereGeometry(1,22,12),new THREE.MeshStandardMaterial({color:tint.clone().multiplyScalar(.81),roughness:.94}));
  brim.scale.set(width*(left+right)*.50,height*.047,height*.43);
  brim.position.set(0,chin+height*.84,height*.45);
  hair.add(brim);
 }
 return hair;
}

export function attachPortraitHead(actor,portrait,label,{height,width,chin}){
 const fit={sae:[.021,.91,-.071],elise:[.032,.82,-.062],grandmother:[.036,.81,-.067]};
 const [drop,neckScale,neckline]=fit[label]??[.020,.89,-.072];
 const lowered=chin-drop;
 const style=portraitHairStyle(label,castHair[label]??"part");
 const head=photoHead(portrait,height,width,lowered,neckline,neckScale);
 const hair=buildResidentGroom(portrait,height,width,lowered,label,style,head.geometry);
 if(style==="cap"||style==="scarf"){
  const covering=hairstyle(portrait,height,width,lowered,label);
  covering.name="head-covering";hair.add(covering);
 }
 head.material.userData.scalpTint.value.copy(hair.userData.scalpTint);
 actor.head.add(head,hair);
}
