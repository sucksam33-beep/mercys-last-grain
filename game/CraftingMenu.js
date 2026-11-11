"use strict";
const craftCodex={tab:0,region:"",query:"",scroll:0,trail:[],detail:null,mode:"codex",station:null};
function craftParagraph(body,text,className=""){
 const p=document.createElement("p");p.textContent=text;p.className=className;body.append(p);return p;
}
function craftBack(){
 if(craftCodex.detail){
  craftCodex.detail=craftCodex.trail.pop()??null;
  if(craftCodex.detail)craftDetail(craftCodex.detail);
  else if(craftCodex.mode==="gear")craftGearMenu();
  else if(craftCodex.mode==="station")craftStationMenu(craftCodex.station);
  else if(craftCodex.mode==="bag")satchel();
  else craftCodexList();
 }else if(craftCodex.mode==="station")resumeGameplay();
 else gameMenu();
}
function craftPanel(title){
 const body=gameMenuPanel(title);
 setPauseBack(craftBack);
 return body;
}
function craftShowCodex(){
 Object.assign(craftCodex,{trail:[],detail:null,mode:"codex"});
 craftCodexList();
}
function craftCardArt(entry,large=false){
 const img=document.createElement("img");
 const icon=priorityItemModel(entry.id)?.icon??entry.icon;
 if(icon)img.src=icon;
 else if(!timberGrades.some(grade=>grade.id===entry.id))img.src="assets/crafting/"+CraftingData.artKey(entry.id)+(large?"-detail":"")+".webp";
 img.alt=entry.name;img.width=large?224:64;img.height=large?224:64;
 img.loading=large?"eager":"lazy";img.decoding="async";
 return img;
}
function addPriorityModelPreview(body,id){
 const model=priorityItemModel(id)?.model;
 if(!model)return;
 const container=document.createElement("div");body.append(container);
 const button=menuAction(container,"3D 모델 보기",async()=>{
  if(container.querySelector("canvas")){
   container.querySelector("canvas").remove();button.textContent="3D 모델 보기";return;
  }
  button.disabled=true;
  try{
   const {showItemModel}=await import("./item-model-preview.mjs");
   await showItemModel(container,model);
   if(container.isConnected)button.textContent="3D 모델 닫기";
  }catch(error){
   console.warn("아이템 3D 미리보기",id,error);
   if(container.isConnected)button.textContent="3D 모델 다시 열기";
  }finally{button.disabled=false;}
 });
}
function craftStatus(entry){
 const data=s.crafting;
 return data?.made[entry.id]?"제작 완료":data?.discovered[entry.id]||count(entry.id)||Object.hasOwn(s.seen??{},entry.id)?"발견":"미발견";
}
function craftOpenEntry(id){
 if(regionalDishById[id]){foodDetail(regionalDishById[id]);return;}
 if(timberGrades.some(grade=>grade.id===id)){timberCodex();return;}
 if(craftCodex.detail)craftCodex.trail.push(craftCodex.detail);
 craftCodex.detail=id;craftDetail(id);
}
function craftCodexList(){
 const body=craftPanel("아이템 도감");
 menuAction(body,"제작 재료 · 목재",timberCodex);
 menuAction(body,"요리",()=>foodCodex());
 body.classList.add("craft-panel");
 const filters=document.createElement("div");filters.className="craft-filters";body.append(filters);
 const query=document.createElement("input");query.type="search";query.placeholder="이름·획득 장소 검색";query.setAttribute("aria-label","도감 검색");query.value=craftCodex.query;
 const region=document.createElement("select");region.setAttribute("aria-label","지역 필터");
 for(const [value,label] of [["","모든 지역"],...CraftingData.regions.map((name,i)=>[String(i),name])])region.add(new Option(label,value));
 region.value=craftCodex.region;filters.append(query,region);
 const cycle=menuAction(filters,"다음 지역",()=>{region.selectedIndex=(region.selectedIndex+1)%region.options.length;region.onchange()});
 cycle.title="게임패드로 지역 전환";
 const tabs=document.createElement("div");tabs.className="craft-tabs";tabs.dataset.padSections="";body.append(tabs);
 const list=document.createElement("div");list.className="craft-list inventory-grid";body.append(list);
 const refresh=()=>{
  list.replaceChildren();
  const term=craftCodex.query.replace(/\s/g,"").toLowerCase();
  for(const entry of Object.values(craftItems)){
   if(entry.category!==craftCodex.tab||(craftCodex.region!==""&&entry.region!==Number(craftCodex.region)))continue;
   if(term&&!(entry.name+entry.source+(entry.effect??"")).replace(/\s/g,"").toLowerCase().includes(term))continue;
   const card=menuAction(list,"",()=>{craftCodex.scroll=list.scrollTop;craftOpenEntry(entry.id)});
   card.className="inventory-slot";
   card.title=entry.name+" · "+craftStatus(entry);
   card.setAttribute("aria-label",entry.name);
   card.append(craftCardArt(entry));
  }
  if(!list.children.length)craftParagraph(list,"조건에 맞는 항목이 없어.");
 };
 const changeTab=(tab,selected)=>{
  craftCodex.tab=tab;craftCodex.scroll=0;
  for(const button of tabs.children)button.setAttribute("aria-pressed",String(button===selected));
  refresh();list.scrollTop=0;
 };
 [...CraftingData.categories,"물고기","식물","고기·요리","교역·장비·캠페인"].forEach((label,i)=>{
  const b=menuAction(tabs,label,()=>changeTab(i,b));
  b.setAttribute("aria-pressed",String(i===craftCodex.tab));
 });
 query.oninput=()=>{craftCodex.query=query.value;craftCodex.scroll=0;refresh();list.scrollTop=0};
 region.onchange=()=>{craftCodex.region=region.value;craftCodex.scroll=0;refresh();list.scrollTop=0};
 refresh();list.scrollTop=craftCodex.scroll;
 menuAction(body,"게임 메뉴로",gameMenu);
 tabs.children[craftCodex.tab]?.focus({preventScroll:true});
}
function craftDetail(id){
 const entry=craftItems[id]??legacyWeaponRecipes[id];
 if(!entry)return craftBack();
 const body=craftPanel(entry.name);body.classList.add("craft-panel");
 const scroll=document.createElement("div");scroll.className="craft-list craft-detail";body.append(scroll);
 scroll.append(craftCardArt(entry,true));
 addPriorityModelPreview(scroll,id);
 craftParagraph(scroll,CraftingData.regions[entry.region]+" · "+craftStatus(entry)+" · 보유 "+count(id)+"개");
 craftParagraph(scroll,entry.source,"muted");
 if(entry.effect)craftParagraph(scroll,entry.effect);
 const dishes=regionalDishes.filter(dish=>dish.needs.some(([part])=>part===id));
 if(dishes.length){
  craftParagraph(scroll,"만들 수 있는 요리");
  for(const dish of dishes)menuAction(scroll,dish.name,()=>foodDetail(dish,()=>craftDetail(id))).prepend(craftCardArt(craftItems[dish.id]));
 }
 if(entry.slot)craftParagraph(scroll,"장비 부위 · "+CraftingData.slots[entry.slot]);
 if(entry.slot==="weapon"){
  for(const stat of weaponCodexStats(entry))craftParagraph(scroll,stat);
  if(craftRecipes[id])menuAction(scroll,"다른 무기와 비교",()=>weaponComparison(id));
 }
 if(entry.station){
  craftParagraph(scroll,"제작 시설 · "+CraftingData.stations[entry.station]+" · 완성 수량 "+entry.output);
  craftParagraph(scroll,"아사기 할머니 집 앞, 브뤼넨 시장 옆, 다른 지역은 역 주변의 시설에서 제작할 수 있어.","muted");
 }
 for(const [ingredient,n] of entry.needs??[]){
  const material=craftItems[ingredient];
  const b=menuAction(scroll,craftName(ingredient)+" · 보유 "+count(ingredient)+" / 필요 "+n,()=>craftOpenEntry(ingredient));
  if(material?.icon)b.prepend(craftCardArt(material));
  if(count(ingredient)<n)b.classList.add("craft-missing");
  if(material)craftParagraph(scroll,material.source,"muted");
 }
 const uses=Object.values(craftRecipes).filter(recipe=>recipe.needs.some(([ingredient])=>ingredient===id));
 if(uses.length){
  craftParagraph(scroll,"사용하는 제작법");
  for(const recipe of uses)menuAction(scroll,recipe.name,()=>craftOpenEntry(recipe.id));
 }else if(!entry.station)craftParagraph(scroll,entry.form==="가죽"?"무두질 작업대에서 가죽으로 손질":"채집·요리·건설·교역에 사용");
 menuAction(body,"뒤로",craftBack).focus({preventScroll:true});
}
function craftStationMenu(station){
 Object.assign(craftCodex,{station,detail:null,trail:[],mode:"station"});
 const body=craftPanel(CraftingData.stations[station]);body.classList.add("craft-panel");
 const list=document.createElement("div");list.className="craft-list";body.append(list);
 for(const recipe of Object.values(craftRecipes).filter(recipe=>recipe.station===station)){
  const title=recipe.name+" × "+recipe.output;
  const text=recipe.needs.map(([id,n])=>craftName(id)+" "+timberFree(id)+"/"+n).join(" · ");
  const group=document.createElement("section");group.className="craft-recipe";list.append(group);
  const can=craftAtStation(station)&&craftRecipeUnlocked(recipe)&&Boolean(timberCost(recipe.needs,true))&&count(recipe.id)+recipe.output<=999;
  craftParagraph(group,title);
  craftParagraph(group,text,can?"muted":"craft-missing");
  for(const [id] of recipe.needs)if(craftItems[id]?.icon)group.append(craftCardArt(craftItems[id]));
  menuAction(group,"재료 출처·효과",()=>craftOpenEntry(recipe.id));
  const craft=menuAction(group,can?"만들기":"제작 조건 미충족",()=>{
   const scroll=list.scrollTop;
   timberConfirm(recipe.needs,cost=>{
    if(!craftMake(recipe.id,station,cost)){log("시설이나 재료 조건을 다시 확인해.");return;}
    craftStationMenu(station);$("dialogBody").querySelector(".craft-list").scrollTop=scroll;render();
   },()=>craftStationMenu(station));
  },can);
  craft.disabled=!can;
 }
 menuAction(body,"닫기",()=>$("dialog").close()).focus({preventScroll:true});
}
const coatTierNames=["여행자","장인","상인","귀족","왕실"];
function craftCoatMenu(){
 const body=gameMenuPanel("복장 마감 · 5단계",craftGearMenu);
 const selected=s.crafting?.coatTier??0;
 craftParagraph(body,"코트, 안에 입은 상의, 바지, 가방과 신발의 마감을 함께 변경해.");
 for(const [index,name] of coatTierNames.entries()){
  const tier=index+1;
  const button=menuAction(body,tier+"단계 · "+name+(tier===selected?" · 적용 중":""),()=>{
   if(craftTransaction(data=>{data.coatTier=tier;return true;}))craftCoatMenu();
  });
  button.setAttribute("aria-pressed",String(tier===selected));
 }
 menuAction(body,"장착 의상 표시",()=>{
  if(craftTransaction(data=>{delete data.coatTier;return true;}))craftCoatMenu();
 });
 menuAction(body,"장비로 돌아가기",craftGearMenu).focus();
}
function craftGearMenu(){
 Object.assign(craftCodex,{detail:null,trail:[],mode:"gear"});
 const data=craftState(),body=craftPanel("장비");body.classList.add("craft-panel");
 menuAction(body,"복장 마감 · 5단계",craftCoatMenu);
 craftParagraph(body,"체력 "+data.health+" · 젖음 "+Math.round(data.wet*100)+"% · 추위 "+Math.round(data.cold*100)+"% · 더위 "+Math.round(data.heat*100)+"%");
 const list=document.createElement("div");list.className="craft-list";body.append(list);
 for(const [slot,label] of Object.entries(CraftingData.slots)){
  craftParagraph(list,label+" · "+(data.gear[slot]?craftName(data.gear[slot]):"비어 있음"));
  for(const recipe of [...Object.values(craftRecipes),...Object.values(legacyWeaponRecipes)].filter(item=>item.slot===slot&&count(item.id))){
   const instances=slot==="weapon"?weaponInstances(recipe.id):[{wear:data.wear[recipe.id]??100}];
   for(const [index,instance] of instances.entries()){
    const active=instance.key?data.weaponInstance===instance.key:data.gear[slot]===recipe.id;
    const title=recipe.name+(instances.length>1?" · "+(index+1)+"번":"");
    const b=menuAction(list,title+" · 내구도 "+instance.wear+"% · "+(active?"해제":"장착"),()=>{craftEquip(recipe.id,instance.key);craftGearMenu()});
    b.disabled=instance.wear<=0;
    if(instance.key&&instance.wear<100)for(const stone of ["화강암 숫돌","사암 숫돌"]){
     if(count(stone))menuAction(list,title+" · "+stone+"로 손질",()=>{craftRepair(stone,recipe.id,instance.key);craftGearMenu()});
    }
   }
   menuAction(list,"도감 · "+recipe.name,()=>craftOpenEntry(recipe.id));
  }
 }
 for(const id of craftArrowIds)if(count(id))menuAction(list,id+" × "+count(id)+(data.ammo===id?" · 선택됨":" · 화살 선택"),()=>{
  craftTransaction(state=>{state.ammo=id;return true});craftGearMenu();
 });
 menuAction(body,"게임 메뉴로",gameMenu).focus({preventScroll:true});
}
function craftVisual(pose=null){
 const shield=equippedShield();
 if(!s.crafting&&!pose?.motion&&!pose?.weapon&&!shield)return null;
 const gear={};
 const tier=s.crafting?.coatTier;
 if(Number.isInteger(tier)&&tier>=1&&tier<=5)gear.coatTier=tier;
 for(const slot of Object.keys(CraftingData.slots)){
  const recipe=craftEquipment(slot);
  if(recipe)gear[slot]=[recipe.id,recipe.region,recipe.category,toolMotionByName[recipe.name]??recipe.stats.shape??"",recipe.model??priorityItemModel(recipe.id)?.model];
 }
 if(pose?.motion&&pose.name&&pose.motion!=="shield"){
  const recipe=craftRecipes[pose.name];
  const equipped=craftEquipment("weapon");
  if(equipped?.name!==pose.name&&equipped?.id!==pose.name)gear.weapon=[pose.name,recipe?.region??s.region,2,pose.motion,priorityItemModel(pose.name)?.model];
 }
 if(!pose?.motion&&pose?.weapon&&priorityItemModel(pose.weapon))gear.weapon=[pose.weapon,s.region,2,"sword",priorityItemModel(pose.weapon).model];
 if(shield&&!gear.offhand)gear.offhand=[shield,s.region,4,"shield",priorityItemModel(shield)?.model];
 return gear;
}

