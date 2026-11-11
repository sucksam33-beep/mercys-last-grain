const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.resolve(process.env.REGIONS_ROOT??path.join(__dirname,"game"));
const out=path.join(__dirname,"comparison","ecology-fix");
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
  page.on("console",m=>{if(m.type()==="warning"||m.type()==="error")console.log(m.type(),m.text().slice(0,700));});
  page.on("requestfailed",r=>{if(/\.(glb|png|webp)$/.test(r.url()))console.log("failed",r.url());});
  await page.goto(origin+"/index.html");
  await page.waitForFunction(()=>typeof riggedScene!=="undefined"&&!!riggedScene&&!!scenery,{},{timeout:90000});

  const list=[];
  const regions=process.env.ECOLOGY_ALL?[0,1,2,3,4,5,6,7]:[0,5,7];
  for(const region of regions){
   const setup=await page.evaluate(region=>{
    if(opening.open)finishOpening();
    s.region=region;s.day=4;s.hour=12;s.introPending=false;
    player={x:300,y:350};loadedScene="";walkedFrom=null;ensureWorld();
    const timber=aimObjects.filter(o=>o.action?.type==="timberGrade"&&o.action.group.grade>1);
    const count=timber.filter(o=>sceneryCells.get(Math.floor(o.action.x/cellSize)+","+Math.floor(o.action.z/cellSize))?.some(c=>c.districtResource&&!c.walkable&&Math.hypot(c.x-o.action.x,c.z-o.action.z)<.25)).length;
    const fields=here("field");
    player={x:fields.x,y:fields.y+16};heading=facing=0;zoom=9;pitch=.1;walkedFrom=null;
    const place=riggedScene.placeWildlife;
    riggedScene.placeWildlife=(...args)=>{const result=place(...args);if(result)window.seenWildlife.add(args[1]);return result;};
    window.seenWildlife=new Set();
    draw(12000);
    return {timber:timber.length,trunkColliders:count,expected:[...new Set(wildlife.filter(a=>a.target.action.available()).map(a=>a.target.action.index))],atlas:Boolean(plantTexture)};
   },region);
   await page.waitForFunction(()=>Boolean(plantTexture));
   await page.waitForFunction(({expected})=>{
    draw(12000);
    return expected.every(index=>seenWildlife.has(index));
   },setup,{timeout:35000,polling:500}).catch(e=>console.error("Missing wildlife",region,e.message));
   const result=await page.evaluate(()=>({loaded:[...seenWildlife],gl:gl.getError(),plant:gl.getParameter(gl.MAX_TEXTURE_SIZE)}));
   list.push({region,...setup,...result});
   console.log(JSON.stringify(list.at(-1)));
  }
  fs.writeFileSync(path.join(out,phase+".json"),JSON.stringify({list,failures},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
