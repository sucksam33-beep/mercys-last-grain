"use strict";
const timberGrades=[
 {id:"timber_common",name:"일반 목재",yield:2,days:2,tool:"맨손",action:"줍기"},
 {id:"timber_log",name:"원목",yield:4,days:7,tool:"손도끼",action:"벌목"},
 {id:"timber_quality",name:"질 좋은 목재",yield:3,days:12,tool:"벌목 도끼",action:"벌목"},
 {id:"timber_premium",name:"고급 목재",yield:2,days:20,tool:"강화 벌목 도끼",action:"정밀 벌목"}
];
const timberAxes=["손도끼","벌목 도끼","강화 벌목 도끼"];
const timberAliases=new Map(Object.entries({
 "삼나무":2,"편백":2,"유럽참나무":2,"포플러":2,"미루나무":2,"메스키트":2,
 "폰데로사소나무":2,"더글러스전나무":2,"로지폴소나무":2,"사시나무":2,"낙우송":2,
 "피칸나무":2,"해안 카수아리나":2,"타마린드":2,"시트카가문비":2,"종이자작나무":2,
 "일반 목재":1,"원목":2,"질 좋은 목재":3,"고급 목재":4,"선별 목재":3,"최상급 목재":4
}));
const timberGroupRows=[
 [0,"cedar-yard","감나무집 뒤 삼나무 숲 가장자리","삼나무",1,6,233,229],
 [0,"cedar-paddy","논둑 위 삼나무 숲","삼나무",2,4,326,293],
 [0,"cypress-sluice","개울 상류 곧은 편백 군락","편백",3,2,392,310],
 [1,"poplar-market","시장 하류 포플러 둑","포플러",1,6,371,281],
 [1,"poplar-repair","운하 수리소 맞은편 포플러 숲","포플러",2,4,132,157],
 [1,"oak-lock","상류 갑문 위 참나무 둔덕","유럽참나무",3,2,381,143],
 [2,"cottonwood-wash","저수지 진입로의 마른 물골","미루나무",1,6,512,253],
 [2,"cottonwood-inflow","저수지 상류 미루나무 띠","미루나무",2,4,482,228],
 [2,"mesquite-ledge","협곡 북향 그늘턱","메스키트",3,2,156,146],
 [3,"ponderosa-road","고원 진입로 소나무 숲","폰데로사소나무",2,4,114,156],
 [3,"fir-cliff","붉은 절벽 아래 전나무 사면","더글러스전나무",3,3,176,281],
 [3,"fir-shelter","붉은 절벽 너머 바람막이 골짜기","더글러스전나무",4,1,152,335],
 [4,"lodgepole-rail","철도 적재장 뒤 소나무 숲","로지폴소나무",2,4,131,117],
 [4,"lodgepole-lake","고산 호수 북쪽 소나무 비탈","로지폴소나무",3,3,495,215],
 [4,"lodgepole-inlet","호수 유입천 상류의 보호 골짜기","로지폴소나무",4,1,455,170],
 [5,"cypress-drift","제방 아래 낙우송 표류목 지대","낙우송",1,6,522,262],
 [5,"cypress-stilt","수상가옥 뒤 낙우송 군락","낙우송",2,4,280,253],
 [5,"cypress-inland","제방 안쪽 낙우송 숲","낙우송",3,2,471,256],
 [6,"casuarina-dock","선착장 뒤 해안 방풍림","해안 카수아리나",2,4,476,281],
 [6,"tamarind-limestone","석회암 구릉의 타마린드 숲","타마린드",3,3,485,120],
 [6,"casuarina-shelter","반도 안쪽 바람 그늘 숲","해안 카수아리나",4,1,144,315],
 [7,"birch-observatory","관측소 아래 자작나무 숲","종이자작나무",2,4,151,141],
 [7,"spruce-camp","방한 숙영지 뒤 가문비 사면","시트카가문비",3,3,112,299],
 [7,"spruce-ridge","바람 센 능선 너머의 보호 계곡","시트카가문비",4,1,143,336]
];
const timberGroups=timberGroupRows.map(([region,id,label,species,grade,count,x,z])=>({
 region,id:"timber:"+id,label,species,grade,x,z,
 nodes:Array.from({length:count},(_,i)=>({id:"timber:"+id+":"+(i+1),x:x+(i%3-1)*4.8,z:z+Math.floor(i/3)*6.8}))
}));
const timberFixedPositions={"timber:cedar-yard:1":[228.2,229.0],"timber:cedar-yard:2":[231.108,227.523],"timber:cedar-yard:3":[240.659,232.856],"timber:cedar-yard:4":[223.452,235.096],"timber:cedar-yard:5":[237.117,238.268],"timber:cedar-yard:6":[240.113,236.44],"timber:cedar-paddy:1":[321.2,293.0],"timber:cedar-paddy:2":[326.0,293.0],"timber:cedar-paddy:3":[330.8,293.0],"timber:cedar-paddy:4":[321.2,299.8],"timber:cypress-sluice:1":[387.2,310.0],"timber:cypress-sluice:2":[392.0,310.0],"timber:poplar-market:1":[366.2,281.0],"timber:poplar-market:2":[371.0,281.0],"timber:poplar-market:3":[375.8,281.0],"timber:poplar-market:4":[366.2,287.8],"timber:poplar-market:5":[371.0,287.8],"timber:poplar-market:6":[375.8,287.8],"timber:poplar-repair:1":[122.544,158.166],"timber:poplar-repair:2":[134.313,157.64],"timber:poplar-repair:3":[137.094,159.382],"timber:poplar-repair:4":[127.2,163.8],"timber:oak-lock:1":[376.2,143.0],"timber:oak-lock:2":[381.0,143.0],"timber:cottonwood-wash:1":[507.2,253.0],"timber:cottonwood-wash:2":[512.0,253.0],"timber:cottonwood-wash:3":[516.8,253.0],"timber:cottonwood-wash:4":[507.2,259.8],"timber:cottonwood-wash:5":[512.0,259.8],"timber:cottonwood-wash:6":[516.8,259.8],"timber:cottonwood-inflow:1":[477.2,228.0],"timber:cottonwood-inflow:2":[482.0,228.0],"timber:cottonwood-inflow:3":[486.8,228.0],"timber:cottonwood-inflow:4":[477.2,234.8],"timber:mesquite-ledge:1":[148.887,145.36],"timber:mesquite-ledge:2":[156.0,146.0],"timber:ponderosa-road:1":[109.2,156.0],"timber:ponderosa-road:2":[114.0,156.0],"timber:ponderosa-road:3":[118.8,156.0],"timber:ponderosa-road:4":[109.2,162.8],"timber:fir-cliff:1":[168.818,281.294],"timber:fir-cliff:2":[180.117,283.468],"timber:fir-cliff:3":[183.113,281.64],"timber:fir-shelter:1":[147.2,335.0],"timber:lodgepole-rail:1":[119.5,136.0],"timber:lodgepole-rail:2":[124.0,138.5],"timber:lodgepole-rail:3":[129.2,140.5],"timber:lodgepole-rail:4":[126.2,123.8],"timber:lodgepole-lake:1":[489.496,219.748],"timber:lodgepole-lake:2":[495.64,212.687],"timber:lodgepole-lake:3":[499.8,215.0],"timber:lodgepole-inlet:1":[450.2,170.0],"timber:cypress-drift:1":[517.2,262.0],"timber:cypress-drift:2":[522.0,262.0],"timber:cypress-drift:3":[526.8,262.0],"timber:cypress-drift:4":[517.2,268.8],"timber:cypress-drift:5":[522.0,268.8],"timber:cypress-drift:6":[526.8,268.8],"timber:cypress-stilt:1":[275.2,253.0],"timber:cypress-stilt:2":[279.36,255.313],"timber:cypress-stilt:3":[285.504,248.252],"timber:cypress-stilt:4":[275.2,259.8],"timber:cypress-inland:1":[471.05,269.559],"timber:cypress-inland:2":[481.671,246.331],"timber:casuarina-dock:1":[470.26,271.446],"timber:casuarina-dock:2":[475.06,271.446],"timber:casuarina-dock:3":[485.764,286.215],"timber:casuarina-dock:4":[483.023,289.853],"timber:tamarind-limestone:1":[480.2,120.0],"timber:tamarind-limestone:2":[485.0,120.0],"timber:tamarind-limestone:3":[489.8,120.0],"timber:casuarina-shelter:1":[141.513,315.64],"timber:birch-observatory:1":[148.092,142.477],"timber:birch-observatory:2":[151.294,143.382],"timber:birch-observatory:3":[156.966,145.656],"timber:birch-observatory:4":[156.0,141.0],"timber:spruce-camp:1":[107.2,299.0],"timber:spruce-camp:2":[112.0,299.0],"timber:spruce-camp:3":[116.8,299.0],"timber:spruce-ridge:1":[138.2,336.0]};
const timberSites=new Map();
let timberGuide=null;
function timberId(name,grade){
 if(timberGrades.some(g=>g.id===name)||name==="타마린드"&&!grade)return name;
 let mapped=timberAliases.get(name);
 if(!mapped&&typeof name==="string"){
  for(const [prefix,n] of [["선별 ",3],["고급 ",4],["최상급 ",4]]){
   if(name.startsWith(prefix)&&timberAliases.has(name.slice(prefix.length)))mapped=n;
  }
 }
 return mapped?timberGrades[(Number.isInteger(grade)&&grade>=1&&grade<=4?grade:mapped)-1].id:name;
}
function migrateTimber(state){
 if(!state||state.timberVersion>=1)return state;
 const metadata=state.timberGrades??state.harvestGrades??{};
 function walk(value){
  if(!value||typeof value!=="object")return;
  if(Array.isArray(value)){
   if(typeof value[0]==="string"&&typeof value[1]==="number")value[0]=timberId(value[0],metadata[value[0]]);
   for(const entry of value)walk(entry);
   return;
  }
  for(const [key,item] of Object.entries(value)){
   const canonical=timberId(key,metadata[key]);
   if(canonical!==key&&typeof item==="number"){
    value[canonical]=(Number(value[canonical])||0)+item;
    delete value[key];
   }else if(["id","item","itemId","material"].includes(key)&&typeof item==="string")value[key]=timberId(item,value.grade??metadata[item]);
   else walk(item);
  }
 }
 for(const key of ["bag","storage","placedStorage","tradeCargo","shipments","reservations","reserved","reservedTimber","pendingConstruction","quests","activeQuests","crafting"]){
  walk(state[key]);
 }
 state.timberVersion=1;
 return state;
}
function timberReserved(id){
 const scan=stock=>{
  if(!stock||typeof stock!=="object")return 0;
  if(Array.isArray(stock)&&stock[0]===id)return Math.max(0,Number(stock[1])||0);
  if(stock.id===id||stock.item===id||stock.itemId===id)return Math.max(0,Number(stock.count??stock.quantity)||0);
  return Object.entries(stock).reduce((sum,[key,value])=>sum+(key===id?Math.max(0,Number(value)||0):scan(value)),0);
 };
 return [s.reservedTimber,s.reservations,s.reserved].reduce((sum,stock)=>sum+scan(stock),0);
}
function timberFree(id){return Math.max(0,count(id)-timberReserved(id));}
function timberCost(needs,upgrade=false){
 const cost=new Map();
 const ordered=upgrade?[...needs].sort(([a],[b])=>timberGrades.findIndex(g=>g.id===b)-timberGrades.findIndex(g=>g.id===a)):needs;
 for(const [id,n] of ordered){
  let remaining=n;
  const index=timberGrades.findIndex(g=>g.id===id);
  const candidates=upgrade&&index>=0?timberGrades.slice(index).map(g=>g.id):[id];
  for(const item of candidates){
   const available=timberFree(item)-(cost.get(item)??0),take=Math.min(remaining,Math.max(0,available));
   if(take){cost.set(item,(cost.get(item)??0)+take);remaining-=take;}
   if(!remaining)break;
  }
  if(remaining)return null;
 }
 return [...cost];
}
function timberConfirm(needs,done,back){
 const exact=timberCost(needs);
 if(exact){done(exact);return;}
 const higher=timberCost(needs,true);
 if(!higher){log("사용할 수 있는 재료가 부족해.");return;}
 const body=modal("목재 대체","상위 등급 목재를 사용하시겠어요?");
 craftParagraph(body,higher.map(([id,n])=>craftName(id)+" ×"+n).join(" · "));
 button(body,"표시된 재료 사용",()=>{
  if(higher.some(([id,n])=>timberFree(id)<n)){log("사용할 수 있는 재료가 바뀌었어.");return;}
  done(higher);
 },true);
 button(body,"돌아가기",back);
}
function timberSite(group,node){
 if(timberSites.has(node.id))return timberSites.get(node.id);
 const [fixedX,fixedZ]=timberFixedPositions[node.id]??[node.x,node.z];
 let choice=null;
 for(let ring=0;ring<=12&&!choice;ring++){
  for(let k=0;k<(ring?16:1);k++){
   const a=k*Math.PI/8+ring*.27,x=fixedX+Math.cos(a)*ring*2.4,z=fixedZ+Math.sin(a)*ring*2.4;
   if(roadDist(x,z)<4.2||!fitsTree(x,z,2.2)||s.region===0&&asagiPaddies.some(p=>paddyEdge(p,x,z)>-2))continue;
   if(aimObjects.some(p=>p.action&&Math.hypot(x-p.action.x,z-p.action.z)<2.8))continue;
   if([...timberSites.values()].some(p=>p.region===group.region&&Math.hypot(x-p.x,z-p.z)<3.1))continue;
   const y=supportAt(x,z);
   if(y===null||y<2.55)continue;
   if(![0,1,2,3,4,5,6,7].some(i=>{
    const angle=i*Math.PI/4,a=x+Math.cos(angle)*2,b=z+Math.sin(angle)*2,base=supportAt(a,b);
    return base!==null&&Math.abs(base-y)<.7&&unobstructed({x:a,y:b,floor:base},{x,y:z})!==null;
   }))continue;
   choice={x,z,region:group.region};
   break;
  }
 }
 if(!choice)choice={x:node.x,z:node.z,region:group.region};
 timberSites.set(node.id,choice);
 return choice;
}
function timberHint(action){
 const {group,id}=action,grade=timberGrades[group.grade-1],renew=s.worldHarvest?.[id]??0;
 if(renew>s.day)return group.species+" · "+renew+"일차에 다시 채집 가능";
 return group.species+" · "+grade.name+" ×"+grade.yield+" · "+(group.grade===1?grade.action:grade.tool+" 필요");
}
function paintTimberSites(){
 for(const group of timberGroups.filter(g=>g.region===s.region)){
  for(const [index,node] of group.nodes.entries()){
   const {x,z}=timberSite(group,node),y=terrainSurface(x,z);
   const action={type:"timberGrade",id:node.id,x,z,reach:3,group};
   const grade=group.grade,tint=color(regions[s.region].tree),bark=color("#67533e");
   const alive=worldResourceAvailable(node.id);
   const size=grade===4?11.8:grade===3?9.8:7.5;
   if(grade===1&&alive){
    tube([x-1,y+.16,z-.33],[x+1.03,y+.25,z+.24],.12,.065,bark,surface.trunk,8);
    tube([x-.2,y+.2,z],[x+.42,y+.53,z-.73],.07,.025,bark,surface.trunk,6);
   }else if(grade>1&&alive){
    // Harvest meshes belong to the ecology buffer, which is rebuilt independently of static trees.
    if(/소나무|가문비|편백|삼나무|전나무|낙우송/.test(group.species))paintPine(x,y,z,size,tint,index+2125,false);
    else{
     taper(x,y,z,size*.72,size*.038,.055,bark,9);
     for(let i=0;i<7;i++){
      const a=i*2.399,dx=Math.cos(a)*size*.16,dz=Math.sin(a)*size*.16,h=y+size*(.52+i*.051);
      tube([x,h-size*.13,z],[x+dx,h,z+dz],.105,.035,bark,surface.trunk,6);
      crown(x+dx,h,z+dz,size*.18,size*.18,shade(tint,.82+i*.05));
     }
    }
    const trunk=Math.max(.16,size*.038);
    addSurface(x,z,trunk*2,trunk*2,y-.05,y+3,false);
   }else if(grade>1)taper(x,y,z,.43,.27,.22,bark,9);
   else if(!alive)continue;
   const top=alive&&grade>1?y+3:y+.55;
   aimBox(group.label,x,z,grade===1?2.2:.95,grade===1?1.6:.95,y-.09,top,null,action);
   if(index===0){
    box(x+1.4,y,z,.13,1.18,.13,bark,0,surface.wall);
    box(x+1.4,y+.86,z,.68,.29,.10,color(["#d1b77e","#b4ba83","#8cb7a1","#ccaf65"][grade-1]),0,surface.wall);
   }
  }
 }
}
function timberHarvest(action){
 const {group,id}=action,grade=timberGrades[group.grade-1],axis=group.grade-2;
 const equipment=craftEquipment("weapon");
 const tool=group.grade===1?null:timberAxes.slice(Math.max(axis,0)).reverse().find(item=>count(item)>0&&(s.crafting?.wear?.[item]??100)>0)
  ??(axis<=0&&equipment?.stats.axe?equipment.id:null);
 if(axis>=0&&!tool){log(grade.tool+"가 필요해.");return true;}
 const region=s.region;
 const valid=()=>region===s.region&&actionInReach(action)&&(s.worldHarvest?.[id]??0)<=s.day;
 const finish=()=>{
  if(!valid()||s.energy<5||count(grade.id)+grade.yield>999)return;
  const old=s.timberDiscovered;
  const ok=craftTransaction(data=>{
   if(tool&&(data.wear[tool]??100)<=0)return false;
   give(grade.id,grade.yield);
   s.worldHarvest??={};
   s.worldHarvest[id]=s.day+grade.days;
   s.timberDiscovered={...old,[group.id]:true};
   if(tool)craftWear(data,tool,grade===timberGrades[3]?4:2);
   tick(0,group.grade===1?1:4);
   return true;
  });
  if(!ok){s.timberDiscovered=old;return;}
  districtEcologyDirty=true;
  log(grade.name+" ×"+grade.yield+" 획득");
  render();
 };
 if(!valid())return true;
 if(count(grade.id)+grade.yield>999){log("가방의 목재 칸이 가득 찼어.");return true;}
 if(s.energy<5){log("기운이 부족해. 음식을 먹거나 쉬어.");return true;}
 if(tool)beginToolMotion(tool,finish,valid,"right",action);
 else finish();
 return true;
}
function timberCodex(){
 const body=craftPanel("도감 · 제작 재료 · 목재");
 for(const [index,grade] of timberGrades.entries()){
  const section=document.createElement("section");body.append(section);
  section.append(craftCardArt(craftItems[grade.id]));
  addPriorityModelPreview(section,grade.id);
  craftParagraph(section,(index+1)+"등급 · "+grade.name+" · "+grade.action+" · "+grade.tool+" · 채취당 "+grade.yield+"개 · "+grade.days+"일 후 갱신");
  craftParagraph(section,"가방 "+count(grade.id)+"개 · 예약 "+timberReserved(grade.id)+"개 · 사용 가능 "+timberFree(grade.id)+"개");
  for(const group of timberGroups.filter(g=>g.grade===index+1)){
   const next=group.nodes.map(n=>s.worldHarvest?.[n.id]??0).filter(day=>day>s.day).sort((a,b)=>a-b);
   const spot=timberSites.get(group.nodes[0].id)??group;
   const route=s.region===group.region?" · 동서 "+Math.round(spot.x)+" / 남북 "+Math.round(spot.z):"";
   if(s.region===group.region)menuAction(section,group.label+" · 길 안내",()=>{timberGuide={...spot,region:group.region};resumeGameplay();});
   craftParagraph(section,regions[group.region].name+" · "+group.label+" · "+group.species+(s.timberDiscovered?.[group.id]?" · 발견":"")+route+(next.length?" · "+next[0]+"일차부터 갱신":""));
  }
  const uses=Object.values(craftRecipes).filter(recipe=>recipe.needs.some(([id])=>id===grade.id)).map(recipe=>recipe.name);
  craftParagraph(section,"제작 · "+uses.join(" · "));
 }
 menuAction(body,"제작 도감으로",craftShowCodex);
}
function timberTradeRows(body,refresh=()=>shop()){
 for(const [index,price] of [[0,4],[1,9],[2,16],[3,30]]){
  if(index===3&&!(s.soilCampaign?.complete||s.stage>=6))continue;
  if(index===2&&s.region===0&&s.stage<4)continue;
  const grade=timberGrades[index];
  row(body,grade.name,coinAmount(price,"1개 구매",true),()=>craftBuy(grade.id,price,refresh));
 }
 for(const [item,price] of [["고철",4],["철재",12]]){
  if(item==="고철"&&s.region!==1)continue;
  row(body,item,coinAmount(price,"1개 구매",true),()=>craftBuy(item,price,refresh));
 }
}
const timberRepairs={
 summer:{name:"지붕 골조와 대피로 정비",needs:[["timber_log",2]]},
 market:{name:"시장 지하 창고 받침",needs:[["timber_log",2]]},
 smith:{name:"구난 마차 화물 받침",needs:[["timber_quality",2]]},
 delta:{name:"생오렐 수차 보수",needs:[["timber_quality",2]]},
 snow:{name:"카루크 임시 구조물 받침",needs:[["timber_log",2]]},
 sealed:{name:"북부 구호 수송 장비 정비",needs:[["timber_quality",2]]}
};
function timberCampaignRepair(step){return timberRepairs[step];}
function timberStock(){
 const body=modal("목재","가방과 예약 물량");
 s.reservedTimber??={};
 const stock=s.reservedTimber["현장 비축"]??={};
 for(const grade of timberGrades){
  const id=grade.id;
  craftParagraph(body,grade.name+" · 가방 "+count(id)+" · 사용 가능 "+timberFree(id)+" · 예약 "+timberReserved(id));
  if(timberFree(id)>0)button(body,"현장용 "+grade.name+" 1개 예약",()=>{
   if(timberFree(id)>0){stock[id]=(stock[id]??0)+1;autosave();timberStock();}
  });
  if(stock[id]>0)button(body,grade.name+" 1개 예약 해제",()=>{
   if(stock[id]>0){stock[id]--;autosave();timberStock();}
  });
 }
 button(body,"가방으로",satchel);
}

