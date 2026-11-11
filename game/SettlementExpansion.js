"use strict";
let settlementAdded=0,townResidents=[],residentMeshes;
function expandSettlement(wall,roof){
 villageWalkCells.clear();
 const city=s.region===1,district=villageDistricts[s.region],goal=district.goal;
 const random=rand(36091+s.region*133);
 const candidates=[],lanes=new Map(),fencePlots=[];
 const grid=(left,right,back,front,dx,dz)=>{
  for(let row=0;back+row*dz<=front;row++){
   const lane=back+(Math.floor(row/2)*2+.5)*dz;
   const key=left+":"+lane;
   for(let column=0;left+column*dx<=right;column++){
    const x=left+column*dx;
    const curve=Math.sin(column*.48+back*.11+s.region*.61)*(city?1.25:2.2);
    candidates.push({x:x+(row%2?.22*dx:0),z:back+row*dz+curve,lane:lane+curve,key,row,column});
   }
  }
 };
 if(city){
  grid(110,315,74,208,12.8,14.5);
  grid(475,620,107,300,13,15);
  grid(105,263,225,310,13,15);
 }else{
  const centers=geographySites[s.region];
  const lots=[];
  const add=(along,across)=>lots.push([along,across]);
  switch(district.layout){
   case "terraces": for(const across of [-13,13,-26,26])for(const a of [-24,-12,0,12,24])add(a+(across>0?4:0),across+a*.12);break;
   case "courts": for(const depth of [13,25,37])for(let n=0;n<12;n++){const a=n*Math.PI/6;add(Math.cos(a)*depth,Math.sin(a)*depth*.81);}break;
   case "contours": for(const across of [-12,12,-24,24])for(const a of [-24,-12,0,12,24])add(a,across+a*.26);break;
   case "rail": for(const across of [-14,14,-27,27])for(const a of [-26,-13,0,13,26])add(a,across);break;
   case "embankments": for(const across of [-12,12,-25,25])for(const a of [-24,-12,0,12,24])add(a,across+a*.35);break;
   case "beach": for(const a of [-15,15,-28,28])for(const b of [-26,-13,0,13,26])add(a+b*.20,b);break;
   case "windbreaks": for(const a of [-13,0,13,-25,25])for(const b of [-15,15,-28,28])add(a+(b>0?5:0),b);break;
  }
  for(let column=0;column<lots.length;column++)for(const [row,[x,z]] of centers.entries()){
   const [dx,dz]=lots[column];
   const facesSide=district.layout==="beach"||(district.layout==="courts"&&Math.abs(dx)>Math.abs(dz));
   const turn=facesSide?(dx>0?1:3):(dz>0?2:0);
   const yard=facesSide?[x,z+dz*.78]:[x+dx*.78,z];
   candidates.push({x:x+dx,z:z+dz,lane:z,key:row,row,column,yard,turn});
  }
  // Fill gaps left by steep slopes without relaxing clearance around routes or rail.
  const [along,across]={
   terraces:[1.31,.76],courts:[1.07,.89],contours:[1.34,.68],
   rail:[1.33,.81],embankments:[1.35,.68],beach:[.77,1.34],windbreaks:[1.30,.72]
  }[district.layout];
  for(let column=0;column<92;column++)for(const [row,[x,z]] of centers.entries()){
   const angle=column*2.399963+row*1.1+s.region*.57;
   const radius=8+28*Math.sqrt((column+.5)/92);
   const dx=Math.cos(angle)*radius*along,dz=Math.sin(angle)*radius*across;
   const facesSide=district.layout==="beach"||(district.layout==="courts"&&Math.abs(dx)>Math.abs(dz));
   const turn=facesSide?(dx>0?1:3):(dz>0?2:0);
   const yard=facesSide?[x,z+dz*.67]:[x+dx*.67,z];
   candidates.push({x:x+dx,z:z+dz,lane:z,key:row,row,column,yard,turn});
  }
 }
 const slope=(x,z,w,d)=>{
  const samples=[[-.5,-.5],[-.5,.5],[.5,-.5],[.5,.5],[0,1]].map(([a,b])=>terrainSurface(x+a*w,z+b*d));
  return Math.max(...samples)-Math.min(...samples);
 };
 settlementAdded=0;
 const occupied=new Map();
 for(const plot of candidates){
  if(!city&&(occupied.get(plot.key)??0)>=Math.ceil(goal/geographySites[s.region].length)+1)continue;
  const style=(plot.column+plot.row*3+s.region)%4;
  const x=plot.x+(random()-.5)*(city?1.4:2.4),z=plot.z+(random()-.5)*1.25;
  const w=([6.0,7.1,6.0,7.4][style]+random()*1.2)*district.size[0],d=([6.3,5.6,7.2,5.7][style]+random()*.8)*district.size[1];
  const turn=plot.turn??(plot.column%7===6?(plot.row%2?1:3):plot.row%2?2:0);
  const spanX=turn%2?d:w,spanZ=turn%2?w:d;
  if(city&&brunnenCityReserved(x,z,Math.max(spanX,spanZ)*.5))continue;
  const rail=s.region===0&&x>asagiRail.from-10&&x<asagiRail.to+10&&Math.abs(z-asagiRail.z)<11;
  if(rail||height(x,z)<2.6||riverDist(x,z)<channelWidth(z)+9||roadDist(x,z)<6.4||districtConnectionDistance(s.region,x,z)<7.5+Math.max(spanX,spanZ)*.5||
     spots.some(p=>Math.hypot(p.x-x,p.y-z)<19)||slope(x,z,spanX,spanZ)>2.55)continue;
  if(s.region===0&&(x<112&&z<137||asagiPaddies.some(p=>Math.abs(x-p.x)<p.w*.5+10&&Math.abs(z-p.z)<15)))continue;
  if(buildingFootprints.some(p=>Math.abs(p.x-x)<(p.w+spanX)*.5+district.spacing&&Math.abs(p.z-z)<(p.d+spanZ)*.5+(city?4.4:district.spacing)))continue;
  const palette=villagePalette[s.region],tone=mix(wall,color(palette[style]),.67);
  const roofTone=mix(roof,color(palette[(style+2)%4]),.32);
  const h=([3.0,3.65,2.85,3.30][style]+random()*(city?1.25:.65))*district.size[2];
  buildVillageHouse(x,z,w,d,h,shade(tone,.92+random()*.14),roofTone,turn,style,settlementAdded);
  const sideX=[0,-1,0,1][turn],sideZ=[1,0,-1,0][turn];
  const entrance=buildingFootprints.at(-1).approach??[x+sideX*(d*.5+1.0),z+sideZ*(d*.5+1.0)];
  const elbow=city?[x+sideX*(d*.5+3.4),plot.lane]:
   [lerp(entrance[0],plot.yard[0],.60),lerp(entrance[1],plot.yard[1],.60)];
  buildingFootprints.at(-1).approach=entrance;
  fencePlots.push([x,z,spanX,spanZ,plot.lane,entrance,elbow]);
  if(!lanes.has(plot.key))lanes.set(plot.key,[]);
  lanes.get(plot.key).push(elbow);
  if(!city)occupied.set(plot.key,(occupied.get(plot.key)??0)+1);
  if(++settlementAdded===goal)break;
 }
 const homes=buildingFootprints.filter(p=>p.villageHome);
 const streetNetwork=connectVillageHomes(homes,lanes);
 addWornVillageTrails(streetNetwork.nodes,homes);
 const fenceEnds=fencePlots.flatMap((plot,lot)=>buildRoadsideFence(...plot,streetNetwork.nodes).map(p=>({p,lot})));
 linkVillageFences(fenceEnds,fencePlots);
 for(const points of lanes.values())villageMeetingPlace(points,streetNetwork.nodes);
 villageBankScour();
 dressVillageVerges(streetNetwork.nodes);
 planResidents(city,streetNetwork.pockets);
}

