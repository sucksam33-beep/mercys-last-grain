// District art direction. Gameplay names and rewards come from the encyclopedia.
const districtArt=[
 null,
 {wall:"#c8b995",roof:"#4d5860",path:"#a69a83",rock:"#bcb394",fog:[.63,.72,.75],light:[.80,.74,.64],trees:1.0},
 {wall:"#b98a61",roof:"#90543a",path:"#cb9a69",rock:"#ad6645",fog:[.77,.74,.65],light:[.86,.65,.48],trees:.44},
 {wall:"#a18160",roof:"#694f3d",path:"#a58762",rock:"#9d684d",fog:[.66,.73,.75],light:[.78,.68,.56],trees:.86},
 {wall:"#9a9d90",roof:"#485b63",path:"#989e9a",rock:"#a5aaa7",fog:[.65,.77,.86],light:[.72,.77,.82],trees:.84},
 {wall:"#796c56",roof:"#435856",path:"#8b8067",rock:"#a6a287",fog:[.63,.72,.68],light:[.77,.73,.61],trees:.77},
 {wall:"#d4be8c",roof:"#925c41",path:"#d3bc88",rock:"#cfbd94",fog:[.62,.79,.86],light:[.81,.75,.61],trees:.66},
 {wall:"#858d8c",roof:"#456173",path:"#919e9d",rock:"#a9bcc2",fog:[.67,.76,.84],light:[.73,.78,.83],trees:.46}
];
const berryColors=["#993643","#bc6937","#604469","#a8853b","#394763"];
const leafColors=["#536d3d","#658143","#3d6548","#79864b"];
let districtRegrowthDay=Infinity;
let districtAimBase=0,districtResourceBuffer,districtResourceCount=0;
let districtEcologyDirty=false,buildingDistrictEcology=false;
function rebuildDistrictEcology(){
 for(const [key,surfaces] of sceneryCells){
  if(!surfaces.some(surface=>surface.districtResource))continue;
  const retained=surfaces.filter(surface=>!surface.districtResource);
  if(retained.length)sceneryCells.set(key,retained);else sceneryCells.delete(key);
 }
 aimObjects.length=districtAimBase;
 aimTarget=null;aimAt=-Infinity;
 districtRegrowthDay=Infinity;
 const old=verts;
 verts=[];
 buildingDistrictEcology=true;
 riggedScene?.beginMaterialDisplays(s.region);
 try{districtResources();buildCraftingWorld();paintTimberSites();paintTimberStructures();buildMaterialRack();buildDistrictWildlife()}finally{buildingDistrictEcology=false}
 districtResourceBuffer??=gl.createBuffer();
 districtResourceCount=verts.length/10;
 upload(districtResourceBuffer);
 verts=old;
 districtEcologyDirty=false;
 if(graphics.shadows)graphics.shadows.key="";
 if(graphics.foliageShadows)graphics.foliageShadows.key="";
}
function worldResourceAvailable(id){
 const next=s.worldHarvest?.[id]||0;
 if(next<=s.day)return true;
 districtRegrowthDay=Math.min(districtRegrowthDay,next);
 return false;
}
function worldPlant(x,y,z,group,index,item){
 const profile=botanicalSpecies[s.region];
 if(profile&&paintRegionalPlant(x,y,z,Math.round(x*53+z*97),profile.first+[0,5,7][group]+index))return;
 const green=color(leafColors[index%leafColors.length]);
 if(group===0&&s.region===2&&index<3){
  const cactus=color("#5f763e"),fruit=color("#bd6542");
  if(index===0){
   taper(x,y,z,1.33,.14,.11,cactus,9);
   for(const side of [-1,1]){
    box(x+side*.18,y+.57,z,.33,.12,.12,cactus);
    taper(x+side*.32,y+.57,z,.52,.063,.05,cactus,6);
    crown(x+side*.32,y+1.04,z,.071,.14,fruit);
   }
  }else if(index===1){
   for(const side of [-1,0,1]){
    crown(x+side*.24,y+.09+Math.abs(side)*.17,z,.23,.61,cactus);
    crown(x+side*.24,y+.67+Math.abs(side)*.14,z,.065,.14,fruit);
   }
  }else{
   taper(x,y,z,.39,.26,.34,cactus,12);
   taper(x,y+.39,z,.26,.34,.08,cactus,12);
   crown(x,y+.58,z,.08,.17,fruit);
  }
  return;
 }
 const treeFruit=/사과|야생 배|산감|야생 감|망고|타마린드|대추야자|구아바/.test(item);
 if(treeFruit&&group===0){
  const bark=color("#71624a"),fruit=color(berryColors[index%berryColors.length]);
  taper(x,y,z,1.28,.073,.025,bark,8);
  for(let i=0;i<6;i++){
   const a=i*2.399,dx=Math.cos(a),dz=Math.sin(a);
   const root=[x,y+.65+i*.066,z],tip=[x+dx*.41,y+.86+i*.072,z+dz*.41];
   tube(root,tip,.024,.006,bark,80.05,5,80.23);
   for(let leaf=0;leaf<5;leaf++){
    const start=mix(root,tip,.31+leaf*.16),theta=a+(leaf%2?-.96:.96),vx=Math.cos(theta),vz=Math.sin(theta);
    foldedFloraLeaf(start,addFlora(start,[vx*.21,.07,vz*.21]),[-vz,0,vx],.064,[0,.031,0],shade(green,.87+leaf*.065));
   }
   if(i%2===0)rounded(tip[0],tip[1]-.065,tip[2],.072,.075,.070,fruit);
  }
  return;
 }
 const rise=group===0?.62+(index%3)*.16:group===1?.44:.93;
 for(let k=0;k<5;k++){
  const angle=k*2.399+index,dx=Math.cos(angle),dz=Math.sin(angle);
  curvedPlantLeaf(x+dx*.18,y,z+dz*.18,angle,rise*(.60+k*.06),.19+k*.033,group===2?.034:.094,green);
  if(group===2)taper(x+dx*.19,y+rise*.63,z+dz*.19,rise*.31,.051,.016,color(index%2?"#bd9d56":"#d3b77a"),4);
  if(group===0)crown(x+dx*.29,y+rise*(.55+k*.056),z+dz*.29,.082,.12,color(berryColors[index%berryColors.length]));
  if(group!==2){
   const branch=[x+dx*.21,y+rise*.44,z+dz*.21];
   const point=[x+dx*.38,y+rise*.67,z+dz*.38];
   foldedFloraLeaf(branch,point,[-dz,0,dx],.074,[0,.025,0],shade(green,1.04));
  }
 }
}
function districtResources(){
 const add=(type,item,index,x,z,w,h,paint)=>{
  const id=objectKey("ecology-"+type+"-"+index,x,z), y=terrainSurface(x,z);
  if(!worldResourceAvailable(id))return;
  paint(x,y,z,index);
  aimBox(item,x,z,w,w,y-.12,y+h,null,{type,item,index,id,x,z,reach:3.8});
 };
 const woods=here("woods"), quarry=here("rocks");
 r().plants.forEach((items,group)=>items.forEach((item,index)=>{
  const x=woods.x+5+index*2.25,z=woods.y+8+group*4.4;
  add("plant",item,group*16+index,x,z,1.4,1.42,(a,y,b)=>worldPlant(a,y,b,group,index,item));
 }));
 [r().stone,alternateStone[s.region]].filter(Boolean).forEach((item,index)=>{
  add("deposit",item,index,quarry.x-5+index*5,quarry.y+12,3,1.9,(x,y,z)=>{
   const tint=color(index?"#b49072":districtArt[s.region]?.rock||"#9fa5a0");
   quarryStone(x,y,z,2.66,1.56,2.24,tint,572+index);
  });
 });
}
const wildlifeKinds=[
 ["hare","boar","deer","bear","bison"],["bird","boar","wolf","deer","bison"],
 ["hare","boar","wolf","sheep","camel"],["bird","beaver","deer","deer","bison"],
 ["bird","beaver","wolf","deer","bison"],["bird","beaver","wolf","alligator","bison"],
 ["bird","boar","cat","zebra","rhino"],["hare","seal","wolf","deer","mammoth"]
];
// Adult and young counts for one ordinary encounter, in regional species order.
const wildlifeGroups=[
 [[1,0],[3,2],[4,2],[1,0],[5,2]],
 [[2,0],[3,2],[2,1],[4,2],[6,3]],
 [[1,0],[6,3],[1,0],[5,2],[5,2]],
 [[11,5],[4,2],[3,1],[6,2],[6,3]],
 [[1,0],[9,5],[3,1],[7,2],[9,3]],
 [[13,5],[3,1],[2,1],[1,0],[6,3]],
 [[6,3],[3,2],[1,0],[4,2],[2,0]],
 [[1,0],[10,4],[2,1],[1,0],[4,2]]
];
const wildlifeSpacing={
 hare:1.25,bird:1.1,beaver:1.35,boar:2.2,wolf:2.6,cat:2.5,deer:3.3,
 sheep:3,seal:2.7,alligator:4,bear:3,bison:4,camel:4.3,zebra:3.8,rhino:4.4,mammoth:6.1
};
const wildlife=[];
let wildlifeBuiltRegion=-1;
let wildlifeBuffer;
function sealResting(hour=s.hour){return hour>=10&&hour<17}

