// Each row is phase, right shoulder/elbow/side, left shoulder/elbow/side, and tool pitch.
const clips={
 axe:[[0,.2,.5,.15,.2,.55,.10,-.45],[.32,1.86,.92,.28,.26,.58,.14,.88],[.57,.92,.22,.06,.81,.54,.11,-1.36],[1,.21,.43,.12,.18,.48,.10,-.45]],
 heavyaxe:[[0,.33,.60,.16,.31,.59,.12,-.47],[.40,2.10,.98,.28,1.90,1.08,.19,1.03],[.61,.71,.27,.12,.61,.51,.13,-1.49],[1,.34,.56,.15,.28,.56,.13,-.47]],
 "winter-spear":[[0,.45,.75,.17,.55,.65,.17,-.42],[.25,.93,1.02,.14,1.14,.64,.21,-.62],[.44,1.17,.78,.05,1.54,.15,.05,-1.48],[1,.41,.63,.17,.45,.60,.16,-.42]],
 pick:[[0,.25,.52,.12,.4,.60,.15,-.55],[.44,2.18,.84,.23,1.93,.97,.15,1.16],[.64,.61,.08,.06,.59,.32,.08,-1.55],[1,.22,.42,.12,.23,.55,.13,-.55]],
 shears:[[0,.22,.42,.18,.12,.38,.12,-.30],[.42,.81,.78,.36,1.11,.64,.22,-1.00],[.57,1.00,.58,.09,1.11,.67,.18,-.96],[1,.23,.40,.14,.2,.40,.16,-.35]],
 rod:[[0,.38,.54,.16,.22,.45,.15,-.30],[.27,1.92,.97,.22,.26,.58,.16,.94],[.52,1.62,.14,.10,.87,.70,.12,-.76],[.72,1.12,.42,.12,.98,.82,.13,-.15],[.87,1.32,.54,.12,.81,.97,.13,.10],[1,.32,.54,.16,.31,.48,.16,-.30]],
 staff:[[0,.31,.66,.12,.22,.53,.15,-.36],[.26,.78,1.08,.24,.69,.83,.13,.22],[.50,1.57,.12,.05,1.35,.24,.08,-1.23],[1,.31,.58,.12,.23,.52,.14,-.36]],
 javelin:[[0,.25,.50,.15,.25,.48,.12,-.30],[.36,1.64,1.11,.46,.40,.56,.12,.68],[.55,1.71,.06,.12,1.39,.38,.20,-1.48],[1,.35,.51,.18,.20,.50,.13,-.30]],
 bow:[[0,1.39,1.34,.48,1.53,.24,.18,.06],[.20,1.20,1.30,.59,1.53,.24,.18,.03],[.52,.95,.96,.65,1.46,.25,.21,-.07],[1,.23,.43,.13,.23,.44,.12,-.21]],
 longbow:[[0,1.43,1.39,.56,1.57,.23,.19,.04],[.20,1.27,1.37,.63,1.55,.24,.20,.02],[.53,1.02,1.08,.71,1.48,.25,.20,-.07],[1,.25,.45,.15,.26,.44,.13,-.20]],
 hook:[[0,.40,.65,.11,.38,.55,.12,-.5],[.27,1.52,.19,.12,1.37,.23,.13,-1.38],[.59,.87,1.10,.17,.78,1.19,.14,-.75],[1,.32,.54,.12,.30,.47,.12,-.48]],
 knife:[[0,.51,.63,.29,.39,.58,.10,-.18],[.26,.65,.95,.36,.25,.54,.11,.49],[.47,1.15,.38,-.17,.24,.51,.13,-.76],[1,.36,.52,.22,.27,.48,.12,-.32]],
 spear:[[0,.37,.55,.16,.37,.55,.18,-.43],[.26,.75,.97,.21,1.16,.36,.15,-.97],[.48,1.19,.80,.05,1.57,.12,.05,-1.57],[1,.37,.53,.15,.34,.50,.16,-.43]],
 harpoon:[[0,.25,.53,.16,.30,.52,.17,-.31],[.28,1.84,.97,.46,.38,.55,.14,.87],[.45,1.60,.06,.22,1.18,.36,.17,-1.46],[.73,.74,1.20,.17,.88,1.07,.17,-.80],[1,.28,.51,.12,.32,.50,.18,-.33]],
 shield:[[0,.19,.43,.10,.79,1.03,.24,0],[1,.19,.43,.10,.79,1.03,.24,0]]
};
const drawStart=[0,.46,.75,.17,.48,.72,.15,-.19];
const paired=new Set(["pick","heavyaxe","staff","hook","spear","winter-spear"]);
const bowMotion=new Set(["bow","longbow"]);
const ramp=(a,b,t)=>{const n=Math.max(0,Math.min(1,(t-a)/(b-a)));return n*n*(3-2*n)};
// Tool-only design values from the motion brief. Contact time is normalized by clip duration.
const impactLoad={
 axe:{inertia:.255,omega:10.47,contact:.56,stop:.042/.760},
 pick:{inertia:.484,omega:9.70,contact:.63,stop:.046/.820},
 heavyaxe:{inertia:.760,omega:9.14,contact:.60,stop:.050/1.030}
};
export function toolBrakingLoad(pose){
 const load=impactLoad[pose?.motion];
 if(!load)return 0;
 const contact=pose.contactPhase??load.contact;
 const rise=ramp(contact-.085,contact,pose.phase);
 const decay=1-ramp(contact,contact+load.stop*2.2,pose.phase);
 return (load.inertia*load.omega/7)*rise*decay;
}
export function toolHandWeight(pose,side){
 const motion=pose?.motion,p=pose?.phase??0;
 if(!motion)return 0;
 if(motion==="shield")return side===0?(pose.raise??1):0;
 if(bowMotion.has(motion)){
  if(pose.kind==="draw")return side===0?ramp(0,.22,p):ramp(.05,.31,p);
  return 1-ramp(side===0?.59:.22,side===0?1:.78,p);
 }
 if(side===(pose.hand==="left"?0:1)||paired.has(motion))return 1;
 if(motion==="shears")return ramp(.18,.39,p)*(1-ramp(.62,.86,p));
 if(motion==="rod")return ramp(.59,.74,p)*(1-ramp(.89,1,p));
 if(motion==="harpoon"&&pose.released)return ramp(.50,.73,p)*(1-ramp(.86,1,p));
 return 0;
}
export function sampleToolPose(pose){
 const clip=clips[pose?.motion];
 if(!clip)return null;
 if(pose.kind==="draw")return drawStart.slice(1).map((n,i)=>n+(clip[0][i+1]-n)*pose.phase);
 const p=pose.phase;
 let i=1;
 while(i<clip.length-1&&p>clip[i][0])i++;
 const a=clip[i-1],b=clip[i],f=Math.max(0,Math.min(1,(p-a[0])/(b[0]-a[0])));
 // Monotone cubic interpolation keeps velocity continuous through contact.
 const slope=(left,right)=>left*right>0?2*left*right/(left+right):0;
 const previous=clip[i-2],next=clip[i+1],span=b[0]-a[0];
 return a.slice(1).map((v,j)=>{
  const k=j+1,difference=b[k]-v,velocity=difference/span;
  const start=previous?slope((v-previous[k])/(a[0]-previous[0]),velocity)*span:0;
  const end=next?slope(velocity,(next[k]-b[k])/(next[0]-b[0]))*span:0;
  return v+difference*f*f*(3-2*f)+f*(1-f)*(start*(1-f)-end*f);
 });
}