function timberTransit(from,to){
 const campaign=s.soilCampaign;
 const open=region=>Boolean(campaign?.routes?.[region]||region===7&&campaign?.history?.some(entry=>entry.mission==="snow"));
 if(!open(from)||!open(to)||from===to)return 0;
 const seen=new Set([from]),queue=[[from,0]];
 for(const [at,days] of queue){
  for(const road of worldRoads[at]){
   if(seen.has(road.to)||!open(road.to))continue;
   if(road.to===to)return Math.max(1,days+1-(s.timberProjects?.ship&&[from,to].includes(6)?1:0));
   seen.add(road.to);queue.push([road.to,days+1]);
  }
 }
 return 0;
}
function timberShipMenu(){
 const from=s.region,body=modal("목재 화물","지역 운송소");
 const consignments=s.timberShipments??=[];
 for(const shipment of consignments){
  const {id,count:n,to,arrival}=shipment;
  const label=craftName(id)+" ×"+n+" · "+regions[to].name+" · "+arrival+"일차";
  if(to===from&&arrival<=s.day)row(body,label,"수령",()=>{
   if(s.region!==to||!consignments.includes(shipment)||count(id)+n>999)return;
   const index=consignments.indexOf(shipment);
   const beforeDay=s.regionalFood?.karukShipmentDay;
   consignments.splice(index,1);give(id,n);
   if(to===7)foodState().karukShipmentDay=s.day;
   if(!autosave()){give(id,-n);consignments.splice(index,0,shipment);if(to===7)foodState().karukShipmentDay=beforeDay;return;}
   districtEcologyDirty=true;
   timberShipMenu();render();
  });
  else craftParagraph(body,label);
 }
 const agreed=regions.flatMap((region,to)=>{
  const days=timberTransit(from,to);return days?[[to,days]]:[];
 });
 if(!agreed.length)craftParagraph(body,"연결된 운송 협약이 없어.");
 for(const [to,days] of agreed){
  for(const {id,name} of timberGrades){
   if(!timberFree(id))continue;
   row(body,regions[to].name+" · "+name+" ×1 · "+days+"일","발송",()=>{
    if(s.region!==from||!timberTransit(from,to)||!timberFree(id))return;
    give(id,-1);
    consignments.push({id,count:1,from,to,arrival:s.day+days});
    if(!autosave()){consignments.pop();give(id,1);return;}
    timberShipMenu();render();
   });
  }
 }
 button(body,"상점으로",shop);
}

