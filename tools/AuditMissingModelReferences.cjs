const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert/strict");
const root=__dirname,game=path.join(root,"game"),out=path.join(root,"model-reference-audit"),refs=process.argv[2];
fs.mkdirSync(out,{recursive:true});
const c=vm.createContext({});
for(const f of ["Timber.js","WeaponCatalogue.js","CraftingData.js","InventoryData.js","RegionalFoodData.js"])vm.runInContext(fs.readFileSync(path.join(game,f),"utf8"),c,{filename:f});
const items=vm.runInContext(`[...new Map([...inventoryEntries,...Object.values(CraftingData.items).map(x=>({...x,icon:inventoryEntries.find(row=>row.id===x.id)?.icon??x.icon})),...regionalDishes.map(x=>({...x,category:7})),...regionalIngredients.map(x=>({...x,category:6}))].map(x=>[x.id,x])).values()]`,c);
const manifests=["mercys-last-grain-ingredients-80","returning-waters-weapon-models-54"];
const modelPaths=new Map();
for(const group of manifests){
 const rows=JSON.parse(fs.readFileSync(path.join(refs,group,"results.json"),"utf8"));
 for(const row of rows){
  const model=path.join(refs,group,"models",row.id+".glb");
  if(!fs.existsSync(model))continue;
  modelPaths.set(group.includes("weapon")?row.id:row.name,{model,group});
 }
}
const extra=new Map([["timber_common","assets/living-props/firewood.glb"]]);
const checked=items.map(({id,name,icon,category,region})=>{
 const matched=modelPaths.get(id);
 const asset=extra.get(id)??"assets/crafting-models/"+vm.runInContext("CraftingData.artKey("+JSON.stringify(id)+")",c)+".glb";
 const packaged=fs.existsSync(path.join(game,asset));
 let status=matched?"fal_model_confirmed":packaged?"packaged_model_provenance_unverified":"no_model_match_in_audited_sources";
 if(id==="timber_common")status="fal_model_confirmed";
 if(id==="매우 큰 고기")status="registered_unverified_acquisition";
 assert.ok(icon&&fs.existsSync(path.join(game,icon)),id);
 return {id,name,icon,category,region,status,...(matched?{model:matched.model}:packaged?{model:asset}:{})};
});
fs.writeFileSync(path.join(out,"item-model-audit.json"),JSON.stringify(checked,null,2));
console.log(checked.reduce((acc,x)=>(acc[x.status]=(acc[x.status]??0)+1,acc),{}));
console.log("Unmatched known ingredient labels",Array.from(modelPaths.entries()).filter(([id,x])=>x.group.includes("ingredients")&&!checked.some(item=>item.id===id)).map(([id])=>id).join(", "));
