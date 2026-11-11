// Dust, thunderstorms and blizzards follow the region and elevation.
const severeWeatherProfiles=[
 [0,.72,0], [0,.65,0], [.98,.24,0], [.73,.40,0],
 [0,.54,.77], [0,1,0], [0,1,0], [0,.18,1]
];

function severeWeather(region,time,day,hour,elevation){
 const [dustRisk,stormRisk,snowRisk]=severeWeatherProfiles[region];
 const interval=225+region*13;
 const clock=weatherClockSeconds(day,hour)+region*17+31;
 const cycle=Math.floor(clock/interval),phase=(clock%interval)/interval;
 const front=terrainEase(.18,.36,phase)*(1-terrainEase(.54,.75,phase));
 const choice=rand(9721+region*4117+cycle*5011)();
 const cold=terrainEase(13,61,elevation+13*(1-terrainEase(-.25,.35,Math.sin((hour-6)*Math.PI/12))));
 const dust=front*dustRisk*(choice>.15?.95:.46);
 const snow=front*snowRisk*(region===7?.84+.16*cold:cold);
 const storm=front*stormRisk*(1-snow*.94)*(1-dust*.90)*(choice>.22?1:.52);
 const snowpack=snowRisk*(region===7?.84+.16*cold:cold)*
  terrainEase(.27,.58,phase)*(1-terrainEase(.75,.94+cold*.055,phase));
 const standingWater=stormRisk*(1-snowpack)*(1-dust*.9)*
  terrainEase(.30,.48,phase)*(1-terrainEase(.62,.86,phase))*(choice>.22?1:.52);
 const strikeClock=Math.floor(clock/11), strikeTime=clock%11;
 const random=rand(6151+region*7013+strikeClock*521);
 const strikeX=155+random()*328,strikeZ=113+random()*219;
 const flash=storm>.60?storm*Math.max(
  (1-terrainEase(.023,.16,strikeTime)),
  (terrainEase(.19,.21,strikeTime)*(1-terrainEase(.23,.35,strikeTime)))*.56
 ):0;
 return {dust,storm,snow,snowpack,standingWater,flash,strikeTime,strikeClock,strikeX,strikeZ};
}

let thunderAudio,thunderNoise,lastThunder;
function unlockThunder(){
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio)return;
 thunderAudio??=new Audio();
 prepareWorldAudio(thunderAudio);
}
for(const event of ["pointerdown","keydown"])
 window.addEventListener(event,unlockThunder,{once:true});

function playThunder(region,weather,distance,indoors){
 if(thunderAudio?.state!=="running"||!weather.flash||weather.strikeTime>.24||document.hidden)return;
 const key=region+":"+weather.strikeClock;
 if(lastThunder===key)return;
 lastThunder=key;
 const audio=thunderAudio;
 if(!thunderNoise){
  thunderNoise=audio.createBuffer(1,audio.sampleRate*4,audio.sampleRate);
  const wave=thunderNoise.getChannelData(0),random=rand(53192);
  let bass=0;
  for(let i=0;i<wave.length;i++){
   const white=random()*2-1;
   bass=bass*.984+white*.016;
   wave[i]=bass*5.4+white*.12*Math.exp(-i/audio.sampleRate*4);
  }
 }
 const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
 const start=audio.currentTime+cap(distance/343,.08,2.8);
 source.buffer=thunderNoise;
 filter.type="lowpass";
 filter.frequency.value=indoors?170:cap(850-distance,210,850);
 gain.gain.setValueAtTime(.0001,start);
 gain.gain.exponentialRampToValueAtTime((indoors?.16:.30)/(1+distance*.004),start+.10);
 gain.gain.exponentialRampToValueAtTime(.0001,start+3.8);
 source.connect(filter).connect(gain).connect(audio.destination);
 source.start(start);
}

const severeWeatherShader=`
float lightningBolt(){
 if(strike.w<.04||reflectPass>.5)return 0.;
 vec2 toward=strike.xz-camera.xz;
 float depth=length(toward);
 vec2 axis=toward/max(depth,.1),side=vec2(-axis.y,axis.x);
 vec3 ray=point-camera;
 float forward=dot(ray.xz,axis);
 if(forward<depth*.999)return 0.;
 vec3 at=camera+ray*depth/forward;
 float height=at.y-strike.y;
 if(height<-.15||height>122.)return 0.;
 float span=dot(at.xz-strike.xz,side);
 float bend=(noise2(vec2(height*.055,strike.x))-.5)*12.*smoothstep(0.,7.,height);
 bend+=(noise2(vec2(height*.25,strike.z))-.5)*3.6*smoothstep(0.,4.,height);
 float width=max(.13,depth*.0014);
 float branch=bend+max(0.,78.-height)*.47;
 float core=1.-smoothstep(width*.32,width,abs(span-bend));
 float fork=(1.-smoothstep(.10,width*.73+.12,abs(span-branch)))*
            smoothstep(34.,44.,height)*(1.-smoothstep(74.,79.,height));
 float halo=exp(-abs(span-bend)*.61)*.40;
 return (core+fork*.73+halo)*strike.w*(1.-smoothstep(96.,122.,height));
}

vec3 severeParticles(vec3 image){
 if(reflectPass>.5)return image;
 vec2 p=gl_FragCoord.xy;
 float wind=atmosphere.w;
 if(stormFx.x>.015){
  vec2 uv=vec2((p.x-time*490.*wind)*.012,p.y*.051+time*1.9);
  float sweep=smoothstep(.29,.80,noise2(uv));
  float grit=smoothstep(.67,.92,noise2(uv*4.1));
  image=mix(image,vec3(.81,.58,.34),stormFx.x*(sweep*.21+grit*.15));
 }
 if(stormFx.y>.015){
  for(int layer=0;layer<3;layer++){
   float tier=float(layer);
   vec2 drift=vec2(wind*time*(72.+tier*57.)+sin(p.y*.008+time*1.1)*13.,-time*(38.+tier*67.));
   vec2 grid=(p-drift)/(21.+tier*18.);
   vec2 id=floor(grid);
   float seed=hash(id+vec2(9.3,tier*13.));
   vec2 center=vec2(.17)+vec2(hash(id+tier),hash(id+7.3))*.66;
   center.x+=sin(time*(.85+seed*1.7)+seed*31.)*(.035+tier*.008);
   center.y+=cos(time*(.70+seed)+seed*17.)*.025;
   float angle=seed*6.283+time*(seed-.49)*(1.2+tier*.54);
   float c=cos(angle),s=sin(angle);
   vec2 offset=mat2(c,-s,s,c)*(fract(grid)-center);
   float size=mix(.023,.062,seed)*(1.+tier*.19);
   float tumble=.62+.38*abs(cos(time*(.78+seed*2.1)+seed*12.));
   vec2 crystal=offset/vec2(size*tumble,size);
   float outline=max(max(crystal.x*.91+crystal.y*.58,-crystal.x*.74+crystal.y*.80),
     max(-crystal.y*.85+abs(crystal.x+.16)*.44,abs(crystal.x)*.73+crystal.y*.20));
   float edge=1.-smoothstep(.58,.98,outline);
   float opacity=(.25+tier*.15)*mix(.45,1.,seed)*smoothstep(.15,.49,seed);
   vec3 flake=mix(vec3(.70,.78,.84),vec3(.96,.98,1.),clamp(.70+crystal.x*.27-crystal.y*.17,0.,1.));
   image=mix(image,flake,edge*stormFx.y*opacity);
  }
 }
 float glow=lightningBolt();
 return image+vec3(.62,.74,.99)*(glow+strike.w*.21);
}
`;