const villageFenceStyles=[
 ["wood",.71,"#62503a"],["iron",.84,"#3f4645"],
 ["stone",.61,"#a88765"],["wood",.77,"#69543c"],
 ["wood",.74,"#74624a"],["iron",.72,"#45433d"],
 ["wood",.65,"#877454"],["stone",.67,"#7c827c"]
];
function buildRoadsideFence(x,z,w,d,lane,entrance,elbow,roadNodes){
 const [style,rise,paint]=villageFenceStyles[s.region],tint=color(paint);
 const edge=z+(lane>=z?1:-1)*(d*.5+1.85);
 if(Math.abs(lane-z)<d*.5+3.2)return [];
 const ends=[];
 const delta=elbow[1]-entrance[1];
 const cut=Math.abs(delta)>.01?(edge-entrance[1])/delta:-1;
 const gap=cut>=0&&cut<=1?lerp(entrance[0],elbow[0],cut):x;
 const low=x-w*.49,high=x+w*.49;
 for(const [left,right] of [[low,Math.min(high,gap-1.15)],[Math.max(low,gap+1.15),high]]){
  if(right-left<.8)continue;
  const count=Math.ceil((right-left)/(style==="stone"?1.15:1.7));
  for(let i=0;i<count;i++){
   const a=lerp(left,right,i/count),b=lerp(left,right,(i+1)/count),mid=(a+b)*.5;
   if([a,mid,b].some(x=>onVillageWalk(x,edge,.61))||roadDist(mid,edge)<3.5||roadNodes.some(([a,b])=>Math.hypot(a-mid,b-edge)<2.05))continue;
   const ya=terrainSurface(a,edge),yb=terrainSurface(b,edge);
   if(Math.abs(ya-yb)>.55||Math.min(ya,yb)<2.2)continue;
   if(style==="stone"){
    const y=Math.min(ya,yb)-.09, top=Math.max(ya,yb)+rise;
    box(mid,y,edge,b-a+.05,top-y,.38,tint,0,surface.foundation);
    box(mid,top-.07,edge,b-a+.09,.11,.45,shade(tint,1.09),0,surface.foundation);
   }else if(asagiPropsReady()&&style==="wood"&&Math.abs(ya-yb)<.19){
    addAsagiFence(a,ya,edge,b,yb,edge,rise,i===0,i===count-1);
   }else{
    const post=style==="iron"?.075:.13;
    box(a,ya-.06,edge,post,rise+.13,post,tint,0,style==="wood"?surface.wall:0);
    box(b,yb-.06,edge,post,rise+.13,post,tint,0,style==="wood"?surface.wall:0);
    for(const level of [.31,.85])
     tube([a,ya+rise*level,edge],[b,yb+rise*level,edge],post*.29,post*.29,tint,style==="wood"?surface.wall:0,4);
    if(style==="iron")for(let j=1;j<6;j++){
     const t=j/6,ground=lerp(ya,yb,t);
     box(lerp(a,b,t),ground+.13,edge,.026,rise-.085,.031,tint);
    }
   }
   if(i===0||i===count-1){if(i===0)ends.push([a,edge]);if(i===count-1)ends.push([b,edge]);}
   addSurface(mid,edge,b-a,style==="stone"?.39:.16,Math.min(ya,yb)-.12,
    at=>lerp(ya,yb,cap((at-a)/(b-a),0,1))+rise,false);
  }
 }
 return ends;
}

