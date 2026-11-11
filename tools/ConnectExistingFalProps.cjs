const fs=require("node:fs"),assert=require("node:assert/strict");
const edits=new Map();
function patch(file,a,b){
 const p="game/"+file,s=edits.get(p)??fs.readFileSync(p,"utf8");
 if(s.includes("\r\n")){a=a.replace(/\r?\n/g,"\r\n");b=b.replace(/\r?\n/g,"\r\n");}
 assert.ok(s.includes(a),file+" "+a.slice(0,55));edits.set(p,s.replace(a,b));
}
patch("MaterialDisplays.js",`const materialIds=[...new Set(Object.values(CraftingData.recipes).flatMap(recipe=>recipe.needs.map(([id])=>id)))];`,`const reusedMaterialModels=Object.freeze({
 "장작":"assets/living-props/firewood.glb",
 "굵은 밧줄":"assets/living-props/rope-coil.glb",
 "화물 상자":"assets/asagi-props/closed-wood-crate.glb",
 "울타리":"assets/asagi-props/wood-fence-panel.glb"
});
const materialIds=[...new Set([...Object.values(CraftingData.recipes).flatMap(recipe=>recipe.needs.map(([id])=>id)),...Object.keys(reusedMaterialModels)])];`);
patch("MaterialDisplays.js",` const key=ingredient??CraftingData.artKey(id);
 riggedScene.addMaterialDisplay({key,x,y,z,width,height,yaw,replaceFallback});`,` const url=reusedMaterialModels[id];
 const key=ingredient??CraftingData.artKey(id);
 riggedScene.addMaterialDisplay({key,url,x,y,z,width,height,yaw,replaceFallback});`);
patch("material-displays.mjs"," function load(key){"," function load(key,url){");
patch("material-displays.mjs",'  loader.loadAsync("assets/crafting-models/"+key+".glb")','  loader.loadAsync(url??"assets/crafting-models/"+key+".glb")');
patch("material-displays.mjs","pending<4)load(item.key);","pending<4)load(item.key,item.url);");
patch("Timber.js",`  for(const dx of [-1.2,0,1.2])box(x+dx,y,z,.14,1.11,.15,oak,0,surface.wall);
  for(const h of [.38,.79])box(x,y+h,z,2.6,.11,.10,oak,0,surface.wall);`,`  for(const dx of [-1.2,0,1.2])box(x+dx,y,z,.14,1.11,.15,oak,0,surface.wall);
  const left=showMaterialModel("울타리",x-.60,y+.30,z,1.11,.58,0,true);
  const right=showMaterialModel("울타리",x+.60,y+.30,z,1.11,.58,0,true);
  if(!left||!right)for(const h of [.38,.79])box(x,y+h,z,2.6,.11,.10,oak,0,surface.wall);`);
for(const [p,s] of edits)fs.writeFileSync(p,s);
