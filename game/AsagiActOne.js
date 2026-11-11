"use strict";

const actPlaces=[
 {id:"cemetery",x:277,y:290,name:"삼나무 공동묘지",desc:"아사기 사람들이 가족의 이름과 다음 해에 심을 씨앗을 함께 묻는 곳."},
 {id:"escapeTrail",x:299,y:314,name:"담장 뒤 샛길",desc:"공동 창고에서 숲 쪽으로 빠져나가는 오래된 길."}
];
const actPeople=["겐조","하루","유이","사에"];
const actFood=["고기 조각","작은 고기","사냥한 고기","큰 고기","매우 큰 고기","따뜻한 식사","곡물죽","주먹밥"];
const actAt={raid:{x:277,z:302},siege:{x:318,z:353}};
const actRuntime={clock:0,nextSave:0,buffer:null};
function actState(){
 return s.asagiAct??={phase:"life",hunted:false,repaired:Boolean(house()),food:0,trail:false};
}
function actBattle(){
 return s.region===0&&["raid","siege"].includes(s.asagiAct?.phase)?s.asagiAct.battle:null;
}
function actStops(){
 return s.region===0?spots.concat(actPlaces,...(s.winterCampaign?.plot?winterPlots:[])):s.region===1?spots.concat(brMarket):s.region===7?spots.concat(karukPost):spots;
}
function actObjective(){
 if(s.region!==0)return null;
 const a=actState();
 const steps={
  life:["밥 짓는 연기","아사기에서 사냥으로 고기를 얻고 집을 수리한 뒤 공동 생활터의 이레나와 이야기하기","field"],
  ready:["흰 천이 걸린 밤","삼나무 공동묘지에서 겐조 만나기","cemetery"],
  raid:["흰 천이 걸린 밤","동계군을 물리치고 씨앗 항아리 지키기","cemetery"],
  prepare:["텅 빈 수확","공동 창고에 식량을 맡기고 담장 뒤 샛길을 확보하기. 준비가 끝나면 이레나에게 알리기","field"],
  siege:["닫히는 문","주민을 대피시키고 동계군의 창고 돌파를 막기","field"],
  done:["아사기의 첫 겨울","공동 창고에서 주민 생존과 남은 종자 확인하기","field"]
 };
 return steps[a.phase];
}
function actAdvance(phase,title,line){
 actState().phase=phase;
 log(line);render();questSubtitle(title,line);
}
function actHunted(){
 if(s.region===0&&actState().phase==="life")actState().hunted=true;
}
function actRepair(){
 if(!buildingMaterials(3,2))return;
 if(!house())s.homes[0]={site:"home"};
 actState().repaired=true;
 tick(2,8);
 log("겐조와 지붕을 덮고 부엌의 아궁이를 고쳤다. 이제 집에서 잠자고 요리할 수 있다.");
 render();
}
function actPrepareMenu(){
 const a=actState(),body=modal("1막","공동 창고 · 텅 빈 수확");
 const note=document.createElement("p");
 note.textContent="이레나: 첫 수확을 거뒀지만, 배급하고 나면 봄에 심을 몫이 없어. 겐조는 오늘 밤 창고 문을 열어 달래. 군인들이 돌아온다는 소문도 있어.";
 body.append(note);
 const detail=document.createElement("p");
 detail.textContent="식량 "+a.food+" / 4인분 · 샛길 "+(a.trail?"확보":"미확보")+" · 종자 항아리는 별도 보관 중";
 body.append(detail);
 const advice=document.createElement("p");
 advice.textContent="식량을 먹은 주민은 더 빨리 뛴다. 샛길을 확보하면 주민들이 정면 교전 구역을 벗어난다. 문을 잠글 경우 주민 가까이 가서 대피를 시작시켜야 한다.";
 body.append(advice);
 if(a.food<4)for(const item of actFood.filter(item=>count(item)>0)){
  row(body,item+" × "+count(item),"1인분 맡기기",()=>{
   if(a.phase!=="prepare"||a.food>=4||!count(item))return;
   give(item,-1);a.food++;render();actPrepareMenu();
  });
 }
 if(!a.trail)button(body,"담장 뒤 샛길 확인하기",()=>{$("dialog").close();go("escapeTrail")});
 button(body,"창고 문을 열고 대피 엄호",()=>actStart("siege","open"),true);
 button(body,"창고 문을 잠그고 주민 구출",()=>actStart("siege","rescue"));
}
function actActions(add){
 if(s.region!==0)return;
 const a=actState();
 if(selected==="home"&&a.phase==="life"&&!a.repaired)add("할머니 집 수리 · 원목 3 / 석재 2",actRepair,true);
 if(selected==="field"){
  if(a.phase==="life")add("이레나와 이야기",()=>{
   if(!a.hunted||!a.repaired){log("이레나: "+(!a.hunted?"사냥으로 저녁거리를 구해 와. ":"")+(!a.repaired?"할머니 집도 고쳐 두는 게 좋겠어.":""));return;}
   actAdvance("ready","흰 천이 걸린 밤","이레나: 낯선 군대가 무덤마다 흰 천을 묶고 있어. 겐조가 공동묘지에서 기다려.");
  });
  if(a.phase==="prepare")add("이레나 · 창고 방어 준비",actPrepareMenu,true);
  if(a.phase==="done")add("창고 전투 결과",actReport,true);
 }
 if(selected==="cemetery"&&a.phase==="ready")add("겐조와 씨앗 항아리 구하기",()=>actStart("raid"),true);
 if(selected==="escapeTrail"&&a.phase==="prepare"&&!a.trail)add("담장 옆 잔해를 치워 샛길 확보",()=>{
  a.trail=true;tick(.5,4);log("돌무더기를 치우고 어둠 속에서도 따라갈 수 있게 흰 천을 묶었다.");render();
 },true);
}
function actStart(phase,plan){
 const a=actState();
 if(a.phase!==(phase==="raid"?"ready":"prepare"))return;
 if($("dialog").open)$("dialog").close();
 const center=actAt[phase];
 const approaches=phase==="raid"?[[0,10],[-6,12],[6,13]]:[[0,11],[-7,13],[7,13],[-2,17],[6,18]];
 a.battle={
  plan,seconds:0,guard:phase==="siege"?3+a.food:2,health:100,breached:false,
  enemies:approaches.map(([x,z],i)=>({x:center.x+x,z:center.z+z,hp:phase==="raid"?4:6,ready:i*1.8,attack:0})),
  residents:phase==="siege"?actPeople.map((name,i)=>({name,progress:0,status:"waiting",fed:i<a.food})):[],
 };
 s.hour=phase==="raid"?19:21;
 if(phase==="siege")s.energy=Math.max(s.energy,60+a.food*8);
 actRuntime.nextSave=0;
 actAdvance(phase,phase==="raid"?"흰 천이 걸린 밤":"닫히는 문",phase==="raid"?
  "겐조: 저 항아리는 내 아들이 남긴 거야. 횃불이 오기 전에 꺼내야 해.":
  plan==="open"?"이레나: 문을 열어 둘게. 주민들이 뛰는 동안 저 계단을 막아!":"이레나: 창고를 잠갔어. 겐조와 아이들을 직접 데려와!");
}
function campaignEnemyAlive(b,enemy){return enemy?.hp>0&&enemy.ready<=b.seconds;}
function actEnemy(id){
 const b=campaignBattle(),enemy=b?.enemies[id];
 return campaignEnemyAlive(b,enemy)?enemy:null;
}
function actEnemyBox(enemy,id){
 const floor=supportAt(enemy.x,enemy.z)??height(enemy.x,enemy.z);
 return {name:"동계군 병사",min:[enemy.x-.42,floor,enemy.z-.42],max:[enemy.x+.42,floor+2.05,enemy.z+.42],
  action:{type:"actEnemy",id:"act-"+id,x:enemy.x,z:enemy.z,item:"동계군 병사"}};
}
function actAimBoxes(){
 return campaignBattle()?.enemies.flatMap((enemy,i)=>actEnemy(i)?[actEnemyBox(enemy,i)]:[])??[];
}
function actAttack(action,weapon,style,charged,cost,hand){
 const b=campaignBattle();
 if(!b)return false;
 const target=action?.type==="actEnemy"?actEnemy(Number(action.id.slice(4))):null;
 if(!target&&action?.type==="animal")return false;
 const crafted=craftEquipment(hand==="left"?"offhand":"weapon");
 const bow=weapon==="사냥 활"||Boolean(crafted?.stats.bow);
 const range=crafted?.stats.reach??(bow?18:weapon?3.2:2.1);
 spendCombatEnergy(cost);
 combat.nextAttack=simulationTime+(crafted?.stats.bonus?weaponCycle(crafted.stats):charged?670:style==="light"?310:490);
 combat.pose={kind:style,hand,weapon,start:simulationTime,end:combat.nextAttack};
 if(toolMotionByName[weapon])beginToolMotion(weapon,null,null,hand,action,true);
 if(!target||Math.hypot(player.x-target.x,player.y-target.z)>range)return true;
 const strike=()=>resolveCampaignStrike(b,target,range,crafted,bow,charged,style,weapon,action);
 if(["spear","winter-spear"].includes(toolMotion?.motion)&&toolMotion.attack){
  toolMotion.impact=strike;
  toolMotion.valid=()=>equippedWeapon(hand)===weapon&&campaignBattle()===b;
 }else queueSwordImpact(weapon,hand,strike);
 return true;
}
function resolveCampaignStrike(b,target,range,crafted,bow,charged,style,weapon,action){
 if(campaignBattle()!==b||!target.hp||Math.hypot(player.x-target.x,player.y-target.z)>range)return;
 if(crafted?.stats.bow){
  const ammo=count(s.crafting.ammo)>0&&craftArrowIds.includes(s.crafting.ammo)?s.crafting.ammo:craftArrowIds.find(id=>count(id)>0);
  if(!ammo||count(ammo)<1){log("화살이 부족해.","warning");return true;}
  give(ammo,-1);
 }
 if(crafted)craftWear(craftState(),crafted.id,1);
 if(toolMotion&&(bow||crafted?.stats.throw)){
  const from=riggedScene?.toolLaunchPoint(weapon)??[player.x,playerSupport()+1.35,player.y];
  const to=toolMotion.target??[target.x,terrainSurface(target.x,target.z)+.73,target.z];
  craftFlight={region:s.region,at:simulationTime,from,to,length:bow?.55:1.13};
  toolMotion.released=true;
 }
 const base=charged?5:style==="skill"?4:style==="heavy"?3:weapon?2:1;
 const multiplier=crafted?weaponBonusMultiplier(crafted.stats,action,{distance:Math.hypot(player.x-target.x,player.y-target.z),previous:target.weaponDamage??0,max:target.weaponMaxHp??target.hp,aimed:bow&&charged}):1;
 target.weaponMaxHp??=target.hp;
 const damage=crafted?.stats.bonus?Math.max(1,Math.round(base*(crafted.stats.power-(crafted.forgePower??0))/32*multiplier))+(crafted.forgePower??0):base+(crafted?.forgePower??0);
 target.weaponDamage=(target.weaponDamage??0)+damage;
 target.hp=Math.max(0,target.hp-damage);
 log(target.hp?"동계군 병사에게 명중했다.":"동계군 병사를 쓰러뜨렸다.");
 render();
}
function actResidentPoint(a,b,resident,index){
 const p=resident.progress,spread=(index-1.5)*.8;
 if(a.trail)return {x:lerp(b.plan==="open"?318:316,299,p),z:lerp(b.plan==="open"?356:351,327,p)+spread};
 if(b.plan==="open")return {x:318-8*p,z:356+spread-4*p};
 return {x:316-10*p,z:351+spread+7*p};
}
function actUpdate(dt){
 const b=actBattle();
 if(!b||$("dialog").open)return;
 const a=actState(),center=actAt[a.phase];
 b.seconds+=dt;
 for(const [index,enemy] of b.enemies.entries()){
  if(!actEnemy(index))continue;
  const distance=Math.hypot(player.x-enemy.x,player.y-enemy.z);
  const huntPlayer=distance<8.5;
  const x=huntPlayer?player.x:center.x,z=huntPlayer?player.y:center.z;
 const gap=Math.hypot(x-enemy.x,z-enemy.z);
  if(gap>(huntPlayer?1.65:2)){
   const step=Math.min(gap,dt*(a.phase==="raid"?1.65:1.9));
   enemy.x+=(x-enemy.x)/gap*step;enemy.z+=(z-enemy.z)/gap*step;
   enemy.attack=0;
  }else{
   enemy.attack+=dt;
   if(enemy.attack>=1.65){
    enemy.attack=0;
    if(huntPlayer){
     if(combat.move||jumpVelocity!==null)continue;
     if(blockIncoming({...enemy,id:"act-"+index},3,4))log("공격을 막았다.","success");
    else {startPlayerHit();b.health=Math.max(0,b.health-18);log("동계군의 공격을 받았다. · 전투 체력 "+b.health,"warning");}
    }else if(!b.breached){
     b.guard=Math.max(0,b.guard-1);
     if(!b.guard){b.breached=true;questSubtitle("방어선 돌파","동계군이 안쪽까지 들어왔다. 아직 남은 주민을 엄호할 수 있다.");}
    }
   }
  }
 }
 for(const [index,resident] of b.residents.entries()){
  if(["safe","lost"].includes(resident.status))continue;
  const pos=actResidentPoint(a,b,resident,index);
  if(resident.status==="waiting"){
   if(b.plan==="open"?b.seconds>index*1.4:Math.hypot(player.x-pos.x,player.y-pos.z)<5.5)resident.status="fleeing";
  }
  const threatened=b.enemies.some((enemy,i)=>actEnemy(i)&&Math.hypot(enemy.x-pos.x,enemy.z-pos.z)<3.2);
  if(resident.status==="fleeing"){
   const speed=(resident.fed?1.7:1)*(a.trail?1.35:1)/(b.plan==="open"?8:12);
   const movementFactor=!threatened||a.trail?1:resident.fed?.65:0;
   resident.progress=Math.min(1,resident.progress+dt*speed*movementFactor);
   if(resident.progress===1){resident.status="safe";log(resident.name+" · 대피 완료","success");continue;}
  }
  if(b.breached&&threatened){
   resident.exposure=(resident.exposure??0)+dt;
   if(resident.exposure>(resident.fed?5.8:2.6)){resident.status="lost";log(resident.name+" · 구조하지 못했다.","warning");}
  }
 }
 if(b.health<=0){
  a.phase=a.phase==="raid"?"ready":"prepare";delete a.battle;
  s.energy=100;
  actAdvance(a.phase,"물러나 다시 준비하기","이레나가 당신을 뒤로 끌어냈다. 확보한 식량과 샛길은 그대로 남아 있다.");
  return;
 }
 if(b.enemies.every(enemy=>!enemy.hp)){
  if(a.phase==="raid"){
   delete a.battle;
   a.seedSecured=!b.breached;
   s.day+=21;s.hour=16;
   actAdvance("prepare","스물하루 뒤 · 텅 빈 수확",a.seedSecured?
    "항아리를 지켰다. 하지만 서둘러 거둔 첫 수확은 겨울 몫에도 못 미쳤다. 공동 창고에서 이레나를 만나자.":
    "겐조가 깨진 항아리 바닥의 씨앗을 주웠다. 첫 수확도 흉작이었다. 공동 창고로 가자.");
   return;
  }
  // With the attackers defeated the player can still reach waiting families.
  if(b.residents.every(resident=>["safe","lost"].includes(resident.status))){
   a.result={saved:b.residents.filter(p=>p.status==="safe").map(p=>p.name),lost:b.residents.filter(p=>p.status==="lost").map(p=>p.name),
    seeds:a.seedSecured?(b.breached?1:3):(b.breached?0:1),breached:b.breached,food:a.food,trail:a.trail,plan:b.plan};
   delete a.battle;
   s.stage=Math.max(s.stage,4);
   actAdvance("done","아사기의 첫 겨울","전투가 끝났다. "+a.result.saved.length+"/"+actPeople.length+"명이 살아 돌아왔다. 공동 창고에서 결과를 확인하자.");
   return;
  }
 }
 if(b.seconds>=actRuntime.nextSave){actRuntime.nextSave=b.seconds+2;autosave();}
}
function actBattleStatus(){
 const b=actBattle();
 const count=b.enemies.filter(enemy=>enemy.hp>0).length;
 const guard=b.breached?"방어선 돌파":"방어선 "+b.guard;
 const people=b.residents.length?" · 대피 "+b.residents.filter(p=>p.status==="safe").length+"/"+b.residents.length:"";
 return "체력 "+b.health+" · 동계군 "+count+" · "+guard+people;
}
function actReport(){
 const result=actState().result;
 const body=modal("1막 완료","아사기의 첫 겨울");
 const lines=[
  "대피한 주민 · "+(result.saved.join(", ")||"없음"),
  "구조하지 못한 주민 · "+(result.lost.join(", ")||"없음"),
  "남은 봄 종자 · "+result.seeds+"자루",
  "비축 식량 · "+result.food+"인분 / 샛길 "+(result.trail?"확보":"미확보"),
  result.breached?"동계군이 창고 방어선을 돌파했다.":"창고 방어선을 지켰다.",
  "이레나: 오늘은 누구 몫도 이름을 부르지 말고 나누자."
 ];
 for(const line of lines){const p=document.createElement("p");p.textContent=line;body.append(p);}
}
function actDraw(mesh){
 if(s.region!==0&&!campaignBattle())return;
 if(s.region===0&&!actRuntime.scenery){
  const previous=verts;verts=[];
  for(const [dx,dz] of [[-2,-1],[0,-2],[2,0],[-3,2],[1,2],[3,3]]){
   const x=277+dx,z=302+dz,y=height(x,z);
   box(x,y+.32,z,.64,.64,.38,[.42,.42,.37],dx*.14);
   box(x,y+.66,z,.67,.075,.4,[.65,.63,.53],dx*.14);
  }
  for(const [x,z] of [[318,353],[321,353],[321,355]]){
   const y=height(x,z);
   box(x,y+.52,z,.93,1.04,1.06,[.36,.23,.14]);
   box(x,y+.84,z,.98,.10,1.09,[.25,.16,.09]);
  }
  const props=gl.createBuffer(),propsCount=verts.length/10;upload(props);
  verts=[];
  for(const [x,z] of [[275,300],[279,301],[280,305]]){
   const y=height(x,z);
   box(x,y+.82,z,.035,1.64,.035,[.34,.27,.19]);
   box(x+.16,y+1.44,z,.34,.28,.024,[.85,.83,.74],.12);
  }
  const flags=gl.createBuffer(),flagCount=verts.length/10;upload(flags);
  actRuntime.scenery={props,propsCount,flags,flagCount};
  verts=previous;
 }
 if(!actRuntime.buffer){
  const previous=verts;verts=[];
  const figure=(coat,armed)=>{
   rounded(0,1.23,0,.24,.38,.16,coat);
   rounded(0,1.68,.02,.115,.151,.114,[.59,.43,.31]);
   rounded(0,1.79,0,.144,.08,.125,[.22,.23,.21]);
   for(const side of [-1,1]){
    rounded(side*.11,.48,0,.095,.42,.10,[.20,.19,.17]);
    rounded(side*.11,.09,.05,.10,.085,.125,[.17,.15,.13]);
    rounded(side*.26,1.21,.02,.077,.26,.09,coat);
   }
   if(armed){
    box(.34,1.12,.10,.041,1.88,.041,[.37,.26,.16]);
    box(.34,2.08,.10,.063,.24,.047,[.54,.56,.54]);
   }
  };
  figure([.28,.15,.12],true);
  const soldier=gl.createBuffer(),soldierCount=verts.length/10;upload(soldier);
  verts=[];figure([.26,.37,.32]);
  const resident=gl.createBuffer(),residentCount=verts.length/10;upload(resident);
  verts=previous;
  actRuntime.buffer={soldier,soldierCount,resident,residentCount};
 }
 const m=actRuntime.buffer;
 if(s.region===0){
  const scenery=actRuntime.scenery;
  mesh(scenery.props,scenery.propsCount,[0,0,0],0);
  if(["ready","raid"].includes(s.asagiAct?.phase))mesh(scenery.flags,scenery.flagCount,[0,0,0],0);
 }
 const b=campaignBattle();
 if(!b)return;
 for(const [i,enemy] of b.enemies.entries()){
  if(actEnemy(i))mesh(m.soldier,m.soldierCount,[enemy.x,supportAt(enemy.x,enemy.z)??height(enemy.x,enemy.z),enemy.z],Math.atan2(player.x-enemy.x,player.y-enemy.z));
 }
 for(const [i,resident] of b.residents.entries()){
  if(["safe","lost","sheltered"].includes(resident.status))continue;
  const pos=s.region===1?brCivilianPoint(resident,i):actResidentPoint(actState(),b,resident,i);
  mesh(m.resident,m.residentCount,[pos.x,supportAt(pos.x,pos.z)??height(pos.x,pos.z),pos.z],-Math.PI/2,.86+i*.04);
 }
 for(const ally of b.allies??[]){
  if(ally.hp>0)mesh(m.resident,m.residentCount,[ally.x,supportAt(ally.x,ally.z)??height(ally.x,ally.z),ally.z],Math.PI/2);
 }
}


