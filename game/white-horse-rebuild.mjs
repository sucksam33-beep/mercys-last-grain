import * as T from "./vendor/three/three.module.min.js";
import {mergeGeometries} from "./vendor/three/BufferGeometryUtils.js";

const v=(x,y,z)=>new T.Vector3(x,y,z);
function ellipsoid(center,radius,tilt=0){
 const [x,y,z]=center,[a,b,c]=radius,s=Math.sin(tilt),k=Math.cos(tilt);
 return (px,py,pz)=>{
  const u=px-x,dy=py-y,dz=pz-z,yy=dy*k-dz*s,zz=dy*s+dz*k;
  return (Math.sqrt((u/a)**2+(yy/b)**2+(zz/c)**2)-1)*Math.min(a,b,c);
 };
}
function segment(a,b,r0,r1){
 const d=b.clone().sub(a),length=d.lengthSq();
 return (x,y,z)=>{
  const dx=x-a.x,dy=y-a.y,dz=z-a.z,t=T.MathUtils.clamp((dx*d.x+dy*d.y+dz*d.z)/length,0,1);
  return Math.hypot(dx-d.x*t,dy-d.y*t,dz-d.z*t)-T.MathUtils.lerp(r0,r1,t);
 };
}
function smoothUnion(a,b,k){const f=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-f*f*k*.25;}

