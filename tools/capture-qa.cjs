const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game");
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"};
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-gpu-shader-disk-cache"]});
 try{
 const page=await browser.newPage({viewport:{width:1000,height:620}});
 const failures=[];
 page.on("pageerror",e=>{failures.push(e.message);console.error(e.stack);});
 const origin="https://game.returningwaters.local";
 await page.route("**/*",route=>{
  const url=new URL(route.request().url());
  if(url.origin!==origin)return route.abort();
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
 await page.waitForFunction(()=>typeof ensureWorld==="function"&&!!graphics);

  await page.waitForFunction(()=>!!riggedScene&&opening.open&&!!window.soilOpening?.sample,{},{timeout:90000});
  const intro=await page.evaluate(()=>{
   draw(performance.now()+2000);
   return Boolean(window.soilOpening?.sample&&opening.dataset.soilTime&&gl.getError()===0);
  });
  if(!intro)throw Error("Opening draw failed");
  await page.evaluate(()=>{
   finishOpening();s.hour=13;
   const group=timberGroups[2];ensureWorld();
   const spot=timberSites.get(group.nodes[0].id);
   player={x:spot.x,y:spot.z-3.3};walkedFrom=null;
   facing=heading=0;pitch=.06;zoom=4.4;draw(performance.now());
  });
  await page.screenshot({path:path.join(__dirname,"comparison","timber-cypress.png")});
  await page.evaluate(()=>{timberCodex();});
  await page.screenshot({path:path.join(__dirname,"comparison","timber-codex.png")});
  console.log("Intro rendered; grove and codex captured");
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});