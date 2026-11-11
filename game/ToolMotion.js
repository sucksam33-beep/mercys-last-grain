"use strict";
const toolMotionByName={
 "손도끼":"axe","벌목 도끼":"axe","강화 벌목 도끼":"heavyaxe","곡괭이":"pick","채집가위":"shears","낚싯대":"rod","목동 지팡이":"staff",
 "아사기 편백 지팡이":"staff","조릿대 투창":"javelin","편백 사냥활":"bow","사냥 활":"bow",
 "운하 갈고리창":"hook","협곡 구리 단검":"knife","주니퍼웰 고원 장궁":"longbow",
 "비버턴 철도 도끼":"heavyaxe","생오렐 제방 장창":"spear","암바로 철촉 작살":"harpoon","카루크 방한 사냥창":"winter-spear",
 "암바로 조류 방패":"shield","나무 방패":"shield"
};
for(const entry of weaponCatalogue){
 const base={staff:"staff",javelin:"javelin","hunting-bow":"bow","hook-spear":"hook",dagger:"knife",longbow:"longbow",axe:"heavyaxe","levee-pike":"spear",harpoon:"harpoon","winter-spear":"winter-spear"};
 toolMotionByName[entry.name]=base[entry.family];
}
const toolMotionTiming={
 axe:[760,.56],heavyaxe:[1030,.60],"winter-spear":[540,.43],pick:[820,.63],shears:[560,.56],rod:[1120,.51],staff:[630,.49],javelin:[760,.54],
 bow:[460,.19],longbow:[540,.19],hook:[870,.58],knife:[410,.45],spear:[570,.47],harpoon:[990,.44],shield:[520,.48]
};
let toolMotion=null;
function toolWorldTarget(motion,action){
 if(!Number.isFinite(action?.x)||!Number.isFinite(action?.z))return null;
 const water=motion==="rod"||action.type==="craftSalvage";
 const height=({axe:.86,heavyaxe:.58,pick:.25,shears:.49,knife:.58,staff:.92,shield:1.22}[motion]??.73);
 const x=motion==="rod"&&Number.isFinite(action.floatX)?action.floatX:action.x;
 const z=action.z;
 return [x,water?Math.max(2.16,terrainSurface(x,z)+.05):terrainSurface(x,z)+height,z];
}
function beginToolMotion(name,impact=null,valid=null,hand="right",action=aimTarget?.action,attack=false){
 const motion=toolMotionByName[name];
 if(!motion||!graphics){impact?.();return true}
 if(toolMotion&&simulationTime<toolMotion.end)return false;
 const [duration,contact]=toolMotionTiming[motion];
 toolMotion={name,motion,hand,attack,start:simulationTime,end:simulationTime+duration,contact:simulationTime+duration*contact,contactPhase:contact,target:toolWorldTarget(motion,action),targetType:action?.type,impact,valid,region:s.region,origin:{...player}};
 return true;
}
function stepToolMotion(){
 if(!toolMotion)return;
 const job=toolMotion;
 if(job.region!==s.region||Math.hypot(player.x-job.origin.x,player.y-job.origin.y)>1.3||jumpVelocity!==null||job.valid&&!job.valid()){
  toolMotion=null;
  return;
 }
 if(job.impact&&simulationTime>=job.contact){
  const impact=job.impact;job.impact=null;job.valid=null;impact();
 }
 if(simulationTime>=job.end)toolMotion=null;
}
function equippedToolPose(){
 const shield=shieldGuardPose();
 if(shield)return shield;
 if(craftDraw){
  const recipe=craftRecipes[craftDraw.id];
  return {motion:toolMotionByName[recipe.name],name:recipe.name,kind:"draw",target:toolWorldTarget(toolMotionByName[recipe.name],aimTarget?.action),hand:"right",phase:cap((simulationTime-craftDraw.at)/(recipe.stats.bow*1000),0,1)};
 }
 const job=toolMotion;
 if(job&&job.region===s.region&&simulationTime<job.end)
  return {motion:job.motion,name:job.name,kind:"tool",hand:job.hand,attack:job.attack,released:job.released,target:job.target,targetType:job.targetType,contactPhase:job.contactPhase,phase:cap((simulationTime-job.start)/(job.end-job.start),0,1)};
 return combatPose();
}
function runHarvestMotion(tool,apply,valid=null){
 if(tool&&!has(tool))return;
 if(s.energy<5){log("기운이 부족해. 음식을 먹거나 쉬어.","warning");return}
 beginToolMotion(tool,()=>{work(tool,apply);render()},valid);
}
function useCraftedTool(action){
 const weapon=craftEquipment("weapon");
 if(!weapon){log("먼저 무기를 장착해.");return false}
 return beginToolMotion(weapon.name,()=>craftStrike(action),()=>craftEquipment("weapon")?.id===weapon.id&&actionInReach(action),"right",action);
}
