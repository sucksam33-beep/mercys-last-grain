const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const game=path.join(__dirname,"game"),out=path.join(__dirname,"trellis-86-review");
const read=file=>fs.readFileSync(path.join(game,file),"utf8");
const edits=new Map();
function swap(file,before,after){
 const current=edits.get(file)??read(file);
 assert.equal(current.split(before).length,2,file+" "+before);
 edits.set(file,current.replace(before,after));
}
const rows=JSON.parse(fs.readFileSync(path.join(out,"results.json"),"utf8")).filter(x=>x.model&&x.preview);
assert.ok(rows.length&&rows.length<=86);
for(const row of rows){
 assert.ok(fs.existsSync(path.join(game,row.model)));
 assert.ok(fs.existsSync(path.join(game,row.icon)));
}
const registry=Object.fromEntries(rows.map(row=>[row.id,{model:row.model,icon:row.icon}]));
edits.set("PriorityItemModels.js",`"use strict";\nconst priorityItemModels=Object.freeze(${JSON.stringify(registry,null,1)});\nfunction priorityItemModel(id){return Object.hasOwn(priorityItemModels,id)?priorityItemModels[id]:undefined;}\n`);
swap("index.html",'<script src="MaterialDisplays.js"></script>','<script src="PriorityItemModels.js"></script>\n<script src="MaterialDisplays.js"></script>');
swap("MaterialDisplays.js",' if((!materialSet.has(id)&&!ingredient)||!riggedScene)return false;\n const url=reusedMaterialModels[id];',' const url=priorityItemModel(id)?.model??reusedMaterialModels[id];\n if((!url&&!materialSet.has(id)&&!ingredient)||!riggedScene)return false;');
swap("RegionalShops.js","const model=ingredientModelKeys[id];","const model=ingredientModelKeys[id]||priorityItemModel(id);");
swap("RegionalShops.js",'   taper(x,y,z,key==="집 화덕"?.65:.22,.43,.39,iron,9);\n   taper(x,y+(key==="집 화덕"?.65:.20),z,.21,.22,.19,color("#544d42"),10);','   if(key!=="여행솥"||!showMaterialModel(key,x,y,z,.55,.55,0,true)){\n    taper(x,y,z,key==="집 화덕"?.65:.22,.43,.39,iron,9);\n    taper(x,y+(key==="집 화덕"?.65:.20),z,.21,.22,.19,color("#544d42"),10);\n   }');
swap("CraftingMenu.js"," if(entry.icon)img.src=entry.icon;"," const icon=priorityItemModel(entry.id)?.icon??entry.icon;\n if(icon)img.src=icon;");
swap("CraftingMenu.js","function craftStatus(entry){",`function addPriorityModelPreview(body,id){
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
function craftStatus(entry){`);
swap("CraftingMenu.js"," scroll.append(craftCardArt(entry,true));"," scroll.append(craftCardArt(entry,true));\n addPriorityModelPreview(scroll,id);");
swap("CraftingMenu.js"," if(!s.crafting&&!pose?.motion&&!shield)return null;"," if(!s.crafting&&!pose?.motion&&!pose?.weapon&&!shield)return null;");
swap("CraftingMenu.js","recipe.stats.shape??\"\",recipe.model]","recipe.stats.shape??\"\",recipe.model??priorityItemModel(recipe.id)?.model]");
swap("CraftingMenu.js","gear.weapon=[pose.name,recipe?.region??s.region,2,pose.motion];","gear.weapon=[pose.name,recipe?.region??s.region,2,pose.motion,priorityItemModel(pose.name)?.model];");
swap("CraftingMenu.js",' if(shield&&!gear.offhand)gear.offhand=[shield,s.region,4,"shield"];',` if(!pose?.motion&&pose?.weapon&&priorityItemModel(pose.weapon))gear.weapon=[pose.weapon,s.region,2,"sword",priorityItemModel(pose.weapon).model];
 if(shield&&!gear.offhand)gear.offhand=[shield,s.region,4,"shield",priorityItemModel(shield)?.model];`);
