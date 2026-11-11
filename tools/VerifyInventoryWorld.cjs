const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game");
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".glb":"model/gltf-binary"};
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:800}});
  const failures=[];
  page.on("pageerror",error=>failures.push(error.message));
  const origin="https://game.returningwaters.local";
  await page.route(origin+"/**",route=>{
   const url=new URL(route.request().url());
   const file=path.join(root,decodeURIComponent(url.pathname));
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
  const report=await page.evaluate(async()=>{
   const assert=(condition,message)=>{if(!condition)throw Error(message);};
   if(opening.open)finishOpening();
   s.introPending=false;
   s.stage=6;s.region=0;loadedScene="";ensureWorld();
   const bench=craftStationPositions[0][0];
   const recipes=Object.values(craftRecipes);
   for(const row of recipes)for(const [id,n] of row.needs)assert(craftItems[id]&&Number.isInteger(n)&&n>0,"Ingredient "+row.id+" "+id);
   const registry=Object.values(craftItems);
   assert(registry.length===371&&registry.every(x=>x.icon),"Registry coverage");
   assert(new Set(registry.map(x=>x.icon)).size===371,"Registry icon paths");
   const manifest=await (await fetch("assets/item-icons/manifest.json")).json();
   assert(manifest.length===371&&manifest.every(x=>craftItems[x.id]?.icon===x.icon),"Manifest alignment");
   const {loadFalWeapon}=await import("./fal-weapon.mjs");
   for(const {id} of weaponCatalogue){
    const row=craftRecipes[id];
    const mesh=await loadFalWeapon(row.model,id,toolMotionByName[row.name],1);
    assert(mesh.children.length&&Number.isFinite(mesh.scale.y),"Model "+id);
   }
   const findTarget=(id)=>{
    for(let r=4;r<34;r+=2)for(let i=0;i<16;i++){
     player={x:bench[0]+Math.cos(i*Math.PI/8)*r,y:bench[1]+Math.sin(i*Math.PI/8)*r};
     heading=i*Math.PI/8;
     const target=placementTarget(id);
     if(target)return target;
    }
    throw Error("No accessible test placement");
   };
   function reloaded(){
    const save=readSave(autoSaveKey);
    s=migrateWeaponInstances(migrateTimber(save.state));
   }
   const families=[];
   for(const family of new Set(weaponCatalogue.map(x=>x.family))){
    const {id}=weaponCatalogue.find(x=>x.family===family);
    const recipe=craftRecipes[id];
    player={x:bench[0],y:bench[1]};
    for(let k=0;k<2;k++){
     for(const [part,n] of recipe.needs)if(timberFree(part)<n)give(part,n-timberFree(part));
     assert(craftMake(id,"bench"),"Craft "+id);
    }
    const [other,selected]=weaponInstances(id);
    assert(other.key!==selected.key&&craftEquip(id,selected.key),"Equip instance "+id);
    give("연습용 나무 화살",2);s.energy=100;simulationTime+=5000;toolMotion=null;
    assert(craftStrike(null,{aimed:true}),"Use "+id);
    assert(selected.wear===99&&other.wear===100,"Independent wear "+id);
    const target=findTarget(id);
    assert(placeInventoryItem(id,1,selected.key,target),"Place "+id);
    const key=Object.keys(s.crafting.drops).find(key=>s.crafting.drops[key].instance?.key===selected.key);
    assert(key&&!weaponInstances(id).some(x=>x.key===selected.key),"Transfer "+id);
    reloaded();
    assert(s.crafting.drops[key].instance.wear===99,"Saved placed wear "+id);
    s.region=1;assert(!recoverInventoryDrop(key),"Cross-region recovery");
    s.region=0;
    assert(recoverInventoryDrop(key)&&!recoverInventoryDrop(key),"Single pickup "+id);
    const recovered=weaponInstances(id).find(x=>x.key===selected.key);
    assert(recovered?.wear===99,"Identity and wear "+id);
    assert(craftEquip(id,recovered.key),"Re-equip "+id);
    give("화강암 숫돌",1);
    assert(craftRepair("화강암 숫돌")&&recovered.wear===100,"Repair "+id);
    families.push(id);
   }
   const timber=[];
   for(const grade of timberGrades){
    const before=count(grade.id);give(grade.id,3);
    const target=findTarget(grade.id);
    assert(placeInventoryItem(grade.id,3,null,target),"Timber place "+grade.id);
    const key=Object.keys(s.crafting.drops).find(key=>s.crafting.drops[key].item===grade.id);
    reloaded();
    assert(count(grade.id)===before&&s.crafting.drops[key].quantity===3,"Saved timber "+grade.id);
    assert(recoverInventoryDrop(key)&&count(grade.id)===before+3&&!recoverInventoryDrop(key),"Timber pickup "+grade.id);
    timber.push(grade.id);
   }
   const rollbackTarget=findTarget(timber[0]),rollbackBefore=count(timber[0]);
   const save=autosave;
   autosave=()=>false;
   try{assert(!placeInventoryItem(timber[0],1,null,rollbackTarget)&&count(timber[0])===rollbackBefore,"Failed save rollback");}
   finally{autosave=save;}
   const old=fresh(),legacy=Object.keys(legacyWeaponRecipes)[0],variant=weaponCatalogue[0].id;
   old.bag={삼나무:5,"선별 편백":3,[legacy]:1,[variant]:2,"방수 널판":4};
   old.reservedTimber={repair:{편백:2}};
   old.pendingConstruction={materials:{편백:1},completion:3};
   old.shipments=[{item:"유럽참나무",quantity:7}];
   old.crafting={discovered:{},made:{},wear:{[legacy]:39,[variant]:71},gear:{weapon:legacy},drops:{}};
   const migration=migrateWeaponInstances(migrateTimber(old));
   const snapshot=JSON.stringify(migration);
   assert(snapshot===JSON.stringify(migrateWeaponInstances(migrateTimber(migration))),"One-time migration");
   assert(old.bag.timber_log===5&&old.bag.timber_quality===3&&old.bag["방수 널판"]===4,"Legacy timber and trade");
   assert(old.reservedTimber.repair.timber_log===2&&old.pendingConstruction.materials.timber_log===1&&old.pendingConstruction.completion===3&&old.shipments[0].item==="timber_log","Legacy reserved/construction/shipment");
   assert(old.crafting.instances[legacy][0].wear===39&&old.crafting.instances[variant][0].wear===71&&old.crafting.instances[variant][1].wear===100,"Legacy individual wear");
   assert(old.crafting.gear.weapon===legacy&&old.crafting.weaponInstance===old.crafting.instances[legacy][0].key&&weaponRecipe(legacy).slot==="weapon","Legacy equipped weapon");
   const target={id:"qa-target"},now=simulationTime;
   weaponCounter={id:target.id,at:now,region:s.region};
   const contexts={FIRST:{previous:0},COUNTER:{},AIM:{aimed:true},CLOSE:{distance:1},FINISH:{previous:15}};
   for(const [bonus,ctx] of Object.entries(contexts)){
    assert(weaponBonusMultiplier({bonus},target,{distance:3,previous:3,max:20,aimed:false,...ctx})===1.15,bonus);
   }
   for(const id of ["피라미","산감","양수기 부품","심을 수 있는 아사기 볍씨","마지막 씨앗 항아리","craft:waterproof-board","방수 널판"])give(id);
   const toast=$("toast");if(toast)toast.textContent="";
   satchel();
   const grid=document.querySelector("#dialogBody .inventory-grid");
   assert(grid.children.length===Object.keys(s.bag).length&&Array.from(grid.children).every(x=>x.querySelector("img")&&x.getAttribute("aria-label")),"Bag grid");
   return {registry:registry.length,families,timber,legacy,bonuses:Object.keys(contexts),bagSlots:grid.children.length};
  });
  await page.locator("#dialogBody .inventory-grid img").first().evaluate(img=>img.decode());
  await page.screenshot({path:path.join(__dirname,"item-art-delivery","inventory-in-game.png")});
  await page.evaluate(()=>{craftCodex.tab=2;craftShowCodex();});
  assert.equal(await page.locator("#dialogBody .inventory-grid .inventory-slot").count(),67);
  await page.locator("#dialogBody .inventory-grid img").first().evaluate(img=>img.decode());
  await page.screenshot({path:path.join(__dirname,"item-art-delivery","codex-in-game.png")});
  await page.evaluate(()=>weaponComparison("staff-01","axe-01"));
  assert.equal(await page.locator(".weapon-comparison img").count(),2);
  await page.screenshot({path:path.join(__dirname,"item-art-delivery","comparison-in-game.png")});
  const placed=await page.evaluate(()=>{
   resumeGameplay();s.region=0;loadedScene="";ensureWorld();
   const [x,z]=craftStationPositions[0][0];
   const id="axe-01";
   let target;
   for(let i=0;i<16;i++){
    heading=i*Math.PI/8;
    player={x:x-Math.sin(heading)*2.2,y:z-Math.cos(heading)*2.2};
    target=placementTarget(id);
    if(target?.fixture)break;
   }
   if(!target?.fixture)throw Error("Fixture placement unreachable");
   const instance=weaponInstances(id)[0];
   if(!placeInventoryItem(id,1,instance.key,target))throw Error("Fixture placement failed");
   return {id,key:Object.keys(s.crafting.drops).find(k=>s.crafting.drops[k].instance?.key===instance.key),instance:instance.key,wear:instance.wear};
  });
  await page.reload();
  await page.waitForFunction(()=>typeof placementTarget==="function"&&!!graphics);
  await page.evaluate(placed=>{
   if(opening.open)finishOpening();
   const drop=s.crafting.drops[placed.key];
   if(drop?.instance?.key!==placed.instance||drop.instance.wear!==placed.wear||!drop.fixture)throw Error("Real browser reload lost fixture drop");
   s.introPending=false;loadedScene="";ensureWorld();
   player={x:drop.x,y:drop.z-2.3};heading=0;pitch=.36;
  },placed);
  if(!process.argv.includes("--skip-world-capture")){
  await page.waitForFunction(()=>!!riggedScene,{},{timeout:45000});
  await page.evaluate(placed=>{
   if(!recoverInventoryDrop(placed.key)||recoverInventoryDrop(placed.key))throw Error("Fixture pickup");
   const item="axe-01",grade="timber_log";
   let area=null;
   for(let z=241;z<325&&!area;z+=3)for(let x=332;x<398&&!area;x+=3){
    if(buildingFootprints.some(p=>Math.hypot(p.x-x,p.z-z)<12))continue;
    player={x,y:z};heading=0;
    const position=placementTarget(item);
    if(position){
     heading=-1;
     const second=placementTarget(grade);
     if(second&&Math.hypot(position.x-second.x,position.z-second.z)>1.6)area={position,second};
    }
   }
   if(!area)throw Error("No open photo area");
   heading=0;
   if(!placeInventoryItem(item,1,placed.instance,area.position))throw Error("Photo weapon placement");
   heading=-1;
   if(!placeInventoryItem(grade,2,null,area.second))throw Error("Photo timber placement");
   delete s.crafting.gear.weapon;delete s.crafting.weaponInstance;
   heading=-.54;pitch=.46;zoom=2.4;s.hour=13.5;
   draw(simulationTime);
  },placed);
  await page.waitForTimeout(850);
  await page.evaluate(()=>draw(simulationTime));
  await page.screenshot({path:path.join(__dirname,"item-art-delivery","placement-in-game.png")});
  }else{
   await page.evaluate(placed=>{if(!recoverInventoryDrop(placed.key))throw Error("Fixture pickup");},placed);
  }
  const oldSave=await page.evaluate(()=>{
   const legacy=Object.keys(legacyWeaponRecipes)[0],old=fresh();
   old.introPending=false;old.bag={편백:4,[legacy]:1};
   old.activeQuests={sluice:{timber:{편백:2},progress:3}};
   old.crafting={gear:{weapon:legacy},wear:{[legacy]:42},discovered:{},made:{},drops:{}};
   return old;
  });
  await page.addInitScript(old=>localStorage.setItem("returning-waters-v1",JSON.stringify(old)),oldSave);
  await page.reload();
  await page.waitForFunction(()=>typeof placementTarget==="function"&&!!graphics);
  await page.evaluate(()=>{
   if(count("timber_log")!==4||equippedInstance()?.wear!==42||s.activeQuests.sluice.timber.timber_log!==2||s.activeQuests.sluice.progress!==3)throw Error("Old browser save was not migrated");
  });
  assert.deepEqual(failures,[]);
  console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
