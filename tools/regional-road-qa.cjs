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

  const data=await page.evaluate(()=>{
   if(opening.open)finishOpening();
   const walks=[],sides=[];
   for(const [region,roads] of worldRoads.entries()){
    for(const road of roads){
     s.region=region;player={x:93,y:118};loadedScene="";walkedFrom=null;ensureWorld();
     const [x,z]=road.edge;
     const point=(d,side)=>({x:x-road.x*d-road.z*side,y:z-road.z*d+road.x*side});
     for(const side of [-2.5,2.5]){
      let blocked=null,grade=0,prev=null;
      for(let d=76;d>=0;d-=.25){
       const p=point(d,side),y=supportAt(p.x,p.y,prev??Infinity);
       if(y===null){blocked={d,...p,near:sceneryCells.get(Math.floor(p.x/cellSize)+","+Math.floor(p.y/cellSize))?.filter(c=>Math.abs(c.x-p.x)<3&&Math.abs(c.z-p.y)<3)};break;}
       if(prev!==null)grade=Math.max(grade,Math.abs(prev-y)/.25);
       prev=y;
      }
      sides.push({from:region,to:road.to,side,blocked,grade});
     }
     player=point(76,0);walkedFrom=null;
     let stall=0,maxStep=0,tries=0;
     while(s.region===region&&tries++<510&&stall<3){
      const previous={...player},floor=playerSupport();
      moveOnSurfaces(road.x*.16,road.z*.16);
      if(s.region===region&&Math.hypot(previous.x-player.x,previous.y-player.y)<.001)stall++;
      maxStep=Math.max(maxStep,Math.abs(playerSupport()-floor));
     }
     walks.push({from:region,to:road.to,landed:s.region===road.to,maxStep,tries,stalled:stall?player:null});
    }
   }
   return {walks,sides,gl:gl.getError()};
  });
  fs.writeFileSync(path.join(out,"road-check.json"),JSON.stringify(data,null,2));
  console.log(JSON.stringify({walks:data.walks.length,sides:data.sides.length,walkIssues:data.walks.filter(v=>!v.landed||v.maxStep>.32),sideIssues:data.sides.filter(v=>v.blocked||v.grade>.45),gl:data.gl}));
  assert.equal(data.gl,0);
  assert.ok(data.walks.every(v=>v.landed&&v.maxStep<=.32));
  assert.ok(data.sides.every(v=>!v.blocked&&v.grade<=.45));
  assert.deepEqual(failures,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
