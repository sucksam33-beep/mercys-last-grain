const fs=require("node:fs"),path=require("node:path");
const root=process.argv[2];
function edit(file,fn){
 const p=path.join(root,file),s=fs.readFileSync(p,"utf8").replace(/\r\n/g,"\n");
 const swap=(source,a,b)=>{
  if(!source.includes(a))throw Error(file+" missing hook "+a);
  return source.replace(a,b);
 };
 fs.writeFileSync(p,fn(s,(a,b)=>swap(s,a,b),swap));
}
edit("CraftingData.js",(s,_,swap)=>{if(s.includes("originalGrades"))return s;
 s=swap(s," return {regions,categories,stations,slots,items,recipes,artKey};",`
 const originalGrades=[1,1,1,2,2,3,2,3,3,3];
 const originalNames=weapons.map(([name])=>name);
 for(const grade of timberGrades){
  items[grade.id]={id:grade.id,name:grade.name,category:0,form:"목재",region:0,source:"지정 목재 채집지 또는 지역 상점"};
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
 return {regions,categories,stations,slots,items,recipes,artKey};`);
 return s;
});
edit("index.html",(s,_,swap)=>{
 const replace=(a,b)=>s=swap(s,a,b);
 replace('<script src="CraftingData.js"></script>','<script src="Timber.js"></script><script src="CraftingData.js"></script>');
 replace("let s=initialSave?.state??fresh();","let s=migrateTimber(initialSave?.state??fresh());");
 replace(" s=progress;resetCombatWorld();\n player=savedPosition(location);"," s=migrateTimber(progress);resetCombatWorld();\n timberSites.clear();\n player=savedPosition(location);");
 replace("function give(item,n=1){","function give(item,n=1){if(timberAliases.has(item)&&item!==\"타마린드\")item=timberId(item);");
 replace(' craftTradeRows(body,shop);',' craftTradeRows(body,shop);\n timberTradeRows(body);');
 const old=s.match(/function buildingMaterials\([^\n]+/)[0];
 replace(old,"function buildingMaterials(wood,stone){return [[\"timber_log\",wood],[r().stone,stone]];}");
 replace('if(buildingMaterials(3,2)){s.homes[s.region]={site:id};tick(2,8);if(s.region===0&&s.stage===0)s.stage=1;log("집을 지었다. 이곳에서 자고 요리할 수 있어.");go(id)}$("dialog").close()',`timberConfirm(buildingMaterials(3,2),cost=>{
  if(!spend(cost))return;
  s.homes[s.region]={site:id};tick(2,8);
  if(s.region===0&&s.stage===0)s.stage=1;
  $("dialog").close();log("집을 지었다. 이곳에서 자고 요리할 수 있어.");go(id);render();
 },buildMenu)`);
 replace('[r().wood,lumber[s.region]].forEach((item,i)=>add(item+" 벌목",()=>harvestResource("timber",item),i===0));','add("목재 채집지 보기",timberCodex,true);');
 replace('function actionText(action){','function actionText(action){\n if(action.type==="timberGrade")return timberHint(action);');
 replace(' if(!actionInReach(action))return false;\n if(action.type==="soil-guard")',' if(!actionInReach(action))return false;\n if(action.type==="timberGrade")return timberHarvest(action);\n if(action.type==="soil-guard")');
 replace('  const action={id,type:"tree",x,z,reach:2.65};','  const action=null;');
 replace(' const game={home:Boolean(house()),pond',' const game={home:Boolean(house()),pond');
 replace('  let next;\n  try{next=SoilCampaign.advance','  const repair=timberCampaignRepair(c.step);\n  if(repair&& !timberCost(repair.needs)){soilParagraph(body,repair.name+"에 "+repair.needs.map(([id,n])=>craftName(id)+" ×"+n).join(" · ")+" 필요");return;}\n  let next;\n  try{next=SoilCampaign.advance');
 replace('  s.soilCampaign=next;\n  if(completed==="grave")','  if(repair&&!spend(repair.needs))return;\n  s.soilCampaign=next;\n  if(completed==="grave")');
 replace(' for(const [i,choice] of episode.options.entries())row',' const repair=timberCampaignRepair(c.step);\n if(repair)soilParagraph(body,repair.name+" · "+repair.needs.map(([id,n])=>craftName(id)+" ×"+n).join(" · "));\n for(const [i,choice] of episode.options.entries())row');
 return s;
});
edit("region-ecology.js",(s,_,swap)=>{
 s=swap(s,"districtResources();buildCraftingWorld();","districtResources();buildCraftingWorld();paintTimberSites();");
 return s;
});
edit("Crafting.js",(s,_,swap)=>{
 s=swap(s,"function craftMake(id,station){","function craftMake(id,station,confirmed){");
 s=swap(s," const cost=recipe.needs;\n if(cost.some(([item,n])=>count(item)<n))return false;"," const cost=confirmed??timberCost(recipe.needs);\n if(!cost||cost.some(([item,n])=>timberFree(item)<n))return false;");
 return s;
});
edit("CraftingMenu.js",(s,_,swap)=>{
 s=swap(s,' const body=craftPanel("제작 도감");',' const body=craftPanel("제작 도감");\n menuAction(body,"제작 재료 · 목재",timberCodex);');
 s=swap(s,'function craftOpenEntry(id){','function craftOpenEntry(id){\n if(timberGrades.some(grade=>grade.id===id)){timberCodex();return;}');
 s=swap(s,'recipe.needs.every(([id,n])=>count(id)>=n)','Boolean(timberCost(recipe.needs,true))');
 s=swap(s,'craftName(id)+" "+count(id)+"/"+n','craftName(id)+" "+timberFree(id)+"/"+n');
 s=swap(s,'   if(!craftMake(recipe.id,station)){log("시설이나 재료 조건을 다시 확인해.");return}\n   const scroll=list.scrollTop;craftStationMenu(station);$("dialogBody").querySelector(".craft-list").scrollTop=scroll;render();',`   const scroll=list.scrollTop;
   timberConfirm(recipe.needs,cost=>{
    if(!craftMake(recipe.id,station,cost)){log("시설이나 재료 조건을 다시 확인해.");return;}
    craftStationMenu(station);$("dialogBody").querySelector(".craft-list").scrollTop=scroll;render();
   },()=>craftStationMenu(station));`);
 return s;
});