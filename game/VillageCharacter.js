"use strict";
let villageFrame=null;
// Asagi terraces, Brunnen blocks, Santa Lucia courts, Juniperwell contour rows,
 // Beaverton rail lanes, Saint Aurel embankments, Ambaro beach lanes, Karuk windbreaks.
const villageDistricts=[
 {walls:["#e6d8b5","#a27a52","#c19d72","#e8d9bd"],roof:["#354e57","#565d5c","#5d453c"],trim:"#70462c",roofForms:[1,4,1],rise:.43,size:[1.12,1.02,.88],layout:"terraces",goal:22,spacing:3.6},
 {walls:["#debc89","#c27960","#e2cfac","#ab9c87"],roof:["#46596d","#884a40","#54586d"],trim:"#5b594f",roofForms:[3,5,6],rise:.63,size:[.91,1.11,1.39],layout:"blocks",goal:76,spacing:2.6},
 {walls:["#e6b278","#d48353","#f3d0a0","#b86344"],roof:["#a85135","#86472e","#b77a4e"],trim:"#317178",roofForms:[0,0,4],rise:.28,size:[1.16,1.04,.84],layout:"courts",goal:23,spacing:3.5},
 {walls:["#b38658","#907052","#bc9b70","#876149"],roof:["#3f4f40","#884b32","#595042"],trim:"#633d28",roofForms:[3,3,2],rise:.49,size:[1.03,.91,1.02],layout:"contours",goal:22,spacing:3.7},
 {walls:["#a26743","#c78b48","#dbbe8a","#805445"],roof:["#516771","#455164","#745342"],trim:"#ede0b9",roofForms:[5,3,6],rise:.75,size:[1.02,1.18,1.06],layout:"rail",goal:22,spacing:3.9},
 {walls:["#9eb6a1","#6c9c99","#dfc69b","#9a715a"],roof:["#5b7273","#855648","#537c69"],trim:"#e9d8ab",roofForms:[1,2,4],rise:.36,size:[.92,1.15,.97],layout:"embankments",goal:24,spacing:3.6},
 {walls:["#e8bb79","#c69459","#e8d6a3","#bd7950"],roof:["#b67248","#7a6641","#99774a"],trim:"#307873",roofForms:[1,4,1],rise:.55,size:[1.10,.95,.88],layout:"beach",goal:23,spacing:3.9},
 {walls:["#a45d48","#a6a7a0","#566d75","#c19b6c"],roof:["#3d5263","#685d53","#434c51"],trim:"#c5d3d5",roofForms:[5,5,2],rise:.81,size:[.90,1.10,.91],layout:"windbreaks",goal:23,spacing:3.7}
];
const villagePalette=villageDistricts.map(district=>district.walls);
function villageIdentityDetails(x,y,z,w,d,h,plan){
 const district=villageDistricts[s.region],trim=color(district.trim),front=z+d*.5;
 const wood=surface.wall,stone=surface.masonry;
 const beam=(a,b,width=.12,tint=trim)=>tube(a,b,width,width,tint,wood,4);
 const band=(level,tint=trim)=>box(x,y+h*level,front+.04,w+.12,.13,.16,tint,0,wood);
 const shutters=(tall=false)=>{
  for(const offset of [-.30,.30])for(const side of [-1,1])
   box(x+w*offset+side*w*.097,y+h*.42,front+.30,w*.054,h*(tall?.39:.28),.085,trim,0,wood);
 };
 switch(district.layout){
  case "terraces":
   band(.34);band(.77);
   for(const sign of [-1,1])for(let n=0;n<5;n++)
    box(x+sign*w*.28+(n-2)*w*.033,y+h*.41,front+.34,.048,h*.28,.062,trim,0,wood);
   break;
  case "blocks":
   for(const level of [.28,.67,.92])band(level,shade(trim,1.24));
   for(const offset of [-.32,0,.32]){
    const a=x+offset*w,high=y+h*.73;
    box(a,high,front+.10,w*.13,h*.16,.16,shade(plan.wall,.44),0,stone);
    beam([a-w*.09,high+h*.16,front+.23],[a+w*.09,high+h*.16,front+.23],.055,shade(plan.wall,1.25));
   }
   break;
  case "courts":
   band(.18,shade(plan.wall,.75));band(.86,shade(plan.wall,1.17));shutters();
   for(const offset of [-.44,.44])box(x+offset*w,y+h*.87,front+.12,.18,.18,.62,shade(trim,.56),0,wood);
   break;
  case "contours":
   for(let n=1;n<7;n++)band(n/8,shade(trim,.78+n*.045));
   for(const sign of [-1,1])beam([x+sign*w*.11,y+h*.83,front+.22],[x+sign*w*.44,y+h*.39,front+.22],.095);
   break;
  case "rail":
   band(.22);band(.72);
   for(const offset of [-.44,-.18,.18,.44])box(x+w*offset,y+h*.23,front+.13,.105,h*.57,.13,trim,0,wood);
   box(x,y+h*.84,front+.09,w*.37,.32,.12,shade(trim,.82),0,wood);
   break;
  case "embankments":
   band(.22);band(.82);shutters(true);
   for(const offset of [-.42,.42]){
    const a=x+w*offset;
    beam([a,y+h*.26,front+.15],[a,y+h*.84,front+.15],.085);
   }
   break;
  case "beach":
   band(.26);band(.78);shutters();
   for(const offset of [-.33,.33]){
    const a=x+w*offset;
    for(let n=0;n<4;n++)beam([a-.41,y+h*.43+n*.12,front+.42],[a+.41,y+h*.43+n*.12,front+.42],.028,shade(trim,1.14));
   }
   break;
  case "windbreaks":
   band(.20);band(.82);shutters();
   for(const offset of [-.42,.42])beam([x+w*offset,y+h*.24,front+.15],[x+w*offset,y+h*.88,front+.15],.080,trim);
   break;
 }
}

function villagePoint(x,z){
 const f=villageFrame;
 if(!f)return [x,z];
 const dx=x-f.x,dz=z-f.z;
 return [f.x+dx*f.c-dz*f.s,f.z+dx*f.s+dz*f.c];
}
function buildVillageHouse(x,z,w,d,h,wall,roof,turn,style,serial){
 const c=[1,0,-1,0][turn],sine=[0,1,0,-1][turn];
 const start=verts.length;
 villageFrame={x,z,c,s:sine,swap:turn%2};
 try{
  houseMesh(x,z,w,d,h,wall,roof,"민가",true,style);
  const footprint=buildingFootprints.at(-1);
  Object.assign(footprint,{expanded:true,turn,style,serial,approach:villageFrame.approach});
  if(turn%2){
   [footprint.w,footprint.d]=[footprint.d,footprint.w];
   [footprint.insideW,footprint.insideD]=[footprint.insideD,footprint.insideW];
  }
  const plan=footprint.buildingPlan;
  const y=foundationGrade(x,z,plan.w,plan.d).top;
  villageDetails(x,y,z,plan.w,plan.d,plan.h,plan.wall,plan.roof,style,serial);
  for(let i=start;i<verts.length;i+=10){
   [verts[i],verts[i+2]]=villagePoint(verts[i],verts[i+2]);
   const nx=verts[i+3],nz=verts[i+5];
   verts[i+3]=nx*c-nz*sine;verts[i+5]=nx*sine+nz*c;
  }
 }finally{villageFrame=null}
}
function villageDetails(x,y,z,w,d,h,wall,roof,style,serial){
 if(s.region!==2)craftedVillageEntry(x,y,z,w,d,h,serial);
}
const villageStoneTones=["#979a85","#a99c87","#bf8d61","#8b806a","#939591","#86948a","#c4a983","#889ea4"];
const villagePathSoils=["#b0a279","#a29782","#cf975f","#a18360","#a79883","#8e9c7c","#d4b178","#8f9694"];
const villageVergeColors=[
 ["#667a44","#9ca45b","#cbb694"],["#496844","#738751","#a77e46"],["#687752","#a0a16d","#d4a95f"],
 ["#4d6742","#708651","#a5a16a"],["#55634e","#78876b","#c6ad69"],["#527153","#77965c","#b1aa6d"],
 ["#527b4b","#839c58","#d9a261"],["#55685d","#75867a","#a1a68e"]
];
function dressVillageVerges(nodes){
 const palette=villageVergeColors[s.region].map(color);
 const random=rand(7131+s.region*211),used=[];
 const count=Math.min(nodes.length,240);
 for(let i=0;i<count;i++){
  const [cx,cz]=nodes[Math.floor(i*nodes.length/count)];
  const angle=random()*Math.PI*2,distance=2.1+random()*2.1;
  const x=cx+Math.cos(angle)*distance,z=cz+Math.sin(angle)*distance;
  if(used.some(([a,b])=>Math.hypot(a-x,b-z)<3.4)||!villageRouteGround(x,z,.72)||
    onVillageWalk(x,z,.90)||roadDist(x,z)<3.8||districtConnectionDistance(s.region,x,z)<8)continue;
  const y=terrainSurface(x,z);
  used.push([x,z]);
  villageVergeDetail(x,y,z,.32+random()*.37,i*119+s.region*731,palette[i%3]);
 }
}

