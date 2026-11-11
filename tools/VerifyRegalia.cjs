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
 await page.evaluate(()=>{if(opening.open)finishOpening();craftGearMenu();});
 await page.getByRole("button",{name:"복장 마감 · 5단계",exact:true}).click();
 const tiers=[];
 for(let tier=1;tier<=5;tier++){
  await page.getByRole("button",{name:new RegExp("^"+tier+"단계 ·")}).click();
  const state=await page.evaluate(()=>{
   const save=readSave(autoSaveKey);
   return {live:craftVisual()?.coatTier,saved:save?.state?.crafting?.coatTier};
  });
  assert.deepEqual(state,{live:tier,saved:tier});
  tiers.push(tier);
 }
 await page.evaluate(()=>{s=migrateWeaponInstances(migrateTimber(readSave(autoSaveKey).state));craftCoatMenu();});
 assert.equal(await page.getByRole("button",{name:/^5단계/}).getAttribute("aria-pressed"),"true");
 await page.screenshot({path:path.join(__dirname,"regalia-review","game-menu.png")});
 await page.getByRole("button",{name:"장착 의상 표시",exact:true}).click();
 assert.equal(await page.evaluate(()=>craftVisual()?.coatTier),undefined);
 const report={tiers,restored:5,canRevertToGear:true};
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(__dirname,"regalia-review","game-ui-test.json"),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
