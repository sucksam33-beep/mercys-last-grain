"use strict";

// Coordinates and elevations are game metres. Ranges recede across the east-facing view.
const terrainProfiles=[
 {bands:[[0,"#4c6c40"],[18,"#64784a"],[44,"#45634a"],[96,"#677b70"],[190,"#a1a59b"]],
  rock:"#777b63",ranges:[[662,86,85,55,410,1],[910,130,143,240,510,4],[1330,215,231,-60,715,7],[1780,200,258,410,840,3]]},
 {bands:[[0,"#607653"],[14,"#87905a"],[32,"#768a66"],[70,"#78918b"],[155,"#9eaead"]],
  rock:"#988f74",ranges:[[710,138,41,30,330,4],[1000,200,72,470,510,6],[1420,230,119,100,670,2],[1820,230,148,330,870,1]]},
 {bands:[[0,"#ac8351"],[18,"#bd8a4d"],[36,"#af6541"],[65,"#965238"],[132,"#b9805a"],[218,"#c7906e"]],
  rock:"#aa6041",ranges:[[673,86,69,100,355,5],[936,121,112,405,510,2],[1320,204,166,135,710,8],[1750,240,216,305,850,3]]},
 {bands:[[0,"#778150"],[28,"#5c7847"],[63,"#56754f"],[101,"#8b7758"],[156,"#7a8d83"],[240,"#a0aba1"]],
  rock:"#9d654d",ranges:[[700,126,55,280,375,2],[970,150,125,-50,550,9],[1330,195,189,300,650,4],[1780,220,247,80,850,7]]},
 {bands:[[0,"#5d7d6a"],[32,"#58786c"],[76,"#627e7a"],[130,"#738b92"],[224,"#9bafb6"],[305,"#dce5e4"]],
  rock:"#899d9b",ranges:[[733,96,107,-160,303,3],[996,139,163,337,400,6],[1330,169,262,25,650,9],[1760,237,322,375,820,4]]},
 {bands:[[0,"#58755c"],[10,"#729064"],[27,"#678675"],[65,"#79979a"],[130,"#9eb5b7"]],
  rock:"#819587",ranges:[[747,145,32,-160,330,5],[1030,170,69,155,570,2],[1450,221,115,-50,620,4],[1770,205,146,350,760,7]]},
 {bands:[[0,"#cbb383"],[7,"#a4a06c"],[22,"#7d8961"],[70,"#718d7f"],[150,"#94abb1"]],
  rock:"#baab86",ranges:[[980,138,54,-210,280,3],[1290,190,96,310,375,1],[1640,205,148,-10,575,7],[1920,210,181,485,620,5]]},
 {bands:[[0,"#6e8378"],[35,"#7b9190"],[81,"#8d9d9e"],[132,"#a7b9bc"],[205,"#d4dce0"],[295,"#edf0f2"]],
  rock:"#829ca6",ranges:[[736,99,92,525,290,6],[1080,157,174,-160,420,2],[1410,189,262,340,560,7],[1780,236,342,70,760,9]]}
];
function terrainEase(a,b,v){
 const t=Math.max(0,Math.min(1,(v-a)/(b-a)));
 return t*t*(3-2*t);
}
const landBell=(v,center,width)=>Math.exp(-(((v-center)/width)**2));
function coastExposure(region,x,z){
 if(region===5)return terrainEase(360,525,z+.24*(x-395)+16*Math.sin(x*.023));
 if(region===6)return terrainEase(554,628,x+17*Math.sin(z*.013)+(z-190)*.12);
 if(region===7)return terrainEase(545,676,x+.10*(z-145)+16*Math.sin(z*.012));
 return 0;
}
// The plateau pool and the glacial inlet sit outside the built-up districts.
function wildlifeWaterTerrain(region,x,z,ground){
 if(region!==3&&region!==7)return ground;
 const distance=region===3?Math.hypot((x-531)/29,(z-343)/36):
  Math.hypot(Math.max(0,639-x)/55,(z-322)/50);
 if(distance>=1.66)return ground;
 const bank=lerp(-.8,4.1,terrainEase(.56,1.17,distance));
 const shelf=region===7&&bank<2.10?Math.max(bank,lerp(.54,1.80,terrainEase(.53,.83,distance))):bank;
 return Math.min(ground,lerp(shelf,ground,terrainEase(1.02,1.66,distance)));
}
function ridgeRelief(profile,x,z){
 let relief=0;
 for(const [crest,width,rise,center,span,seed] of profile.ranges){
  const bend=crest+width*(.34*Math.sin(z*.008+seed)+.17*Math.sin(z*.019+seed*2));
  if(Math.abs(x-bend)>width*2.6||Math.abs(z-center)>span*2.4)continue;
  const folds=.67+.21*Math.sin(z*.013+seed)+.11*Math.cos(z*.032+seed*3);
  const creases=Math.abs(Math.sin(z*.034-x*.018+seed));
  const footprint=landBell(x,bend,width)*landBell(z,center,span);
  if(profile===terrainProfiles[2]){
   const shelf=.48*terrainEase(.15,.41,footprint)+.32*terrainEase(.47,.58,footprint)+.20*terrainEase(.64,.73,footprint);
   relief+=rise*shelf*(.85+.14*folds);
  }else{
   const shoulder=terrainEase(.40,.82,footprint);
   const ribs=Math.sin(z*.061+seed)*.065+Math.sin(z*.111+seed*1.4)*.031;
   relief+=rise*footprint*(folds+.18*creases+shoulder*ribs);
  }
 }
 return relief;
}
function canyonBank(x,z,wooded){
 const center=wooded?158+.31*(x-150)+3.2*Math.sin((x-142)*.107)
  :150+.24*(x-151)+3.3*Math.sin((x-145)*.103);
 return z-center;
}