function linkVillageFences(ends,plots){
 const [style,rise,paint]=villageFenceStyles[s.region],tint=color(paint);
 const links=[],used=new Set();
 for(let i=0;i<ends.length;i++)for(let j=i+1;j<ends.length;j++){
  if(ends[i].lot===ends[j].lot)continue;
  const a=ends[i].p,b=ends[j].p,length=Math.hypot(a[0]-b[0],a[1]-b[1]);
  if(length>=.28&&length<=10.5)links.push({i,j,a,b,length});
 }
 const base=ends.length;
 for(let i=0;i<plots.length;i++)for(let j=i+1;j<plots.length;j++){
  const [x,z,w,d]=plots[i],[a,b,bw,bd]=plots[j];
  const distance=Math.hypot(a-x,b-z);
  if(distance<7||distance>23)continue;
  const dx=(a-x)/distance,dz=(b-z)/distance;
  const edge=(width,depth)=>Math.min(width*.5/(Math.abs(dx)||.001),depth*.5/(Math.abs(dz)||.001))+1.55;
  const left=edge(w,d),right=edge(bw,bd),length=distance-left-right;
  if(length<.8||length>13)continue;
  for(const offset of [0,2.8,-2.8]){
   links.push({i:base+i,j:base+j,a:[x+left*dx-dz*offset,z+left*dz+dx*offset],
    b:[a-right*dx-dz*offset,b-right*dz+dx*offset],length,shared:true});
  }
 }
 links.sort((a,b)=>Number(Boolean(a.shared))-Number(Boolean(b.shared))||a.length-b.length);
 for(const {i,j,a,b,length} of links){
  if(used.has(i)||used.has(j))continue;
  const count=Math.ceil(length/.93);
  const line=Array.from({length:count+1},(_,n)=>{
   const x=lerp(a[0],b[0],n/count),z=lerp(a[1],b[1],n/count);
   return [x,terrainSurface(x,z),z];
  });
  if(line.some(([x,y,z],n)=>onVillageWalk(x,z,.70)||roadDist(x,z)<3.3||
   (n>0&&n<count&&!villageRouteGround(x,z,.38))||y<2.2||(n&&Math.abs(y-line[n-1][1])>.43)))continue;
  for(let n=1;n<line.length;n++){
   const [x0,y0,z0]=line[n-1],[x1,y1,z1]=line[n],x=(x0+x1)*.5,z=(z0+z1)*.5;
   if(style==="stone"){
    const bottom=Math.min(y0,y1)-.09,top=Math.max(y0,y1)+rise;
    box(x,bottom,z,length/count+.055,top-bottom,.37,tint,-Math.atan2(z1-z0,x1-x0),surface.foundation);
   }else{
    const w=style==="iron"?.075:.13;
    box(x1,y1-.05,z1,w,rise+.12,w,tint,0,surface.wall);
    for(const h of [.31,.85])tube([x0,y0+rise*h,z0],[x1,y1+rise*h,z1],w*.31,w*.31,tint,surface.wall,4);
   }
   addSurface(x,z,Math.abs(x1-x0)+.19,Math.abs(z1-z0)+.19,Math.min(y0,y1)-.10,Math.max(y0,y1)+rise,false);
  }
  used.add(i);used.add(j);
 }
 return used.size/2;
}

function villageRouteGround(x,z,margin){
 const bridge=x>=asagiBridge.left-1&&x<=asagiBridge.right+1&&Math.abs(z-asagiBridge.z)<asagiBridge.width*.5-margin;
 if(!bridge&&riverDist(x,z)<channelWidth(z)+margin+1.4)return false;
 if(s.region===0){
  if(x>asagiRail.from&&x<asagiRail.to&&Math.abs(z-asagiRail.z)<margin+1.4&&roadDist(x,z)>2.2)return false;
  if(asagiPaddies.some(p=>Math.abs(z-p.z)<7.1&&Math.abs(x-p.x)<p.w*.5+margin&&paddyEdge(p,x,z)>-margin))return false;
 }
 return !buildingFootprints.some(p=>Math.abs(x-p.x)<(p.insideW??p.w)*.5+margin&&
  Math.abs(z-p.z)<(p.insideD??p.d)*.5+margin)&&
  (bridge||villageWalkableBand(x,z,margin));
}
function villageWalkableBand(x,z,margin){
 const padding=margin*.56;
 const offsets=padding>.1?[[0,0],[padding,0],[-padding,0],[0,padding],[0,-padding]]:[[0,0]];
 return offsets.every(([a,b])=>{
  const xx=x+a,zz=z+b;
  if(!sceneryCells.has(Math.floor(xx/cellSize)+","+Math.floor(zz/cellSize)))return true;
  return supportAt(xx,zz,terrainSurface(xx,zz))!==null;
 });
}

