// Districts keep their local coordinates for existing saves, quests and interactions.
const openWorldTiles=[[2,1],[1,1],[0,1],[0,0],[1,0],[1,2],[2,2],[2,0]];
const openWorldPins=[[76.4,42.7],[45.6,42.9],[9.1,44.5],[8.0,8.7],[44.0,9.4],[42.4,76.5],[76.1,80.3],[75.8,8.3]];
const worldBounds={west:4,east:636,north:12,south:412,width:632,depth:400};
const worldLinks=[
 [0,1,198,"계곡 연결로"],[1,2,306,"붉은 협곡길"],[2,3,178,"협곡 고원길"],
 [3,4,128,"삼나무 고갯길"],[1,4,339,"호수 고갯길"],[1,5,286,"하구 제방길"],
 [5,6,300,"연안 둑길"],[4,7,164,"빙하 만 제방길"],
 [0,7,267,"북동 산길"],[0,6,318,"남동 해안길"]
];
const worldHubs=[[265,185],[306,235],[152,230],[178,210],[292,171],[261,267],[325,264],[292,209]];
const worldRoads=openWorldTiles.map(()=>[]);
const worldMeshes=new Map();
const canyonLaneHalfWidth=10;
// Signed shoulder elevations in metres. A negative lobe lowers the verge.
const regionalVergeProfiles={
 0:{left:[[23,7,5.8],[41,10,5.6]],right:[[20,6,2.8],[34,10,7]],tint:[.43,.49,.30]},
 1:{left:[[20,10,2.6],[37,13,3.5]],right:[[19,7,3.7],[34,11,-1.8]],tint:[.50,.47,.38]},
 4:{left:[[27,10,11],[49,13,8]],right:[[25,9,6],[42,10,8]],tint:[.49,.53,.49]},
 5:{left:[[17,8,1.9],[37,12,-2.6]],right:[[17,8,2.2],[38,12,-3.6]],tint:[.39,.44,.32]},
 6:{left:[[27,13,6],[47,10,5]],right:[[18,9,2.9],[39,14,-2.1]],tint:[.64,.57,.42]},
 7:{left:[[30,10,12.3],[49,12,8.2]],right:[[23,8,6.7],[40,12,8.5]],tint:[.59,.64,.65]}
};