function layeredCanyonRelief(x,z,wooded){
 if(x<113||x>224||z<120||z>190)return 0;
 const d=canyonBank(x,z,wooded)+.85*Math.sin(x*.28+z*.13)+.32*Math.sin(x*.71-z*.09);
 const span=terrainEase(114,144,x)*(1-terrainEase(179,223,x));
 const ribs=.45*Math.sin(x*.22)+.25*Math.cos(x*.48+1.8);
 const face=terrainEase(-9,-3.5,d)*1.9+terrainEase(-3.9,-1.4,d+ribs)*2.8+terrainEase(-.8,3.7,d-ribs)*2.0;
 const crest=1-terrainEase(9,27,d+.9*Math.sin(x*.11));
 const gullies=.88+.07*Math.sin(x*.34+z*.061)+.047*Math.sin(x*.81+z*.27);
 return face*span*crest*gullies*(wooded?1.10:1.21)*terrainEase(3.5,9,roadDist(x,z));
}

function santaCanyonRelief(x,z){return layeredCanyonRelief(x,z,false)}

function canyonTint(region,x,y,z,up,tint){
 const wooded=region===3;
 const relief=layeredCanyonRelief(x,z,wooded);
 if(relief<.04)return tint;
 const d=canyonBank(x,z,wooded);
 const exposure=(1-terrainEase(.63,.94,up))*.83;
 const apron=terrainEase(-8,-2,d)*(1-terrainEase(6,12,d))*.30;
 const weather=Math.sin(x*.47+z*.24)*.025;
 const rock=wooded?[.55,.29,.19]:[.70,.38,.23];
 const layer=y+.18*Math.sin(x*.10)+.14*Math.cos(z*.12);
 const strata=.91+.09*Math.sin(layer*3.8)+.06*Math.sin(layer*8.4)+weather;
 return mix(tint,shade(rock,strata),terrainEase(.05,1.55,relief)*Math.min(.91,exposure+apron));
}

