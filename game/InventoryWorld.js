"use strict";
function weaponHasInstances(id){return weaponRecipe(id)?.slot==="weapon";}
function migrateWeaponInstances(state){
 const data=state.crafting;
 if(!data||data.instanceVersion===1)return state;
 data.discovered??={};
 data.made??={};
 data.health??=100;
 data.wet??=0;
 data.heat??=0;
 data.cold??=0;
 data.gear??={};
 data.wear??={};
 data.drops??={};
 data.instances={};
 data.instanceCounter=0;
 for(const [id,n] of Object.entries(state.bag)){
  if(!weaponHasInstances(id)||!Number.isInteger(n)||n<1)continue;
  data.instances[id]=Array.from({length:n},(_,i)=>newWeaponInstance(data,i===0?data.wear?.[id]??100:100));
  if(data.gear?.weapon===id)data.weaponInstance=data.instances[id][0].key;
 }
 for(const drop of Object.values(data.drops??{})){
  if(weaponHasInstances(drop.item)&&!drop.instance)drop.instance=newWeaponInstance(data,data.wear?.[drop.item]??100);
 }
 data.instanceVersion=1;
 return state;
}
function newWeaponInstance(data,wear=100){
 data.instanceCounter=(data.instanceCounter??0)+1;
 return {key:"weapon:"+data.instanceCounter,wear};
}
function weaponInstances(id,data=s.crafting){return data?.instances?.[id]??[];}
function equippedInstance(data=s.crafting){
 return weaponInstances(data?.gear?.weapon,data).find(instance=>instance.key===data?.weaponInstance);
}
function transferWeaponInstances(id,n,instance){
 if(!weaponHasInstances(id))return;
 const data=craftState();
 migrateWeaponInstances(s);
 const inventory=data.instances[id]??=[];
 if(n>0){
  for(let i=0;i<n;i++)inventory.push(i===0&&instance?instance:newWeaponInstance(data));
 }else{
  for(let i=0;i>n;i--){
   const key=instance?.key;
   let index=key?inventory.findIndex(entry=>entry.key===key):inventory.findIndex(entry=>entry.key!==data.weaponInstance);
   if(index<0&&!key)index=0;
   if(index<0||!inventory.length)break;
   const [removed]=inventory.splice(index,1);
   if(removed.key===data.weaponInstance){delete data.weaponInstance;delete data.gear.weapon;}
  }
  if(!inventory.length)delete data.instances[id];
 }
}
const placementOptions=Object.freeze({max:40,reach:3.4,spacing:1.45});
let placementPreview=null;
function inventoryWeaponModel(id){
 const recipe=craftRecipes[id];
 return recipe?.slot==="weapon"?(recipe.model??priorityItemModel(id)?.model):undefined;
}
function placementTarget(item){
 const x=player.x+Math.sin(heading)*2.2,z=player.y+Math.cos(heading)*2.2;
 const yaw=heading,ground=terrainSurface(x,z);
 if(inventoryWeaponModel(item)){
  const station=craftStationPositions[s.region]?.[0];
  const privateBench=s.timberStructures?.[s.region]?.bench;
  const fixtures=[...(station?[{x:station[0],z:station[1],key:"public-bench",height:.88}]:[]),...(privateBench?[{...privateBench,key:"home-bench",height:.93}]:[])];
  for(const fixture of fixtures){
   if(Math.hypot(fixture.x-x,fixture.z-z)>.72||Math.hypot(fixture.x-player.x,fixture.z-player.y)>placementOptions.reach)continue;
   if(Object.values(s.crafting?.drops??{}).some(d=>d.region===s.region&&Math.hypot(d.x-fixture.x,d.z-fixture.z)<placementOptions.spacing))return null;
   const surface=terrainSurface(fixture.x,fixture.z),floor=playerSupport();
   const path=unobstructed({x:player.x,y:player.y,floor},{x:fixture.x,y:fixture.z});
   if(path===null||Math.abs(path-floor)>.65)return null;
   return {item,x:fixture.x,z:fixture.z,y:surface+fixture.height,yaw:Math.PI/2,region:s.region,fixture:fixture.key};
  }
 }
 if(x<5||x>635||z<13||z>411||ground<1.7||roadDist(x,z)<3.5)return null;
 const floor=playerSupport();
 const support=unobstructed({x:player.x,y:player.y,floor},{x,y:z});
 if(support===null||Math.abs(support-ground)>.15||Math.abs(support-floor)>.65)return null;
 for(const [dx,dz] of [[-.52,0],[.52,0],[0,-.52],[0,.52]]){
  const nearby=supportAt(x+dx,z+dz,support,.22);
  if(nearby===null||Math.abs(nearby-support)>.22)return null;
 }
 if(Object.values(s.crafting?.drops??{}).some(drop=>drop.region===s.region&&Math.hypot(drop.x-x,drop.z-z)<placementOptions.spacing))return null;
 if(aimObjects.some(o=>o.action&&o.action.type!=="craftDrop"&&Math.hypot(o.action.x-x,o.action.z-z)<1.25))return null;
 return {item,x,z,y:support,yaw,region:s.region};
}
function placeInventoryItem(item,quantity,instanceKey,target){
 const timber=timberGrades.some(grade=>grade.id===item);
 const instance=weaponInstances(item).find(v=>v.key===instanceKey);
 if(!timber&&(!inventoryWeaponModel(item)||!instance||quantity!==1))return false;
 if(!Number.isInteger(quantity)||quantity<1||timberFree(item)<quantity)return false;
 const position=placementTarget(item);
 if(!position||!target||position.region!==target.region||Math.hypot(position.x-target.x,position.z-target.z)>.05||position.fixture!==target.fixture)return false;
 const placed=craftTransaction(data=>{
  if(Object.keys(data.drops).length>=placementOptions.max)return false;
  data.dropCounter=(data.dropCounter??0)+1;
  data.drops["placed:"+data.dropCounter]={...position,quantity,owner:"player",...(instance?{instance}:{})};
  give(item,-quantity,instance);
  return true;
 });
 if(placed){districtEcologyDirty=true;log(craftName(item)+" · "+quantity+"개 배치","success");}
 return placed;
}
function recoverInventoryDrop(id){
 const drop=s.crafting?.drops?.[id],quantity=drop?.quantity??1;
 if(!drop||drop.region!==s.region||!actionInReach({...drop,reach:placementOptions.reach})||count(drop.item)+quantity>999)return false;
 const success=craftTransaction(data=>{
  give(drop.item,quantity,drop.instance);
  delete data.drops[id];
  return true;
 });
 if(success){districtEcologyDirty=true;aimTarget=null;aimAt=-Infinity;log(craftName(drop.item)+" · "+quantity+"개 회수","success");}
 return success;
}
function inventoryPlacementMenu(id){
 const body=modal("가방",craftName(id)+" 배치");
 const entry=craftItems[id];
 body.append(craftCardArt(entry,true));
 addPriorityModelPreview(body,id);
 const target=placementTarget(id);
 if(!target){craftParagraph(body,"앞쪽에 비어 있는 평평한 땅이 필요해. 길 가장자리를 벗어나 다시 시도해.");button(body,"가방으로",satchel);return;}
 placementPreview={...target,model:inventoryWeaponModel(id),shape:toolMotionByName[entry.name]};
 $("dialog").dataset.placementPreview="true";
 if(graphics)draw(simulationTime);
 craftParagraph(body,(target.fixture?"작업대 위":"바닥")+" · 동서 "+target.x.toFixed(1)+" / 남북 "+target.z.toFixed(1));
 const confirm=(n,key)=>{
  if(placeInventoryItem(id,n,key,target)){placementPreview=null;resumeGameplay();render();}
  else log("배치할 수 없어. 위치와 보유 수량을 확인해.","warning");
 };
 if(timberGrades.some(grade=>grade.id===id)){
  const quantity=document.createElement("input");
  quantity.type="number";quantity.min="1";quantity.max=String(timberFree(id));quantity.value="1";
  quantity.setAttribute("aria-label","배치할 수량");body.append(quantity);
  button(body,"배치",()=>confirm(quantity.valueAsNumber));
 }else{
  weaponInstances(id).forEach((instance,index)=>button(body,(index+1)+"번 · 내구도 "+instance.wear+"% · 배치",()=>confirm(1,instance.key)));
 }
 button(body,"가방으로",()=>{placementPreview=null;satchel();});
}

