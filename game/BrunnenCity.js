"use strict";

const brunnenEntry={x:114,z:119,waterX:104,bridgeStart:96,bridgeEnd:117};
const brunnenKeep={x:219,z:113};

function brunnenCityGrade(x,z,ground){
 const hill=cap(1-Math.hypot((x-brunnenKeep.x)/30,(z-brunnenKeep.z)/24),0,1);
 const cut=terrainEase(0,1,cap((6.4-Math.abs(x-brunnenEntry.waterX))/3.8,0,1))
  *terrainEase(0,1,cap((52-Math.abs(z-brunnenEntry.z))/9,0,1));
 return ground+17*hill*hill*(3-2*hill)-3.0*cut;
}

function brunnenCityReserved(x,z,margin=0){
 return (x>92-margin&&x<194+margin&&Math.abs(z-119)<22+margin)||
  (x>195-margin&&x<239+margin&&z>144-margin&&z<174+margin)||
  Math.hypot((x-brunnenKeep.x)*.84,z-brunnenKeep.z)<28+margin||
  (z>66-margin&&z<190+margin&&(Math.abs(x-114)<5+margin||Math.abs(x-246)<5+margin))||
  (x>111-margin&&x<249+margin&&(Math.abs(z-72)<5+margin||Math.abs(z-184)<5+margin));
}

function brunnenCityPaving(x,z){
 const {z:axis,waterX,bridgeStart}=brunnenEntry;
 return (x>=bridgeStart&&x<=197&&Math.abs(z-axis)<4.4)||
  (x>=121&&x<=195&&Math.abs(z-134)<3.4)||
  (x>=119&&x<152&&z>123&&z<134)||
  (Math.abs(x-193)<2.6&&z>=119&&z<157)||
  (x>=194&&x<237&&Math.abs(z-157)<3.1)||
  Math.hypot(x-216,z-157)<7||
  (Math.abs(x-waterX)<3.4&&Math.abs(z-axis)<47);
}

