"use strict";
const foodProfiles={
 Light:{label:"가벼운 식사",energy:14},Meal:{label:"한 끼",energy:24},Hearty:{label:"든든한 식사",energy:34},
 Preserved:{label:"저장식",energy:20,days:7},Warming:{label:"보온식",energy:24,effect:"cold"},
 Cooling:{label:"냉각식",energy:18,effect:"heat"},Shared:{label:"나눔 식사",energy:24}
};
const regionalDishById=Object.fromEntries(regionalDishes.map(dish=>[dish.id,dish]));
for(const dish of regionalDishes)craftItems[dish.id]={...dish,category:7,form:"요리",source:"요리 · "+dish.station};
for(const ingredient of regionalIngredients)craftItems[ingredient.id]={...ingredient,category:6,form:"식재료"};
function foodState(){return s.regionalFood??={learned:{},batches:{},jobs:{},stock:{},shared:{}};}
function foodClock(){return s.day*24+s.hour;}
function foodProfile(dish){return foodProfiles[dish.profile];}
function foodLearned(dish){return dish.region===0||Boolean(s.regionalFood?.learned[dish.region]);}
function learnLocalFood(){
 if(craftTransaction(()=>{foodState().learned[s.region]=true;return true;})){
  log(r().name+"의 요리법을 배웠다.","success");
  foodCodex({region:String(s.region)});
 }
}
function foodDays(dish){return foodProfile(dish).days??2;}
function addDishBatch(dish){
 const food=foodState();
 (food.batches[dish.id]??=[]).push({servings:dish.servings,expires:foodClock()+24*foodDays(dish)});
 give(dish.id,dish.servings);
}
function freshFoodBatch(id){
 return s.regionalFood?.batches[id]?.filter(batch=>batch.servings>0&&batch.expires>foodClock()).sort((a,b)=>a.expires-b.expires)[0];
}
function foodEffect(kind){
 const effect=s.regionalFood?.effect;
 return effect?.kind===kind&&effect.until>foodClock()?.85:1;
}
function spendFreshServing(id){
 const batch=freshFoodBatch(id);
 if(!batch||timberFree(id)<1)return false;
 batch.servings--;
 give(id,-1);
 foodState().batches[id]=foodState().batches[id].filter(b=>b.servings);
 return true;
}
function eatRegionalFood(id){
 const dish=regionalDishById[id];
 if(!dish||count(id)<1||!freshFoodBatch(id))return false;
 const profile=foodProfile(dish);
 return craftTransaction(()=>{
  if(!spendFreshServing(id))return false;
  s.energy=Math.min(100,s.energy+profile.energy);
  if(profile.effect)foodState().effect={kind:profile.effect,until:foodClock()+.75};
  return true;
 });
}
function foodStationNear(station){
 const base=regionalFoodLocations()[station];
 if(base&&Math.hypot(player.x-base.x,player.y-base.z)<=3.6)return true;
 const home=here(site());
 return station==="집 화덕"&&Boolean(house()&&home&&Math.hypot(player.x-home.x,player.y-home.y)<5);
}
function makeRegionalFood(id,station){
 const dish=regionalDishById[id];
 if(!dish||dish.station!==station||!foodLearned(dish)||!foodStationNear(station)||station==="여행솥"&&!count("여행솥"))return false;
 if(dish.needs.some(([part,n])=>timberFree(part)<n)||count(id)+dish.servings>999)return false;
 if(station==="건조대"&&s.regionalFood?.jobs[id])return false;
 return craftTransaction(()=>{
  for(const [part,n] of dish.needs)give(part,-n);
  if(station==="건조대")foodState().jobs[id]={ready:foodClock()+24,region:s.region};
  else addDishBatch(dish);
  return true;
 });
}
function collectDriedFood(id){
 const dish=regionalDishById[id],job=s.regionalFood?.jobs[id];
 if(!dish||!job||job.region!==s.region||job.ready>foodClock()||!foodStationNear("건조대")||count(id)+dish.servings>999)return false;
 return craftTransaction(()=>{addDishBatch(dish);delete foodState().jobs[id];return true;});
}
function foodIngredientRows(body,dish){
 for(const [part,n] of dish.needs){
  const ingredient=craftItems[part];
  if(!ingredient)continue;
  const line=document.createElement("div");line.className="food-ingredient";body.append(line);
  line.append(craftCardArt(ingredient));
  craftParagraph(line,ingredient.name+" × "+n+" · 보유 "+timberFree(part));
  if(timberFree(part)<n)line.classList.add("craft-missing");
 }
}
function foodSummary(dish){
 const profile=foodProfile(dish);
 const effect=profile.effect==="cold"?" · 추위 축적 15% 감소 (45분)":profile.effect==="heat"?" · 더위 축적 15% 감소 (45분)":"";
 return profile.label+" · "+dish.servings+"인분 · 기운 +"+profile.energy+effect+" · 신선도 "+foodDays(dish)+"일";
}
function foodDetail(dish,back=foodCodex){
 const body=craftPanel(dish.name);body.classList.add("craft-panel");
 const list=document.createElement("div");list.className="craft-list craft-detail";body.append(list);
 list.append(craftCardArt(craftItems[dish.id],true));
 addPriorityModelPreview(list,dish.id);
 craftParagraph(list,CraftingData.regions[dish.region]+" · "+dish.station);
 craftParagraph(list,foodSummary(dish));
 if(dish.id==="dish-1-2")craftParagraph(list,"감자와 연한 조릿대 잎을 끓인 산나물국.");
 if(dish.station==="건조대")craftParagraph(list,"건조 1일 · 시작한 건조대에서 수령");
 foodIngredientRows(list,dish);
 for(const [part] of dish.needs){
  const ingredient=craftItems[part];
  if(ingredient?.source)craftParagraph(list,ingredient.name+" · "+ingredient.source,"muted");
 }
 if(count(dish.id)){
  const fresh=freshFoodBatch(dish.id);
  const servings=(s.regionalFood?.batches[dish.id]??[]).filter(batch=>batch.expires>foodClock()).reduce((n,b)=>n+b.servings,0);
  craftParagraph(list,"가방 "+count(dish.id)+"개 · 신선 "+servings+"개 · 유통기한 지난 음식 "+(count(dish.id)-servings)+"개");
  const eat=menuAction(list,"1인분 먹기",()=>{if(eatRegionalFood(dish.id)){foodDetail(dish,back);render();}});
  eat.disabled=!fresh;
 }
 menuAction(body,"뒤로",back);setPauseBack(back);
}
function foodCodex(filters={}){
 const body=craftPanel("도감 · 요리");body.classList.add("craft-panel");
 const controls=document.createElement("div");controls.className="food-filters";body.append(controls);
 const grid=document.createElement("div");grid.className="craft-list inventory-grid";body.append(grid);
 function select(key,title,options){
  const node=document.createElement("select");node.setAttribute("aria-label",title);
  node.add(new Option("모든 "+title,""));
  for(const [value,label] of options)node.add(new Option(label,value));
  node.value=filters[key]??"";controls.append(node);
  node.onchange=()=>{filters[key]=node.value;refresh();};
 }
 select("region","지역",CraftingData.regions.map((v,i)=>[i,v]));
 select("station","조리 시설",["여행솥","집 화덕","건조대"].map(v=>[v,v]));
 select("profile","음식 유형",Object.entries(foodProfiles).map(([k,v])=>[k,v.label]));
 function refresh(){
  grid.replaceChildren();
  for(const dish of regionalDishes){
   if(filters.region&&Number(filters.region)!==dish.region||filters.station&&filters.station!==dish.station||filters.profile&&filters.profile!==dish.profile)continue;
   const card=menuAction(grid,"",()=>foodDetail(dish,()=>foodCodex(filters)));
   card.className="inventory-slot";card.title=dish.name;card.setAttribute("aria-label",dish.name);
   card.append(craftCardArt(craftItems[dish.id]));
  }
  if(!grid.children.length)craftParagraph(grid,"조건에 맞는 요리가 없어.");
 }
 refresh();
 menuAction(body,"아이템 도감으로",craftShowCodex);setPauseBack(craftShowCodex);
}
function regionalCookingMenu(station){
 const body=craftPanel(station+" · 지역 요리");body.classList.add("craft-panel");
 const list=document.createElement("div");list.className="craft-list";body.append(list);
 for(const dish of regionalDishes.filter(d=>d.station===station&&foodLearned(d))){
  const section=document.createElement("section");section.className="craft-recipe";list.append(section);
  section.append(craftCardArt(craftItems[dish.id]));craftParagraph(section,dish.name);
  craftParagraph(section,foodSummary(dish),"muted");foodIngredientRows(section,dish);
  const job=s.regionalFood?.jobs[dish.id];
  if(job){
   const ready=job.ready<=foodClock()&&job.region===s.region;
   menuAction(section,ready?"수령":"건조 중",()=>{if(collectDriedFood(dish.id)){regionalCookingMenu(station);render();}},ready);
  }else{
   const can=foodStationNear(station)&&dish.needs.every(([id,n])=>timberFree(id)>=n)&&(station!=="여행솥"||count("여행솥")>0);
   menuAction(section,station==="건조대"?"건조 시작":"조리",()=>{if(makeRegionalFood(dish.id,station)){regionalCookingMenu(station);render();}},can);
  }
 }
 if(!list.children.length)craftParagraph(list,"지역 요리판에서 요리법을 배울 수 있어.");
 if(station==="집 화덕")menuAction(body,"공동 식탁",sharedFoodMenu);
 menuAction(body,"요리 도감",()=>foodCodex());
 menuAction(body,"기본 요리",cook);
}
function regionalEatRows(body){
 let found=false;
 for(const dish of regionalDishes.filter(d=>count(d.id)>0)){
  found=true;
  const line=document.createElement("div");line.className="food-ingredient";body.append(line);
  line.append(craftCardArt(craftItems[dish.id]));
  const fresh=freshFoodBatch(dish.id);
  craftParagraph(line,dish.name+" × "+count(dish.id));
  const eat=button(line,fresh?"먹기":"유통기한 지남",()=>{if(eatRegionalFood(dish.id))eatMenu();});
  eat.disabled=!fresh;
 }
 return found;
}

