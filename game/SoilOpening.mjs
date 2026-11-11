import * as THREE from "./vendor/three/three.module.min.js";

const cuts=[0,10,23,38,53,69,84,94,102,114,120];
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>t*t*(3-2*t);
export const soilSite={
 grave:[122.6,327.6], granary:[309,339], guard:[309,357],
 spawn:{x:309,y:348.4}, heading:0, pitch:.10, zoom:4.4
};

export function createSoilOpening(now,previous){
 let start=now;
 return {
  previous,
  seek(seconds){start=performance.now()-seconds*1000;},
  sample(time,ground,floor){
   const t=Math.max(0,(time-start)/1000);
   if(t>=120)return null;
   const cut=cuts.findIndex((end,i)=>i>0&&t<end)-1;
   const p=ease((t-cuts[cut])/(cuts[cut+1]-cuts[cut]));
   const [gx,gz]=soilSite.grave,[hx,hz]=soilSite.granary;
   const base=ground(gx,gz), inside=floor(hx,hz);
   const point=(x,z,y=0)=>[x,ground(x,z)+y,z];
   const room=(x,z,y=0)=>[hx+x,inside+y,hz+z];
   const shot={cut,t,prince:point(gx-1,gz+2),yaw:2.65,speed:0,genzo:null,jar:null,lantern:null,named:{},princeHands:null,lens:1};
   if(cut===0){
    shot.prince=room(1.85,.94);shot.eye=room(1.20,1.30,1.24);shot.at=room(.50,-1.07,1.15);
    shot.named.child=room(.17,-1.28);shot.lantern=room(.41,-.88,1.05);
   }else if(cut===1){
    shot.prince=room(.05,1.0);shot.yaw=0;
    shot.eye=room(-1.10,1.32,1.56);shot.at=room(.10,1.25,1.37);
    shot.named.irena=room(.23,mix(1.65,2.25,p));shot.lantern=room(.41,-.88,1.05);
   }else if(cut===2){
    const x=mix(166.8,172.3,p),z=mix(151.0,154.0,p);
    shot.prince=point(x,z);shot.yaw=1.05;shot.speed=.65;
    shot.eye=point(x-4.75,z-1.9-mix(0,1.2,p),2.18);
    shot.at=point(x+22,z+14,2.05);
    shot.lens=1.08;
   }else if(cut===3){
    shot.genzo={position:point(gx-1.01,gz+.62),yaw:1.48};
    shot.prince=point(gx-4,gz+1);
    shot.lantern=[gx-.52,shot.genzo.position[1]+1.23,gz+.67];
    shot.named.keeper=point(gx+3.35,gz-1.9);
    shot.eye=[gx+1.1,base+1.67,gz+2.1];shot.at=[gx-.49,base+1.53,gz+.38];shot.lens=1.48;
   }else if(cut===4){
    const lift=ease(Math.max(0,Math.min(1,(t-61.5)/4.0)));
    shot.prince=[gx+.03,base,gz+1.24];shot.yaw=Math.PI;
    shot.jar=[gx+.03,base+mix(.01,1.10,lift),gz+mix(.43,.55,lift)];
    shot.princeHands=true;
    shot.eye=[gx+.77,base+mix(.85,1.63,lift),gz-.68];
    shot.at=[gx+.04,shot.jar[1]+.22,shot.jar[2]];shot.lens=1.14;
   }else if(cut===5){
    shot.prince=point(gx-3.5-mix(0,2,p),gz+2.7);
    shot.named.keeper=point(gx+mix(2,.38,p),gz-.11);
    shot.eye=[gx-.84,base+1.28,gz+2.57];shot.at=[gx+.12,base+.35,gz+.18];
   }else if(cut===6){
    const x=mix(541,545,p),z=mix(353,355,p);
    shot.prince=point(x,z);shot.yaw=1.18;shot.speed=.70;
    shot.named.irena=point(x+1.9,z-.8);shot.jar=[x+.56,shot.prince[1]+1.09,z+.25];shot.princeHands=true;
    shot.eye=point(x-3.4,z+4.0,2.06);shot.at=point(x+8,z-3,1.4);
   }else if(cut===7){
    const x=533,z=354;
    shot.prince=point(x,z);shot.named.irena=point(x+2,z);
    shot.eye=point(x-3,z+5,2.10);shot.at=point(x+22,z-14,2.0);shot.ridge=true;
   }else if(cut===8){
    shot.prince=room(2.65,1.25);shot.named.irena=room(.57,-.87);shot.irenaPose=true;
    shot.named.child=room(-1.12,.14);shot.lantern=room(-1.02,.50,.8);shot.lanternInHand=true;
    shot.jar=room(.20,-1.57,mix(1.16,1.11,p));
    shot.eye=room(-1.88,1.87,1.42);shot.at=room(-.12,-1.14,1.16);shot.lens=1.2;
   }else{
    const move=ease(Math.min(1,(t-114)/3.5));
    shot.prince=move>=1?point(soilSite.spawn.x,soilSite.spawn.y):room(0,mix(.32,soilSite.spawn.y-hz,move));
    shot.yaw=soilSite.heading;shot.speed=t<117.5?1.25:0;
    shot.eye=room(mix(-1.22,.72,move),mix(-1.43,.93,move),mix(1.71,2.07,move));
    shot.at=point(hx+.72,soilSite.guard[1],2.10);shot.blend=ease(Math.min(1,(t-114)/3.5));
    shot.jar=room(.20,-1.57,1.11);
   }
   shot.title=t>=116&&t<118?"Mercy’s Last Grain":"";
   shot.line=t>=46.1&&t<49?"저 항아리다.":t>=104.4&&t<107.1?"이제 심을 수 있어요?":t>=107.2&&t<110.5?"응. 봄까지 지켜야지.":"";
   return shot;
  }
 };
}

