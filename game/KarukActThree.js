"use strict";

const karukPost={id:"karukPost",x:132,y:112,name:"카루크 남부 초소",desc:"눈 속의 전초 기지. 이곳을 확보하면 북부 진입로가 열린다."};
const karukCenter={x:132,z:124};
const karukRuntime={battle:null,nextSave:0};
function expeditionState(){return s.karukAct;}
function expeditionBattle(){return s.region===7&&expeditionState()?.phase==="battle"?expeditionState().battle:null;}
function expeditionInputs(){
 const result=s.brunnenAct?.result;
 return {
  people:[...new Set([...(result?.evacuated??[]),...(result?.sheltered??[])])],
  food:Math.max(0,Math.min(result?.food??0,count("손질한 곡물"))),
  seeds:Math.max(0,Math.min(result?.seedStock??0,count("씨앗"))),
 };
}
function expeditionYield(input){return input.seeds*3+Math.floor(input.people.length/2);}
function expeditionObjective(region=s.region){
 const a=expeditionState();
 if(region===1&&s.brunnenAct?.phase==="done"){
  if(!a)return ["처음으로 얻은 풍년","곡물거래소에서 이레나와 원정 시기 결정하기",1,"brMarket"];
  if(a.phase==="ripening")return ["수확을 기다리다",a.due+"일차에 브뤼넨 곡물거래소에서 공동 수확 마치기",1,"brMarket"];
  if(a.phase==="departure")return ["북부 원정","브뤼넨 곡물거래소에서 카루크로 출정하기",1,"brMarket"];
 }
 if(region===7&&a){
  if(a.phase==="front")return ["백야의 첫 전투","카루크 남부 초소에서 공격 개시하기",7,karukPost.id];
  if(a.phase==="battle")return ["백야의 첫 전투","지원대와 함께 초소의 수비대와 증원군 격퇴하기",7,karukPost.id];
  if(a.phase==="done")return ["눈 위의 첫 승리","카루크 남부 초소에서 원정 전황 확인하기",7,karukPost.id];
 }
 return null;
}
function expeditionAdvance(phase,title,line){
 expeditionState().phase=phase;log(line);render();questSubtitle(title,line);
}
function expeditionActions(add){
 const a=expeditionState();
 if(s.region===1&&selected==="brMarket"&&s.brunnenAct?.phase==="done"){
  if(!a)add("이레나 · 첫 수확과 북부 원정",expeditionBrief,true);
  if(a?.phase==="ripening"){
   if(s.day>=a.due)add("공동 수확 마치기",expeditionHarvest,true);
   else add("농가 일손 돕기 · 하루",()=>{
    advanceWorldTime(24);log("저녁까지 곡식 단을 묶었다. 공동 수확까지 "+Math.max(0,a.due-s.day)+"일 남았다.");
   },true);
  }
  if(a?.phase==="departure")add("북부 원정 보급 및 출발",expeditionProvisionMenu,true);
 }
 if(s.region===7&&selected===karukPost.id){
  if(a?.phase==="front")add("이레나 · 남부 초소 공격",expeditionStart,true);
  if(a?.phase==="done")add("북부 원정 결과",expeditionReport);
 }
 if(a?.villages&&((s.region===0&&selected==="field")||(s.region===1&&selected==="brMarket"))){
  a.lastRation??={};
  const villages=s.winterCampaign?.reserve??a.villages;
  const reserve=villages[s.region];
  add("공동 창고 · 식량 "+reserve+"자루",()=>{
   if(a.plan==="levy")log("징발 뒤 남은 식량 "+reserve+"자루. 브뤼넨에 파종용 종자 "+a.villageSeeds+"자루를 남겼다. 식료품 값은 올랐다.");
   else log("수확 뒤 남은 식량 "+reserve+"자루. 비축분이 남아 있는 동안 공동 배급을 받을 수 있다.");
  });
  if(reserve>0&&a.lastRation[s.region]!==s.day)add("공동 배급 받기 · 하루 한 번",()=>{
   if(villages[s.region]<=0||a.lastRation[s.region]===s.day)return;
   villages[s.region]--;a.lastRation[s.region]=s.day;give("곡물죽");
   log("공동 창고에서 따뜻한 곡물죽을 받았다.");
  });
 }
}
function expeditionBrief(){
 const input=expeditionInputs(),body=modal("3막","처음으로 얻은 풍년");
 const lines=[
  "이레나: 사흘 기다리면 저장고가 찰 거야. 그때는 카루크 초소에도 증원군이 와. 지금 출정하려면 이 마을 겨울 몫을 군량으로 징발해야 해.",
  "살아남아 수확을 돕는 브뤼넨 시민 "+input.people.length+"명",
  "거래소에서 확보해 가방에 남겨 둔 식량 "+input.food+"자루 · 종자 "+input.seeds+"자루",
  "수확을 기다리면 공동 수확 "+expeditionYield(input)+"자루 예상. 원정 보급을 나누고 남은 식량은 두 마을에 비축해.",
  "징발하면 거래소 식량 "+input.food+"자루와 마을 겨울 몫 1자루를 군량으로 가져가. 종자는 마을에 남겨. 카루크 증원군이 오기 전에 공격할 수 있어.",
 ];
 for(const line of lines){const p=document.createElement("p");p.textContent=line;body.append(p);}
 button(body,"수확을 기다린다 · 사흘 뒤 출정",()=>expeditionChoose("wait"),true);
 button(body,"군량을 징발한다 · 선제 출정",()=>expeditionChoose("levy"));
}
function expeditionChoose(plan){
 if(expeditionState()||s.region!==1||s.brunnenAct?.phase!=="done")return;
 const input=expeditionInputs();
 const levy=plan==="levy";
 if(input.food)give("손질한 곡물",-input.food);
 if(input.seeds)give("씨앗",-input.seeds);
 s.karukAct={
  plan,input,phase:levy?"departure":"ripening",due:s.day+3,
  harvest:0,kits:levy?input.food+1:0,
  volunteers:Math.floor(input.people.length/(levy?3:2)),
  villages:levy?{0:0,1:0}:null,villageSeeds:levy?input.seeds:0,lastRation:{},
 };
 if($("dialog").open)$("dialog").close();
 expeditionAdvance(s.karukAct.phase,levy?"빈 창고의 출정":"수확을 기다리다",levy?
  "군량을 실었다. 거래소 창고에는 종자를 남겼지만 배급할 곡식은 바닥났다. 브뤼넨과 아사기의 식료품 값이 올랐다.":
  "농가에 종자와 곡식을 맡겼다. 사흘 뒤 공동 수확을 마치면 북부 원정을 준비할 수 있다.");
}
function expeditionHarvest(){
 const a=expeditionState();
 if(a?.phase!=="ripening"||s.day<a.due)return;
 a.harvest=expeditionYield(a.input);
 a.kits=Math.min(7,Math.ceil(a.harvest/2)+Math.floor(a.input.food/3));
 const reserve=Math.max(0,a.harvest+a.input.food-a.kits);
 a.villages={0:Math.floor(reserve/2),1:Math.ceil(reserve/2)};
 expeditionAdvance("departure","첫 공동 수확","곡식 "+a.harvest+"자루를 거뒀다. 원정 보급 "+a.kits+"상자와 두 마을 비축 "+reserve+"자루를 마련했다. 카루크에는 이미 증원군이 도착했다.");
}
function expeditionPrice(item,price){
 if(!["주먹밥","씨앗"].includes(item))return price;
 const aftermath=s.winterCampaign?.ending?.regions[s.region];
 if(aftermath)return aftermath.shortage?price+2:Math.max(1,price-1);
 const a=expeditionState();
 if(s.region>1||!a?.villages)return price;
 const reserve=(s.winterCampaign?.reserve??a.villages)[s.region];
 return reserve>0?Math.max(1,price-1):a.plan==="levy"?price+3:price;
}
function expeditionProvisionMenu(){
 const a=expeditionState();
 if(s.region!==1||a?.phase!=="departure")return;
 const body=modal("북부 원정","출발 전 방한 보급");
 craftParagraph(body,"방한 보급 "+a.kits+"/7상자 · 신선한 보온식이나 저장식 1인분을 보급 한 상자로 포장할 수 있어.");
 for(const dish of regionalDishes.filter(d=>["Preserved","Warming"].includes(d.profile)&&count(d.id))){
  const action=row(body,dish.name+" · 보유 "+count(dish.id),"1인분 포장",()=>{
   if(packExpeditionFood(dish.id))expeditionProvisionMenu();
  });
  action.prepend(craftCardArt(craftItems[dish.id]));
  action.disabled=a.kits>=7||!freshFoodBatch(dish.id)||timberFree(dish.id)<1;
 }
 for(const [id,n] of Object.entries(a.packedFood??{}))craftParagraph(body,craftName(id)+" · 포장 "+n+"인분","muted");
 button(body,"카루크로 출발",()=>{resumeGameplay();expeditionDepart();},true);
}
function packExpeditionFood(id){
 const a=expeditionState(),dish=regionalDishById[id];
 if(s.region!==1||a?.phase!=="departure"||a.kits>=7||!["Preserved","Warming"].includes(dish?.profile))return false;
 return craftTransaction(()=>{
  if(!spendFreshServing(id))return false;
  a.kits++;
  const packed=a.packedFood??={};
  packed[id]=(packed[id]??0)+1;
  return true;
 },["karukAct"]);
}
function expeditionDepart(){
 const a=expeditionState();
 if(s.region!==1||a?.phase!=="departure")return;
 a.departureReserves={...a.villages};
 s.region=7;player={...startPosition};selected=actionSpot="station";target=marker=null;walkedFrom=null;stopMoving();
 advanceWorldTime(12);
 expeditionAdvance("front","카루크 · 백야의 첫 전투","원정대가 카루크에 닿았다. 남부 초소의 이레나를 만나 공격을 시작하자.");
}
function expeditionStart(){
 const a=expeditionState();
 if(s.region!==7||a?.phase!=="front")return;
 const first=[[5,2],[8,4],[4,7],[9,8]];
 const extra=a.plan==="wait"?[[11,5],[12,8],[10,11]]:[];
 a.battle={
  seconds:0,health:100,kits:a.kits,residents:[],nextCold:12,reinforced:false,
  enemies:first.concat(extra).map(([x,z],i)=>({x:karukCenter.x+x,z:karukCenter.z+z,hp:i<4?6:8,ready:i<4?i*1.7:12+(i-4)*2.7,attack:0})),
  allies:Array.from({length:a.volunteers},(_,i)=>({name:"브뤼넨 원정 지원병 "+(i+1),x:karukCenter.x-2+i*.8,z:karukCenter.z-1+i*.8,hp:40,attack:0})),
 };
 s.energy=Math.max(s.energy,85);
 expeditionAdvance("battle","카루크 남부 초소","이레나: 바람이 거세. 보급이 없으면 오래 버티기 힘들어. 초소 안쪽으로 밀고 들어가!");
}
function expeditionUpdate(dt){
 const b=expeditionBattle();
 if(!b||$("dialog").open)return;
 if(karukRuntime.battle!==b){karukRuntime.battle=b;karukRuntime.nextSave=0;}
 b.seconds+=dt;
 campaignSkirmish(b,karukCenter,dt,"남부 초소 수비대의 공격을 받았다.");
 if(b.enemies.length>4&&!b.reinforced&&b.seconds>=12){
  b.reinforced=true;questSubtitle("북부 증원군 도착","눈밭 아래에서 동계군 세 명이 추가로 진입한다.");
 }
 if(b.seconds>=b.nextCold){
  b.nextCold+=12;
  const strain=b.kits>0?2:7;
  spendCombatEnergy(strain);
  if(!b.kits)b.health=Math.max(0,b.health-5);
 }
 if(!b.health){
  delete expeditionState().battle;s.energy=100;
  expeditionAdvance("front","초소에서 후퇴","원정대를 재정비했다. 같은 조건으로 초소에 다시 진입할 수 있다.");
  return;
 }
 if(b.enemies.every(e=>!e.hp)){
  const a=expeditionState();
  a.result={plan:a.plan,defenders:b.enemies.length,support:a.volunteers,standing:b.allies.filter(p=>p.hp>0).length,
   kits:b.kits,harvest:a.harvest,villages:{...a.departureReserves}};
  delete a.battle;
  expeditionAdvance("done","눈 위의 첫 승리","남부 초소를 확보했다. 이레나와 원정 전황을 확인하자.");
 }else if(b.seconds>=karukRuntime.nextSave){karukRuntime.nextSave=b.seconds+2;autosave();}
}
function expeditionStatus(){
 const b=expeditionBattle();
 return "체력 "+b.health+" · 초소 수비대 "+b.enemies.filter(e=>e.hp>0).length+" · 지원병 "+b.allies.filter(e=>e.hp>0).length+
  " · 방한 보급 "+b.kits+" ("+(pad.active?"Y":"E")+")";
}
function expeditionReport(){
 const r=expeditionState().result,body=modal("3막 완료","카루크 남부 초소");
 const lines=[
  r.plan==="wait"?"출정 방식 · 수확 후 원정":"출정 방식 · 징발 후 선제 원정",
  "격퇴한 수비대 "+r.defenders+"명 · 전투를 마친 지원병 "+r.standing+"/"+r.support+"명",
  "공동 수확 "+r.harvest+"자루 · 전투 후 남은 보급 "+r.kits+"상자",
  "출정 당시 마을 비축 · 아사기 "+r.villages[0]+"자루 / 브뤼넨 "+r.villages[1]+"자루",
  "이레나: 이 초소까지는 왔어. 북쪽에서 겨울 궁정의 불빛이 보여.",
 ];
 for(const line of lines){const p=document.createElement("p");p.textContent=line;body.append(p);}
}
