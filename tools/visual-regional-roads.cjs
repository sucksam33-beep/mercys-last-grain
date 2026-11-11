const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.resolve(process.env.REGIONS_ROOT??path.join(__dirname,"game"));
const out=path.join(__dirname,"comparison","regional-roads");
const phase=process.argv[2]??"before";
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"};
const links=[1,5,null,null,7,6,5,4];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-gpu-shader-disk-cache"]});
 try{
  const page=await browser.newPage({viewport:{width:1152,height:704}});
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
   localStorage.setItem("returning-waters-render-quality","2");
   localStorage.setItem("returning-waters-graphics-v1",JSON.stringify({resolution:1,shadows:1,vegetation:1,reflection:1}));
  });
  await page.goto(origin+"/index.html");
  await page.waitForFunction(()=>typeof riggedScene!=="undefined"&&!!riggedScene&&!!scenery,{},{timeout:90000});
  for(const [region,to] of links.entries()){
   if(to===null)continue;
   const result=await page.evaluate(({region,to})=>{
    if(opening.open)finishOpening();
    s.region=region;s.hour=13;s.day=3;s.introPending=false;
    const road=worldRoads[region].find(r=>r.to===to);
    const inward=true,dist=19;
    player={x:road.edge[0]-road.x*dist,y:road.edge[1]-road.z*dist};
    walkedFrom=null;heading=facing=inward?Math.atan2(-road.x,-road.z):Math.atan2(road.x,road.z);pitch=.05;zoom=10;
    actionSpot=null;cameraClearance=1;loadedScene="";
    render();draw(12000);
    return {gl:gl.getError(),vertices:graphics.worldCount,position:player,heading,floor:playerSupport()};
   },{region,to});
   assert.equal(result.gl,0);
   await page.screenshot({path:path.join(out,phase+"-"+region+".png")});
   console.log(phase,region,JSON.stringify(result));
   if(phase==="diagnose"){
    await page.evaluate(()=>{drawOpenWorld=()=>{};draw(12000);});
    await page.screenshot({path:path.join(out,"diagnose-no-neighbors.png")});
    await page.evaluate(()=>{appendTerrainHorizon=()=>{};loadedScene="";draw(12000);});
    await page.screenshot({path:path.join(out,"diagnose-no-horizon.png")});
   }
  }
  assert.deepEqual(failures,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});