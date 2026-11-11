const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game"),out=path.join(__dirname,"trellis-86-review"),phase=process.argv[2];
const rows=JSON.parse(fs.readFileSync(path.join(out,"results.json"),"utf8"));
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".glb":"model/gltf-binary"};
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),failures=[],origin="https://game.returningwaters.local";
  page.on("pageerror",error=>failures.push(error.message));
  await page.route(origin+"/**",route=>{
   const file=path.join(root,decodeURIComponent(new URL(route.request().url()).pathname));
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
   return route.fulfill({path:file,contentType:types[path.extname(file)]??"application/octet-stream"});
  });
  await page.addInitScript(()=>{
   const raf=window.requestAnimationFrame.bind(window);
   window.requestAnimationFrame=callback=>callback.name==="loop"?0:raf(callback);
   localStorage.setItem("returning-waters-render-quality","0");
  });
  await page.goto(origin+"/index.html");
  await page.waitForFunction(()=>typeof craftVisual==="function"&&!!graphics);
  await page.evaluate(()=>{
   if(opening.open)finishOpening();
   s.introPending=false;s.stage=6;s.region=0;loadedScene="";ensureWorld();
   const toast=$("toast");if(toast)toast.textContent="";
  });
  const result=await page.evaluate(({rows,phase})=>{
   const assert=(condition,message)=>{if(!condition)throw Error(message);};
   const after=phase==="after";
   const live=after?rows.filter(row=>row.model):rows;
   for(const row of live){
    assert(craftItems[row.id],"Missing item "+row.id);
    if(after){
     assert(priorityItemModel(row.id)?.model===row.model,"Missing model "+row.id);
     assert(craftCardArt(craftItems[row.id]).getAttribute("src")===row.icon,"Icon "+row.id);
    }
   }
   if(!after)return {covered:live.length};
   const instances=[], placements=[];
   const bench=craftStationPositions[0][0];
   function targetFor(id){
    for(let radius=4;radius<34;radius+=2)for(let i=0;i<16;i++){
     const angle=i*Math.PI/8;
     player={x:bench[0]+Math.cos(angle)*radius,y:bench[1]+Math.sin(angle)*radius};
     heading=angle;
     const target=placementTarget(id);
     if(target)return target;
    }
    throw Error("No accessible placement for "+id);
   }
   function reloadSave(){
    const save=readSave(autoSaveKey);
    assert(save?.state,"Autosave not found");
    s=migrateWeaponInstances(migrateTimber(save.state));
   }
   for(const row of live.filter(row=>craftRecipes[row.id]?.slot==="weapon")){
    assert(inventoryWeaponModel(row.id)===row.model,"Weapon placement "+row.id);
    give(row.id,1);
    const instance=weaponInstances(row.id)[0];
    assert(instance&&craftEquip(row.id,instance.key),"Weapon equip "+row.id);
    assert(craftVisual()?.weapon?.[4]===row.model,"Equipped asset "+row.id);
    instance.wear=73;
    const target=targetFor(row.id);
    assert(placeInventoryItem(row.id,1,instance.key,target),"Place "+row.id);
    const drop=Object.keys(s.crafting.drops).find(key=>s.crafting.drops[key].instance?.key===instance.key);
    assert(placedWeaponModels().some(p=>p.key===drop&&p.url===row.model),"Placed GLB "+row.id);
    reloadSave();
    assert(s.crafting.drops[drop].instance.wear===73,"Saved weapon wear "+row.id);
    assert(recoverInventoryDrop(drop)&&weaponInstances(row.id).some(x=>x.key===instance.key&&x.wear===73),"Recovered weapon "+row.id);
    instances.push(row.id);
    placements.push(row.id);
   }
   for(const row of live.filter(row=>row.category===0)){
    const starting=count(row.id);
    give(row.id,3);
    assert(placeInventoryItem(row.id,3,null,targetFor(row.id)),"Place timber "+row.id);
    const drop=Object.keys(s.crafting.drops).find(key=>s.crafting.drops[key].item===row.id);
    reloadSave();
    assert(s.crafting.drops[drop].quantity===3&&count(row.id)===starting,"Saved timber "+row.id);
    assert(recoverInventoryDrop(drop)&&count(row.id)===starting+3,"Recover timber "+row.id);
    placements.push(row.id);
   }
   const visible=[];
   const original=riggedScene,previousVertices=verts;verts=[];
   riggedScene={addMaterialDisplay:pose=>visible.push(pose),materialDisplayReady:()=>true};
   try{
    for(const row of live.filter(x=>x.category===0))paintPlacedTimber({item:row.id,x:244,z:235,quantity:1},3);
    s.timberStructures={0:{bench:{x:250,z:231}}};
    paintTimberStructures();
   }finally{riggedScene=original;verts=previousVertices;}
   for(const row of live.filter(x=>x.category===0||x.id==="기본 작업대"))
    assert(visible.some(o=>o.url===row.model),"World placement "+row.id);
   assert(weaponCatalogue.filter(row=>craftRecipes[row.id]?.model).length===54,"Existing weapon meshes");
   assert(Object.keys(ingredientModelKeys).length===80,"Existing ingredient meshes");
   const old=fresh(),legacy=Object.keys(legacyWeaponRecipes)[0];
   old.bag={삼나무:5,[legacy]:1,"방수 널판":4};
   old.crafting={discovered:{},made:{},wear:{[legacy]:39},gear:{weapon:legacy},drops:{}};
   migrateWeaponInstances(migrateTimber(old));
   const migrated=JSON.stringify(old);
   assert(old.bag.timber_log===5&&old.bag["방수 널판"]===4&&old.crafting.instances[legacy][0].wear===39,"Legacy save data");
   assert(migrated===JSON.stringify(migrateWeaponInstances(migrateTimber(old))),"Legacy migration idempotence");
   s.bag=Object.fromEntries(live.map(row=>[row.id,2]));
   satchel();
   const art=[...document.querySelectorAll("#dialogBody .inventory-grid img")].map(img=>img.getAttribute("src"));
   assert(live.every(row=>art.includes(row.icon)),"Bag coverage");
   return {covered:live.length,instances,placements,legacySave:true,worldModels:visible.map(o=>o.url),bagIcons:art.length};
  },{rows,phase});
  await page.evaluate(()=>{
   const toast=$("toast");if(toast)toast.textContent="";
   s.bag={"손도끼":1,"낚싯대":1,"곡괭이":1,"채집가위":1,"사냥 활":1,"여행자의 검":1,"나무 방패":1,"여행솥":1,timber_log:5,timber_quality:3,timber_premium:2,"기본 작업대":1,"주먹밥":2,"피라미":3,"미꾸라지":2,"붕어":2,"산천어":1,"잉어":1,"파이크":1,"아사기 논둑 작업복":1};
   satchel();
  });
  await page.locator("#dialogBody .inventory-grid img").evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode().catch(()=>{}))));
  await page.screenshot({path:path.join(out,phase+"-bag.png")});
  await page.evaluate(()=>{
   Object.assign(craftCodex,{tab:5,region:"0",query:""});
   craftShowCodex();
  });
  await page.locator("#dialogBody .inventory-grid img").evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode().catch(()=>{}))));
  await page.screenshot({path:path.join(out,phase+"-codex.png")});
  await page.evaluate(()=>craftOpenEntry("피라미"));
  if(phase==="after"){
   await page.getByRole("button",{name:"3D 모델 보기",exact:true}).click();
   await page.locator("#dialogBody canvas").waitFor();
   await page.waitForTimeout(350);
  }
  await page.screenshot({path:path.join(out,phase+"-fish-detail.png")});
  assert.deepEqual(failures,[]);
  fs.writeFileSync(path.join(out,"headless-"+phase+".json"),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
