"use strict";
// Shared coordinates cover the rendered world, including Santa Lucia's southern spur.
const watershedRidges=[
 [[[-20,142],[235,122],[438,208],[698,159],[942,92],[1177,169],[1380,88],[1647,102],[1940,177]],92,116],
 [[[66,527],[217,459],[373,562],[590,530],[749,508],[943,409],[1148,361]],68,59],
 [[[149,592],[199,738],[314,838],[383,961],[502,1039],[638,1015],[774,953]],76,55],
 [[[1090,434],[1267,501],[1395,460],[1542,543],[1749,569],[1935,519]],58,79],
 [[[1260,919],[1441,875],[1580,947],[1774,961],[1920,1013]],61,64]
];
const watershedChannels=[
 [[[1106,104],[1088,190],[1110,291],[1110,412],[1098,488],[1061,602],[1106,668],[1100,721],[1081,768]],9,17],
 [[[1654,126],[1642,224],[1690,318],[1668,412],[1673,445],[1702,505],[1676,561],[1711,628],[1738,668],[1721,721],[1665,752],[1520,757],[1385,721],[1268,753],[1180,776],[1081,768]],7,14],
 [[[1081,768],[1091,811],[1095,875],[1118,930],[1104,986],[1090,1038],[1030,1082],[948,1112],[870,1157],[819,1208]],17,30],
 [[[301,927],[405,943],[511,985],[583,1010],[636,1051],[753,1065],[858,1076],[948,1112]],5,16],
 [[[1030,1082],[1085,1116],[1119,1145],[1136,1208]],10,17]
];
const watershedBiomes=[
 [1594,619,333,210,"#738850"],[929,595,233,200,"#858777"],[290,686,369,255,"#ac7047"],
 [251,233,328,207,"#6c764d"],[939,207,276,194,"#65836c"],[907,1029,291,198,"#6f8264"],
 [1627,1052,328,206,"#b69b65"],[1630,202,300,226,"#9babb0"]
];
const watershedColor=watershedBiomes.map(v=>v[4]);
function watershedSouth(region){return region===2?812:412;}
function watershedXZ(region,x,z){
 const [col,row]=openWorldTiles[region];
 return [x+col*worldBounds.width,z+row*worldBounds.depth];
}
function watershedDistance(x,z,points){
 let nearest=Infinity,phase=0;
 for(let i=1;i<points.length;i++){
  const [a,b]=points[i-1],[c,d]=points[i],dx=c-a,dz=d-b;
  const t=cap(((x-a)*dx+(z-b)*dz)/(dx*dx+dz*dz),0,1);
  const gap=(x-a-t*dx)**2+(z-b-t*dz)**2;
  if(gap<nearest){nearest=gap;phase=(i-1+t)/(points.length-1);}
 }
 return [Math.sqrt(nearest),phase];
}
function watershedCoast(x,z){
 const inlet=86*landBell(x,767,183)+56*landBell(x,1044,161)+31*landBell(x,1487,105);
 const coast=1179-inlet+38*Math.sin(x*.008)+23*Math.sin(x*.017+1.1);
 const west=76+35*Math.sin(z*.013)+19*Math.cos(z*.031);
 const south=coast-z;
 const southwest=(x-west)*.83+(1028-z)*.21;
 return Math.min(south,z>814?southwest:400);
}
function watershedHighland(x,z){
 let crest=0,overlap=0;
 for(const [points,width,rise] of watershedRidges){
  const [distance]=watershedDistance(x,z,points);
  const ribs=.83+.11*Math.sin(x*.018+z*.027)+.07*Math.cos(x*.035-z*.014);
  const height=rise*ribs*Math.exp(-((distance/width)**2));
  overlap+=height*.14;
  crest=Math.max(crest,height);
 }
 const rolling=4.6*Math.sin(x*.010+z*.007)+2.5*Math.cos(x*.019-z*.012);
 return Math.max(3.4,9+crest+overlap+rolling);
}
function watershedWaterAt(x,z){
 let bank=Infinity,bed=Infinity;
 for(const [points,start,end] of watershedChannels){
  const [a,b]=points[0],c=points.at(-1)[0],d=points.at(-1)[1];
  if(z<Math.min(b,d)-70||z>Math.max(b,d)+70)continue;
  if(x<Math.min(a,c)-360||x>Math.max(a,c)+360)continue;
  const [gap,phase]=watershedDistance(x,z,points);
  const width=lerp(start,end,phase);
  bank=Math.min(bank,gap-width);
  bed=Math.min(bed,gap/(width+14));
 }
 return {bank,bed};
}
function watershedBank(region,x,z){
 const [a,b]=watershedXZ(region,x,z);
 return watershedWaterAt(a,b).bank;
}
function watershedGround(region,x,z,local){
 const [gx,gz]=watershedXZ(region,x,z);
 const continental=watershedHighland(gx,gz);
 // Local foundations and gameplay landmarks merge into the continent through irregular interior envelopes.
 const station=geoOval(x,z,96,112,105,80);
 const heart=geoOval(x,z,240,223,174,132);
 const urban=region===1?geoOval(x,z,248,159,195,133):0;
 const terraces=region===0?geoOval(x,z,252,290,126,94):0;
 const edge=Math.min(x-4,636-x,z-12,watershedSouth(region)-z);
 const wobble=12*Math.sin(gx*.015+gz*.011)+7*Math.cos(gz*.021-gx*.008);
 const envelope=terrainEase(0,112+wobble,edge);
 let village=0;
 for(const [cx,cz] of geographySites[region]){
  const distance=Math.hypot(x-cx,(z-cz)*1.20);
  village=Math.max(village,1-terrainEase(28,113,distance));
 }
 const localWeight=Math.max(.41*heart,.94*station,.97*urban,.96*terraces,village*.98)*envelope;
 let land=lerp(continental,local,localWeight);
 if(gz>740&&gz<1230&&gx>460&&gx<1420){
  const flats=geoOval(gx,gz,943,995,272,156)*terrainEase(740,825,gz)*(1-terrainEase(1168,1230,gz))*terrainEase(460,560,gx)*(1-terrainEase(1310,1420,gx));
  land=lerp(land,3.1+1.8*Math.sin(gx*.032+gz*.037)+1.1*Math.cos(gz*.052-gx*.021),flats*.87);
 }
 const coast=watershedCoast(gx,gz);
 land=lerp(-4.8,land,terrainEase(-15,39,coast));
 const {bed}=watershedWaterAt(gx,gz);
 const channel=terrainEase(.48,1.14,bed);
 return lerp(.53,land,channel);
}
function watershedRoadElevation(region,x,z){
 const [a,b]=watershedXZ(region,x,z);
 return cap(watershedHighland(a,b)*.59,5,24);
}
function watershedPalette(region){
 const pigments=watershedColor.map(color);
 const local=topographicPainter(region);
 return (x,y,z,up)=>{
  const [a,b]=watershedXZ(region,x,z);
  const px=a+47*Math.sin(b*.012)+24*Math.cos(a*.008+b*.015);
  const pz=b+42*Math.sin(a*.011)-26*Math.cos(b*.014);
  let weight=0;
  const pigment=[0,0,0];
  for(const [i,[cx,cz,w,d]] of watershedBiomes.entries()){
   const f=Math.exp(-2.05*(((px-cx)/w)**2+((pz-cz)/d)**2));
   for(let j=0;j<3;j++)pigment[j]+=pigments[i][j]*f;
   weight+=f;
  }
  const foliage=shade(pigment.map(v=>v/Math.max(1e-10,weight)),.92+.09*Math.sin(a*.042+b*.037));
  const rock=shade(foliage,.73+.19*up);
  const snow=terrainEase(85,129,y)*terrainEase(1000,1580,a)*(1-terrainEase(385,689,b));
  const lithology=mix(mix(rock,foliage,terrainEase(.42,.92,up)),[.74,.79,.80],snow*.83);
  const coast=watershedCoast(a,b);
  const coastTint=mix([.55,.48,.33],lithology,terrainEase(7,37,coast));
  const trim=terrainEase(12,126,Math.min(x-4,636-x,z-12,watershedSouth(region)-z))*.24;
  return mix(coastTint,local(x,y,z,up),trim);
 };
}
const watershedWaterLevel=2.108;
function watershedWaterMesh(region,sample=terrainSurface){
 const step=4,columns=159,rows=(watershedSouth(region)-12)/step+1;
 const depths=new Float32Array(columns*rows);
 for(let r=0;r<rows;r++)for(let c=0;c<columns;c++)
  depths[r*columns+c]=watershedWaterLevel-sample(4+c*step,12+r*step);
 const vertex=(x,z,d)=>verts.push(x,watershedWaterLevel,z,0,1,0,Math.max(0,d),0,0,103);
 for(let r=0;r<rows-1;r++)for(let c=0;c<columns-1;c++){
  const i=r*columns+c,x=4+c*step,z=12+r*step;
  const a=depths[i],b=depths[i+columns],d=depths[i+1],e=depths[i+columns+1];
  if(Math.max(a,b,d,e)<-.18)continue;
  vertex(x,z,a);vertex(x,z+step,b);vertex(x+step,z+step,e);
  vertex(x,z,a);vertex(x+step,z+step,e);vertex(x+step,z,d);
 }
}
function watershedBridges(region){
 const plank=color(region===5?"#79694c":"#817a67");
 for(const road of worldRoads[region]){
  const samples=road.samples;
  for(let i=1;i<samples.length;i++){
   const a=samples[i-1],b=samples[i];
   if(Math.min(watershedBank(region,a.x,a.z),watershedBank(region,b.x,b.z))>18)continue;
   const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),half=4.2;
   const nx=-dz/length*half,nz=dx/length*half;
   const point=(p,side)=>[p.x+side*nx,p.y+.035,p.z+side*nz];
   quad(point(a,-1),point(a,1),point(b,1),point(b,-1),plank,surface.masonry);
   const lo=Math.min(a.y,b.y)-1.8;
   addSurface((a.x+b.x)*.5,(a.z+b.z)*.5,Math.abs(dx)+2*Math.abs(nx)+.08,Math.abs(dz)+2*Math.abs(nz)+.08,lo,(x,z)=>{
    const t=((x-a.x)*dx+(z-a.z)*dz)/(length*length);
    const side=Math.abs((x-a.x)*nx+(z-a.z)*nz)/half;
    return t>=-.035&&t<=1.035&&side<=half+.08?lerp(a.y,b.y,cap(t,0,1))+.035:-Infinity;
   });
   if(i%2===0){
    for(const side of [-1,1]){
     const p=point(a,side);
     box(p[0],p[1]-.12,p[2],.26,.95,.26,plank,0,surface.wall);
    }
   }
  }
 }
}
function watershedRadarLines(region){
 const [col,row]=openWorldTiles[region];
 return watershedChannels.map(([points])=>points.map(([x,z])=>[x-col*632,z-row*400]));
}
function watershedCrossSection(region,z,preferred){
 const [ox,gz]=watershedXZ(region,0,z);
 let closest=null;
 for(const [points,start,end] of watershedChannels)for(let i=1;i<points.length;i++){
  const [ax,az]=points[i-1],[bx,bz]=points[i];
  if(az===bz||gz<Math.min(az,bz)||gz>Math.max(az,bz))continue;
  const t=(gz-az)/(bz-az);
  const x=lerp(ax,bx,t)-ox;
  if(x<4||x>636||(closest&&Math.abs(x-preferred)>=Math.abs(closest.x-preferred)))continue;
  const width=lerp(start,end,(i-1+t)/(points.length-1))*Math.hypot(bx-ax,bz-az)/Math.abs(bz-az);
  closest={x,width};
 }
 return closest;
}
const watershedBridgeCache=new Map();
function watershedDistrictBridge(region){
 if(region===0)return asagiBridge;
 if([2,3,6].includes(region))return null;
 if(watershedBridgeCache.has(region))return watershedBridgeCache.get(region);
 const section=watershedCrossSection(region,asagiBridge.z,425);
 if(!section)return null;
 const length=cap(section.width+17,26,52);
 const bridge={...asagiBridge,left:Math.max(4,section.x-length),right:Math.min(636,section.x+length)};
 watershedBridgeCache.set(region,bridge);
 return bridge;
}
