"use strict";

function addWatershedDetails(){
 const random=rand(441731),stone=color("#777364"),wood=color("#584938"),moss=color("#556c3c");
 const riverPatches=[313,325,337,358,368];
 const road=asagiServiceRoad;
 for(let segment=1;segment<road.length;segment++){
  const [ax,az]=road[segment-1],[bx,bz]=road[segment];
  const length=Math.hypot(bx-ax,bz-az),nx=(bz-az)/length,nz=(ax-bx)/length;
  for(let i=1;i<Math.floor(length)-1;i++){
   if(random()<.18)continue;
   for(const side of [-1,1]){
    const offset=side*(.83+.06*Math.sin(i*.36));
    const point=(t,w)=>{
     const x=lerp(ax,bx,t/length)+nx*(offset+w),z=lerp(az,bz,t/length)+nz*(offset+w);
     return [x,terrainSurface(x,z)+.025,z];
    };
    const a=i-.40,b=i+.61,width=.10+random()*.09;
    quad(point(a,-width),point(b,-width*.82),point(b,width*.76),point(a,width),shade(color("#70634f"),.82+random()*.22),2);
   }
  }
 }
 for(const z of riverPatches)for(const side of [-1,1]){
  const section=riverCrossSection(z);
  const edge=section.x+side*section.width;
  for(let i=0;i<13;i++){
   const px=edge+side*(random()*5-1.6),pz=z+(random()-.5)*7,y=terrainSurface(px,pz);
   if(y<1.9||y>5.4||roadDist(px,pz)<2.5)continue;
   const size=.10+random()*.38;
   rounded(px,y-size*.18,pz,size,.36*size,size*(.67+random()*.68),shade(stone,.69+random()*.45),surface.rock);
   if(i%4===0&&y>2.68)rounded(px,y+size*.11,pz,size*.65,.11*size,size*.67,shade(moss,.70+random()*.38));
  }
 }
 for(const [cx,cz] of [[491,332],[488,321],[454,328],[462,341],[471,364],[504,365]]){
  for(let i=0;i<9;i++){
   const x=cx+(random()-.5)*4,z=cz+(random()-.5)*4,y=terrainSurface(x,z);
   if(y<2.85||roadDist(x,z)<3.2)continue;
   for(let leaf=0;leaf<7;leaf++){
    const a=leaf*2.4+i*.71,h=.24+random()*.29,reach=.37+random()*.28;
    curvedPlantLeaf(x,y-.028,z,a,h,reach,.105+random()*.046,shade(moss,.72+random()*.58),.31);
   }
  }
 }
 for(const [z,side,length] of [[328,-1,3.6],[341,1,2.9],[364,-1,4.7],[373,1,3.0]]){
  const section=riverCrossSection(z),edge=section.x+side*section.width;
  const x=Array.from({length:12},(_,i)=>edge+side*(i*.5-1))
    .find(px=>terrainSurface(px,z)>3.08&&roadDist(px,z)>3.5);
  if(x===undefined)continue;
  const end=[x+side*.85,z+length],a=[x,terrainSurface(x,z)+.14,z],b=[end[0],terrainSurface(...end)+.14,end[1]];
  tube(a,b,.18,.12,wood,surface.bark,9);
  for(const [t,d] of [[.25,-1],[.53,1],[.72,-1]]){
   const c=a.map((v,i)=>lerp(v,b[i],t));
   tube(c,[c[0]+d*.48,c[1]+.34,c[2]+.42],.051,.015,wood,surface.bark,6);
  }
 }
}

function addHouseDrainage(x,y,z,w,d,h,plan){
 const at=z+d*.5+.19;
 const side=plan.offset>.5?1:-1,px=x+side*(w*.5-.17);
 const tint=shade(villageStoneTone(),.77);
 tube([px,y+h-.08,at],[px,y+.44,at],.043,.047,tint,102,8);
 tube([px,y+.45,at],[px+side*.17,y+.27,at+.18],.047,.052,tint,102,8);
 for(const height of [y+.68,y+h*.71]){
  tube([px-.07,height,at],[px+.07,height,at],.050,.050,tint,102,6);
 }
}

function furnishWear(x,base,left,right,back,front,cookX){
 const dark=color("#40362b"),flax=color("#9d8b6a"),cloth=color("#665f54");
 const runnerZ=lerp(back,front,.52),runnerX=x-.33;
 for(let i=0;i<19;i++){
  const z0=runnerZ+(i-9)*.075;
  const taper=.032*Math.sin(i*1.6);
  box(runnerX+taper,base+.012,z0,.92+taper,.013,.074,shade(i%5===0?flax:cloth,.86+(i%4)*.075),0,69);
 }
 for(const side of [-1,1])for(let i=0;i<13;i++){
  const px=runnerX+(i-6)*.065,pz=runnerZ+side*.715;
  tube([px,base+.023,pz],[px+.013,base+.016,pz+side*(.04+.016*(i%3))],.004,.002,flax,69,4);
 }
 const skirtZ=back+.057;
 box((left+right)/2,base+.013,skirtZ,right-left-.10,.105,.085,dark,0,73);
 for(const [offset,r] of [[-.25,.082],[.04,.068],[.26,.091]]){
  const px=cookX+offset,pz=back+.29;
  tube([px,base+1.705,pz],[px,base+1.77,pz],r*.86,r,color("#807868"),71,9);
 }
}