function villageStoneTone(){return color(villageStoneTones[s.region]);}
function villagePaver(point,t,u,left,right,seed,tint,base=.051,top=.068){
 const wobble=Math.sin(seed*1.87)*.032*(right-left);
 const l=left+wobble,r=right+wobble;
 const bevel=(r-l)*(.09+.035*Math.sin(seed));
 const cut=(u-t)*(.14+.052*Math.sin(seed*2.1));
 const rim=[point(t,r-bevel,top),point(t,l+bevel,top),point(t+cut,l,top),
  point(u-cut,l,top),point(u,l+bevel,top),point(u,r-bevel,top),point(u-cut,r,top),point(t+cut,r,top)];
 for(let i=1;i<rim.length-1;i++)triangle(rim[0],rim[i],rim[i+1],tint,104);
 quad(rim[1],rim[0],point(t,r-bevel,base),point(t,l+bevel,base),shade(tint,.78),104);
 quad(rim[2],rim[1],point(t,l+bevel,base),point(t+cut,l,base),shade(tint,.85),104);
}

function villagePathTread(corners,top,tint){
 const flat=corners.map(([x,,z])=>[x,top,z]);
 quad(...flat,tint,surface.paving);
 for(let i=0;i<4;i++){
  const j=(i+1)%4;
  const bottomA=[corners[i][0],corners[i][1]-.12,corners[i][2]];
  const bottomB=[corners[j][0],corners[j][1]-.12,corners[j][2]];
  quad(flat[j],flat[i],bottomA,bottomB,shade(tint,.86),surface.foundation);
 }
 const xs=flat.map(p=>p[0]),zs=flat.map(p=>p[2]);
 const x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs);
 addSurface((x0+x1)*.5,(z0+z1)*.5,x1-x0,z1-z0,Math.min(...corners.map(p=>p[1]))-.12,(x,z)=>{
  let left=false,right=false;
  for(let i=0;i<4;i++){
   const a=flat[i],b=flat[(i+1)%4];
   const side=((b[0]-a[0])*(z-a[2])-(b[2]-a[2])*(x-a[0]))/Math.hypot(b[0]-a[0],b[2]-a[2]);
   if(side<-.025)left=true;
   if(side>.025)right=true;
  }
  return left&&right?-Infinity:top;
 });
}
function villagePath(a,b,width,paved=false,routed=false,curve=null){
 const length=curve?.length??Math.hypot(b[0]-a[0],b[1]-a[1]);
 if(length<.1)return;
 const dx=(b[1]-a[1])/length*width*.5,dz=(a[0]-b[0])/length*width*.5;
 const point=(t,side,lift)=>{
  let x=lerp(a[0],b[0],t)+dx*side,z=lerp(a[1],b[1],t)+dz*side;
  if(curve){
   const [cx,cz]=curve.at(t),[ax,az]=curve.at(t-.35/length),[bx,bz]=curve.at(t+.35/length);
   const tangent=Math.hypot(bx-ax,bz-az);
   x=cx+(bz-az)/tangent*width*.5*side;
   z=cz-(bx-ax)/tangent*width*.5*side;
  }
  return [x,terrainSurface(x,z)+lift,z];
 };
 const clear=(x,z)=>routed?villageRouteGround(x,z,.02):riverDist(x,z)>=channelWidth(z)+2&&
  !buildingFootprints.some(p=>Math.abs(x-p.x)<(p.insideW??p.w)*.5&&Math.abs(z-p.z)<(p.insideD??p.d)*.5)&&
  !(s.region===0&&x>asagiRail.from&&x<asagiRail.to&&Math.abs(z-asagiRail.z)<2.1);
 const steps=Math.ceil(length/(paved?.49:.57));
 const cols=Math.max(3,Math.round(width/.43));
 const soil=color(villagePathSoils[s.region]);
 const brick=villageStoneTone();
 const canStep=routed&&s.region!==1;
 const stairStone=brick;
 for(let i=0;i<steps;i++){
  const t=i/steps,u=(i+1)/steps,center=point((t+u)*.5,0,0);
  if(!clear(center[0],center[2])||(routed&&onAsagiBridge(center[0],center[2])))continue;
  if(routed)markVillageWalk(center[0],center[2],width*.47);
  if(s.region===1&&brunnenPavedArea(center[0],center[2])&&center[0]>=100&&center[0]<185&&center[2]>=92&&center[2]<145.2)continue;
  const startY=canStep?point(t,0,0)[1]:0,endY=canStep?point(u,0,0)[1]:0;
  const stepEdgesClear=canStep&&[point(t,.96,0),point(t,-.96,0),point(u,.96,0),point(u,-.96,0)].every(p=>clear(p[0],p[2]));
  if(stepEdgesClear&&Math.abs(endY-startY)/(length/steps)>.25){
   const count=Math.max(1,Math.ceil(Math.abs(endY-startY)/.23));
   for(let k=0;k<count;k++){
    const first=lerp(t,u,k/count),last=lerp(t,u,(k+1)/count);
    const left=point(first,.96,0),right=point(first,-.96,0),nextRight=point(last,-.96,0),nextLeft=point(last,.96,0);
    const top=Math.max(point(first,0,0)[1],point(last,0,0)[1])+.07;
    villagePathTread([left,right,nextRight,nextLeft],top,shade(stairStone,.94+(i%3)*.055));
   }
   continue;
  }
  const edge=paved?1:.91+.09*Math.sin(i*.72+a[0]);
  const base=paved?mix(shade(brick,.71),soil,.21):shade(soil,.94+.09*Math.sin(i*.94+a[0]));
  if(paved){
   const shoulder=1.09+.055*Math.sin(i*.53+a[0]),next=1.09+.055*Math.sin((i+1)*.53+a[0]);
   quad(point(t,shoulder,.012),point(t,.91,.047),point(u,.91,.047),point(u,next,.012),shade(soil,.90),surface.ground);
   quad(point(t,-.91,.047),point(t,-shoulder,.012),point(u,-next,.012),point(u,-.91,.047),shade(soil,.90),surface.ground);
  }
  for(let j=0;j<cols;j++){
   const lo=lerp(-edge,edge,j/cols),hi=lerp(-edge,edge,(j+1)/cols);
   quad(point(t,hi,.055),point(t,lo,.055),point(u,lo,.055),point(u,hi,.055),base,paved?surface.paving:surface.ground);
  }
  if(!paved)continue;
  for(let j=-1;j<cols;j++){
   const shift=i%2?.5:0;
   const left=cap(-1+2*(j+shift)/cols+.025,-1,1);
   const right=cap(-1+2*(j+1+shift)/cols-.025,-1,1);
   if(right-left<.025)continue;
   const seed=i*2.76+j*3.19+a[1],trim=(u-t)*(.035+.028*Math.abs(Math.sin(seed)));
   const tint=shade(brick,.95+.075*Math.sin(seed));
   villagePaver(point,t+trim,u-trim,left*.975,right*.975,seed,tint);
  }
 }
}
function villageRoadLink(points){
 let link;
 for(const p of points)for(const road of districtRoads())for(let i=1;i<road.length;i++){
  const a=road[i-1],b=road[i],dx=b[0]-a[0],dz=b[1]-a[1];
  const t=cap(((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz),0,1);
  const q=[a[0]+dx*t,a[1]+dz*t],gap=Math.hypot(q[0]-p[0],q[1]-p[1]);
  if(gap>=70||(link&&gap>=link.gap))continue;
  const clear=Array.from({length:10},(_,j)=>{
   const x=lerp(p[0],q[0],j/9),z=lerp(p[1],q[1],j/9);
   return riverDist(x,z)>channelWidth(z)+3&&!buildingFootprints.some(h=>Math.abs(x-h.x)<h.w*.5+1&&Math.abs(z-h.z)<h.d*.5+1);
  }).every(Boolean);
  if(clear)link={p,q,gap};
 }
 if(link)villagePath(link.p,link.q,s.region===1?3.1:2.45,true);
}
function villageMeetingPlace(points,streetNodes){
 if(points.length<3)return;
 const a=points[Math.floor((points.length-1)/2)],b=points[Math.ceil(points.length/2)];
 const x=(a[0]+b[0])*.5,z=(a[1]+b[1])*.5+2.2;
 if(riverDist(x,z)<channelWidth(z)+4||buildingFootprints.some(p=>Math.abs(x-p.x)<p.w*.5+2&&Math.abs(z-p.z)<p.d*.5+2))return;
 if(onVillageWalk(x,z,1.15)||streetNodes.some(([a,b])=>Math.hypot(a-x,b-z)<2.2))return;
 const y=terrainSurface(x,z),stone=color(villagePalette[s.region][0]),wood=color("#6d553d");
 villagePath([(a[0]+b[0])*.5,(a[1]+b[1])*.5],[x,z],1.35);
 if([1,2,7].includes(s.region)){
  tube([x,y,z],[x,y+.51,z],.61,.56,shade(stone,.81),surface.foundation,16);
  tube([x,y+.47,z],[x,y+.57,z],.60,.61,stone,surface.masonry,16);
  addSurface(x,z,1.2,1.2,y,y+.57);
 }else{
  for(const dx of [-.62,.62])box(x+dx,y,z,.14,.47,.30,wood,0,surface.wall);
  box(x,y+.46,z,1.6,.11,.38,shade(wood,1.18),0,surface.wall);
  addSurface(x,z,1.6,.38,y,y+.57);
 }
}

"use strict";

// Climate and use determine what an entrance is built from.
const villageCraft = [
 {stone:"#827e6e",wood:"#77604a",roof:"#52616a",use:"sill",plant:59},
 {stone:"#978b77",wood:"#634b3c",roof:"#655d5c",use:"gutter",plant:59},
 {stone:"#b47b52",wood:"#85614a",roof:"#a36345",use:"shade",plant:58},
 {stone:"#8a7b65",wood:"#705640",roof:"#706458",use:"stack",plant:57},
 {stone:"#797a74",wood:"#866e52",roof:"#606c72",use:"rack",plant:57},
 {stone:"#738179",wood:"#766b50",roof:"#697a75",use:"raised",plant:60},
 {stone:"#af9e80",wood:"#8c7759",roof:"#9c845a",use:"screen",plant:58},
 {stone:"#7c878a",wood:"#635d53",roof:"#566775",use:"wind",plant:61},
];

function villageSplitStone(x,y,z,w,h,d,tint,seed) {
 const random=rand(seed);
 const angle=random()*.45-.22;
 const rim=Array.from({length:7},(_,i)=>{
  const a=i/7*Math.PI*2+angle, r=.79+random()*.22;
  return [Math.cos(a)*w*.5*r,Math.sin(a)*d*.5*r];
 });
 const bottom=rim.map(([a,b])=>[x+a,y,z+b]);
 const top=rim.map(([a,b])=>[x+a*.69,y+h*(.72+random()*.28),z+b*.71]);
 const crown=[x+w*.052,y+h,z-d*.07];
 for(let i=0;i<rim.length;i++){
  const next=(i+1)%rim.length;
  const tone=shade(tint,.83+random()*.26);
  triangle(top[next],top[i],crown,tone,architectureMaterials.stone);
  quad(bottom[i],top[i],top[next],bottom[next],shade(tone,.88),architectureMaterials.stone);
 }
}

function craftedVillageEntry(x,y,z,w,d,h,serial) {
 const profile=villageCraft[s.region], mat=architectureMaterials;
 const timber=color(profile.wood), stone=color(profile.stone), roof=color(profile.roof);
 const side=serial%2?-1:1, front=z+d*.5;
 const a=x+side*w*.32,b=front+.47;
 const base=y+.30;
 const nail=color("#50514b");
 const beam=(p,q,r,tint=timber,material=mat.wood)=>tube(p,q,r,r*.86,tint,material,5);
 if(profile.use==="shade"||profile.use==="screen"){
  // A sloping shade frame keeps direct sun and salt spray off the window.
  const span=Math.min(1.95,w*.27), high=y+h*.76, low=high-.25;
  for(const edge of [-1,1]){
   const at=a+edge*span*.5;
   beam([at,high,front+.12],[at,low,b+.37],.048);
   beam([at,high-.54,front+.12],[at,low,b+.37],.038);
  }
  beam([a-span*.5,low,b+.37],[a+span*.5,low,b+.37],.045);
  for(let i=0;i<13;i++){
   const at=a+span*(i/12-.5), end=b+.38+Math.sin(i*3.6)*.027;
   beam([at,high+.018,front+.09],[at,low+.02,end],.033,shade(roof,.85+(i%4)*.08));
  }
 }else if(profile.use==="stack"||profile.use==="rack"){
  // Wood or rail repair stock is kept on a low rack, clear of damp ground.
  for(const edge of [-1,1]){
   const at=a+edge*.52;
   beam([at,base,b],[at,base+.69,b],.062);
   box(at,base+.05,b,.16,.09,.62,timber,0,mat.wood);
  }
  for(let row=0;row<3;row++)for(let col=0;col<3-row;col++){
   const at=b+(col-(2-row)*.5)*.16;
   const level=base+.20+row*.14,offset=.061*Math.sin(col*2.8+row*4.1);
   if(profile.use==="stack"){
    tube([a-.48+offset,level,at],[a+.48-offset,level+.02,at+.012],.085,.073,timber,surface.bark,7);
    tube([a+side*(.48-offset),level+.02,at+.012],[a+side*(.49-offset),level+.02,at+.012],.070,.069,shade(timber,1.34),mat.wood,7);
   }else box(a+offset,level,at,1.04+offset,.095,.13,shade(timber,1.15+row*.06),0,mat.wood);
  }
 }else if(profile.use==="raised"||profile.use==="wind"){
  // Raised shutters keep flood splash or snow out; braces show how they work.
  const bottom=y+h*.40, tall=h*.28;
  for(const edge of [-1,1]){
   const at=a+edge*.63;
   for(let n=0;n<4;n++)box(at+(n-1.5)*.095,bottom,front+.34,.088,tall,.077,shade(timber,.95+n*.05),0,mat.wood);
   beam([at-.16,bottom+.15,front+.391],[at+.16,bottom+tall-.12,front+.391],.032);
   for(const level of [.14,tall-.18])box(at+edge*.18,bottom+level,front+.395,.14,.055,.035,nail,0,mat.metal);
  }
 }else{
  // A tiled sill or stone drip ledge sends rain away from the wall footing.
  const span=Math.min(2.1,w*.28);
  const high=y+h*.37, low=high-.065;
  const finish=profile.use==="sill"?mat.ceramic:mat.stone;
  for(let i=0;i<5;i++){
   const left=a-span*.5+i*span/5,right=left+span/5-.014;
   quad([left,low,front+.48],[right,low,front+.48],[right,high,front+.16],[left,high,front+.16],shade(stone,.88+i%3*.07),finish);
   quad([right,low,front+.48],[left,low,front+.48],[left,low-.09,front+.48],[right,low-.09,front+.48],shade(stone,.83),finish);
  }
 }
}

function villageVergeDetail(x,y,z,size,seed,tint) {
 const profile=villageCraft[s.region],random=rand(seed),stone=color(profile.stone);
 for(let i=0;i<5;i++){
  const a=random()*Math.PI*2, r=size*(.3+random()*1.5);
  const px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;
  if(onVillageWalk(px,pz,.30)||!villageRouteGround(px,pz,.18))continue;
  const base=terrainSurface(px,pz);
  if(Math.abs(base-y)>.75)continue;
  const scale=size*(.42+random()*.65);
  if(i<2)villageSplitStone(px,base-.035,pz,scale*1.55,scale*.46,scale,stone,seed+i*71);
  else groundFloraVolume(px,base,pz,scale*2.2,a,profile.plant);
 }
 // Individual stems and seed heads replace round flowering blobs.
 for(let i=0;i<3;i++){
  const a=random()*6.28,h=size*(.75+random()*.83);
  const start=[x+Math.cos(a)*size*.12,y,z+Math.sin(a)*size*.12];
  const tip=[start[0]+Math.cos(a)*h*.21,y+h,start[2]+Math.sin(a)*h*.21];
  tube(start,tip,.009,.004,shade(tint,.78),architectureMaterials.wood,4);
  tube(tip,[tip[0]+.012,tip[1]+.055,tip[2]],.016,.008,tint,architectureMaterials.wood,5);
 }
}

function villageRidgeCap(a,b,tint) {
 const profile=architectureProfiles[s.region], material=profile.style==="metal"?architectureMaterials.metal:
  profile.style==="thatch"||profile.style==="shake"?architectureMaterials.wood:architectureMaterials.ceramic;
 const length=Math.hypot(b[0]-a[0],b[2]-a[2]);
 const count=Math.max(1,Math.ceil(length/(profile.style==="metal"?1.05:profile.step)));
 for(let i=0;i<count;i++){
  const start=mix(a,b,i/count),end=mix(a,b,(i+.98)/count);
  start[1]+=.038;end[1]+=.038;
  const radius=profile.style==="thatch"?.115:.079;
  tube(start,end,radius,radius*.95,shade(tint,.87+.16*Math.sin(i*2.1+a[0])),material,7);
 }
}

function skirtVillageFoundation(x,z,w,d,bottom,top) {
 const tint=color(villageCraft[s.region].stone);
 const count=Math.ceil(w/.71), width=(w+.39)/count;
 const rows=Math.min(5,Math.max(1,Math.ceil((top-bottom)/.31)));
 const height=(top-bottom)/rows;
 const face=z+d*.5+.196;
 for(let row=0;row<rows;row++)for(let i=0;i<count;i++){
  const a=x-w*.5+(i+.5)*width-.16;
  const low=top-(row+1)*height;
  const [px,pz]=villagePoint(a,face);
  if(low+height<terrainSurface(px,pz)-.06)continue;
  const seed=Math.abs(Math.round(x*97+z*31+i*283+row*129));
  villageSplitStone(a,low,face,width*1.06,height*.98,.21,tint,seed);
 }
}

function villageBankScour() {
 const profile=villageCraft[s.region],random=rand(3119+s.region*31),stone=color(profile.stone);
 const sites=s.region===1?[[476,264],[458,313]]:geographySites[s.region];
 // Accumulate fragments on downhill slopes and along wet, eroded banks.
 for(const [cx,cz] of sites)for(let i=0;i<96;i++){
  const angle=random()*Math.PI*2,r=12+random()*45;
  const x=cx+Math.cos(angle)*r,z=cz+Math.sin(angle)*r,y=terrainSurface(x,z);
  const nearBank=riverDist(x,z)-channelWidth(z);
  const slope=Math.max(Math.abs(terrainSurface(x+1,z)-y),Math.abs(terrainSurface(x,z+1)-y));
  if((slope<.17&&(nearBank<.6||nearBank>5.5))||!villageRouteGround(x,z,1)||onVillageWalk(x,z,1.5)||roadDist(x,z)<4)continue;
  const size=.18+random()*.36;
  villageSplitStone(x,y-.085,z,size*1.7,size*(.51+random()*.24),size,stone,Math.floor(random()*100000));
 }
}

function villageStairStructure(x,edge,end,landing,low,width,timber) {
 if(landing-low<.44)return;
 const profile=villageCraft[s.region],wood=color(profile.wood),stone=color(profile.stone);
 const {wood:woodMat,stone:stoneMat,metal}=architectureMaterials;
 for(const side of [-1,1]){
  const px=x+side*(width*.5+.054);
  if(timber){
   const foot=[px,low-.04,end-.08],head=[px,landing-.15,edge-.01];
   tube(foot,head,.104,.096,shade(wood,.85),woodMat,4);
   for(const t of [.27,.70]){
    const [a,b,c]=mix(foot,head,t);
    const ground=terrainSurface(...villagePoint(a,c));
    if(b-ground<.16)continue;
    box(a,ground-.045,c,.30,.16,.31,stone,0,stoneMat);
    box(a,ground+.10,c,.13,Math.max(.05,b-ground-.10),.15,wood,0,woodMat);
    tube([a+side*.10,b-.055,c],[a+side*.11,b-.055,c],.025,.025,color("#464847"),metal,6);
   }
  }else{
   const count=Math.min(12,Math.ceil((end-edge)/.32));
   for(let i=0;i<count;i++){
    const t=(i+.5)/count,z=lerp(edge,end,t),level=lerp(landing,low,t);
    const ground=terrainSurface(...villagePoint(px,z));
    if(level-ground<.15)continue;
    const seed=Math.abs(Math.round(x*127+z*51+side*231));
    villageSplitStone(px,Math.max(ground-.045,level-.35),z,.22,.27,(end-edge)/count+.035,stone,seed);
   }
  }
 }
}


"use strict";

// Relief follows the local material: soft folds, cut terraces, sediment ledges,
// wooded ridges, fractured rock, silt berms, dunes, and glacial ribs.
const silhouetteRegions=[
 {angle:.48, wavelength:47, amplitude:6.2, form:"gully", rock:"#7c8064", tree:[.29,.12,.043,"#4a6044"], roof:[1,.51,.63,"tile"]},
 {angle:-.33,wavelength:51, amplitude:5.1, form:"terrace",rock:"#888477",tree:[.36,.16,.045,"#536647"],roof:[3,.81,.59,"slate"]},
 {angle:.19, wavelength:64, amplitude:9.1, form:"mesa",rock:"#a36e4f",tree:[.29,.08,.033,"#7a8050"],roof:[0,.19,.55,"parapet"]},
 {angle:.91, wavelength:50, amplitude:8.0, form:"ridge",rock:"#756651",tree:[.31,.15,.037,"#485e42"],roof:[2,.50,.61,"shake"]},
 {angle:-.74,wavelength:45, amplitude:8.4, form:"fracture",rock:"#6e7871",tree:[.25,.15,.037,"#435b46"],roof:[3,.83,.59,"metal"]},
 {angle:.35, wavelength:55, amplitude:5.1, form:"silt",rock:"#7e8671",tree:[.29,.18,.060,"#566d52"],roof:[2,.46,.64,"metal"]},
 {angle:-.58,wavelength:55, amplitude:6.3, form:"dune",rock:"#b3996c",tree:[.43,.10,.098,"#667d49"],roof:[4,.67,.67,"thatch"]},
 {angle:.73, wavelength:58, amplitude:10.4,form:"glacial",rock:"#73818a",tree:[.23,.13,.032,"#465b53"],roof:[3,.94,.55,"metal"]},
];

function silhouetteRelief(region,x,z,ground){
 const p=silhouetteRegions[region];
 if(ground<12)return 0;
 const distanceToEdge=Math.min(
  Math.abs(x-worldBounds.west),Math.abs(x-worldBounds.east),
  Math.abs(z-worldBounds.north),Math.abs(z-worldBounds.south));
 const edgeBlend=terrainEase(3,28,distanceToEdge);
 if(edgeBlend===0)return 0;
 const sites=region===1?[[164,141],[265,189],[515,230]]:geographySites[region];
 let clear=1;
 for(const [a,b] of sites)clear=Math.min(clear,terrainEase(37,78,Math.hypot(x-a,z-b)));
 if(clear===0)return 0;
 for(const spot of spots){
  if(spot.x!==undefined&&spot.y!==undefined)clear=Math.min(clear,terrainEase(20,43,Math.hypot(x-spot.x,z-spot.y-12)));
 }
 if(clear===0)return 0;
 const route=roadDist(x,z);
 const branch=region===2||region===3?terrainEase(26,53,route):terrainEase(10,25,route);
 const u=(x*Math.cos(p.angle)+z*Math.sin(p.angle))/p.wavelength;
 const v=(-x*Math.sin(p.angle)+z*Math.cos(p.angle))/p.wavelength;
 const warp=u+.21*Math.sin(v*1.8)+.12*Math.sin(v*4.1);
 const fold=Math.sin(warp*Math.PI*2);
 const rib=1-Math.abs(fold);
 const gull=Math.pow(Math.max(0,rib),4);
 const detail=Math.sin(u*14.7+v*9.1)*Math.sin(v*10.9-u*3.3);
 const envelope=terrainEase(12,37,ground)*clear*branch*edgeBlend;
 let form;
 switch(p.form){
 case "gully": form=.46*fold-.58*gull+.18*detail;break;
 case "terrace": form=.47*Math.tanh(fold*3.4)+.14*detail;break;
 case "mesa": form=.59*Math.tanh((fold-.22)*4.8)+.19*Math.sin(v*5.2);break;
 case "ridge": form=.68*Math.pow(Math.max(0,fold),1.6)-.53*gull+.15*detail;break;
 case "fracture": form=.44*Math.tanh(fold*4.2)+.30*detail-.20*gull;break;
 case "silt": form=.54*fold+.22*Math.sin(v*4.4+fold)-.20*gull;break;
 case "dune": form=.53*Math.sin(warp*6.283+.33*fold)+.13*Math.sin(v*3.3);break;
 case "glacial": form=.70*Math.tanh((fold+.17*detail)*3.8)+.21*detail;break;
 }
 return p.amplitude*1.22*envelope*form;
}

function silhouetteSlopeTint(region,x,z,y,up,tint){
 const p=silhouetteRegions[region];
 const high=terrainEase(19,50,y);
 const ledge=1-terrainEase(.59,.88,up);
 const seams=.56+.32*Math.sin(y*(region===2?1.27:.56)+Math.sin(x*.051+z*.047)*1.1);
 return mix(tint,shade(color(p.rock),.71+seams*.36),high*ledge*.77);
}

// Each fork ends in several separated, alpha-masked sprays of the existing leaf
// atlas. Gaps are built into the crown so light and the sky show between limbs.
function craftedCanopy(x,y,z,h,seed,conifer,detailed){
 if(!plantTexture||!wildVegetationReady)return false;
 const region=s.region,profile=silhouetteRegions[region],random=rand(seed);
 const [breadth,lift,trunk,hex]=profile.tree;
 const tint=color(hex);
 const salt=region===6,wet=region===5,alpine=region===7;
 const slot=conifer?(region===0?49:alpine?48:region===3?46:47):
  salt?53:wet?52:region===4?51:50;
 const bend=(random()-.5)*h*(salt?.31:alpine?.23:.13);
 const radius=h*trunk;
 const stem=t=>[x+bend*t*t,y+h*t,z+bend*t*.21];
 pineLimb([0,.18,.41,.65,.83,1].map(t=>[...stem(t),radius*(1-t*.96)]),seed);
 const count=conifer?(detailed?10:7):(detailed?9:7);
 for(let i=0;i<count;i++){
  const t=i/count;
  const a=seed*2.399+i*2.399+(random()-.5)*.47;
  const base=conifer?.22+t*.65:salt?.55+t*.32:.35+t*.53;
  const root=stem(base);
  const reach=h*breadth*(conifer?Math.pow(1-t*.87,.83):.68+.29*Math.sin(t*Math.PI))*(.76+random()*.42);
  const tip=[root[0]+Math.cos(a)*reach,root[1]+h*lift*(.55+random()*.42),root[2]+Math.sin(a)*reach];
  const elbow=mix(root,tip,.56);
  elbow[1]-=h*.045;
  pineLimb([[...root,radius*.46],[...elbow,radius*.21],[...tip,.012]],seed+i*43);
  for(const side of [-1,1]){
   const f=a+side*(.45+random()*.37);
   const fork=[tip[0]+Math.cos(f)*reach*.35,tip[1]+h*lift*.42,tip[2]+Math.sin(f)*reach*.35];
   pineLimb([[...elbow,radius*.18],[...fork,.009]],seed+i*29+side);
   if(conifer){
    // A needle spray follows the branch horizontally and hangs below it.
    const span=reach*.38,sideX=-Math.sin(f)*span,sideZ=Math.cos(f)*span;
    const start=mix(elbow,fork,.36);
    const end=[fork[0]+Math.cos(f)*span*.38,fork[1]-h*.04,fork[2]+Math.sin(f)*span*.38];
    for(const tilt of [-1,1]){
     const leaf=[start,[end[0]+sideX,end[1]+tilt*h*.087,end[2]+sideZ],
      [end[0]-sideX,end[1]-tilt*h*.070,end[2]-sideZ],
      [start[0]-sideX*.20,start[1]-.035,start[2]-sideZ*.20]];
     const normal=unit(cross(sub(leaf[1],leaf[0]),sub(leaf[3],leaf[0])));
     plantPatch(leaf,[normal,normal,normal,normal],[[1,.5],[0,0],[0,1],[1,.76]],slot,63);
    }
   }
   for(let spray=0;spray<(detailed?3:2);spray++){
    const center=mix(elbow,fork,.62+spray*.22);
    const angle=f+spray*1.13+side*.35;
    const width=Math.max(h*.072,reach*(conifer?1.12:1.02))*(.78+random()*.23);
    const tall=h*(conifer?.18:salt?.17:.22)*(.70+random()*.35);
    plantSheet(center[0],center[1]-tall*.37,center[2],width,tall,angle,tall*.18,slot,side*tall*.16);
   }
  }
  if(conifer&&t>.68){
   const crown=stem(base+.11);
   plantSheet(crown[0],crown[1],crown[2],h*.125,h*.22,a,h*.013,slot);
  }
 }
 if(salt||wet)for(let i=0;i<5;i++){
  const a=seed+i*1.2566,reach=radius*(1.65+random());
  pineLimb([[...stem(.09),radius*.45],[x+Math.cos(a)*reach,y-.065,z+Math.sin(a)*reach,.022]],seed+i);
 }
 return true;
}

function regionalRoofShell(x,y,z,w,d,h,tint,wall,plan){
 const [form,pitch,overhang,kind]=silhouetteRegions[s.region].roof;
 const eave=y+h+.06,left=x-w*overhang,right=x+w*overhang,back=z-d*overhang,front=z+d*overhang;
 const ridge=x+w*plan.offset*.36,peak=eave+h*pitch*(.93+plan.span*.095);
 const mat=architectureMaterials;
 const finish=kind==="metal"?mat.metal:kind==="thatch"||kind==="shake"?mat.wood:kind==="parapet"?mat.stone:mat.ceramic;
 const cover=(a,b,c,d,tone=tint)=>architecturalRoofFace(a,b,c,d,tone);
 const stoneGable=kind==="slate"||kind==="parapet";
 const gableMaterial=stoneGable?mat.stone:mat.wood;
 const gableTint=stoneGable?shade(wall,.83):mix(color(villageCraft[s.region].wood),wall,.22);
 const boards=(a,b,c,d,seed)=>{
  const mid=mix(mix(a,b,.5),mix(d,c,.5),.5);
  const nx=Math.abs(a[0]-b[0])+Math.abs(d[0]-c[0])<.01?Math.sign(mid[0]-x):0;
  const nz=nx?0:Math.sign(mid[2]-z);
  const height=Math.max(d[1]-a[1],c[1]-b[1]);
  const rows=Math.max(1,Math.ceil(height/.23));
  const point=(u,v)=>{
   const p=mix(mix(a,b,u),mix(d,c,u),v);
   return [p[0]+nx*.017,p[1],p[2]+nz*.017];
  };
  quad(a,b,c,d,shade(gableTint,.61),gableMaterial);
  for(let row=0;row<rows;row++){
   const low=row/rows+.004,high=(row+1)/rows-.005;
   const count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])*(1-low*.62)/1.32));
   for(let col=0;col<count;col++){
    const left=col/count+.005,right=(col+1)/count-.006;
    const tone=shade(gableTint,.81+.17*(.5+.5*Math.sin(seed+row*2.9+col*1.72)));
    quad(point(left,low),point(right,low),point(right,high),point(left,high),tone,gableMaterial);
   }
  }
 };
 const face=(a,b,c)=>{
  const sorted=[a,b,c].sort((p,q)=>p[1]-q[1]);
  boards(sorted[0],sorted[1],sorted[2],sorted[2],x*.83+z*.34);
 };
 const edge=(a,b,r=.077)=>tube(a,b,r,r*.93,shade(tint,.74),finish,6);
 const rim=(a,b)=>tube(a,b,.043,.036,shade(wall,.74),mat.wood,4);
 if(form===0){
  const ledge=eave+.12;
  box(x,eave,z,w*1.08,.15,d*1.08,shade(tint,.85),0,mat.stone);
  for(const [a,b,along] of [[x,back,w],[x,front,w],[left,z,d],[right,z,d]]){
   const alongX=a===x;
   const count=Math.ceil(along/.68);
   for(let i=0;i<count;i++){
    const offset=(i+.5-count*.5)*along/count;
    const px=a+(alongX?offset:0),pz=b+(alongX?0:offset);
    const height=.39+Math.sin(i*.79+x)*.058;
    const size=along/count;
    box(px,ledge,pz,alongX?size-.01:.22,height,alongX?.22:size-.01,shade(wall,.89+.11*Math.sin(i*1.89)),0,mat.stone);
    box(px,ledge+height,pz,alongX?size-.021:.29,.073,alongX?.29:size-.021,shade(tint,1.12),0,mat.ceramic);
   }
  }
  // Scupper projects beyond the masonry to keep discharge off the wall.
  tube([x+w*.29,ledge+.055,front-.08],[x+w*.29,ledge+.02,front+.43],.09,.075,shade(tint,.77),finish,7);
  return;
 }
 if(form===2){
  const side=plan.side,lo=side>0?left:right,hi=side>0?right:left;
  const a=[lo,eave,back],b=[hi,peak,back],c=[hi,peak,front],d=[lo,eave,front];
  cover(a,b,c,d);
  boards([hi,eave,back],[hi,eave,front],c,b,x*.33+z*.79);
  for(const end of [back,front])face([lo,eave,end],[hi,eave,end],[hi,peak,end]);
  edge(a,d);edge(b,c);
  for(let i=0;i<6;i++){
   const z=lerp(back,front,(i+.5)/6);
   rim([lo,eave-.064,z],[hi,peak-.10,z]);
  }
  return;
 }
 const hip=form===1||form===4;
 const inset=hip?d*(form===1?.15+plan.span*.072:.10+plan.span*.051):0;
 const a=[ridge,peak,back+inset],b=[ridge,peak,front-inset];
 const swing=kind==="tile"?.18+plan.span*.09:kind==="thatch"?.11+plan.span*.08:.04;
 const fold=kind==="tile"?.29:kind==="thatch"?.19:0;
 for(const [side,outer] of [[-1,left],[1,right]]){
  const backCorner=[outer,eave+swing,back],frontCorner=[outer,eave+swing,front];
  const low=[outer,eave,(back+front)*.5];
  const k0=[lerp(outer,ridge,.28),lerp(eave,peak,.28)+fold,lerp(back,a[2],.28)];
  const k1=[k0[0],k0[1],lerp(front,b[2],.28)];
  const mid= mix(k0,k1,.5), crown= mix(a,b,.5);
  const tone=shade(tint,side>0?.88:1.03);
  cover(backCorner,k0,mid,low,tone);
  cover(low,mid,k1,frontCorner,tone);
  cover(k0,a,crown,mid,tone);
  cover(mid,crown,b,k1,tone);
  edge(backCorner,low);edge(low,frontCorner);

 }
 villageRidgeCap(a,b,tint);
 for(const [end,apex] of [[back,a],[front,b]]){
  const l=[left,eave+swing,end],r=[right,eave+swing,end];
  if(hip){
   architecturalRoofHip(l,apex,r,tint);
   edge(l,apex);edge(apex,r);
  }else{
   face([left,eave,end],apex,[right,eave,end]);
   const lip=end===back?-.045:.045;
   rim([left,eave+swing,end+lip],[apex[0],apex[1],end+lip]);
   rim([apex[0],apex[1],end+lip],[right,eave+swing,end+lip]);
  }
 }
 if(kind==="slate"||kind==="metal"){
  const cx=x+w*.24*plan.side,cz=z-d*.14;
  const top=peak+(kind==="slate"?.60:.34),bottom=eave+.19;
  const width=kind==="slate"?.58:.22;
  box(cx,bottom,cz,width,top-bottom,width,shade(wall,.76),0,kind==="slate"?mat.stone:mat.metal);
  box(cx,top-.085,cz,width+.14,.12,width+.14,shade(tint,.76),0,mat.metal);
 }
}

