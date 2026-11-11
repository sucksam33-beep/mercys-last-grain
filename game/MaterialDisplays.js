"use strict";
const reusedMaterialModels=Object.freeze({
 "장작":"assets/living-props/firewood.glb",
 "굵은 밧줄":"assets/living-props/rope-coil.glb",
 "화물 상자":"assets/asagi-props/closed-wood-crate.glb",
 "울타리":"assets/asagi-props/wood-fence-panel.glb"
});
const materialIds=[...new Set([...Object.values(CraftingData.recipes).flatMap(recipe=>recipe.needs.map(([id])=>id)),...Object.keys(reusedMaterialModels)])];
const materialSet=new Set(materialIds);
const materialByRegion=CraftingData.regions.map((_,region)=>materialIds.filter(id=>CraftingData.items[id].region===region));
const materialRackLocations=[[254.7,210.3],[117.4,142.8],[105,112.9],[105,112.9],[105,112.9],[105,112.9],[105,112.9],[105,112.9]];
const materialNodeKinds=new Set(["ore","feather","shell","rope"]);
function showMaterialModel(id,x,y,z,width,height,yaw=0,replaceFallback=false){
 const ingredient=typeof ingredientModelKeys!=="undefined"?ingredientModelKeys[id]:null;
 const url=priorityItemModel(id)?.model??reusedMaterialModels[id];
 if((!url&&!materialSet.has(id)&&!ingredient)||!riggedScene)return false;
 const key=ingredient??CraftingData.artKey(id);
 riggedScene.addMaterialDisplay({key,url,x,y,z,width,height,yaw,replaceFallback});
 return riggedScene.materialDisplayReady(key);
}
function buildMaterialRack(){
 const ids=materialByRegion[s.region];
 if(!ids?.length)return;
 const [x,z]=materialRackLocations[s.region];
 const wood=color(s.region===1?"#675749":"#77634c");
 const n=Math.ceil(ids.length/2),span=n*.47+.16;
 const a=terrainSurface(x-span*.5,z),b=terrainSurface(x+span*.5,z);
 const top=Math.max(a,b,terrainSurface(x,z))+.70;
 const low=top-.055;
 box(x,low,z,span,.055,.93,wood,0,8);
 for(const dx of [-span*.43,span*.43])for(const dz of [-.32,.32]){
  const y=terrainSurface(x+dx,z+dz)-.035;
  box(x+dx,y,z+dz,.095,low-y,.095,wood,0,8);
 }
 ids.forEach((id,i)=>{
  const item=CraftingData.items[id];
  const dx=(i%n-(n-1)/2)*.47,dz=i<n?-.225:.225;
  const flat=item.form==="가죽"||item.name.startsWith("무두질 ");
  showMaterialModel(id,x+dx,top+.003,z+dz,flat?.37:.38,flat?.24:.33,(i%4-1.5)*.23);
 });
}
