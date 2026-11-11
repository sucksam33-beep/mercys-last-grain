const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game"),origin="https://game.outfit-qa.local";
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"};
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 try{
 const page=await browser.newPage({viewport:{width:900,height:600}}),errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.route(origin+"/**",route=>{
  const file=path.join(root,decodeURIComponent(new URL(route.request().url()).pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
  if(file.endsWith(".glb"))return route.abort();
  return route.fulfill({path:file,contentType:types[path.extname(file)]??"application/octet-stream"});
 });
 await page.addInitScript(()=>{
  const raf=window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame=callback=>callback.name==="loop"?0:raf(callback);
 });
 await page.goto(origin+"/index.html");
 await page.waitForFunction(()=>typeof craftEquip==="function"&&typeof craftVisual==="function");
 const report=await page.evaluate(()=>{
  const checked=[];
  for(const [id,item] of Object.entries(priorityItemModels)){
   if(!/\/(14[4-9]|15[01])\.glb$/.test(item.model))continue;
   const {slot}=craftRecipes[id];give(id,1);
   if(!craftEquip(id)||craftEquipment(slot)?.id!==id||craftVisual()[slot][4]!==item.model)throw Error(id);
   checked.push({id,slot,model:item.model});
  }
  for(const id of ["아사기 논둑 작업복","암바로 썰물 모자"])if(craftEquipment(craftRecipes[id].slot)?.id!==id&&!craftEquip(id))throw Error(id);
  const save=readSave(autoSaveKey);
  if(!save?.state)throw Error("No autosave");
  s=migrateWeaponInstances(migrateTimber(save.state));
  const combo=craftVisual();
  if(!combo.head||!combo.feet||!combo.torso)throw Error("Outfit combo after reload");
  const old=combo.head[0];
  if(!craftEquip(old)||craftVisual().head)throw Error("Unequip");
  return {items:checked,reloaded:Object.fromEntries(["head","torso","feet"].map(slot=>[slot,combo[slot][0]])),unequip:true};
 });
 assert.equal(report.items.length,8);
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(__dirname,"tailored-review","headless-outfits.json"),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