function regionalLand(region,x,z){
 const wave=Math.sin(x*.024+z*.011)*1.35+Math.cos(z*.035-x*.007)*.95;
 const rolling=Math.sin(x*.012-z*.009)*Math.cos(z*.014+x*.003);
 const profile=terrainProfiles[region];
 let land;
 switch(region){
  case 0:{
   const west=25*landBell(x,73,86)*landBell(z,122,128);
   const north=29*landBell(z,-78,122)*landBell(x,254,246);
   const south=36*landBell(z,480,112)*landBell(x,152,245);
   land=5+west+north+south+wave+ridgeRelief(profile,x,z);
   break;
  }
  case 1:
   land=5.7+wave*.55+3.2*rolling+15*landBell(z,-76,122)*landBell(x,232,228)+8*landBell(z,433,94)*landBell(x,275,190);
   break;
  case 2:{
   const slope=x+.29*(z-150)+14*Math.sin(z*.021);
   const mesas=12*(1-terrainEase(230,266,slope))+10*(1-terrainEase(316,339,slope));
   land=8+mesas+wave*.68+19*landBell(z,-87,140)*landBell(x,340,215)+santaCanyonRelief(x,z);
   break;
  }
  case 3:{
   const shelf=x+.30*(z-130)+12*Math.sin(z*.018);
   land=9+39*(1-terrainEase(113,350,shelf))+20*(1-terrainEase(244,410,shelf))
    +8*landBell(z,354,122)*landBell(x,225,218)+wave+rolling*2.5+layeredCanyonRelief(x,z,true);
   break;
  }
  case 4:
   land=7+47*(1-terrainEase(111,385,x+.20*(z-126)))+wave+5*rolling
    +30*landBell(z,-54,105)*landBell(x,283,198)+21*landBell(z,382,125)*landBell(x,318,220);
   break;
  case 5:
   land=3.55+wave*.22+rolling*.46+3.5*landBell(z,49,103)*landBell(x,228,230)
    +10*landBell(z,-86,118)*landBell(x,300,260);
   land=lerp(land,-3,coastExposure(region,x,z));
   break;
  case 6:{
   land=5.7+wave*.32+6.4*landBell(x,236,125)*landBell(z,231,140)+4.5*landBell(x,495,112)*landBell(z,80,106);
   land=lerp(land,-6,coastExposure(region,x,z));
   break;
  }
  case 7:{
   const shelf=x+.23*(z-135)+17*Math.sin(z*.014);
   land=7+72*(1-terrainEase(135,414,shelf))+17*(1-terrainEase(303,494,shelf))
    +13*landBell(z,-85,126)*landBell(x,265,246)+wave+rolling*3;
   land=lerp(land,-5,coastExposure(region,x,z));
   break;
  }
 }
 if(region===0)return land;
 // Blend into the original landing elevation around the interactive fishing deck.
 const deck=landBell(x,489,32)*landBell(z,271,20);
 land=lerp(land,4.5,deck*.9);
 return land+ridgeRelief(profile,x,z);
}
function topographicPainter(region){
 const profile=terrainProfiles[region];
 const bands=profile.bands.map(([y,hex])=>[y,color(hex)]);
 const rock=color(profile.rock);
 return (x,y,z,up)=>{
  const variation=2.2*Math.sin(x*.043+z*.034)+2.8*Math.sin(z*.017-x*.021);
  const h=y+variation;
  let tint=bands[0][1];
  for(let i=1;i<bands.length;i++){
   const [low,from]=bands[i-1],[high,to]=bands[i];
   if(h<low)break;
   tint=mix(from,to,terrainEase(low,high,h));
  }
  const dry=region===2||region===3;
  const layers=dry?.85+.20*Math.sin(y*.48+x*.013)+.085*Math.sin(y*1.36+z*.017):.89+.12*Math.sin(y*.16+z*.024);
  const exposed=(1-terrainEase(.46,.97,up))*(dry?.90:.68);
  const wooded=woodlandCover(region,x,z)*(1-terrainEase(69,129,y))*terrainEase(.45,.8,up);
  return shade(mix(tint,shade(rock,layers),exposed),.95-.23*wooded+.10*Math.sin(x*.036-z*.032)*Math.cos(z*.023));
 };
}
function woodlandCover(region,x,z){
 if(region===3)return juniperStandCover(x,z);
 const profile=regionalWoodlands[region];
 const bendX=x+7*Math.sin(z*.043+region),bendZ=z+6*Math.sin(x*.036-region);
 let cover=0;
 for(const [cx,cz,rx,rz,strength] of profile.groves){
  const distance=((bendX-cx)/rx)**2+((bendZ-cz)/rz)**2;
  cover=Math.max(cover,strength*(1-terrainEase(.25,1.24,distance)));
 }
 const [cx,cz,rx,rz]=profile.clearing;
 const distance=((x-cx)/rx)**2+((z-cz)/rz)**2;
 return cover*terrainEase(.61,1.22,distance);
}
// Groves follow each landscape: terraces, field edges, dry washes, basin slopes,
// floodplain channels, sheltered coast, and the lee side of the tundra.
const regionalWoodlands=[
 {groves:[[121,164,31,20,1],[167,223,54,38,.91],[299,148,71,40,.89],[347,273,37,62,.9],[574,168,83,78,.95],[632,291,77,85,.95]],
  clearing:[212,166,67,24],plant:"pine",samples:1840,spacing:4.7,height:10,soil:"#574c36",stone:"#777866",near:[138,146,145,139]},
 {groves:[[182,192,54,21,.96],[235,139,41,19,.93],[252,221,53,18,.98],[241,249,76,26,.87],[274,92,53,40,.93],[363,280,47,49,.84],[531,104,67,36,.9],[612,290,83,46,.82]],
  clearing:[268,172,70,35],plant:"oak",samples:2550,spacing:5.7,height:8,soil:"#63533b",stone:"#8a8370",near:[223,173,214,165]},
 {groves:[[158,186,41,16,.76],[253,105,74,17,.67],[334,254,60,19,.66],[474,213,38,60,.67],[590,293,51,19,.62]],
  clearing:[222,160,64,34],plant:"saguaro",samples:720,spacing:7.6,height:6.2,soil:"#906643",stone:"#9b7154",near:[167,180,163,170]},
 null,
 {groves:[[184,144,32,26,.96],[207,204,59,35,.92],[300,95,86,32,.95],[297,289,70,53,.9],[522,180,53,89,.98],[606,277,71,68,.91]],
  clearing:[251,156,63,33],plant:"pine",samples:2640,spacing:4.5,height:11,soil:"#514c43",stone:"#848481",near:[184,150,192,140]},
 {groves:[[189,180,47,24,.91],[240,252,69,20,.87],[361,157,30,65,.91],[405,295,40,40,.98],[526,219,46,58,.95],[607,306,60,36,.88]],
  clearing:[262,157,73,29],plant:"cypress",samples:2470,spacing:5.8,height:9.6,soil:"#514b38",stone:"#82877b",near:[190,171,198,165]},
 {groves:[[156,173,45,24,.82],[249,208,61,35,.86],[366,239,73,38,.90],[484,230,39,49,.89],[524,281,38,29,.94],[548,217,22,17,.83]],
  clearing:[565,256,47,35],plant:"baobab",samples:1820,spacing:7.8,height:8.2,soil:"#877250",stone:"#aea084",near:[547,236,551,244]},
 {groves:[[161,183,30,25,.77],[259,215,43,33,.78],[344,287,51,39,.82],[439,153,28,42,.70],[528,191,38,26,.71]],
  clearing:[236,148,66,38],plant:"pine",samples:1650,spacing:7,height:6.2,soil:"#625e4e",stone:"#8b9697",near:[170,174,165,163]}
];
const juniperGroves=[
 [117,193,44,30,.98],[181,238,52,31,.96],[257,228,38,29,.83],
 [286,113,57,34,.93],[340,286,57,38,.97],[176,345,74,47,.88],
 [555,72,62,79,.96],[584,181,61,37,.94],[613,274,67,51,.93],
 [550,375,78,49,.96],[733,206,82,69,.86],[684,330,67,44,.87]
];
function juniperStandCover(x,z){
 const bendX=x+8*Math.sin(z*.042),bendZ=z+7*Math.sin(x*.039);
 let cover=0;
 for(const [cx,cz,rx,rz,density] of juniperGroves){
  const distance=((bendX-cx)/rx)**2+((bendZ-cz)/rz)**2;
  cover=Math.max(cover,density*(1-terrainEase(.38,1.20,distance)));
 }
 const meadow=((x-207)/60)**2+((z-170)/29)**2;
 return cover*terrainEase(.67,1.25,meadow);
}