// Placement profiles follow the species names, which can differ from the reused model.
const wildlifeHabitats=[
 ["brush","woodedBank","forestEdge","deepForest","grassland"],
 ["brush","woodedBank","remoteForest","forestEdge","grassland"],
 ["scrub","scrub","dryRange","cliffs","dryPlain"],
 ["forestEdge","streambank","brush","forestEdge","grassland"],
 ["deepForest","alpineMeadow","remoteForest","forestEdge","grassland"],
 ["wetland","streambank","woodedBank","wetland","floodMeadow"],
 ["brush","woodedBank","deepForest","savanna","savannaBrush"],
 ["brush","coast","tundra","woodedBank","coldSteppe"]
];
const wildlifeWaterLevel=2.115;
const wildlifeVillageBuffer=60;
function wildlifeOutskirts(x,z,centers){
 return x>=13&&x<=627&&z>=22&&z<=402&&
  centers.every(p=>Math.hypot(x-p.x,z-p.y)>=105)&&fitsTree(x,z,wildlifeVillageBuffer);
}
function wildlifeGround(x,z){
 const height=terrainSurface(x,z);
 const cover=woodlandCover(s.region,x,z);
 const slope=Math.max(Math.abs(terrainSurface(x+5,z)-terrainSurface(x-5,z)),
  Math.abs(terrainSurface(x,z+5)-terrainSurface(x,z-5)))/10;
 let waterDistance=60,waterX=x,waterZ=z;
 for(const radius of [4,9,17,28,44]){
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4;
   const a=x+Math.cos(angle)*radius,b=z+Math.sin(angle)*radius;
   if(terrainSurface(a,b)>=wildlifeWaterLevel)continue;
   waterDistance=radius;waterX=a;waterZ=b;break;
  }
  if(waterDistance<60)break;
 }
 return {x,z,height,cover,slope,waterDistance,waterX,waterZ};
}
function wildlifeHabitatScore(kind,p){
 const {x,z,height,cover,slope,waterDistance}=p;
 const near=1-waterDistance/60,open=1-cover,level=1-Math.min(1,slope);
 const shore=waterDistance<=17&&height<=5;
 if(kind==="coast")return shore&&x>=480?near*3+level*2+(x-480)/95:-Infinity;
 if(kind==="wetland")return shore&&height<=3.7?near*3+level*2:-Infinity;
 if(kind==="streambank")return waterDistance<=17&&height<=7?near*4+cover*1.5+level:-Infinity;
 if(height<2.28)return -Infinity;
 switch(kind){
  case "brush": return 4-6*Math.abs(cover-.44)+level;
  case "woodedBank": return cover*3+near*4.5+level;
  case "forestEdge": return 4-6*Math.abs(cover-.58)+level;
  case "deepForest": return cover*6+level;
  case "remoteForest": return cover*4+level+Math.min(1,height/55);
  case "grassland": return open*3+level*3;
  case "scrub": return 4-6*Math.abs(cover-.37)+level+near*.8;
  case "dryRange": return open*2+level+Math.min(1,height/55);
  case "cliffs": return Math.min(1,slope)*3+Math.min(1,height/65)*2+open;
  case "dryPlain": return open*3+level*3+(1-near);
  case "alpineMeadow": return open*3+level*2+Math.min(1,height/65)*3;
  case "floodMeadow": return open*2+level*2+near*2-Math.min(2,Math.abs(height-4)*.18);
  case "savanna": return 3-5*Math.abs(cover-.22)+level*2+near;
  case "savannaBrush": return 3-5*Math.abs(cover-.36)+level*2+near*1.2;
  case "tundra": return open*3+level*2+Math.min(1,height/55);
  case "coldSteppe": return open*4+level*3;
 }
}
function wildlifeAnchor(candidates,habitat,occupied,random){
 let best=null,bestScore=-Infinity;
 for(const p of candidates){
  const separation=Math.min(85,...occupied.map(other=>Math.hypot(p.x-other.x,p.z-other.z)));
  const score=wildlifeHabitatScore(habitat,p)+separation/42+random()*.22;
  if(score>bestScore){best=p;bestScore=score;}
 }
 return best;
}

