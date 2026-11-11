const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.resolve(process.env.REGIONS_ROOT??path.join(__dirname,"game"));
const out=path.join(__dirname,"comparison","canyon-revision");
const phase=process.argv[2]??"before";
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"};
const links=[null,2,3,4,3,null,null,null];
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

  const qa=await page.evaluate(()=>{
   if(opening.open)finishOpening();
   const land=[],joins=[];
   const open=region=>{
    s.region=region;player={x:93,y:118};loadedScene="";walkedFrom=null;ensureWorld();
   };
   for(const region of [1,2,3,4]){
    open(region);
    for(const road of worldRoads[region].filter(r=>r.canyon)){
     const [ex,ez]=road.edge;
     for(const offset of [-2.5,0,2.5]){
      let prev=null,blocked=0,maxGrade=0;
      for(let d=86;d>=0;d-=.25){
       const x=ex-road.x*d-road.z*offset,z=ez-road.z*d+road.x*offset;
       const y=supportAt(x,z,prev??Infinity);
       if(y===null){blocked++;continue;}
       if(prev!==null)maxGrade=Math.max(maxGrade,Math.abs(y-prev)/.25);
       prev=y;
      }
      land.push({from:region,to:road.to,offset,blocked,maxGrade});
     }
     const start={x:ex-road.x*.75,y:ez-road.z*.75};
     player={...start};walkedFrom=null;
     const height=playerSupport();
     moveOnSurfaces(road.x*.95,road.z*.95);
     joins.push({from:region,to:road.to,landed:s.region===road.to,heightDifference:Math.abs(height-playerSupport())});
     open(region);
    }
   }
   return {land,joins,gl:gl.getError()};
  });
  fs.writeFileSync(path.join(out,"canyon-collision.json"),JSON.stringify(qa,null,2));
  console.log(JSON.stringify(qa));
  assert.equal(qa.land.length,18);
  assert.equal(qa.joins.length,6);
  assert.equal(qa.gl,0);
  assert.ok(qa.land.every(v=>v.blocked===0&&v.maxGrade<=.30),"a canyon lane is obstructed or too steep");
  assert.ok(qa.joins.every(v=>v.landed&&v.heightDifference<.15),"a canyon crossing is discontinuous");
  assert.deepEqual(failures,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});