export function rebuildHorseBody(legs){
 const volumes=[
  [ellipsoid([0,1.10,-.05],[.285,.322,.69]),.15],
  [ellipsoid([0,1.15,-.56],[.30,.32,.36],.10),.16],
  [ellipsoid([0,1.14,.49],[.28,.36,.37],-.25),.17],
  [ellipsoid([0,1.38,.69],[.166,.46,.235],-.42),.15],
  [ellipsoid([0,1.62,.87],[.126,.36,.165],-.29),.12],
  [ellipsoid([0,1.735,1.009],[.103,.163,.151],-.39),.049],
  [ellipsoid([0,1.641,1.123],[.072,.154,.090],-.50),.043],
  [ellipsoid([0,1.536,1.183],[.079,.099,.103],-.58),.039],
  [ellipsoid([0,1.474,1.232],[.085,.067,.088],-.29),.034]
 ];
 for(const {hip,knee,hoof} of legs){
  const ankle=hoof.clone().lerp(knee,.13);ankle.y=Math.max(ankle.y,.13);
  const foot=hoof.clone();foot.y=.071;foot.z+=.035;
  const hind=hip.z<0;
  volumes.push([segment(hip,knee,hind?.127:.103,.064),.085],
   [segment(knee,ankle,.056,.038),.033],
   [segment(ankle,foot,.038,.049),.022],
   [ellipsoid(foot.toArray(),[.059,.074,.071],.10),.023]);
 }
 for(const side of [-1,1]){
  volumes.push([ellipsoid([side*.060,1.681,1.058],[.054,.095,.10],-.46),.039],
   [ellipsoid([side*.076,1.762,1.047],[.038,.055,.067],-.37),.024],
   [ellipsoid([side*.073,1.92,.958],[.033,.125,.044],-.14),.026]);
 }
 const field=(x,y,z)=>{
  let a=volumes[0][0](x,y,z);
  for(let i=1;i<volumes.length;i++)a=smoothUnion(a,volumes[i][0](x,y,z),volumes[i][1]);
  // Sculpt in the lateral surface field so the contours stay attached as the legs flex.
  const side=T.MathUtils.smoothstep(Math.abs(x),.10,.30);
  const lobe=(cy,cz,ry,rz,skew=0)=>Math.exp(-(((y-cy-(z-cz)*skew)/ry)**2+((z-cz)/rz)**2));
  const scapula=lobe(1.215,.51,.208,.154,-.84);
  const shoulder=lobe(1.005,.58,.15,.124,-.35);
  const shoulderFold=lobe(1.077,.342,.142,.070,-.64);
  const rib=lobe(1.164,-.03,.235,.34,.15);
  const flank=lobe(1.01,-.392,.153,.14,.50);
  const hindquarter=lobe(1.11,-.61,.26,.235,.37);
  const stifle=lobe(.897,-.43,.132,.126,.61);
  a+=side*(.022*shoulderFold+.025*flank-.049*scapula-.034*shoulder-.030*rib-.042*hindquarter-.022*stifle);
  const eyeSocket=Math.exp(-(((y-1.749)/.031)**2+((z-1.067)/.049)**2))*T.MathUtils.smoothstep(Math.abs(x),.063,.113);
  const mouth=Math.exp(-(((y-1.451+(z-1.22)*.12)/.012)**2+((z-1.232)/.071)**2))*T.MathUtils.smoothstep(Math.abs(x),.045,.079);
  return Math.max(a+.0075*eyeSocket+.004*mouth,-y);
 };
 const size=[33,83,99],min=[-.45,-.02,-1.18],step=.028;
 const [nx,ny,nz]=size,values=new Float32Array(nx*ny*nz);
 const index=(x,y,z)=>(z*ny+y)*nx+x;
 for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)values[index(x,y,z)]=field(min[0]+x*step,min[1]+y*step,min[2]+z*step);
 const corner=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
 const tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 const pos=[],nor=[],colors=[],indices=[],cache=new Map();
 const swatch=new T.Color(),normalAt=(x,y,z)=>v(field(x+.002,y,z)-field(x-.002,y,z),field(x,y+.002,z)-field(x,y-.002,z),field(x,y,z+.002)-field(x,y,z-.002)).normalize();
 function vertex(a,b){
  const key=a.id<b.id?a.id+","+b.id:b.id+","+a.id;
  if(cache.has(key))return cache.get(key);
  const t=a.value/(a.value-b.value),[x,y,z]=a.point.map((n,i)=>T.MathUtils.lerp(n,b.point[i],t));
  const n=normalAt(x,y,z);
  const shade=.901+.045*Math.sin(y*3+z*1.8)+.027*Math.cos(x*8+z*5)+.014*Math.sin(x*24+y*12-z*8)*Math.cos(y*11+z*18);
  const muzzle=T.MathUtils.smoothstep(z,1.13,1.27)*(1-T.MathUtils.smoothstep(y,1.52,1.61));
  const hoof=1-T.MathUtils.smoothstep(y,.065,.12);
  const jaw=(1-T.MathUtils.smoothstep(Math.hypot((z-1.109)*1.32,y-1.565),.035,.145))*T.MathUtils.smoothstep(Math.abs(x),.058,.10);
  const eye=(1-T.MathUtils.smoothstep(Math.hypot((z-1.065)*1.26,y-1.748),.013,.067))*T.MathUtils.smoothstep(Math.abs(x),.055,.106);
  const warm=shade*(1-.13*jaw-.20*eye);
  swatch.setRGB(warm,warm*.984,warm*.96).lerp(new T.Color('#aa9a94'),muzzle*.79);
  swatch.lerp(new T.Color('#98918a'),hoof*.69);
  const i=pos.length/3;pos.push(x,y,z);nor.push(n.x,n.y,n.z);colors.push(swatch.r,swatch.g,swatch.b);cache.set(key,i);return i;
 }
 function tri(a,b,c){
  const p=v(...pos.slice(a*3,a*3+3)),q=v(...pos.slice(b*3,b*3+3)),r=v(...pos.slice(c*3,c*3+3));
  const norm=v(...nor.slice(a*3,a*3+3));
  if(q.sub(p).cross(r.sub(p)).dot(norm)<0)indices.push(a,c,b);else indices.push(a,b,c);
 }
 for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
  const ids=corner.map(([a,b,c])=>index(x+a,y+b,z+c));
  const val=ids.map(i=>values[i]);if(val.every(n=>n>=0)||val.every(n=>n<0))continue;
  const cell=corner.map(([a,b,c],i)=>({id:ids[i],value:val[i],point:[min[0]+(x+a)*step,min[1]+(y+b)*step,min[2]+(z+c)*step]}));
  for(const t of tetra){
   const inside=t.filter(i=>val[i]<0),out=t.filter(i=>val[i]>=0);
   if(inside.length===1)tri(...out.map(i=>vertex(cell[inside[0]],cell[i])));
   else if(inside.length===3)tri(...inside.map(i=>vertex(cell[i],cell[out[0]])));
   else if(inside.length===2){
    const [a,b]=inside,[c,d]=out,p=vertex(cell[a],cell[c]),q=vertex(cell[a],cell[d]),r=vertex(cell[b],cell[c]),s=vertex(cell[b],cell[d]);
    tri(p,q,r);tri(q,s,r);
   }
  }
 }
 const geometry=new T.BufferGeometry();
 for(const [name,data] of [["position",pos],["normal",nor],["color",colors]])geometry.setAttribute(name,new T.Float32BufferAttribute(data,3));
 geometry.setIndex(indices);geometry.computeBoundingSphere();return geometry;
}
function lock(parent,pivot,points,width,color,wind,batch){
 const curve=new T.CatmullRomCurve3(points.map(p=>v(...p)));
 const frames=curve.computeFrenetFrames(22,false);
 const positions=[],indices=[],progress=[],strandColors=[];
 const shade=new T.Color(color);
 for(let i=0;i<=22;i++){
  const t=i/22,center=curve.getPointAt(t).sub(pivot);
  const radius=width*(.48+.57*Math.sin(Math.PI*(.13+.87*t)))*Math.max(.035,1-t**2.6);
  for(let j=0;j<8;j++){
   const a=j*Math.PI/4;
   const p=center.clone().addScaledVector(frames.normals[i],Math.cos(a)*radius)
    .addScaledVector(frames.binormals[i],Math.sin(a)*radius*(wind?.32:.61));
   positions.push(...p.toArray());progress.push(t);
   if(batch){const s=.82+.18*T.MathUtils.smoothstep(t,0,.34)+.035*Math.cos(a);strandColors.push(shade.r*s,shade.g*s,shade.b*s);}
   if(i){const u=(i-1)*8+j,n=(i-1)*8+(j+1)%8;indices.push(u,n,u+8,n,n+8,u+8);}
  }
 }
 const geometry=new T.BufferGeometry();geometry.setIndex(indices);
 geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
 geometry.setAttribute("horseHairT",new T.Float32BufferAttribute(progress,1));
 if(batch){geometry.setAttribute("color",new T.Float32BufferAttribute(strandColors,3));batch.push(geometry);return;}
 parent.add(new T.Mesh(geometry,hairMaterial(color,wind)));
}
function hairMaterial(color,wind,vertexColors=false){
 const material=new T.MeshPhysicalMaterial({color,vertexColors,roughness:.43,sheen:.49,sheenColor:0xf8f3ee,side:T.DoubleSide});
 if(wind)material.onBeforeCompile=shader=>{
  shader.uniforms.horseWind=wind;
  shader.vertexShader="uniform vec3 horseWind; attribute float horseHairT;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nfloat loose=horseHairT*horseHairT;\nfloat wave=horseWind.x-position.z*13.0+position.y*7.0;\ntransformed.x+=loose*(horseWind.y*.12+sin(wave)*(.024+horseWind.z*.037));\ntransformed.y+=loose*cos(wave*.87)*(.015+horseWind.z*.038);\ntransformed.z-=loose*horseWind.z*.13;");
 };
 return material;
}
export function dressHorse(neck,mane,tail,wind){
 const neckPivot=neck.position.clone(),manePivot=mane.position.clone().add(neckPivot),tailPivot=tail.position.clone();
 const strands=[],tones=[0xe3ded8,0xece8e3,0xf6f2ec,0xf0ece6,0xf9f6ef];
 for(let i=0;i<126;i++){
  const under=i<32,fly=i>=90,side=i%9===0?-1:1;
  const t=under?i/31:((i-32)%48)/47;
  const wave=Math.sin(i*2.398),curl=Math.cos(i*1.63),offset=under?0:.022*wave;
  const y=1.929-.442*t+offset+.009*curl,z=.922-.464*t+.008*wave;
  const spread=.108+.033*wave+.036*t;
  const length=.43+.16*(.5+.5*curl)+(fly?.14:0);
  const ribbon=under?.015+.005*wave:fly?.0017+.0019*(.5+.5*wave):.0045+.006*(.5+.5*wave);
  lock(mane,manePivot,[[side*(.022+.024*(.5+.5*wave)),y,z],[side*(spread*.53),y-.039+.022*wave,z-.101],
   [side*spread,y-.121+.034*curl,z-length*.42],
   [side*(spread+.028+.020*wave),y-.178+.044*wave,z-length*.75],
   [side*(spread+.030*curl),y-.266+.070*curl,z-length]],ribbon,tones[i%tones.length],wind,strands);
 }
 for(let i=0;i<9;i++)lock(mane,manePivot,[[.004*i,1.94,.99],[.032+.010*i,1.90,1.063],[.038+.010*i,1.84,1.10],[.032+.011*i,1.81,1.125]],.0048,0xf2efe7,wind,strands);
 const maneMesh=new T.Mesh(mergeGeometries(strands),hairMaterial(0xffffff,wind,true));
 mane.add(maneMesh);
 for(const geometry of strands)geometry.dispose();
 for(let i=0;i<12;i++){
  const angle=i*Math.PI/6,spread=Math.sin(angle),depth=Math.cos(angle);
  lock(tail,tailPivot,[[spread*.035,1.35,-.86],[spread*.105,1.14,-1.02+depth*.055],
    [spread*.131,.72,-1.18+depth*.07],[spread*.09,.25+((i*7)%6)*.027,-1.30+depth*.09]],
   .062,i%3===0?0xe2ddd4:0xf2eee7);
 }
 const globe=new T.SphereGeometry(1,14,10);
 for(const side of [-1,1]){
  for(const [x,y,z,sx,sy,sz,color] of [[.105,1.749,1.065,.011,.015,.030,0x716662],[.113,1.749,1.067,.010,.011,.023,0x2a2321],[.121,1.753,1.077,.003,.003,.004,0xd0c6b7],[.077,1.498,1.274,.011,.012,.021,0x4b403d]]){
   const mesh=new T.Mesh(globe,new T.MeshStandardMaterial({color,roughness:.36}));
   mesh.position.set(side*x,y,z);mesh.position.sub(neckPivot);mesh.scale.set(sx,sy,sz);mesh.rotation.x=.26;neck.add(mesh);
  }
 }
}