function connectVillageHomes(homes,lanes){
 if(!homes.length)return {nodes:[],connected:0,shortcuts:[],pockets:[]};
 const step=2.5,span=28,budget=s.region===1?140:125;
 const approaches=homes.map(p=>p.approach??[p.x,p.z+(p.insideD??p.d)*.5+1.2]);
 const left=Math.floor((Math.min(...approaches.map(p=>p[0]))-span)/step)*step;
 const top=Math.floor((Math.min(...approaches.map(p=>p[1]))-span)/step)*step;
 const cols=1+Math.ceil((Math.max(...approaches.map(p=>p[0]))+span-left)/step);
 const rows=1+Math.ceil((Math.max(...approaches.map(p=>p[1]))+span-top)/step);
 const size=cols*rows;
 const point=i=>[left+(i%cols)*step,top+Math.floor(i/cols)*step];
 const ground=new Float32Array(size),passable=new Uint8Array(size),preferred=new Uint8Array(size);
 for(let i=0;i<size;i++){
  const [x,z]=point(i);
  if(!approaches.some(([a,b])=>(x-a)**2+(z-b)**2<29**2)||!villageRouteGround(x,z,1.15))continue;
  ground[i]=terrainSurface(x,z);
  passable[i]=1;
  preferred[i]=roadDist(x,z)<2.8?1:0;
 }
 for(const points of lanes.values()){
  points.sort((a,b)=>a[0]-b[0]);
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
   if(length>39)continue;
   for(let d=0;d<=length;d+=step*.5){
    const col=Math.round((lerp(a[0],b[0],d/length)-left)/step);
    const row=Math.round((lerp(a[1],b[1],d/length)-top)/step);
    preferred[row*cols+col]=1;
   }
  }
 }
 const buckets=[],dist=new Uint32Array(size).fill(0xffffffff),parent=new Int32Array(size).fill(-1);
 const enqueue=(i,cost)=>{(buckets[cost]??=[]).push(i);dist[i]=cost;};
 const roots=[];
 for(let i=0;i<size;i++)if(passable[i]&&preferred[i]){
  const [x,z]=point(i);
  if(roadDist(x,z)<2.2)roots.push(i);
 }
 // Each neighborhood reaches a nearby existing road independently.
 for(const root of roots)enqueue(root,0);
 const directions=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
 const spreadRoadAccess=()=>{
 for(let cost=0;cost<buckets.length;cost++)for(const i of buckets[cost]??[]){
  if(dist[i]!==cost)continue;
  const col=i%cols,row=Math.floor(i/cols);
  for(const [dx,dz] of directions){
   if(col+dx<0||col+dx>=cols||row+dz<0||row+dz>=rows)continue;
   const next=i+dx+dz*cols;
   if(!passable[next]||(dx&&dz&&(!passable[i+dx]||!passable[i+dz*cols])))continue;
   const slope=Math.abs(ground[next]-ground[i]);
   if(slope>step*1.12)continue;
   const newCost=cost+(dx&&dz?14:10)+Math.round(slope*4)+(preferred[next]?0:5);
   if(newCost<=budget&&newCost<dist[next]){parent[next]=i;enqueue(next,newCost);}
  }
 }
 };
 spreadRoadAccess();
 // An isolated cluster keeps local lanes instead of a long cross-country spur.
 for(const [x,z] of approaches){
  const col=Math.round((x-left)/step),row=Math.round((z-top)/step);
  let local=-1,closest=Infinity,reachable=false;
  for(let dz=-4;dz<=4;dz++)for(let dx=-4;dx<=4;dx++){
   const i=(row+dz)*cols+col+dx;
   if(!passable[i])continue;
   const [a,b]=point(i),gap=Math.hypot(x-a,z-b);
   if(gap>10||![.25,.5,.75,1].every(t=>villageRouteGround(lerp(x,a,t),lerp(z,b,t),.24)))continue;
   if(dist[i]!==0xffffffff){reachable=true;break;}
   if(gap<closest){closest=gap;local=i;}
  }
  if(!reachable&&local>=0){buckets.length=0;enqueue(local,0);spreadRoadAccess();}
 }
 const used=new Set(),connected=[];
 for(const entry of approaches){
  const [x,z]=entry,col=Math.round((x-left)/step),row=Math.round((z-top)/step);
  let best=-1,bestScore=Infinity;
  for(let dz=-5;dz<=5;dz++)for(let dx=-5;dx<=5;dx++){
   const i=(row+dz)*cols+col+dx;
   if(!passable[i]||dist[i]===0xffffffff)continue;
   const [a,b]=point(i),score=Math.hypot(a-x,b-z)+(used.has(i)?0:1.1);
   if(score>=bestScore||![.25,.5,.75,1].every(t=>villageRouteGround(lerp(x,a,t),lerp(z,b,t),.24)))continue;
   best=i;bestScore=score;
  }
  if(best<0)continue;
  connected.push(best);
  villagePath(entry,point(best),1.42,true,true);
  for(let i=best;i>=0&&!used.has(i);i=parent[i])used.add(i);
 }
 const nodes=paveVillageNetwork(used,parent,point,new Set(connected));
 const crossings=addVillageCrossings(used,parent,point,homes);
 return {nodes,connected:connected.length,...crossings};
}