function silhouetteTreeRange(x,z){
 const sites=s.region===1?[[164,141],[265,189],[515,230]]:geographySites[s.region];
 return sites.some(([a,b])=>Math.hypot(a-x,b-z)<112);
}
function regionalWallOutline(x,y,z,w,d,h,plan){
 const kind=silhouetteRegions[s.region].roof[3],mat=architectureMaterials,profile=villageCraft[s.region];
 const timber=color(profile.wood),stone=color(profile.stone),roof=color(profile.roof);
 const a=x+plan.side*w*.31,front=z+d*.5,base=y+Math.max(2.67,h*.59),top=y+h-.14;
 if(top-base<.32)return;
 const width=Math.min(w*.29,1.75);
 if(kind==="parapet"||kind==="slate"){
  for(const sign of [-1,1])for(let row=0;row<4;row++){
   const px=a+sign*width*.47,level=lerp(base,top,row/4),reach=.29+row*.07;
   box(px,level,front+reach*.36,.27,(top-base)/4-.018,reach,shade(stone,.84+row*.045),0,mat.stone);
  }
  box(a,top,front+.15,width+.30,.115,.56,stone,0,mat.stone);
 }else{
  const reach=kind==="thatch"?.45:kind==="tile"?.30:.36,sill=base+.13;
  for(const sign of [-1,1]){
   const at=a+sign*width*.46;
   tube([at,sill,front+.06],[at,sill+.21,front+reach],.073,.061,timber,mat.wood,5);
   box(at,sill+.19,front+reach,.11,top-sill-.12,.11,timber,0,mat.wood);
  }
  box(a,sill+.12,front+reach*.54,width+.14,.105,reach+.16,shade(timber,.85),0,mat.wood);
  for(let n=0;n<7;n++)box(a+(n-3)*width/7,sill+.22,front+reach+.017,width/7-.014,Math.max(.1,top-sill-.19),.054,
   shade(timber,.93+.09*Math.sin(n*2.51+x)),0,mat.wood);
  architecturalRoofFace([a-width*.58,top+.22,front+.03],[a-width*.61,top,front+reach+.18],
   [a+width*.61,top,front+reach+.18],[a+width*.58,top+.22,front+.03],roof);
 }
}




