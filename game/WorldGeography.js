"use strict";
// Coordinates are district-local. The existing save, quest and station anchors use this grid.
const districtWaterways=[
 null,
 [[478,-30],[478,38],[466,82],[449,126],[431,167],[429,202],[457,245],[474,268],[459,319],[462,369],[455,460]],
 [[529,-30],[529,38],[482,87],[493,134],[432,180],[429,202],[451,245],[474,268],[458,315],[488,350],[515,421],[515,460]],
 [[529,-30],[537,37],[563,91],[522,133],[477,164],[429,202],[446,239],[474,268],[447,319],[490,354],[529,412],[529,460]],
 [[478,-30],[478,33],[491,78],[526,116],[480,157],[429,202],[448,238],[474,268],[502,316],[482,364],[478,412],[478,460]],
 [[459,-30],[459,48],[434,96],[464,142],[444,172],[429,202],[455,241],[474,268],[469,306],[490,344],[526,385],[574,460]],
 [[479.5,-30],[479.5,47],[516,93],[541,140],[482,168],[429,202],[450,232],[474,268],[512,301],[536,346],[574,396],[606,460]],
 [[408,-30],[377,38],[419,83],[465,128],[457,158],[429,202],[470,238],[474,268],[487,311],[472,354],[404,412],[404,460]]
];
function districtRiver(region=s.region){return districtWaterways[region]??riverPoints;}

const districtTracks=[
 null,
 [[[48,126],[93,119],[145,117],[194,143],[253,188],[313,201],[409,202],[483,206],[538,247],[586,278]],[[135,301],[186,260],[253,188],[305,264]],[[483,206],[513,120]]],
 [[[49,167],[93,119],[132,143],[118,175],[156,207],[199,181],[230,217],[301,226],[409,202],[483,206],[532,274],[557,321]],[[156,207],[147,269],[115,315]],[[483,206],[528,136]]],
 [[[58,67],[93,119],[137,102],[193,122],[219,161],[263,177],[237,219],[306,239],[409,202],[483,206],[536,255]],[[219,161],[190,219],[175,307]],[[483,206],[521,112]]],
 [[[47,111],[93,119],[141,145],[189,173],[227,201],[292,171],[346,178],[409,202],[483,206],[530,254],[546,301]],[[189,173],[171,224],[206,260]],[[483,206],[547,128]]],
 [[[49,91],[93,119],[158,111],[211,137],[249,177],[299,224],[345,249],[409,202],[483,206],[523,252],[551,308]],[[211,137],[181,192],[148,241]],[[483,206],[543,160]]],
 [[[52,151],[93,119],[134,162],[183,198],[217,241],[280,251],[343,218],[409,202],[483,206],[538,223],[560,264]],[[183,198],[158,250],[122,290]],[[483,206],[543,171]]],
 [[[48,78],[93,119],[135,92],[181,110],[162,154],[219,171],[253,150],[307,166],[344,189],[409,202],[483,206],[546,229]],[[219,171],[198,232],[215,285]],[[483,206],[530,162]]]
];
function districtRoads(region=s.region){return districtTracks[region]??roads;}