// The world clock has days and hours. Wildlife uses a four-part, 112-day seasonal cycle.
function visibleWildlife(region,index,rank,juvenile,day=s.day,hour=s.hour){
 const season=Math.floor((day-1)/28)%4;
 const morning=hour>=5&&hour<9,evening=hour>=17&&hour<22;
 let limit;
 if(region===3&&index===1)limit=morning||evening?[2,1]:[1,0];
 if(region===4&&index===1)limit=season===3?[0,0]:morning||evening?[3,2]:[2,1];
 if(region===3&&index===0)limit=season>=2?[11,5]:[5,3];
 if(region===5&&index===0)limit=season===3&&(morning||evening)?[13,5]:[5,2];
 if(region===7&&index===1)limit=sealResting(hour)?(season===1||season===3?[10,4]:[6,2]):[2,0];
 if(!limit)return true;
 const total=wildlifeGroups[region][index][Number(juvenile)];
 const offset=(region===3&&index===1)||(region===4&&index===1)?day-1:0;
 return (rank+offset)%total<limit[Number(juvenile)];
}

function herdPosition(parent,anchor,spacing,member,habitat,random,occupied,centers){
 if(member===0)return anchor;
 const angle=random()*Math.PI*2;
 let best=null,bestScore=-Infinity;
 for(let attempt=0;attempt<72;attempt++){
  const radius=spacing*(.64+Math.sqrt(member)+attempt*.055);
  const direction=angle+attempt*2.39996;
  const x=parent.x+Math.cos(direction)*radius,z=parent.z+Math.sin(direction)*radius*.82;
  if(!wildlifeOutskirts(x,z,centers))continue;
  if(occupied.some(p=>Math.hypot(p.x-x,p.z-z)<(p.spacing+spacing)*.41))continue;
  const ground=wildlifeGround(x,z);
  if(ground.height<2.08||ground.slope>1.15||supportAt(x,z,ground.height)===null)continue;
  const score=wildlifeHabitatScore(habitat,ground)-attempt*.028;
  if(score>bestScore){best=ground;bestScore=score;}
 }
 return best;
}
function buildDistrictWildlife(){
 const world=verts;
 verts=[];
 const previous=new Map(wildlifeBuiltRegion===s.region?wildlife.map(animal=>[animal.target.action.id,animal]):[]);
 wildlifeBuiltRegion=s.region;
 wildlife.length=0;
 const sites=[];
 const field=here("field");
 const centers=["station","home","field"].map(here).filter(Boolean);
 const candidates=[];
 for(let z=24;z<=400;z+=8)for(let x=16;x<=624;x+=8){
  if(!wildlifeOutskirts(x,z,centers))continue;
  const ground=wildlifeGround(x,z);
  if(ground.height>=2.08&&ground.slope<=1.15&&supportAt(x,z,ground.height)!==null)candidates.push(ground);
 }
 const occupied=[];
 r().animals.forEach((item,index)=>{
  const kind=wildlifeKinds[s.region][index];
  const habitat=wildlifeHabitats[s.region][index];
  const random=rand(17761+s.region*3899+index*1193);
  const patrol=s.region===1&&index===2?[544,80,14]:s.region===1&&index===3?[576,80,8]:s.region===2&&index===2?[576,304,14]:null;
  const local=patrol?candidates.filter(p=>Math.hypot(p.x-patrol[0],p.z-patrol[1])<=patrol[2]):candidates;
  const anchor=wildlifeAnchor(local.length?local:candidates,habitat,occupied,random);
  if(!anchor)return;
  const site=planWildlifeSite(s.region,index,anchor);
  sites.push(site);
  const spacing=wildlifeSpacing[kind];
  const aquatic=habitat==="wetland"||habitat==="coast";
  // Keep the keys of previously hunted animals valid after moving their groups.
  const oldAquatic=kind==="seal"||kind==="alligator";
  const id=objectKey("ecology-animal-"+index,oldAquatic?487:field.x-22+index*9,oldAquatic?271:field.y+29+(index%2)*8);
  const scale=.57+index*.24;
  const start=verts.length/10;
  const tint=color(["#b5936c","#927257","#79736b","#73563c","#54493f"][index]);
  const tall=["deer","zebra","camel"].includes(kind), bird=kind==="bird";
  const h=aquatic?.28:bird?.47:tall?1.27:.72;
  const body=(a,b,c,w,d,color=tint)=>crown(a*scale,b*scale,c*scale,w*scale,d*scale,color);
  body(0,h-.25,0,bird?.56:1.01,aquatic?.39:.75);
  body(.83,h,0,bird?.24:.36,tall?.93:.52);
  body(1.06,h+.25,0,bird?.20:.34,.42);
  if(aquatic){
   body(-.97,.04,0,kind==="seal"?.60:.46,.19);
  }else for(const dx of bird?[.07]:[-.55,.55])for(const dz of [-.29,.29]){
   taper(dx*scale,0,dz*scale,h*scale,.075*scale,.093*scale,shade(tint,.73),5);
  }
  if(bird)body(-.68,h-.07,0,.49,.78,shade(tint,.79));
  if(kind==="camel"){body(-.29,h+.12,0,.42,.92);body(.34,h+.13,0,.37,.85)}
  for(const side of [-1,1]){
   if(kind==="hare")body(.99,h+.48,side*.12,.115,.56);
   if(["bison","deer","sheep","rhino","mammoth"].includes(kind)){
    const base=[1.09*scale,(h+.34)*scale,side*.21*scale];
    const end=[(kind==="mammoth"?1.66:.87)*scale,(h+(kind==="mammoth"?.06:.92))*scale,side*.47*scale];
    tube(base,end,.08*scale,.02*scale,color("#cbbfa0"),0,5);
   }
   if(kind==="zebra")for(const a of [-.57,-.27,.04,.35])body(a,h-.17,side*.43,.11,.58,color("#4b4941"));
  }
  if(kind==="mammoth")body(1.23,h-.35,0,.18,.79);
  const count=verts.length/10-start;
  const [adults,young]=wildlifeGroups[s.region][index];
  const parents=[];
  for(let member=0;member<adults+young;member++){
   const juvenile=member>=adults;
   const rank=juvenile?member-adults:member;
   const ageScale=juvenile?.53+random()*.13:1;
   const parent=juvenile&&parents.length?parents[(member-adults)%parents.length]:anchor;
   const position=herdPosition(parent,anchor,spacing,juvenile?1:member,habitat,random,occupied,centers);
   if(!position)continue;
   if(!juvenile)parents.push(position);
   occupied.push({x:position.x,z:position.z,spacing:spacing*ageScale});
   const memberId=member===0?id:id+"-member-"+member;
   if(!worldResourceAvailable(memberId))continue;
   const y=terrainSurface(position.x,position.z);
   const available=()=>visibleWildlife(s.region,index,rank,juvenile);
   const action={type:"animal",item,index,id:memberId,x:position.x,z:position.z,juvenile,available,reach:aquatic?7.5:4.6};
   // Separate seed keeps individual variation independent of the placement RNG.
   const individual=rand(7039+s.region*8707+index*971+member*1777);
   individual();
   const cohort=juvenile?young:adults;
   // Spread each age group across the range, including two-member groups.
   const spread=slot=>cohort<2?individual():cap(slot/(cohort-1)+(individual()-.5)*.10,0,1);
   // Alternate the extremes so a seasonally visible subset still has contrast.
   const band=rank%2===0?Math.floor(rank/2):cohort-1-Math.floor(rank/2);
   const opposite=cohort-1-band;
   const sizeFactor=lerp(.85,1.15,spread(index%2===0?band:opposite));
   const shape=[sizeFactor*lerp(.94,1.06,individual()),sizeFactor*lerp(.96,1.04,individual()),
    sizeFactor*lerp(.87,1.14,individual())];
   const brightness=lerp(.73,1.24,spread(band));
   const warmth=lerp(-.12,.12,spread(opposite));
   const coat=[brightness*(1+warmth),brightness*lerp(.96,1.04,individual()),brightness*(1-warmth)];
   const range=lerp(.42,1.62,spread((s.region+index)%2===0?opposite:band)),pace=lerp(.67,1.40,individual());
   const offset=individual()*Math.PI*2;
   const size=scale*ageScale;
   aimBox(item+(juvenile?" · 새끼":" · 성체"),position.x,position.z,2.9*size,2.2*size,y-.15,y+2.7*size,null,action);
   const animal={start,count,...position,habitat,scale,ageScale,member,shape,coat,range,pace,offset,aquatic,
    climb:wildlifeClimbRoute(s.region,index,position.x,position.z),seal:kind==="seal",waterRoute:wildlifeWaterRoute(s.region,index,position.x,position.z),
    restRock:s.region===7&&kind==="seal"?sealRestRocks.find(rock=>rock.member===member):null,target:aimObjects.at(-1),seasonAvailable:available};
   const prior=previous.get(memberId);
   animal.behavior=prior?.x===animal.x&&prior.z===animal.z?prior.behavior:createWildlifeBehavior(animal,site);
   action.available=()=>available()&&!animal.behavior.hidden;
   wildlife.push(animal);
  }
 });
 const current=new Map(wildlife.map(animal=>[animal.target.action.id,animal]));
 for(const {behavior} of wildlife){
  const hunt=behavior.hunt;
  if(!hunt)continue;
  const target=current.get(hunt.target.target.action.id);
  if(target&&target.behavior===hunt.target.behavior)hunt.target=target;else behavior.hunt=null;
 }
 wildlifeBuffer??=gl.createBuffer();
 upload(wildlifeBuffer);
 verts=world;
 drawWildlifeHabitatSites(sites);
}
function drawDistrictWildlife(mesh,time){
 updateWildlifePursuits(time);
 riggedScene?.beginWildlife?.(s.region);
 for(const animal of wildlife){
  const {scale,ageScale,member,shape,coat,seal,target}=animal;
  if(!animal.seasonAvailable())continue;
  const hit=craftHit?.id===target.action.id?craftHit:null;
  const shove=(hit?.shove??0)*Math.max(0,1-(performance.now()-(hit?.at??0))/1800);
  const water=updateWildlifeBehavior(animal,time);
  if(water.hidden)continue;
  const rock=animal.restRock;
  const a=water.x+Math.sin(heading)*shove;
  const b=water.z+Math.cos(heading)*shove;
  const y=water.y+(rock&&water.speed===0&&Math.hypot(a-rock.x,b-rock.z)<.5?rock.rise+.025:0)+(water.lift??0);
  Object.assign(target.action,{x:a,z:b});
  const rotation=water.rotation;
  const model=riggedScene?.placeWildlife?.(s.region,target.action.index,a,y,b,rotation,member,ageScale,shape,coat,water);
  if(water?.wet>.35){
   prepareWildlifeWake();
   mesh(wildlifeWakeBuffer,wildlifeWakeCount,[a,water.waterline+.025,b],rotation,(seal?1.45:water.dive!==undefined?2.10:1)*ageScale,0,(water.wake??water.wet)*.64);
  }
  const length=(model?.length??2.9*scale)*shape[0]*ageScale;
  const width=(model?.width??2.5*scale)*shape[2]*ageScale;
  const halfX=(Math.abs(Math.cos(rotation))*length+Math.abs(Math.sin(rotation))*width)*.5;
  const halfZ=(Math.abs(Math.sin(rotation))*length+Math.abs(Math.cos(rotation))*width)*.5;
  target.min=[a-Math.max(.22,halfX),y-.15,b-Math.max(.22,halfZ)];
  target.max=[a+Math.max(.22,halfX),y+Math.max(.24,(model?.height??2.7*scale)*ageScale*shape[1]),b+Math.max(.22,halfZ)];
  if(!model&&(water?.dive??0)<.78)mesh(wildlifeBuffer,animal.count,[a,y,b],rotation,ageScale*Math.cbrt(shape[0]*shape[1]*shape[2]),0,1,animal.start);
 }
}