function woodlandContactPatch(x,z,radius,tint,seed){
 const random=rand(seed),count=11;
 const ring=Array.from({length:count},(_,i)=>{
  const angle=i*2*Math.PI/count;
  const reach=radius*(.73+random()*.39);
  return [x+Math.cos(angle)*reach,z+Math.sin(angle)*reach];
 });
 const emit=(px,pz,coverage,paint)=>{
  const d=.22,normal=unit([terrainSurface(px-d,pz)-terrainSurface(px+d,pz),2*d,
   terrainSurface(px,pz-d)-terrainSurface(px,pz+d)]);
  verts.push(px,terrainSurface(px,pz)+.032,pz,...normal,...paint,82+coverage*.39);
 };
 for(let i=0;i<count;i++){
  const a=ring[i],b=ring[(i+1)%count];
  const mid=p=>[lerp(x,p[0],.46),lerp(z,p[1],.46)];
  const c=mid(a),d=mid(b);
  emit(x,z,.88,shade(tint,.75));emit(...c,.53,tint);emit(...d,.53,tint);
  emit(...c,.53,tint);emit(...a,0,shade(tint,1.22));emit(...b,0,shade(tint,1.22));
  emit(...c,.53,tint);emit(...b,0,shade(tint,1.22));emit(...d,.53,tint);
 }
}

