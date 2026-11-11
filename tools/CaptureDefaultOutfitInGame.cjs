const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game"),out=path.join(__dirname,"default-outfit-review"),origin="https://default.game.local";
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".glb":"model/gltf-binary"};
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-gpu-shader-disk-cache"]});
 try{
 for(const phase of ["before","after"]){
  const page=await browser.newPage({viewport:{width:880,height:640}}),errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.route(origin+"/**",route=>{
   const pathname=decodeURIComponent(new URL(route.request().url()).pathname),file=path.join(root,pathname);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
   if(pathname==="/rigged-scene.mjs")return route.fulfill({contentType:"text/javascript",body:fs.readFileSync(file,"utf8").replace("const craftingGear=createCraftGear(prince);","const craftingGear=createCraftGear(prince);window.defaultOutfitQA=prince;")});
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
  await page.evaluate(()=>{
   if(opening.open)finishOpening();
   s.hour=12;
   walkedFrom=null;heading=.08;facing=Math.PI+.32;pitch=.085;zoom=4.25;
   draw(performance.now());
  });
  if(phase==="after"){
   await page.waitForFunction(()=>!!window.defaultOutfitQA.root.getObjectByName("default-top"),null,{timeout:9000});
   await page.evaluate(()=>{
    draw(performance.now());
    for(const name of ["default-top","default-pants","default-shoes"])if(!window.defaultOutfitQA.root.getObjectByName(name)?.visible)throw Error("Missing default "+name);
   });
  }
  await page.screenshot({path:path.join(out,"game-"+phase+".png")});
  assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log("Full game drew the before and after default outfit");
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