function districtFishing(){
 const post=color("#6a5741"), wake=color(r().water).map(channel=>Math.min(1,channel*.55+.33));
 for(const [i,z] of [262,279].entries()){
  const section=watershedCrossSection(s.region,z,473);
  if(!section)continue;
  const center=section.x,x=center+section.width+6,y=height(x,z);
  if(x>634||y<2.1)continue;
  const deep=i===1;
  const name=deep?(s.region===1?"종탑 아래 깊은 물길":"깊은 물 낚시 자리"):"얕은 물 낚시 자리";
  taper(x,y,z,.91,.065,.053,post,5);
  box(x,y+.84,z,.72,.34,.10,color(deep?"#38606a":"#a49162"));
  aimBox(name,x,z,1.1,1.1,y-.10,y+1.25,null,{type:"fish",deep,x,z,floatX:center+(deep?2:8),reach:6});
  for(let k=0;k<(deep?2:5);k++){
   const sx=center+(deep?1:6)+k*.58,sz=z+(k%2)*.9,scale=deep?.53:.23;
   for(let j=0;j<12;j++){
    const a=j*Math.PI/6,b=(j+1)*Math.PI/6;
    const p=(angle,r)=>[sx+Math.cos(angle)*r,2.126,sz+Math.sin(angle)*r*.55];
    quad(p(a,scale),p(b,scale),p(b,scale+.04),p(a,scale+.04),wake,1);
   }
  }
 }
}
function canalCenter(z){
 const points=districtRiver();
 const end=points.findIndex(p=>p[1]>=z);
 const [a,b]=[points[end-1],points[end]];
 return lerp(a[0],b[0],(z-a[1])/(b[1]-a[1]));
}
function playDistrictBite(){
 prepareSluiceAudio();
 const volume=Number(localStorage.getItem("returning-waters-volume")??100)/100;
 if(!sluiceAudio||volume<=0)return;
 const now=sluiceAudio.currentTime,tone=sluiceAudio.createOscillator(),gain=sluiceAudio.createGain();
 tone.frequency.setValueAtTime(680,now);
 tone.frequency.exponentialRampToValueAtTime(220,now+.13);
 gain.gain.setValueAtTime(Math.max(.001,.055*volume),now);
 gain.gain.exponentialRampToValueAtTime(.001,now+.17);
 tone.connect(gain).connect(sluiceAudio.destination);
 tone.start(now);tone.stop(now+.19);
}
function sandstoneOutcrop(x,z,radius,height,seed){
 const random=rand(seed);
 const floor=terrainSurface(x,z);
 const sides=28,offset=random()*Math.PI;
 const silhouette=Array.from({length:sides},(_,i)=>.94+.10*Math.sin(i*.47+seed)+random()*.07);
 const tilt=(random()-.5)*radius*.54;
 const profile=[[0,1.26],[.14,1.12],[.24,1.02],[.26,1.10],[.43,.97],
  [.45,.83],[.58,.80],[.60,.89],[.72,.74],[.74,.64],[.90,.60],[.97,.43],[1,.26]];
 const rings=profile.map(([t,spread],level)=>silhouette.map((ridge,i)=>{
  const angle=offset+i*Math.PI*2/sides;
  const width=radius*spread*(ridge+.028*Math.sin(i*.82+level*1.27));
  return [x+Math.cos(angle)*width+tilt*t,
   floor-.7+height*t+Math.sin(i*2.17+seed)*height*.026+Math.sin(angle)*radius*.085,
   z+Math.sin(angle)*width*.76+radius*.17*t];
 }));
 const pale=color("#a87959"),oxide=color("#986245");
 for(let level=1;level<rings.length;level++){
  const tint=mix(pale,oxide,.5+.35*Math.sin(level*1.8));
  for(let i=0;i<sides;i++){
   const j=(i+1)%sides;
   quad(rings[level-1][j],rings[level-1][i],rings[level][i],rings[level][j],
    shade(tint,.92+random()*.16),surface.sandstone);
  }
 }
 const last=rings.at(-1),peak=[x+tilt,floor-.67+height,z+radius*.17];
 for(let i=0;i<sides;i++)triangle(last[(i+1)%sides],last[i],peak,pale,surface.sandstone);
 if(height>1.2)addSurface(x,z,radius*1.2,radius*.93,floor-.7,floor+height,false);
}

