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
  const report=await page.evaluate(()=>{
   if(opening.open)finishOpening();
   s.introPending=false;s.stage=6;
   const data=[];
   for(let region=0;region<8;region++){
    if(s.region!==region){s.region=region;loadedScene="";}
    ensureWorld();
    const names={};
    for(const object of aimObjects){
     const key=object.action?.type??"static";
     (names[key]??=new Set()).add(object.name);
    }
    data.push({region:r().name,groups:Object.fromEntries(Object.entries(names).map(([k,v])=>[k,[...v]]))});
   }
   return data;
  });
  fs.writeFileSync(path.join(__dirname,"model-reference-audit","live-world-audit.json"),JSON.stringify(report,null,2));
  console.log(report.map(x=>[x.region,Object.keys(x.groups).length]));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
