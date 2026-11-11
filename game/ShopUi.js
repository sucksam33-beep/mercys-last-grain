"use strict";
const shopGlyphs={
 all:"M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
 tools:"M7 4h11l3 3v3h-7v4h-3v7H8v-9l3-3H6V6z",
 fishing:"M3 12c5-6 10-6 15 0-5 6-10 6-15 0zm15 0 4-4v8z M7 11h1",
 supply:"M3 6h18v14H3z M3 10h18 M9 6v14m6-14v14 M8 3h8",
 grain:"M12 21V4m0 14c-4 0-6-3-6-5 3 0 6 2 6 5Zm0-5c4 0 6-3 6-5-3 0-6 2-6 5Zm0-5c-2-2-2-4 0-6 2 2 2 4 0 6Z",
 produce:"M12 7c-4-3-9 0-9 5 0 5 4 9 7 8l2-1 2 1c3 1 7-3 7-8 0-5-5-8-9-5Zm0 0c0-3 2-4 5-4",
 herb:"M4 20c7-3 12-7 16-15 M7 16C4 9 11 4 20 5c0 9-5 14-13 11Z",
 ready:"M3 11h18c0 6-4 9-9 9s-9-3-9-9Zm4-3c-2-2 2-3 0-5m5 5c-2-2 2-3 0-5m5 5c-2-2 2-3 0-5",
 meat:"M8 19c-4 1-6-2-5-5l4-4c0-5 4-8 9-7 6 1 7 7 4 11-2 3-6 4-9 3z M16 8a2 2 0 1 0 0 4 2 2 0 1 0 0-4Z",
 trade:"M3 8h17l-4-4m5 12H4l4 4",
 post:"M3 5h18v14H3z M3 6l9 7 9-7",
 clinic:"M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"
};
const shopSections={all:"전체",tools:"도구·장비",fishing:"낚시·수산",supply:"보급 재료",grain:"곡물·씨앗",produce:"과일·채소",herb:"약초·향초",ready:"즉석 식품",meat:"육류",trade:"지역 거래"};
function shopGlyph(key){
 const node=document.createElementNS("http://www.w3.org/2000/svg","svg");node.setAttribute("viewBox","0 0 24 24");node.setAttribute("aria-hidden","true");node.classList.add("shop-glyph");
 const path=document.createElementNS(node.namespaceURI,"path");path.setAttribute("d",shopGlyphs[key]??shopGlyphs.trade);node.append(path);return node;
}
function shopItemGroup(id,kind){
 const entry=craftItems[id];
 if(/낚싯대|채비|뜰채|치어/.test(id)||entry?.form==="물고기")return "fishing";
 if(kind===0)return Object.hasOwn(storeItems,id)?"tools":"supply";
 if(kind===2)return /고기/.test(id)?"meat":"supply";
 if(id==="주먹밥"||regionalDishById[id])return "ready";
 if(id==="씨앗"||/이삭|곡물|보리|호밀|귀리|메밀|기장|수수|쌀|테파리콩|동부 꼬투리/.test(id))return "grain";
 if(/잎|찻순|향초|레몬그라스/.test(id))return "herb";
 if(id==="소금")return "supply";
 return "produce";
}
function shopHeader(body,kind,label,notice){
 body.classList.add("craft-panel","shop-panel");body.dataset.shopKind=kind;
 const top=document.createElement("div");top.className="shop-summary";
 const name=document.createElement("strong");name.append(shopGlyph(kind),label);top.append(name);
 const balance=coinAmount(s.coins,"소지금");top.append(balance);body.append(top);
 if(notice)craftParagraph(body,notice,"shop-notice");
 return balance;
}
function shopArt(id,key){
 const art=document.createElement("div");art.className="shop-art";
 const fallback=shopGlyph(key);art.append(fallback);
 const entry=craftItems[id];
 if(entry){
  const image=craftCardArt(entry);image.alt="";image.loading="eager";image.hidden=true;
  image.addEventListener("load",()=>{image.hidden=false;fallback.setAttribute("hidden","");},{once:true});
  art.append(image);
  if(image.complete&&image.naturalWidth){image.hidden=false;fallback.setAttribute("hidden","");}
 }
 return art;
}
function shopCatalog(body,entries,paint,initial="all",customLabels={}){
 const grouped=new Map();
 for(const entry of entries){if(!grouped.has(entry.group))grouped.set(entry.group,[]);grouped.get(entry.group).push(entry);}
 const label=key=>customLabels[key]??shopSections[key]??key;
 const tabs=document.createElement("nav");tabs.className="shop-tabs";tabs.dataset.padSections="";tabs.setAttribute("aria-label","상품 분류");
 const list=document.createElement("div");list.className="shop-stock craft-list";body.append(tabs,list);
 let selected=grouped.has(initial)?initial:"all";
 function draw(focusId){
  const scroll=list.scrollTop;list.replaceChildren();
  for(const [key,items] of grouped){
   if(selected!=="all"&&selected!==key)continue;
   const section=document.createElement("section"),heading=document.createElement("h3");
   section.className="shop-section";heading.append(shopGlyph(key),label(key));section.append(heading);list.append(section);
   for(const item of items)paint(section,item,selected);
  }
  if(!entries.length)craftParagraph(list,"판매할 상품이 없어.","muted");
  list.scrollTop=scroll;
  if(focusId){const control=[...list.querySelectorAll('[data-shop-buy]')].find(button=>button.dataset.shopBuy===focusId);if(control&&!control.disabled)control.focus({preventScroll:true});}
 }
 for(const key of ["all",...grouped.keys()]){
  const tab=button(tabs,"",()=>{selected=key;for(const item of tabs.children)item.setAttribute("aria-pressed",String(item===tab));list.scrollTop=0;draw();});
  tab.append(shopGlyph(key),label(key));tab.setAttribute("aria-pressed",String(key===selected));
 }
 draw();return {draw,list};
}
function shopItemCard(parent,id,key,price,stock){
 const card=document.createElement("article");card.className="shop-item";parent.append(card);card.append(shopArt(id,key));
 const info=document.createElement("div");info.className="shop-item-info";card.append(info);
 const name=document.createElement("strong");name.textContent=craftName(id);info.append(name);
 const metrics=document.createElement("div");metrics.className="shop-metrics";info.append(metrics);
 if(price!==undefined)metrics.append(coinAmount(price,"개당 가격",true));
 const countLabel=(text,empty=false)=>{const badge=document.createElement("small");badge.className="shop-count";badge.textContent=text;if(empty)badge.dataset.empty="";metrics.append(badge);};
 if(stock!==undefined)countLabel("재고 "+stock,stock===0);
 countLabel("보유 "+count(id));
 const actions=document.createElement("div");actions.className="shop-actions";card.append(actions);
 return {card,info,actions};
}
