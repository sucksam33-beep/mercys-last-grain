"use strict";
const regionalShopRows=[
 [["아사기역 도구점","손도끼|곡괭이|손괭이|채집가위|여행솥"],["논둑 식료품점","주먹밥|씨앗|벼 이삭|산감|야생 찻순|감자"],["공동 생활터 정육점","고기 조각|작은 고기"]],
 [["운하 수리점","곡괭이|낚싯대|민물 채비|뜰채|고철"],["시장 곡물상","들보리|호밀|야생 사과|야생 배|손질한 곡물|양파"],["시장 정육점·민물 생선대","작은 고기|사냥한 고기|큰 고기|로치|유럽농어"]],
 [["저수지 보급점","여행솥|채집가위|곡괭이|용설란 섬유"],["협곡 식료품점","테파리콩|사막 기장|가시배 열매|사막 무화과"],["마른 골짜기 정육점","고기 조각|사냥한 고기"]],
 [["숲길 도구점","손도끼|채집가위|사냥 활|소나무 송진"],["고원 곡물점","산귀리|초지 보리|서비스베리|산박하 잎"],["사냥꾼 정육점","작은 고기|사냥한 고기|큰 고기|엘크 힘줄"]],
 [["철도 보급창고","곡괭이|손도끼|낚싯대|숯"],["역전 식료품점","고산 귀리|붉은 메밀|블랙커런트|손질한 곡물|감자"],["호숫가 정육점·생선대","사냥한 고기|큰 고기|황농어|코카니연어"]],
 [["나루 도구점","뜰채|낚싯대|바다 채비|치어|갈대 섬유"],["제방 식료품점","야생 쌀|제방 기장|수수|야생 감|물민트 잎|양파"],["수상 정육점·생선대","작은 고기|사냥한 고기|숭어|블루길|숭어 기름"]],
 [["선착장 보급점","바다 채비|뜰채|여행솥|표류 밧줄"],["해안 과일점","망고|타마린드|야생 구아바|해안 기장|동부 꼬투리|소금"],["항구 정육점·어시장","작은 고기|사냥한 고기|정어리|작은전갱이|붉은퉁돔"]],
 [["관측소 보급처","손도끼|낚싯대|여행솥|모직|숯"],["북부 저장식 상점","내한성 보리|해안 귀리|월귤|클라우드베리"],["겨울 정육점·생선대","사냥한 고기|청어|빙어|큰 고기"]]
];
const regionalShops=regionalShopRows.flatMap((row,region)=>row.map(([name,ids],kind)=>({
 id:"regional-shop-"+region+"-"+kind,name,region,kind,items:ids.split("|")
})));
function shopShortage(region){
 if(region===1&&s.soilCampaign?.step==="blockade"&&!s.soilCampaign.routes?.[1])return 2;
 if(region===1&&s.brunnenAct?.phase==="battle"&&s.brunnenAct.plan==="blockade")return 2;
 const ending=s.winterCampaign?.ending?.regions?.find(record=>record.id===region);
 if(ending?.shortage)return 1;
 const a=s.karukAct;
 if(region<2&&a?.plan==="levy"&&(s.winterCampaign?.reserve??a.villages)?.[region]===0)return 1;
 return 0;
}
function regionalShopItems(shop){
 const local=shop.kind===1?regions[shop.region].plants.flat().filter(id=>ingredientModelKeys[id]):[];
 const common=shop.kind===0?Object.keys(storeItems).filter(id=>!["주먹밥","씨앗","치어"].includes(id)):[];
 const items=[...new Set([...shop.items,...common,...local])];
 if(shop.kind===1&&!items.includes("주먹밥"))items.push("주먹밥");
 if(shop.kind===1&&shop.region!==6&&timberTransit(6,shop.region)&&shopShortage(shop.region)===0)items.push("소금");
 return items.filter(canBuyItem);
}
function regionalShopQuote(shop,id){
 const ingredient=regionalIngredients.find(item=>item.id===id),row=craftItems[id];
 const gear=shop.kind===0&&Object.hasOwn(storeItems,id)&&id!=="치어";
 const meatFish=/고기/.test(id)||row?.form==="물고기";
 const material=shop.kind===0||id==="엘크 힘줄"||id==="숭어 기름";
 const shortage=shopShortage(shop.region);
 let capacity=gear?2:meatFish?(shop.region===2?3:4):id==="주먹밥"?3:material?3:8;
 let price=ingredient?.price??storeItems[id]??(meatFish?7:material?6:4);
 if(id==="소금"&&shop.region!==6){capacity=3;price+=2;}
 if(shop.region===7&&id==="큰 고기"&&!(s.regionalFood?.karukShipmentDay===s.day||s.timberShipments?.some(ship=>ship.to===7&&ship.arrival===s.day)))capacity=0;
 if(shortage&&!gear){capacity=shortage===2?0:Math.floor(capacity/2);price+=shortage+1;}
 const stock=s.regionalFood?.stock[shop.id];
 const sold=stock?.day===s.day?stock.sold[id]??0:0;
 return {quantity:Math.max(0,capacity-sold),price};
}
function regionalBuy(shop,id,n){
 const site=regionalFoodLocations()[shop.id];
 if(s.region!==shop.region||!site||Math.hypot(player.x-site.x,player.y-site.z)>3.6||!regionalShopItems(shop).includes(id))return false;
 const quote=regionalShopQuote(shop,id);
 if(!Number.isInteger(n)||n<1||n>quote.quantity||quote.price*n>s.coins||count(id)+n>999)return false;
 return craftTransaction(()=>{
  const food=foodState();
  const stock=food.stock[shop.id]?.day===s.day?food.stock[shop.id]:(food.stock[shop.id]={day:s.day,sold:{}});
  stock.sold[id]=(stock.sold[id]??0)+n;
  s.coins-=quote.price*n;
  give(id,n);
  districtEcologyDirty=true;
  return true;
 });
}
function regionalShopMenu(shop,initial="all"){
 const body=craftPanel(shop.name),shortage=shopShortage(shop.region);
 const balance=shopHeader(body,["tools","produce","meat"][shop.kind],["도구·보급","식료품","정육·수산"][shop.kind],shortage===2?"봉쇄로 판매 중단":shortage?"보급 부족":"");
 const entries=regionalShopItems(shop).map(id=>({id,group:shopItemGroup(id,shop.kind)}));
 const catalog=shopCatalog(body,entries,(section,{id,group},selected)=>{
  const quote=regionalShopQuote(shop,id);
  const {actions}=shopItemCard(section,id,group,quote.price,quote.quantity);
  const n=document.createElement("input");n.type="number";n.min="1";n.max=String(quote.quantity);n.value="1";n.disabled=!quote.quantity;
  n.setAttribute("aria-label",craftName(id)+" 구매 수량");actions.append(n);
  const buy=button(actions,"",()=>{
   if(regionalBuy(shop,id,n.valueAsNumber)){
    updateCoinAmount(balance,s.coins,"소지금");catalog.draw(id);
   }else log("돈, 재고, 구매 수량을 확인해.","warning");
  },true);
  buy.append(shopGlyph("trade"),quote.quantity?"구매":"품절");buy.dataset.shopBuy=id;buy.disabled=!quote.quantity;
  const dishes=regionalDishes.filter(dish=>dish.needs.some(([part])=>part===id));
  if(dishes.length){
   const related=button(actions,"",()=>{
    const panel=craftPanel(craftName(id)+" · 만들 수 있는 요리");
    const back=()=>regionalShopMenu(shop,selected);
    for(const dish of dishes)menuAction(panel,dish.name,()=>foodDetail(dish,back)).prepend(craftCardArt(craftItems[dish.id]));
    menuAction(panel,"상점으로",back);setPauseBack(back);
   });
   related.classList.add("shop-aux");related.append(shopGlyph("ready"),"관련 요리");
  }
 },initial);
 menuAction(body,"닫기",resumeGameplay);setPauseBack(resumeGameplay);
}
const regionalFoodSiteCache=new Map();
function regionalFoodLocations(){return regionalFoodSiteCache.get(s.region)??{};}
function regionalShopVendors(){
 const sites=regionalFoodLocations();
 return regionalShops.filter(shop=>shop.region===s.region&&sites[shop.id]&&shopShortage(shop.region)!==2).map(shop=>{
  const {x,y,z}=sites[shop.id];
  return {points:[[x,y,z-.76],[x+.05,y,z-.76]],phase:0,style:shop.kind,speed:0};
 });
}
function buildRegionalFoodWorld(){
 const region=s.region, shops=regionalShops.filter(shop=>shop.region===region), sites={};
 const [bx,bz]=craftStationPositions[region][0];
 const shopAnchor=[
  region===0?[93,114]:[bx,bz],
  region===1?[133,115]:region===0?[168,146]:[bx+8,bz+3],
  region===0?[315,331]:region===1?[137,118]:[bx+14,bz+8]
 ];
 const layouts=[...shops.map((shop,i)=>[shop.id,shopAnchor[i],shop.name,shop]),
  ["여행솥",region===0?[249,211]:[bx+4,bz+3],"여행솥 · 모닥불"],
  ["집 화덕",[bx+5,bz+8],"공동 화덕"],["건조대",[bx+10,bz+8],"건조대"],["요리판",[bx+8,bz+5],"지역 요리판"]];
 for(const [key,[cx,cz],label,shop] of layouts){
  let point=null;
  for(let radius=1.8;radius<17&&!point;radius+=1.8)for(let j=0;j<12&&!point;j++){
   const a=j*Math.PI/6,x=cx+Math.cos(a)*radius,z=cz+Math.sin(a)*radius;
   const floor=terrainSurface(x,z);
   if(floor<1.7||Object.values(sites).some(o=>Math.hypot(o.x-x,o.z-z)<2.5))continue;
   const support=supportAt(x,z,floor);
   if(support===null||Math.abs(floor-support)>.12)continue;
   const reach=[0,1,2,3].some(k=>{
    const px=x+Math.cos(k*Math.PI/2)*2.4,pz=z+Math.sin(k*Math.PI/2)*2.4,py=supportAt(px,pz,floor);
    return py!==null&&Math.abs(py-floor)<.45&&unobstructed({x:px,y:pz,floor:py},{x,y:z})!==null;
   });
   if(reach)point={x,z,y:floor};
  }
  if(!point)continue;
  sites[key]=point;
  const {x,z,y}=point,wood=color("#82674b"),iron=color("#68605a");
  if(shop){
   for(const dx of [-.53,.53])box(x+dx,y,z,.16,.76,.54,wood,0,8);
   box(x,y+.74,z,1.4,.13,.66,wood,0,8);
   box(x,y+.89,z-.30,1.24,.32,.065,color(["#856b46","#676d49","#85594c"][shop.kind]),0,8);
   const stocked=regionalShopItems(shop).filter(id=>regionalShopQuote(shop,id).quantity>0);
   const shown=shop.kind===0?stocked.slice(0,4):stocked;
   const columns=shop.kind===0?4:6;
   if(shop.kind!==0){
    const levels=Math.ceil(shown.length/columns);
    for(let level=0;level<levels;level++){
     const top=y+.87+level*.24;
     box(x,top-.04,z+.10,1.85,.04,.48,wood,0,8);
    }
    if(levels>1)for(const dx of [-.86,.86]){
     const floor=terrainSurface(x+dx,z-.10);
     box(x+dx,Math.min(floor,y),z-.10,.075,y+.87+(levels-1)*.24-Math.min(floor,y),.075,wood,0,8);
    }
   }
   shown.forEach((id,i)=>{
    const offset=x+(i%columns-(columns-1)/2)*.28;
    const top=y+.87+Math.floor(i/columns)*.24;
    const model=ingredientModelKeys[id]||priorityItemModel(id);
    if(!showMaterialModel(id,offset,top,z+.13,.23,.18,.23,Boolean(model))){
     if(shop.kind===0)box(offset,top,z+.13,.18,.12,.15,iron);
     else if(shop.kind===1)rounded(offset,top+.01,z+.13,.22,.12,.19,color(i%2?"#b78948":"#a47f54"));
     else tube([offset-.09,top+.05,z+.13],[offset+.09,top+.06,z+.12],.05,.04,color("#9d6757"),0,7);
    }
   });
  }else if(key==="여행솥"||key==="집 화덕"){
   if(key!=="여행솥"||!showMaterialModel(key,x,y,z,.55,.55,0,true)){
    taper(x,y,z,key==="집 화덕"?.65:.22,.43,.39,iron,9);
    taper(x,y+(key==="집 화덕"?.65:.20),z,.21,.22,.19,color("#544d42"),10);
   }
  }else{
   for(const dx of [-.49,.49])box(x+dx,y,z,.10,1,.23,wood,0,8);
   box(x,y+.80,z,1.18,.12,.49,wood,0,8);
  }
  aimBox(label,x,z,1.3,1.0,y,y+1.25,null,{type:"regionalFood",id:key,x,z,reach:3.6,shop});
 }
 regionalFoodSiteCache.set(region,sites);
}
function regionalFoodInteract(action){
 if(action.shop){regionalShopMenu(action.shop);return true;}
 if(action.id==="요리판"){learnLocalFood();return true;}
 regionalCookingMenu(action.id);return true;
}
