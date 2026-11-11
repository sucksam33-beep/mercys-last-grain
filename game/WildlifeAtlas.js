"use strict";
const wildlifeHabitatLabels={
 brush:"덤불과 숲 가장자리",woodedBank:"나무가 우거진 물가",forestEdge:"숲과 풀밭의 경계",deepForest:"깊은 숲",
 grassland:"트인 초지",remoteForest:"외곽의 깊은 숲",scrub:"건조한 관목 지대",dryRange:"건조한 구릉",
 cliffs:"바위 사면",dryPlain:"마른 평원",streambank:"개울과 연못 가장자리",alpineMeadow:"고산 초지",
 wetland:"얕은 습지",floodMeadow:"물가의 저지대 초지",savanna:"트인 사바나",savannaBrush:"사바나 관목 지대",
 coast:"만의 얕은 물가",tundra:"툰드라 능선",coldSteppe:"추운 초원"
};
function wildlifeDestination(region,index){
 const entry=wildlifeAtlasData[region][index];
 return {kind:"wildlife",region,index,point:entry.path.at(-1),name:regions[region].animals[index]+" 서식지"};
}
function wildlifeAtlasLayer(atlas,bounds,entries,select){
 const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
 svg.setAttribute("viewBox",`${bounds.west} ${bounds.north} ${bounds.width} ${bounds.height}`);
 svg.setAttribute("preserveAspectRatio","none");svg.setAttribute("aria-hidden","true");
 svg.classList.add("wildlife-atlas-layer");atlas.append(svg);
 const zones=entries.map(({region,index,offsetX=0,offsetZ=0})=>{
  const [left,top,right,bottom]=wildlifeAtlasData[region][index].bounds;
  const zone=document.createElementNS(ns,"ellipse");
  for(const [name,value] of Object.entries({cx:(left+right)/2+offsetX,cy:(top+bottom)/2+offsetZ,
   rx:(right-left)*.74,ry:(bottom-top)*.74}))zone.setAttribute(name,value);
  const title=document.createElementNS(ns,"title");title.textContent=regions[region].animals[index];zone.append(title);
  zone.addEventListener("click",()=>select(region,index));
  svg.append(zone);
  zone.dataset.species=index;
  return {zone,region,index,offsetX,offsetZ};
 });
 const point=document.createElementNS(ns,"circle");
 point.classList.add("wildlife-observation-point");point.setAttribute("r","4");svg.append(point);
 return (region,index=-1)=>{
  let selected=null;
  for(const entry of zones){
   const visible=entry.region===region,active=visible&&entry.index===index;
   entry.zone.toggleAttribute("hidden",!visible);
   entry.zone.classList.toggle("selected",active);
   if(active)selected=entry;
  }
  point.toggleAttribute("hidden",!selected);
  if(selected){
   const [x,z]=wildlifeDestination(region,index).point;
   point.setAttribute("cx",x+selected.offsetX);point.setAttribute("cy",z+selected.offsetZ);
  }
 };
}
function mountRegionWildlife(body,atlas,detail,region,map,resetSelection){
 const panel=document.createElement("section");panel.className="atlas-directory wildlife-directory";
 body.append(panel);
 atlasHeading(panel,"h3","야생동물 서식 범위","초록 영역은 무리가 머무는 범위입니다. 종을 고르면 가까운 관찰 지점까지 길을 안내합니다.");
 const list=document.createElement("div");list.className="atlas-place-list";panel.append(list);
 const rows=wildlifeAtlasData[region];
 const update=wildlifeAtlasLayer(atlas,{...map.bounds,width:map.width,height:map.height},
  rows.map((_,index)=>({region,index})),(_,index)=>inspect(index));
 const buttons=rows.map((_,index)=>{
  const control=button(list,"",()=>{
   inspect(index);
   detail.scrollIntoView({block:"nearest"});
  });
  control.append(atlasIcon("wildlife"),regions[region].animals[index]);
  control.setAttribute("aria-pressed","false");
  return control;
 });
 function inspect(index){
  resetSelection();
  update(region,index);
  buttons.forEach((control,i)=>control.setAttribute("aria-pressed",String(i===index)));
  detail.replaceChildren();
  const destination=wildlifeDestination(region,index);
  const notes=region===3&&index===1?"비버 둑과 갉은 나무가 있는 연못입니다. 해 뜰 무렵과 해 질 무렵에 비버를 보기 좋습니다.":
   region===7&&index===1?"오전 10시부터 오후 5시 전까지는 바위에서 쉬거나 얕은 만으로 들어가는 물범을 보기 좋습니다.":"계절과 시간에 따라 보이는 개체가 달라질 수 있습니다.";
  atlasHeading(detail,"h3",destination.name,wildlifeHabitatLabels[rows[index].habitat]+" · "+notes);
  const [, ,shelter,food]=wildlifeSiteProfiles[region][index];
  atlasHeading(detail,"p","은신처 · "+shelter);
  atlasHeading(detail,"p","먹이터 · "+food);
  const status=document.createElement("p");status.setAttribute("role","status");
  button(detail,"관찰 지점까지 길 안내",()=>{
   if(startTrailNavigation(destination)){$("dialog").close();drawRadar();}
   else status.textContent="연결되는 길을 찾지 못했습니다. 가까운 길로 이동해 다시 선택하세요.";
  },true);
  detail.append(status);
 }
 update(region);
 return ()=>{
  update(region);
  for(const control of buttons)control.setAttribute("aria-pressed","false");
 };
}