for(const [a,b,axis,name] of worldLinks){
 for(const [from,to] of [[a,b],[b,a]]){
  const [col,row]=openWorldTiles[from], [otherCol,otherRow]=openWorldTiles[to];
  const x=otherCol-col,z=otherRow-row;
  const {west,east,north,south}=worldBounds;
  const edge=x?[x>0?east:west,axis]:[axis,z>0?south:north];
  const approach=[edge[0]-x*84,edge[1]-z*84];
  const canyon=[2,3].includes(from)||[2,3].includes(to);
  worldRoads[from].push({to,x,z,edge,approach,name,canyon});
 }
}
// Santa Lucia extends one sector south. Its eastern spur joins Saint-Aurel at the same world point.
worldRoads[2].push({to:5,x:1,z:0,edge:[636,553],approach:[552,553],name:"남서 곶길",canyon:true,shiftZ:-400});
worldRoads[5].push({to:2,x:-1,z:0,edge:[4,153],approach:[88,153],name:"남서 곶길",canyon:true,shiftZ:400});
function openWorldStep(region,x,z){
 const road=worldRoads[region].find(({edge,x:dx,z:dz})=>
  dx*(x-edge[0])+dz*(z-edge[1])>0&&Math.abs(dz*(x-edge[0])+dx*(z-edge[1]))<13);
 if(!road)return null;
 return {region:road.to,x:x-road.x*worldBounds.width,z:z-road.z*worldBounds.depth+(road.shiftZ??0)};
}
function worldRoadGrades(region){
 const original=s.region;
 s.region=region;
 try{
  for(const road of worldRoads[region]){
   if(road.samples)continue;
   const points=geographyRoadPoints(region,road,worldHubs[region]),samples=[];
   const passElevation=watershedRoadElevation(region,...road.edge);
   let prefix=0;
   road.segments=[];
   for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const count=Math.ceil(length/7);
    road.segments.push({a,b,start:Math.max(0,samples.length-1),count});
    for(let j=i?1:0;j<=count;j++){
     const x=lerp(a[0],b[0],j/count),z=lerp(a[1],b[1],j/count);
     const distance=prefix+length*j/count;
     const ground=Math.max(3.25,districtHeight(x,z));
     const previous=samples.at(-1);
     const ramp=lerp(.14*terrainEase(18,48,distance),.24,terrainEase(112,155,distance));
     const grade=distance<25?passElevation:cap(ground,previous.y-ramp*(distance-previous.distance),previous.y+ramp*(distance-previous.distance));
     samples.push({x,z,y:grade,distance});
    }
    prefix+=length;
   }
   road.samples=samples;
  }
 }finally{s.region=original;}
}
function openWorldBorder(region,x,z,natural){
 const [col,row]=openWorldTiles[region];
 const gx=x+col*worldBounds.width,gz=z+row*worldBounds.depth;
 let result=natural;
 for(const {to,edge,x:dx,z:dz} of worldRoads[region]){
  const gap=Math.abs(dx*(x-edge[0])+dz*(z-edge[1]));
  if(gap>=22)continue;
  const sea=(region===5&&to===6)||(region===6&&to===5);
  const alpine=(region===4&&to===7)||(region===7&&to===4);
  const ripple=Math.sin(gx*.021+gz*.009)*.58+Math.cos(gz*.026-gx*.013)*.42;
  const edgeHeight=sea?.68+.26*ripple:alpine?7+5*ripple:12+9*ripple;
  const blend=1-gap/22;
  result=lerp(result,edgeHeight,blend*blend*(3-2*blend));
 }
 return result;
}
function openWorldGround(region,x,z,natural){
 let distance=Infinity,grade=natural,closest=null,along=0,side=0;
 for(const road of worldRoads[region]){
  const samples=road.samples;
  if(!samples)continue;
  for(const {a,b,start,count} of road.segments){
   const dx=b[0]-a[0],dz=b[1]-a[1];
   const t=cap(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);
   const gap=(x-a[0]-dx*t)**2+(z-a[1]-dz*t)**2;
   if(gap>=distance)continue;
   const offset=t*count,index=Math.min(count-1,Math.floor(offset));
   distance=gap;
   closest=road;
   along=lerp(samples[start].distance,samples[start+count].distance,t);
   side=((x-a[0])*dz-(z-a[1])*dx)/Math.hypot(dx,dz);
   grade=lerp(samples[start+index].y,samples[start+index+1].y,offset-index);
  }
 }
 const gap=Math.sqrt(distance);
 const width=lerp(5,geographySurfaces[region][3]+1.25,terrainEase(45,103,along));
 const canyon=closest?.canyon;
 const shoulder=canyon?1-terrainEase(canyonLaneHalfWidth,37,gap):terrainEase(0,1,cap((34-gap)/25,0,1));
 const relief=canyon&&(region===2||region===3)?canyonPassRelief(region,closest,along,side):regionalVergeRelief(region,along,side);
 const wet=closest&&gap<68?terrainEase(-3,9,watershedBank(region,x,z)):1;
 return {height:lerp(natural,grade,shoulder*wet)+relief*wet,road:(1-terrainEase(width,width+3.4,gap))*wet};
}
function regionalVergeRelief(region,along,side){
 const profile=regionalVergeProfiles[region],offset=Math.abs(side);
 if(!profile||along>94||offset<11||offset>62)return 0;
 const fade=terrainEase(4,22,along)*(1-terrainEase(72,94,along));
 const limit=terrainEase(11,16,offset)*(1-terrainEase(51,62,offset));
 const shift=Math.sin(along*.092+region)*2.4+Math.sin(along*.201)*.7;
 const lobes=side<0?profile.left:profile.right;
 const height=lobes.reduce((sum,[center,width,rise])=>sum+rise*landBell(offset,center+shift,width),0);
 return fade*limit*height*(.85+.15*Math.sin(along*.065+region));
}
function regionalVergeTint(region,x,y,z,up,tint){
 const profile=regionalVergeProfiles[region];
 if(!profile)return tint;
 const offset=regionalVergeDistance(region,x,z);
 if(offset<9||offset>=63)return tint;
 const edge=terrainEase(9,22,offset)*(1-terrainEase(48,63,offset));
 const exposed=(1-terrainEase(.50,.96,up))*.56+.12;
 const fleck=.91+.055*Math.sin(y*2.7+x*.09)+.04*Math.cos(z*.23);
 return mix(tint,shade(profile.tint,fleck),edge*exposed);
}
function regionalVergeDistance(region,x,z){
 if(!regionalVergeProfiles[region])return Infinity;
 let distance=Infinity;
 for(const road of worldRoads[region]){
  const [a,b]=road.edge,along=-road.x*(x-a)-road.z*(z-b);
  if(along<0||along>94)continue;
  const offset=Math.abs(road.z*(x-a)+road.x*(z-b));
  distance=Math.min(distance,offset+terrainEase(74,94,along)*64);
 }
 return distance;
}
function roadVergeDistance(region,x,z){
 return Math.min(canyonVergeDistance(region,x,z),regionalVergeDistance(region,x,z));
}
function canyonPassRelief(region,road,distance,side){
 if(distance>108||Math.abs(side)<13)return 0;
 const depth=terrainEase(5,28,distance)*(1-terrainEase(78,108,distance));
 const left=side<0;
 const tallSide=(region+road.to)%2===0?left:!left;
 const wave=Math.sin(distance*.094+region*1.2),ripple=Math.sin(distance*.227+road.to*.83);
 const crest=(tallSide?34:28)+wave*(tallSide?6:4)+ripple*2.2;
 const across=Math.abs(side);
 const rise=terrainEase(13,crest,across)*(1-terrainEase(crest,crest+28,across));
 const brokenShoulder=terrainEase(15,24,across)*(1-terrainEase(25,36,across));
 const cut=terrainEase(10,15,across)*(1-terrainEase(15,23,across));
 const ridge=(tallSide?16.5:10.2)*(1+wave*.21+ripple*.08)*rise;
 return depth*(ridge+brokenShoulder*(1.65+.70*ripple)-cut*(tallSide?2.2:1.2));
}
function canyonVergeDistance(region,x,z){
 if(region!==2&&region!==3)return Infinity;
 let distance=Infinity;
 for(const road of worldRoads[region]){
  if(!road.canyon)continue;
  const [a,b]=road.edge,along=-road.x*(x-a)-road.z*(z-b);
  if(along<0||along>96)continue;
  const offset=Math.abs(road.z*(x-a)+road.x*(z-b));
  distance=Math.min(distance,offset+terrainEase(68,96,along)*5);
 }
 return distance;
}
function canyonPassTint(region,x,y,z,up,tint){
 const verge=canyonVergeDistance(region,x,z);
 if(verge<10||verge>68)return tint;
 const exposure=(1-terrainEase(.49,.93,up))*terrainEase(10,22,verge)*(1-terrainEase(49,68,verge));
 const layer=y+.20*Math.sin(x*.14+z*.098)+.10*Math.cos(x*.39-z*.24);
 const sediment=.94+.10*Math.sin(layer*2.8)+.038*Math.cos(layer*6.9);
 const rock=region===2?[.69,.37,.21]:[.53,.33,.23];
 return mix(tint,shade(rock,sediment),exposure*.88);
}
function canyonTerrainPatches(region,base){
 const sculpted=region===2||region===3;
 const snap=(v,start,ceil)=>start+(ceil?Math.ceil:Math.floor)((v-start)/base.step)*base.step;
 return worldRoads[region].filter(road=>!sculpted||road.canyon).map(({edge,x:dx,z:dz})=>{
  const [x,z]=edge;
  const span=sculpted?103:94;
  const a=x-dx*span,b=z-dz*span;
  const left=snap(Math.min(x,a)-Math.abs(dz)*66-8,base.x,false);
  const top=snap(Math.min(z,b)-Math.abs(dx)*66-8,base.z,false);
  const right=snap(Math.max(x,a)+Math.abs(dz)*66+8,base.x,true);
  const bottom=snap(Math.max(z,b)+Math.abs(dx)*66+8,base.z,true);
  const step=base.step===5?2.5:2; return {x:left,z:top,step,columns:(right-left)/step+1,rows:(bottom-top)/step+1};
 });
}
function openWorldCrossing(x,z){
 return worldRoads[s.region].some(({edge,x:dx,z:dz})=>
  Math.abs(dx*(x-edge[0])+dz*(z-edge[1]))<22&&Math.abs(dz*(x-edge[0])+dx*(z-edge[1]))<15);
}
function openWorldMove(next){
 const previous=s.region;
 s.region=next.region;
 player={x:next.x,y:next.z};
 actionSpot=marker=target=null;
 selected="station";
 aimTarget=null;
 cameraClearance=1;
 if(!s.soilCampaign?.step&&previous===0&&s.region===1&&s.stage===4)s.stage=5;
 ensureWorld();
 log(regions[s.region].name+"에 도착했다.");
 render();
}
function makeOpenWorldMesh(region){
 if(worldMeshes.has(region))return worldMeshes.get(region);
 worldRoadGrades(region);
 const previous=s.region,stored=verts;
 s.region=region;
 verts=[];
 try{
  const {west,east,north}=worldBounds,south=watershedSouth(region),points=[];
  const canyon=region===2||region===3,columns=159,rows=1+(south-north)/4;
  const paint=watershedPalette(region);
  const track=geographyRoadColor(region);
  for(let row=0;row<rows;row++){
   points[row]=[];
   for(let col=0;col<columns;col++){
    const x=lerp(west,east,col/(columns-1)),z=lerp(north,south,row/(rows-1));
    const {height:y,road}=openWorldGround(region,x,z,districtHeight(x,z));
    points[row][col]={pos:[x,y,z],road};
   }
  }
  for(let row=1;row<rows;row++)for(let col=1;col<columns;col++){
   {
    for(const [u,v] of [[row-1,col-1],[row,col-1],[row,col],[row-1,col-1],[row,col],[row-1,col]]){
     const p=points[u][v];
     p.normal??=unit([
      points[u][Math.max(0,v-1)].pos[1]-points[u][Math.min(columns-1,v+1)].pos[1],8,
      points[Math.max(0,u-1)][v].pos[1]-points[Math.min(rows-1,u+1)][v].pos[1]
     ]);
     p.tint??=mix(paint(...p.pos,p.normal[1]),track,p.road);
     p.rockTint??=(canyon?canyonPassTint:regionalVergeTint)(region,...p.pos,p.normal[1],p.tint);
     verts.push(...p.pos,...p.normal,...p.rockTint,2);
    }
   }
  }
  watershedWaterMesh(region,(x,z)=>points[(z-12)/4][(x-4)/4].pos[1]);
  const random=rand(431+region*57);
  for(let i=0;i<380;i++){
   const x=west+random()*(east-west),z=north+random()*(south-north),y=height(x,z);
   if(y<2.7||y>90||openWorldGround(region,x,z,y).road>.08||riverDist(x,z)<21)continue;
   const rise=2.2+random()*6, tint=shade(color(regions[region].tree),.65+random()*.37);
   taper(x,y,z,rise,rise*.22,.045,tint,5);
  }
  const buffer=gl.createBuffer();
  upload(buffer);
  const part={buffer,count:verts.length/10};
  worldMeshes.set(region,part);
  return part;
 }finally{verts=stored;s.region=previous;}
}
function drawOpenWorld(mesh,eye){
 const [col,row]=openWorldTiles[s.region];
 for(const [region,[x,z]] of openWorldTiles.entries()){
  if(region===s.region||Math.abs(x-col)>1||Math.abs(z-row)>1)continue;
  const ox=(x-col)*worldBounds.width,oz=(z-row)*worldBounds.depth;
  const {west,east,north}=worldBounds,south=watershedSouth(region);
  const distance=Math.hypot(Math.max(0,ox+west-eye[0],eye[0]-ox-east),Math.max(0,oz+north-eye[2],eye[2]-oz-south));
  if(distance>510)continue;
  const part=makeOpenWorldMesh(region);
  mesh(part.buffer,part.count,[ox,0,oz],0);
 }
}
function decorateOpenWorld(){
 const oak=color("#6e5440"),stone=color("#827c6b");
 for(const {edge,x,z,name,to} of worldRoads[s.region]){
  const px=edge[0]-x*13,pz=edge[1]-z*13;
  const sideX=-z,sideZ=x;
  for(const side of [-1,1]){
   const a=px+sideX*side*6.7,b=pz+sideZ*side*6.7,y=height(a,b);
   box(a,y-.12,b,.56,.27,.56,stone,0,surface.masonry);
   box(a,y,b,.19,1.26,.19,oak,0,surface.wall);
   box(a,y+1.08,b,.37,.17,.37,stone,0,surface.masonry);
   aimBox(name+" · "+regions[to].name,a,b,.58,.58,y,y+1.3);
   if(![5,6,7].includes(s.region)&&![5,6,7].includes(to))continue;
   for(const distance of [0,4,8,12,16,20]){
    const rx=edge[0]-x*distance+sideX*side*4.5;
    const rz=edge[1]-z*distance+sideZ*side*4.5;
    const h=height(rx,rz);
    box(rx,h-.25,rz,.20,1.23,.20,oak,0,surface.wall);
    if(distance===20)continue;
    const bx=rx-x*4,bz=rz-z*4;
    tube([rx,h+.78,rz],[bx,height(bx,bz)+.78,bz],.07,.07,oak,0,5);
   }
  }
 }
}
function openWorldMapDetail(detail,available,region){
 const route=worldRoads[s.region].find(road=>road.to===region);
 if(!route){available.textContent="인접 지역의 길을 차례로 따라가면 걸어서 닿을 수 있습니다.";return;}
 const direction=route.x>0?"동쪽":route.x<0?"서쪽":route.z>0?"남쪽":"북쪽";
 const distance=Math.round(Math.hypot(player.x-route.edge[0],player.y-route.edge[1]));
 available.textContent=direction+" · "+route.name+" · 경계까지 "+distance+"m";
}