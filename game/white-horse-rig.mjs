import {projectFalHorseCoat} from "./white-horse-fal-project.mjs?v=crisp";
import {rebuildHorseBody,dressHorse} from "./white-horse-rebuild.mjs?v=fal-coat-strands";
import * as T from "./vendor/three/three.module.min.js";
const gait=[
 {speed:1.9,frequency:1.05,duty:.69,reach:.28,lift:.18,offsets:[0,.50,.25,.75]},
 {speed:4.5,frequency:1.70,duty:.51,reach:.53,lift:.27,offsets:[0,.50,.50,0]},
 {speed:7.2,frequency:1.87,duty:.42,reach:.65,lift:.32,offsets:[.36,.58,0,.18]},
 {speed:12.4,frequency:2.19,duty:.36,reach:.80,lift:.38,offsets:[.39,.50,0,.15]}
];
const v=(x,y,z)=>new T.Vector3(x,y,z);
const sat=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=sat(x);return x*x*(3-2*x);};
const wrap=x=>x-Math.floor(x);
const mix=T.MathUtils.lerp;
// Rest landmarks are measured from the four limbs in the generated mesh.
const landmarks=[
 [[-.31,.01,-.055],[-.374,-.182,-.063],[-.429,-.355,-.062]],
 [[-.245,.005,.061],[-.223,-.195,.058],[-.224,-.355,.040]],
 [[.109,.026,.060],[.123,-.165,.047],[.043,-.352,.032]],
 [[.163,.026,-.066],[.245,-.193,-.055],[.251,-.355,-.066]]
];
const modelPoint=([x,y,z])=>v(z*2.65,(y+.372)*2.65,-(x+.015)*2.65);
const tau=Math.PI*2;
export function createWhiteHorse(loader){
 const root=new T.Group(),base=new T.Group();root.add(base);
 root.visible=false;let ready=false,phase=0,breath=0,steps=[],previous=null;
 const core=new T.Bone();base.add(core);
 const legs=landmarks.map(row=>{
  const [hip,knee,hoof]=row.map(modelPoint);
  const upper=new T.Bone(),lower=new T.Bone();upper.position.copy(hip);lower.position.copy(knee);base.add(upper,lower);
  return {hip,knee,hoof,upper,lower,upperDir:knee.clone().sub(hip).normalize(),lowerDir:hoof.clone().sub(knee).normalize(),a:knee.distanceTo(hip),b:hoof.distanceTo(knee)};
 });
 const neck=new T.Bone(),tail=new T.Bone();
 neck.position.copy(modelPoint([-.25,.073,0]));tail.position.copy(modelPoint([.23,.035,-.013]));base.add(neck,tail);
 const wind={value:v(0,0,0)};
 const mane=new T.Bone();mane.position.copy(modelPoint([-.21,.19,0])).sub(neck.position);neck.add(mane);
 const bones=[core,...legs.flatMap(l=>[l.upper,l.lower]),neck,tail,mane];
 function prepare(source){
  const geometry=rebuildHorseBody(legs),positions=geometry.attributes.position;
  if(source)root.userData.falCoat=projectFalHorseCoat(geometry,source);
  const indices=new Uint16Array(positions.count*4),weights=new Float32Array(positions.count*4);
  const p=v(0,0,0);
  for(let i=0;i<positions.count;i++){
   p.fromBufferAttribute(positions,i);
   const rawX=-p.z/2.65-.015,rawY=p.y/2.65-.372;
   const offset=i*4;
   const neckWeight=smooth((rawY-.018)/.157)*smooth((.02-rawX)/.27);

   if(neckWeight>.05){
    indices[offset]=9;weights[offset]=neckWeight;
    weights[offset+1]=1-weights[offset];continue;
   }
   let chosen=null,best=Infinity,joint=0;
   for(const [n,leg] of legs.entries()){
    const t=sat((leg.hip.y-p.y)/(leg.hip.y-leg.hoof.y));
    const center=t<.5?leg.hip.clone().lerp(leg.knee,t*2):leg.knee.clone().lerp(leg.hoof,t*2-1);
    const distance=(p.x-center.x)**2+(p.z-center.z)**2;
    if(distance<best){best=distance;chosen=n;joint=t;}
   }
   const attachment=1-smooth((Math.sqrt(best)-.17)/.21);
   const limb=(1-smooth((rawY+.16)/.20))*mix(attachment,1,smooth((-.15-rawY)/.15));
   const lower=smooth((joint-.36)/.30);
   indices[offset]=1+chosen*2;indices[offset+1]=2+chosen*2;
   weights[offset]=limb*(1-lower);weights[offset+1]=limb*lower;weights[offset+2]=1-limb;
  }
  geometry.setAttribute("skinIndex",new T.Uint16BufferAttribute(indices,4));
  geometry.setAttribute("skinWeight",new T.Float32BufferAttribute(weights,4));
  const material=new T.MeshPhysicalMaterial({vertexColors:true,roughness:.45,sheen:.27,sheenColor:0xffffff,clearcoat:.24,clearcoatRoughness:.34});
  material.onBeforeCompile=shader=>{
   shader.vertexShader="varying vec3 vHorseCoat;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nvHorseCoat = position;");
   shader.fragmentShader="varying vec3 vHorseCoat;\n"+shader.fragmentShader.replace("#include <color_fragment>","#include <color_fragment>\nfloat grain=sin(vHorseCoat.x*520. + sin(vHorseCoat.y*135. + vHorseCoat.z*90.)*1.6);\nfloat detail=1.-smoothstep(.10,.58,fwidth(vHorseCoat.x)*520.);\ndiffuseColor.rgb*=1.+grain*.029*detail;").replace("#include <roughnessmap_fragment>","#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+.065*sin(vHorseCoat.z*27.+vHorseCoat.y*18.)+.024*grain*detail,.32,.57);");
  };
  dressHorse(neck,mane,tail,wind);
  const mesh=new T.SkinnedMesh(geometry,material);mesh.frustumCulled=false;
  base.add(mesh);root.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));ready=true;
 }
 let loading;
 function load(){
  loading??=loader.loadAsync("assets/white-horse.glb").then(({scene})=>scene,error=>{console.warn("Fal coat source unavailable",error);return null;}).then(prepare).catch(error=>{console.error("White horse asset:",error);});
 }
 function update(state,dt,ground,weatherWind=0){
  root.visible=Boolean(state&&ready);
  if(!root.visible){previous=null;return;}
  const {x,y,z,yaw,speed}=state;
  root.position.set(x,y,z);root.rotation.y=yaw;
  if(!previous||Math.hypot(previous.x-x,previous.z-z)>2){phase=0;steps=[];}
  previous={x,z};breath+=dt;
  let lo=0;while(lo<gait.length-2&&speed>gait[lo+1].speed)lo++;
  const g=gait[lo],next=gait[lo+1],blend=smooth((speed-g.speed)/(next.speed-g.speed));
  const motion=smooth(speed/1.65);
  phase=wrap(phase+dt*mix(g.frequency,next.frequency,blend)*Math.min(1,speed/.85));
  const cycle=phase*tau;
  base.position.y=(Math.cos(cycle*2)*mix(.024,.098,smooth((speed-2)/9)))*motion+.008*Math.sin(breath*2.5);
  base.rotation.x=Math.sin(cycle)*mix(.025,.095,smooth((speed-2)/9))*motion;
  neck.rotation.x=motion*(Math.sin(cycle+.6)*.12+smooth((speed-4)/9)*.12);
  wind.value.set(breath*6.4,Math.sin(weatherWind-yaw)*.48+.26*Math.sin(breath*1.8),smooth((speed-1)/10));
  mane.rotation.set(.045*Math.sin(breath*3.2)+motion*(.08*Math.sin(cycle-.75)-.10*smooth((speed-3)/9)),.04*Math.sin(breath*3),motion*.06*Math.sin(cycle-.5));
  tail.rotation.set(-.15-motion*.35,Math.sin(breath*2.5)*(.10+motion*.18),Math.sin(cycle)*motion*.08);
  for(const [i,leg] of legs.entries()){
   const distance=next.offsets[i]-g.offsets[i],offset=g.offsets[i]+(distance>.5?distance-1:distance<-.5?distance+1:distance)*blend;
   const t=wrap(phase-offset),duty=mix(g.duty,next.duty,blend),reach=mix(g.reach,next.reach,blend)*motion;
   const swing=t>=duty,part=swing?(t-duty)/(1-duty):t/duty;
   const lift=swing?Math.sin(Math.PI*part)*mix(g.lift,next.lift,blend)*motion:0;
   const target=leg.hoof.clone();
   target.z+=(swing?mix(-reach,reach,smooth(part)):mix(reach,-reach,part));
   const sy=Math.sin(yaw),cy=Math.cos(yaw),wx=x+target.x*cy+target.z*sy,wz=z-target.x*sy+target.z*cy;
   let contact=steps[i];
   if(!swing&&motion>.5){
    if(!contact)steps[i]=contact={x:wx,z:wz};
    const dx=contact.x-x,dz=contact.z-z;
    const planted=dx*sy+dz*cy;
    if(Math.abs(planted-target.z)<.60)target.z=mix(target.z,planted,.85*motion);
   }else steps[i]=null;
   const floor=ground(wx,wz);
   target.y+=lift-base.position.y+Math.max(-.18,Math.min(.2,(floor??y)-y));
   const ray=target.clone().sub(leg.hip);
   const len=Math.min(leg.a+leg.b-.003,Math.max(Math.abs(leg.a-leg.b)+.003,ray.length()));
   ray.normalize();
   const pole=leg.knee.clone().sub(leg.hip);
   pole.addScaledVector(ray,-pole.dot(ray)).normalize();
   const along=(leg.a**2-leg.b**2+len**2)/(2*len);
   const joint=leg.hip.clone().addScaledVector(ray,along).addScaledVector(pole,Math.sqrt(Math.max(0,leg.a**2-along**2)));
   const end=leg.hip.clone().addScaledVector(ray,len);
   leg.upper.quaternion.setFromUnitVectors(leg.upperDir,joint.clone().sub(leg.hip).normalize());
   leg.lower.position.copy(joint);
   leg.lower.quaternion.setFromUnitVectors(leg.lowerDir,end.sub(joint).normalize());
  }
 }
 return {root,load,update,get ready(){return ready;},get stridePhase(){return phase;},seat(){return base.localToWorld(v(0,1.42,-.04));}};
}