function buildBrunnenCity(){
 const {x:gate,z:axis,waterX,bridgeStart,bridgeEnd}=brunnenEntry;
 const stone=color("#a29a84"), trim=color("#bdb29b"), roof=color("#454b50");
 const wood=color("#694a32"), iron=color("#353433"), paving=color("#79736a");
 const masonry=surface.masonry, slab=surface.paving, slate=surface.slate;
 const random=rand(91223);
 const terrain=terrainSurface;
 const segment=(x,z,w,d,bottom,top)=>{
  box(x,bottom,z,w,top-bottom,d,stone,0,masonry);
  addSurface(x,z,w,d,bottom,top,false);
 };
 const column=(x,z,low,high,base,cap,tint,material,sides=24)=>
  tube([x,low,z],[x,high,z],base,cap,tint,material,sides);
 const tower=(x,z,base,radius,top,spire)=>{
  column(x,z,base,top,radius*1.07,radius,stone,masonry);
  column(x,z,top-.32,top+.14,radius*1.12,radius*1.12,trim,masonry);
  column(x,z,top+.12,top+.12+spire,radius*1.13,.09,roof,slate);
  addSurface(x,z,radius*1.55,radius*1.55,base,top,false);
  for(let j=0;j<8;j++){
   const a=j*Math.PI/4,px=x+Math.sin(a)*radius*.997,pz=z+Math.cos(a)*radius*.997;
   box(px,top-3.4,pz,.29,1.25,.07,iron,a,0);
  }
 };
 const wall=(a,b,fixed,alongX,level)=>{
  for(let start=a;start<b;start+=5){
   const end=Math.min(start+5,b),mid=(start+end)/2;
   const x=alongX?mid:fixed,z=alongX?fixed:mid;
   const base=Math.min(terrain(x,z),terrain(alongX?start:x,alongX?z:start),terrain(alongX?end:x,alongX?z:end))-1.05;
   const length=end-start, top=level??terrain(x,z)+9.2;
   segment(x,z,alongX?length:2.8,alongX?2.8:length,base,top);
   box(x,top-.22,z,alongX?length:3.12,.24,alongX?3.12:length,trim,0,masonry);
   const count=Math.max(1,Math.floor(length/1.36));
   for(let i=0;i<count;i++)for(const side of [-1,1]){
    const p=start+(i+.5)*length/count;
    box(alongX?p:x+side*1.17,top,z+(alongX?side*1.17:p-mid),
     alongX?.82:.48,.76,alongX?.48:.82,shade(stone,.92+random()*.18),0,masonry);
   }
  }
 };

 const roadY=(x,z)=>terrain(x,z);
 const leftY=roadY(bridgeStart,axis)+.03,rightY=roadY(bridgeEnd,axis)+.03;
 const deck=x=>{
  const t=cap((x-bridgeStart)/(bridgeEnd-bridgeStart),0,1);
  return lerp(leftY,rightY,t)+Math.sin(t*Math.PI)*.35;
 };
 const water=z=>lerp(terrain(waterX-6,z),terrain(waterX+6,z),.50)-1.47;
 for(let z=axis-47;z<axis+47;z+=2){
  const a=water(z),b=water(z+2);
  quad([waterX-3.32,a,z],[waterX-3.32,b,z+2],[waterX+3.32,b,z+2],[waterX+3.32,a,z],color("#536e68"),105);
  for(const side of [-1,1]){
   const x=waterX+side*3.17;
   quad([x,a-.60,z],[x,b-.60,z+2],[x,b+.47,z+2],[x,a+.47,z],stone,masonry);
  }
  if(z+2<axis-4.3||z>axis+4.3)
   addSurface(waterX,z+1,5.9,2,Math.min(a,b)-1,Math.max(a,b)+.20,false);
 }
 const bridgeWidth=7.6;
 addSurface((bridgeStart+bridgeEnd)*.5,axis,bridgeEnd-bridgeStart,bridgeWidth,
  Math.min(leftY,rightY)-.32,deck);
 for(let x=bridgeStart;x<bridgeEnd;x+=.5){
  const next=Math.min(bridgeEnd,x+.5),a=deck(x),b=deck(next);
  for(let i=0;i<12;i++){
   const z=axis-bridgeWidth/2+i*bridgeWidth/12;
   quad([x,a,z],[x,a,z+bridgeWidth/12],[next,b,z+bridgeWidth/12],[next,b,z],
    shade(paving,.84+random()*.27),slab);
  }
  for(const side of [-1,1]){
   const z=axis+side*(bridgeWidth/2+.22);
   const h=(x<108?.90:.38),span=.42;
   const opening=1.95*Math.sqrt(Math.max(0,1-((x-waterX)/3.4)**2));
   const bottom=Math.min(a-.28,water(z)-.55+opening);
   box((x+next)*.5,bottom,z,next-x,a-bottom+h,span,stone,0,masonry);
   box((x+next)*.5,a+h-.09,z,next-x,.12,.57,trim,0,masonry);
   addSurface((x+next)*.5,z,next-x,span,a-.23,a+h,false);
  }
 }
 aimBox("브뤼넨 성문 돌다리",104,axis,16,bridgeWidth,Math.min(leftY,rightY)-.3,Math.max(leftY,rightY)+.42);

 const spring=deck(gate)+4.1, radius=3.25, lintel=spring+radius+.72;
 const top=lintel+2.45, depth=5.2, endA=gate-depth/2,endB=gate+depth/2;
 const arc=(a,r,x)=>[x,spring+Math.sin(a)*r,axis+Math.cos(a)*r];
 for(let i=0;i<22;i++){
  const a=Math.PI*i/22,b=Math.PI*(i+1)/22,outer=radius+.56;
  const tint=shade(trim,.83+random()*.23);
  for(const x of [endA,endB]){
   const face=[arc(a,radius,x),arc(b,radius,x),arc(b,outer,x),arc(a,outer,x)];
   const p=arc(a,outer,x),q=arc(b,outer,x);
   const fill=[p,q,[x,lintel,q[2]],[x,lintel,p[2]]];
   if(x===endA){face.reverse();fill.reverse();}
   quad(...face,tint,masonry);
   quad(...fill,stone,masonry);
  }
  quad(arc(a,radius,endA),arc(b,radius,endA),arc(b,radius,endB),arc(a,radius,endB),shade(tint,.74),masonry);
 }
 segment(gate,axis,depth,7.64,lintel-.01,top);
 for(const side of [-1,1]){
  const z=axis+side*5.04;
  segment(gate,z,depth,3.58,Math.min(leftY,rightY)-1.5,top);
  box(endA+.17,deck(gate),axis+side*3.06,.19,3.89,.45,trim,0,masonry);
  box(gate,deck(gate)+.07,axis+side*3.06,4.1,3.62,.16,wood,0,surface.wall);
  for(const level of [.46,1.73,3.10]){
   box(gate,deck(gate)+level,axis+side*2.97,4.13,.13,.07,iron);
   for(let i=0;i<7;i++)box(gate-1.74+i*.58,deck(gate)+level+.025,axis+side*2.92,.048,.064,.048,trim);
  }
  tower(gate+.70,axis+side*8.2,terrain(gate,axis+side*8.2)-1.3,3.95,top+2.8,4.1);
  const bannerZ=axis+side*4.75;
  tube([endA-.29,spring+2.3,bannerZ-.61],[endA-.29,spring+2.3,bannerZ+.61],.055,.055,iron,0,8);
  for(let i=0;i<12;i++){
   const z=bannerZ-.53+i*.089;
   const drape=v=>endA-.27-Math.sin((v-bannerZ)*19)*.045;
   const cut=v=>spring-.67+Math.max(0,Math.abs(v-bannerZ)-.14)*.45;
   quad([drape(z),spring+2.26,z],[drape(z+.089),spring+2.26,z+.089],
    [drape(z+.089),cut(z+.089),z+.089],[drape(z),cut(z),z],
    color(i===0||i===11?"#b59660":"#853e32"));
  }
  const postX=101.6,postZ=axis+side*3.75,postY=deck(postX)+.72;
  column(postX,postZ,postY,postY+2.25,.105,.047,iron,0,9);
  box(postX,postY+2.21,postZ,.30,.43,.30,color("#c7aa71"));
  column(postX,postZ,postY+2.64,postY+2.83,.24,.025,iron,0,6);
 }
 box(gate,top-.10,axis,depth+.42,.29,13.7,trim,0,masonry);
 for(let i=-5;i<=5;i++)box(endA,top+.12,axis+i*1.2,.59,.83,.65,stone,0,masonry);
 aimBox("브뤼넨 정문 아치",gate,axis,depth,6.5,lintel,top);
 wall(72,axis-9,gate,false,top-1.45);
 wall(axis+9,184,gate,false,top-1.45);
 wall(gate,246,72,true);
 wall(gate,214,184,true);
 wall(228,246,184,true);
 wall(72,139,246,false);
 wall(151,184,246,false);
 for(const [x,z] of [[gate,72],[gate,184],[246,72],[246,184],[170,72],[183,184]]){
  const y=terrain(x,z);
  tower(x,z,y-1,3.45,y+12.5,3.5);
 }

 const {x:kx,z:kz}=brunnenKeep, keepY=terrain(kx,kz);
 const terrace=keepY-1.4;
 segment(kx,kz,30,22,keepY-15,terrace+1);
 segment(kx,kz,18.5,12.6,terrace,terrace+13);
 brunnenRoof(kx,kz,19.3,13.3,terrace+13,terrace+18.2);
 for(const dx of [-12.3,12.3])for(const dz of [-8.1,8.1])
  tower(kx+dx,kz+dz,keepY-12,3.15,terrace+15+dx*.12+dz*.07,5.7);
 tower(kx-1.3,kz-3.4,terrace,2.55,terrace+21,5.7);
 for(let j=0;j<9;j++){
  const x=kx-8+j*2;
  for(const y of [terrace+6,terrace+9.6]){
   box(x,y,kz+6.34,.77,1.85,.09,trim,0,masonry);
   box(x,y+.16,kz+6.40,.51,1.49,.09,iron);
  }
 }
 aimBox("브뤼넨 언덕성",kx,kz,30,22,keepY-12,terrace+26.7);

 function pavedStreet(a,b,z,width,crossStreet=false){
  for(let x=a;x<b;x+=1){
   for(let j=0;j<Math.ceil(width);j++){
    const start=z-width/2+j,end=Math.min(z+width/2,start+1);
    const p=(px,pz)=>crossStreet?[pz,terrain(pz,px)+.033,px]:[px,terrain(px,pz)+.033,pz];
    const stones=[p(x,start),p(x,end),p(x+1,end),p(x+1,start)];
    if(crossStreet)stones.reverse();
    quad(...stones,shade(paving,.85+random()*.25),slab);
   }
  }
 }
 pavedStreet(117,196,axis,8.6);
 pavedStreet(121,195,134,6.5);
 pavedStreet(119,157,193,5,true);
 pavedStreet(193,239,157,6);
 for(let z=123;z<131;z++)pavedStreet(119,152,z+.5,1);
 for(let i=0;i<8;i++){
  const x=124+i*4.2,z=i%2?113.05:125.32,y=terrain(x,z);
  const dye=color(["#a45341","#6a796d","#bb9859","#7e5861"][i%4]);
  box(x,y,z,2.24,.83,1.21,wood,0,surface.wall);
  addSurface(x,z,2.30,1.32,y-.09,y+.83,false);
  for(const side of [-1,1])for(const dz of [-.67,.67])
   box(x+side*1.20,y,z+dz,.084,2.47,.084,wood,0,surface.wall);
  for(let j=0;j<10;j++){
   const a=x-1.42+j*.284,b=a+.284;
   quad([a,y+2.24,z-.98],[b,y+2.24,z-.98],[b,y+2.57,z+.88],[a,y+2.57,z+.88],
    j%2?dye:shade(dye,1.40));
  }
  for(let j=0;j<4;j++)box(x-.77+j*.49,y+.83,z,.41,.20,.46,shade(wood,1.05+random()*.48),0,surface.wall);
  aimBox("브뤼넨 시장 가판대",x,z,2.8,1.8,y,y+2.6);
 }
 for(const z of [105,142,157,172])for(let i=0;i<9;i++){
  const x=126+i*7.3+(z%2)*2.1;
  if(!fitsTree(x,z,4.2))continue;
  const y=terrain(x,z), w=6.5, d=7.4,h=8.0+random()*3.9;
  const tint=color(["#d8c8a7","#aa6755","#bfb7a3","#e0cbae","#9e6453"][(i+z)%5]);
  const slateTone=color(["#674440","#47596b","#7c5242","#4a625f"][(i+z)%4]);
  const glassTint=color("#657b80"),shutter=color(["#7a8170","#695e53","#74847d"][(i+z)%3]),materials=architectureMaterials;
  const base=Math.max(y,...[-1,1].flatMap(a=>[-1,1].map(b=>terrain(x+a*w/2,z+b*d/2))));
  const footing=Math.min(y,terrain(x-w/2,z-d/2),terrain(x+w/2,z+d/2))-.35;
  box(x,footing,z,w+.16,base-footing+.32,d+.16,shade(stone,.80),0,masonry);
  box(x,base,z,w,h,d,tint,0,materials.stone);
  addSurface(x,z,w,d,footing,base+h,false);
  buildingFootprints.push({x,z,w,d});
  const eave=base+h,ridge=eave+2.45+random()*1.2;
  for(const side of [-1,1]){
   const edge=x+side*w*.58;
   const panel=[[x,ridge-.065,z-d*.616],[edge,eave+.015,z-d*.616],
    [edge,eave+.015,z+d*.616],[x,ridge-.065,z+d*.616]];
   if(side>0)panel.reverse();
   quad(...panel,roof,slate);
   architecturalRoofFace([edge,eave+.026,z-d*.616],[x,ridge-.054,z-d*.616],
    [x,ridge-.054,z+d*.616],[edge,eave+.026,z+d*.616],slateTone);
   box(x+side*(w*.5+.033),base+h-.39,z,.16,.20,d+.17,trim,0,materials.stone);
   const end=z+side*d*.50;
   triangle([x-side*w*.5,eave,end],[x+side*w*.5,eave,end],[x,ridge,end],tint,surface.plaster);
   const facade=x+side*(w*.5+.07);
   for(let floor=0;floor<4;floor++)for(const offset of [-2.22,0,2.22]){
    const sill=base+.60+floor*(h-1.2)/4;
    box(facade,sill,z+offset,.13,1.45,1.23,trim,0,masonry);
    box(facade+side*.09,sill+.11,z+offset,.08,1.17,.88,glassTint,0,materials.glass);
    box(facade+side*.14,sill+.62,z+offset,.026,.07,.88,trim);
    box(facade+side*.14,sill+.11,z+offset,.026,1.17,.06,trim);
    box(facade+side*.10,sill-.04,z+offset,.23,.12,1.25,trim,0,masonry);
    if(floor>0)for(const wing of [-1,1]){
     const leaf=z+offset+wing*.69;
     box(facade+side*.045,sill+.11,leaf,.095,1.22,.25,shutter,0,materials.wood);
     for(const bar of [.32,.98])box(facade+side*.101,sill+bar,leaf,.034,.044,.25,shade(shutter,.70),0,materials.wood);
    }
   }
  }
  brunnenRoof(x,z,w,d,eave,ridge);
  for(const side of [-1,1]){
   const face=z+side*(d/2+.055);
   for(let floor=0;floor<4;floor++)for(let bay=-1;bay<=1;bay++){
    const sill=base+.61+floor*(h-1.2)/4;
    box(x+bay*1.68,sill,face,1.12,1.43,.14,trim,0,masonry);
    const bayX=x+bay*1.68,glass=face+side*.08;
    box(bayX,sill+.12,glass,.81,1.17,.08,glassTint,0,materials.glass);
    box(bayX,sill+.12,glass+side*.044,.059,1.17,.027,trim);
    box(bayX,sill+.65,glass+side*.044,.81,.06,.027,trim);
    box(x+bay*1.68,sill-.04,face+side*.10,1.18,.11,.21,trim,0,masonry);
    const lintel=sill+1.40;
    box(bayX,lintel,face+side*.071,1.18,.12,.15,shade(trim,1.09),0,materials.stone);
    if(floor>0&&bay!==0)for(const wing of [-1,1])
     box(bayX+wing*.64,sill+.14,face+side*.06,.24,1.18,.11,shutter,0,materials.wood);
   }
   box(x,base+h-.29,face,w+.12,.18,.22,trim,0,materials.stone);
   for(let floor=1;floor<4;floor++){
    const course=base+.32+floor*(h-1.2)/4;
    box(x,course,face,w+.10,.092,.16,shade(trim,.92),0,materials.stone);
   }
   for(const sideX of [-1,1])for(let n=0;n<12;n++){
    const width=n%2?.31:.46;
    box(x+sideX*(w*.50-width*.48),base+n*h/12,face+side*.02,width,h/12-.043,.12,shade(trim,.88+(n%2)*.08),0,materials.stone);
   }
   const storefront=base+.21;
   box(x,storefront,face+side*.13,1.23,2.28,.18,wood,0,surface.wall);
   if(z===105||z===142){
    const dye=color(["#954b3e","#6c7360","#aa8759","#637274"][i%4]);
    for(let j=0;j<10;j++){
     const a=x-1.4+j*.28,b=a+.28;
     quad([a,base+3.0,face],[b,base+3.0,face],[b,base+2.51,face+side*1.10],
      [a,base+2.51,face+side*1.10],j%2?dye:shade(dye,1.37));
    }
   }
  }
  aimBox("브뤼넨 연립 주택",x,z,w,d,base,base+h+2.5);
 }
 const plants=[[120,113],[125,125],[132,112],[143,125],[154,111],[160,125],[170,112],[177,125],[188,111],[193,125]];
 for(let x=123;x<204;x+=9.5)for(const z of [149.5,165.2])plants.push([x,z]);
 const fountainX=216,fountainZ=157,fountainY=terrain(fountainX,fountainZ);
 for(let i=0;i<32;i++){
  const a=i*Math.PI/16,b=(i+1)*Math.PI/16;
  const rim=(angle,rise,r)=>[fountainX+Math.cos(angle)*r,fountainY+rise,fountainZ+Math.sin(angle)*r];
  quad(rim(a,.18,2.63),rim(a,.62,2.63),rim(b,.62,2.63),rim(b,.18,2.63),stone,masonry);
  quad(rim(a,.62,2.63),rim(a,.62,2.27),rim(b,.62,2.27),rim(b,.62,2.63),trim,masonry);
  triangle([fountainX,fountainY+.43,fountainZ],rim(b,.43,2.30),rim(a,.43,2.30),paving,105);
 }
 column(fountainX,fountainZ,fountainY+.20,fountainY+2.12,.51,.28,trim,masonry);
 column(fountainX,fountainZ,fountainY+2.12,fountainY+2.48,.29,.83,trim,masonry);
 addSurface(fountainX,fountainZ,4.0,4.0,fountainY-.06,fountainY+.62,false);
 aimBox("브뤼넨 정원 분수",fountainX,fountainZ,5.2,5.2,fountainY,fountainY+2.5);
 for(let x=200;x<237;x+=6)for(const z of [147,167])plants.push([x,z]);
 for(const [i,[x,z]] of plants.entries())brunnenOrnamentalTree(x,z,6.0+random()*2.8,i);
}