function inventorySection(id,entry){
 if(entry?.category===2||entry?.slot==="weapon"||Object.hasOwn(storeItems,id)&&!['주먹밥','씨앗','치어'].includes(id))return "weapons";
 if(entry?.category===3||entry?.category===4)return "wear";
 if(regionalDishById[id]||[5,6,7].includes(entry?.category)||id==="주먹밥")return "food";
 if([0,1].includes(entry?.category))return "supplies";
 return "other";
}
function inventoryGrid(grid,section="all"){
 grid.classList.add("inventory-grid");
 const slots=[];
 for(const [id,n] of Object.entries(s.bag)){
  if(n<=0)continue;
  const entry=craftItems[id]??legacyWeaponRecipes[id];
  if(section!=="all"&&inventorySection(id,entry)!==section)continue;
  const label=craftName(id)+" · "+n+"개";
  const slot=document.createElement("button");
  slot.type="button";slot.className="inventory-slot";slot.title=label;slot.setAttribute("aria-label",label);
  if(entry&&(entry.icon||priorityItemModel(id)))slot.append(craftCardArt(entry));
  else{const missing=document.createElement("span");missing.textContent=craftName(id);slot.append(missing);}
  const qty=document.createElement("b");qty.className="inventory-quantity";qty.textContent=n;slot.append(qty);
  slot.onclick=()=>{
   if(townMedicine[id])townMedicineMenu(id);
   else if(regionalDishById[id])foodDetail(regionalDishById[id],satchel);
   else if(timberGrades.some(grade=>grade.id===id)||inventoryWeaponModel(id))inventoryPlacementMenu(id);
   else if(entry){Object.assign(craftCodex,{detail:id,trail:[],mode:"bag"});craftDetail(id);}
  };
  slots.push(slot);
 }
 grid.replaceChildren(...slots);
 if(!slots.length)craftParagraph(grid,"이 분류에 보관된 아이템이 없어.","muted");
}
function weaponCodexStats(entry){
 const {stats}=entry;
 return [
  "등급 "+(entry.tier??"기본")+" · 기본 피해 "+stats.power+" · 사거리 "+stats.reach+"m",
  "최대 내구도 100% · 공격 간격 "+weaponCycle(stats)/1000+"초",
  ...(stats.bonus?["보너스 · "+weaponBonusNames[stats.bonus]+" · 피해 +"+weaponBonusRate*100+"%"]:[])
 ];
}
function weaponComparison(leftId,rightId){
 const left=craftItems[leftId];
 const others=Object.values(craftRecipes).filter(recipe=>recipe.slot==="weapon"&&recipe.id!==leftId);
 const right=craftItems[rightId??others[0]?.id];
 if(!right)return;
 const body=craftPanel("무기 비교");
 const select=document.createElement("select");
 select.setAttribute("aria-label","비교할 무기");
 for(const entry of others)select.add(new Option(entry.name,entry.id, false,entry.id===right.id));
 select.onchange=()=>weaponComparison(left.id,select.value);body.append(select);
 const panels=document.createElement("div");panels.className="weapon-comparison";body.append(panels);
 for(const entry of [left,right]){
  const panel=document.createElement("section");panels.append(panel);
  panel.append(craftCardArt(entry));
  craftParagraph(panel,entry.name);
  for(const stat of weaponCodexStats(entry))craftParagraph(panel,stat,"muted");
 }
 const signed=n=>n>0?"+"+n:String(n);
 craftParagraph(body,"오른쪽 기준 · 피해 "+signed(right.stats.power-left.stats.power)+" · 사거리 "+signed(Number((right.stats.reach-left.stats.reach).toFixed(2)))+"m · 공격 간격 "+signed(weaponCycle(right.stats)-weaponCycle(left.stats))+"ms");
 menuAction(body,"무기 정보로",()=>craftDetail(left.id));
 setPauseBack(()=>craftDetail(left.id));
}
