"use strict";
const CraftingData=(()=>{
 const regions=["아사기","브뤼넨","산타 루시아","주니퍼웰","비버턴","생오렐","암바로","카루크"];
 const categories=["재료","가공품","무기·화살","의상","갑옷·방패"];
 const stations={bench:"목공 작업대",sew:"바느질·무두질 작업대",forge:"가마·화덕"};
 const slots={weapon:"무기",offhand:"보조 손",head:"머리",torso:"몸통",arms:"팔",feet:"발"};
 const items={};
 function material(name,region,source,form,existing=false){
  items[name]={id:name,name,region,source,form,category:0,existing};
 }
 const materials=[
  ["편백",0,"아사기 숲에서 손도끼로 벌목","목재"],["화강암",0,"아사기 또는 비버턴 채석장에서 곡괭이로 채광","광석"],["조릿대 잎",0,"아사기 숲 또는 논둑의 조릿대","식물"],
  ["산토끼 가죽",0,"아사기 산토끼 사냥","가죽"],["멧돼지 가죽",0,"아사기 멧돼지 사냥","가죽"],["꽃사슴 가죽",0,"아사기 꽃사슴 사냥","가죽"],
  ["유럽참나무",1,"브뤼넨 숲에서 손도끼로 벌목","목재"],["석회암",1,"브뤼넨 또는 암바로 채석장에서 채광","광석"],["꿩 가죽",1,"브뤼넨 꿩 사냥","가죽"],["붉은사슴 가죽",1,"브뤼넨 붉은사슴 사냥","가죽"],
  ["메스키트",2,"산타 루시아 숲에서 손도끼로 벌목","목재"],["사암",2,"산타 루시아 또는 주니퍼웰 채석장에서 채광","광석"],["가시배 열매",2,"산타 루시아 선인장 지대에서 채집","식물"],["페커리 가죽",2,"산타 루시아 페커리 사냥","가죽"],
  ["폰데로사소나무",3,"주니퍼웰 숲에서 손도끼로 벌목","목재"],["더글러스전나무",3,"주니퍼웰 숲에서 손도끼로 벌목","목재"],["비버 가죽",3,"주니퍼웰 비버 사냥","가죽"],["엘크 가죽",3,"주니퍼웰 엘크 사냥","가죽"],
  ["로지폴소나무",4,"비버턴 숲에서 손도끼로 벌목","목재"],["와피티사슴 가죽",4,"비버턴 와피티사슴 사냥","가죽"],
  ["낙우송",5,"생오렐 숲에서 손도끼로 벌목","목재"],["숭어",5,"생오렐 또는 암바로에서 바다 채비로 낚시","물고기"],["들오리 가죽",5,"생오렐 들오리 사냥","가죽"],["늪악어 가죽",5,"생오렐 늪악어 사냥","가죽"],
  ["해안 카수아리나",6,"암바로 숲에서 손도끼로 벌목","목재"],["타마린드",6,"암바로 숲에서 채집","식물"],
  ["시트카가문비",7,"카루크 숲에서 손도끼로 벌목","목재"],["종이자작나무",7,"카루크 숲에서 손도끼로 벌목","목재"],["눈신토끼 가죽",7,"카루크 눈신토끼 사냥","가죽"]
 ];
 for(const row of materials)material(...row,true);
 for(const row of [
  ["삼 섬유",0,"아사기역 동쪽 논둑에서 채집 또는 공동 생활터에서 재배","섬유"],
  ["조릿대 줄기",0,"아사기 논둑 또는 숲의 다 자란 조릿대를 잎과 함께 채집","섬유"],
  ["고철",1,"브뤼넨 운하 수리점에서 거래","금속"],["꿩 깃털",1,"브뤼넨 숲의 털갈이 자리 또는 꿩 사냥","깃털"],
  ["구리광석",2,"산타 루시아 채석장 옆 협곡 구리 광맥에서 채광","광석"],["용설란 섬유",2,"산타 루시아 마른 사면의 다 자란 용설란에서 채집","섬유"],
  ["소나무 송진",3,"주니퍼웰 숲의 표식이 있는 소나무에서 채취","수지"],["엘크 힘줄",3,"주니퍼웰 엘크 사냥 또는 숲 입구 사냥꾼과 거래","섬유"],
  ["철광석",4,"비버턴 철도 채석장 옆 광맥에서 채광","광석"],["숯",4,"비버턴 역 보급소에서 거래하거나 가마에서 편백을 태워 제작","연료"],
  ["갈대 섬유",5,"생오렐 낚시터 제방의 갈대밭에서 채집","섬유"],["들오리 솜털",5,"생오렐 제방의 털갈이 자리 또는 역 시장에서 거래","깃털"],
  ["표류 밧줄",6,"암바로 선착장 주변과 연안의 부유물에서 수거","밧줄"],["조개껍데기",6,"암바로 해안. 매일 05:00~09:00, 17:00~21:00 썰물에 채집","조개"],
  ["모직",7,"카루크 관측소 보급처에서 거래","직물"],["자작나무 껍질",7,"카루크 숲 입구에 쓰러진 자작나무에서 채집","목재"]
 ])material(...row);
 const recipes={};
 const parse=text=>text.split("|").map(pair=>{const at=pair.lastIndexOf(":");return [pair.slice(0,at),Number(pair.slice(at+1))]});
 function recipe(name,region,station,needs,category=1,slot=null,effect="",stats={},output=1,id=name,unlock=0){
  const entry={id,name,region,station,needs:parse(needs),category,slot,effect,stats,output,unlock,source:stations[station]+"에서 제작"};
  recipes[id]=entry;
  items[id]={...items[id],...entry,source:items[id]?.source??entry.source};
 }
 for(const [raw,thread,cloth,cord,region] of [
  ["삼 섬유","삼실","삼베","삼 끈",0],["용설란 섬유","용설란 실","용설란 천","용설란 끈",2],["갈대 섬유","갈대 실","갈대 천","갈대 끈",5]
 ]){
  recipe(thread,region,"sew",raw+":2",1,null,"천과 끈을 짜는 실",{},2);
  recipe(cloth,region,"sew",thread+":2",1,null,"의상과 갑옷의 겉감");
  recipe(cord,region,"sew",thread+":1",1,null,"손잡이와 화살대를 묶는 끈");
 }
 recipe("숯",4,"forge","편백:1",1,null,"가마 연료",{},3);
 recipe("구리판",2,"forge","구리광석:2|숯:1",1,null,"구리 무기와 보호대의 판재");
 recipe("철재",4,"forge","철광석:2|숯:1",1,null,"철제 도구와 갑옷의 재료");
 const hides=materials.filter(row=>row[0].endsWith(" 가죽"));
 for(const [hide,region] of hides)recipe("무두질 "+hide,region,"sew",hide+":1",1,null,"종별 가죽을 손질한 의류 재료");
 recipe("가죽끈",0,"sew","무두질 산토끼 가죽:1",1,null,"손잡이와 의류 고정",{},2);
 recipe("숭어 기름",5,"forge","숭어:1",1,null,"방수 가공에 쓰는 기름");
 recipe("방수 끈",5,"sew","갈대 끈:1|숭어 기름:1",1,null,"물에 젖는 도구에 사용하는 끈");
 recipe("방수 널판",5,"bench","낙우송:1|소나무 송진:1|숭어 기름:1",1,null,"조류 방패 제작용. 교역품 방수 널판은 별도로 보관","",1,"craft:waterproof-board");
 recipe("화강암 숫돌",0,"bench","화강암:1",1,null,"장착한 무기 내구도 18 회복",{repair:18});
 recipe("사암 숫돌",2,"bench","사암:1|가시배 열매:1",1,null,"장착한 무기 내구도 12 회복",{repair:12});
 recipe("방수 자작나무 통",7,"bench","자작나무 껍질:2|소나무 송진:1|타마린드:1",1,null,"가방에 있으면 습한 날 짐의 무게 부담 완화",{container:1});
 recipe("들오리 솜 안감",5,"sew","들오리 솜털:2|갈대 실:1",3,"liner","장착하거나 벗을 수 있는 안감. 추위 완화, 더운 곳에서 체온 상승",{warm:.36,heat:-.12});
 const weapons=[
  ["아사기 편백 지팡이","편백:2|삼 끈:1","짧은 타격과 밀치기",{reach:2.5,power:20,shove:1.2,shape:"staff"}],
  ["조릿대 투창","조릿대 줄기:2|삼 끈:1","가벼운 투척. 빗나가면 떨어진 투창을 한 번 회수",{reach:13,power:28,throw:"javelin",shape:"spear"}],
  ["편백 사냥활","편백:2|삼 끈:2","짧은 사거리. 발사할 때 화살 한 발 사용",{reach:16,power:32,bow:.42,shape:"bow"}],
  ["운하 갈고리창","유럽참나무:2|고철:3|삼 끈:1","긴 찌르기. 지정 부유물을 해안으로 끌어옴",{reach:4.6,power:36,salvage:7,shape:"hook"}],
  ["협곡 구리 단검","구리판:2|메스키트:1|페커리 가죽:1","빠른 근접 공격. 식물 채집과 사냥감 손질에 사용",{reach:1.9,power:30,knife:1,shape:"knife"}],
  ["주니퍼웰 고원 장궁","더글러스전나무:2|엘크 힘줄:2|소나무 송진:1","긴 사거리. 활시위를 당기는 동안 이동 감소",{reach:30,power:45,bow:.85,shape:"bow"}],
  ["비버턴 철도 도끼","철재:3|로지폴소나무:2|가죽끈:1","무거운 공격. 지정된 쓰러진 통나무를 제거",{reach:2.4,power:56,axe:1,shape:"axe"}],
  ["생오렐 제방 장창","낙우송:2|철재:2|방수 끈:1","진흙과 얕은 물에서 유리. 좁은 실내에서 사용 불가",{reach:4.2,power:44,shallow:1,shape:"spear"}],
  ["암바로 철촉 작살","해안 카수아리나:2|철재:1|표류 밧줄:2","줄이 달린 단거리 투척. 연안 표적과 부유물에 사용 후 같은 작살 회수",{reach:10,power:42,throw:"tether",salvage:10,shape:"hook"}],
  ["카루크 방한 사냥창","시트카가문비:2|철재:2|모직:1|가죽끈:1","추위와 장갑의 영향을 덜 받는 모직 손잡이",{reach:3.6,power:43,coldGrip:1,shape:"spear"}]
 ];
 for(const [i,[name,needs,effect,stats]] of weapons.entries())recipe(name,[0,0,0,1,2,3,4,5,6,7][i],"bench",needs,2,"weapon",effect,stats);
 for(const [name,region,needs,power,output] of [
  ["연습용 나무 화살",0,"편백:1",0,6],["꿩 깃털 사냥 화살",1,"유럽참나무:1|꿩 깃털:1",12,4],["철촉 화살",4,"로지폴소나무:1|철재:1",24,4]
 ])recipe(name,region,"bench",needs,2,null,power?"활 발사에 한 발 사용. 타격 강화":"활 발사에 한 발 사용. 빗나간 화살은 회수 가능",{ammo:true,power,recover:power===0},output);
 const apparel=[
  ["아사기 논둑 작업복","삼베:3|가죽끈:1","torso","농사와 채집 기운 소모 감소",{work:.32}],
  ["브뤼넨 운하 장화","무두질 멧돼지 가죽:2|삼 끈:1|소나무 송진:1","feet","얕은 물에서 젖는 속도 감소",{water:.57}],
  ["산타 루시아 모래바람 두건","용설란 천:2|가죽끈:1","head","모래바람에서 시야 저하 감소",{dust:.62}],
  ["주니퍼웰 숲길 외투","무두질 꽃사슴 가죽:2|삼베:2|소나무 송진:1","torso","체감 추위와 발소리 감소",{warm:.28,quiet:.28}],
  ["비버턴 철도 작업 조끼","무두질 와피티사슴 가죽:2|삼베:2|철재:1","torso","많은 짐을 들 때 기운 소모 감소",{load:.49}],
  ["생오렐 나룻배 망토","갈대 천:2|삼베:1|숭어 기름:1","torso","비에 젖는 속도 감소",{rain:.58}],
  ["암바로 썰물 모자","용설란 섬유:2|표류 밧줄:1|조개껍데기:1","head","직사광선 아래 체온 상승 완화",{heat:.52}],
  ["카루크 눈길 외투","모직:3|눈신토끼 가죽:2|삼베:1","torso","마른 상태에서 강한 보온",{warm:.68}]
 ];
 const armor=[
  ["아사기 멧돼지 가죽 조끼","무두질 멧돼지 가죽:3|삼베:2","torso","긁힘과 약한 충격 완화",{guard:.22}],
  ["브뤼넨 리벳 가죽갑","무두질 붉은사슴 가죽:3|철재:2|삼베:1","torso","베임 방어. 움직일 때 소음 증가",{guard:.34,slash:.23,quiet:-.23}],
  ["산타 루시아 구리 팔보호대","구리판:2|페커리 가죽:1|용설란 끈:1","arms","더운 곳에서 부담이 적은 팔 방어구",{guard:.13,heat:.10}],
  ["주니퍼웰 누빔 사냥갑","무두질 엘크 가죽:2|삼베:3|엘크 힘줄:1","torso","충격과 발소리 완화. 젖으면 이동이 무거워짐",{guard:.30,quiet:.26,soak:.26}],
  ["비버턴 철판 작업갑","철재:5|무두질 와피티사슴 가죽:2|삼베:2","torso","강한 정면 방어. 등반과 수영 속도 감소",{guard:.28,front:.31,heavy:.31}],
  ["생오렐 비늘 덧댄 조끼","무두질 늪악어 가죽:2|갈대 천:2|숭어 기름:1","torso","물가의 마찰 피해 감소",{guard:.18,abrasion:.48}],
  ["암바로 조류 방패","해안 카수아리나:3|craft:waterproof-board:1|표류 밧줄:1","offhand","우클릭 또는 LB를 눌러 정면 공격을 막음. 막을 때 기운과 내구도가 줄어듦",{shield:1}],
  ["카루크 방한 누빔갑","모직:3|눈신토끼 가죽:2|철재:2","torso","보온과 방어. 온난 지역에서 체온 상승",{guard:.26,warm:.52,heat:-.33}]
 ];
 for(const [list,category] of [[apparel,3],[armor,4]])for(const [region,[name,needs,slot,effect,stats]] of list.entries())recipe(name,region,slot==="offhand"?"bench":"sew",needs,category,slot,effect,stats);
 recipe("카루크 모직 장갑",7,"sew","모직:1|자작나무 껍질:1",3,"arms","손을 덥힘. 일반 무기는 다루기 까다로워지지만 방한 사냥창은 그대로 사용",{warm:.16,gloves:1});
 slots.liner="안감";
 function artKey(id){
  let hash=2166136261;
  for(const character of id)hash=Math.imul(hash^character.codePointAt(0),16777619);
  return "item-"+(hash>>>0).toString(16).padStart(8,"0");
 }

 const originalGrades=[1,1,1,2,2,3,2,3,3,3];
 const originalNames=weapons.map(([name])=>name);
 for(const grade of timberGrades){
  items[grade.id]={id:grade.id,name:grade.name,icon:"assets/item-icons/"+grade.id+".png",category:0,form:"목재",region:0,source:"지정 목재 채집지 또는 지역 상점"};
 }
 for(const name of timberAliases.keys()){
  if(items[name]?.form==="목재")delete items[name];
 }
 for(const entry of Object.values(recipes)){
  const index=originalNames.indexOf(entry.id);
  const rawGrade=index>=0?originalGrades[index]:entry.tier?Math.min(4,entry.tier===5?4:entry.tier===4?3:entry.tier):1;
  const needs=new Map();
  for(const [name,n] of entry.needs){
   // Tamarind fruit used by the waterproof barrel retains its fruit identity.
   const raw=timberAliases.has(name)&&!(name==="타마린드"&&entry.id==="방수 자작나무 통");
   const id=raw?timberGrades[rawGrade-1].id:name;
   needs.set(id,(needs.get(id)??0)+n);
  }
  entry.needs=[...needs];
  items[entry.id].needs=entry.needs;
 }
 const add=(name,grade,count,output,effect="",id=name,extras="",unlock=0)=>
  recipe(name,0,"bench",timberGrades[grade-1].id+":"+count+extras,1,null,effect,{},output,id,unlock);
 add("장작",1,1,2,"화덕과 야영에 사용");
 add("목재 보강편",1,1,2,"기본 구조물 보강");
 add("울타리",1,2,1,"생활터 경계");
 add("기본 작업대",1,2,1,"초기 목공 시설");
 add("널판",2,1,2,"생활 시설 보수");
 add("기본 들보",2,2,1,"지붕과 창고 골조");
 add("방수 널판",3,2,2,"화물과 부두 보수","craft:waterproof-board","|소나무 송진:1|숭어 기름:1");
 add("카수아리나 적층재",4,2,1,"고급 장비용 적층 목재","카수아리나 적층재","|소나무 송진:1");
 add("수차 목재 부품",3,2,1,"수차 보수");
 add("화물 상자",3,2,1,"수송용 상자");
 add("정밀 수문틀",4,3,1,"수문 금속 부속을 고정하는 틀","정밀 수문틀","",6);
 add("대형 선박 용골",4,4,1,"방수 가공과 고정재가 필요한 조선 부품","대형 선박 용골","",6);
 add("벌목 도끼",2,2,1,"3등급까지 벌목","벌목 도끼","|고철:2");
 add("강화 벌목 도끼",3,2,1,"4등급까지 정밀 벌목","강화 벌목 도끼","|철재:2");

 for(const [name,station,needs] of [
  ["가공 사암촉","bench","사암:1"],
  ["굵은 밧줄","sew","표류 밧줄:1|삼 끈:1"],
  ["낙우송 부표","bench","timber_quality:1|숭어 기름:1"],
  ["눈신토끼 털감개","sew","무두질 눈신토끼 가죽:1|삼실:1"],
  ["단조 철재","forge","철재:1|숯:1"],
  ["방수 갈대 끈","sew","갈대 끈:1|숭어 기름:1"],
  ["복합 시위","sew","엘크 힘줄:1|삼 끈:1"],
  ["산토끼 털감개","sew","무두질 산토끼 가죽:1|삼실:1"],
  ["정밀 연결부","forge","철재:1|구리판:1"]
 ])recipe(name,0,station,needs,1,null,"장비 제작용 가공 재료");
 const families=["staff","javelin","hunting-bow","hook-spear","dagger","longbow","axe","levee-pike","harpoon","winter-spear"];
 const districts=[0,0,0,1,2,3,4,5,6,7];
 for(const variant of weaponCatalogue){
  const i=families.indexOf(variant.family);
  const stats={...weapons[i][3],power:Math.round(weapons[i][3].power*(.87+variant.tier*.085)),bonus:variant.bonus};
  const grade=[1,2,3,3,4][variant.tier-1],needs=new Map();
  for(const material of variant.materials){
   const item=timberAliases.has(material)?timberGrades[grade-1].id:material==="방수 널판"?"craft:waterproof-board":material;
   needs.set(item,(needs.get(item)??0)+1);
  }
  const ingredients=[...needs].map(([id,n])=>id+":"+n).join("|");
  const tier=["생활형","숙련형","전문형","정밀형","명품형"][variant.tier-1];
  recipe(variant.name,districts[i],"bench",ingredients,2,"weapon",tier+" · "+weapons[i][2],stats,1,variant.id);
  recipes[variant.id].tier=variant.tier;
  const icon="assets/item-icons/"+variant.id+".png";
  const model="assets/weapon-models/"+variant.id+".glb";
  Object.assign(items[variant.id],{icon,model,tier:variant.tier});
  recipes[variant.id].model=model;
 }
 return {regions,categories,stations,slots,items,recipes,artKey};
})();
if(typeof module!=="undefined")module.exports=CraftingData;