const geographySites=[
 [[130,169],[229,135],[271,180]],[],
 [[116,145],[167,183],[214,153]],
 [[135,112],[190,143],[244,184],[279,210]],
 [[142,133],[197,172],[257,150]],
 [[136,118],[187,144],[242,181]],
 [[136,165],[187,201],[242,233]],
 [[130,118],[174,146],[224,169],[275,187],[325,220]]
];
const geographySurfaces=[
 ["#a39360","#5e6945","#566049",2.5],
 ["#aaa597","#6f746e","#8c8370",3.9],
 ["#d29a60","#95543b","#b9774a",2.3],
 ["#a4815e","#735344","#745447",2.4],
 ["#9c8a6f","#5b625c","#69786e",2.8],
 ["#ad9871","#626755","#696d55",2.6],
 ["#d9bd88","#a79977","#958663",2.8],
 ["#b8b9b0","#727d84","#879aa3",2.5]
];
const geographyRoadColor=region=>color(geographySurfaces[region][0]);
const geoOval=(x,z,cx,cz,w,d)=>landBell(x,cx,w)*landBell(z,cz,d);
function geoReach(x,z,cx,cz,w,d){
 return 1-terrainEase(.64,1.20,Math.hypot((x-cx)/w,(z-cz)/d));
}
function districtLandform(region,x,z,land){
 const hill=(a,b,w,d)=>geoOval(x,z,a,b,w,d);
 const shelf=(a,b,w,d)=>geoReach(x,z,a,b,w,d);
 let rise=0;
 switch(region){
  case 0:
   rise=34*hill(326,37,108,94)+42*hill(546,107,98,108)+21*hill(345,378,119,72)
    -9*hill(315,226,104,58);
   break;
  case 1:
   rise=26*hill(89,318,92,96)+19*hill(286,63,80,56)+24*hill(567,75,78,82)
    -4*hill(258,225,150,90);
   break;
  case 2:{
   const scarp=22*shelf(247,295,95,105)+14*shelf(104,307,77,85)+19*shelf(360,73,115,80);
   const gully=landBell(z,260+.39*(x-140)+15*Math.sin(x*.023),18)*terrainEase(95,188,x)*(1-terrainEase(356,430,x));
   rise=scarp*(1-.78*gully)-17*gully;
   break;
  }
  case 3:
   rise=21*shelf(120,277,106,104)+25*hill(310,64,101,76)+16*hill(579,208,104,165)
    -30*hill(295,259,88,74)-14*hill(166,138,65,37);
   break;
  case 4:
   rise=31*hill(93,280,97,111)+46*hill(312,61,114,71)+34*hill(590,234,101,109)
    -21*hill(284,216,110,63);
   break;
  case 5:{
   const distributary=landBell(x,329+.42*(z-290)+16*Math.sin(z*.035),18)*terrainEase(218,326,z);
   const creek=landBell(x,221-.51*(z-290)+23*Math.sin(z*.031),12)*terrainEase(242,328,z);
   rise=5*hill(148,129,88,68)+7*hill(572,182,105,112)-10*distributary-8*creek-7*hill(379,392,178,54);
   break;
  }
  case 6:
   rise=44*hill(302,78,73,69)+36*hill(594,189,75,103)+27*hill(179,270,70,94)
    +15*shelf(358,291,58,104)-13*hill(337,381,187,53)-9*hill(106,340,76,67);
   break;
  case 7:
   rise=59*hill(118,87,97,78)+52*hill(316,94,86,113)+42*hill(569,89,89,107)
    -28*hill(407,290,102,113)-27*hill(489,360,136,82);
   break;
 }
 // Give the station and established settlement approaches room while the surrounding relief changes.
 const station=geoOval(x,z,94,112,31,29);
 const yard=geographySites[region].reduce((v,[a,b])=>Math.max(v,geoOval(x,z,a,b,24,21)),0);
 const protection=region===0?Math.max(station,geoOval(x,z,266,282,85,72)):Math.max(station,yard*.72);
 let result=land+rise*(1-protection*.92);
 if(region===7){
  const valley=154+.15*(x-170)+7*Math.sin(x*.017);
  const pass=landBell(z,valley,63)*terrainEase(350,187,x);
  result=lerp(result,7+.13*x+2.5*Math.sin(x*.016),pass*.97);
 }
 if(region===2)result=lerp(result,-3,terrainEase(360+14*Math.sin(x*.022),410,z));
 if(region===5)result=lerp(result,-3,1-terrainEase(5,62+15*Math.sin(z*.027),x));
 return result;
}
function geographyBorder(region,x,z,y){
 const {west,east,north,south,width,depth}=worldBounds,[col,row]=openWorldTiles[region];
 const gx=x+col*width,gz=z+row*depth;
 const sides=[[x-west,-1,0],[east-x,1,0],[z-north,0,-1],[south-z,0,1]];
 for(const [gap,dx,dz] of sides){
  if(gap>=44)continue;
  const neighbor=openWorldTiles.findIndex(([a,b])=>a===col+dx&&b===row+dz);
  if(neighbor<0)continue;
  const xx=dx?gx+dx*gap:gx,zz=dz?gz+dz*gap:gz;
  const ridge=35*landBell(zz,205+42*Math.sin(xx*.003),151);
  const foothills=13*landBell(zz,493+68*Math.cos(xx*.004),206);
  const broad=5.2+ridge+foothills+3.8*Math.sin(xx*.011+zz*.008)+1.6*Math.cos(zz*.019-xx*.017);
  const mouth=dz?(geographyMouth(region,dz)+geographyMouth(neighbor,-dz))*.5:0;
  const stream=dz?terrainEase(7,28,Math.abs(x-mouth)):1;
  const shared=lerp(.92,broad,stream);
  y=lerp(shared,y,terrainEase(0,44,gap));
 }
 return y;
}
function geographyMouth(region,direction){
 const points=districtRiver(region),z=direction<0?worldBounds.north:worldBounds.south;
 const i=points.findIndex((p,index)=>index>0&&p[1]>=z);
 const [a,b]=[points[i-1],points[i]];
 return lerp(a[0],b[0],(z-a[1])/(b[1]-a[1]));
}

