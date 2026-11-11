"use strict";
const hammerStep=2.4,hammerGrid=hammerStep/3;
const estateWorkbenchId="estate-workbench",estateRadius=24;
const hammerGroups={estate:"거점",walls:"벽·문·창",roofs:"지붕·바닥",interiors:"설비·장식"};
// Width, height, depth, placement type, and material cost.
const hammerDimensions={
 "estate-workbench":[2.25,2.94,1.22,"estate","일반 목재",4],
 "plain-wall":[2.4,2.4,.22,"wall"],"half-wall":[2.4,1.2,.22,"wall"],"window-wall":[2.4,2.4,.22,"wall"],
 "doorway-wall":[2.4,2.4,.22,"wall"],"stone-arch":[2.4,2.4,.4,"wall","사암",3],"gable":[2.4,1.2,.24,"gable"],
 "partition":[2.4,2.4,.16,"wall"],"hinged-door":[1.15,2.03,.12,"door"],"sliding-door":[1.15,2.03,.12,"door"],
 "double-door":[1.16,2.03,.12,"door"],"lattice-window":[1.14,.83,.12,"window"],"shutter":[1.14,.83,.12,"window"],
 "wind-screen":[1.14,.83,.10,"window","무두질 산토끼 가죽",1],
 "flat-roof":[2.4,.25,2.4,"roof"],"shed-roof":[2.4,1.25,2.4,"roof"],"gable-roof":[2.4,1.25,2.4,"roof"],
 "corner-roof":[2.4,1.25,2.4,"roof"],"ridge":[2.4,.21,.55,"ridge"],"eave":[2.4,.25,.55,"gable"],
 "entry-awning":[2.4,2.42,1.4,"ground"],"floor":[2.4,.20,2.4,"floor"],"plinth":[2.4,.37,2.4,"floor","화강암",3],
 "raised-support":[2.4,1.20,2.4,"floor"],"post":[.24,2.4,.24,"post"],"beam":[2.4,.24,.24,"gable"],
 "stairs":[1.2,1.2,2.4,"stairs"],"ramp":[1.2,1.2,2.4,"ramp"],"ladder":[.65,2.4,.42,"ground"],
 "built-in-shelf":[1.1,1.1,.35,"fixture"],"wall-storage":[1.13,.67,.24,"fixture"],"workbench":[1.35,.96,.62,"ground"],
 "hearth":[1.25,1.6,.8,"ground","화강암",4],"bench":[1.4,.5,.48,"ground"],"lantern-bracket":[.49,.60,.35,"fixture"],
 "window-trim":[1.24,.92,.12,"window"],"corner-trim":[.53,.65,.16,"fixture"],"wall-band":[2.38,.26,.08,"fixture"],
 "leather-hanging":[.94,.92,.11,"fixture","무두질 산토끼 가죽",1],"leather-awning":[1.45,.65,.83,"fixture","무두질 산토끼 가죽",2],
 "curtain":[1.15,.88,.15,"window"],"reed-screen":[1.35,1.64,.16,"ground"],"sign":[.65,.71,.37,"fixture"],"planter":[.91,.47,.36,"fixture"]
};
const hammer={open:false,selected:null,category:"walls",turn:0,gridKey:"",buffer:null,target:null};
let hammerCatalog={};
function hammerPlaced(){return (s.hammerPieces??[]).filter(p=>p.region===s.region&&hammerCatalog[p.id]);}
function estateWorkbench(region=s.region){
 return (s.hammerPieces??[]).find(p=>p.id===estateWorkbenchId&&p.region===region);
}
function estateName(region){return regions[region].name+" 저택";}
function estateArrival(p){
 const dx=[0,1,0,-1][p.turn],dz=[1,0,-1,0][p.turn];
 return {x:p.x+dx*2.35,z:p.z+dz*2.35,w:p.turn%2?2.5:1.7,d:p.turn%2?1.7:2.5};
}
function estateOverlap(a,b){
 return Math.abs(a.x-b.x)<(a.w+b.w)*.5&&Math.abs(a.z-b.z)<(a.d+b.d)*.5;
}
function estateBuildProblem(box){
 const bench=estateWorkbench();
 if(!bench)return "작업대를 먼저 설치하세요";
 if(Math.hypot(Math.abs(box.x-bench.x)+box.w*.5,Math.abs(box.z-bench.z)+box.d*.5)>estateRadius+.001)
  return "작업대의 건축 반경("+estateRadius+"m) 안에 설치하세요";
 if(estateOverlap(box,estateArrival(bench)))return "빠른 이동 도착 공간을 비워 두세요";
 const entry=hammerCatalog[estateWorkbenchId];
 const footprint={x:bench.x,z:bench.z,w:bench.turn%2?entry.d:entry.w,d:bench.turn%2?entry.w:entry.d};
 if(estateOverlap(box,footprint))return "작업대와 겹쳐요";
 return "";
}
function estateArrivalProblem(piece,near){
 const space=estateArrival(piece),{x,z,w,d}=space;
 if(x-w*.5<5||x+w*.5>635||z-d*.5<13||z+d*.5>(s.region===2?810:410))
  return "작업대 앞 도착 공간을 지역 안에 두세요";
 const terrain=terrainSurface(x,z);
 for(const dx of [-w*.49,0,w*.49])for(const dz of [-d*.49,0,d*.49]){
  const y=terrainSurface(x+dx,z+dz);
  if(y<2.14||Math.abs(y-terrain)>.42||supportAt(x+dx,z+dz,y)===null)
   return "작업대 앞에 평평하고 빈 도착 공간이 필요해요";
 }
 if(buildingFootprints.some(p=>estateOverlap(space,p))||near.some(p=>{
  const a=hammerCatalog[p.id];
  return estateOverlap(space,{x:p.x,z:p.z,w:p.turn%2?a.d:a.w,d:p.turn%2?a.w:a.d});
 }))return "작업대 앞 도착 공간을 비워 두세요";
 return "";
}
function estateFastTravel(region){
 const bench=estateWorkbench(region);
 if(!bench||!graphics||opening.open||campaignBattle()){
  hammerNotice("지금은 저택으로 빠른 이동을 할 수 없어요");return false;
 }
 const previousRegion=s.region,previousPlayer=player;
 s.region=region;
 ensureWorld();
 const arrival=estateArrival(bench);
 if(estateArrivalProblem(bench,hammerPlaced().filter(p=>p!==bench))){
  s.region=previousRegion;ensureWorld();player=previousPlayer;walkedFrom=null;
  hammerNotice("저택 앞 도착 공간이 막혀 있어요");return false;
 }
 $("dialog").close();
 player={x:arrival.x,y:arrival.z};walkedFrom=null;
 heading=facing=bench.turn*Math.PI*.5+Math.PI;pitch=.10;
 target=marker=actionSpot=null;selected="home";stopMoving();resetCombatInputs();
 hammer.open=false;hammer.target=null;hammerStatus();
 render();hammerNotice(estateName(region)+"에 도착했어요");return true;
}
function estateMapList(parent,indices){
 const placed=indices.filter(i=>estateWorkbench(i));
 if(!placed.length)return;
 const list=document.createElement("section");
 list.className="estate-map-list";
 atlasHeading(list,"h3","저택 빠른 이동","등록한 작업대 앞에 도착합니다.");
 for(const region of placed){
  const control=button(list,estateName(region),()=>estateFastTravel(region),true);
  control.classList.add("estate-map-action");control.dataset.estateRegion=region;
 }
 parent.insertBefore(list,parent.querySelector(".atlas"));
}
function hammerStock(entry){return timberFree(timberId(entry.material));}
function hammerNotice(message){showProgressToast(message);}
function hammerToggle(){
 if(!graphics||opening.open||!Object.keys(hammerCatalog).length)return;
 hammer.open=!hammer.open;
 hammer.target=null;
 if(hammer.open){
  resetCombatInputs();
  if(!estateWorkbench()){hammer.selected=estateWorkbenchId;hammer.category="estate";hammer.turn=0;}
  else hammer.selected??=estateWorkbenchId;
 }
 hammerStatus();
}
function hammerStatus(){
 const el=document.getElementById("hammer-status");
 el.hidden=!hammer.open||$("dialog").open;
 if(el.hidden)return;
 const entry=hammerCatalog[hammer.selected];
 const line=entry?entry.label+"  ·  "+entry.cost+" × "+entry.material+(hammer.selected===estateWorkbenchId?"  ·  건축 반경 "+estateRadius+"m":""):"";
 const hint=hammer.target?.problem;
 const label=displayText(line),reason=displayText(hint||"");
 const signature=label+"|"+reason;
 if(el.dataset.content===signature)return;
 el.dataset.content=signature;
 el.classList.toggle("blocked",Boolean(reason));
 const title=document.createElement("strong");title.textContent=label;
 const warning=document.createElement("div");warning.className="hammer-reason";warning.textContent=reason;warning.hidden=!reason;
 const controls=document.createElement("div");controls.className="hammer-controls";
 for(const [key,action] of [["좌클릭 / Enter","설치"],["R","90° 회전"],["B","부품"],["Delete","철거"],["H","종료"]]){
  const step=document.createElement("span");
  step.append(controlKey(displayText(key)),displayText(action));controls.append(step);
 }
 el.replaceChildren(title,warning,controls);
}
function hammerMenu(){
 if(!graphics||!Object.keys(hammerCatalog).length)return;
 if(!hammer.open)hammerToggle();
 const body=modal("망치","건축 부품");
 const tabs=document.createElement("div");tabs.className="hammer-tabs";body.append(tabs);
 for(const [category,title] of Object.entries(hammerGroups)){
  const tab=button(tabs,title,()=>{hammer.category=category;hammerMenu();},category===hammer.category);
  tab.setAttribute("aria-pressed",String(category===hammer.category));
 }
 const list=document.createElement("div");list.className="hammer-palette";body.append(list);
 for(const [id,entry] of Object.entries(hammerCatalog)){
  if(entry.category!==hammer.category)continue;
  const label=document.createElement("span"),img=document.createElement("img"),name=document.createElement("span"),price=document.createElement("small");
  img.src=entry.icon;img.alt="";name.textContent=entry.label;price.textContent=entry.material+" "+hammerStock(entry)+"/"+entry.cost;
  label.append(img,name,price);
  const tile=button(list,label,()=>{
   hammer.selected=id;hammer.turn=0;$("dialog").close();setGameplayPause(false);hammerStatus();
  },id===hammer.selected);
  tile.setAttribute("aria-pressed",String(id===hammer.selected));
  if(id===estateWorkbenchId&&estateWorkbench()){tile.disabled=true;price.textContent="이 지역에 설치됨";}
  if(id!==estateWorkbenchId&&!estateWorkbench()){tile.disabled=true;price.textContent="작업대 설치 후 사용";}
 }
}
function hammerAim(){
 const distance=cap(3.1+pitch*3,2,5.1);
 return {x:player.x+Math.sin(heading)*distance,z:player.y+Math.cos(heading)*distance};
}
const hammerWall=kind=>kind==="wall"||kind==="gable";
const hammerPanel=kind=>kind==="floor"||kind==="roof";
function hammerAlignedPosition(aim,entry,turn,near){
 const side=turn%2,edge=hammerWall(entry.kind),post=entry.kind==="post";
 const snap=(v,offset)=>Math.round((v-offset)/hammerGrid)*hammerGrid+offset;
 const half=hammerGrid*.5;
 let result={x:snap(aim.x,post||edge&&side?0:half),z:snap(aim.z,post||edge&&!side?0:half),join:null};
 let best=hammerGrid*.94;
 const propose=(x,z,p)=>{
  const distance=Math.hypot(x-aim.x,z-aim.z);
  if(distance<best){best=distance;result={x,z,join:p};}
 };
 for(const p of near){
  if(Math.hypot(p.x-aim.x,p.z-aim.z)>4.2)continue;
  const q=hammerCatalog[p.id],other=p.turn%2;
  if(edge&&q.kind===entry.kind){
   // Endpoints remain on the grid even when wall centers sit between lines.
   for(const a of [-1,1])for(const b of [-1,1]){
    if(side===other&&a===b)continue;
    propose(p.x+(other?0:a*q.w/2)-(side?0:b*entry.w/2),
            p.z+(other?a*q.w/2:0)-(side?b*entry.w/2:0),p);
   }
  }
  if(hammerPanel(entry.kind)&&q.kind===entry.kind){
   const w=side?entry.d:entry.w,d=side?entry.w:entry.d;
   const pw=other?q.d:q.w,pd=other?q.w:q.d;
   for(const sign of [-1,1]){
    propose(p.x+sign*(w+pw)/2,p.z,p);
    propose(p.x,p.z+sign*(d+pd)/2,p);
   }
  }
  if(entry.kind==="roof"&&q.kind==="wall"){
   for(const sign of [-1,1])propose(p.x+(other?sign*entry.w/2:0),p.z+(other?0:sign*entry.d/2),null);
  }
 }
 return result;
}
function hammerTarget(){
 const id=hammer.selected,entry=hammerCatalog[id];
 if(!entry)return null;
 const aim=hammerAim(),near=hammerPlaced();
 const yaw=hammer.turn;
 const cell=hammerStep/2;
 let {x,z,join}=hammerAlignedPosition(aim,entry,yaw,near);
 const localWalls=near.filter(p=>["wall","post"].includes(hammerCatalog[p.id].kind)&&Math.hypot(x-p.x,z-p.z)<1.75);
 let base=terrainSurface(x,z),problem="";
 let anchor=null,supportKey=null;
 if(["door","window","fixture"].includes(entry.kind)){
  const choices=near.filter(p=>Math.hypot(aim.x-p.x,aim.z-p.z)<2.6&&(
   entry.kind==="door"?["doorway-wall","stone-arch"].includes(p.id):
   entry.kind==="window"?p.id==="window-wall":hammerCatalog[p.id].kind==="wall"&&!["doorway-wall","stone-arch"].includes(p.id)
  )).sort((a,b)=>Math.hypot(aim.x-a.x,aim.z-a.z)-Math.hypot(aim.x-b.x,aim.z-b.z));
  anchor=choices[0];
  if(!anchor)problem=entry.kind==="door"?"문틀을 바라보세요":entry.kind==="window"?"창문 벽을 바라보세요":"벽을 바라보세요";
  else{
   x=anchor.x;z=anchor.z;base=anchor.y+(entry.kind==="door"?0:entry.kind==="window"?1.0:.82);
   if(entry.kind==="fixture"){
    const outward=(hammer.turn<2?1:-1)*(hammerCatalog[anchor.id].d*.5+entry.d*.5);
    if(anchor.turn%2)x+=outward;else z+=outward;
   }
  }
 }else if(["roof","gable","ridge"].includes(entry.kind)){
  const supports=entry.kind==="ridge"?near.filter(p=>["gable-roof","corner-roof"].includes(p.id)&&Math.hypot(x-p.x,z-p.z)<.06):localWalls.filter(p=>{
   if(entry.kind!=="roof")return true;
   const dx=Math.abs(p.x-x),dz=Math.abs(p.z-z);
   if(hammerCatalog[p.id].kind==="post")return Math.abs(dx-cell)<.03&&Math.abs(dz-cell)<.03;
   return p.turn%2?Math.abs(dx-cell)<.03&&dz<.03:Math.abs(dz-cell)<.03&&dx<.03;
  });
  const heights=supports.map(p=>p.y+hammerCatalog[p.id].h);
  if(!heights.length)problem=entry.kind==="ridge"?"지붕 가까이에 설치하세요":"벽이나 기둥 옆에 설치하세요";
  else{
   base=Math.max(...heights);
   supportKey=supports[heights.indexOf(base)].key;
   if(entry.kind==="roof"&&join&&Math.abs(join.y-base)>.06)problem="옆 지붕과 높이를 맞출 벽이 필요해요";
  }
 }else{
  const floors=near.filter(p=>hammerCatalog[p.id].kind==="floor"&&Math.abs(p.x-x)<=cell+.01&&Math.abs(p.z-z)<=cell+.01);
  if(entry.kind!=="floor"&&floors.length)base=Math.max(...floors.map(p=>p.y+hammerCatalog[p.id].h));
  else if(entry.kind==="wall"){
   const adjacent=localWalls.filter(p=>p.turn%2!==yaw%2&&Math.abs(Math.abs(p.x-x)-cell)<.02&&Math.abs(Math.abs(p.z-z)-cell)<.02);
   const straight=near.filter(p=>hammerCatalog[p.id].kind==="wall"&&p.turn%2===yaw%2&&Math.abs(Math.hypot(p.x-x,p.z-z)-hammerStep)<.02&&(Math.abs(p.x-x)<.02||Math.abs(p.z-z)<.02));
   const joint=[join,...adjacent,...straight].find(p=>p&&Math.abs(p.y-base)<.56);
   if(joint)base=joint.y;
   else if(join)problem="옆 벽과 높이를 맞출 수 없어요";
  }else if(entry.kind==="floor"&&join&&Math.abs(join.y-base)<.56)base=join.y;
 }
 const ridge=entry.kind==="ridge"?near.find(p=>p.key===supportKey):null;
 const turn=ridge?.turn??(anchor?(anchor.turn+(entry.kind==="fixture"&&yaw>=2?2:0))%4:yaw);
 const w=turn%2?entry.d:entry.w,d=turn%2?entry.w:entry.d;
 const footprint={x,z,w,d};
 if(id===estateWorkbenchId){
  if(estateWorkbench())problem="이 지역에는 작업대를 하나만 설치할 수 있어요";
  else if(near.some(p=>{
   const a=hammerCatalog[p.id];
   return estateOverlap(footprint,{x:p.x,z:p.z,w:p.turn%2?a.d:a.w,d:p.turn%2?a.w:a.d});
  }))problem="기존 부품과 겹쳐요";
  else problem=estateArrivalProblem({x,z,turn},near);
 }else problem=estateBuildProblem(footprint)||problem;
 if(!problem&&(x-w/2<5||x+w/2>635||z-d/2<13||z+d/2>(s.region===2?810:410)))problem="지역 안쪽에 설치하세요";
 if(!problem&&!anchor&&entry.kind!=="roof"&&entry.kind!=="gable"&&entry.kind!=="ridge"){
  for(const dx of [-w*.44,w*.44])for(const dz of [-d*.44,d*.44]){
   const land=terrainSurface(x+dx,z+dz);
   if(land<2.14)problem="물 위에는 설치할 수 없어요";
   else if(Math.abs(base-land)>.56&&entry.kind!=="floor"&&!near.some(p=>hammerCatalog[p.id].kind==="floor"&&Math.abs(p.x-x)<=cell+.01&&Math.abs(p.z-z)<=cell+.01))problem="평평한 지면을 고르세요";
   else if(entry.kind==="floor"&&Math.abs(base-land)>.56)problem="평평한 지면을 고르세요";
  }
 }
 if(!problem&&near.some(p=>{
  const q=hammerCatalog[p.id];
  if(Math.abs(p.y-base)>.08)return false;
  if(entry.kind==="fixture"&&q.kind==="fixture"&&p.id!==id)return false;
  const dx=Math.abs(p.x-x),dz=Math.abs(p.z-z),other=p.turn%2;
  if(hammerWall(entry.kind)&&hammerWall(q.kind)){
   const a=entry.w*.5,b=q.w*.5;
   if(turn%2===other)return other?dx<.03&&dz<a+b-.03:dz<.03&&dx<a+b-.03;
   const u=turn%2?dz:dx,v=turn%2?dx:dz;
   return u<a+.03&&v<b+.03&&(u<a-.03||v<b-.03);
  }
  const sameSlot=q.kind===entry.kind||(["stairs","ramp","ground"].includes(q.kind)&&["stairs","ramp","ground"].includes(entry.kind));
  const pw=other?q.d:q.w,pd=other?q.w:q.d;
  return sameSlot&&dx<(w+pw)/2-.03&&dz<(d+pd)/2-.03;
 }))problem="이미 부품이 놓여 있어요";
 if(!problem&&buildingFootprints.some(p=>Math.abs(x-p.x)<(w+p.w)*.5&&Math.abs(z-p.z)<(d+p.d)*.5))problem="기존 건물과 겹쳐요";
 if(!problem&&!anchor&&entry.kind!=="roof"&&entry.kind!=="gable"&&entry.kind!=="ridge"){
  const staticSurface=(sceneryCells.get(Math.floor(x/cellSize)+","+Math.floor(z/cellSize))??[]).some(p=>!p.hammer&&!p.walkable&&(!p.active||p.active())&&Math.abs(x-p.x)<(w+p.w)*.5&&Math.abs(z-p.z)<(d+p.d)*.5);
  if(staticSurface)problem="기존 구조물과 겹쳐요";
 }
 if(!problem&&Math.abs(x-player.x)<w*.5+.28&&Math.abs(z-player.y)<d*.5+.28&&base<playerSupport()+1.8)problem="설치 지점에서 물러나세요";
 if(!problem&&near.length>=320)problem="이 지역의 부품 한도에 도달했어요";
 if(!problem&&hammerStock(entry)<entry.cost)problem=entry.material+" 부족";
 return {id,x,z,y:base,turn,region:s.region,anchorKey:anchor?.key??supportKey,problem};
}
function hammerAddSurface(piece){
 const entry=hammerCatalog[piece.id];
 const {x,y,z,turn}=piece,{w,h,d,kind}=entry;
 if(["ridge","gable","fixture","window"].includes(kind))return;
 const add=(u,v,width,depth,bottom,top,walkable,active)=>{
  const angle=turn*Math.PI*.5;
  const a=x+u*Math.cos(angle)+v*Math.sin(angle),b=z-u*Math.sin(angle)+v*Math.cos(angle);
  const solid=addSurface(a,b,turn%2?depth:width,turn%2?width:depth,y+bottom,typeof top==="function"?(px,pz)=>y+top((px-x)*Math.sin(angle)+(pz-z)*Math.cos(angle)):y+top,walkable);
  solid.hammer=true;
  if(active)solid.active=active;
 };
 if(kind==="estate"){
  add(0,0,w,d,0,1.09,false);
  add(.91,-.53,.13,.13,1.09,h,false);
 }else if(kind==="door"){
  add(0,0,w,d,0,h,false,()=>!piece.open);
  if(piece.id==="sliding-door")add(w*.91,0,w,d,0,h,false,()=>piece.open);
  else add(-w*.5,-w*.5,d,w,0,h,false,()=>piece.open);
 }else if(kind==="roof")add(0,0,w,d,0,.10,false);
 else if(["doorway-wall","stone-arch","window-wall"].includes(piece.id)){
  const opening=piece.id==="stone-arch"?1.35:1.16,side=(w-opening)*.5;
  for(const sign of [-1,1])add(sign*(w-side)*.5,0,side,d,0,h,false);
  if(piece.id==="window-wall")add(0,0,opening,d,0,1,false);
  add(0,0,opening,d,piece.id==="window-wall"?1.82:2.02,h,false);
 }else if(kind==="stairs"||kind==="ramp"){
  add(0,0,w,d,0,v=>cap(.5-v/d,0,1)*h,true);
 }else add(0,0,w,d,0,h,kind==="floor");
}
function hammerInstall(){
 const p=hammerTarget();
 if(!p||p.problem){if(p?.problem)hammerNotice(p.problem);return false;}
 const {problem,...piece}=p;
 const entry=hammerCatalog[piece.id];
 piece.key="hammer:"+((s.hammerSerial??0)+1);s.hammerSerial=(s.hammerSerial??0)+1;
 (s.hammerPieces??=[]).push(piece);
 give(entry.material,-entry.cost);
 hammerAddSurface(piece);autosave();
 if(piece.id===estateWorkbenchId){
  hammer.selected="floor";hammer.category="roofs";hammer.turn=0;
  hammerNotice(estateName(s.region)+" 등록 · 건축 반경 "+estateRadius+"m");
 }else hammerNotice(entry.label+" 설치");
 return true;
}
function hammerRemove(){
 const aim=hammerAim();
 const p=hammerPlaced().map(p=>({p,dist:Math.hypot(p.x-aim.x,p.z-aim.z)+Math.abs(p.y-playerSupport())*.2}))
  .filter(row=>row.dist<2.4).sort((a,b)=>a.dist-b.dist)[0]?.p;
 if(!p)return;
 const entry=hammerCatalog[p.id];
 if(p.id===estateWorkbenchId&&(house()||hammerPlaced().some(q=>q!==p))){
  hammerNotice("작업대를 철거하기 전에 이 지역의 건축물을 정리하세요");return;
 }
 const supported=hammerPlaced().some(q=>q!==p&&(q.anchorKey===p.key||Math.hypot(q.x-p.x,q.z-p.z)<1.75&&(
  (hammerCatalog[q.id].kind==="roof"&&q.y>=p.y+entry.h-.02&&["wall","post"].includes(entry.kind))||
  (["door","window","fixture"].includes(hammerCatalog[q.id].kind)&&entry.kind==="wall"&&q.y>=p.y-.02&&q.y<p.y+entry.h)||
  (["wall","post","ground"].includes(hammerCatalog[q.id].kind)&&entry.kind==="floor"&&Math.abs(q.y-p.y-entry.h)<.05)||
  (hammerCatalog[q.id].kind==="ridge"&&entry.kind==="roof"&&Math.abs(q.y-p.y-entry.h)<.05)
 )));
 if(supported){hammerNotice("붙어 있는 부품을 먼저 철거하세요");return;}
 s.hammerPieces=s.hammerPieces.filter(q=>q!==p);give(entry.material,entry.cost);
 for(const [key,solids] of sceneryCells)sceneryCells.set(key,solids.filter(solid=>!solid.hammer));
 hammerPlaced().forEach(hammerAddSurface);autosave();hammerNotice(entry.label+" 철거");
}
function hammerGeometry(mesh){
 if(!hammer.open)return;
 hammer.target=hammerTarget();hammerStatus();
 const x0=Math.round(player.x/hammerStep)*hammerStep,z0=Math.round(player.y/hammerStep)*hammerStep;
 const bench=estateWorkbench(),preview=hammer.target?.id===estateWorkbenchId&&!bench;
 const boundary=bench??(preview?hammer.target:null);
 const key=[s.region,x0,z0,loadedScene,boundary?.x,boundary?.z,boundary?.turn,Boolean(boundary?.problem)].join("|");
 hammer.buffer??=gl.createBuffer();
 if(key!==hammer.gridKey){
  const original=verts;verts=[];
  function line(ax,az,bx,bz,width,tint,lift=.045){
   const l=Math.hypot(bx-ax,bz-az),nx=(bz-az)*width/l,nz=(ax-bx)*width/l;
   const point=(x,z)=>[x,terrainSurface(x,z)+lift,z];
   const a=point(ax-nx,az-nz),b=point(ax+nx,az+nz),c=point(bx+nx,bz+nz),d=point(bx-nx,bz-nz);
   triangle(a,b,c,tint,111,[0,1,0]);triangle(a,c,d,tint,111,[0,1,0]);
  }
  const grid=[.72,.65,.43];
  for(let i=-15;i<=15;i++)for(let j=-30;j<30;j++){
   const offset=i*hammerGrid,a=j*hammerGrid*.5,b=a+hammerGrid*.5;
   line(x0+offset,z0+a,x0+offset,z0+b,.013,grid);
   line(x0+a,z0+offset,x0+b,z0+offset,.013,grid);
  }
  if(boundary){
   const circle=(x,z,r,width,tint)=>{
    const segments=Math.max(32,Math.ceil(r*12));
    for(let i=0;i<segments;i++){
     const a=2*Math.PI*i/segments,b=2*Math.PI*(i+1)/segments;
     line(x+r*Math.cos(a),z+r*Math.sin(a),x+r*Math.cos(b),z+r*Math.sin(b),width,tint,.14);
    }
   };
   circle(boundary.x,boundary.z,estateRadius,.065,boundary.problem?[.94,.32,.19]:[1,.77,.27]);
   const arrival=estateArrival(boundary);
   circle(arrival.x,arrival.z,.46,.052,[.25,.82,1]);
   for(let i=0;i<4;i++){
    const a=i*Math.PI*.5,b=a+Math.PI*.5;
    line(arrival.x+.29*Math.cos(a),arrival.z+.29*Math.sin(a),arrival.x+.29*Math.cos(b),arrival.z+.29*Math.sin(b),.04,[.35,.88,1]);
   }
  }
  hammer.count=verts.length/10;upload(hammer.buffer);verts=original;hammer.gridKey=key;
 }
 if(hammer.count)mesh(hammer.buffer,hammer.count,[0,0,0],0);
}
function hammerDoorInteract(){
 const p=hammerPlaced().filter(p=>hammerCatalog[p.id].kind==="door").map(p=>{
  const dx=p.x-player.x,dz=p.z-player.y;
  return {p,distance:Math.hypot(dx,dz),facing:dx*Math.sin(heading)+dz*Math.cos(heading)};
 }).filter(p=>p.distance<2.3&&(p.distance<.65||p.facing>p.distance*.48)).sort((a,b)=>a.distance-b.distance)[0]?.p;
 if(!p)return false;
 if(p.open&&Math.hypot(p.x-player.x,p.z-player.y)<.65)return true;
 p.open=!p.open;autosave();hammerNotice(p.open?"문 열림":"문 닫힘");return true;
}
function hammerRoomAt(x,z,y){
 const roofs=hammerPlaced().filter(p=>hammerCatalog[p.id].kind==="roof"&&p.y-y>=standingHeight&&p.y-y<4);
 const roof=roofs.find(p=>Math.abs(p.x-x)<hammerStep/2-.08&&Math.abs(p.z-z)<hammerStep/2-.08);
 if(!roof)return null;
 // Use the existing indoor camera only if the tile is enclosed on every side.
 const walls=hammerPlaced().filter(p=>hammerCatalog[p.id].kind==="wall"&&Math.abs(p.y+hammerCatalog[p.id].h-roof.y)<.12);
 const half=hammerStep/2,tiles=[roof];
 for(const p of tiles){
  for(const q of roofs){
   if(Math.abs(p.y-q.y)>.10||tiles.includes(q))continue;
   const dx=Math.abs(p.x-q.x),dz=Math.abs(p.z-q.z);
   if(Math.abs(dx+dz-hammerStep)<.04&&Math.min(dx,dz)<.03)tiles.push(q);
  }
 }
 const sealed=tiles.every(p=>[[half,0,1],[-half,0,1],[0,half,0],[0,-half,0]].every(([dx,dz,axis])=>
  tiles.some(q=>Math.abs(q.x-p.x-2*dx)<.04&&Math.abs(q.z-p.z-2*dz)<.04)||
  walls.some(q=>q.turn%2===axis&&Math.abs(q.x-p.x-dx)<.04&&Math.abs(q.z-p.z-dz)<.04)));
 if(!sealed)return null;
 const minX=Math.min(...tiles.map(p=>p.x)),maxX=Math.max(...tiles.map(p=>p.x));
 const minZ=Math.min(...tiles.map(p=>p.z)),maxZ=Math.max(...tiles.map(p=>p.z));
 if(tiles.length!==Math.round((maxX-minX)/hammerStep+1)*Math.round((maxZ-minZ)/hammerStep+1))return null;
 return {x:(minX+maxX)/2,z:(minZ+maxZ)/2,insideW:maxX-minX+hammerStep,insideD:maxZ-minZ+hammerStep,ceiling:roof.y};
}
function hammerPreview(){
 if(!hammer.open||$("dialog").open||!hammer.target)return null;
 const p=hammer.target,a=hammerCatalog[p.id];
 return {...p,asset:a.model,yaw:p.turn*Math.PI*.5,w:a.w,h:a.h,d:a.d};
}
function hammerModels(){
 return hammerPlaced().map(p=>{
  const a=hammerCatalog[p.id],yaw=p.turn*Math.PI*.5;
  let {x,z}=p,turn=yaw;
  if(p.open&&a.kind==="door"){
   if(p.id==="sliding-door"){x+=Math.cos(yaw)*a.w*.91;z-=Math.sin(yaw)*a.w*.91;}
   else{
    turn+=Math.PI*.5;
    x+=(Math.cos(turn)-Math.cos(yaw))*a.w*.5;
    z-=(Math.sin(turn)-Math.sin(yaw))*a.w*.5;
   }
  }
  return {...p,x,z,asset:a.model,yaw:turn,w:a.w,h:a.h,d:a.d};
 }).filter(p=>p.asset);
}
async function loadHammerCatalog(){
 const response=await fetch("assets/hammer/manifest.json");
 if(!response.ok)throw Error("hammer manifest "+response.status);
 const rows=await response.json();
 hammerCatalog=Object.fromEntries(rows.map(row=>{
  const [w,h,d,kind,material="일반 목재",cost=2]=hammerDimensions[row.id];
  return [row.id,{...row,w,h,d,kind,material,cost}];
 }));
 if(graphics)loadedScene="";
}