swap("CraftingMenu.js","craftRecipes[id]?.model)inventoryPlacementMenu(id);","inventoryWeaponModel(id))inventoryPlacementMenu(id);");
swap("CraftingMenu.js","  if(entry?.icon)slot.append(craftCardArt(entry));","  if(entry&&(entry.icon||priorityItemModel(id)))slot.append(craftCardArt(entry));");
swap("RegionalFood.js"," list.append(craftCardArt(craftItems[dish.id],true));"," list.append(craftCardArt(craftItems[dish.id],true));\n addPriorityModelPreview(list,dish.id);");
swap("InventoryWorld.js","function placementTarget(item){",`function inventoryWeaponModel(id){
 const recipe=craftRecipes[id];
 return recipe?.slot==="weapon"?(recipe.model??priorityItemModel(id)?.model):undefined;
}
function placementTarget(item){`);
swap("InventoryWorld.js","if(craftRecipes[item]?.model){","if(inventoryWeaponModel(item)){");
swap("InventoryWorld.js","!craftRecipes[item]?.model||!instance","!inventoryWeaponModel(item)||!instance");
swap("InventoryWorld.js"," body.append(craftCardArt(entry,true));"," body.append(craftCardArt(entry,true));\n addPriorityModelPreview(body,id);");
swap("InventoryWorld.js","model:entry.model,shape:","model:inventoryWeaponModel(id),shape:");
swap("InventoryWorld.js"," const dx=Math.sin(yaw),dz=Math.cos(yaw);"," if(priorityItemModel(item)&&showMaterialModel(item,x,y,z,length,radius*3,yaw,true))return;\n const dx=Math.sin(yaw),dz=Math.cos(yaw);");
swap("InventoryWorld.js","  if(!recipe?.model){","  const model=inventoryWeaponModel(drop.item);\n  if(!model){");
swap("InventoryWorld.js","url:recipe.model,shape:","url:model,shape:");
swap("Crafting.js","else if(!craftRecipes[item]?.model)tube(","else if(!inventoryWeaponModel(item))tube(");
swap("Timber.js","  section.append(craftCardArt(craftItems[grade.id]));","  section.append(craftCardArt(craftItems[grade.id]));\n  addPriorityModelPreview(section,grade.id);");
swap("Timber.js","  for(const side of [-1,1])box(x+side*.4,y,z,.13,.79,.47,oak,0,surface.wall);\n  box(x,y+.78,z,1.17,.15,.72,oak,0,surface.wall);","  if(!showMaterialModel(\"기본 작업대\",x,y,z,1.17,.93,0,true)){\n   for(const side of [-1,1])box(x+side*.4,y,z,.13,.79,.47,oak,0,surface.wall);\n   box(x,y+.78,z,1.17,.15,.72,oak,0,surface.wall);\n  }");
swap("Timber.js",'  box(x,y,z,1.45,.30,.8,oak,0,surface.wall);\n  box(x,y+.28,z,.93,.13,.51,color("#8b8d80"),0,surface.masonry);',`  const modelItem=project.id==="sluice"?"정밀 수문틀":project.id==="ship"?"대형 선박 용골":null;
  if(!modelItem||!showMaterialModel(modelItem,x,y,z,1.45,.60,0,true)){
   box(x,y,z,1.45,.30,.8,oak,0,surface.wall);
   box(x,y+.28,z,.93,.13,.51,color("#8b8d80"),0,surface.masonry);
  }`);
swap("craft-gear.mjs",'import { loadFalWeapon } from "./fal-weapon.mjs";','import { loadFalWeapon } from "./fal-weapon.mjs";\nimport { GLTFLoader } from "./vendor/three/GLTFLoader.js";');
swap("craft-gear.mjs",'const support={','const shieldLoader=new GLTFLoader(),shieldCache=new Map();\nconst support={');
swap("craft-gear.mjs",'knife:.33,axe:.70','knife:.33,sword:.83,axe:.70');
swap("craft-gear.mjs",'   piece(group,box(.045,.16,.048,wood),.18,-.055,.012);',`   piece(group,box(.045,.16,.048,wood),.18,-.055,.012);
   if(model){
    if(!shieldCache.has(model))shieldCache.set(model,shieldLoader.loadAsync(model).then(result=>result.scene).catch(error=>{shieldCache.delete(model);throw error;}));
    shieldCache.get(model).then(scene=>{
     if(groups.offhand!==group)return;
     const asset=scene.clone(true),bounds=new THREE.Box3().setFromObject(asset,true);
     const size=bounds.getSize(new THREE.Vector3()),scale=.74/Math.max(size.x,size.y,size.z);
     if(!Number.isFinite(scale))return;
     asset.scale.multiplyScalar(scale);
     asset.position.multiplyScalar(scale).sub(bounds.getCenter(new THREE.Vector3()).multiplyScalar(scale));
     asset.position.z=.10;
     asset.traverse(node=>{if(node.isMesh)node.userData.falWeapon=true;});
     for(const part of group.children)part.visible=false;
     group.add(asset);
    }).catch(error=>console.warn("방패 모델을 불러오지 못했습니다.",id,error));
   }`);
if(process.argv.includes("--check")){console.log("Validated "+edits.size+" game files");process.exit(0);}
const backup=path.join(out,"game-before");fs.mkdirSync(backup,{recursive:true});
for(const [file,body] of edits){
 if(fs.existsSync(path.join(game,file))&&!fs.existsSync(path.join(backup,file)))fs.copyFileSync(path.join(game,file),path.join(backup,file));
 fs.writeFileSync(path.join(game,file),body,"utf8");
}
console.log(JSON.stringify({items:rows.length,changed:[...edits.keys()]}));