function santaCanyonDetails(){
 const random=rand(71229),grass=color("#96804d"),brush=color("#727547");
 for(let i=0;i<810;i++){
  const x=115+random()*98,z=124+random()*69;
  if(roadDist(x,z)<2.8||!fitsTree(x,z,.55))continue;
  const relief=santaCanyonRelief(x,z);
  if(relief>1.5&&random()<.88)continue;
  const y=terrainSurface(x,z),size=.18+random()*.64;
  if(i%11===0){
   sandstoneOutcrop(x,z,size*.82,.72+size*1.38,551+i*311);
  }else if(i%4===0&&scenery){
   appendModel(scenery.boulder,x,y-.07,z,size*.49,i*2.399,surface.rock);
  }else{
   const tint=shade(i%3?grass:brush,.79+random()*.37);
   for(let k=0;k<4;k++)curvedPlantLeaf(x,y-.013,z,i*2.399+k*2.399,size*(.29+random()*.49),
    size*(.28+random()*.22),.012+size*.037,tint,.39);
  }
 }
}

function brunnenRoof(x,z,w,d,eave,ridge){
 const random=rand(Math.round(x*739+z*117));
 const slate=color("#72777a"),metal=color("#465050");
 const run=w*.58,span=d*1.24;
 const rows=Math.ceil(run/.37),cols=Math.ceil(span/.45);
 for(const side of [-1,1])for(let row=0;row<rows;row++){
  const t=row/rows,next=(row+1)/rows;
  const near=x+side*run*t,far=x+side*run*next;
  const high=lerp(ridge,eave,t)+.026,low=lerp(ridge,eave,next)+.066;
  for(let col=0;col<cols;col++){
   const a=z-span*.5+col*span/cols,b=a+span/cols;
   const tint=shade(slate,.80+random()*.37);
   const panel=[[near,high,a+.008],[near,high,b-.008],[far,low,b-.008],[far,low,a+.008]];
   if(side<0)panel.reverse();
   quad(...panel,tint,surface.slate);
  }
 }
 box(x,ridge+.006,z,.16,.13,span+.09,shade(slate,.75),0,surface.slate);
 for(const side of [-1,1]){
  const edge=x+side*(run+.018);
  tube([edge,eave-.046,z-span*.5],[edge,eave-.046,z+span*.5],.062,.062,metal,0,8);
 }
 const chimneyX=x+w*.23,chimneyZ=z+d*.23,base=lerp(ridge,eave,.23/.58);
 box(chimneyX,base-.16,chimneyZ,.44,.96,.53,color("#9c8370"),0,surface.masonry);
 box(chimneyX,base+.72,chimneyZ,.55,.11,.64,metal,0,surface.slate);
}

function brunnenPavedArea(x,z){
 return x>=100&&x<185.5&&z>=92&&z<146&&
  (Math.hypot((x-134)*.72,z-123)<15||(z<108&&x>113)||roadDist(x,z)<4.8);
}

function brunnenStreets(){
 const tint=color("#777976"),grout=color("#5d594d"),random=rand(78891);
 for(let row=0;row<112;row++){
  const z=92+row*.48;
  for(let col=0;col<152;col++){
   const x=100+col*.56+(row%2)*.28;
   if(!brunnenPavedArea(x,z))continue;
   if(!fitsTree(x,z,.25))continue;
   const w=.247+random()*.018,d=.205+random()*.016;
   const point=(a,b,offset)=>[a,terrainSurface(a,b)+offset,b];
   quad(point(x-.281,z-.241,.011),point(x-.281,z+.241,.011),
    point(x+.281,z+.241,.011),point(x+.281,z-.241,.011),grout,2);
   const y=.031+random()*.025;
   const rim=[point(x-w,z-d,y-.018),point(x-w,z+d,y-.018),point(x+w,z+d,y-.018),point(x+w,z-d,y-.018)];
   const top=[point(x-w+.032,z-d+.028,y),point(x-w+.032,z+d-.028,y),
    point(x+w-.032,z+d-.028,y),point(x+w-.032,z-d+.028,y)];
   const tone=shade(tint,.82+random()*.30);
   quad(...top,tone,surface.paving);
   for(let i=0;i<4;i++){const j=(i+1)%4;quad(rim[i],rim[j],top[j],top[i],shade(tone,.87),surface.paving);}
  }
 }
 for(let x=111;x<197;x+=1.35){
  const z=105.75,y=terrainSurface(x,z);
  if(fitsTree(x,z,.30))box(x,y-.06,z,1.27,.14,.23,shade(tint,1.08),0,surface.masonry);
 }
}