"use strict";

// The structural facing sets the opening depth, coursing and jamb construction.
const facadeRegions=[
 ["infill","#d4c8a9","#514135","#79756a",.25],
 ["ashlar","#a29b8a","#4c4740","#6d6b62",.31],
 ["adobe","#bd8c63","#686251","#956948",.40],
 ["logs","#8c674a","#544635","#706557",.24],
 ["board","#a28a69","#5e5245","#757773",.20],
 ["lap","#a4b5a5","#4e6259","#737d71",.22],
 ["reed","#aa966a","#635840","#a0967a",.23],
 ["rubble","#929b9c","#464d51","#657177",.34],
];

function facadeRole(name){
 if(/역사/.test(name))return "station";
 if(/상점|상가/.test(name))return "trader";
 if(/창고|헛간/.test(name))return "store";
 if(/작업소|제재소|벌목|낚시터/.test(name))return "work";
 return "home";
}

function finishFunctionalFacades(){
 const services=new Map(townServices().map(site=>[site.buildingX+":"+site.buildingZ,site.role]));
 for(const building of buildingFootprints){
  const service=services.get(building.x+":"+building.z);
  if(building.facade&&(!building.facade.external||service))functionalFacade(building,service??facadeRole(building.name));
 }
}

function functionalFacade(building,role){
 const {x,z,wallHeight:h}=building;
 const {y,w,front,angle}=building.facade;
 const [structure,bodyHex,frameHex,stoneHex]=facadeRegions[s.region];
 const mat=architectureMaterials;
 const body=color(bodyHex),frame=color(frameHex),stone=color(stoneHex);
 const masonry=["ashlar","adobe","rubble"].includes(structure);
 const sx=Math.cos(angle),sz=-Math.sin(angle),fx=Math.sin(angle),fz=Math.cos(angle);
 const door=cap(w*.17,1.16,2.05)*.5+.075;
 const wallBase=.29,top=h-.13,wallPlane=front+.51;
 const point=(u,v,q)=>[x+sx*u+fx*q,y+v,z+sz*u+fz*q];
 const piece=(u,v,q,width,height,depth,tint,material)=>{
  if(width<=0||height<=0)return;
  const [a,b,c]=point(u,v,q);
  box(a,b,c,width,height,depth,tint,angle,material);
 };
 const strip=(a,b,r,tint=frame,material=mat.wood)=>{
  tube(point(...a),point(...b),r,r*.91,tint,material,5);
 };
 const face=(left,right,bottom,upper,q,tint,material)=>quad(point(left,bottom,q),point(right,bottom,q),
  point(right,upper,q),point(left,upper,q),tint,material);
 const profile=(u,level)=>.86+.17*(.5+.5*Math.sin(u*3.22+level*10.3+x*.61+z*.43));
 function wallPanel(left,right,bottom,upper){
  const width=right-left,height=upper-bottom;
  if(width<.04||height<.035)return;
  const q=wallPlane;
  piece((left+right)*.5,bottom,q-.087,width,height,.10,shade(body,.69),masonry?mat.stone:mat.wood);
  if(masonry){
   const rows=Math.max(1,Math.ceil(height/(structure==="adobe"?.36:.27)));
   for(let row=0;row<rows;row++){
    const low=bottom+row*height/rows,rise=height/rows;
    const count=Math.max(1,Math.ceil(width/(structure==="ashlar"?.53:.67)));
    const pitch=width/count;
    for(let i=-1;i<count;i++){
     const a=Math.max(left,left+(i+row%2*.5)*pitch);
     const b=Math.min(right,left+(i+1+row%2*.5)*pitch);
     if(b-a<.04)continue;
     const wobble=structure==="rubble"?.036*Math.sin(i*4.7+row):0;
     const inset=.018;
     const q0=q+wobble, q1=q+.036+wobble;
     const tint=shade(body,profile(a,low));
     const p0=point(a+inset,low+.023,q0),p1=point(b-inset,low+.022,q0);
     const p2=point(b-inset,low+rise-.024,q0),p3=point(a+inset,low+rise-.021,q0);
     const bevel=Math.min(.05,(b-a)*.14);
     const p4=point(a+inset+bevel,low+.043,q1),p5=point(b-inset-bevel,low+.043,q1);
     const p6=point(b-inset-bevel,low+rise-.044,q1),p7=point(a+inset+bevel,low+rise-.043,q1);
     quad(p4,p5,p6,p7,tint,mat.stone);
     quad(p0,p1,p5,p4,shade(tint,.82),mat.stone);
     quad(p1,p2,p6,p5,shade(tint,.89),mat.stone);
     quad(p2,p3,p7,p6,shade(tint,1.07),mat.stone);
     quad(p3,p0,p4,p7,shade(tint,.95),mat.stone);
    }
   }
  }else if(structure==="infill"){
   piece((left+right)*.5,bottom,q,width,height,.12,body,mat.plaster);
   const bays=Math.ceil(width/.87);
   for(let i=0;i<=bays;i++)piece(lerp(left,right,i/bays),bottom,q+.075,.077,height,.092,frame,mat.wood);
   for(const level of [bottom+.045,upper-.06])piece((left+right)*.5,level,q+.076,width,.058,.104,frame,mat.wood);
  }else if(structure==="board"||structure==="reed"){
   const count=Math.ceil(width/(structure==="reed"?.11:.24));
   for(let i=0;i<count;i++){
    const u=lerp(left,right,(i+.5)/count);
    piece(u,bottom,q+.013*Math.sin(i*1.7),width/count-.012,height,.113,shade(body,profile(u,bottom)),mat.wood);
   }
   if(structure==="reed")for(let i=1;i<Math.ceil(height/.34);i++){
    const level=bottom+i*.32;
    if(level<upper)strip([left,level,q+.064],[right,level+.02,q+.064],.023,shade(frame,1.18));
   }
  }else{
   const count=Math.ceil(height/(structure==="logs"?.24:.18));
   for(let i=0;i<count;i++){
    const v=lerp(bottom,upper,i/count),rise=height/count;
    const tint=shade(body,profile(left,v));
    if(structure==="logs"){
     const p=q-.031;
     strip([left+.018,v+rise*.50,p],[right-.018,v+rise*.50,p],rise*.42,tint,mat.wood);
    }else{
     quad(point(left,v+.012,q+.064),point(right,v+.012,q+.064),
      point(right,v+rise-.005,q-.026),point(left,v+rise-.005,q-.026),tint,mat.wood);
     face(left,right,v,v+.02,q+.062,shade(tint,.70),mat.wood);
    }
   }
  }
 }
 const lower=role==="clinic"?1.10:role==="post"?1.03:role==="trader"?.96:role==="smith"?.57:role==="store"?.64:role==="station"?.85:role==="work"?.91:1.29;
 const apertureTop=Math.min(top-.29,role==="clinic"?2.98:role==="trader"?2.73:role==="smith"?2.52:role==="station"?2.82:role==="store"?2.68:2.58);

 const jambMaterial=masonry?mat.stone:mat.wood;
 const jamb=masonry?shade(stone,1.16):frame;
 for(const side of [-1,1]){
  const inner=door+.09,outer=w*.493;
  const width=outer-inner;
  const center=(inner+outer)*.5*side;
  const cut=width*(role==="trader"||role==="smith"?.84:role==="clinic"||role==="station"?.73:role==="post"?.69:.59);
  const left=center-cut*.5,right=center+cut*.5;
  const spanLeft=side<0?-outer:inner,spanRight=side<0?-inner:outer;
  wallPanel(spanLeft,left,wallBase,top);
  wallPanel(right,spanRight,wallBase,top);
  wallPanel(left,right,wallBase,lower);
  wallPanel(left,right,apertureTop,top);
  const legacy=usePreviousWindow(building,role);
  const oldWidth=w*(s.region===0?.20:s.region===1?.135:.15);
  const pane=legacy?Math.min(cut*.91,oldWidth):cut;
  const oldHeight=h*(s.region===1?.33:.26);
  const paneLow=legacy?Math.min(apertureTop-.48,lower+Math.max(.08,(apertureTop-lower-oldHeight)*.49)):lower;
  const paneHigh=legacy?Math.min(apertureTop,paneLow+oldHeight):apertureTop;
  if(legacy){
   wallPanel(left,center-pane*.5,lower,apertureTop);
   wallPanel(center+pane*.5,right,lower,apertureTop);
   wallPanel(center-pane*.5,center+pane*.5,lower,paneLow);
   wallPanel(center-pane*.5,center+pane*.5,paneHigh,apertureTop);
  }
  windowJoinery(piece,center,paneLow,paneHigh,pane,wallPlane,role,legacy);
  if(role==="trader"||(role==="clinic"&&structure==="adobe")){
   const drop=role==="trader"?.095:.075;
   const head=apertureTop+.12;
   const trim=role==="trader"?color("#627054"):frame;
   for(const sign of [-1,1]){
    const edge=center+sign*cut*.48;
    strip([edge,head-.41,wallPlane],[edge,head-drop,wallPlane+.40],.035);
   }
   for(let i=0;i<9;i++){
    const u=lerp(left,right,(i+.5)/9);
    strip([u,head,wallPlane-.11],[u,head-drop,wallPlane+.43],cut/22,shade(trim,.86+i%3*.11));
   }
  }
  piece(side*outer,wallBase,wallPlane-.13,.18,top-wallBase,.36,jamb,jambMaterial);
  piece(center,.30,wallPlane+.019,width,.26,.19,stone,mat.stone);
 }
 const header=Math.max(2.48,cap(h*.66,2.24,2.47)+.30);
 if(top>header)wallPanel(-door,door,header,top);
 const portal=role==="clinic"?shade(body,1.25):jamb;
 for(const side of [-1,1]){
  const a=side*(door+.075);
  piece(a,wallBase,wallPlane-.078,.145,header-wallBase,.33,portal,jambMaterial);
  piece(a,wallBase+.03,wallPlane-.077,.19,.22,.39,stone,mat.stone);
 }
 piece(0,header,wallPlane-.015,door*2+.36,.14,.39,portal,jambMaterial);
 // Return boards meet the old side wall and make the front depth legible obliquely.
 for(const side of [-1,1])piece(side*w*.494,wallBase,front+.22,.092,top-wallBase,.57,jamb,jambMaterial);
}