function paintPlacedTimber(drop,y){
 const {x,z,item}=drop,grade=timberGrades.findIndex(g=>g.id===item),yaw=drop.yaw??0;
 const tint=color(["#60442e","#785239","#b88a52","#955633"][grade]);
 const length=[.60,.87,.96,1.04][grade],radius=[.05,.11,.073,.12][grade];
 if(priorityItemModel(item)&&showMaterialModel(item,x,y,z,length,radius*3,yaw,true))return;
 const dx=Math.sin(yaw),dz=Math.cos(yaw);
 for(let i=0;i<Math.min(grade===3?2:4,Math.max(2,drop.quantity));i++){
  const shift=(i%2-.5)*radius*2.05,cx=x+dz*shift,cz=z-dx*shift,h=y+radius+Math.floor(i/2)*radius*1.68;
  if(grade<2)tube([cx-dx*length*.5,h,cz-dz*length*.5],[cx+dx*length*.5,h,cz+dz*length*.5],radius,radius*.91,tint,0,9);
  else box(cx,h-radius,cz,radius*2,radius*1.82,length,tint,yaw,8);
 }
}
function placedWeaponModels(){
 const data=Object.entries(s.crafting?.drops??{}).filter(([,drop])=>drop.region===s.region);
 if(placementPreview&&$("dialog").open&&placementPreview.region===s.region)data.push(["preview",placementPreview]);
 return data.flatMap(([key,drop])=>{
  const recipe=craftRecipes[drop.item];
  const model=inventoryWeaponModel(drop.item);
  if(!model){
   const grade=timberGrades.findIndex(g=>g.id===drop.item);
   return key==="preview"&&grade>=0?[{key,grade,x:drop.x,y:drop.y,z:drop.z,yaw:drop.yaw}]:[];
  }
  return [{key,id:drop.item,url:model,shape:toolMotionByName[recipe.name],x:drop.x,y:drop.y??terrainSurface(drop.x,drop.z),z:drop.z,yaw:drop.yaw??0}];
 });
}

const weaponBonusNames=Object.freeze({FIRST:"선제 공격",COUNTER:"반격",AIM:"정조준",CLOSE:"근접 공격",FINISH:"추격 공격"});
const weaponBonusRate=.15;
let weaponCounter=null;
function weaponCycle(stats){return stats.axe?950:stats.knife?320:480;}
function weaponBonusMultiplier(stats,action,{distance,previous,max,aimed}){
 const counter=weaponCounter?.region===s.region&&weaponCounter.id===action.id&&simulationTime-weaponCounter.at<=1300;
 const active={
  FIRST:previous===0,COUNTER:counter,AIM:aimed,CLOSE:distance<=1.25,FINISH:previous>=max*.5
 }[stats.bonus];
 return active?1+weaponBonusRate:1;
}