function geographyWater(region){
 if(![2,5,6,7].includes(region))return;
 const tint=color(regions[region].water);
 const areas={2:[[4,636,344,412]],5:[[4,87,12,412],[170,623,227,412]],6:[[45,633,327,412]],7:[[363,632,264,412]]};
 for(const [a,b,c,d] of areas[region])quad([a,2.105,c],[a,2.105,d],[b,2.105,d],[b,2.105,c],tint,1);
}
function geographyRoadPoints(region,road,hub){
 const [x,z]=road.approach;
 const forward=[-road.x,-road.z],side=[-road.z,road.x];
 const bend=[19,-17,29,-34,25,-13,32,-30][region];
 const toward=side[0]*(hub[0]-x)+side[1]*(hub[1]-z);
 const shift=bend*(toward<0?-1:1);
 const elbow=[x+forward[0]*34+side[0]*shift,z+forward[1]*34+side[1]*shift];
 const saddle=[lerp(elbow[0],hub[0],.57)+side[0]*shift*.49,lerp(elbow[1],hub[1],.57)+side[1]*shift*.49];
 return [road.edge,road.approach,elbow,saddle,hub];
}
function geographyLaneDetails(region){
 const skip=(x,z)=>onAsagiBridge(x,z)||Number.isFinite(trailBridgeDeckHeight(region,x,z))||
  buildingFootprints.some(p=>Math.abs(x-p.x)<p.w*.52&&Math.abs(z-p.z)<p.d*.52)||
  (region===1&&brunnenCityPaving(x,z));
 for(const route of districtRoads(region))
  drawWeatheredTrack(route,geographySurfaces[region][3],1,.094,(x,z)=>skip(x,z)||openWorldCrossing(x,z));
 for(const road of worldRoads[region])
  drawWeatheredTrack(road.samples.map(({x,z})=>[x,z]),4.12,2,.106,(x,z)=>skip(x,z)||watershedBank(region,x,z)<8);
}
function geographySettlementLandmark(region){
 if(region===1)return;
 const [x,z]=geographySites[region][1];
 const y=terrainSurface(x,z);
 if(y<2.3||roadDist(x,z)<4.5||!fitsTree(x,z,2.1)||
   buildingFootprints.some(p=>Math.abs(p.x-x)<p.w*.5+2.5&&Math.abs(p.z-z)<p.d*.5+2.5))return;
 const [,trim,tone]=geographySurfaces[region],a=color(trim),b=color(tone);
 const detail=[
  [2.6,1.7,1.5],[0,0,0],[3.7,1.18,2.3],[2.3,2.8,1.9],[3.3,2.9,2.2],[3.4,2.1,2.2],[3.3,1.65,2.7],[2.6,3.45,2.6]
 ][region];
 const [w,h,d]=detail;
 if(region===2||region===7){
  const count=region===2?3:6;
  for(let i=0;i<count;i++)box(x,y+i*h/count,z,w*(1-i*.095),h/count,d*(1-i*.095),shade(a,.85+i*.04),0,surface.masonry);
  taper(x,y+h,z,region===7?1.55:.75,region===7?.39:.65,.055,b,6);
 }else{
  const raised=region===5?.74:.14;
  box(x,y+raised,z,w,.20,d,a,0,surface.foundation);
  for(const side of [-1,1])for(const end of [-1,1])box(x+side*w*.43,y,z+end*d*.43,.16,h,.16,b,0,surface.wall);
  const peak=y+h+(region===4?1.1:.65);
  for(const side of [-1,1]){
   const p=[x-w*.58,y+h,z+side*d*.62],q=[x+w*.58,y+h,z+side*d*.62],r=[x+w*.58,peak,z],t=[x-w*.58,peak,z];
   quad(...(side>0?[p,q,r,t]:[q,p,t,r]),shade(a,side>0?1.1:.91),surface.roof);
  }
 }
 addSurface(x,z,w*.93,d*.94,y-.05,y+h,false);
 const names=["논길 쉼터","","붉은 석조 수조","삼나무 작업대","목재 검수소","수위 관측대","바람 그늘막","빙하 관측 표석"];
 aimBox(names[region],x,z,w,d,y-.05,y+h+1);
}
function geographyPainter(region){
 const self=topographicPainter(region),[col,row]=openWorldTiles[region];
 const {west,east,north,south,width,depth}=worldBounds;
 const peers=[[-1,0,west],[1,0,east],[0,-1,north],[0,1,south]].flatMap(([dx,dz,edge])=>{
  const next=openWorldTiles.findIndex(([x,z])=>x===col+dx&&z===row+dz);
  return next<0?[]:[{dx,dz,edge,paint:topographicPainter(next)}];
 });
 return (x,y,z,up)=>{
  const tint=self(x,y,z,up);
  let total=1;
  for(const {dx,dz,edge,paint} of peers){
   const gap=Math.abs((dx?x:z)-edge);
   if(gap>=52)continue;
   const weight=1-terrainEase(0,52,gap);
   const peer=paint(x-dx*width,y,z-dz*depth,up);
   for(let i=0;i<3;i++)tint[i]+=peer[i]*weight;
   total+=weight;
  }
  return tint.map(v=>v/total);
 };
}
function districtConnectionDistance(region,x,z){
 let closest=Infinity;
 for(const road of worldRoads[region]){
  const points=road.segments?.map(v=>v.a).concat([road.segments.at(-1).b])??[road.edge,road.approach];
  closest=Math.min(closest,pathDistance(x,z,points));
 }
 return closest;
}
