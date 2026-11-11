"use strict";

function buildSluiceMockup(gx,gz){
 const oak=color("#524333"),cedar=color("#817059"),iron=color("#3d4039"),stone=color("#777467");
 const joints=101, boards=104;
 const timber=(a,b,r,tint=oak)=>tube(a,b,r,r,tint,joints,6);
 const pillar=(x,z,w,d,base,top,seed)=>{
  box(x,base,z,w-.08,top-base,d-.08,stone,0,surface.foundation);
  for(const side of [-1,1]){
   stoneRetainingRun(x,z+side*d*.5,w,true,side,()=>base,()=>top,seed+side);
   stoneRetainingRun(x+side*w*.5,z,d,false,side,()=>base,()=>top,seed+12+side);
  }
 };
 aimBox("수문",gx,gz,32,3.2,1.02,5.38);
 for(const side of [-1,1]){
  const x=gx+side*10;
  pillar(x,gz,10,6.4,1.02,4.78,470+side*53);
  box(x,4.77,gz,9.94,.35,6.3,color("#827b68"),0,105);
  addSurface(x,gz,10,6.4,1.02,5.12);
  const guide=gx+side*4.8;
  pillar(guide,gz,1.2,1.4,1.48,4.96,782+side);
  addSurface(guide,gz,1.2,1.4,1.48,8.68);
  for(const z of [gz-.47,gz+.47]){
   box(guide,4.92,z,.36,4.42,.36,oak,0,boards);
   box(guide,5.27,z,.47,.23,.48,iron);
   box(guide,8.03,z,.46,.19,.47,iron);
   timber([guide,6.03,z],[guide-side*1.64,8.13,z],.11);
  }
 }
 for(let i=-8;i<=8;i++){
  const x=gx+i*.49;
  box(x,2.48,gz,.48,2.44,.44,shade(cedar,.78+(i%3+3)%3*.07),0,45);
  for(const side of [-1,1])box(x,2.69,gz+side*.236,.07,2.02,.056,iron,0,45);
 }
 for(const y of [2.73,4.55])box(gx,y,gz+.26,8.51,.13,.11,iron,0,45);

 addSurface(gx,gz,32,2.5,5.1,5.38);
 for(let i=0;i<76;i++){
  const x=gx-16+(i+.5)*32/76;
  box(x,5.1,gz,32/76-.016,.28,2.50,shade(cedar,.87+.16*Math.sin(i*1.81)),0,boards);
 }
 for(const side of [-1,1]){
  const z=gz+side*1.14;
  box(gx,4.79,z,32,.30,.21,oak,0,boards);
  for(let i=0;i<=12;i++){
   const x=gx-15.45+i*2.575;
   box(x,5.18,z,.137,1.26,.137,oak,0,boards);
   box(x,6.36,z,.19,.092,.19,cedar,0,boards);
  }
  box(gx,6.32,z,31.0,.12,.11,cedar,0,boards);
  box(gx,5.94,z,31.0,.089,.10,oak,0,boards);
 }
 const accessEnd=gx+22,accessHeight=terrainSurface(accessEnd,gz);
 const treads=Math.max(6,Math.ceil(Math.abs(accessHeight-5.38)/.42));
 for(let i=0;i<treads;i++){
  const stride=6/treads,x=gx+16+(i+.5)*stride,top=lerp(5.38,accessHeight,i/treads);
  addSurface(x,gz,stride+.025,2.34,top-.21,top);
  box(x,top-.21,gz,stride+.017,.21,2.34,shade(cedar,.84+(i%4)*.07),0,boards);
  aimBox("수문 계단",x,gz,stride+.025,2.34,top-.21,top);
  if(i%2===0)for(const z of [gz-.91,gz+.91]){
   const ground=terrainSurface(x,z);
   if(top-.18>ground)box(x,ground-.09,z,.18,top-ground-.09,.18,oak,0,boards);
  }
 }
 for(const side of [-1,1]){
  const z=gz+side*1.10;
  timber([gx+16,6.38,z],[accessEnd,accessHeight+.96,z],.057);
 }
 // A pitched rain roof, ridge cap and exposed rafters over the hoist.
 for(let i=0;i<25;i++){
  const a=gx-6.2+i*.496,b=a+.479;
  for(const side of [-1,1]){
   const edge=gz+side*2.18;
   quad([a,10.07,edge],[b,10.07,edge],[b,11.29,gz],[a,11.29,gz],
    shade(color("#605a4e"),.86+.19*Math.sin(i*2.39+side)),surface.roof);
   timber([a,10.03,edge],[a,11.28,gz],.037,oak);
  }
 }
 for(const side of [-1,1]){
  box(gx,9.89,gz+side*2.08,12.47,.18,.19,oak,0,boards);
  box(gx,8.11,gz+side*.57,10.55,.29,.32,oak,0,boards);
  for(const x of [gx-4.8,gx+4.8])timber([x,9.31,gz+side*.55],[x,10.08,gz+side*2.03],.117);
 }
 box(gx,11.24,gz,12.55,.15,.27,cedar,0,boards);
 aimBox("수문 조작 장치",gx,gz,10.5,1.85,5.39,9.5);
 timber([gx,4.62,gz],[gx,9.30,gz],.12,iron);
 for(const side of [-1,1]){
  const x=gx+side*2.54;
  for(let link=0;link<17;link++){
   const y=4.68+link*.24;
   const offset=link%2?.074:.045;
   tube([x-offset,y,gz+.27],[x+offset,y+.26,gz+.27],.024,.023,iron,45,5);
   tube([x+offset,y,gz+.27],[x-offset,y+.26,gz+.27],.024,.023,iron,45,5);
  }
  tube([x-.14,8.92,gz+.27],[x+.14,8.92,gz+.27],.18,.18,iron,102,12);
 }
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
  const rim=[gx+Math.cos(a)*.92,9.25,gz+Math.sin(a)*.92];
  timber(rim,[gx+Math.cos(b)*.92,9.25,gz+Math.sin(b)*.92],.055,iron);
  if(i%4===0)timber([gx,9.25,gz],rim,.045,iron);
 }
}

