const groundSteps={region:-1,prints:[],splashes:[],printData:new Float32Array(80),waterData:new Float32Array(16)};

// Match the road shader's world-space depressions when deciding whether a foot hits water.
function stepNoise(x,z){
 const fract=n=>n-Math.floor(n);
 const hash=(a,b)=>{
  a=fract(a*.1031);b=fract(b*.0973);
  const d=a*(b+33.33)+b*(a+33.33);
  return fract((a+b+2*d)*(a+d));
 };
 const a=Math.floor(x),b=Math.floor(z),u=terrainEase(0,1,fract(x)),v=terrainEase(0,1,fract(z));
 return lerp(lerp(hash(a,b),hash(a+1,b),u),lerp(hash(a,b+1),hash(a+1,b+1),u),v);
}

function groundUp(x,z){
 const dx=terrainSurface(x+.3,z)-terrainSurface(x-.3,z);
 const dz=terrainSurface(x,z+.3)-terrainSurface(x,z-.3);
 return .6/Math.hypot(.6,dx,dz);
}

function puddleAtStep(x,z,water){
 if(water<.40||x<38||x>565||z<78||z>375)return 0;
 const r=roadDist(x,z), width=roadVergeProfiles[s.region][0];
 if(r>width+2)return 0;
 const irregular=(stepNoise(x*.31,z*.31)-.5)*1.46+(stepNoise(x*1.2,z*1.2)-.5)*.49;
 const track=1-terrainEase(width+irregular-.80,width+irregular+1.10,r);
 const erosion=Math.abs(r+(stepNoise(x*.19,z*.19)-.5)*.77-(width-.8));
 const runoff=stepNoise(x*.19,z*.19)*.62+stepNoise(x*.61,z*.61)*.38;
 const basin=terrainEase(.47,.68,runoff+water*.15);
 const hollow=Math.max(1-terrainEase(.18,.83,erosion),track*basin*.81);
 return terrainEase(.39,.81,water*hollow*basin)*terrainEase(.87,.992,groundUp(x,z));
}

function stepRegion(){
 if(groundSteps.region===s.region)return;
 groundSteps.region=s.region;
 groundSteps.prints.length=0;
 groundSteps.splashes.length=0;
}

function groundContact(time,side){
 stepRegion();
 const sin=Math.sin(facing),cos=Math.cos(facing);
 const advance=characterMotion.gait[side<0?0:2];
 const x=player.x+sin*advance+cos*side*.16,z=player.y+cos*advance-sin*side*.16;
 const floor=terrainSurface(x,z),support=playerSupport();
 if(Math.abs(floor-support)>.22||!fitsTree(x,z,.12)||onVillageWalk(x,z,.08))return;
 const weather=severeWeather(s.region,time,s.day,s.hour,support);
 const pack=weather.snowpack;
 const snowGround=stepNoise(x*.093,z*.093)*.65+stepNoise(x*.26,z*.26)*.35;
 if(pack>.15&&snowGround>.88-pack*.66&&groundUp(x,z)>.56){
  groundSteps.prints.push({x,z,facing,time,opacity:1,pack:weather.snowpack});
  if(groundSteps.prints.length>20)groundSteps.prints.shift();
 }
 const water=puddleAtStep(x,z,weather.standingWater);
 if(water>.15&&floor>2.65){
  groundSteps.splashes.push({x,z,y:floor+.025,time,water});
  if(groundSteps.splashes.length>4)groundSteps.splashes.shift();
 }
}

function drawStepEffects(time,weather,uniform){
 stepRegion();
 const {prints,splashes,printData,waterData}=groundSteps;
 for(let i=prints.length-1;i>=0;i--){
  const p=prints[i],age=(time-p.time)*.001;
  p.opacity=Math.min(p.opacity,cap(weather.snowpack/Math.max(p.pack,.1),0,1),1-terrainEase(35,90,age));
  if(weather.snow>.015)p.opacity=Math.max(0,p.opacity-weather.snow*cap((time-(p.updated??p.time))*.001,0,.1)*.085);
  p.updated=time;
  if(p.opacity<.025)prints.splice(i,1);
 }
 while(splashes.length&&time-splashes[0].time>1350)splashes.shift();
 prints.forEach((p,i)=>printData.set([p.x,p.z,p.facing,p.opacity],i*4));
 splashes.forEach((p,i)=>waterData.set([p.x,p.z,(time-p.time)*.001,p.water],i*4));
 gl.uniform1i(uniform.printCount,prints.length);
 gl.uniform1i(uniform.splashCount,splashes.length);
 gl.uniform4fv(uniform["snowPrints[0]"],printData);
 gl.uniform4fv(uniform["waterSteps[0]"],waterData);
}

function drawFootSpray(time,eye,mesh){
 if(!groundSteps.splashes.length)return;
 verts=[];
 for(const p of groundSteps.splashes){
  const age=(time-p.time)*.001;
  if(age<0||age>.47)continue;
  const random=rand(Math.floor(p.time)+7127);
  for(let i=0;i<16;i++){
   const angle=random()*Math.PI*2,speed=.5+random()*1.6,lift=1.25+random()*1.35;
   const x=p.x+Math.cos(angle)*age*speed,z=p.z+Math.sin(angle)*age*speed;
   const y=p.y+age*(lift-age*5.9);
   if(y<=p.y)continue;
   const size=(.012+random()*.023)*(1-age);
   const dx=eye[2]-z,dz=x-eye[0],scale=size/Math.max(.01,Math.hypot(dx,dz));
   triangle([x-dx*scale,y-size,z-dz*scale],[x+dx*scale,y-size,z+dz*scale],
    [x+dx*scale*.35,y+size*1.8,z+dz*scale*.35],[.48,.63,.70],109,[0,1,0]);
  }
 }
 if(verts.length){
  graphics.footSpray??=gl.createBuffer();
  upload(graphics.footSpray);
  mesh(graphics.footSpray,verts.length/10,[0,0,0],0);
 }
 verts=[];
}

const groundStepsShader=`
float bootPrint(){
 if(printCount==0||distance(camera,point)>35.)return 0.;
 float mark=0.;
 for(int i=0;i<20;i++){
  if(i>=printCount)break;
  vec4 boot=snowPrints[i];
  vec2 q=point.xz-boot.xy;
  if(dot(q,q)>.036)continue;
  float c=cos(boot.z),s=sin(boot.z);
  vec2 uv=vec2(q.x*c-q.y*s,q.x*s+q.y*c);
  float toe=1.-smoothstep(.62,1.05,length((uv-vec2(0.,.048))/vec2(.070,.105)));
  float heel=1.-smoothstep(.62,1.05,length((uv+vec2(0.,.076))/vec2(.054,.064)));
  float tread=.77+.23*step(.24,fract(uv.y*44.+abs(uv.x)*21.));
  mark=max(mark,max(toe,heel)*tread*boot.w);
 }
 return mark;
}

float footRipples(){
 float rings=0.;
 for(int i=0;i<4;i++){
  if(i>=splashCount)break;
  vec4 step=waterSteps[i];
  float distanceToStep=length(point.xz-step.xy);
  float radius=step.z*.92;
  float wave=1.-smoothstep(.012,.043,abs(distanceToStep-radius));
  float echo=1.-smoothstep(.01,.032,abs(distanceToStep-max(0.,radius-.16)));
  rings+=(wave+echo*.42)*step.w*(1.-smoothstep(.18,1.30,step.z));
 }
 return rings;
}
`;