function paveVillageNetwork(used,parent,point,junctions){
 const adjacency=new Map([...used].map(i=>[i,[]]));
 for(const i of used)if(parent[i]>=0){
  adjacency.get(i).push(parent[i]);
  adjacency.get(parent[i]).push(i);
 }
 for(const [i,neighbors] of adjacency)if(neighbors.length!==2)junctions.add(i);
 const completed=new Set(),anchors=[];
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const between=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t)];
 const shortcut=(a,b)=>{
  const steps=Math.ceil(distance(a,b)/1.05);
  let last=terrainSurface(...a);
  for(let i=1;i<=steps;i++){
   const p=between(a,b,i/steps),y=terrainSurface(...p);
   if(!villageRouteGround(...p,1.07)||Math.abs(y-last)>1.1)return false;
   last=y;
  }
  return true;
 };
 const edge=(a,b)=>a<b?a+':'+b:b+':'+a;
 for(const start of junctions)for(const neighbor of adjacency.get(start)){
  if(completed.has(edge(start,neighbor)))continue;
  const points=[point(start)];
  let prev=start,i=neighbor;
  for(;;){
   completed.add(edge(prev,i));
   points.push(point(i));
   if(junctions.has(i))break;
   const next=adjacency.get(i).find(n=>n!==prev);
   prev=i;i=next;
  }
  const bends=[points[0]];
  for(let from=0;from<points.length-1;){
   let to=Math.min(from+8,points.length-1);
   while(to>from+1&&!shortcut(points[from],points[to]))to--;
   bends.push(points[to]);from=to;
  }
  const curve=[bends[0]];
  for(let j=1;j<bends.length-1;j++){
   const p=bends[j],a=bends[j-1],b=bends[j+1];
   const left=between(p,a,Math.min(.43,1.6/distance(p,a)));
   const right=between(p,b,Math.min(.43,1.6/distance(p,b)));
   if(!shortcut(left,right)){curve.push(p);continue;}
   for(let k=0;k<=4;k++){
    const t=k/4;
    curve.push(between(between(left,p,t),between(p,right,t),t));
   }
  }
  curve.push(bends.at(-1));
  const arc=[0];
  for(let j=1;j<curve.length;j++)arc.push(arc.at(-1)+distance(curve[j-1],curve[j]));
  const length=arc.at(-1);
  const at=t=>{
   const d=cap(t,0,1)*length;
   const end=arc.findIndex((k,j)=>j>0&&k>=d);
   return end<0?curve.at(-1):between(curve[end-1],curve[end],(d-arc[end-1])/(arc[end]-arc[end-1]));
  };
  villagePath(curve[0],curve.at(-1),s.region===1?2.72:2.32,true,true,{at,length});
  for(let j=0;j<=length;j+=2.8)anchors.push(at(j/length));
 }
 return anchors;
}

const wornPlotProfiles=[
 [11,4.8,.43],[13,5.5,.48],[15,4.1,.62],[11,5.2,.72],
 [13,4.7,.54],[10,5.2,.68],[13,5.8,.56],[10,4.2,.61]
];

function addWornVillageTrails(nodes,homes){
 if(!nodes.length)return [];
 const center=nodes.reduce(([x,z],[a,b])=>[x+a/nodes.length,z+b/nodes.length],[0,0]);
 const [length,spread,turn]=wornPlotProfiles[s.region];
 const soil=mix(color("#a28c6c"),color(villagePalette[s.region][0]),.42);
 const routes=[];
 const gap=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const candidates=[];
 for(let i=0;i<nodes.length;i++){
  const a=nodes[i],bearing=Math.atan2(a[1]-center[1],a[0]-center[0]);
  if(!homes.some(p=>Math.hypot(p.x-a[0],p.z-a[1])<29))continue;
  if(i%2&&nodes.length>80)continue;
  for(const offset of [-1.17,-.58,0,.58,1.17]){
   const angle=bearing+offset,dx=Math.cos(angle),dz=Math.sin(angle);
   const span=12+((i*11+s.region*7)%11),bias=((i%3)-1)*.9;
   const bend=turn*(i%2?1:-1)*span*.34;
   const at=t=>{
    const sway=Math.sin(t*2.85)*bend+Math.sin(t*8.1+i*.79)*t*.86+bias*t;
    return [a[0]+dx*span*t-dz*sway,a[1]+dz*span*t+dx*sway];
   };
   const end=at(1);
   const sampleCount=Math.ceil(span/.20);
   const samples=Array.from({length:sampleCount},(_,j)=>at((j+1)/sampleCount));
   if(!samples.every(([x,z],j)=>villageRouteGround(x,z,.8)&&height(x,z)>2.65&&
    (j===0||Math.abs(terrainSurface(x,z)-terrainSurface(...samples[j-1]))<.23)))continue;
   if(samples.some(([x,z],j)=>{
    const prior=j?samples[j-1]:a;
    const y=terrainSurface(...prior),floor=terrainSurface(x,z);
    for(const side of [-.26,0,.26]){
     const support=supportAt(x-dz*side,z+dx*side,y);
     if(support===null||support>floor+.22)return true;
    }
    return false;
   }))continue;
   if(samples.some((p,j)=>j>sampleCount*.30&&j%8===0&&nodes.some(q=>gap(p,q)<3)))continue;
   const yardCenter=at(.79),yardElevation=terrainSurface(...yardCenter);
   const yardOK=[.64,.77,.9].every(t=>[-1,0,1].every(side=>{
    const p=at(t),x=p[0]-dz*spread*.66*side,z=p[1]+dx*spread*.66*side;
    return villageRouteGround(x,z,1.15)&&Math.abs(terrainSurface(x,z)-yardElevation)<1.6&&roadDist(x,z)>4;
   }));
   candidates.push({a,at,end,span,yardOK,score:span+Math.cos(offset)*6});
  }
 }
 candidates.sort((a,b)=>b.score-a.score);
 for(const separation of [14,9,5]){
  for(const route of candidates){
   if(routes.length>=4)break;
   const clearing=routes.length<4;
   if((clearing&&!route.yardOK)||routes.some(r=>gap(route.a,r.a)<separation||gap(route.end,r.end)<12||
    gap(route.at(.45),r.at(.45))<6))continue;
   routes.push({...route,clearing});
  }
 }
 for(const [i,route] of routes.entries()){
  const {at,span,clearing}=route;
  const taper=clearing?(i<2?1:.72):0;
  const sign=i%2?1:-1;
  const shape=(s.region+i*3)%5;
  const profile=(t,side)=>{
   const local=(t-(.76+sign*side*(.018+shape*.009)))*span/length;
   const phase=cap(.5+local*(local<0?1.15+shape*.18:1.02+(4-shape)*.21),0,1);
   const shoulders=Math.sin(Math.PI*phase)**(.8+shape*.48);
   const wornEdge=.9+.075*Math.sin(t*39+side*2+i)+.032*Math.sin(t*71+s.region);
   const width=shoulders*spread*taper*(.48+side*sign*.16)*wornEdge;
   return (.40+Math.sin(t*13+i)*.062+width)*cap((1-t)*12,.12,1);
  };
  const slices=Math.ceil(span/.30);
  const point=(t,side,lift)=>{
   const [x,z]=at(t),[ax,az]=at(t-.001),[bx,bz]=at(t+.001);
   const length=Math.hypot(bx-ax,bz-az),width=profile(t,Math.sign(side))*side;
   const a=x+(bz-az)/length*width,b=z-(bx-ax)/length*width;
   return [a,terrainSurface(a,b)+lift,b];
  };
  for(let j=0;j<slices;j++){
   const t=j/slices,u=(j+1)/slices;
   const tint=shade(soil,.94+.034*Math.sin(j*.83+i)+.024*Math.sin(j*.37));
   const mid=at((t+u)*.5);
   if(j%2===0)markVillageWalk(...mid,Math.max(.32,(profile(t,1)+profile(t,-1))*.37));
   for(const side of [-1,1]){
    const bands=Math.ceil(profile(t,side)/.36);
    for(let band=0;band<bands;band++){
     const lo=side*.82*band/bands,hi=side*.82*(band+1)/bands;
     const points=[point(t,lo,.057),point(t,hi,.057),point(u,hi,.057),point(u,lo,.057)];
     if(side===1)points.reverse();
     quad(...points,tint,surface.ground);
    }
    const f=point(t,side*(.93+.17*Math.sin(j*1.53+i)),.019);
    const g=point(u,side*(.93+.17*Math.sin((j+1)*1.53+i)),.019);
    const fringe=[point(t,side*.82,.057),f,g,point(u,side*.82,.057)];
    if(side===1)fringe.reverse();
    quad(...fringe,shade(tint,.91),surface.ground);
   }
  }
 }
 return routes;
}

