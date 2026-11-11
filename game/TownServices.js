"use strict";
const townRoles={
 post:{name:"우체국",paint:"#34616b",trim:"#ecd7a3"},
 clinic:{name:"병원",paint:"#e1d9bf",trim:"#a7413b"},
 trader:{name:"무역상",paint:"#376651",trim:"#e1bd6f"},
 smith:{name:"대장장이",paint:"#494748",trim:"#c7814d"}
};
const townServicesByRegion=new Map();
const townServices=()=>townServicesByRegion.get(s.region)??[];
const townMedicine={
 "응급 붕대":{material:"삼베",health:30,description:"체력 30 회복"},
 "온기 약포":{material:"손질한 곡물",cold:.35,description:"한기 35%p 감소"}
};
for(const [id,medicine] of Object.entries(townMedicine)){
 craftItems[id]={id,name:id,category:7,form:"약품",region:0,source:"지역 병원에서 제조",effect:medicine.description};
}
const tradeSpecialties=[[0,"산감"],[2,"가시배 열매"],[3,"서비스베리"],[4,"붉은 메밀"],[5,"야생 쌀"],[6,"타마린드"],[7,"클라우드베리"]];

function buildTownServices(){
 const center=craftStationPositions[s.region][0];
 const roles=s.region===1?["post","clinic","trader","smith"]:["post","clinic"];
 const houses=buildingFootprints.filter(p=>p.villageHome&&p.approach&&["민가","운하 상가"].includes(p.name))
  .map(p=>({p,distance:Math.hypot(p.x-center[0],p.z-center[1])})).sort((a,b)=>a.distance-b.distance);
 const sites=[];
 for(const {p} of houses){
  if(sites.length===roles.length)break;
  const [x,z]=p.approach,ground=terrainSurface(x,z),floor=supportAt(x,z,ground+.35);
  if(floor===null||ground<1.75||Math.abs(floor-ground)>.8||sites.some(site=>Math.hypot(site.x-x,site.z-z)<4))continue;
  const role=roles[sites.length],style=townRoles[role];
  const site={role,x,z,y:floor,buildingX:p.x,buildingZ:p.z,region:s.region};
  sites.push(site);
  const norm=Math.hypot(x-p.x,z-p.z)||1,fx=(x-p.x)/norm,fz=(z-p.z)/norm,angle=Math.atan2(fx,fz);
  const sx=x-fx*.62,sz=z-fz*.62;
  const plaque=color(style.paint),mark=color(style.trim),wood=color("#3e3027");
  if(windowOnlyRegion(s.region)){
  const faceDistance=Math.min((p.insideW??p.w)*.5/Math.max(.001,Math.abs(fx)),(p.insideD??p.d)*.5/Math.max(.001,Math.abs(fz)));
  const facadeX=p.x+fx*(faceDistance+.25),facadeZ=p.z+fz*(faceDistance+.25),facadeY=p.ceiling-p.wallHeight;
  const canopy=role==="trader"?3.15:role==="clinic"?2.75:2.35;
  box(facadeX,facadeY+2.51,facadeZ,canopy,.16,.72,plaque,angle,8);
  box(facadeX+fx*.34,facadeY+2.44,facadeZ+fz*.34,canopy,.095,.12,mark,angle,8);
  for(const dx of [-canopy*.46,canopy*.46]){
   box(facadeX+fz*dx,facadeY+.62,facadeZ-fx*dx,.18,1.72,.15,plaque,angle,8);
  }
  }
  const bar=(dx,dy,w,h,tint=mark,depth=.19)=>box(sx+fz*dx+fx*.10,floor+dy,sz-fx*dx+fz*.10,w,h,depth,tint,angle,8);
  for(const dx of [-.73,.73]){
   bar(dx,0,.12,2.44,wood);
   bar(dx,1.22,.16,.43,plaque);
  }
  bar(0,1.79,1.63,.61,wood,.21);
  bar(0,1.84,1.50,.49,plaque,.245);
  bar(0,1.87,1.39,.024,mark,.28);
  bar(0,2.27,1.39,.024,mark,.28);
  if(role==="clinic"){bar(0,1.95,.092,.28,mark,.31);bar(0,2.043,.32,.084,mark,.31);}
  if(role==="post"){
   bar(0,1.98,.34,.20,mark,.31);bar(0,2.006,.272,.145,plaque,.34);bar(0,2.107,.265,.024,mark,.38);
  }
  if(role==="trader"){bar(0,1.975,.065,.25,mark,.31);bar(0,2.144,.34,.052,mark,.31);for(const dx of [-.15,.15])bar(dx,2.016,.105,.063,mark,.31);}
  if(role==="smith"){bar(0,1.986,.19,.08,mark,.31);bar(0,2.058,.30,.091,mark,.31);bar(-.10,2.14,.25,.063,mark,.31);}
  aimBox(style.name,sx,sz,1.75,1.75,floor+.1,floor+2.52,null,{type:"townService",id:"town-service-"+role,role,x,z,reach:3.8});
 }
 townServicesByRegion.set(s.region,sites);
}
function townServiceNear(role){
 return townServices().some(site=>site.role===role&&Math.hypot(player.x-site.x,player.y-site.z)<=3.8);
}
const townState=()=>s.townServices??={market:{},postDays:{}};
function townServiceMenu(role,section="all"){
 if(!townServiceNear(role))return false;
 const body=craftPanel(r().name+" · "+townRoles[role].name);body.classList.add("craft-panel");
 if(role==="post")townPost(body);
 if(role==="clinic")townClinic(body);
 if(role==="trader")townMarket(body,section);
 if(role==="smith")townSmith(body);
 menuAction(body,"닫기",resumeGameplay);setPauseBack(resumeGameplay);
 return true;
}
function townPost(body){
 for(const quest of activeMapQuests().filter(q=>q.region===s.region).slice(0,3)){
  craftParagraph(body,quest.title+" · "+quest.description);
 }
 const post=s.townServices,parcel=post?.parcel,region=s.region;
 if(parcel){
  craftParagraph(body,"배달 중 · "+regions[parcel.from].name+" → "+regions[parcel.to].name);
  if(parcel.to===region)row(body,"밀봉 편지 전달",coinAmount(parcel.reward,"받을 보상",true),()=>{
   if(!townServiceNear("post")||s.townServices?.parcel!==parcel||s.region!==parcel.to)return;
   if(craftTransaction(()=>{s.coins+=parcel.reward;delete townState().parcel;return true;},["townServices"])){
    log("밀봉 편지를 전달했다.","success");townServiceMenu("post");
   }
  });
 }else if(post?.postDays?.[region]===s.day)craftParagraph(body,"오늘 이 우체국의 배달 의뢰를 받았어.","muted");
 else{
  for(const road of worldRoads[region])row(body,regions[road.to].name+"행 밀봉 편지","배달 맡기",()=>{
   if(!townServiceNear("post")||s.region!==region||s.townServices?.parcel||s.townServices?.postDays?.[region]===s.day)return;
   if(craftTransaction(()=>{const state=townState();state.parcel={from:region,to:road.to,reward:12};state.postDays[region]=s.day;return true;},["townServices"]))townServiceMenu("post");
  });
 }
}
function townClinic(body){
 const herb=r().plants[1][0];
 for(const [id,recipe] of Object.entries(townMedicine)){
  const make=row(body,id+" · "+herb+" 1 + "+recipe.material+" 1 · "+recipe.description,"제조",()=>{
   if(!townServiceNear("clinic")||timberFree(herb)<1||timberFree(recipe.material)<1||count(id)>=999)return;
   if(craftTransaction(()=>{give(herb,-1);give(recipe.material,-1);give(id);return true;}))townServiceMenu("clinic");
  });
  make.disabled=timberFree(herb)<1||timberFree(recipe.material)<1||count(id)>=999;
 }
}
function townMedicineMenu(id){
 const recipe=townMedicine[id],body=craftPanel(id);
 craftParagraph(body,recipe.description+" · 보유 "+count(id));
 const use=menuAction(body,"사용",()=>{
  if(!count(id))return;
  if(craftTransaction(data=>{
   if(recipe.health){if(data.health>=100)return false;data.health=Math.min(100,data.health+recipe.health);}
   if(recipe.cold){if(data.cold<=0)return false;data.cold=Math.max(0,data.cold-recipe.cold);}
   give(id,-1);return true;
  })){log(id+" 사용 · "+recipe.description,"success");satchel();}
 });
 use.disabled=recipe.health?(s.crafting?.health??100)>=100:(s.crafting?.cold??0)<=0;
 menuAction(body,"가방으로",satchel);setPauseBack(satchel);
}
const marketRouteHops=new Map();
function marketHops(origin){
 if(marketRouteHops.has(origin))return marketRouteHops.get(origin);
 const distances=new Map([[1,0]]),queue=[1];
 for(const region of queue)for(const {to} of worldRoads[region])if(!distances.has(to)){
  distances.set(to,distances.get(region)+1);queue.push(to);
 }
 for(const [region,distance] of distances)marketRouteHops.set(region,distance);
 return distances.get(origin)??3;
}
function marketPressure(region,day){
 const dayWeather=localWeather(region,0,day,12),bad=severeWeather(region,0,day,12,[12,8,27,31,48,4,4,25][region]);
 const roughness=cap(dayWeather.rain*.55+bad.snow*.85+bad.dust*.55+bad.storm*.6,0,1);
 const harvest=(1+Math.cos(day*2*Math.PI/(8+region%4)+region*.85))/2;
 const delay=rand(47359+region*12541+day*1549)()<.24;
 const freight=cap((marketHops(region)-1)*.14+(delay?.42:0),0,1);
 const score=cap(.53+roughness*.42-harvest*.48+freight*.39,0,1);
 return {score,weather:roughness>.43?"악천후":dayWeather.rain>.24?"비":"보통",harvest:harvest>.64?"풍부":harvest<.32?"부족":"보통",delay};
}
function marketPrice(anchor,score){
 const low=Math.max(3,Math.round(anchor*.86));
 // All whole-coin prices lie in a band whose highest value is at most 140% of its lowest.
 const high=Math.floor(low*1.4+1e-9);
 return Math.round(low+(high-low)*score);
}
function townMarketQuote(region,id,day=s.day){
 const retail=regionalIngredients.find(item=>item.id===id)?.price??storeItems[id]??4;
 const baseSell=Math.max(1,Math.floor(retail*.50));
 const buyAnchor=Math.max(3,Math.floor(retail*.80)),sellAnchor=Math.min(buyAnchor,Math.max(3,baseSell+1,Math.floor(retail*.70)));
 const now=marketPressure(region,day),before=day>1?marketPressure(region,day-1):now;
 const buy=marketPrice(buyAnchor,now.score),sell=marketPrice(sellAnchor,now.score);
 return {retail,baseSell,buy,sell,previousBuy:marketPrice(buyAnchor,before.score),previousSell:marketPrice(sellAnchor,before.score),...now};
}
function marketChange(current,previous){
 const difference=current-previous;
 const pct=previous?Math.abs(difference)/previous*100:0;
 const display=Number(pct.toFixed(1)).toLocaleString("ko-KR");
 const sign=difference>0?"+":difference<0?"−":"";
 const tag=document.createElement("small");tag.className="market-change";
 tag.dataset.direction=difference>0?"up":difference<0?"down":"flat";
 tag.textContent=(difference>0?"▲ ":difference<0?"▼ ":"— ")+sign+Math.abs(difference)+" ("+sign+display+"%)";
 tag.setAttribute("aria-label","전일 대비 "+(difference>0?"상승 ":difference<0?"하락 ":"보합 ")+Math.abs(difference)+", "+display+"퍼센트");
 return tag;
}
function townMarketUsed(id){
 const market=s.townServices?.market;
 return market?.day===s.day?market.sold[id]??{buy:0,sell:0}:{buy:0,sell:0};
}
function townMarketDeal(region,id,direction){
 if(s.region!==1||!townServiceNear("trader")||shopShortage(1)===2)return false;
 if(!tradeSpecialties.some(([from,product])=>from===region&&product===id)||!['buy','sell'].includes(direction))return false;
 const price=townMarketQuote(region,id)[direction],limit=direction==="buy"?3:5;
 if(townMarketUsed(id)[direction]>=limit||direction==="buy"&&(s.coins<price||count(id)>=999)||direction==="sell"&&timberFree(id)<1)return false;
 return craftTransaction(()=>{
  const state=townState();
  if(state.market.day!==s.day)state.market={day:s.day,sold:{}};
  const amounts=state.market.sold[id]??={buy:0,sell:0};amounts[direction]++;
  s.coins+=direction==="buy"?-price:price;give(id,direction==="buy"?1:-1);
  return true;
 },["townServices"]);
}
function townMarket(body,initial){
 const halted=shopShortage(1)===2;
 const balance=shopHeader(body,"trade",s.day+"일차 · 특산품 시세",halted?"봉쇄로 거래가 중단됐어.":"전일 대비 최대 40% · 산지 수확과 운송 상태 반영");
 if(halted)return;
 const entries=tradeSpecialties.map(([region,id])=>({region,id,group:String(region)}));
 const names=Object.fromEntries(tradeSpecialties.map(([region])=>[region,regions[region].name]));
 const catalog=shopCatalog(body,entries,(section,{region,id})=>{
  const price=townMarketQuote(region,id),used=townMarketUsed(id);
  const {card,info,actions}=shopItemCard(section,id,"trade");card.classList.add("shop-market-item");
  const reference=craftParagraph(info,"현지 소매가 ","market-reference");
  reference.append(coinAmount(price.retail,"현지 소매가",true)," · 기준 매입가 ",coinAmount(price.baseSell,"기준 매입가",true));
  craftParagraph(info,"산지 "+price.weather+" · 수확 "+price.harvest+(price.delay?" · 운송 지연":" · 정상 운송"),"market-reference");
  const quotes=document.createElement("div");quotes.className="shop-market-quotes";actions.append(quotes);
  for(const [direction,label,limit] of [["buy","구매",3],["sell","판매",5]]){
   const previous=direction==="buy"?price.previousBuy:price.previousSell;
   const cell=document.createElement("div");quotes.append(cell);
   const control=button(cell,label,()=>{
    if(townMarketDeal(region,id,direction)){updateCoinAmount(balance,s.coins,"소지금");catalog.draw(id+direction);}
   },direction==="buy");
   control.append(coinAmount(price[direction],label+" 가격",true));control.dataset.shopBuy=id+direction;
   const prior=craftParagraph(cell,s.day>1?"어제 ":"기준 ","market-prior");
   prior.append(coinAmount(previous,"이전 "+label+" 가격",true),marketChange(price[direction],previous));
   control.disabled=used[direction]>=limit||(direction==="buy"?s.coins<price.buy||count(id)>=999:timberFree(id)<1);
  }
 },initial,names);
}
const forgePower=instance=>2*Math.max(0,Math.min(3,instance?.forgeLevel??0));
function townForgeUpgrade(id,key){
 if(s.region!==1||!townServiceNear("smith"))return false;
 const instance=weaponInstances(id).find(item=>item.key===key),level=forgePower(instance)/2;
 const material=level===0?"고철":"철재",cost=16+level*12;
 if(!instance||level>=3||s.coins<cost||timberFree(material)<level+1)return false;
 return craftTransaction(()=>{
  give(material,-(level+1));s.coins-=cost;instance.forgeLevel=level+1;
  return true;
 });
}
function townSmith(body){
 shopHeader(body,"tools","무기 강화");
 craftParagraph(body,"무기 한 자루씩 최대 3단계 강화 · 단계당 기본 피해 +2","muted");
 const list=Object.entries(s.crafting?.instances??{}).flatMap(([id,items])=>items.map(instance=>[id,instance]));
 if(!list.length)craftParagraph(body,"강화할 무기를 가방에 가져와.");
 const rack=document.createElement("section");rack.className="shop-service-card";body.append(rack);
 const title=document.createElement("h3");title.append(shopGlyph("tools"),"강화할 무기");rack.append(title);
 for(const [id,instance] of list){
  const level=forgePower(instance)/2,material=level===0?"고철":"철재",cost=16+level*12;
  const label=craftName(id)+" · +"+level+" · 내구도 "+Math.round(instance.wear)+"%";
  if(level>=3){craftParagraph(rack,label+" · 최대 강화");continue;}
  const control=row(rack,label+" · "+material+" "+(level+1),coinAmount(cost,"강화 비용",true),()=>{
   if(townForgeUpgrade(id,instance.key))townServiceMenu("smith");
  });
  control.disabled=s.coins<cost||timberFree(material)<level+1;
 }
}