"use strict";

const restoredFacadeRegions = new Set([4,5,6]);
const windowOnlyRegion = region => restoredFacadeRegions.has(region);

function usePreviousWindow(building, role) {
 return s.region===0 && (role==="post" || building.name==="아사기 공동 창고") ||
  s.region===1 && role==="trader" && townServices().some(site=>site.role==="trader"&&site.buildingX===building.x&&site.buildingZ===building.z) ||
  (s.region===3 || s.region===7) && role==="post";
}

function windowJoinery(piece,center,low,high,width,plane,role,legacy=false){
 const mat=architectureMaterials, old=architectureProfiles[s.region];
 const [structure,,frameHex,stoneHex,reveal]=facadeRegions[s.region];
 const mineral=["ashlar","adobe","rubble"].includes(structure);
 const jambMaterial=mineral?mat.stone:mat.wood;
 const frame=color(legacy?old.trim:frameHex),stone=color(stoneHex);
 const dark=color("#303a36");
 const daylight=color(legacy?old.glass:role==="clinic"?"#8ba5a1":"#687e75");
 const left=center-width*.5,right=center+width*.5,height=high-low;
 const recessed=plane-(legacy?.09:reveal*.68);
 const sash=Math.max(.038,Math.min(.075,width*.053));
 const surround=mineral?stone:frame;
 const band=(x,y,w,h,tint=frame,q=plane)=>piece(x,y,q,w,h,.085,tint,mat.wood);
 piece(center,low,recessed-.022,width,height,.038,dark,mat.wood);
 for(const side of [-1,1]){
  const edge=center+side*width*.5;
  piece(edge,low,plane-(plane-recessed)*.48,sash*(mineral?2.2:1.68),height,plane-recessed+.18,surround,jambMaterial);
  if(!legacy&&mineral)for(let i=0;i<Math.max(2,Math.floor(height/.30));i++){
   const row=Math.max(2,Math.floor(height/.30));
   piece(edge,low+i*height/row,plane+.08,sash*(i%2?2.7:3.4),height/row-.022,.13,shade(stone,i%2?1.12:.89),jambMaterial);
  }
 }
 piece(center,low-.061,plane+.024,width+.23,.105,mineral?.37:.25,shade(surround,1.16),jambMaterial);
 piece(center,high-.021,plane+.009,width+.20,.105,.23,surround,jambMaterial);
 if(legacy){
  const bars=s.region===0?7:s.region===7?2:1;
  const faceWidth=width*.88;
  piece(center,low+.085,recessed+.038,faceWidth,height-.14,.045,daylight,mat.glass);
  for(const side of [-1,1])band(center+side*faceWidth*.5,low+.033,.062,height-.016,frame,plane+.026);
  for(const v of [low+.045,low+height*.53,high-.036])band(center,v,faceWidth+.075,.057,frame,plane+.027);
  for(let i=1;i<=bars;i++)band(center+(i/(bars+1)-.5)*faceWidth,low+.068,.044,height-.09,frame,plane+.031);
  return;
 }
 if(role==="work"||role==="store"||role==="smith"){
  const metal=role==="smith";
  const vents=role==="work"?6:role==="smith"?4:3;
  const head=role==="store"?height*.58:height*.36;
  const count=Math.max(3,Math.ceil(width/.22));
  const shutter=metal?shade(stone,.65):shade(frame,1.15);
  for(let i=0;i<count;i++)piece(lerp(left,right,(i+.5)/count),low+.065,recessed+.078,width/count-.017,head,.087,
   shade(shutter,.87+.08*(i%4)),metal?mat.metal:mat.wood);
  for(let i=0;i<vents;i++){
   const y=low+head+.11+i*(height-head-.12)/vents;
   piece(center,y,recessed+.100,width*.86,.036,.114,shade(shutter,1.17),metal?mat.metal:mat.wood);
  }
  for(const side of [-1,1])piece(center+side*width*.33,low+.13,plane+.015,.14,.055,.057,color("#4d5149"),mat.metal);
  return;
 }
 if(role==="post"||role==="trader"){
  const sill=low+height*(role==="post"?.39:.29);
  const tray=role==="post"?width*.64:width*.91;
  piece(center,sill,plane+.033,tray,.073,role==="post"?.25:.33,shade(frame,1.37),mat.wood);
  const panes=role==="post"?3:2;
  piece(center,sill+.10,recessed+.033,width*.84,high-sill-.15,.05,daylight,mat.glass);
  for(let i=1;i<panes;i++)band(lerp(left,right,i/panes),sill+.07,sash,high-sill-.075,frame,plane-.040);
  if(role==="post"){
   piece(center,low+.104,plane-.007,tray,.162,.12,shade(frame,1.13),mat.wood);
   piece(center,low+.199,plane+.059,tray*.82,.031,.017,dark,mat.metal);
  }
  return;
 }
 const tall=role==="clinic"||role==="station";
 const panes=tall?3:structure==="infill"?6:structure==="reed"?4:2;
 piece(center,low+.081,recessed+.052,width*.89,height-.13,.044,daylight,mat.glass);
 for(let i=1;i<panes;i++)band(lerp(left,right,i/panes),low+.043,sash,height-.044,frame,plane-.034);
 if(role==="clinic"){
  const privacy=height*.29;
  piece(center,low+.077,recessed+.088,width*.88,privacy,.055,color("#c5cebe"),mat.plaster);
  band(center,low+privacy+.09,width,.052,frame,plane-.035);
 }else if(tall||structure==="infill"||structure==="reed"){
  band(center,low+height*.58,width,.045,frame,plane-.027);
 }else{
  for(const side of [-1,1]){
   const x=center+side*(width*.5+.115);
   piece(x,low+.08,plane+.017,.19,height-.13,.076,shade(frame,1.18),mat.wood);
   for(const v of [low+.16,high-.17])piece(x,v,plane+.061,.16,.043,.038,shade(frame,.72),mat.metal);
  }
 }
}