const villageWalkCells=new Map();
const villageWalkCellSize=4;
function markVillageWalk(x,z,radius){
 const cell=villageWalkCellSize;
 for(let row=Math.floor((z-radius)/cell);row<=Math.floor((z+radius)/cell);row++){
  for(let col=Math.floor((x-radius)/cell);col<=Math.floor((x+radius)/cell);col++){
   const key=col+":"+row;
   if(!villageWalkCells.has(key))villageWalkCells.set(key,[]);
   villageWalkCells.get(key).push([x,z,radius]);
  }
 }
}
function onVillageWalk(x,z,margin=0){
 const cell=villageWalkCellSize;
 for(let row=Math.floor((z-margin)/cell);row<=Math.floor((z+margin)/cell);row++){
  for(let col=Math.floor((x-margin)/cell);col<=Math.floor((x+margin)/cell);col++){
   if((villageWalkCells.get(col+":"+row)??[]).some(([a,b,radius])=>
    (x-a)**2+(z-b)**2<(radius+margin)**2))return true;
  }
 }
 return false;
}

function addVillageCrossings(used,parent,point,homes){
 const nodes=[...used].map(i=>({i,p:point(i),degree:0}));
 const byId=new Map(nodes.map(n=>[n.i,n]));
 for(const n of nodes)if(parent[n.i]>=0){n.degree++;byId.get(parent[n.i]).degree++;}
 const nearHouse=([x,z])=>homes.some(h=>Math.hypot(x-h.x,z-h.z)<16);
 const gap=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const at=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t)];
 const trace=(from,to)=>{
  const left=new Map();
  let n=from,dist=0;
  while(n>=0){left.set(n,dist);const next=parent[n];if(next<0)break;dist+=gap(point(n),point(next));n=next;}
  n=to;dist=0;
  while(!left.has(n)){const next=parent[n];if(next<0)return Infinity;dist+=gap(point(n),point(next));n=next;}
  return dist+left.get(n);
 };
 const candidates=[];
 for(let j=0;j<nodes.length;j++){
  const a=nodes[j];
  if(a.degree>2||!nearHouse(a.p)||!onVillageWalk(...a.p))continue;
  for(let k=j+1;k<nodes.length;k++){
   const b=nodes[k],length=gap(a.p,b.p);
   if(b.degree>2||length<6||length>19||!nearHouse(b.p)||!onVillageWalk(...b.p))continue;
   const midpoint=at(a.p,b.p,.5);
   if(!nearHouse(midpoint)||[.31,.5,.69].some(t=>onVillageWalk(...at(a.p,b.p,t))))continue;
   const saved=Math.min(42,trace(a.i,b.i)-length);
   if(saved<Math.max(6,length*.55))continue;
   const dx=(b.p[0]-a.p[0])/length,dz=(b.p[1]-a.p[1])/length;
   const bend=((a.i+b.i)%2?1:-1)*Math.min(1.35,length*.055);
   const curve=t=>[lerp(a.p[0],b.p[0],t)-dz*Math.sin(Math.PI*t)*bend,
    lerp(a.p[1],b.p[1],t)+dx*Math.sin(Math.PI*t)*bend];
   let last=terrainSurface(...a.p),clear=true;
   const steps=Math.ceil(length/.55);
   for(let l=1;l<=steps;l++){
    const p=curve(l/steps),y=terrainSurface(...p);
    if(!villageRouteGround(...p,1.04)||onAsagiBridge(...p)||Math.abs(y-last)>.36||
     supportAt(p[0],p[1],last)===null){clear=false;break;}
    last=y;
   }
   if(clear)candidates.push({a,b,length,curve,dx,dz,midpoint,saved});
  }
 }
 candidates.sort((a,b)=>b.saved-a.saved);
 const selected=[];
 for(const next of candidates){
  if(selected.some(p=>gap(p.midpoint,next.midpoint)<9||
   [p.a.p,p.b.p].some(end=>gap(end,next.a.p)<3.1||gap(end,next.b.p)<3.1)))continue;
  selected.push(next);
  if(selected.length===(s.region===1?10:6))break;
 }
 const pockets=[];
 for(const {a,b,length,curve} of selected)villagePath(a.p,b.p,1.78,true,true,{at:curve,length});
 for(const shortcut of selected){
  if(pockets.length>=(s.region===1?3:2)||pockets.some(p=>gap(p.center,shortcut.midpoint)<15))continue;
  const pocket=addVillagePocket(shortcut,pockets.length);
  if(pocket)pockets.push(pocket);
 }
 return {shortcuts:selected,pockets};
}

