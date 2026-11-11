"use strict";

const brMarket={id:"brMarket",x:133,y:110,name:"브뤼넨 곡물거래소",desc:"돌회랑 끝의 시장. 거래소와 시민 대피로를 확인할 수 있어."};
const brCivilians=["제빵사 마르타","짐꾼 에밀","봉제공 로테","도제 니코","상인 안나","약제상 루카"];
const brSupportNames={겐조:"겐조",사에:"사에",하루:"하루네 자원병",유이:"유이네 자원병"};
const brCenter={x:133,z:122};
const brRuntime={battle:null,nextSave:0};
function brState(){
 const a=s.brunnenAct??={phase:"arrival",support:[],seeds:0};
 if(!a.plan){
  const asagi=s.asagiAct?.result;
  a.support=[...new Set(asagi?.saved??[])].filter(name=>actPeople.includes(name)).map(name=>brSupportNames[name]);
  a.seeds=Math.floor(Math.max(0,Math.min(3,Number(asagi?.seeds)||0)));
  a.relief=Math.min(a.relief??0,a.seeds);
 }
 return a;
}
function brBattle(){
 return s.region===1&&s.brunnenAct?.phase==="battle"?s.brunnenAct.battle:null;
}
function campaignBattle(){return actBattle()??brBattle()??expeditionBattle()??winterBattle();}
function brObjective(){
 if(s.region!==1)return null;
 return {
  arrival:["곡물거래소의 사흘","브뤼넨 역에서 레나트 만나기","station"],
  brief:["굶주린 시장","곡물거래소에 가서 시민 대피 또는 봉쇄 작전 선택하기","brMarket"],
  battle:["브뤼넨 포위전","동계군을 몰아내고 거래소 확보하기","brMarket"],
  done:["배급소가 열린 날","곡물거래소에서 점령 결과와 전후 배급 확인하기","brMarket"],
 }[brState().phase];
}
function brAdvance(phase,title,line){
 brState().phase=phase;
 log(line);render();questSubtitle(title,line);
}
function brActions(add){
 if(s.region!==1)return;
 const a=brState();
 if(selected==="station"&&a.phase==="arrival")add("레나트와 이야기",()=>{
  brAdvance("brief","곡물거래소의 사흘","레나트: 사흘째 곡식이 들어오지 않아. 병사들은 아직 먹고 있고, 굶는 건 시장 사람들이야. 돌회랑 끝 거래소에서 보자.");
 },true);
 if(selected==="brMarket"){
  if(a.phase==="arrival")add("거래소 둘러보기",()=>log("역에서 레나트를 먼저 만나자."));
  if(a.phase==="brief")add("레나트 · 포위전 작전 회의",brBrief,true);
  if(a.phase==="done")add("브뤼넨 점령 결과",brReport,true);
 }
}
function brBrief(){
 const a=brState(),body=modal("2막","곡물거래소의 사흘");
 const paragraph=text=>{const p=document.createElement("p");p.textContent=text;body.append(p);};
 paragraph("레나트: 지금 대피로를 열면 굶주린 사람들을 살릴 수 있어. 하지만 동계군도 온전한 전력으로 맞설 거야. 사흘 더 막으면 수비대 일부가 이탈하겠지만, 이미 배급에서 밀려난 사람들은 기다릴 수 없어.");
 paragraph("아사기 지원병 "+a.support.length+"명 · "+(a.support.join(", ")||"지원 없음"));
 paragraph("아사기에 남은 종자 "+a.seeds+"자루 · 종자 재배 계약으로 확보한 보급 "+a.seeds+"상자");
 paragraph("보급 상자는 시민의 비상 배급에 배정하거나, 출정 중 기운과 전투 체력을 회복하는 데 쓸 수 있어.");
 if(!a.plan){
  const relief=a.relief??0;
  if(relief<a.seeds)button(body,"비상 배급에 보급 1상자 배정 · "+relief+"/"+a.seeds,()=>{a.relief=relief+1;brBrief();});
  if(relief>0)button(body,"비상 배급 1상자를 야전 보급으로 되돌리기",()=>{a.relief=relief-1;brBrief();});
  button(body,"시민을 먼저 대피 · 수비대 6명",()=>brStart("evacuate"),true);
  button(body,"사흘 더 봉쇄 · 수비대 3명",()=>brStart("blockade"));
 }else button(body,(a.plan==="evacuate"?"시민 대피":"봉쇄 뒤 진입")+" 작전 재개",()=>brStart(a.plan),true);
}
function brStart(plan){
 const a=brState();
 if(a.phase!=="brief"||a.plan&&a.plan!==plan)return;
 if(!a.plan&&plan==="blockade")advanceWorldTime(72);
 a.plan=plan;
 if($("dialog").open)$("dialog").close();
 const offsets=plan==="evacuate"?[[8,1],[12,4],[7,5],[13,-1],[10,7],[16,3]]:[[8,1],[12,4],[13,-1]];
 const relief=a.relief??0;
 a.battle={
  seconds:0,health:100,kits:a.seeds-relief,
  enemies:offsets.map(([x,z],i)=>({x:brCenter.x+x,z:brCenter.z+z,hp:plan==="evacuate"?6:5,ready:i*1.5,attack:0})),
  residents:brCivilians.map((name,i)=>({name,progress:0,exposure:0,fed:i<relief,status:plan==="blockade"?(i>=3+relief?"lost":"sheltered"):"waiting"})),
  allies:a.support.map((name,i)=>({name,x:brCenter.x+2+i*.7,z:brCenter.z-2.3+i*1.2,hp:36,attack:0})),
 };
 s.energy=Math.max(s.energy,85);
 brAdvance("battle",plan==="evacuate"?"회랑을 열어라":"봉쇄가 끝난 아침",plan==="evacuate"?
  "레나트: 회랑으로 사람을 보내겠어. 수비대를 시장 쪽에 붙잡아 둬!":
  "레나트: 수비대는 줄었어. 빈 배급통 옆에도 돌아오지 못한 사람이 있어. 이제 거래소를 점령하자.");
}
function campaignFieldSupply(){
 const b=brBattle()??expeditionBattle()??winterBattle();
 if(!b)return false;
 if(!b.kits){log("남은 야전 보급이 없어.","warning");return true;}
 if(b.health===100&&s.energy===100){log("지금은 보급을 쓸 필요가 없어.");return true;}
 b.kits--;b.health=Math.min(100,b.health+28);s.energy=Math.min(100,s.energy+30);
 log((winterBattle()?"원정 보급":s.region===7?"방한 보급":"아사기 야전 보급")+"으로 전투 체력과 기운을 회복했다.","success");render();
 return true;
}
function brCivilianPoint(person,index){
 const spread=(index-2.5)*.65,p=person.progress;
 return {x:lerp(brCenter.x+1,104,p),z:lerp(brCenter.z+3+spread,121+spread,p)};
}
function campaignSkirmish(b,center,dt,hitMessage){
 for(const enemy of b.enemies){
  if(!campaignEnemyAlive(b,enemy))continue;
  const nearestAlly=b.allies.filter(ally=>ally.hp>0).reduce((best,ally)=>
   Math.hypot(enemy.x-ally.x,enemy.z-ally.z)<Math.hypot(enemy.x-best.x,enemy.z-best.z)?ally:best,
   {x:player.x,z:player.y,player:true});
  const playerNear=Math.hypot(enemy.x-player.x,enemy.z-player.y)<10;
  const nearAlly=!nearestAlly.player&&Math.hypot(enemy.x-nearestAlly.x,enemy.z-nearestAlly.z)<10;
  const target=nearAlly||playerNear?nearestAlly:center;
  const distance=Math.hypot(enemy.x-target.x,enemy.z-target.z);
  if(distance>1.7){
   const step=Math.min(distance,dt*1.7);
   enemy.x+=(target.x-enemy.x)/distance*step;
   enemy.z+=(target.z-enemy.z)/distance*step;
   enemy.attack=0;
  }else if(target!==center&&(enemy.attack+=dt)>=1.55){
   enemy.attack=0;
   if(target.player){
    if(combat.move||jumpVelocity!==null)continue;
    if(blockIncoming(enemy,3,4))log("공격을 막았다.","success");
    else {startPlayerHit();b.health=Math.max(0,b.health-16);log(hitMessage,"warning");}
   }else target.hp=Math.max(0,target.hp-12);
  }
 }
 for(const ally of b.allies){
  if(!ally.hp)continue;
  const target=b.enemies.filter(e=>campaignEnemyAlive(b,e)).reduce((best,e)=>
   !best||Math.hypot(e.x-ally.x,e.z-ally.z)<Math.hypot(best.x-ally.x,best.z-ally.z)?e:best,null);
  if(!target)continue;
  const gap=Math.hypot(ally.x-target.x,ally.z-target.z);
  if(gap>2.35){
   const step=Math.min(gap,dt*1.3);
   ally.x+=(target.x-ally.x)/gap*step;ally.z+=(target.z-ally.z)/gap*step;
  }else if((ally.attack+=dt)>=1.65){
   ally.attack=0;target.hp=Math.max(0,target.hp-2);
  }
 }
}
function brUpdate(dt){
 const b=brBattle();
 if(!b||$("dialog").open)return;
 if(brRuntime.battle!==b){brRuntime.battle=b;brRuntime.nextSave=0;}
 b.seconds+=dt;
 campaignSkirmish(b,brCenter,dt,"거래소 수비대의 공격을 받았다.");
 if(brState().plan==="evacuate")for(const [i,person] of b.residents.entries()){
  if(person.status==="safe"||person.status==="lost")continue;
  if(b.seconds<i*.85)continue;
  person.status="fleeing";
  const point=brCivilianPoint(person,i);
  const exposed=b.enemies.some(e=>campaignEnemyAlive(b,e)&&Math.hypot(e.x-point.x,e.z-point.z)<3.7);
  person.exposure=exposed?person.exposure+dt:Math.max(0,person.exposure-dt*.3);
  if(person.exposure>(person.fed?8:5)){
   person.status="lost";log(person.name+" · 구조하지 못했다.","warning");continue;
  }
  person.progress=Math.min(1,person.progress+dt*(exposed?.035:person.fed?.15:.11));
  if(person.progress===1)person.status="safe";
 }
 if(!b.health){
  const a=brState();
  delete a.battle;s.energy=100;
  brAdvance("brief","거래소에서 후퇴","레나트가 후퇴로를 열었다. 같은 작전을 다시 시작할 수 있다. 봉쇄 날짜는 추가로 지나지 않는다.");
  return;
 }
 if(b.enemies.every(enemy=>!enemy.hp)&&b.residents.every(p=>!["waiting","fleeing"].includes(p.status)))brFinish();
 else if(b.seconds>=brRuntime.nextSave){brRuntime.nextSave=b.seconds+2;autosave();}
}
function brFinish(){
 const a=brState(),b=a.battle;
 if(!b||a.phase!=="battle")return;
 const sheltered=b.residents.filter(p=>p.status==="sheltered").map(p=>p.name);
 const evacuated=b.residents.filter(p=>p.status==="safe").map(p=>p.name);
 const lost=b.residents.filter(p=>p.status==="lost").map(p=>p.name);
 const allies=b.allies.filter(p=>p.hp>0).map(p=>p.name);
 const food=a.plan==="evacuate"?6:2;
 const seedStock=a.plan==="evacuate"?2:1;
 a.result={plan:a.plan,evacuated,sheltered,lost,allies,food,seedStock};
 delete a.battle;
 give("손질한 곡물",food);give("씨앗",seedStock);
 s.stage=Math.max(s.stage,6);
 brAdvance("done","배급소가 열린 날","거래소를 점령했다. 시민 "+(sheltered.length+evacuated.length)+"명이 살아남았고 식량 "+food+"자루를 확보했다. 레나트에게 배급 결과를 확인하자.");
}
function brStatus(){
 const b=brBattle(),a=brState();
 return "체력 "+b.health+" · 수비대 "+b.enemies.filter(e=>e.hp>0).length+" · 지원병 "+b.allies.filter(e=>e.hp>0).length+
  " · "+(a.plan==="evacuate"?"대피 "+b.residents.filter(p=>p.status==="safe").length+"/"+b.residents.length:"봉쇄 후 진입")+
  " · 야전 보급 "+b.kits+" ("+(pad.active?"Y":"E")+")";
}
function brReport(){
 const r=brState().result,body=modal("2막 완료","브뤼넨 배급소");
 const lines=[
  r.plan==="evacuate"?"선택한 작전 · 시민 대피":"선택한 작전 · 사흘 더 봉쇄",
  "대피한 시민 · "+(r.evacuated.join(", ")||"없음"),
  "도시 안에서 살아남은 시민 · "+(r.sheltered.join(", ")||"없음"),
  "돌아오지 못한 시민 · "+(r.lost.join(", ")||"없음"),
  "전투를 마친 아사기 지원병 · "+(r.allies.join(", ")||"없음"),
  "확보한 식량 "+r.food+"자루 · 종자 "+r.seedStock+"자루",
  "레나트: 문은 열었어. 이제 배급표 맨 앞에는 아이들 이름부터 쓰자.",
 ];
 for(const line of lines){const p=document.createElement("p");p.textContent=line;body.append(p);}
}