function woodlandTreeFooting(x,z,trunk){
 if(x<38||x>641||z<55||z>411||roadDist(x,z)<6||terrainSurface(x,z)<2.28)return;
 const profile=regionalWoodlands[s.region];
 const seed=Math.round(x*431+z*233),random=rand(seed);
 const spread=cap(trunk*(s.region===6?2.55:3.35),.62,s.region===6?2.25:1.86);
 woodlandContactPatch(x,z,spread*1.52,color(profile?.soil||"#574737"),seed);
 if(s.region===2)return;
 const near=x<345||roadDist(x,z)<24;
 for(let i=0;i<(near?5:3);i++){
  const a=i*2.399+random()*.57,reach=spread*(.63+random()*.48);
  const dx=Math.cos(a),dz=Math.sin(a);
  const node=(t,r,lift,turn=0)=>{
   const px=x+dx*reach*t-dz*turn,pz=z+dz*reach*t+dx*turn;
   return [px,terrainSurface(px,pz)+lift,pz,r];
  };
  const root=trunk*(.25+random()*.15);
  pineLimb([node(.09,root,trunk*.39),node(.38,root*.70,root*.40,root*.60),
   node(.71,root*.34,root*.15,-root*.37),node(1,.005,-.06)],seed+i);
 }
}

function woodlandRock(x,z,radius,angle){
 if(roadVergeDistance(s.region,x,z)<3.8+radius*.65)return;
 const y=terrainSurface(x,z),seed=Math.round(x*113+z*181),random=rand(seed);
 const profile=regionalWoodlands[s.region],stone=color(profile?.stone||"#796b59");
 let bottom=y;
 for(let i=0;i<7;i++){
  const a=i*2*Math.PI/7;
  bottom=Math.min(bottom,terrainSurface(x+Math.cos(a)*radius*.51,z+Math.sin(a)*radius*.51));
 }
 woodlandContactPatch(x,z,radius*1.12,color(profile?.soil||"#5c4a39"),seed);
 if(scenery)appendModel(scenery.boulder,x,Math.min(y-radius*.12,bottom+radius*.13),z,radius,angle,surface.rock);
 else quarryStone(x,bottom-radius*.13,z,radius*1.32,radius*.84,radius*1.45,color("#78695c"),seed);
 for(let i=0;i<5;i++){
  const a=angle+i*2.399,distance=radius*(.57+random()*.48);
  const px=x+Math.cos(a)*distance,pz=z+Math.sin(a)*distance,scale=radius*(.08+random()*.08);
  if(roadDist(px,pz)<4.5)continue;
  taper(px,terrainSurface(px,pz)-scale*.12,pz,scale*.64,scale*.75,scale*.24,
   shade(stone,.73+random()*.24),5);
 }
}