function addVillagePocket({curve,dx,dz,length},serial){
 const center=curve(.51),y=terrainSurface(...center);
 const maru=[0,5,6].includes(s.region)||(s.region===1&&serial===1);
 const coords=(u,v)=>[center[0]+dx*u-dz*v,center[1]+dz*u+dx*v];
 const clean=(u,v)=>{
  const p=coords(u,v);
  return villageRouteGround(...p,.66)&&Math.abs(terrainSurface(...p)-y)<.74&&
   supportAt(p[0],p[1],terrainSurface(...p))!==null;
 };
 const side=[1,-1].find(sign=>[-2.7,-1.35,0,1.35,2.7].every(u=>[.85,1.65,2.45].every(v=>clean(u,v*sign))));
 if(!side)return null;
 const wood=color(villagePalette[s.region][1]),stone=color(villagePalette[s.region][0]);
 const point=(u,v,lift)=>{
  const [x,z]=coords(u,v*side);
  return [x,terrainSurface(x,z)+lift,z];
 };
 const seat=coords(.38,side*2.27),sy=terrainSurface(...seat),angle=-Math.atan2(dz,dx);
 const placeBench=!onVillageWalk(...seat,1.02);
 const top=maru?.093:.065;
 const shelterPosts=[[-1.45,2.75],[1.45,2.75],[-1.45,3.78],[1.45,3.78]].map(([u,v])=>coords(u,v*side));
 if(shelterPosts.every(([x,z])=>villageRouteGround(x,z,.55)&&!onVillageWalk(x,z,.76)&&Math.abs(terrainSurface(x,z)-y)<.62)){
  const roofY=Math.max(...shelterPosts.map(p=>terrainSurface(...p)))+2.38;
  const roof=maru?shade(wood,.73):color(villagePalette[s.region][3]);
  for(const [x,z] of shelterPosts){
   const base=terrainSurface(x,z);
   box(x,base,z,.115,roofY-base,.115,wood,0,surface.wall);
   addSurface(x,z,.12,.12,base,roofY,false);
  }
  const roofPoint=(u,v,rise)=>{const [x,z]=coords(u,v*side);return [x,roofY+rise,z];};
  quad(roofPoint(-1.71,2.49,0),roofPoint(1.71,2.49,0),roofPoint(1.71,3.91,.34),roofPoint(-1.71,3.91,.34),roof,surface.roof);
 }

 const step=maru?.26:.39;
 for(let u=-2.7;u<2.7;u+=step){
  const edge=2.08-.28*(u/2.7)**2;
  const end=Math.min(2.7,u+step-.018);
  const cells=maru?[.48,1,1.48,edge]:[.48,.88,1.24,1.62,edge];
  for(let j=1;j<cells.length;j++){
   const a=cells[j-1],b=cells[j];
   const quadPoints=[point(u,b,top),point(u,a,top),point(end,a,top),point(end,b,top)];
   if(side>0)quadPoints.reverse();
   quad(...quadPoints,shade(maru?wood:stone,.93+.10*Math.sin(u*7+j*.76)),maru?68:surface.paving);
  }
  const [x,z]=coords(u,side*1.22);
  markVillageWalk(x,z,.96);
 }
 if(placeBench){
 const furniture=maru?wood:color("#75664e");
 for(const u of [-.55,.55]){
  const [x,z]=coords(.38+u,side*2.27);
  box(x,terrainSurface(x,z),z,.17,.40,.23,shade(furniture,.79),angle,surface.wall);
 }
 box(seat[0],sy+.39,seat[1],1.46,.105,.42,furniture,angle,surface.wall);
 addSurface(seat[0],seat[1],Math.abs(dx)*1.46+Math.abs(dz)*.42,Math.abs(dz)*1.46+Math.abs(dx)*.42,sy,sy+.49,false);
 }
 if(!maru){
  for(const u of [-2.05,2.03]){
   const [x,z]=coords(u,side*2.07),base=terrainSurface(x,z);
   tube([x,base,z],[x,base+.22,z],.34,.43,stone,surface.masonry,10);
   rounded(x,base+.31,z,.32,.24,.29,shade(color("#79855b"),.92+serial*.07),surface.foliage);
  }
 }
 return {center,maru,entry:curve(Math.max(0,.51-3.1/length)),exit:curve(Math.min(1,.51+3.1/length))};
}

let namedResidentRoutes={};
const memoryCastPreview=new URLSearchParams(location.search).get("castPreview")==="grandmother";

function characterRoute(spot){
 for(const [dx,dz] of [[1,0],[0,1],[.707,.707],[.707,-.707]]){
  for(const offset of [2,4,-2,-4,6,-6]){
   const points=[];
   for(let i=0;i<=24;i++){
    const along=(i-12)*.32;
    const x=spot.x+along*dx-offset*dz, z=spot.y+along*dz+offset*dx;
    const grade=terrainSurface(x,z), y=supportAt(x,z,grade+.7);
    const inside=buildingFootprints.some(b=>Math.abs(x-b.x)<b.w*.5+.65&&Math.abs(z-b.z)<b.d*.5+.65);
    if(y===null||inside||points.length&&Math.abs(y-points.at(-1)[1])>.20)break;
    points.push([x,y,z]);
   }
   if(points.length===25)return {points,speed:.000135,phase:.32};
  }
 }
 return townResidents.reduce((closest,next)=>{
  const distance=route=>Math.hypot(route.points[0][0]-spot.x,route.points[0][2]-spot.y);
  return !closest||distance(next)<distance(closest)?next:closest;
 },null);
}