// Stand-alone windows mount on retained façades or the exposed side walls.
function faceWindowSet(building,role,frontWindows){
 const {x,z,wallHeight:h}=building;
 const {y,w,d,front,angle,external}=building.facade;
 const prior=usePreviousWindow(building,role);
 const size=h*(role==="clinic"?.39:role==="station"?.36:role==="store"?.22:role==="work"?.23:.28);
 const width=w*(role==="clinic"?.22:role==="trader"?.24:role==="store"?.14:role==="work"?.16:.17);
 const low=role==="clinic"?h*.32:role==="store"?h*.48:h*.37;
 function at(worldX,worldZ,a,center,v,t,width,height,legacy){
  const piece=(u,level,q,ww,hh,thick,tint,material)=>{
   if(ww<=0||hh<=0)return;
   box(worldX+Math.cos(a)*u+Math.sin(a)*q,y+level,worldZ-Math.sin(a)*u+Math.cos(a)*q,ww,hh,thick,tint,a,material);
  };
  const setback=facadeRegions[s.region][4];
  // A thin return clears the retained masonry while preserving the inset sash.
  windowJoinery(piece,center,v,v+height,width,t+setback*.74,role,legacy);
 }
 if(building.facade.fitted){
  for(const pane of building.facade.fitted){
   const {x:px,y:py,z:pz,width,height,angle:a}=pane;
   const facing=Math.cos(a-angle);
   if(!frontWindows&&facing>.8)continue;
   const piece=(u,v,q,ww,hh,depth,tint,material)=>{
    if(ww<=0||hh<=0)return;
    box(px+Math.cos(a)*u+Math.sin(a)*q,py+v,pz-Math.sin(a)*u+Math.cos(a)*q,ww,hh,Math.min(depth,.10),tint,a,material);
   };
   const compact=Math.min(width,height)<.32;
   if(!compact)windowJoinery(piece,0,0,height,width,.09,role,prior);
  }
  return;
 }
 if(frontWindows){
  for(const side of [-1,1])at(x,z,angle,side*w*.28,low,front,width,size,prior);
 } 
 if(!external){
  for(const side of [-1,1]){
   const px=x+Math.cos(angle)*w*.50*side,pz=z-Math.sin(angle)*w*.50*side;
   const a=angle+side*Math.PI*.5;
   at(px,pz,a,side*d*.17,low,0,Math.min(width,d*.25),size,prior);
  }
 }
}

function finishRegionalWindows(){
 const services=new Map(townServices().map(site=>[site.buildingX+":"+site.buildingZ,site.role]));
 for(const building of buildingFootprints){
  if(!building.facade)continue;
  const role=services.get(building.x+":"+building.z);
  const use=role??facadeRole(building.name);
  const restored=windowOnlyRegion(s.region);
  if(!restored&&(!building.facade.external||role))functionalFacade(building,use);
  faceWindowSet(building,use,restored||Boolean(building.facade.external&&!role));
 }
}




