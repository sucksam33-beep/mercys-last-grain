"use strict";
let trailNavigation=null, trailNavigationGraph=null;
const trailDestinationKinds={village:"마을",gather:"채집터",view:"전망 쉼터",wildlife:"야생동물 서식지"};
const navigationGap=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const navigationKey=(region,[x,z])=>region+":"+Math.round(x*100)+":"+Math.round(z*100);

function buildTrailNavigationGraph(){
 if(trailNavigationGraph)return trailNavigationGraph;
 const byKey=new Map(),regionsNodes=Array.from({length:8},()=>[]),nodes=[];
 function node(region,p){
  const key=navigationKey(region,p);
  if(byKey.has(key))return byKey.get(key);
  const item={id:nodes.length,region,p,edges:[]};
  nodes.push(item);regionsNodes[region].push(item);byKey.set(key,item);
  return item;
 }
 function connect(a,b,cost){
  if(a===b)return;
  a.edges.push({to:b,cost});b.edges.push({to:a,cost});
 }
 function line(region,points,weight){
  for(let i=1;i<points.length;i++){
   const a=node(region,points[i-1]),b=node(region,points[i]);
   connect(a,b,navigationGap(a.p,b.p)*weight);
  }
 }
 for(let r=0;r<8;r++){
  worldRoadGrades(r);
  for(const p of allDirtTrailRoutes(r))line(r,p,1);
  for(const {a,b} of trailConnections[r].bridges)line(r,[a,b],1);
  for(const road of worldRoads[r])line(r,road.samples.map(({x,z})=>[x,z]),1.10);
 }
 for(let r=0;r<8;r++)for(const road of worldRoads[r]){
  if(r>road.to)continue;
  const back=worldRoads[road.to].find(other=>other.to===r);
  if(back)connect(node(r,road.edge),node(road.to,back.edge),1);
 }
 for(const [region,entries] of wildlifeAtlasData.entries())for(const {connection,path} of entries){
  const start=byKey.get(navigationKey(region,connection));
  if(!start)continue;
  const spur=[start.p];
  for(const goal of path){
   const from=spur.at(-1),steps=Math.max(1,Math.ceil(navigationGap(from,goal)/12));
   for(let i=1;i<steps;i++)spur.push([lerp(from[0],goal[0],i/steps),lerp(from[1],goal[1],i/steps)]);
   spur.push(goal);
  }
  line(region,spur,1.25);
 }
 return trailNavigationGraph={byKey,regionsNodes,nodes};
}
function trailNavigationDistances(destination,graph){
 const end=graph.byKey.get(navigationKey(destination.region,destination.point));
 if(!end)return null;
 const distance=new Float64Array(graph.nodes.length).fill(Infinity),next=[];
 const queue=[end];
 distance[end.id]=0;
 while(queue.length){
  let best=0;
  for(let i=1;i<queue.length;i++)if(distance[queue[i].id]<distance[queue[best].id])best=i;
  const current=queue[best];
  queue[best]=queue.at(-1);queue.pop();
  for(const {to,cost} of current.edges){
   const d=distance[current.id]+cost;
   if(d>=distance[to.id])continue;
   distance[to.id]=d;next[to.id]=current;
   if(!queue.includes(to))queue.push(to);
  }
 }
 return {distance,next,end};
}
function trailNavigationPlan(destination,existing){
 const graph=buildTrailNavigationGraph(),tree=existing??trailNavigationDistances(destination,graph);
 if(!tree)return null;
 const start=[player.x,player.y],from={x:player.x,y:player.y,floor:playerSupport()};
 const candidates=graph.regionsNodes[s.region].filter(n=>Number.isFinite(tree.distance[n.id]))
  .map(n=>({n,gap:navigationGap(start,n.p)})).sort((a,b)=>a.gap-b.gap);
 let first=null,approach=null,best=Infinity;
 // Only the walk from the player to the trail uses the free-terrain collision check.
 for(const {n,gap} of candidates.slice(0,24)){
  if(gap>105||gap>Math.max(22,(approach?.gap??Infinity)+8))break;
  const cost=gap*2.1+tree.distance[n.id];
  if(cost>=best||unobstructed(from,{x:n.p[0],y:n.p[1]})===null)continue;
  first=n;approach={gap,points:[]};best=cost;
 }
 if(!first)for(const {n,gap} of candidates.slice(0,2)){
  if(gap>48)break;
  const path=detourTo({x:n.p[0],y:n.p[1]});
  if(!path)continue;
  first=n;approach={gap,points:path.slice(0,-1).map(({x,y})=>[x,y])};break;
 }
 if(!first)return null;
 const legs=[{region:s.region,points:[start,...approach.points],index:1}];
 for(let n=first;n;n=tree.next[n.id]){
  let leg=legs.at(-1);
  if(leg.region!==n.region){
   leg={region:n.region,points:[],index:0};legs.push(leg);
  }
  leg.points.push(n.p);
 }
 return {destination,tree,legs,leg:0,lastSearch:simulationTime};
}
function startTrailNavigation(destination){
 ensureWorld();
 const route=trailNavigationPlan(destination);
 if(!route)return false;
 trailNavigation=route;timberGuide=null;marker=target=null;stopMoving();
 log(destination.name+" · 도보 안내를 시작했다.","success");
 return true;
}
function updateTrailNavigation(){
 const guide=trailNavigation;
 if(!guide)return;
 let leg=guide.legs[guide.leg];
 if(leg.region!==s.region){
  const next=guide.legs[guide.leg+1];
  if(next?.region===s.region){guide.leg++;leg=next;}
  else if(simulationTime-guide.lastSearch>350){
   guide.lastSearch=simulationTime;
   const route=trailNavigationPlan(guide.destination,guide.tree);
   if(route)trailNavigation=route;
   return;
  }else return;
 }
 const p=[player.x,player.y];
 if(s.region===guide.destination.region&&navigationGap(p,guide.destination.point)<3.6){
  trailNavigation=null;log(guide.destination.name+"에 도착했다.","success");return;
 }
 while(leg.index<leg.points.length-1&&navigationGap(p,leg.points[leg.index])<3.8)leg.index++;
 if(leg.index<leg.points.length-2){
  const before=leg.points[Math.max(0,leg.index-1)],point=leg.points[leg.index],after=leg.points[leg.index+1];
  const dx=after[0]-point[0],dz=after[1]-point[1],length=dx*dx+dz*dz;
  const t=length?((p[0]-point[0])*dx+(p[1]-point[1])*dz)/length:0;
  if(t>0&&t<1&&navigationGap(p,[point[0]+t*dx,point[1]+t*dz])<2.4&&navigationGap(p,before)>3.8)leg.index++;
 }
 if(simulationTime-guide.lastSearch<850)return;
 guide.lastSearch=simulationTime;
 const near=leg.points.slice(Math.max(0,leg.index-1),leg.index+4);
 if(near.length&&pathDistance(p[0],p[1],near)>17&&near.every(q=>navigationGap(p,q)>17)){
  const route=trailNavigationPlan(guide.destination,guide.tree);
  if(route)trailNavigation=route;
 }
}
function paintTrailNavigation(ctx,stroke,scale){
 const guide=trailNavigation,leg=guide?.legs[guide.leg];
 if(!leg||leg.region!==s.region)return;
 const start=[player.x,player.y],remaining=leg.points.slice(leg.index);
 if(remaining.length){
  const last=leg.points[Math.max(0,leg.index-1)],next=remaining[0];
  const dx=next[0]-last[0],dz=next[1]-last[1],sq=dx*dx+dz*dz;
  const t=sq?cap(((start[0]-last[0])*dx+(start[1]-last[1])*dz)/sq,0,1):0;
  const points=[[last[0]+t*dx,last[1]+t*dz],...remaining];
  ctx.save();ctx.lineJoin=ctx.lineCap="round";
  stroke(points,"#28382e",5.6);stroke(points,"#fff28d",3);
  ctx.restore();
 }
 const goal=leg.points.at(-1),dx=(goal[0]-start[0])*scale,dz=(goal[1]-start[1])*scale;
 const fraction=Math.min(1,57/Math.max(1,Math.hypot(dx,dz)));
 const x=72+dx*fraction,z=72+dz*fraction;
 ctx.beginPath();ctx.arc(x,z,4,0,Math.PI*2);
 ctx.fillStyle="#fff28d";ctx.fill();ctx.strokeStyle="#28382e";ctx.lineWidth=1.5;ctx.stroke();
}