function planResidents(city,pockets){
 const routes=city?[
  [[104,119.3],[126,119.3]],[[110,128],[140,128]],[[133,122],[154,122]],
  [[388.8,203],[458.3,203]],[[388.8,201.3],[458.3,201.3]],
  [[473,212],[498,237]],[[493,205],[503,181]],
  [[canalCenter(251)+17,251],[canalCenter(258)+17,258]],
  [[canalCenter(231)+18,231],[canalCenter(240)+18,240]]
 ]:[];
 const mainCount=routes.length;
 for(const p of pockets)routes.push([p.entry,p.exit]);
 townResidents=routes.flatMap(([a,b],route)=>{
  const points=[];
  let prior=null;
  for(let i=0;i<=48;i++){
   const x=lerp(a[0],b[0],i/48),z=lerp(a[1],b[1],i/48);
   const ground=terrainSurface(x,z);
   const onBridge=city&&(route===3||route===4);
   const from=onBridge?lerp(terrainSurface(388,203),terrainSurface(459,203),(x-388)/71)+.18:prior??ground;
   const y=supportAt(x,z,from);
   if(y===null){if(points.length>=8)break;points.length=0;prior=null;continue}
   points.push([x,y,z]);prior=y;
  }
  if(points.length<8)return [];
  return Array.from({length:route>=mainCount?1:route<5?4:2},(_,i)=>({points,phase:i*.29+route*.071,style:(i+route+s.region)%3,speed:route>=mainCount?.00014:.000023}));
 });
 namedResidentRoutes={};
 if(s.region===0){
  namedResidentRoutes.sae=characterRoute(here("field"));
  if(memoryCastPreview)namedResidentRoutes.grandmother=characterRoute(here("home"));
 }else if(s.region===1)namedResidentRoutes.elise=characterRoute(here("station"));
}
function drawTownResidents(mesh,time,eye){
 if(!townResidents.length)return;
 if(!residentMeshes){
  const old=verts;
  residentMeshes=["#66736a","#7d5740","#50566c"].map((coat,i)=>{
   verts=[];
   const wool=color(coat),skin=color(i===1?"#a37e64":"#c09875"),pants=color("#3f3b37"),boots=color("#292621");
   for(const side of [-1,1]){
    rounded(side*.106,.42,0,.085,.40,.087,pants,76);
    rounded(side*.106,.08,.05,.091,.075,.126,boots,76);
    rounded(side*.253,1.21,0,.077,.255,.087,wool,77);
    rounded(side*.267,.96,.013,.062,.078,.063,skin,77);
   }
   rounded(0,1.16,0,.224,.35,.145,wool);
   rounded(0,1.61,.015,.110,.146,.111,skin);
   rounded(0,1.72,0,.181,.027,.146,boots);
   rounded(0,1.77,0,.116,.073,.101,i===2?wool:boots);
   const buffer=gl.createBuffer(),count=verts.length/10;
   upload(buffer);
   return {buffer,count};
  });
  verts=old;
 }
 for(const resident of townResidents){
  const path=resident.points,travel=(time*resident.speed+resident.phase)%2,reverse=travel>=1;
  const cursor=(reverse?2-travel:travel)*(path.length-1);
  const step=Math.min(path.length-2,Math.floor(cursor)),a=path[step],b=path[step+1];
  const position=mix(a,b,cursor-step);
  if(Math.hypot(position[0]-eye[0],position[2]-eye[2])>(renderQuality===0?47:94))continue;
  const facing=Math.atan2(b[0]-a[0],b[2]-a[2])+(reverse?Math.PI:0);
  const actor=residentMeshes[resident.style];
  mesh(actor.buffer,actor.count,position,facing);
 }
}

function asagiPropsReady(){
 return Boolean(riggedScene?.asagiPropsReady);
}
function addAsagiProp(name,x,y,z,w,h,d,yaw=0,tilt=0,style){
 if(villageFrame){
  [x,z]=villagePoint(x,z);
  yaw-=Math.atan2(villageFrame.s,villageFrame.c);
 }
 return riggedScene?.addAsagiProp(name,x,y,z,w,h,d,yaw,tilt,style);
}
function addAsagiFence(x0,y0,z0,x1,y1,z1,rise,start,end){
 const span=Math.hypot(x1-x0,z1-z0),yaw=-Math.atan2(z1-z0,x1-x0);
 const margin=Math.min(.24,span*.22),height=rise+.12;
 const tilt=Math.atan2(y1-y0,span);
 addAsagiProp("wood-fence-panel",(x0+x1)*.5,(y0+y1)*.5+rise*.22,(z0+z1)*.5,span-.09,rise*.67,.15,yaw,tilt);
 if(start)addAsagiProp("wood-fence-end",lerp(x0,x1,margin/span),y0-.05,lerp(z0,z1,margin/span),margin*2,height,.20,yaw+Math.PI);
 else addAsagiProp("wood-fence-post",x0,y0-.05,z0,.15,height,.15);
 if(end)addAsagiProp("wood-fence-end",lerp(x1,x0,margin/span),y1-.05,lerp(z1,z0,margin/span),margin*2,height,.20,yaw);
}