function brunnenOrnamentalTree(x,z,h,seed){
 if(!fitsTree(x,z,1.25))return;
 const y=terrainSurface(x,z),random=rand(91832+seed);
 const bark=color("#675744"), leaf=color(seed%6===2?"#b98088":"#657342");
 addSurface(x,z,.46,.46,y-.06,y+h,false);
 aimBox(seed%6===2?"꽃나무":"브뤼넨 관상수",x,z,h*.53,h*.53,y,y+h);
 if(wildVegetationReady&&paintRegionalTree(x,y,z,h,91832+seed,50)){
  if(seed%6===2)for(let i=0;i<20;i++){
   const a=i*2.39996,r=h*(.13+random()*.16),rise=h*(.60+random()*.29);
   const cx=x+Math.cos(a)*r,cz=z+Math.sin(a)*r;
   for(let j=0;j<6;j++){
    const b=j*Math.PI/3,w=h*(.014+random()*.012);
    const petal=[cx+Math.cos(b)*w,y+rise+.028,cz+Math.sin(b)*w];
    const tip=[cx+Math.cos(b)*w*2,y+rise-.022,cz+Math.sin(b)*w*2];
    triangle([cx,y+rise,cz],petal,tip.map((v,k)=>v+(k===0?-.063:k===2?.037:0)),shade(leaf,.91+random()*.22));
   }
  }
  return;
 }
 tube([x,y-.04,z],[x,y+h*.75,z],.25,.065,bark,surface.wall,9);
 const skin=(cx,cy,cz,r,depth,tint)=>{
  const point=(a,b)=>[cx+Math.cos(a)*Math.sin(b)*r,cy+Math.cos(b)*r*.88,cz+Math.sin(a)*Math.sin(b)*r*depth];
  for(let band=0;band<5;band++)for(let side=0;side<9;side++){
   const a=side*Math.PI*2/9,b=(side+1)*Math.PI*2/9,u=band*Math.PI/5,v=(band+1)*Math.PI/5;
   quad(point(a,u),point(a,v),point(b,v),point(b,u),shade(tint,.79+random()*.37));
  }
 };
 for(let branch=0;branch<11;branch++){
  const angle=branch*2.39996, reach=h*(.13+random()*.13);
  const bx=x+Math.cos(angle)*reach,bz=z+Math.sin(angle)*reach,by=y+h*(.58+random()*.33);
  tube([x,y+h*.42,z],[bx,by,bz],.085,.019,bark,surface.wall,6);
  skin(bx,by,bz,h*(.105+random()*.075),.77+random()*.45,shade(leaf,.82+random()*.28));
 }
}