function districtLandmarks(wall,roof){
 const region=s.region;
 if(region<2)return;
 const wood=color(region===5?"#4e4537":"#74614a");
 const stone=color(districtArt[region].rock);
 if(region===2||region===3){
  if(region===3){
   houseMesh(152,127,9.5,7.2,4.1,color("#8d785f"),roof,"고원 제재소");
   for(let i=0;i<5;i++){
    const x=153+i*.61,z=132.5,y=terrainSurface(x,z);
    tube([x,y+.24,z],[x+3.4,y+.27,z],.22,.20,wood,surface.wall,10);
   }
  }
  if(region===2){
   santaCanyonDetails();
   const x=116,z=130,y=height(x,z);
   solidBox(x,y,z,3.3,9,3.3,wall,surface.foundation);
   taper(x,y+9,z,2.6,2.3,.04,roof,4);
   for(let i=0;i<9;i++){
    const x=128+i*5,z=128+i%3*6;
    saguaro(x,terrainSurface(x,z),z,2.65+(i%4)*.62,731+i*19);
   }
  }
 }
 if(region===3||region===4){
  if(region===4)beavertonRailBed();
  else{
   const z=110,iron=color("#56585a");
   for(let x=64;x<151;x++){
    const top=terrainSurface(x,z)+.13,next=terrainSurface(x+1,z)+.13;
    box(x,top-.10,z,.23,.11,2.14,wood,0,surface.wall);
    for(const side of [-1,1])tube([x,top,z+side*.62],[x+1,next,z+side*.62],.038,.038,iron,0,5);
   }
  }
  if(region===4){
   houseMesh(218,142,8.6,6.5,3.8,color("#8c806f"),roof,"고개 보급 창고");
   for(let i=0;i<12;i++){
    const x=220+i*7,z=145+i%4*8,y=height(x,z);
    if(scenery)appendModel(scenery.boulder,x,terrainSurface(x,z)-.21,z,2.2+(i%4)*.55,i*1.74,surface.rock);
    else taper(x,y-.18,z,1.2,2.6,.72,stone,6);
   }
  }
 }
 if(region===5||region===6){
  const shoreHomes=region===5?[[108,127],[120,134],[130,120],[150,143],[164,134]]:
   [[108,127],[120,136],[129,121],[151,143],[168,132]];
  for(let i=0;i<5;i++){
   const [x,z]=shoreHomes[i],y=foundationGrade(x,z,5,4.5).top;
   buildingFootprints.push({x,z,w:5.1,d:4.6});
   const plan=buildingVariation(x,z,4.55+i*.23,4.35-i*.12,2.60+i*.17,wall,roof,"수상가옥");
   const {w,d,h}=plan,deck=y+(region===5?1.24:.79)+i*.07;
   for(const dx of [-w*.43,w*.43])for(const dz of [-d*.42,d*.42]){
    const a=x+dx,b=z+dz,ground=terrainSurface(a,b);
    box(a,ground-.20,b,.31,.28,.32,shade(stone,.83),0,surface.foundation);
    box(a,ground+.02,b,.23,deck-ground+.05,.24,wood,0,surface.wall);
    if(region===5)tube([a,ground+.21,b],[x+dx*.22,deck-.12,b],.078,.078,shade(wood,1.16),surface.wall,6);
   }
   solidBox(x,deck,z,w+1.1,.24,d+.95,wood,region===5?101:surface.wall);
   const front=z+(d+.95)*.5,run=2.8;
   const foot=terrainSurface(x,front+run),count=Math.max(5,Math.ceil((deck+.24-foot)/.23));
   for(let step=0;step<count;step++){
    const length=run/count,at=front+(step+.5)*length,top=lerp(deck+.24,foot+.08,(step+1)/count);
    solidBox(x,top-.15,at,1.43,.15,length+.012,wood,surface.wall);
   }
   if(region===5){
    for(const side of [-1,1])tube([x+side*.69,Math.min(foot+.09,deck+.1),front+run],[x+side*.69,deck+.11,front],.08,.08,wood,101,6);
    laidStone(x,foot-.10,front+run+.37,1.62,.17,.74,2350+i);
   }
   box(x,deck+.24,z,w,h,d,plan.wall,0,region===5?104:surface.wall);
   variedRoof(x,deck+.24,z,w,d,h,plan.roof,plan.wall,plan);
   variedFacade(x,deck+.24,z,w,d,h,plan);
   aimBox(region===5?"강변 수상가옥":"연안 어촌 가옥",x,z,w+1.1,d+.95,y,deck+h*1.65);

  }
  if(scenery)for(let i=0;i<4;i++){
   const x=121+i*17,z=147+i%2*11;
   broadleafTree(x,terrainSurface(x,z),z,7.4+i*.47,992+i*67,region===6?"baobab":"cypress");
  }
 }
 if(region===7){
  const x=121,z=130,y=foundationGrade(x,z,7.7,6.0).top;
  const steel=color("#77858a"),frame=color("#4d5c62");
  solidBox(x,y,z,7.7,3.9,6.0,steel,102);
  const footing=foundationGrade(x,z,7.7,6.0);
  box(x,footing.bottom,z,7.88,y-footing.bottom+.16,6.18,color("#7e7e70"),0,surface.foundation);
  for(const side of [-1,1])for(let strip=0;strip<9;strip++){
   const panel=z-2.67+strip*.667,edge=x+side*3.86;
   box(edge,y+.14,panel,.042,3.61,.631,shade(steel,.89+strip%4*.035),0,102);
  }
  mountainLandmarkRoof(x,z,7.7,6,y+3.9,frame,true);
  box(x,y+2.25,z-3.02,4.65,.88,.16,color("#507580"),0,surface.wall);
  for(const side of [-1,1]){
   const edge=z+side*3.03;
   box(x,y+2.04,edge,4.86,.18,.14,frame);
   box(x,y+2.94,edge,4.86,.16,.13,frame);
   box(x,y+2.19,edge,4.7,.74,.065,color("#536d75"),0,32);
   box(x,y+2.08,edge+side*.068,4.89,.12,.21,steel,0,102);
   for(const dx of [-1.55,-.78,0,.78,1.55])box(x+dx,y+2.17,edge+side*.03,.043,.81,.035,wood);
   box(x,y+2.54,edge+side*.03,4.7,.053,.04,wood);
   for(const dx of [-3.52,-2.78,2.78,3.52]){
    box(x+dx,y+.12,edge,.045,3.66,.07,frame,0,102);
    for(let row=0;row<8;row++)rounded(x+dx+.056,y+.29+row*.45,edge+side*.027,.023,.023,.018,frame,0,5);
   }
   box(x,y+.13,edge+side*.027,7.65,.11,.095,frame,0,102);
   for(const dx of [-1.7,-.85,0,.85,1.7])box(x+dx,y+.13,edge,.036,1.87,.052,shade(steel,.82));
  }
  const mastX=x+2.7;
  tube([mastX,y+3.3,z-.8],[mastX,y+9.25,z-.8],.059,.035,color("#555b59"),0,8);
  tube([mastX-.73,y+8.71,z-.8],[mastX+.73,y+8.71,z-.8],.035,.035,color("#555b59"),0,8);
  aimBox("북방 관측소",x,z,8.1,6.3,y,y+7.8);
  for(let i=0;i<7;i++){
   const x=141+i*6,z=151+(i%3)*10,y=height(x,z);
   if(scenery)appendModel(scenery.boulder,x,terrainSurface(x,z)-.18,z,2.2+(i%3)*.64,i*2.17,surface.rock);
   else taper(x,y,z,1.4+i%3*.8,2.6,.24,shade(stone,.92+i%3*.08),5);
  }
 }
}
function districtBridge(art){
 const bridge=watershedDistrictBridge(s.region);
 if(!bridge)return;
 const {left,right,z,width}=bridge;
 const material=color(geographySurfaces[s.region][1]),top=x=>lerp(terrainSurface(left,z),terrainSurface(right,z),(x-left)/(right-left))+.18;
 const center=(left+right)*.5;
 addSurface(center,z,right-left,width,Math.min(top(left),top(right))-.32,top);
 for(const side of [-1,1]){
  const edge=z+side*(width*.5-.24);
  addSurface(center,edge,right-left,.30,Math.min(top(left),top(right)),x=>top(x)+.85,false);
  for(let x=left+1;x<right;x+=3.6)box(x,top(x),edge,.39,.87,.41,material,0,surface.foundation);
  tube([left,top(left)+.83,edge],[right,top(right)+.83,edge],.12,.12,shade(material,.83),0,5);
 }
 for(let x=left;x<right;x+=1.7){
  const a=top(x),b=top(Math.min(x+1.7,right)),end=Math.min(x+1.7,right);
  quad([x,a,z-width*.5],[x,a,z+width*.5],[end,b,z+width*.5],[end,b,z-width*.5],shade(material,.86+(x%3)*.041),surface.foundation);
 }
 for(let x=left+10;x<right-6;x+=12){
  const y=terrainSurface(x,z);
  box(x,y,z,1.95,top(x)-y,width-.25,shade(material,.75),0,surface.foundation);
 }
 aimBox(s.region===1?"아르벤 석교":"물길 다리",center,z,right-left,width,Math.min(top(left),top(right))-.35,Math.max(top(left),top(right))+.2);
}