function eligibleFoodResidents(){
 return SoilCampaign.residentNames(soilRoster,s.region).filter(person=>person.id!=="grandmother");
}
function shareRegionalFood(id,resident){
 const dish=regionalDishById[id],region=s.region;
 if(dish?.profile!=="Shared"||!foodStationNear("집 화덕")||!eligibleFoodResidents().some(person=>person.id===resident)||timberFree(id)<1||!freshFoodBatch(id))return false;
 const key=region+":"+resident,previous=s.regionalFood?.shared[key];
 if(previous?.day===s.day)return false;
 const success=craftTransaction(()=>{
  if(!spendFreshServing(id))return false;
  const food=foodState();
  food.shared[key]={day:s.day,meals:[...new Set([...(previous?.meals??[]),id])]};
  return true;
 });
 if(success)log(craftName(id)+" 1인분을 공동 식탁에 나눴다.","success");
 return success;
}
function sharedFoodMenu(){
 const body=craftPanel("공동 식탁");
 for(const person of eligibleFoodResidents()){
  const served=s.regionalFood?.shared[s.region+":"+person.id];
  craftParagraph(body,person.name+(served?" · 나눈 요리 "+served.meals.length+"종":""));
  for(const dish of regionalDishes.filter(d=>d.profile==="Shared"&&count(d.id)&&freshFoodBatch(d.id))){
   menuAction(body,dish.name+" 1인분",()=>{if(shareRegionalFood(dish.id,person.id)){sharedFoodMenu();render();}},served?.day!==s.day);
  }
 }
 menuAction(body,"공동 화덕으로",()=>regionalCookingMenu("집 화덕"));
}
