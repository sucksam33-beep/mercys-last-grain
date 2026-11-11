"use strict";

const winterDistricts={
 2:{title:"붉은 평원의 징집장",spot:"field",intro:"기병대장은 씨앗을 받는 집마다 한 명을 징집한다. 산타 루시아의 농가가 오늘 명단 낭독을 거부했다.",
  plans:[
   {name:"군마와 군량을 압수한다",force:4,food:4,transport:2,owner:"원정군",loyal:false,after:"군마를 확보했지만 농가의 짐승이 줄었다."},
   {name:"농가와 함께 징집대를 막는다",force:6,hold:12,food:3,transport:2,dry:2,owner:"농가 협의회",loyal:true,after:"농가가 남았고 내건성 씨앗을 재배한다."},
   {name:"기병대장의 항복 조건을 수락한다",force:3,food:1,transport:3,owner:"기병대장",loyal:false,contract:2,after:"수송대가 합류했다. 겨울 급료가 밀리면 따르지 않는다."}]},
 3:{title:"일곱 개의 봉화",spot:"woods",intro:"봉화가 산등성이를 따라 켜진다. 연맹은 매복대를 불러 원정대의 퇴로부터 끊을 생각이다.",
  plans:[
   {name:"봉화대를 보존하며 점령한다",force:6,hold:12,scouts:2,owner:"숲의 정찰대",loyal:true,after:"봉화와 정찰대를 확보했다. 궁정 측면을 정찰할 수 있다."},
   {name:"봉화대를 불태운다",force:3,food:2,facility:false,owner:"원정군",loyal:false,after:"추적은 멈췄지만 봉화와 북쪽 정찰망이 사라졌다."},
   {name:"포로를 교환해 연맹을 합류시킨다",force:4,scouts:1,owner:"사냥꾼 연맹",loyal:false,contract:2,after:"연맹은 겨울 배급 약속을 받은 뒤 길을 열었다."}]},
 4:{title:"쇠가 울리는 도시",spot:"rocks",intro:"감독관이 광부 가족을 기숙사에 가뒀다. 정문을 치는 동안 교대 통로로 들어갈 기회가 있다.",
  plans:[
   {name:"기숙사부터 구한다",force:5,hold:12,engineers:2,fugitive:true,owner:"광부 가족 대표",loyal:true,after:"가족과 정비공은 살아남았다. 감독관은 카루크로 달아났다."},
   {name:"감독관과 제련소부터 잡는다",force:4,food:2,engineers:0,owner:"원정군",loyal:false,after:"강철은 남았지만 가족을 데리고 떠난 숙련공이 많다."},
   {name:"노동자에게 제련소를 맡긴다",force:6,engineers:1,owner:"제련소 노동자회",loyal:true,after:"노동자회가 생산과 무기 반출을 직접 관리한다."}]},
 5:{title:"종을 울리면 오는 사람들",spot:"field",intro:"피난처의 종이 울린다. 무장한 경비는 외지인을 쏘고, 내부 파벌은 병든 밭에서 온 사람들을 내쫓으려 한다.",
  plans:[
   {name:"피난민을 보호하고 치료소를 연다",force:6,hold:12,medics:2,foodCost:2,owner:"피난민 치료소",loyal:true,after:"의무대가 부상자를 받고 농가의 일손이 돌아왔다."},
   {name:"진영을 해산하고 배급품을 가져간다",force:4,food:4,facility:false,owner:"원정군",loyal:false,after:"군량은 늘었다. 피난민이 흩어지면서 치료소는 닫혔다."},
   {name:"피난처 자치를 보장하고 의무대를 계약한다",force:5,medics:1,owner:"피난처 평의회",loyal:true,after:"치료소가 양쪽 부상자를 받아들이기로 했다."}]},
 6:{title:"백색 절벽의 씨앗 정원",spot:"field",intro:"수호대가 정원으로 가는 길을 막았다. 뒤쪽 절벽으로 동계군이 접근 중이다. 총성이 오래 이어지면 종자를 옮기기 시작할 것이다.",
  plans:[
   {name:"익은 종자를 나눠 여러 곳에 심는다",force:5,hold:10,seeds:3,distributed:true,owner:"현지 재배단",loyal:true,after:"나눠 심은 종자가 한 곳의 손실로 사라지지 않는다."},
   {name:"정원과 종자를 모두 확보한다",force:4,seeds:5,owner:"원정군",loyal:false,after:"가장 많은 종자를 확보했다. 중앙 저장고에 모아 둔다."},
   {name:"정원을 지키고 현지 재배권을 보장한다",force:6,hold:12,seeds:2,distributed:true,owner:"암바로 수호대",loyal:true,after:"정원이 살아 있는 증식지로 남았다."}]}
};
const winterActs={
  rear:["초소 뒤의 전쟁","카루크 남부 초소에서 이레나와 후방 대책 결정하기",7,"karukPost"],
  lands:["다섯 지방의 겨울","산타 루시아, 주니퍼웰, 비버턴, 생오렐, 암바로의 작전을 끝내기",7,"karukPost"],
  court:["겨울 궁정","카루크 남부 초소에서 궁정 진입과 배급 협상 결정하기",7,"karukPost"],
  mutiny:["우리 깃발 아래","이레나가 봉쇄한 저장고에 들어가 배급권 되찾기",7,"karukPost"],
  ration:["창고를 연 다음","카루크 남부 초소에서 여덟 지방의 겨울 배급 결정하기",7,"karukPost"],
  return:["첫 파종","아사기 공동묘지에서 씨앗 항아리 받기",0,"cemetery"],
  plant:["첫 파종","아사기 공동 생활터에서 마지막 씨앗 심기",0,"field"],
  done:["Mercy’s Last Grain","첫 파종을 마쳤다. 여덟 지방에서 전후 복구를 확인할 수 있다.",0,"field"]
};
const winterClock={battle:null,nextSave:0};
const winterPlots=[
 {id:"lowSpringPlot",x:294,y:351,name:"낮은 밭",desc:"먼저 거둘 곡식을 심을 밭.",days:2,yield:2},
 {id:"persimmonSpringPlot",x:332,y:364,name:"감나무 아래 밭",desc:"더 오래 자라지만 수확량이 많은 밭.",days:3,yield:4}
];
function winterState(){
 if(s.winterCampaign)return s.winterCampaign;
 if(s.karukAct?.phase!=="done"||!s.karukAct.result)return null;
 const a=s.karukAct.result;
 return s.winterCampaign={phase:"rear",districts:{},food:Math.max(0,a.kits??0),seeds:0,
  army:Math.max(0,a.standing??0),reserve:{...s.karukAct.villages}};
}
function winterBattle(){
 const b=s.winterCampaign?.battle;
 return b?.region===s.region?b:null;
}
function winterObjectives(){
 const f=winterState();
 if(!f)return [];
 if(f.battle)return [[f.battle.title,f.battle.hold?"수비대를 격퇴하고 현장을 확보하기":"수비대를 격퇴하기",f.battle.region,f.battle.spot]];
 if(f.pending)return [[f.pending.title,"현장으로 돌아가 같은 작전을 재개하기",f.pending.region,f.pending.spot]];
 if(f.phase==="lands")return Object.entries(winterDistricts).filter(([id])=>!f.districts[id])
  .map(([id,d])=>[d.title,d.intro,Number(id),d.spot]);
 if(f.phase==="plant"&&f.plot){
  const plot=winterPlots.find(p=>p.id===f.plot);
  return [["첫 파종",plot.name+"까지 항아리를 들고 가서 씨앗 심기",0,plot.id]];
 }
 return [winterActs[f.phase]];
}
function winterSet(phase,title,line){
 const f=winterState();
 f.phase=phase;
 log(line);render();questSubtitle(title,line);
}
function winterParagraph(body,text){
 const p=document.createElement("p");p.textContent=text;body.append(p);
}
function winterActions(add){
 const f=winterState();
 if(!f)return;
 const post=s.region===7&&selected==="karukPost";
 if(f.pending&&s.region===f.pending.region&&selected===f.pending.spot){
  add("원정대 · 작전 재개",winterStart,true);
  return;
 }
 if(post){
  if(f.phase==="rear")add("이레나 · 초소와 후방",winterRear,true);
  if(f.phase==="court")add("겨울 궁정 진입 작전",winterCourt,true);
  if(f.phase==="mutiny")add("창고 앞 · 이레나와 대치",winterMutiny,true);
  if(f.phase==="ration")add("여덟 지방의 배급 결정",winterRation,true);
  if(f.phase==="return"||f.phase==="plant"||f.phase==="done")add("겨울 배급 기록",winterLedger);
 }
 const district=winterDistricts[s.region];
 if(district&&selected===district.spot){
  if(f.phase==="lands"&&!f.districts[s.region]&&!f.pending)add(district.title,()=>winterDistrict(s.region),true);
  if(f.districts[s.region])add("점령지 시설과 배급 확인",()=>winterLocal(s.region));
 }
 if(s.region===0&&selected==="cemetery"&&f.phase==="return")add("씨앗 항아리 받기",()=>{
  give("마지막 씨앗 항아리");
  winterSet("plant","첫 파종","겐조가 남긴 항아리를 받았다. 공동 생활터까지 직접 가져가자.");
 },true);
 if(s.region===0&&selected==="field"&&f.phase==="plant")add("첫 파종할 밭 고르기",winterPlant,true);
 if(s.region===0&&f.phase==="plant"&&f.plot&&selected===f.plot)add("항아리의 씨앗 심기",winterSow,true);
 if(s.region===0&&selected==="field"&&f.phase==="done")add("첫 파종 이후",winterLedger);
 if(selected==="station"&&f.ending)add("이 지역의 배급과 복구",winterAftercare);
}
function winterOrder(kind,choice,title,force,{hold=0,kits,allies,spot="karukPost"}={}){
 const f=winterState();
 if(f.pending||f.battle)return;
 f.pending={kind,choice,title,force,hold,kits:kits??Math.min(3,f.food),allies:allies??Math.min(3,f.army),region:s.region,spot};
 winterStart();
}
function winterRear(){
 const f=winterState(),body=modal("4막","초소 뒤의 전쟁");
 winterParagraph(body,"이레나: 남부 초소는 우리 손에 있어. 하지만 눈보라가 오고, 아사기와 브뤼넨에서도 사람이 왔어. 부상자를 데려가야 해.");
 winterParagraph(body,"전투를 마친 지원병 "+f.army+"명 · 남은 방한 보급 "+f.food+"상자 · 마을 비축 "+((f.reserve[0]??0)+(f.reserve[1]??0))+"자루");
 button(body,"초소를 지킨다 · 후방 지원 지연",()=>winterOrder("rear","hold","밤의 초소 방어",f.food>=3?3:5,{hold:12}),true);
 button(body,"부상자를 호송하며 철수한다",()=>winterOrder("rear","withdraw","눈 속의 후송로",3,{hold:10}));
 if(f.army>=2&&f.food>=2)button(body,"지원대를 나눈다 · 보급 2상자",()=>{
  f.food-=2;winterOrder("rear","split","갈라진 지원대",4,{hold:10,allies:Math.min(2,f.army-1)});
 });
}
function winterDistrict(id){
 const f=winterState(),d=winterDistricts[id];
 const body=modal("5막",d.title);winterParagraph(body,d.intro);
 for(const [i,plan] of d.plans.entries()){
  winterParagraph(body,plan.after+" · 수비대 "+plan.force+"명"+(plan.foodCost?" · 식량 "+plan.foodCost+"자루 필요":""));
  const b=button(body,plan.name,()=>{
   if(f.pending||f.districts[id]||f.food<(plan.foodCost??0))return;
   f.food-=plan.foodCost??0;
   const advantage=(f.districts[3]?.scouts&&id===6?1:0)+(f.districts[5]?.medics&&id===4?1:0);
   winterOrder("land",i,d.title,Math.max(2,plan.force-advantage),{hold:plan.hold,spot:d.spot});
  },i===0);
  b.disabled=f.food<(plan.foodCost??0);
 }
}
function winterLocal(id){
 const f=winterState(),d=f.districts[id],body=modal("전후 관리",winterDistricts[id].title);
 winterParagraph(body,d.after);
 winterParagraph(body,"운영 책임 · "+d.owner+" / 시설 "+(d.facility?"가동":"중단"));
 if(d.contract){
  winterParagraph(body,d.paid?"겨울 배급 약속을 이행했다.":"겨울 배급 약속이 남아 있다.");
  if(!d.paid){
   const b=button(body,"약속한 식량 "+d.contract+"자루 지급",()=>{
    if(d.paid||f.food<d.contract)return;
    f.food-=d.contract;d.paid=true;d.loyal=true;winterLocal(id);
   });
   b.disabled=f.food<d.contract;
  }
 }
 if(d.facility&&d.loyal&&d.lastLocal!==s.day){
  button(body,"현지 지원 받기 · 하루 한 번",()=>{
   if(d.lastLocal===s.day)return;
   d.lastLocal=s.day;
   if(id===4&&d.engineers&&s.crafting){
    const equipment=craftEquipment("weapon");
    if(equipment){
     const data=craftState();
     data.wear[equipment.id]=Math.min(100,(data.wear[equipment.id]??100)+12);
    }
   }
   if(id===5)s.energy=Math.min(100,s.energy+25);
   give(id===6?"씨앗":"곡물죽");
   log("현지 시설에서 지원을 받았다.");winterLocal(id);
  });
 }
}
function winterCourt(){
 const f=winterState(),d=f.districts,body=modal("6막","겨울 궁정");
 winterParagraph(body,"마라가 군인과 민간인에게 같은 몫을 주라고 명령했다. 부관은 거부했다. 지금 원정대에 투항하는 대신 자기 병력의 겨울 군량을 요구한다.");
 const approach=f.post?"남부 초소 확보":d[3]?.scouts?"정찰대 측면로 확보":"초소를 다시 돌파해야 함";
 winterParagraph(body,"진입 상황 · "+approach+" / 수송 "+(d[2]?.transport??0)+" / 의무대 "+(d[5]?.medics??0));
 if(!f.priority){
  button(body,"군량부터 궁정 앞으로 보낸다",()=>{f.priority="cargo";f.food++;winterCourt();});
  button(body,"부상자부터 생오렐로 보낸다",()=>{f.priority="people";f.army++;winterCourt();});
  if(d[2]?.transport>=2&&d[5]?.medics)button(body,"호송대를 나눠 군량과 부상자를 모두 보낸다",()=>{
   f.priority="both";f.food++;f.army++;winterCourt();
  });
  return;
 }
 const penalty=(f.post||d[3]?.scouts?0:2)+(f.priority==="people"&&!d[5]?.medics?1:0);
 const fugitive=d[4]?.fugitive?1:0;
 button(body,"부관과 거래 · 군인 몫 약속",()=>winterOrder("court","deal","투항의 값",4+penalty+fugitive),true);
 button(body,"거래를 거절하고 정면 돌파",()=>winterOrder("court","storm","궁정 정면 돌파",7+penalty+fugitive,{hold:12}));
 if(d[4]?.engineers&&d[3]?.scouts)button(body,"정비공과 정찰대를 저장고로 보낸다",()=>{
  winterOrder("court","vault","저장고 밖의 전투",6+penalty+fugitive,{hold:16});
 });
}
function winterLoyalists(f){
 const values=Object.values(f.districts);
 return values.filter(d=>d.loyal&&d.facility).length;
}
function winterMutiny(){
 const f=winterState(),body=modal("7막","우리 깃발 아래");
 const loyal=winterLoyalists(f);
 winterParagraph(body,"이레나: 지금 이 문을 열면 어디까지 먹일 수 있는지, 이번에는 말해 줘.");
 winterParagraph(body,"지원 의사를 밝힌 지방 "+loyal+"곳 · 민간 배급 인력 "+winterCivilians()+"명 · 남은 군량 "+f.food+"자루");
 for(const [id,d] of Object.entries(f.districts))winterParagraph(body,regions[id].name+" · "+(d.loyal&&d.facility?"창고 개방 지원":"자기 배급 우선")+" · "+d.owner);
 const garrison=Math.max(3,8-loyal+(f.debt?1:0)+(s.karukAct?.plan==="levy"?1:0));
 button(body,"저장고를 돌파해 이레나의 지휘권을 빼앗는다",()=>winterOrder("mutiny","force","우리 깃발 아래",garrison),true);
 if(loyal>=3&&f.food>=2&&f.districts[5]?.medics)button(body,"부상자 후송을 보장하고 투항을 받아낸다",()=>{
  f.food-=2;winterOrder("mutiny","mercy","무기를 내려놓는 시간",Math.max(2,garrison-3),{hold:12});
 });
}
function winterStart(){
 const f=winterState(),p=f.pending;
 if(!p||f.battle||s.region!==p.region)return;
 if($("dialog").open)$("dialog").close();
 const center={x:player.x,z:player.y};
 const offsets=[[6,2],[7,-4],[9,4],[10,-2],[11,6],[13,0],[12,-7],[15,5],[16,-4],[14,8]];
 const walkable=(x,z)=>supportAt(x,z)!==null;
 const findPoint=([x,z])=>{
  for(const [dx,dz] of [[x,z],[-x,z],[z,x],[z,-x]])if(walkable(center.x+dx,center.z+dz))return [center.x+dx,center.z+dz];
  return [center.x+x,center.z+z];
 };
 f.battle={...p,center,seconds:0,held:0,health:100,residents:[],
  enemies:Array.from({length:p.force},(_,i)=>{
   const [x,z]=findPoint(offsets[i%offsets.length]);
   return {x,z,hp:p.kind==="mutiny"?8:6,ready:i*1.65,attack:0};
  }),
  allies:Array.from({length:p.allies},(_,i)=>({name:"원정 지원병 "+(i+1),x:center.x-1-i*.7,z:center.z+2,hp:38,attack:0})),
 };
 s.energy=Math.max(85,s.energy);
 log(p.hold?"수비대를 격퇴하고 현장을 "+p.hold+"초간 확보하자.":"수비대를 격퇴하자.");
 render();questSubtitle(p.title,p.hold?"수비대를 격퇴하고 현장을 확보하기":"수비대를 격퇴하기");
}
function winterUpdate(dt){
 const b=winterBattle(),f=s.winterCampaign;
 if(!b||$("dialog").open)return;
 if(winterClock.battle!==b){winterClock.battle=b;winterClock.nextSave=0;}
 b.seconds+=dt;campaignSkirmish(b,b.center,dt,"수비대의 공격을 받았다.");
 if(Math.hypot(player.x-b.center.x,player.y-b.center.z)<9)b.held+=dt;
 if(!b.health){
  delete f.battle;s.energy=100;log("원정대를 재정비했다. 같은 작전을 다시 시작할 수 있다.");render();
  return;
 }
 if(b.enemies.every(e=>!e.hp)&&b.held>=b.hold){winterWin();return;}
 if(b.seconds>=winterClock.nextSave){winterClock.nextSave=b.seconds+2;autosave();}
}
function winterWin(){
 const f=winterState(),b=f.battle;
 if(!b)return;
 const surviving=b.allies.filter(a=>a.hp>0).length;
 f.food=Math.max(0,f.food-(f.pending.kits-b.kits));
 f.army=Math.max(0,f.army-(b.allies.length-surviving));
 delete f.battle;delete f.pending;
 if(b.kind==="rear"){
  f.post=b.choice!=="withdraw";
  if(b.choice!=="hold"){
   f.reserve[0]=(f.reserve[0]??0)+2;f.reserve[1]=(f.reserve[1]??0)+1;
  }else{
   for(const i of [0,1])f.reserve[i]=Math.max(0,(f.reserve[i]??0)-1);
  }
  winterSet("lands","다섯 지방의 겨울",f.post?"초소를 유지했다. 다섯 지방의 병력과 시설을 확보하자.":"부상자를 살려 철수했다. 초소는 적이 다시 차지했다.");
 }
 if(b.kind==="land"){
  const d=winterDistricts[b.region],p=d.plans[b.choice];
  f.districts[b.region]={...p,facility:p.facility!==false};
  f.food+=p.food??0;f.seeds+=p.seeds??0;
  if(p.loyal)f.army++;
  winterSet(Object.keys(f.districts).length===5?"court":"lands",d.title,p.after);
 }
 if(b.kind==="court"){
  f.debt=b.choice==="deal"?3:0;
  f.food+=b.choice==="vault"?9:b.choice==="deal"?7:5;
  f.seeds+=b.choice==="vault"?6:b.choice==="deal"?4:3;
  f.mara=b.choice==="storm"?"생포":b.choice==="deal"?"투항":"도주";
  winterSet("mutiny","마라의 장부","겨울 궁정을 점령했다. 마라의 배급 기록 옆에 원정군의 징발 장부가 놓여 있다. 이레나가 저장고를 봉쇄했다.");
 }
 if(b.kind==="mutiny"){
  f.irena=b.choice==="mercy"?"지휘권을 내려놓음":"전투 뒤 떠남";
  f.food=Math.max(0,f.food-(f.debt??0));
  winterSet("ration","창고를 연 다음","이레나의 부대가 물러났다. 이제 여덟 지방의 겨울 몫을 결정해야 한다.");
 }
}
function winterCivilians(){
 const result=s.brunnenAct?.result;
 return new Set([...(result?.evacuated??[]),...(result?.sheltered??[])]).size;
}
function winterAllocation(policy){
 const f=winterState(),d=f.districts;
 const stocks=Array.from({length:8},(_,id)=>Math.max(0,f.reserve[id]??0));
 const need=[3,5,3,3,4,4,3,4];
 const keep=policy==="release"?0:policy==="protect"?Math.ceil(f.food*.5):Math.floor(f.food*.2);
 const emergencySeeds=policy==="release"?Math.floor(f.seeds/3):0;
 let food=Math.max(0,f.food-keep+emergencySeeds);
 const flow=need.map((_,i)=>i).sort((a,b)=>(need[b]-stocks[b])-(need[a]-stocks[a]));
 for(const i of flow){
  const amount=Math.min(food,Math.max(0,need[i]-stocks[i]),policy==="divide"?3:Infinity);
  stocks[i]+=amount;food-=amount;
 }
 const result=stocks.map((amount,id)=>{
  const work=id===0?(s.asagiAct?.result?.saved?.length??0):id===1?winterCivilians():id===7?f.army:d[id]?.facility?3:1;
  const shortage=Math.max(0,need[id]-amount);
  return {id,food:amount,shortage,workers:Math.max(0,work-Math.ceil(shortage/2)),seeds:0};
 });
 const beds=result.filter(row=>row.workers>0).sort((a,b)=>b.workers-a.workers);
 if(policy==="release"&&d[6]?.distributed)beds.sort((a,b)=>Number(b.id===6)-Number(a.id===6));
 for(let i=0;beds.length&&i<f.seeds-emergencySeeds;i++)beds[i%beds.length].seeds++;
 return result;
}
function winterRation(){
 const f=winterState(),body=modal("엔딩","창고를 연 다음");
 winterParagraph(body,"나눌 수 있는 군량 "+f.food+"자루 · 봄 종자 "+f.seeds+"자루 · 마라 "+f.mara+" · 이레나 "+f.irena);
 const policies=[["release","군량부터 풀어 지금 굶는 사람을 살린다"],["protect","종자를 지키고 지역 비축으로 버틴다"],["divide","여덟 지방에 배급권과 종자를 나눈다"]];
 for(const [id,label] of policies){
  const result=winterAllocation(id);
  const detail=document.createElement("details"),summary=document.createElement("summary");
  summary.textContent=label;detail.append(summary);
  for(const r of result)winterParagraph(detail,regions[r.id].name+" · 배급 "+r.food+" / 부족 "+r.shortage+" / 종자 "+r.seeds+" / 파종 인력 "+r.workers);
  const b=button(detail,label,()=>{
   if(f.phase!=="ration")return;
   f.ending={policy:id,regions:result};
   $("dialog").close();winterSet("return","첫 파종","배급을 시작했다. 아사기 공동묘지로 돌아가자.");
  });
  if(id==="divide"&&(!Object.values(f.districts).every(d=>d.facility)||winterLoyalists(f)<3||
    winterCivilians()<2||!(s.asagiAct?.result?.saved?.length))){
   b.disabled=true;winterParagraph(detail,"분산 배급에는 다섯 지방의 가동 시설, 협조하는 지방 세 곳, 아사기와 브뤼넨의 배급 인력이 필요해.");
  }
  body.append(detail);
 }
}
function winterAftercare(){
 const f=winterState(),id=s.region,r=f.ending.regions[id],body=modal("전후 복구",regions[id].name);
 winterParagraph(body,"남은 배급 "+r.food+" / 부족 "+r.shortage+" / 종자 "+r.seeds+" / 일손 "+r.workers);
 if(r.shortage<=0)return;
 for(const item of ["손질한 곡물",...regionalDishes.map(dish=>dish.id)]){
  if(!count(item))continue;
  const expired=Boolean(regionalDishById[item]&&!freshFoodBatch(item));
  const action=row(body,craftName(item)+" · 가방 "+count(item),expired?"유통기한 지남":"1인분 지원",()=>{
   if(deliverWinterRelief(item))winterAftercare();
  });
  action.prepend(craftCardArt(craftItems[item]));
  action.disabled=expired||timberFree(item)<1;
 }
}
function deliverWinterRelief(id){
 const record=s.winterCampaign?.ending?.regions?.[s.region];
 if(!record||record.shortage<=0||timberFree(id)<1||id!=="손질한 곡물"&&!regionalDishById[id])return false;
 const success=craftTransaction(()=>{
  if(id==="손질한 곡물")give(id,-1);
  else if(!spendFreshServing(id))return false;
  record.food++;record.shortage--;
  return true;
 },["winterCampaign"]);
 if(success){
  districtEcologyDirty=true;
  log(record.shortage===0?"이 지역의 겨울 부족분을 채웠다.":craftName(id)+" 1인분을 구호 식량으로 지원했다.","success");
 }
 return success;
}
function winterLedger(){
 const f=winterState(),body=modal("전후 기록","여덟 지방의 첫 봄");
 for(const d of f.ending?.regions??[])winterParagraph(body,regions[d.id].name+" · 배급 "+d.food+" / 부족 "+d.shortage+" / 종자 "+d.seeds+" / 일손 "+d.workers);
 if(f.crop)winterParagraph(body,f.crop.name+"에 씨앗을 심었다. "+f.crop.due+"일차부터 수확할 수 있다.");
 if(f.crop&&!f.crop.harvested&&s.day>=f.crop.due)button(body,"첫 수확 거두기",()=>{
  if(f.crop.harvested)return;
  f.crop.harvested=true;give("손질한 곡물",f.crop.yield);log("첫 파종에서 곡식 "+f.crop.yield+"개를 거뒀다.");winterLedger();
 });
}
function winterPlant(){
 const f=winterState(),body=modal("에필로그","첫 파종");
 winterParagraph(body,"어느 밭부터 되살릴까? 낮은 밭에는 당장 먹을 곡식을, 감나무 아래 밭에는 다음 겨울을 위한 종자를 남길 수 있다.");
 for(const plot of winterPlots){
  button(body,plot.name+" 고르기 · "+plot.days+"일 후 수확",()=>{
   if(f.phase!=="plant")return;
   f.plot=plot.id;$("dialog").close();render();questSubtitle("첫 파종",plot.name+"까지 항아리를 가져가자.");
  });
 }
}
function winterSow(){
 const f=winterState(),plot=winterPlots.find(p=>p.id===f.plot);
 if(f.phase!=="plant"||!plot||!count("마지막 씨앗 항아리"))return;
 give("마지막 씨앗 항아리",-1);
 f.crop={name:plot.name,plot:plot.id,due:s.day+plot.days,yield:plot.yield};
 winterSet("done","Mercy’s Last Grain","씨앗을 심었다. 다음 봄을 돌보는 일은 이제 이곳에 사는 사람들에게 남았다.");
}
function winterDraw(mesh){
 const crop=s.region===0?s.winterCampaign?.crop:null;
 if(!crop)return;
 const plot=winterPlots.find(p=>p.id===crop.plot);
 if(!plot)return;
 const ripe=!crop.harvested&&s.day>=crop.due;
 const key=plot.id+":"+ripe+":"+Boolean(crop.harvested);
 if(winterClock.crop?.key!==key){
  if(winterClock.crop)gl.deleteBuffer(winterClock.crop.buffer);
  const previous=verts;verts=[];
  for(let i=0;i<6;i++){
   const x=plot.x+(i%3-1)*1.15,z=plot.y+8+Math.floor(i/3)*1.2,y=height(x,z);
   box(x,y+.03,z,1.02,.085,.82,[.30,.23,.16],.08);
   if(!crop.harvested)for(const offset of [-.28,0,.28])
    rounded(x+offset,y+(ripe?.27:.1),z,.10,ripe?.27:.11,.11,ripe?[.71,.58,.23]:[.33,.48,.21]);
  }
  const buffer=gl.createBuffer(),count=verts.length/10;upload(buffer);verts=previous;
  winterClock.crop={key,buffer,count};
 }
 mesh(winterClock.crop.buffer,winterClock.crop.count,[0,0,0],0);
}
function winterStatus(){
 const b=winterBattle();
 return "체력 "+b.health+" · 수비대 "+b.enemies.filter(e=>e.hp>0).length+" · 지원병 "+b.allies.filter(e=>e.hp>0).length+
  (b.hold?" · 확보까지 "+Math.max(0,Math.ceil(b.hold-b.held))+"초":"")+" · 보급 "+b.kits+" ("+(pad.active?"Y":"E")+")";
}