function appendWoodland(region){
 const profile=regionalWoodlands[region];
 const random=rand(9189+region*141),tint=color(r().tree);
 const spacing=new Set();
 const spacingSize=profile?.spacing??3.6;
 for(let i=0;i<(profile?.samples??2120);i++){
  const x=52+random()*717,z=-75+random()*480;
  const density=woodlandCover(region,x,z);
  if(random()>density*.94||roadDist(x,z)<12||riverDist(x,z)<channelWidth(z)+5||
     spots.some(p=>Math.hypot(x-p.x,z-p.y)<30))continue;
  const y=terrainSurface(x,z);
  if(y<2.65||y>(region===7?96:113))continue;
  const cell=Math.floor(x/spacingSize)+":"+Math.floor(z/spacingSize);
  if(spacing.has(cell))continue;
  spacing.add(cell);
  const age=random();
  const h=2.1+Math.pow(age,1.37)*(profile?.height??14),seed=40000+i;
  queueWoodlandPlant(x,y,z,h,seed,profile?.plant??"pine",tint,false,random);
 }
 if(region===3){
  for(const [x,z,size,angle] of [[149.4,177.5,2.75,1.2],[153.4,180.7,1.6,2.1],[162,192,1.5,2.6],[207,204,1.65,.4],[279,220,2.5,2.2]]){
   if(roadDist(x,z)>6&&fitsTree(x,z,size))woodlandRock(x,z,size,angle);
  }
  for(const [x,z,h,seed] of [[151,174,9.2,43261],[150,188,7.9,43264],[154,190,3.7,43267],[163,177,4.6,43271]]){
   if(roadDist(x,z)>7)pine(x,terrainSurface(x,z),z,h,tint,seed,true);
  }
 }else{
  const [x,z,rockX,rockZ]=profile.near,seed=42780+region*73;
  if(roadDist(x,z)>7&&terrainSurface(x,z)>2.65)
   queueWoodlandPlant(x,terrainSurface(x,z),z,profile.height*.68,seed,profile.plant,tint,true,random);
  for(const [px,pz,size,angle] of [[rockX,rockZ,region===2?3.2:2.25,1.2],[rockX+1.45,rockZ+2.7,1.06,2.1]]){
   if(roadDist(px,pz)>5&&terrainSurface(px,pz)>2.28&&fitsTree(px,pz,size))woodlandRock(px,pz,size,angle);
  }
 }
}
function queueWoodlandPlant(x,y,z,h,seed,plant,tint,detailed,random){
 if(plant==="pine"){
  pine(x,y,z,h,shade(tint,.84+random()*.26),seed,detailed);
  return;
 }
 queueTree(x,z,h*.30+.5,h*(plant==="baobab"?.11:.045),()=>{
  if(plant==="saguaro")saguaro(x,y,z,h,seed);
  else if(scenery)broadleafTree(x,y,z,h,seed,plant);
  else paintPine(x,y,z,h,tint,seed,false);
 });
}
function appendTerrainHorizon(grid,points,paint){
 const {columns,rows}=grid;
 const boundary=[];
 for(let c=0;c<columns;c++)boundary.push(points[c]);
 for(let r=1;r<rows;r++)boundary.push(points[r*columns+columns-1]);
 for(let c=columns-2;c>=0;c--)boundary.push(points[(rows-1)*columns+c]);
 for(let r=rows-2;r>0;r--)boundary.push(points[r*columns]);
 const cx=grid.x+(columns-1)*grid.step*.5,cz=grid.z+(rows-1)*grid.step*.5;
 let prior=boundary;
 for(let ring=1;ring<=24;ring++){
  const scale=1+ring*.092;
  const next=boundary.map(({position:[bx,,bz]})=>{
   const x=cx+(bx-cx)*scale,z=cz+(bz-cz)*scale,y=height(x,z),d=7;
   const normal=unit([height(x-d,z)-height(x+d,z),2*d,height(x,z-d)-height(x,z+d)]);
   return {position:[x,y,z],normal,tint:silhouetteSlopeTint(s.region,x,z,y,normal[1],paint(x,y,z,normal[1]))};
  });
  for(let i=0;i<prior.length;i++){
   const j=(i+1)%prior.length;
   for(const {position,normal,tint} of [prior[i],next[i],next[j],prior[i],next[j],prior[j]]){
    verts.push(...position,...normal,...tint,2);
   }
  }
  prior=next;
 }
}
function appendCoastalWater(region,tint){
 if(![5,6,7].includes(region))return;
 const startX=region===5?245:506,startZ=region===5?310:-970,y=2.115;
 quad([startX,y,startZ],[startX,y,1440],[2070,y,1440],[2070,y,startZ],tint,1);
}
function recoverCoastalPosition(){
 if(supportAt(player.x,player.y)!==null)return;
 const origin=player;
 for(let radius=4;radius<=144;radius+=4){
  for(let i=0;i<24;i++){
   const angle=i*Math.PI/12;
   const x=cap(origin.x+Math.cos(angle)*radius,4,636),z=cap(origin.y+Math.sin(angle)*radius,12,412);
   const ground=terrainSurface(x,z);
   if(ground<1.58||supportAt(x,z,ground)===null)continue;
   player={x,y:z};
   return;
  }
 }
 player={...startPosition};
}