export function makeSoilProps(){
 const jar=new THREE.Group(),lantern=new THREE.Group();
 const material=(color,roughness=1,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const jarClay=material(0x855341,.91),cloth=material(0xa29370),tie=material(0x793a2b),metal=material(0x25241d,.63,.56);
 function texture(mat,fabric){
  const size=128,bytes=new Uint8Array(size*size*4);
  for(let i=0;i<size*size;i++){
   const x=i%size,y=i>>7,noise=((Math.imul(i^4369,15485863)>>>12)&255)/255;
   const shade=fabric?159+32*(x%3===0)+25*(y%4===0)+35*noise:130+52*noise+31*Math.sin(y*.17)+13*Math.cos(x*.21+y*.21);
   bytes.set([shade,shade,shade,255],i*4);
  }
  const map=new THREE.DataTexture(bytes,size,size);map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
  mat.map=mat.bumpMap=map;mat.bumpScale=fabric?.016:.018;
 }
 texture(jarClay,false);texture(cloth,true);
 const part=(group,geometry,mat,x,y,z)=>{const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
 part(jar,new THREE.LatheGeometry([[0,0],[.17,0],[.26,.09],[.285,.24],[.265,.33],[.194,.41],[.196,.44],[.167,.445],[0,.423]].map(([x,y])=>new THREE.Vector2(x,y)),44),jarClay,0,0,0);
 const linen=new THREE.CylinderGeometry(.205,.206,.035,48,2);
 const linenVertices=linen.attributes.position;
 for(let i=0;i<linenVertices.count;i++){
  const x=linenVertices.getX(i),z=linenVertices.getZ(i),a=Math.atan2(z,x);
  if(Math.hypot(x,z)<.1)continue;
  linenVertices.setY(i,linenVertices.getY(i)+.007*Math.sin(a*5)+.005*Math.cos(a*13));
 }
 linen.computeVertexNormals();part(jar,linen,cloth,0,.438,0);
 const rim=part(jar,new THREE.TorusGeometry(.196,.016,9,40),cloth,0,.412,0);rim.rotation.x=Math.PI/2;
 part(jar,new THREE.SphereGeometry(.035,12,8),tie,.059,.421,.191).scale.set(1.25,.63,.65);
 part(jar,new THREE.CapsuleGeometry(.011,.052,4,8),tie,.081,.388,.19).rotation.z=.34;
 part(lantern,new THREE.CylinderGeometry(.086,.11,.06,20),metal,0,0,0);
 part(lantern,new THREE.CylinderGeometry(.094,.082,.06,20),metal,0,.188,0);
 const flame=new THREE.MeshStandardMaterial({color:0xffd48f,emissive:0xff9a38,emissiveIntensity:1.9});
 part(lantern,new THREE.SphereGeometry(.034,16,10),flame,0,.083,0).scale.y=1.58;
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2+Math.PI/4;
  part(lantern,new THREE.CylinderGeometry(.009,.009,.17,6),metal,.084*Math.sin(a),.093,.084*Math.cos(a));
 }
 part(lantern,new THREE.TorusGeometry(.072,.008,8,24,Math.PI),metal,0,.215,0);
 const light=new THREE.PointLight(0xffb56d,4.8,4.8,1.8);light.position.y=.093;lantern.add(light);
 jar.visible=lantern.visible=false;
 return {jar,lantern};
}

