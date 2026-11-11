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
  const injected=new Map([["/assets/wildlife/asagi-01.glb",0],["/assets/botanical-plants.webp",0]]);
  await page.route("**/*",route=>{
   const url=new URL(route.request().url());
   if(url.origin!==origin)return route.abort();
   if(injected.has(url.pathname)){const count=injected.get(url.pathname);injected.set(url.pathname,count+1);if(count===0)return route.abort("failed");}
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


  await page.waitForFunction(()=>{
   if(opening.open)finishOpening();
   if(!loadedScene)ensureWorld();
   loadPlantAtlas();
   return Boolean(plantTexture);
  },{},{timeout:28000,polling:350});
  const list=[];
  for(let region=0;region<8;region++){
   const setup=await page.evaluate(region=>{
    s.region=region;s.day=4;s.hour=12;s.introPending=false;
    player={x:300,y:350};loadedScene="";walkedFrom=null;ensureWorld();
    const timber=aimObjects.filter(o=>o.action?.type==="timberGrade"&&o.action.group.grade>1);
    const trunk=action=>sceneryCells.get(Math.floor(action.x/cellSize)+","+Math.floor(action.z/cellSize))?.some(c=>c.districtResource&&!c.walkable&&Math.hypot(c.x-action.x,c.z-action.z)<.25);
    const count=timber.filter(o=>trunk(o.action)).length;
    let renewal=null;
    if(region===0){
     const tree=timber.find(o=>o.action.group.grade===3).action;
     const vertices=districtResourceCount;
     markWorldHarvest(tree,2);rebuildDistrictEcology();
     const removed=!trunk(tree)&&districtResourceCount<vertices;
     s.day+=2;ensureWorld();
     renewal=removed&&trunk(tree)&&districtResourceCount===vertices;
    }
    riggedScene.beginWildlife(region);
    const field=here("field");
    player={x:field.x,y:field.y+16};heading=facing=0;zoom=9;pitch=.1;walkedFrom=null;
    return {timber:timber.length,trunkColliders:count,renewal};
   },region);
   const models=await page.waitForFunction(region=>{
    const results=Array.from({length:5},(_,index)=>[1,.64].map((age,member)=>
     riggedScene.placeWildlife(region,index,310+index*2,terrainSurface(310+index*2,350),350+member,0,member+100,age)));
    return results.every(pair=>pair.every(v=>v&&v.height>0&&v.length>0&&v.width>0))?results:null;
   },region,{timeout:45000,polling:300});
   const dimensions=await models.jsonValue();
   const result=await page.evaluate(()=>{draw(12000);return gl.getError();});
   list.push({region,...setup,species:dimensions.length,adultAndYoung:dimensions.every(pair=>pair.length===2),gl:result});
   console.log(JSON.stringify(list.at(-1)));
  }
  const recovered=Object.fromEntries(injected);
  assert.deepEqual([...injected.values()],[2,2]);
  assert.ok(list.every(r=>r.timber===r.trunkColliders&&r.species===5&&r.adultAndYoung&&r.gl===0));
  assert.equal(list[0].renewal,true);
  assert.deepEqual(failures,[]);
  fs.writeFileSync(path.join(out,"after.json"),JSON.stringify({list,recovered,failures},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