function plantSluiceBanks(){
 const random=rand(551302),reed=color("#6d783a"),tip=color("#a29962"),sedge=color("#405943");
 const clusters=[[489,333,4,17],[484,324,5,26],[490,313,4,17],[473,366,4,19],
  [468,336,5,24],[462,325,5,22],[464,308,5,20],[480,301,4,18],[497,354,3,18]];
 for(const [cx,cz,radius,count] of clusters)for(let i=0;i<count;i++){
  const angle=random()*Math.PI*2,reach=Math.sqrt(random())*radius;
  const x=cx+Math.cos(angle)*reach,z=cz+Math.sin(angle)*reach,y=terrainSurface(x,z);
  if(y<1.94||y>8.8||roadDist(x,z)<2.55||Math.abs(z-350)<3.3&&x>492)continue;
  const h=.75+random()*1.26,tone=mix(sedge,reed,random()*.85);
  for(let blade=0;blade<5;blade++){
   const turn=angle+blade*2.39;
   curvedPlantLeaf(x,y-.038,z,turn,h*(.57+random()*.47),h*(.19+random()*.42),.029+random()*.041,shade(tone,.78+random()*.34),.29);
  }
  if(i%3===0){
   const top=[x+.12,y+h+.10,z-.09];
   tube([x,y-.02,z],top,.017,.010,reed,0,5);
   tube(top,[top[0]+.021,top[1]+.29,top[2]-.018],.038,.021,shade(tip,.73+random()*.23),0,6);
  }
 }
 // Low, broad riparian clusters under the taller reeds, with a clear inspection path.
 for(const [cx,cz] of [[492,334],[497,337],[489,322],[465,331],[467,358],[496,362]]){
  for(let i=0;i<11;i++){
   const x=cx+(random()-.5)*5,z=cz+(random()-.5)*5,y=terrainSurface(x,z);
   if(y<2.15||roadDist(x,z)<2.1)continue;
   for(let j=0;j<5;j++)curvedPlantLeaf(x,y-.025,z,j*2.4+i,.26+random()*.42,.33+random()*.39,.06+random()*.04,shade(sedge,.81+random()*.47),.27);
  }
 }
 for(const [x,z,size] of [[492,322,4.9],[466,334,5.4],[470,362,4.1],[496,365,5.2]]){
  const y=terrainSurface(x,z);
  if(y<2.25)continue;
  const bark=color("#574f3e"),stem=[x+.47,y+size*.65,z-.27],crown=[x+.13,y+size,z+.10];
  tube([x,y-.16,z],stem,.30,.16,bark,0,9);
  tube(stem,crown,.16,.076,bark,0,8);
  for(let branch=0;branch<7;branch++){
   const angle=branch*2.399963,dx=Math.cos(angle),dz=Math.sin(angle);
   const reach=size*(.21+random()*.22),end=[stem[0]+dx*reach,crown[1]-(.25+random()*.80),stem[2]+dz*reach];
   tube(stem,end,.079,.025,bark,0,6);
   for(let spray=0;spray<11;spray++){
    const u=spray/11,px=lerp(stem[0],end[0],u)+(random()-.5)*.36,pz=lerp(stem[2],end[2],u)+(random()-.5)*.40;
    const py=lerp(stem[1],end[1],u)+.19;
    for(let leaf=0;leaf<4;leaf++)curvedPlantLeaf(px,py,pz,angle+leaf*1.58,-(.48+random()*.61),.28+random()*.53,.065+random()*.048,shade(reed,.61+random()*.44),.20);
   }
  }
 }

 // Follow both banks at the existing shoreline, then set taller plants back from it.
 const bankX=(z,side,target)=>{
  let match=null,best=Infinity;
  for(let x=423;x<518;x+=.5){
   const y=terrainSurface(x,z);
   if(riverSide(x,z)!==side||roadDist(x,z)<3.3||y<2.20||y>12)continue;
   const score=Math.abs(y-target);
   if(score<best){best=score;match=x;}
  }
  return match;
 };
 for(const side of [-1,1])for(let patch=0;patch<10;patch++){
  const z=309+patch*6.5+(random()-.5)*4;
  if(Math.abs(z-350)<5)continue;
  const x=bankX(z,side,3.1);
  if(x===null)continue;
  for(let tuft=0;tuft<14;tuft++){
   const px=x+side*(random()*2.0-.43),pz=z+(random()-.5)*4.8;
   const py=terrainSurface(px,pz);
   if(py<2.12||roadDist(px,pz)<3)continue;
   const h=.58+random()*1.17;
   for(let leaf=0;leaf<6;leaf++){
    curvedPlantLeaf(px,py-.04,pz,leaf*2.39+tuft,h*(.50+random()*.58),.30+random()*.39,.04+random()*.055,shade(reed,.70+random()*.43),.26);
   }
   if(tuft%4===0){
    const head=[px+.10,py+h*1.12,pz-.11];
    tube([px,py,pz],head,.019,.012,sedge,0,5);
    tube(head,[head[0]+.023,head[1]+.31,head[2]-.028],.044,.021,shade(tip,.64),0,6);
   }
  }
 }
 for(const [z,side,h] of [[312,-1,6.2],[322,-1,5.1],[331,-1,7.1],[341,-1,4.2],[360,-1,6.6],[365,-1,4.7],[369,1,5.3],[312,1,4.9]]){
  const bank=bankX(z,side,4.45);
  if(bank===null)continue;
  const x=bank+side*1.4,y=terrainSurface(x,z);
  if(y<2.4||roadDist(x,z)<4)continue;
  broadleafTree(x,y-.08,z,h,6100+z,"aspen");
  for(let spray=0;spray<26;spray++){
   const a=spray*2.4,r=h*(.12+random()*.21);
   const px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r,py=y+h*(.62+random()*.25);
   for(let j=0;j<3;j++)curvedPlantLeaf(px,py,pz,a+j*1.3,-(.51+random()*.97),.27+random()*.38,.075+random()*.05,shade(reed,.64+random()*.34),.24);
  }
 }

}