const timberProjects=[
 {id:"market",region:1,spot:"station",name:"시장 화물 분류대",needs:[["timber_quality",2],["고철",1]],act:2},
 {id:"sluice",region:0,spot:"gate",name:"정밀 수문틀 설치",needs:[["정밀 수문틀",1],["정밀 연결부",2]],after:true},
 {id:"ship",region:6,spot:"station",name:"대형 수송선 보강",needs:[["대형 선박 용골",1],["단조 철재",2],["craft:waterproof-board",2]],after:true},
 {id:"workshop",region:1,spot:"station",name:"고급 작업대 고정구",needs:[["timber_premium",2],["정밀 연결부",1]],after:true}
];
function craftRecipeUnlocked(recipe){
 if(["정밀 수문틀","대형 선박 용골"].includes(recipe.id)&&s.soilCampaign?.step)return Boolean(s.soilCampaign.complete);
 return s.stage>=recipe.unlock;
}
function timberProjectsMenu(){
 const body=modal("목재 시설","지역 기반 시설 개선");
 for(const project of timberProjects.filter(p=>p.region===s.region&&p.spot===selected)){
  const label=project.name;
  if(s.timberProjects?.[project.id]){craftParagraph(body,label+" · 완료");continue;}
  if(project.after&&!s.soilCampaign?.complete&&s.stage<6||project.act&&(s.soilCampaign?.act??0)<project.act&&s.stage<5){
   craftParagraph(body,label+" · 이야기 진행 후 개방");continue;
  }
  row(body,label+" · "+project.needs.map(([id,n])=>craftName(id)+" ×"+n).join(" · "),"개선",()=>{
   timberConfirm(project.needs,cost=>{
    if(s.region!==project.region||s.timberProjects?.[project.id]||!spend(cost))return;
    s.timberProjects??={};s.timberProjects[project.id]=true;
    if(project.id==="market"&&s.soilCampaign)s.soilCampaign.cargo+=2;
    autosave();districtEcologyDirty=true;log(label+" 완료");timberProjectsMenu();render();
   },timberProjectsMenu);
  });
 }
}
function timberStructuresMenu(){
 const region=s.region,body=modal("목공 시설","집터 주변에 설치");
 const home=here("home");
 for(const [id,item,dx,dz] of [["bench","기본 작업대",4,9],["fence","울타리",-5,8]]){
  if(s.timberStructures?.[region]?.[id]){craftParagraph(body,item+" · 설치됨");continue;}
  row(body,item+" · 1개","놓기",()=>{
   if(s.region!==region||!count(item)||s.timberStructures?.[region]?.[id])return;
   const x=home.x+dx,z=home.y+12+dz,y=supportAt(x,z);
   if(y===null||!fitsTree(x,z,.85)){log("시설을 놓을 자리가 비어 있지 않아.");return;}
   give(item,-1);
   const structures=(s.timberStructures??={})[region]??={};
   structures[id]={x,z};
   if(!autosave()){delete structures[id];give(item);return;}
   districtEcologyDirty=true;timberStructuresMenu();render();
  });
 }
}
function paintTimberStructures(){
 const local=s.timberStructures?.[s.region];
 const oak=color("#765438");
 if(local?.bench){
  const {x,z}=local.bench,y=terrainSurface(x,z);
  if(!showMaterialModel("기본 작업대",x,y,z,1.17,.93,0,true)){
   for(const side of [-1,1])box(x+side*.4,y,z,.13,.79,.47,oak,0,surface.wall);
   box(x,y+.78,z,1.17,.15,.72,oak,0,surface.wall);
  }
  aimBox("내 목공 작업대",x,z,1.3,1.1,y,y+1.1,null,{type:"craftStation",station:"bench",x,z,reach:3.6});
 }
 if(local?.fence){
  const {x,z}=local.fence,y=terrainSurface(x,z);
  if(!showMaterialModel("울타리",x,y,z,2.6,1.11,0,true)){
   for(const dx of [-1.2,0,1.2])box(x+dx,y,z,.14,1.11,.15,oak,0,surface.wall);
   for(const h of [.38,.79])box(x,y+h,z,2.6,.11,.10,oak,0,surface.wall);
  }
  addSurface(x,z,2.6,.20,y,y+1.1,false);
 }
 for(const project of timberProjects.filter(p=>p.region===s.region&&s.timberProjects?.[p.id])){
  const base=here(project.spot);
  const x=base.x+(project.id==="workshop"?4:-4),z=base.y+13,y=terrainSurface(x,z);
  const modelItem=project.id==="sluice"?"정밀 수문틀":project.id==="ship"?"대형 선박 용골":null;
  if(!modelItem||!showMaterialModel(modelItem,x,y,z,1.45,.60,0,true)){
   box(x,y,z,1.45,.30,.8,oak,0,surface.wall);
   box(x,y+.28,z,.93,.13,.51,color("#8b8d80"),0,surface.masonry);
  }
  aimBox(project.name,x,z,1.5,1,y,y+.6);
 }
}
