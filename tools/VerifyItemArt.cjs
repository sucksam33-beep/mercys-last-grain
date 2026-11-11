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
   if(opening.open)finishOpening();
   s.introPending=false;
   s.stage=6;
   s.region=0;
   const bench=craftStationPositions[0][0];
   player={x:bench[0],y:bench[1]};
   const verified=[];
   for(const family of new Set(weaponCatalogue.map(x=>x.family))){
    const {id}=weaponCatalogue.find(x=>x.family===family);
    for(const [part,n] of craftRecipes[id].needs)if(count(part)<n)give(part,n-count(part));
    const crafted=craftMake(id,"bench");
    const equipped=craftEquip(id);
    const visual=craftVisual({motion:toolMotionByName[craftRecipes[id].name],name:craftRecipes[id].name});
    verified.push({family,id,crafted,equipped,model:visual?.weapon?.[4]});
   }
   const {loadFalWeapon}=await import("./fal-weapon.mjs");
   for(const {id} of weaponCatalogue){
    const row=craftRecipes[id];
    const mesh=await loadFalWeapon(row.model,id,toolMotionByName[row.name],1);
    if(!mesh.children.length||!Number.isFinite(mesh.scale.y))throw Error("Invalid equipped model "+id);
   }
   for(const grade of timberGrades)give(grade.id,grade.yield);
   render();
   timberCodex();
   return {verified,variants:weaponCatalogue.length,registryIcons:Object.values(craftItems).filter(x=>x.icon).length};
  });
  assert.equal(report.variants,54);
  assert.equal(report.registryIcons,371);
  assert.ok(report.verified.every(x=>x.crafted&&x.equipped&&x.model));
  await page.waitForFunction(()=>Array.from(document.querySelectorAll("dialog img")).filter(img=>img.src.includes("/item-icons/timber_")).every(img=>img.complete&&img.naturalWidth===256));
  assert.equal(await page.locator("dialog img[src*='item-icons/timber_']").count(),4);
  assert.deepEqual(failures,[]);
  await page.screenshot({path:path.join(__dirname,"item-art-delivery","timber-in-game.png")});
  console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
