"use strict";
const atlasAssetNames=["asagi","brunnen","santa-lucia","juniperwell","beaverton","saint-aurel","ambaro","karuk"];
const atlasIcons={
 station:["역과 철도","#ffe1a3","M5 15V7q0-3 7-3t7 3v8q0 2-2 2H7q-2 0-2-2Z","M7 7h10v4H7z M8 14h1m6 0h1 M8 18l-3 3m11-3 3 3M8 20h8"],
 home:["집과 마을","#ffe1a3","M2 11 12 3l10 8-2 2-2-1v8H6v-8l-2 1Z","M10 20v-6h4v6m2-13V4h2v5"],
 wood:["숲과 목재 산지","#b9eda0","M7 5 2 13h3l-3 4h7v4h2v-4h4l-3-4h2L9 5Z M16 3l-4 6h3l-2 3h2l3 5h4l-3-5h2Z","M18 17v4"],
 stone:["채석장","#dad8cb","m2 17 6-11 7-3 5 6 2 9-5 3H7Z","M8 6l4 7 8-4m-8 4-5 8m5-8 5 8"],
 fish:["낚시터","#b0e8ff","M2 12q7-9 15-2l5-4v12l-5-4Q9 21 2 12Z","M6 11h.1M12 8q-4 4 0 8"],
 water:["수문과 물가","#b0e8ff","M3 5h18v3H3z M5 8h3v8H5z m11 0h3v8h-3z","M11 9h2v7h-2zm-9 9q3-3 5 0t5 0 5 0 5 0M2 21q3-3 5 0t5 0 5 0 5 0"],
 field:["논밭과 생활터","#e3e696","M11 14Q5 14 5 8q6 0 6 6Zm2-3q0-5 6-6-1 6-6 6Z M11 8Q7 5 12 2q3 4-1 6Z","M12 7v11M3 19q9-4 18 0M6 22q6-4 12 0"],
 grave:["공동묘지","#dbd2e5","M6 19v-8a6 6 0 1 1 12 0v8Z M3 19h18v2H3Z","M12 8v7m-3-5h6"],
 shop:["상점","#ffbd8e","M3 5h18l2 6q-2 3-5 0-3 3-6 0-3 3-6 0-3 3-5 0Z M4 13h16v8H4Z","M7 15h5v3H7z m8 6v-6h3v6M8 5l-2 6m8-6 1 6"],
 post:["우체국","#a7eadb","M3 6h18v13H3Z","m3 7 9 7 9-7M4 18l6-5m10 5-6-5"],
 clinic:["병원","#ffb8a6","M3 8h18v12H3Z","M8 8V5h8v3m-4 3v6m-3-3h6"],
 market:["무역상","#c3efaf","M3 18h18v3H3Z","M12 5v13m-8-10 8-3 8 3M5 8l-3 6h6Zm14 0-3 6h6Z"],
 smith:["대장장이","#ffc596","M2 12h20l-4 4h-4l-1 3h5v2H6v-2h4v-3H6Z M11 4l3-2 5 5-3 3Z","m13 7-5 5"],
 cook:["조리 시설","#ffeab0","M4 12h16v4q0 5-8 5t-8-5Z","M2 13h2m16 0h2M8 9c-3-2 2-3 0-5m4 5c-3-2 2-4 0-6m4 6c-3-2 2-3 0-5"],
 bridge:["교량","#f6eacf","M2 9h20v4h-3v6h-3q0-6-4-6t-4 6H5v-6H2Z","M2 21q3-2 5 0t5 0 5 0 5 0M5 9V6m7 3V6m7 3V6M4 6h16"],
 exit:["지역 연결로","#ffd489","M5 9h10V5l7 6-7 5v-4H5Z","M7 5v16m-4 0h8"],
 region:["지역 지도","#f6dc9d","M12 2 22 12 12 22 2 12Z","m5 15 5-7 3 5 2-3 4 5M10 8l1 4 2 1"],
 wildlife:["야생동물 서식 범위","#c6f1ad","M6 16q0-2 3-3 1-4 3-4t3 4q3 1 3 3 0 4-6 2-6 2-6-2ZM4 8a2 3-22 1 0 0 .1Zm5-4a2 3-10 1 0 0 .1Zm6 0a2 3 10 1 0 0 .1Zm5 4a2 3 22 1 0 0 .1Z",""],
 spot:["기타 길목","#dfd3ae","M5 21V4l4 3 7 1 3 3-3 3-7-1-4-3z","M5 8l5 2 6 1M2 21h8"],
 ping:["내 핑","#ffcf78","M12 2q7 0 7 7 0 4-7 12Q5 13 5 9q0-7 7-7Z","M12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"]
};
function atlasIcon(key){
 const [,tint,body,detail]=atlasIcons[key]??atlasIcons.spot,svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("aria-hidden","true");svg.classList.add("atlas-symbol");svg.style.color=tint;
 for(const [shape,kind] of [[body,"body"],[detail,"detail"]]){if(!shape)continue;const path=document.createElementNS(svg.namespaceURI,"path");path.setAttribute("d",shape);path.classList.add("atlas-symbol-"+kind);svg.append(path);}return svg;
}
function atlasIconFor(point){
 const text=point.label;
 if(point.kind==="service")return {"우체국":"post","병원":"clinic","무역상":"market","대장장이":"smith"}[text]??"spot";
 if(point.kind!=="place")return {craft:"cook",shop:"shop",wood:"wood",bridge:"bridge",exit:"exit"}[point.kind]??"spot";
 if(/묘지/.test(text))return "grave";
 if(/채석/.test(text))return "stone";
 if(/낚시|양식/.test(text))return "fish";
 if(/수문|제방|선착장/.test(text))return "water";
 if(/숲|채집/.test(text))return "wood";
 if(/생활터|논|밭/.test(text))return "field";
 if(/역|철도/.test(text))return "station";
 if(/집|마을/.test(text))return "home";
 return "spot";
}
function installAtlasLegend(body,keys){
 const toolbar=document.createElement("div"),panel=document.createElement("section");toolbar.className="atlas-toolbar";panel.className="atlas-legend-panel";panel.hidden=true;panel.id="atlas-legend-panel";panel.setAttribute("aria-label","범례");
 const toggle=button(toolbar,"",()=>toggleAtlasLegend());toggle.dataset.atlasLegend="";toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-controls",panel.id);
 const key=document.createElement("kbd");key.textContent="X";toggle.append(key,"범례");body.append(toolbar,panel);
 atlasHeading(panel,"h3","범례");
 const list=document.createElement("ul");panel.append(list);
 for(const id of new Set([...keys,"ping"])){
  const item=document.createElement("li");item.append(atlasIcon(id),atlasIcons[id][0]);list.append(item);
 }
 if(keys.includes("region"))questMapLegend(panel);
}
const atlasPlayerPings=new Map();
function mountAtlasPing(atlas,key){
 const marker=document.createElement("button");
 marker.type="button";marker.className="atlas-player-ping";marker.hidden=true;
 marker.setAttribute("aria-label","내 핑 지우기");marker.title="내 핑 지우기";marker.append(atlasIcon("ping"));
 const help=document.createElement("small");help.className="atlas-ping-help";
 help.textContent="지도 빈 곳 클릭 또는 장소에서 Y로 핑 찍기. 내 핑을 누르면 지워집니다.";
 atlas.before(help);atlas.append(marker);
 function draw(){
  const point=atlasPlayerPings.get(key);marker.hidden=!point;
  if(point){marker.style.left=point.x+"%";marker.style.top=point.y+"%";}
 }
 function clear(){atlasPlayerPings.delete(key);draw();}
 function place(point){
  const existing=atlasPlayerPings.get(key);
  if(existing&&Math.hypot(existing.x-point.x,existing.y-point.y)<.15){clear();return;}
  atlasPlayerPings.set(key,point);draw();
 }
 marker.addEventListener("click",clear);
 atlas.addEventListener("click",event=>{
  if(event.target!==atlas&&event.target!==atlas.querySelector("img"))return;
  const rect=atlas.getBoundingClientRect();
  place({x:cap((event.clientX-rect.left)/rect.width*100,0,100),y:cap((event.clientY-rect.top)/rect.height*100,0,100)});
 });
 atlas.addEventListener("contextmenu",event=>{event.preventDefault();clear();});
 atlas.pingFocusedPlace=()=>{
  const pin=document.activeElement;
  if(pin===marker){clear();return true;}
  if(!atlas.contains(pin)||!pin.matches(".atlas-icon-pin,.trail-destination-pin"))return false;
  const x=parseFloat(pin.style.left),y=parseFloat(pin.style.top);
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  place({x,y});return true;
 };
 draw();
}
function pingAtlasFocusedPlace(){
 const dialog=$("dialog");
 return dialog.open&&(dialog.querySelector(".atlas")?.pingFocusedPlace?.()??false);
}
function toggleAtlasLegend(){
 const control=document.querySelector("#dialog [data-atlas-legend]"),panel=$("atlas-legend-panel");
 if(!control||!panel||!$("dialog").open)return false;
 panel.hidden=!panel.hidden;control.setAttribute("aria-expanded",String(!panel.hidden));
 if(!panel.hidden)panel.scrollIntoView({block:"nearest"});
 return true;
}
function atlasMapFurniture(atlas,span){
 const compass=document.createElement("div");compass.className="atlas-compass";compass.setAttribute("aria-hidden","true");
 compass.innerHTML='<svg viewBox="0 0 60 60"><circle cx="30" cy="31" r="21"/><circle cx="30" cy="31" r="16"/><path d="M30 13l5 15 13 3-13 4-5 13-5-13-13-4 13-3z"/><path class="atlas-north" d="m30 13 5 15-5 3-5-3z"/><text x="30" y="9">N</text></svg>';
 atlas.append(compass);
 if(!span)return;
 const scale=document.createElement("div");scale.className="atlas-scale";scale.style.width=(100/span*100)+"%";scale.setAttribute("aria-label","축척 100미터");
 const start=document.createElement("span"),end=document.createElement("span");start.textContent="0";end.textContent="100 m";scale.append(start,end);
 atlas.append(scale);
}
const atlasPlaceUses={post:"밀봉 편지 배달과 지역 의뢰",clinic:"응급 붕대와 온기 약포 제조",market:"산지별 특산품 매매와 일일 시세",smith:"장착 무기와 보유 무기 강화",shop:"지역 도구와 식재료 구매",cook:"요리와 재료 가공",bridge:"강과 수로를 건너는 도보 통로",exit:"인접 지역으로 이어지는 길"};
function atlasMarkerTooltip(atlas){
 const tip=document.createElement("div");tip.className="atlas-marker-tooltip";tip.hidden=true;tip.setAttribute("role","tooltip");atlas.append(tip);return tip;
}
function connectAtlasTooltip(pin,tip,name,description){
 const show=()=>{
  tip.replaceChildren();const title=document.createElement("strong");title.textContent=name;tip.append(title);
  if(description){const copy=document.createElement("span");copy.textContent=description;tip.append(copy);}
  tip.style.left=pin.style.left;tip.style.top=cap(parseFloat(pin.style.top),7,93)+"%";
  tip.dataset.side=parseFloat(pin.style.left)>61?"left":"right";tip.hidden=false;tip.owner=pin;
 };
 const hide=()=>{if(tip.owner===pin&&!pin.matches(":focus,:hover"))tip.hidden=true;};
 pin.addEventListener("pointerenter",show);pin.addEventListener("focus",show);
 pin.addEventListener("pointerleave",hide);pin.addEventListener("blur",()=>{if(tip.owner===pin)tip.hidden=true;});
 pin.setAttribute("aria-label",name+(description?" / "+description:""));
}
function regionAtlas(region){
 const map=atlasCoordinates[region],rgn=regions[region],body=atlasPanel("지역 지도",rgn.name+" — "+rgn.area);
 const keys=map.pins.map(atlasIconFor);installAtlasLegend(body,[...keys,"wildlife"]);
 const layout=document.createElement("div");layout.className="atlas-map-layout";body.append(layout);
 const atlas=document.createElement("div");atlas.className="atlas atlas-satellite";layout.append(atlas);
 const image=document.createElement("img");image.src="assets/atlas-live/"+(region===0?"asagi-satellite-refined.jpg":"satellite-"+atlasAssetNames[region]+"-refined.jpg");
 image.onerror=()=>{image.onerror=null;image.src="assets/atlas-live/tile-"+atlasAssetNames[region]+".png";};
 image.alt=rgn.name+"의 실제 지형과 도로를 내려다본 지도";image.width=map.width;image.height=map.height;atlas.append(image);atlasMapFurniture(atlas,map.width);mountAtlasPing(atlas,region);
 const guides=document.createElementNS("http://www.w3.org/2000/svg","svg");guides.setAttribute("viewBox",`0 0 ${map.width} ${map.height}`);guides.classList.add("atlas-pin-guides");guides.setAttribute("aria-hidden","true");atlas.append(guides);
 const tip=atlasMarkerTooltip(atlas),detail=document.createElement("section");detail.className="atlasDetail atlas-selection";layout.append(detail);
 const directory=document.createElement("section");directory.className="atlas-directory";layout.append(directory);atlasHeading(directory,"h3","장소 목록");
 const list=document.createElement("div");list.className="atlas-place-list";directory.append(list);
 const quests=activeMapQuests().filter(q=>q.region===region),controls=[];
 const spotsHere=region===s.region?actStops():[];
 const normalize=label=>displayText(label).replace(/\s+/g," ").trim();
 const known=point=>spotsHere.find(spot=>normalize(spot.name)===normalize(point.label));
 let resetWildlife=()=>{};
 function inspect(point){
  resetWildlife();
  for(const [entry,pin,row] of controls)for(const control of [pin,row])control.setAttribute("aria-pressed",String(entry===point));
  detail.replaceChildren();const spot=known(point);
  atlasHeading(detail,"h3",point.label,spot?.desc??atlasPlaceUses[atlasIconFor(point)]??atlasIcons[atlasIconFor(point)][0]);
  if(spot){
   questMapActions(detail,quests.filter(q=>q.spot===spot.id));
   button(detail,"이 길목까지 걷기",()=>{$("dialog").close();go(spot.id);},true);
  }
 }
 const used=[];
 for(const [i,point] of map.pins.entries()){
  const key=keys[i],pin=button(atlas,"",()=>inspect(point));pin.className="atlasPin atlas-icon-pin";pin.append(atlasIcon(key));
  const x=cap(point.x-map.bounds.west,13,map.width-13),y=cap(point.z-map.bounds.north,13,map.height-13);
  const options=[[x,y]];for(const radius of [23,40,56,73,90])for(let n=0;n<12;n++)options.push([x+Math.cos(n*Math.PI/6)*radius,y+Math.sin(n*Math.PI/6)*radius]);
  const [px,py]=options.find(([a,b])=>a>11&&a<map.width-11&&b>11&&b<map.height-11&&used.every(([c,d])=>Math.hypot(a-c,b-d)>21))??[x,y];
  used.push([px,py]);pin.style.left=px/map.width*100+"%";pin.style.top=py/map.height*100+"%";
  const trueX=point.x-map.bounds.west,trueY=point.z-map.bounds.north;
  if(Math.hypot(px-trueX,py-trueY)>3){
   const line=document.createElementNS(guides.namespaceURI,"line");
   for(const [name,value] of Object.entries({x1:trueX,y1:trueY,x2:px,y2:py}))line.setAttribute(name,value);
   guides.append(line);
  }
  connectAtlasTooltip(pin,tip,point.label,known(point)?.desc??atlasPlaceUses[key]??atlasIcons[key][0]);
  const row=button(list,"",()=>{inspect(point);pin.focus({preventScroll:true});});row.append(atlasIcon(key),point.label);
  controls.push([point,pin,row]);
 }
 resetWildlife=mountRegionWildlife(body,atlas,detail,region,map,()=>{
  for(const [,pin,row] of controls)for(const control of [pin,row])control.setAttribute("aria-pressed","false");
 });
 if(map.pins.length)inspect(map.pins.find(p=>known(p)?.id===(actionSpot||selected))??map.pins[0]);
 button(body,"세계 지도 펼치기",railMap);estateMapList(body,[region]);
 $("dialog").scrollTop=0;
}
