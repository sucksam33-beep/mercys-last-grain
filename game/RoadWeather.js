// Width, gravel coverage, runoff strength, straw share, and local material colors.
const roadVergeProfiles=[
 [3.5,.40,.85,.28,"#b39a72","#89837b","#79783e"], // Asagi irrigation lanes
 [3.9,.55,.51,.45,"#bba584","#a29985","#8c8548"], // Brünnen field tracks
 [3.6,.72,.67,.93,"#c49b70","#b18264","#a08a53"], // Santa Lucia dry washes
 [3.7,.68,.73,.67,"#b99670","#ab8063","#85804a"], // Juniperwell canyon gravel
 [3.6,.62,.48,.38,"#b6a385","#9d9686","#807e47"], // Beaverton timber tracks
 [3.3,.27,.91,.31,"#aa9673","#858779","#79784b"], // Saint-Aurel floodplain
 [3.7,.50,.62,.66,"#c0ac86","#b7ad91","#929252"], // Ambaro coastal sand
 [3.4,.79,.53,.72,"#aeaba0","#a0a5a8","#8b8f74"]  // Karuk glacial scree
];

// Humidity, front interval, fog pooling, and wind direction.
const districtWeather=[
 [.68,185,.85,1], [.49,219,.46,-1], [.23,249,.18,1], [.36,231,.37,-1],
 [.53,202,.61,1], [.83,170,.96,-1], [.66,155,.67,1], [.59,184,.74,-1]
];

function weatherClockSeconds(day,hour){return ((day-1)*24+hour)*60;}

function localWeather(region,time,day,hour){
 const [humidity,interval,pooling,wind]=districtWeather[region];
 const phase=weatherClockSeconds(day,hour)/interval*Math.PI*2+region*.79+.59;
 const dawn=Math.pow(Math.max(0,Math.cos((hour-6)*Math.PI/12)),4);
 const front=.5+.5*Math.sin(phase+Math.sin(phase*.49)*.72);
 const broken=.5+.5*Math.sin(phase*2.31-1.24);
 const cover=cap(.04+front*(.48+humidity*.48)+broken*.12,0,1);
 const rain=terrainEase(.66,.98,cover)*(.18+.82*terrainEase(.29,.76,humidity));
 const fog=cap(pooling*(dawn*.49+front*front*.54)+rain*.27,0,1);
 const recentFront=.5+.5*Math.sin(phase-.74+Math.sin((phase-.74)*.49)*.72);
 const retained=terrainEase(.58,.94,recentFront)*humidity*.19;
 const wet=cap(rain*.79+retained+humidity*(.17+.22*(.5+.5*Math.sin(phase-.9))),0,1);
 return {cover,rain,fog,wet,wind};
}

function roadSegmentUniform(region){
 const segments=districtRoads(region).concat(region===0?[asagiServiceRoad]:[]);
 const endpoints=segments.flatMap(path=>path.slice(1).flatMap(([x,z],i)=>[...path[i],x,z]));
 // Pad non-Asagi regions with segments beyond the rendered terrain.
 while(endpoints.length<60)endpoints.push(-9999,-9999,-9998,-9999);
 return new Float32Array(endpoints.slice(0,60));
}

function appendRoadVerge(region){
 const [width,gravel,,straw,,stoneTint,grassTint]=roadVergeProfiles[region];
 const paths=districtRoads(region).concat(region===0?[asagiServiceRoad]:[]);
 const random=rand(7219+region*1031),stone=color(stoneTint),grass=color(grassTint);
 for(const path of paths)for(let i=1;i<path.length;i++){
  const [ax,az]=path[i-1],[bx,bz]=path[i];
  const length=Math.hypot(bx-ax,bz-az),dx=(bx-ax)/length,dz=(bz-az)/length;
  for(let step=1;step<length-1;step+=1.65)for(const side of [-1,1]){
   const offset=side*(width+.25+random()*2.4);
   const x=ax+step*dx-dz*offset,z=az+step*dz+dx*offset;
   if(roadDist(x,z)<width-.25||!fitsTree(x,z,1)||
      riverDist(x,z)<channelWidth(z)+3||onVillageWalk(x,z,.6))continue;
   const y=terrainSurface(x,z);
   if(y<2.65)continue;
   if(random()<gravel){
    for(let pebble=0;pebble<3;pebble++){
     const px=x+(random()-.5)*.64,pz=z+(random()-.5)*.64;
     const r=.045+random()*.14,rotation=random()*Math.PI*2;
     const rim=Array.from({length:5},(_,j)=>{
      const angle=rotation+j*Math.PI*.4;
      const tx=px+Math.cos(angle)*r,tz=pz+Math.sin(angle)*r*.8;
      return [tx,terrainSurface(tx,tz)-.015,tz];
     });
     const top=[px+r*.14,terrainSurface(px,pz)+r*.48,pz];
     for(let j=0;j<5;j++)triangle(top,rim[(j+1)%5],rim[j],shade(stone,.72+random()*.4),surface.rock);
    }
   }
   if(random()<.18+straw*.29){
    for(let blade=0;blade<5;blade++){
     const px=x+(random()-.5)*.36,pz=z+(random()-.5)*.36;
     const reach=.15+random()*.29,base=terrainSurface(px,pz)+.017;
     const tipX=px+dx*reach,tipZ=pz+dz*reach;
     const tint=shade(grass,.72+random()*.52+straw*.18);
     triangle([px-dz*.025,base,pz+dx*.025],
              [tipX,terrainSurface(tipX,tipZ)+.045,tipZ],
              [px+dz*.025,base,pz-dx*.025],tint,0,[0,1,0]);
    }
   }
  }
 }
}

