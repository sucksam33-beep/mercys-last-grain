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
  const result=await page.evaluate(async()=>{
   if(opening.open)finishOpening();
   s.stage=6;s.introPending=false;s.region=0;
   const expected=Object.entries(reusedMaterialModels);
   const poses=[];
   const original=riggedScene;
   riggedScene={addMaterialDisplay:pose=>poses.push(pose),materialDisplayReady:()=>false};
   const beforeVerts=verts;
   verts=[];
   try{buildMaterialRack();s.timberStructures={0:{fence:{x:257,z:234}}};paintTimberStructures();}finally{verts=beforeVerts;riggedScene=original;}
   for(const [id,url] of expected){
    if(!poses.some(p=>p.url===url&&p.key===CraftingData.artKey(id)))throw Error("Rack not linked: "+id);
   }
   if(!poses.some(p=>p.url===reusedMaterialModels["울타리"]&&p.replaceFallback&&p.x===257&&p.width===2.6))throw Error("Constructed fence model");
   const {createMaterialDisplays}=await import("./material-displays.mjs");
   const {GLTFLoader}=await import("./vendor/three/GLTFLoader.js");
   const engine=createMaterialDisplays(new GLTFLoader());
   engine.begin(s.region);
   for(const [,url] of expected)engine.add(poses.find(p=>p.url===url));
   engine.update([254.7,3,210.3]);
   for(let tries=0;tries<100&&engine.root.children.length<4;tries++){
    await new Promise(r=>setTimeout(r,35));
    engine.update([254.7,3,210.3]);
   }
   if(engine.root.children.length!==4||engine.root.children.some(o=>!o.visible))throw Error("Fal rack objects did not load");
   const count=weaponCatalogue.filter(row=>craftRecipes[row.id]?.model).length;
   if(count!==54)throw Error("Weapon registry");
   if(Object.keys(ingredientModelKeys).length!==80)throw Error("Ingredient registry");
   for(const [id,key] of Object.entries(ingredientModelKeys))if(craftItems[id].icon!=="assets/ingredient-icons/"+key+".png")throw Error("Ingredient icon "+id);
   return {weapons:count,ingredients:80,reused:expected.map(([id,url])=>({id,url,loaded:true}))};
  });
  assert.deepEqual(failures,[]);
  fs.writeFileSync(path.join(__dirname,"fal-integration-review","headless-runtime.json"),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
