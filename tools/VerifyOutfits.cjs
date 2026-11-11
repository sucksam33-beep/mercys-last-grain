const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game"),out=path.join(__dirname,"outfit-review");
const origin="https://game.outfits.local";
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".glb":"model/gltf-binary"};
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 try{
  const report={};
  for(const phase of ["before","after"]){
   const page=await browser.newPage({viewport:{width:1100,height:760}}),errors=[];
   page.on("pageerror",error=>errors.push(error.message));
   page.on("console",event=>{if(event.type()==="error"&&event.text().includes("Shader Error"))errors.push(event.text());});
   await page.route(origin+"/**",route=>{
    const file=path.join(root,decodeURIComponent(new URL(route.request().url()).pathname));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
    if(path.basename(file)==="rigged-scene.mjs")return route.fulfill({contentType:"text/javascript",
     body:fs.readFileSync(file,"utf8").replace("const craftingGear=createCraftGear(prince);","const craftingGear=createCraftGear(prince);window.outfitQA=prince;")});
    if(phase==="before"&&path.basename(file)==="craft-gear.mjs")return route.fulfill({contentType:"text/javascript",path:path.join(__dirname,"trellis-86-review","game-before","craft-gear.mjs")});
    return route.fulfill({path:file,contentType:types[path.extname(file)]??"application/octet-stream"});
   });
   await page.addInitScript(()=>{
    const raf=window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame=callback=>callback.name==="loop"?0:raf(callback);
    localStorage.setItem("returning-waters-render-quality","1");
   });
   await page.goto(origin+"/index.html");
   await page.waitForFunction(()=>typeof craftEquip==="function"&&!!graphics&&!!riggedScene&&!!window.outfitQA,null,{timeout:90000});
   report[phase]=await page.evaluate(async phase=>{
    if(opening.open)finishOpening();
    s.introPending=false;s.stage=6;s.region=0;s.hour=12;loadedScene="";ensureWorld();
    player={x:253,y:236};walkedFrom=null;
    heading=.06;facing=Math.PI+.25;pitch=.035;zoom=4.55;
    const ids=Object.entries(priorityItemModels).filter(([,v])=>/\/(14[4-9]|15[01])\.glb$/.test(v.model)).map(([id])=>id);
    const fitted=()=>{let n=0;window.outfitQA.root.traverse(node=>{if(node.name==="fitted-outfit")n++});return n;};
    const checked=[];
    for(const id of ids){
     give(id,1);
     if(!craftEquip(id)||craftEquipment(craftRecipes[id].slot)?.id!==id)throw Error("Equip "+id);
     if(craftVisual()[craftRecipes[id].slot][4]!==priorityItemModels[id].model)throw Error("Visual "+id);
     checked.push(id);
    }
    for(const id of ["아사기 논둑 작업복","암바로 썰물 모자"])if(craftEquipment(craftRecipes[id].slot)?.id!==id&&!craftEquip(id))throw Error("Combo equip");
    for(let tick=0;tick<20;tick++){
     draw(4000);
     if(phase==="before"||fitted()===3)break;
     await new Promise(r=>setTimeout(r,70));
    }
    draw(4000);
    if(phase==="after"&&fitted()!==3)throw Error("Combined outfit failed");
    const toast=$("toast");if(toast)toast.textContent="";
    return {items:checked,simultaneousMeshes:fitted(),gear:s.crafting.gear};
   },phase);
   await page.screenshot({path:path.join(out,"game-"+phase+".png")});
   assert.deepEqual(errors,[]);
   await page.close();
  }
  fs.writeFileSync(path.join(out,"headless-outfits.json"),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report.after));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
