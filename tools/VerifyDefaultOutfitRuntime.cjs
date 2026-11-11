const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game"),out=path.join(__dirname,"default-outfit-review"),origin="https://default.game.local";
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".glb":"model/gltf-binary"};
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-gpu-shader-disk-cache"]});
 try{
 for(const phase of ["after"]){
  const page=await browser.newPage({viewport:{width:880,height:640}}),errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.route(origin+"/**",route=>{
   const pathname=decodeURIComponent(new URL(route.request().url()).pathname),file=path.join(root,pathname);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
   if(pathname==="/rigged-scene.mjs")return route.fulfill({contentType:"text/javascript",body:fs.readFileSync(file,"utf8").replace("const craftingGear=createCraftGear(prince);","const craftingGear=createCraftGear(prince);window.defaultOutfitQA={prince,craftingGear};")});
   if(phase==="before"&&["/fitted-outfits.mjs","/wearable-torsos.mjs"].includes(pathname))return route.fulfill({contentType:"text/javascript",path:path.join(out,path.basename(file).replace(".mjs","-before.mjs"))});
   return route.fulfill({path:file,contentType:types[path.extname(file)]??"application/octet-stream"});
  });
  await page.addInitScript(()=>{
   const raf=requestAnimationFrame.bind(window);
   window.requestAnimationFrame=cb=>cb.name==="loop"?0:raf(cb);
   localStorage.setItem("returning-waters-render-quality","0");
  });
  await page.goto(origin+"/index.html");
  await page.waitForFunction(()=>!!window.defaultOutfitQA&&!!riggedScene&&!!graphics,null,{timeout:65000});
  const result=await page.evaluate(async()=>{
   const {prince,craftingGear}=window.defaultOutfitQA;
   const visible=key=>Boolean(prince.root.getObjectByName(key)?.visible);
   const wait=async(expected)=>{
    for(let i=0;i<150;i++){
     craftingGear.update(craftVisual(null),null);
     if(expected.every(visible))return;
     await new Promise(r=>setTimeout(r,25));
    }
    throw Error("Wardrobe unavailable: "+expected.join(","));
   };
   const defaults=["default-top","default-pants","default-shoes"];
   await wait(defaults);
   const id="아사기 논둑 작업복";
   give(id,1);
   if(!craftEquip(id))throw Error("Equip failed");
   await wait(["wardrobe-144","wardrobe-base","default-shoes"]);
   if(visible("default-top")||visible("default-pants"))throw Error("Default mesh overlapped the equipped torso");
   if(!craftEquip(id))throw Error("Unequip failed");
   await wait(defaults);
   if(visible("wardrobe-144"))throw Error("Equipment persisted after removal");
   return {defaultSlots:defaults,equipped:id,restored:true};
  });
  fs.writeFileSync(path.join(out,"game-runtime.json"),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
  assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log("Game entry point equipped and restored the default outfit");
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
