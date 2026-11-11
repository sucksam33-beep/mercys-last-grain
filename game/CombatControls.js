"use strict";

const combat={
 keyboardAction:false,padAction:false,keyboardGuard:false,padGuard:false,
 mouseHeavy:null,padHeavy:null,keyboardDodge:null,padDodge:null,
 grip:null,target:null,retaliation:null,move:null,pose:null,shieldRaisedAt:null,shieldLoweredAt:null,shieldImpact:null,nextAttack:0,region:-1,wounds:new Map()
};
let playerHitAt=-Infinity, bladeImpact=null;
const swordContactPhase=.54;
function startPlayerHit(){playerHitAt=simulationTime;}
function playerHitPhase(){return (simulationTime-playerHitAt)/340;}
function combatAvailable(){return Boolean(graphics&&!gameplayPaused&&!opening.open&&!$("dialog").open);}
function resetCombatInputs(){
 combat.keyboardAction=combat.padAction=combat.keyboardGuard=combat.padGuard=false;
 combat.mouseHeavy=combat.padHeavy=combat.keyboardDodge=combat.padDodge=null;
 combat.shieldRaisedAt=combat.shieldLoweredAt=combat.shieldImpact=null;
 craftDraw=null;
 if(typeof toolMotion!=="undefined")toolMotion=null;
}
function resetCombatWorld(){
 playerHitAt=-Infinity;
 bladeImpact=null;
 resetCombatInputs();
 Object.assign(combat,{grip:null,target:null,retaliation:null,move:null,pose:null,nextAttack:0,region:s.region});
 combat.wounds.clear();
}
function equippedWeapon(hand){
 const crafted=craftEquipment(hand==="left"?"offhand":"weapon");
 if(crafted)return crafted.name;
 if(hand==="left"){
  if(count(s.combatLeft??"나무 방패"))return s.combatLeft??"나무 방패";
  return count("짧은 검")?"짧은 검":null;
 }
 if(count("여행자의 검"))return "여행자의 검";
 if(count("사냥 활"))return "사냥 활";
 return null;
}
function toggleGrip(hand){
 if(hand==="left"&&equippedShield()){log("방패는 우클릭 또는 LB를 눌러 막아.","warning");return}
 if(!equippedWeapon(hand)){log("해당 손에 들 무기가 필요해.","warning");return;}
 combat.grip=combat.grip===hand?null:hand;
 log(combat.grip?equippedWeapon(hand)+" · 양손잡기":"한손잡기로 전환");
}
function equippedShield(){
 const crafted=craftEquipment("offhand");
 if(crafted?.stats.shield)return crafted.name;
 return !crafted&&equippedWeapon("left")==="나무 방패"?"나무 방패":null;
}
function guarded(){return Boolean((combat.keyboardGuard||combat.padGuard)&&(equippedWeapon("left")||equippedWeapon("right")));}
function shieldGuardPose(){
 const name=equippedShield();
 if(!name||combat.move||jumpVelocity!==null){
  combat.shieldRaisedAt=combat.shieldImpact=null;
  return null;
 }
 if(!guarded()){
  if(combat.shieldRaisedAt===null)return null;
  combat.shieldLoweredAt??=simulationTime;
  const elapsed=simulationTime-combat.shieldLoweredAt;
  if(elapsed>=125||toolMotion||combat.pose&&simulationTime<combat.pose.end){
   combat.shieldRaisedAt=combat.shieldLoweredAt=combat.shieldImpact=null;
   return null;
  }
  const raised=cap((combat.shieldLoweredAt-combat.shieldRaisedAt)/110,0,1);
  return {name,motion:"shield",kind:"guard",hand:"left",phase:1,raise:raised*(1-elapsed/125),recoil:0};
 }
 combat.shieldLoweredAt=null;
 combat.shieldRaisedAt??=simulationTime;
 const impact=combat.shieldImpact,elapsed=impact?simulationTime-impact.at:Infinity;
 const phase=cap(elapsed/280,0,1);
 const recoil=phase<1?(1-phase)*(1-phase):0;
 return {name,motion:"shield",kind:"guard",hand:"left",phase,raise:cap((simulationTime-combat.shieldRaisedAt)/110,0,1),recoil,
  target:recoil?impact.target:null};
}
function blockIncoming(attacker,energy,wear=1){
 if(!guarded()||s.energy<energy||combat.move||jumpVelocity!==null)return false;
 const name=equippedShield();
 if(name){
  if(!attacker||!Number.isFinite(attacker.x)||!Number.isFinite(attacker.z))return false;
  const dx=attacker.x-player.x,dz=attacker.z-player.y,length=Math.hypot(dx,dz);
  if(length<.001||(dx*Math.sin(facing)+dz*Math.cos(facing))/length<.50)return false;
  const shield=craftEquipment("offhand");
  if(shield?.stats.shield)craftWear(craftState(),shield.id,wear);
  combat.shieldImpact={at:simulationTime,target:toolWorldTarget("shield",attacker)};
 }
 if(attacker?.id)weaponCounter={id:attacker.id,at:simulationTime,region:s.region};
 spendCombatEnergy(energy);
 return true;
}
function spendCombatEnergy(amount){
 s.energy=Math.max(0,s.energy-amount);
 const label=$("stats").children[1];
 if(label)label.textContent="기운 "+s.energy+" / 100";
}
function offHandAction(){
 if(equippedShield()){
  combat.grip=combat.pose=null;
  combat.shieldRaisedAt=simulationTime;
  combat.shieldLoweredAt=null;
  combat.shieldImpact=craftDraw=toolMotion=null;
  return true;
 }
 if(!combat.grip&&equippedWeapon("left")==="짧은 검"){combatAttack("light",0,"left");return false;}
 return true;
}
function combatPose(){
 if(combat.pose&&simulationTime<combat.pose.end){
  const {kind,hand,start,end,weapon}=combat.pose;
  return {kind,hand,weapon,contactPhase:swordSwing(weapon,hand)?swordContactPhase:undefined,twoHanded:Boolean(combat.grip),phase:cap((simulationTime-start)/(end-start),0,1)};
 }
 return guarded()?{kind:"guard",hand:combat.grip??"left",phase:0}:
  combat.grip?{kind:"ready",hand:combat.grip,twoHanded:true,phase:0}:null;
}
function combatTarget(id){
 if(id?.startsWith("act-")){const index=Number(id.slice(4)),enemy=actEnemy(index);return enemy?actEnemyBox(enemy,index).action:null;}
 return wildlife.find(({target})=>target.action.id===id&&(s.worldHarvest?.[id]||0)<=s.day)?.target.action;
}
function lockedCombatHit(selected){
 const box=selected.type==="actEnemy"?actAimBoxes().find(box=>box.action.id===selected.id):wildlife.find(({target})=>target.action.id===selected.id)?.target;
 if(!box)return false;
 const start=[player.x,playerSupport()+1.18,player.y];
 const end=box.min.map((value,i)=>(value+box.max[i])*.5);
 return pickAimObject(start,unit(sub(end,start)))?.action?.id===selected.id;
}
function toggleCombatTarget(){
 if(combat.target){combat.target=null;return;}
 const hit=aimTarget?.action;
 if(["animal","actEnemy"].includes(hit?.type)&&combatTarget(hit.id)&&Math.hypot(player.x-hit.x,player.y-hit.z)<22){
  combat.target=hit.id;
  log(hit.item+" · 대상 고정");
 }else heading=facing;
}
function swordSwing(weapon,hand){
 return hand==="right"&&(weapon==="여행자의 검"||weapon==="짧은 검");
}
function queueSwordImpact(weapon,hand,apply){
 if(!swordSwing(weapon,hand)){apply();return;}
 const pose=combat.pose;
 bladeImpact={at:pose.start+(pose.end-pose.start)*swordContactPhase,weapon,hand,pose,apply};
}
function combatAttack(style,held=0,hand=combat.grip??"right"){
 if(!combatAvailable()||simulationTime<combat.nextAttack||combat.move||toolMotion&&simulationTime<toolMotion.end)return;
 const weapon=equippedWeapon(hand);
 if(equippedShield()&&(guarded()||hand==="left"))return;
 if(style==="skill"&&!weapon){log("전기를 쓰려면 무기가 필요해.","warning");return;}
 const heavy=style==="heavy",skill=style==="skill",charged=heavy&&held>=480;
 const cost=skill?8:charged?6:heavy?4:2;
 if(s.energy<cost){log("기운이 부족해.","warning");return;}
 const locked=combatTarget(combat.target);
 const action=locked?(aimTarget?.action?.id===locked.id||lockedCombatHit(locked)?locked:null):aimTarget?.action;
 if(actAttack(action,weapon,style,charged,cost,hand))return;
 if(action?.type==="animal"&&action.index>=4){log("보호 중인 야생동물에게는 사용할 수 없어.");return;}
 if(hand==="right"&&craftEquipment("weapon")){
  const bow=craftEquipment("weapon").stats.bow;
  if(bow&&(!heavy||held<bow*1000)){log("활시위를 당겼다 놓아서 발사해.");return;}
  const power=(skill?1.75:charged?1.9:heavy?1.45:1)*(combat.grip?1.18:1);
  beginToolMotion(weapon,()=>{
   const hit=action?.type==="animal"?combatTarget(action.id):action;
   if(craftStrike(hit??null,{power,energy:cost,aimed:Boolean(bow)})&&hit?.type==="animal"&&combatTarget(hit.id))combat.retaliation={id:hit.id,at:simulationTime+420};
  },()=>equippedWeapon(hand)===weapon,hand,action,true);
  return;
 }
 if(toolMotionByName[weapon])beginToolMotion(weapon,null,null,hand,action,true);
 spendCombatEnergy(cost);
 combat.nextAttack=simulationTime+(charged?670:heavy||skill?490:310);
 combat.pose={kind:style,hand,weapon,start:simulationTime,end:combat.nextAttack};
 const selected=combatTarget(combat.target??aimTarget?.action?.id);
 const range=weapon==="사냥 활"?(skill?14:18):weapon?2.85:2.05;
 if(!selected||Math.hypot(player.x-selected.x,player.y-selected.z)>range||
  (combat.target&&aimTarget?.action?.id!==selected.id&&!lockedCombatHit(selected)))return;
 const grip=combat.grip;
 queueSwordImpact(weapon,hand,()=>resolveWildlifeStrike(selected.id,range,skill,charged,heavy,weapon,grip));
}
function resolveWildlifeStrike(id,range,skill,charged,heavy,weapon,grip){
 const selected=combatTarget(id);
 if(!selected||Math.hypot(player.x-selected.x,player.y-selected.z)>range)return;
 const vitality=combat.wounds.get(selected.id)??2+selected.index*2;
 const damage=(skill?4:charged?5:heavy?3:weapon?2:1)+(grip?1:0);
 if(vitality>damage){
  combat.wounds.set(selected.id,vitality-damage);
  combat.retaliation={id:selected.id,at:simulationTime+420};
  log(selected.item+" · 명중");
  return;
 }
 combat.wounds.delete(selected.id);
 combat.retaliation=null;
 if(combat.target===selected.id)combat.target=null;
 give(r().animals[selected.index]+" 가죽");
 give(meat[selected.index]);
 craftHuntByproduct(selected.index);
 markWorldHarvest(selected,2);
 log(r().animals[selected.index]+" 가죽과 "+meat[selected.index]+"을 얻었다.");
 render();
}
function beginCombatDodge(){
 if(!combatAvailable()||jumpVelocity!==null||combat.move||s.energy<4)return;
 const x=Number(keys.has("d")||keys.has("arrowright"))-Number(keys.has("a")||keys.has("arrowleft"));
 const z=Number(keys.has("w")||keys.has("arrowup"))-Number(keys.has("s")||keys.has("arrowdown"));
 const h=x||z?x:pad.x,v=x||z?z:pad.z;
 const magnitude=Math.hypot(h,v);
 const dx=magnitude?(-h*Math.cos(heading)+v*Math.sin(heading))/magnitude:-Math.sin(facing);
 const dz=magnitude?(h*Math.sin(heading)+v*Math.cos(heading))/magnitude:-Math.cos(facing);
 spendCombatEnergy(4);marker=target=null;stopMoving();
 combat.move={dx,dz,until:simulationTime+260};
 combat.pose={kind:magnitude?"roll":"backstep",hand:"right",start:simulationTime,end:simulationTime+260};
}
function updateCombat(dt){
 if(combat.region!==s.region){resetCombatWorld();return false;}
 if(bladeImpact&&simulationTime>=bladeImpact.at){
  const {pose,weapon,hand,apply}=bladeImpact;
  bladeImpact=null;
  if(combat.pose===pose&&equippedWeapon(hand)===weapon)apply();
 }
 const locked=combatTarget(combat.target);
 if(locked&&Math.hypot(player.x-locked.x,player.y-locked.z)<25){
  heading=Math.atan2(locked.x-player.x,locked.z-player.y);
 }else combat.target=null;
 const pending=combat.retaliation;
 if(pending&&simulationTime>=pending.at){
  combat.retaliation=null;
  const enemy=combatTarget(pending.id);
  if(enemy&&!combat.move&&jumpVelocity===null&&Math.hypot(player.x-enemy.x,player.y-enemy.z)<2.65){
   const block=blockIncoming(enemy,2);
   if(!block){spendCombatEnergy(7);startPlayerHit();}
   log(block?"공격을 막았다.":"야생동물의 반격에 기운을 잃었다.",block?"success":"warning");
  }
 }
 if(!combat.move)return false;
 if(simulationTime>=combat.move.until){combat.move=null;return false;}
 moveOnSurfaces(combat.move.dx*7.8*dt,combat.move.dz*7.8*dt,false);
 return true;
}
function finishCombatButton(kind){
 const start=combat[kind];combat[kind]=null;
 if(start===null||!combatAvailable())return;
 const held=simulationTime-start;
 if(kind.endsWith("Heavy")){
  const draw=craftDraw;craftDraw=null;
  if(draw&&held<weaponRecipe(draw.id).stats.bow*1000){log("활시위를 충분히 당기지 못했다.");return;}
  combatAttack("heavy",held);
 }
 else if(held<220)beginCombatDodge();
}
function startCombatHeavy(kind){
 if(equippedShield()&&guarded())return;
 combat[kind]=simulationTime;
 const weapon=craftEquipment("weapon");
 if(weapon?.stats.bow&&combat.grip!=="left")craftDraw={id:weapon.id,at:simulationTime};
}
function combatSkill(){combatAttack("skill",0,combat.grip??"right");}
function handleCombatPad(buttons,pressed,previous){
 const active=i=>buttons[i]&&!blockedPadButtons.has(i);
 if(pressed(3))combat.padAction=true;
 if(active(3)){
  if(pressed(4)||pressed(6)){combat.padAction=false;toggleGrip("left");return;}
  if(pressed(5)||pressed(7)){combat.padAction=false;toggleGrip("right");return;}
 }
 if(!buttons[3]&&previous[3]&&combat.padAction){
  combat.padAction=false;
  if(actionSpot||actionInReach(aimTarget?.action))interact();
 }
 if(pressed(0))jump();
 if(pressed(1))combat.padDodge=simulationTime;
 if(!buttons[1]&&previous[1])finishCombatButton("padDodge");
 pad.run=Boolean(active(1)&&combat.padDodge!==null&&simulationTime-combat.padDodge>=220);
 if(pressed(4)&&!active(3))combat.padGuard=offHandAction();
 if(!active(4)||active(3))combat.padGuard=false;
 if(pressed(11))toggleCombatTarget();
 if(active(3))return;
 if(pressed(5))combatAttack("light");
 if(pressed(6))combatSkill();
 if(pressed(7))startCombatHeavy("padHeavy");
 if(!buttons[7]&&previous[7])finishCombatButton("padHeavy");
}
function mountCombatMouse(){
 canvas.addEventListener("contextmenu",event=>event.preventDefault());
 canvas.addEventListener("pointerdown",event=>{
  if(hammer.open||!combatAvailable()||event.button>2)return;
  if(event.button===1){event.preventDefault();toggleCombatTarget();return;}
  if(keys.has("e")){
   combat.keyboardAction=false;
   toggleGrip(event.button===0?"right":"left");
   return;
  }
  if(event.button===2){
   if(event.ctrlKey)combatSkill();
   else combat.keyboardGuard=offHandAction();
  }else if(event.ctrlKey)startCombatHeavy("mouseHeavy");
  else combatAttack("light");
 });
 window.addEventListener("pointerup",event=>{
  if(event.button===2)combat.keyboardGuard=false;
  if(event.button===0)finishCombatButton("mouseHeavy");
 });
}
