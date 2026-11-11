"use strict";
const craftRecipes=CraftingData.recipes,craftItems=CraftingData.items;
for(const entry of inventoryEntries)craftItems[entry.id]={...entry,...craftItems[entry.id],icon:entry.icon};
const weaponRecipe=id=>craftRecipes[id]??legacyWeaponRecipes[id];
const craftName=id=>craftItems[id]?.name??legacyWeaponRecipes[id]?.name??id;
for(const item of Object.values(legacyWeaponRecipes))toolMotionByName[item.name]=item.stats.shape??"staff";
const craftArrowIds=Object.keys(craftRecipes).filter(id=>craftRecipes[id].stats.ammo);
const craftStationPositions=[
 [[247,209],[251,209],[244,209]],[[115,137],[120,139],[124,138]],[[101,108],[104,109],[107,108]],
 [[101,108],[104,109],[107,108]],[[101,108],[104,109],[107,108]],[[101,108],[104,109],[107,108]],
 [[101,108],[104,109],[107,108]],[[101,108],[104,109],[107,108]]
];
const craftNodes=[
 [["삼 섬유",108,129,"fiber"],["삼 섬유",115,133,"fiber"],["삼 섬유",119,137,"fiber"],["조릿대 줄기",122,138,"bamboo"],["조릿대 줄기",127,143,"bamboo"]],
 [["고철",115,141,"trade",4,"운하 수리점"],["꿩 깃털",117,332,"feather"]],
 [["구리광석",496,111,"ore"],["구리광석",504,111,"ore"],["용설란 섬유",109,326,"agave"],["용설란 섬유",115,324,"agave"]],
 [["소나무 송진",109,326,"resin"],["소나무 송진",114,328,"resin"],["엘크 힘줄",108,319,"trade",6,"숲 입구 사냥꾼"]],
 [["철광석",494,111,"ore"],["철광석",501,112,"ore"],["철광석",506,111,"ore"],["숯",102,108,"trade",2,"역 보급소"]],
 [["갈대 섬유",502,274,"reed"],["갈대 섬유",508,274,"reed"],["들오리 솜털",509,278,"feather"],["들오리 솜털",99,108,"trade",3,"역 시장"]],
 [["표류 밧줄",500,267,"rope"],["표류 밧줄",501,273,"rope"],["조개껍데기",500,279,"shell"],["조개껍데기",503,280,"shell"]],
 [["모직",126,133,"trade",6,"관측소 보급처"],["자작나무 껍질",111,325,"birch"],["자작나무 껍질",117,327,"birch"]]
];
const craftObstacles={4:[499,116],6:[507,276]};
const craftSalvage={1:()=>[canalCenter(232)+12.6,232],6:()=>[473.5,274.5]};
let craftFlight=null,craftPull=null,craftDraw=null,craftAttackAt=0,craftHit=null,craftHazard=0,craftCache=null,craftLoadCache=null,craftVitalsTick=0,craftSample=0;
function craftState(){
 return s.crafting??={discovered:{},made:{},gear:{},wear:{},drops:{},wet:0,heat:0,cold:0,health:100};
}
function craftEquipment(slot){
 const id=s.crafting?.gear[slot];
 const instance=slot==="weapon"?equippedInstance():null;
 const recipe=id&&count(id)>0&&(instance?.wear??s.crafting.wear[id]??100)>0?weaponRecipe(id):null;
 const power=instance?forgePower(instance):0;
 return recipe&&power?{...recipe,forgePower:power,stats:{...recipe.stats,power:recipe.stats.power+power}}:recipe;
}
function craftBonuses(){
 const key=Object.keys(CraftingData.slots).map(slot=>craftEquipment(slot)?.id??"").join("|");
 if(craftCache?.key===key)return craftCache.stats;
 const stats={};
 for(const slot of Object.keys(CraftingData.slots)){
  const item=craftEquipment(slot);
  if(slot==="weapon"||item?.stats.shield)continue;
  for(const [name,n] of Object.entries(item?.stats??{}))stats[name]=(stats[name]??0)+n;
 }
 craftCache={key,stats};
 return stats;
}
function craftTransaction(change,saveFields=[]){
 const prior={bag:{...s.bag},regionalFood:s.regionalFood?structuredClone(s.regionalFood):undefined,crafting:s.crafting?structuredClone(s.crafting):undefined,worldHarvest:{...s.worldHarvest},coins:s.coins,energy:s.energy,day:s.day,hour:s.hour,hempSown:s.hempSown};
 for(const field of saveFields)prior[field]=structuredClone(s[field]);
 const result=change(craftState());
 if(!result){Object.assign(s,prior);return false}
 if(!autosave()){
  Object.assign(s,prior);
  log("저장 공간이 부족해 변경을 취소했어.","warning");
  return false;
 }
 return true;
}
function craftRemember(id){if(craftItems[id])craftState().discovered[id]=true;craftLoadCache=null}
function craftAtStation(station){
 const point=craftStationPositions[s.region]?.[Object.keys(CraftingData.stations).indexOf(station)];
 const bench=station==="bench"?s.timberStructures?.[s.region]?.bench:null;
 return Boolean(point&&Math.hypot(player.x-point[0],player.y-point[1])<=3.7||bench&&Math.hypot(player.x-bench.x,player.y-bench.z)<=3.7);
}
function craftMake(id,station,confirmed){
 const recipe=craftRecipes[id];
 if(!recipe||recipe.station!==station||!craftAtStation(station)||!craftRecipeUnlocked(recipe))return false;
 const cost=confirmed??timberCost(recipe.needs);
 if(!cost||cost.some(([item,n])=>timberFree(item)<n))return false;
 if(count(id)+recipe.output>999)return false;
 const success=craftTransaction(data=>{
  for(const [item,n] of cost)give(item,-n);
  give(id,recipe.output);
  data.made[id]=true;
  if(recipe.slot&&(data.wear[id]??100)<=0)data.wear[id]=100;
  return true;
 });
 if(success)log(recipe.name+" "+recipe.output+"개를 만들었다.","success");
 return success;
}
function craftEquip(id,instanceKey){
 const recipe=weaponRecipe(id);
 const instance=recipe?.slot==="weapon"?(instanceKey?weaponInstances(id).find(v=>v.key===instanceKey):weaponInstances(id).find(v=>v.wear>0)):null;
 if(!recipe?.slot||count(id)<=0||(recipe.slot==="weapon"?(instance?.wear??0)<=0:(s.crafting?.wear[id]??100)<=0))return false;
 return craftTransaction(data=>{
  const {slot}=recipe;
  if(data.gear[slot]===id&&(!instance||data.weaponInstance===instance.key)){
   delete data.gear[slot];if(instance)delete data.weaponInstance;
  }
  else{
   if((recipe.stats.bow||recipe.stats.axe)&&slot==="weapon")delete data.gear.offhand;
   if(slot==="offhand"&&(craftEquipment("weapon")?.stats.bow||craftEquipment("weapon")?.stats.axe)){delete data.gear.weapon;delete data.weaponInstance;}
   data.gear[slot]=id;
   if(instance)data.weaponInstance=instance.key;
  }
  craftDraw=null;
  return true;
 });
}
function craftRepair(id,weapon=s.crafting?.gear.weapon,instanceKey=s.crafting?.weaponInstance){
 const amount=craftRecipes[id]?.stats.repair;
 const instance=weaponInstances(weapon).find(entry=>entry.key===instanceKey);
 if(!amount||!count(id)||!instance||instance.wear>=100)return false;
 return craftTransaction(()=>{
  give(id,-1);instance.wear=Math.min(100,instance.wear+amount);
  return true;
 });
}
function craftFarmRows(body){
 if(s.hempSown===undefined)row(body,"삼 재배 · 씨앗 1개","삼 심기",()=>{
  if(!count("씨앗")||s.energy<4){log("씨앗과 기운이 필요해.");return}
  if(craftTransaction(()=>{give("씨앗",-1);s.hempSown=s.day;tick(.5,Math.round(4*(1-(craftBonuses().work??0))));return true}))operateField();
 });
 else row(body,"삼 · 심은 날 "+s.hempSown+"일차","삼 수확",()=>{
  if(s.day<=s.hempSown){log("다음 날 수확할 수 있어.");return}
  if(count("삼 섬유")<=993&&craftTransaction(()=>{give("삼 섬유",6);delete s.hempSown;return true}))operateField();
 });
}
function craftLowTide(hour=s.hour){return (hour>=5&&hour<9)||(hour>=17&&hour<21)}
function canBuyItem(id){
 const item=craftItems[id];
 return !(item?.category===3||(item?.category===4&&["torso","arms","head","feet","liner"].includes(item.slot)));
}
function craftTradeRows(body,spot){
 const list=craftNodes[s.region].filter(([item,x,z,kind])=>kind==="trade"&&canBuyItem(item)&&Math.hypot(player.x-x,player.y-z)<18);
 for(const [item,,,kind,price] of list)row(body,item+" · "+count(item)+"개",coinAmount(price,"구매 가격",true),()=>craftBuy(item,price,spot));
}
function craftBuy(item,price,refresh){
 if(!canBuyItem(item))return false;
 if(s.coins<price||count(item)>=999){log("돈이나 가방 공간이 부족해.");return}
 if(craftTransaction(()=>{s.coins-=price;give(item);return true}))refresh();
}
function craftInteract(action){
 if(action.type==="craftStation"){craftStationMenu(action.station);return true}
 if(action.type==="craftTrade"){
  if(!canBuyItem(action.item))return false;
  const show=()=>{const body=modal("지역 거래",action.label);row(body,action.item+" · "+count(action.item)+"개",coinAmount(action.price,"구매 가격",true),()=>craftBuy(action.item,action.price,show))};
  show();return true;
 }
 if(action.type==="craftLog"||action.type==="craftSalvage"){useCraftedTool(action);return true}
 if(action.type==="craftDrop"){
  recoverInventoryDrop(action.id);
  return true;
 }
 if(action.type!=="craftNode")return false;
 if((s.worldHarvest?.[action.id]??0)>s.day)return true;
 if(action.kind==="shell"&&!craftLowTide()){log("썰물은 05:00~09:00, 17:00~21:00야.");return true}
 if(action.kind==="ore"&&!has("곡괭이"))return true;
 if(s.energy<4||count(action.item)+action.quantity>999||(action.kind==="bamboo"&&count("조릿대 잎")>=999))return true;
 if(craftTransaction(()=>{
  give(action.item,action.quantity);
  if(action.kind==="bamboo")give("조릿대 잎");
  tick(.25,Math.max(1,Math.round(4*(1-(craftBonuses().work??0)))));
  markWorldHarvest(action,2);
  return true;
 })){
  log(action.item+" "+action.quantity+"개를 얻었다.","success");
 }
 return true;
}
function craftActionText(action){
 switch(action.type){
 case "craftStation":return "제작";
 case "craftTrade":return "거래";
 case "craftDrop":return "줍기";
 case "craftLog":return "철도 도끼로 치우기";
 case "craftSalvage":return "갈고리창·작살로 끌어오기";
 case "craftNode":return action.kind==="shell"?(craftLowTide()?"썰물 · 줍기":"썰물 05–09시 · 17–21시"):action.kind==="ore"?"곡괭이로 채광":"채집";
 default:return null;
 }
}
function craftPaintNode(kind,x,y,z){
 const wood=color("#75634b"),green=color("#718250"),iron=color("#655e58");
 if(kind==="ore"){
  for(let i=0;i<4;i++)rounded(x+(i-1.5)*.18,y+.07,z+(i%2)*.17,.37,.25,.32,i%2?color(s.region===2?"#907058":"#6f5654"):iron);
 }else if(kind==="resin"){
  taper(x,y,z,2.3,.24,.14,wood,8);
  box(x,y+.78,z+.22,.27,.19,.04,color("#b89250"));
  for(let i=0;i<4;i++)crown(x,y+1.6+i*.22,z,.44-i*.07,.48,green);
 }else if(["fiber","bamboo","agave","reed"].includes(kind)){
  for(let i=0;i<7;i++)curvedPlantLeaf(x+(i%3-1)*.12,y,z+(i%2)*.14,i*2.4,kind==="agave"?.55:1.05,.23,kind==="agave"?.10:.047,shade(green,.72+i*.065));
 }else if(kind==="birch"||kind==="log"){
  tube([x-.93,y+.20,z],[x+.93,y+.24,z+.10],.22,.20,kind==="birch"?color("#b7aa92"):wood,8,9);
 }else if(kind==="rope"||kind==="salvage"){
  taper(x,y,z,.15,.31,.27,color("#95816a"),10);
 }else if(kind==="trade"){
  box(x,y,z,1.03,.77,.64,wood,0,8);
  box(x,y+.79,z,.68,.13,.42,iron);
 }else{
  const tint=color(kind==="shell"?"#c2b79c":"#b8b29e");
  for(let i=0;i<3;i++)rounded(x+(i-1)*.17,y+.015,z+(i%2)*.19,.15,.04,.22,tint);
 }
}
function buildCraftingWorld(){
 buildRegionalFoodWorld();
 buildTownServices();
 finishRegionalWindows();
 const craftSpot=(type,label,x,z,extra={},paint=null,reach=3.6)=>{
  const y=type==="craftSalvage"?Math.max(2.16,terrainSurface(x,z)):terrainSurface(x,z),id=objectKey(type+(extra.item??extra.station??""),x,z);
  if(type!=="craftTrade"&&type!=="craftStation"&&type!=="craftDrop"&&!worldResourceAvailable(id))return;
  paint?.(y);
  aimBox(label,x,z,1.25,1.25,y-.1,y+(type==="craftStation"?1.05:.9),null,{type,id,x,z,reach,...extra});
 };
 Object.keys(CraftingData.stations).forEach((station,i)=>{
  const [x,z]=craftStationPositions[s.region][i];
  craftSpot("craftStation",CraftingData.stations[station],x,z,{station},y=>{
   const wood=color("#77614a");
   if(station==="forge"){
    taper(x,y,z,.58,.57,.44,color("#797267"),10);
    taper(x,y+.58,z,.36,.44,.21,color("#62594f"),10);
   }else{
    for(const side of [-1,1])box(x+side*.40,y,z,.13,.78,.46,wood,0,8);
    box(x,y+.76,z,1.14,.12,.70,wood,0,8);
    if(station==="sew")box(x,y+.88,z,.43,.075,.34,color("#a3977a"));
   }
  });
 });
 for(const [item,x,z,kind,price,label] of craftNodes[s.region]){
  const type=kind==="trade"?"craftTrade":"craftNode";
  craftSpot(type,label??item,x,z,{item,kind,price,label,quantity:["fiber","bamboo","reed","agave"].includes(kind)?3:2},y=>{
   if(kind==="trade"){craftPaintNode(kind,x,y,z);showMaterialModel(item,x,y+.925,z,.44,.34,.12);return}
   if(!materialNodeKinds.has(kind)||!showMaterialModel(item,x,y-.017,z,kind==="ore"?.78:.60,kind==="ore"?.54:.28,.32,true))craftPaintNode(kind,x,y,z);
  });
 }
 const obstacle=craftObstacles[s.region];
 if(obstacle){
  const [x,z]=obstacle,id=objectKey("craftLog",x,z);
  if(worldResourceAvailable(id)){
   const y=terrainSurface(x,z);
   addSurface(x,z,1.85,.38,y,y+.47,false);
   craftSpot("craftLog","쓰러진 통나무",x,z,{},ground=>craftPaintNode("log",x,ground,z));
  }
 }
 const salvage=craftSalvage[s.region]?.();
 if(salvage){
  const [x,z]=salvage;
  craftSpot("craftSalvage","줄에 걸린 부유 화물",x,z,{},y=>craftPaintNode("salvage",x,y,z),10);
 }
 for(const [id,drop] of Object.entries(s.crafting?.drops??{})){
  if(drop.region!==s.region)continue;
  const {x,z,item}=drop,y=drop.y??terrainSurface(x,z);
  if(drop.owner==="player"&&timberGrades.some(g=>g.id===item))paintPlacedTimber(drop,y);
  else if(!inventoryWeaponModel(item))tube([x-.32,y+.04,z],[x+.32,y+.06,z+.09],.022,.014,color("#a38a56"),0,5);
  aimBox(craftName(item),x,z,1,1,y,y+.65,null,{type:"craftDrop",id,x,z,reach:3.4});
 }
}
function craftWear(data,id,amount){
 const instance=data.gear.weapon===id?equippedInstance(data):null;
 if(instance)instance.wear=Math.max(0,instance.wear-amount);
 else data.wear[id]=Math.max(0,(data.wear[id]??100)-amount);
}
function craftDamage(amount,kind,front=true,attacker=null){
 if(equippedShield()&&blockIncoming(attacker,3,amount>=12?13:2)){log("방패로 정면 공격을 막았다.","success");return}
 const bonus=craftBonuses(),data=craftState();
 const defense=(bonus.guard??0)+(kind==="베임"?(bonus.slash??0):0)+(front?(bonus.front??0):0)+(kind==="물가 마찰"?(bonus.abrasion??0):0);
 const hit=Math.max(1,Math.round(amount*(1-Math.min(.8,defense))));
 data.health=Math.max(1,data.health-hit);
 if(attacker)startPlayerHit();
 for(const slot of ["offhand","torso","arms"]){
  const armor=craftEquipment(slot);
  if(armor&&!armor.stats.shield&&(slot!=="offhand"||front)&&armor.category===4)craftWear(data,armor.id,2);
 }
 if(data.health===1)s.energy=Math.max(0,s.energy-hit);
 log(kind+" · 체력 −"+hit);
}
function craftWeaponStart(){
 if(equippedShield()&&guarded())return;
 const weapon=craftEquipment("weapon");
 if(!weapon)return;
 if(!weapon.stats.bow){craftStrike();return}
 if(!craftDraw){craftDraw={id:weapon.id,at:simulationTime};log("활시위를 당기는 중 · F를 놓아 발사, Q로 취소")}
}
function craftWeaponEnd(){
 const draw=craftDraw;craftDraw=null;
 if(!draw||$( "dialog").open||craftEquipment("weapon")?.id!==draw.id)return;
 if(simulationTime-draw.at<weaponRecipe(draw.id).stats.bow*1000){log("활시위를 충분히 당기지 못했다.");return}
 craftStrike(aimTarget?.action,{aimed:true});
}
function craftStrike(action=aimTarget?.action,{power=1,energy=0,aimed=false}={}){
 const weapon=craftEquipment("weapon");
 if(!weapon){log("먼저 무기를 장착해.");return false}
 const stats=weapon.stats, now=simulationTime;
 if(now<craftAttackAt||s.energy<Math.max(2,energy))return false;
 const depth=craftShallow(), distance=action?Math.hypot(action.x-player.x,action.z-player.y):Infinity;
 const reach=stats.reach*(!stats.coldGrip&&(s.crafting.cold>.5||craftBonuses().gloves)?.82:1);
 const inRoom=buildingFootprints.some(p=>p.insideW&&Math.abs(player.x-p.x)<p.insideW*.47&&Math.abs(player.y-p.z)<p.insideD*.47);
 if(stats.shallow&&inRoom){log("실내가 좁아 제방 장창을 쓸 수 없어.");return false}
 if(action?.type==="craftLog"&&(!stats.axe||distance>reach)){log("가까이에서 철도 도끼가 필요해.");return false}
 if(action?.type==="craftSalvage"&&(!stats.salvage||distance>stats.salvage)){log("갈고리창이나 작살을 들고 가까이 가야 해.");return false}
 if(action?.type==="animal"&&action.index>=4){log("보호 중인 야생동물에게는 사용할 수 없어.");return false}
 if(stats.throw==="tether"&&action?.type==="animal"&&s.region!==6){log("작살로는 암바로의 연안 표적만 노릴 수 있어.");return false}
 const ammo=stats.bow?(count(s.crafting.ammo)>0&&craftArrowIds.includes(s.crafting.ammo)?s.crafting.ammo:craftArrowIds.find(id=>count(id)>0)):null;
 if(stats.bow&&!ammo){log("화살이 없어.");return false}
 if(action?.type==="animal"&&(s.worldHarvest?.[action.id]??0)>s.day)return false;
 const animal=action?.type==="animal"&&distance<=reach;
 const previous=craftHit&&craftHit.id===action?.id?craftHit.damage:0;
 const threshold=animal?32+action.index*12:0;
 const multiplier=animal?weaponBonusMultiplier(stats,action,{distance,previous,max:threshold,aimed}):1;
 const damage=animal?previous+Math.round(stats.power*power*multiplier)+(craftRecipes[ammo]?.stats.power??0)+(stats.shallow&&depth?12:0):0;
 const killed=animal&&damage>=threshold;
 const miss=!animal&&action?.type!=="craftSalvage"&&action?.type!=="craftLog";
 const dropItem=miss&&(stats.throw==="javelin"?weapon.id:craftRecipes[ammo]?.stats.recover?ammo:null);
 if(dropItem&&Object.keys(s.crafting.drops).length>=40){log("먼저 떨어진 장비를 회수해.");return false}
 let landing=null;
 const success=craftTransaction(data=>{
  if(ammo)give(ammo,-1);
  craftWear(data,weapon.id,1);
  const thrown=stats.throw==="javelin"&&dropItem?equippedInstance(data):null;
  if(dropItem){
   if(stats.throw==="javelin"){
    give(weapon.id,-1,thrown);
   }
   const span=Math.min(reach,7);
   const x=cap(player.x+Math.sin(heading)*span,4,636),z=cap(player.y+Math.cos(heading)*span,12,412);
   data.dropCounter=(data.dropCounter??0)+1;
   data.drops["throw:"+data.dropCounter]={item:dropItem,region:s.region,x,z,yaw:heading,...(thrown?{instance:thrown}:{})};
   landing=[x,terrainSurface(x,z)+.07,z];
   districtEcologyDirty=true;
  }
  if(killed){
   give(r().animals[action.index]+" 가죽");give(meat[action.index],stats.knife?2:1);
   craftHuntByproduct(action.index);markWorldHarvest(action,2);
  }
  if(action?.type==="craftLog"||action?.type==="craftSalvage"){
   if((s.worldHarvest?.[action.id]??0)>s.day)return false;
   give(action.type==="craftLog"?r().wood:s.region===6?"표류 밧줄":"고철",2);
   markWorldHarvest(action,action.type==="craftLog"?5:2);
  }
  tick(.05,Math.max(stats.axe?4:2,energy));
  return true;
 });
 if(!success)return false;
 if(!toolMotion)beginToolMotion(weapon.name,null,null,"right",action,action?.type!=="craftLog"&&action?.type!=="craftSalvage");
 if(ammo||stats.throw){
  if(toolMotion)toolMotion.released=true;
  const span=animal?distance:Math.min(reach,7);
  const x=animal?action.x:cap(player.x+Math.sin(heading)*span,4,636),z=animal?action.z:cap(player.y+Math.cos(heading)*span,12,412);
  craftFlight={region:s.region,at:now,from:riggedScene?.toolLaunchPoint(weapon.name)??[player.x,playerSupport()+1.35,player.y],to:landing??[x,terrainSurface(x,z)+(animal?.73:.09),z],yaw:heading,length:ammo?.55:1.13};
 }
 if(action?.type==="craftSalvage")craftPull={region:s.region,at:now,from:[action.x,Math.max(2.16,terrainSurface(action.x,action.z)),action.z],to:[player.x,playerSupport(),player.y]};
 craftAttackAt=now+weaponCycle(stats);
 craftHit=animal&&!killed?{id:action.id,damage,shove:stats.shove??0,at:now}:null;
 log(killed?"사냥감을 얻었다.":dropItem?"빗나갔다. 떨어진 "+craftName(dropItem)+"을 회수할 수 있어.":action?.type==="craftLog"?"통나무를 치웠다.":action?.type==="craftSalvage"?"부유 화물을 해안으로 끌어왔다.":stats.throw==="tether"?"줄을 당겨 같은 작살을 회수했다.":animal?"명중 · 타격 "+damage:"장비를 사용했다.");
 render();
 return true;
}
function craftHuntByproduct(index){
 actHunted();
 if(s.region===1&&index===0)give("꿩 깃털");
 if(s.region===3&&index===3)give("엘크 힘줄");
}
function craftShallow(){return riverDist(player.x,player.y)<13&&!onAsagiBridge(player.x,player.y)&&playerSupport()<3.4}
function craftMotion(){
 if(!s.crafting)return 1;
 const b=craftBonuses(),wet=s.crafting.wet;
 const steep=movement.speed>.1&&Math.abs(terrainSurface(player.x+Math.sin(facing),player.y+Math.cos(facing))-terrainSurface(player.x,player.y))>.22;
 return (craftDraw?(craftEquipment("weapon")?.stats.bow>.6?.58:.80):1)*(1-(b.soak??0)*wet)*(1-((craftShallow()||steep)?(b.heavy??0):0));
}
function craftSurvival(dt){
 if(!s.crafting)return;
 craftSample+=dt;
 if(craftSample<.20)return;
 dt=craftSample;craftSample=0;
 const data=s.crafting,b=craftBonuses(),y=playerSupport();
 const w=localWeather(s.region,simulationTime,s.day,s.hour),weather=severeWeather(s.region,simulationTime,s.day,s.hour,y);
 const shallow=craftShallow(),degrees=regionalAirTemperature(s.region,s.hour,w,weather);
 data.wet=cap(data.wet+dt*(w.rain*.028*(1-(b.rain??0))+(shallow?.048*(1-(b.water??0)):0)-(!shallow&&w.rain<.1?.018:0)),0,1);
 const chilly=cap((12-degrees)/26,0,.86);
 const cold=Math.max(0,chilly+Math.max(weather.storm,weather.snow,weather.dust)*.035+data.wet*.23-(b.warm??0)*(1-data.wet*.65)-.24);
 const hot=Math.max(0,cap((degrees-27)/18,0,.84)-(b.heat??0)-.20);
 data.cold=cap(data.cold+dt*(Math.max(0,cold-.11)*foodEffect("cold")+Math.min(0,cold-.11))*.12,0,1);
 data.heat=cap(data.heat+dt*(Math.max(0,hot-.10)*foodEffect("heat")+Math.min(0,hot-.10))*.12,0,1);
 craftVitalsTick+=dt;
 if(craftVitalsTick<1)return;
 craftVitalsTick=0;
 craftHazard+=1;
 if(craftLoadCache===null)craftLoadCache=Object.values(s.bag).reduce((a,b)=>a+b,0);
 const burden=craftLoadCache>32&&movement.speed>4?(1-(b.load??0))*(count("방수 자작나무 통")&&data.wet>.3?.6:1):0;
 s.energy=Math.max(0,s.energy-(burden*.19+data.cold*.15+data.heat*.12));
 const threat=wildlife.find(a=>a.target.action.index>=2&&a.target.action.index<4&&Math.hypot(player.x-a.target.action.x,player.y-a.target.action.z)<2.1+(movement.speed>1?(1-(b.quiet??0))*.9:0));
 if(craftHazard>=5&&threat){
  craftHazard=0;const a=threat.target.action;const dx=a.x-player.x,dz=a.z-player.y;
  craftDamage(14,"베임",dx*Math.sin(facing)+dz*Math.cos(facing)>0,a);
 }
 if(craftHazard>=8&&(data.cold>.84||data.heat>.84||shallow&&movement.speed>5||weather.dust>.80)){
  craftHazard=0;
  craftDamage(7,shallow?"물가 마찰":data.cold>.84?"한기":data.heat>.84?"열기":"모래 긁힘",false);
 }
}
function craftPullPosition(){
 if(!craftPull||craftPull.region!==s.region)return null;
 const t=(simulationTime-craftPull.at)/720;
 if(t>=1){craftPull=null;return null}
 const k=t*(2-t);
 return craftPull.from.map((value,i)=>lerp(value,craftPull.to[i],k)+(i===1?Math.sin(t*Math.PI)*.28:0));
}

function craftProjectilePosition(){
 if(!craftFlight||craftFlight.region!==s.region)return null;
 const t=(simulationTime-craftFlight.at)/430;
 if(t>=1){craftFlight=null;return null}
 const velocity=craftFlight.to.map((v,i)=>v-craftFlight.from[i]);
 velocity[1]+=Math.cos(t*Math.PI)*Math.PI*.48;
 return {yaw:Math.atan2(velocity[0],velocity[2]),pitch:Math.atan2(velocity[1],Math.hypot(velocity[0],velocity[2])),length:craftFlight.length,position:craftFlight.from.map((value,i)=>lerp(value,craftFlight.to[i],t)+(i===1?Math.sin(t*Math.PI)*.48:0))};
}