const roadWeatherShader=`
float airHaze(){
 float layer=exp(-max(point.y-camera.y,0.)*.029);
 float drift=.75+.25*noise2((camera.xz+point.xz)*.006+vec2(time*.017*atmosphere.w,0.));
 float density=.00104+asagiVisual*.00036+atmosphere.y*(.0017+.014*layer)*drift;
 return 1.-exp(-distance(camera,point)*density);
}

vec3 rainStreaks(vec3 image){
 if(reflectPass>.5)return image;
 image=severeParticles(image);
 if(atmosphere.z<.015)return image;
 vec2 p=gl_FragCoord.xy;
 float column=(p.x+p.y*(.16+stormFx.z*.32)*atmosphere.w)/(29.-stormFx.z*13.);
 float drift=hash(vec2(floor(column),19.));
 vec2 cell=vec2(column,(p.y+time*mix(1050.,1480.,drift))/83.+drift*11.);
 float seed=hash(floor(cell));
 float thread=1.-smoothstep(.009,.032,abs(fract(cell.x)-(.12+.76*seed)));
 float drop=smoothstep(.25,.68,fract(cell.y))*(1.-smoothstep(.69,.89,fract(cell.y)));
 return mix(image,vec3(.75,.79,.82),thread*drop*step(.40,seed)*atmosphere.z*.24);
}

void paintRoadVerge(inout vec3 albedo,inout vec3 normal,inout float puddle){
 vec2 p=point.xz;
 if(p.x<38.||p.x>565.||p.y<78.||p.y>375.||point.y<2.23)return;
 float distanceSquared=90.;
 vec2 direction=vec2(1.,0.),offset=vec2(0.);
 for(int i=0;i<15;i++){
  vec4 segment=roadSegments[i];
  vec2 axis=segment.zw-segment.xy;
  vec2 delta=p-segment.xy-axis*clamp(dot(p-segment.xy,axis)/dot(axis,axis),0.,1.);
  float distanceHere=dot(delta,delta);
  if(distanceHere<distanceSquared){
   distanceSquared=distanceHere;
   direction=normalize(axis);
   offset=delta;
  }
 }
 if(distanceSquared>=90.)return;
 vec2 side=vec2(-direction.y,direction.x);
 float along=dot(p,direction),across=dot(offset,side);
 float width=verge.x+(noise2(p*.31)-.5)*(1.46+.48*asagiVisual)+(noise2(p*1.2)-.5)*.49;
 float radius=sqrt(distanceSquared);
 float track=1.-smoothstep(width-.80,width+1.10,radius);
 float shoulder=smoothstep(width-.90,width+.28,radius)*(1.-smoothstep(width+1.05,width+3.2,radius));
 float detail=1.-smoothstep(16.,52.,distance(camera,point));
 float grit=noise2(p*10.);
 float gravel=smoothstep(.72-verge.y*.31,.85-verge.y*.31,grit);
 float scuffs=noise2(vec2(along*2.6,across*15.));
 float pressed=shoulder*smoothstep(.25,.69,noise2(p*1.07)+scuffs*.25);
 vec3 straw=mix(roadGrass*.80,roadGrass*1.28,verge.w);
 float bend=(noise2(p*.19)-.5)*.77;
 float rut=radius+bend-(verge.x-.8);
 float erosion=abs(rut);
 float run=smoothstep(.29,.61,noise2(p*.23))*verge.z;
 if(asagiVisual>.5)run*=mix(.19,1.,smoothstep(.32,.72,noise2(vec2(along*.41,across*.18))));
 float groove=(1.-smoothstep(.04,.33,erosion))*run;
 float lip=smoothstep(.07,.19,erosion)*(1.-smoothstep(.21,.46,erosion))*run;
 vec3 soil=roadSoil*(.82+noise2(p*2.7)*.25+grit*.13);
 if(asagiVisual>.5){
  float compact=1.-smoothstep(.30,.86,abs(across)/(width+.15));
  float dampPatch=smoothstep(.31,.76,noise2(p*.39)+surfaceClimate.x*.18);
  soil*=mix(vec3(1.),vec3(.82,.87,.91),dampPatch*.54+compact*.16);
  soil=mix(soil,roadStone*(.82+grit*.29),detail*gravel*(1.-compact)*.19);
 }
 soil=mix(soil,roadStone*(.79+grit*.37),gravel*detail*(track*.39+shoulder*.68));
 soil*=1.-groove*(.28+.32*surfaceClimate.x);
 soil+=roadStone*lip*.16;
 float mask=smoothstep(.37,.76,normal.y)*smoothstep(2.23,2.65,point.y);
 albedo=mix(albedo,soil,(track*.84+shoulder*.25)*mask);
 albedo=mix(albedo,straw*(.67+scuffs*.59),pressed*mask*(.48+detail*.24));
 vec2 flank=offset/max(radius,.01)*sign(rut);
 float runoff=noise2(p*.19)*.62+noise2(p*.61)*.38;
 float basin=smoothstep(.47,.68,runoff+standingWater*.15);
 float hollow=max(1.-smoothstep(.18,.83,erosion),track*basin*.81);
 puddle=smoothstep(.39,.81,standingWater*hollow*basin)*
        smoothstep(.87,.992,normal.y)*mask;
 albedo=mix(albedo,albedo*vec3(.47,.51,.53),puddle*.81);
 normal=normalize(normal+vec3(flank.x,0.,flank.y)*(lip*.32+groove*.12)*detail*mask);
}
`;