function brunnenDistrict(wall,roof){
 const pale=color("#c5b89d"), iron=color("#414b51"), timber=color("#71503a");
 const stationZ=108;
 for(let i=0;i<7;i++){
  const x=105+i*4.2,y=terrainSurface(x,stationZ);
  solidBox(x,y-.12,stationZ,.57,3.9,.63,pale,surface.foundation);
  box(x,y-.04,stationZ,.83,.33,.87,shade(pale,.88),0,surface.foundation);
  box(x,y+2.06,stationZ,.77,.19,.78,pale,0,surface.foundation);
  if(i===6)continue;
  const arch=(a,r,z)=>[x+2.1+Math.cos(a)*r,y+2.1+Math.sin(a)*r,z];
  for(let j=0;j<12;j++){
   const a=j*Math.PI/12,b=(j+1)*Math.PI/12;
   const face=stationZ+.34,back=stationZ-.34,tint=shade(pale,.83+(j%3)*.075);
   quad(arch(a,1.69,face),arch(b,1.69,face),arch(b,2.12,face),arch(a,2.12,face),tint,surface.foundation);
   quad(arch(a,1.69,back),arch(b,1.69,back),arch(b,1.69,face),arch(a,1.69,face),shade(tint,.8),surface.foundation);
  }
  box(x+2.1,y+4.19,stationZ,4.25,.18,1.42,roof,0,surface.roof);
 }
 const tx=151,tz=132,y=terrainSurface(tx,tz);
 solidBox(tx,y,tz,4.8,14,4.8,wall,surface.masonry);
 taper(tx,y+14,tz,4.7,3.45,.03,iron,4);
 for(const z of [tz-2.43,tz+2.43])box(tx,y+11.05,z,1.17,1.95,.14,iron);
 aimBox("종탑",tx,tz,5,5,y,y+18.7);
 for(let i=0;i<5;i++){
  const x=116+i*4.7,z=130+(i%2)*5,y=terrainSurface(x,z);
  const canvas=color(["#ad654d","#78877b","#ba975b","#476e73","#8e4b42"][i]);
  if(cityScanModels){
   for(const dx of [-.88,0,.88])cityScan("crate",x+dx,y,z,.87,.89,1.50);
   addSurface(x,z,2.7,1.57,y,y+.89);
  }else solidBox(x,y,z,2.7,.89,1.57,timber,surface.wall);
  for(const dx of [-1.32,1.32])for(const dz of [-.72,.72])taper(x+dx,y,z+dz,2.73,.065,.065,timber,5);
  for(let j=0;j<8;j++){
   const a=x-1.64+j*.41,b=a+.41, cloth=j%2?canvas:shade(canvas,1.36);
   const canopy=[[a,y+2.78,z-1.08],[b,y+2.78,z-1.08],[b,y+2.47,z+1.17],[a,y+2.47,z+1.17]];
   if(cityScanModels)cityCloth(canopy,cloth);else quad(...canopy,cloth);
   box((a+b)*.5,y+2.30,z+1.16,.39,.17,.035,cloth);
  }
  for(let j=0;j<3;j++)if(!cityScan("crate",x-.88+j*.74,y+.93,z,.57,.26,.44,j*.13))
   box(x-.88+j*.74,y+.93,z,.57,.26,.44,shade(timber,.85+j*.15));
  if(i===0||i===3){
   addAsagiProp("oak-barrel",x+1.72,terrainSurface(x+1.72,z-.32)-.022,z-.32,.63,.81,.63,i*.2,0,"market");
   addAsagiProp("grain-sack",x-1.70,terrainSurface(x-1.70,z-.33)-.025,z-.33,.53,.59,.42,i*.3,0,"market");
   addAsagiProp("oil-lantern",x+1.29,y+1.83,z+.92,.25,.43,.22,0,0,"market");
  }
  if(i===1)addAsagiProp("onggi-jar",x+.16,y+.90,z+.49,.33,.43,.33,.34,0,"market");
  if(i===2)addAsagiProp("handcart",x,terrainSurface(x,z-2.4)-.03,z-2.4,1.06,.83,1.67,Math.PI*.48,0,"market");
  aimBox("운하 시장 가판대",x,z,3.23,2.14,y,y+2.8);
 }
 for(const z of [247,256,264]){
  const x=canalCenter(z)+6;
  if(cityScan("boat",x,1.99,z,2.24,1.22,6.08,z===256?Math.PI:0)){
   cityScan("crate",x,2.57,z+.45,.68,.46,.68,.14);
   aimBox("운하 화물선",x,z,2.3,6.1,2.1,4.6);
   continue;
  }
  const hull=[[x,2.47,z-3.04],[x-1.12,2.47,z-1.78],[x-1.11,2.47,z+1.94],[x-.58,2.47,z+2.84],
              [x+.63,2.47,z+2.84],[x+1.12,2.47,z+1.94],[x+1.12,2.47,z-1.78]];
  hull.forEach((a,i)=>{
   const b=hull[(i+1)%hull.length];
   const bottom=p=>[lerp(p[0],x,.22),2.08,lerp(p[2],z,.15)];
   quad(a,b,bottom(b),bottom(a),shade(timber,.81+(i%3)*.12),surface.wall);
   triangle(a,b,[x,2.47,z],shade(timber,.92),surface.wall);
  });
  box(x,2.58,z+.25,1.6,.42,2.1,color("#a88e66"));
  taper(x,2.44,z-.72,2.12,.064,.043,timber,6);
  box(x,2.50,z+1.72,1.15,.08,.25,shade(timber,1.12),0,surface.wall);
  aimBox("운하 화물선",x,z,2.3,6.1,2.1,4.6);
 }
 buildBrunnenQuay();
 for(let i=0;i<5;i++){
  const z=216+i*8,x=canalCenter(z)+29;
  houseMesh(x,z,6.5,6.15,4.8+i%3*.61,shade(wall,.93+i*.038),roof,"운하 상가");
  const shore=canalCenter(z)+17,y=brunnenLowerQuay(z);
  const dye=color(["#a45136","#416b68","#b89851","#7e594a","#c58247"][i]);
  if(cityScanModels){
   for(const dz of [-.83,0,.83])cityScan("crate",shore+2,y+.20,z+dz,1.2,.80,.82,Math.PI*.5);
  }else box(shore+2.0,y+.20,z,1.2,.80,2.55,timber,0,surface.wall);
  for(const dz of [-1.42,1.42])taper(shore+1.62,y+.16,z+dz,2.78,.062,.059,timber,6);
  for(let j=0;j<7;j++){
   const a=z-1.52+j*.435,b=a+.434;
   const canopy=[[shore+.98,y+2.69,a],[shore+3.19,y+3.14,a],[shore+3.19,y+3.14,b],[shore+.98,y+2.69,b]];
   const cloth=j%2?shade(dye,1.28):dye;
   if(cityScanModels)cityCloth(canopy,cloth);else quad(...canopy,cloth);
  }
  for(let j=0;j<3;j++)if(!cityScan("crate",shore+2.15,y+1.05,z-1+j*.69,.43,.15,.55,j*.14))
   box(shore+2.15,y+1.05,z-1+j*.69,.43,.15,.55,shade(timber,.75+j*.13));
  aimBox("운하 시장",shore+2,z,2.2,3.08,y,y+3.2);
 }
}
function brunnenMasonry(x,y,z,w,d,h,wall,style=-1){
 const pale=shade(wall,1.08),trim=shade(wall,.75),glass=color("#324645");
 const random=rand(Math.round(x*523+z*1127));
 const door=cap(w*.17,1.16,2.05);
 for(const sign of [-1,1]){
  const face=z+sign*(d*.5+.012);
  const at=(xx,yy,depth)=>[xx,yy,face+sign*depth];
  const block=(xx,yy,width,height,depth,tint)=>{
   const edge=Math.min(.055,width*.15,height*.19);
   const corners=(inset,projection)=>[
    at(xx-width*.5+inset,yy+inset,projection),at(xx+width*.5-inset,yy+inset,projection),
    at(xx+width*.5-inset,yy+height-inset,projection),at(xx-width*.5+inset,yy+height-inset,projection)
   ];
   const rear=corners(0,0),front=corners(edge,depth);
   const panel=(a,b,c,d)=>sign>0?quad(a,b,c,d,tint,surface.masonry):quad(d,c,b,a,tint,surface.masonry);
   panel(...front);
   for(let i=0;i<4;i++){const j=(i+1)%4;panel(rear[i],rear[j],front[j],front[i]);}
  };
  for(let yy=.31,row=0;yy<h+.16;row++){
   const course=Math.min(h+.16-yy,.35+random()*.16);
   for(let left=-w*.5;left<w*.5-.08;){
    const width=Math.min(w*.5-left,.45+random()*.65);
    const center=left+width*.5;
    if(!(sign===1&&Math.abs(center)<door*.5+width*.53&&yy<2.77)){
     block(x+center,y+yy,width-.028,course-.023,.036+random()*.068,shade(wall,.82+random()*.34));
    }
    left+=width;
   }
   yy+=course;
  }
  const openings=style<0?[-.31,.31]:[[-.34,.28],[-.35,.20,.38],[-.28,.34],[-.36,.31]][style];
  for(const off of openings){
   const xx=x+w*off,yy=y+h*(style===2?.51:.45),half=w*(style===1?.046:.068),top=yy+h*(style===3?.23:.19);
   box(xx,yy,face+sign*.108,half*2,top-yy,.05,glass,0,32);
   for(const post of [-1,1])block(xx+post*(half+.069),yy-.05,.125,top-yy+.08,.17,trim);
   const arch=(a,r)=>at(xx+Math.cos(a)*r,top+Math.sin(a)*r,.155);
   for(let j=0;j<9;j++){
    const a=j*Math.PI/9,b=(j+1)*Math.PI/9;
    const corners=[arch(a,half),arch(a,half+.13),arch(b,half+.13),arch(b,half)];
    if(sign<0)corners.reverse();
    quad(...corners,shade(pale,.88+random()*.24),surface.masonry);
    triangle(at(xx,top,.11),arch(a,half),arch(b,half),glass);
   }
   box(xx,yy-.12,face+sign*.14,half*2+.27,.11,.27,pale,0,surface.masonry);
   for(const bar of [-.33,.33])box(xx+half*bar,yy+.04,face+sign*.15,.036,top-yy,.035,trim);
   for(const bar of [.31,.64])box(xx,lerp(yy,top,bar),face+sign*.153,half*2,.042,.037,trim);
  }
 }
}