function mountTrailDestinations(body,atlas,tip){
 const panel=document.createElement("div");panel.className="trail-navigation-panel";
 const status=document.createElement("p");
 status.className="trail-navigation-status";status.setAttribute("role","status");
 status.textContent=trailNavigation?"따라가는 길 · "+trailNavigation.destination.name:"마을, 채집터, 전망 쉼터, 야생동물 서식지 중 목적지를 고르세요.";
 const regionSelect=document.createElement("select"),kindSelect=document.createElement("select"),destSelect=document.createElement("select");
 regionSelect.setAttribute("aria-label","목적지 지역");kindSelect.setAttribute("aria-label","목적지 종류");destSelect.setAttribute("aria-label","도보 목적지");
 const option=(select,label,value)=>select.add(new Option(label,value));
 regions.forEach((r,i)=>option(regionSelect,r.name,i));
 for(const [kind,label] of Object.entries(trailDestinationKinds))option(kindSelect,label,kind);
 regionSelect.value=trailNavigation?.destination.region??s.region;
 if(trailNavigation)kindSelect.value=trailNavigation.destination.kind;
 const pins=[];
 const choose=destination=>{
  if(!destination)return;
  if(!startTrailNavigation(destination)){
   status.textContent="여기서 연결되는 길을 찾지 못했습니다. 가까운 길로 이동한 뒤 다시 선택하세요.";
   return;
  }
  $("dialog").close();
  drawRadar();
 };
 const controls=document.createElement("div");controls.className="trail-navigation-controls";
 controls.append(regionSelect,kindSelect,destSelect);
 const start=button(controls,"이 길 따라가기",()=>{
  const region=+regionSelect.value;
  if(kindSelect.value==="wildlife"){choose(wildlifeDestination(region,+destSelect.value));return;}
  const destination=trailConnections[region].destinations[destSelect.value];
  if(destination)choose({...destination,region});
 },true);
 if(trailNavigation)button(controls,"길 안내 접기",()=>{trailNavigation=null;status.textContent="도보 안내를 종료했습니다.";drawRadar();});
 atlasHeading(panel,"h3","걸어서 잇는 길");
 panel.append(status,controls);body.insertBefore(panel,atlas);
 const showWildlife=wildlifeAtlasLayer(atlas,{west:4,north:12,width:1896,height:1200},
  wildlifeAtlasData.flatMap((entries,region)=>{
   const [col,row]=openWorldTiles[region];
   return entries.map((_,index)=>({region,index,offsetX:col*632,offsetZ:row*400}));
  }),(_,index)=>{destSelect.value=index;showWildlife(+regionSelect.value,index);});
 const sync=()=>{
  const region=+regionSelect.value,rows=trailConnections[region].destinations;
  const available=new Set([...rows.map(d=>d.kind),"wildlife"]);
  for(const option of kindSelect.options)option.disabled=!available.has(option.value);
  if(!available.has(kindSelect.value))kindSelect.value=available.values().next().value??"";
  const kind=kindSelect.value;
  destSelect.replaceChildren();
  trailConnections[region].destinations.forEach((d,i)=>{
   if(d.kind===kind)option(destSelect,d.name+(d.kind==="view"?" "+(i+1):""),i);
  });
  if(kind==="wildlife"){
   regions[region].animals.forEach((name,index)=>option(destSelect,name+" 서식지",index));
   if(trailNavigation?.destination.region===region&&trailNavigation.destination.kind==="wildlife")destSelect.value=trailNavigation.destination.index;
  }
  showWildlife(kind==="wildlife"?region:-1,+destSelect.value);
  start.disabled=!destSelect.options.length;
  for(const pin of pins)pin.hidden=+pin.dataset.region!==region||pin.dataset.kind!==kind;
 };
 regionSelect.onchange=kindSelect.onchange=sync;
 destSelect.onchange=()=>showWildlife(kindSelect.value==="wildlife"?+regionSelect.value:-1,+destSelect.value);
 for(const row of trailConnections)for(const [i,d] of row.destinations.entries()){
  const [col,gridRow]=openWorldTiles[row.region],pin=document.createElement("button");
  pin.type="button";pin.className="trail-destination-pin";
  pin.dataset.region=row.region;pin.dataset.kind=d.kind;pin.dataset.destination=i;
  pin.append(atlasIcon(d.kind==="village"?"home":d.kind==="gather"?"wood":"spot"));
  pin.style.left=(col*632+d.point[0]-4)/1896*100+"%";
  pin.style.top=(gridRow*400+d.point[1]-12)/1200*100+"%";
  connectAtlasTooltip(pin,tip,d.name,trailDestinationKinds[d.kind]);
  pin.onclick=()=>choose({...d,region:row.region});
  pins.push(pin);atlas.append(pin);
 }
 sync();
}
