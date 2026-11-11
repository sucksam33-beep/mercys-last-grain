const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.resolve(process.env.REGIONS_ROOT??path.join(__dirname,"game"));
const out=path.join(__dirname,"comparison","regional-graphics");
const phase=process.argv[2]??"before";
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"};
const links=[1,0,3,4,7,6,5,4];
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
   const samples=new Map(),water=[],rails=[],timber=[];
   const openRegion=region=>{
    s.region=region;player={x:93,y:118};walkedFrom=null;loadedScene="";
    ensureWorld();
   };
   for(const [region,roads] of worldRoads.entries()){
    openRegion(region);
    for(const group of timberGroups.filter(g=>g.region===region))for(const node of group.nodes){
     const action=aimObjects.find(o=>o.action?.id===node.id)?.action;
     const local=action&&[0,1,2,3,4,5,6,7].some(i=>{
      const {x,z}=action,a=x+Math.cos(i*Math.PI/4)*2,b=z+Math.sin(i*Math.PI/4)*2;
      const floor=supportAt(a,b);
      return floor!==null&&unobstructed({x:a,y:b,floor},{x,y:z})!==null;
     });
     timber.push({id:node.id,reachable:Boolean(local)});
    }
    for(const road of roads){
     const [ex,ez]=road.edge,alongStart=road.x?worldBounds.north:worldBounds.west;
     const alongEnd=road.x?worldBounds.south:worldBounds.east;
     const values=[];
     for(let along=alongStart;along<=alongEnd;along+=.5){
      values.push(terrainSurface(road.x?ex:along,road.x?along:ez));
     }
     samples.set(region+":"+road.to,values);
     if(road.seam.coast){
      const side=road.x?ez:ex;
      const gap=36;
      const x=ex-road.x*10+road.z*gap,z=ez-road.z*10+road.x*gap;
      water.push({region,x,z,height:terrainSurface(x,z),support:supportAt(x,z)});
     }
     if([5,6,7].includes(region)||[5,6,7].includes(road.to)){
      const x=ex-road.x*8,z=ez-road.z*8;
      const sx=x-road.z*4.5,sz=z+road.x*4.5,ground=terrainSurface(sx,sz);
      rails.push({from:region,to:road.to,blocked:supportAt(sx,sz,ground)===null,clear:supportAt(x,z)!==null});
     }
    }
   }
   const seams=worldLinks.map(([a,b])=>{
    const left=samples.get(a+":"+b),right=samples.get(b+":"+a);
    return {a,b,max:Math.max(...left.map((y,i)=>Math.abs(y-right[i])))};
   });
   const crossings=[];
   for(const [a,b] of worldLinks)for(const [from,to] of [[a,b],[b,a]]){
    openRegion(from);
    const road=worldRoads[from].find(r=>r.to===to),[x,z]=road.edge;
    player={x:x-road.x*23,y:z-road.z*23};walkedFrom=null;
    const initial=playerSupport();let delta=0,steps=0;
    while(s.region===from&&steps++<178){
     const before=playerSupport();
     moveOnSurfaces(road.x*.16,road.z*.16);
     delta=Math.max(delta,Math.abs(playerSupport()-before));
    }
    crossings.push({from,to,landed:s.region===to,initial,delta,steps});
   }
   return {seams,crossings,water,rails,timber,gl:gl.getError()};
  });
  fs.writeFileSync(path.join(out,"collision-check.json"),JSON.stringify(qa,null,2));
  console.log(JSON.stringify(qa));
  assert.equal(qa.gl,0);
  assert.ok(qa.seams.every(seam=>seam.max<.05),"boundary heights differ");
  assert.ok(qa.crossings.every(c=>c.landed&&c.delta<.4),"crossing blocked or discontinuous");
  assert.ok(qa.rails.every(rail=>rail.blocked&&rail.clear),"railing collision");
  assert.equal(qa.timber.length,80);assert.ok(qa.timber.every(node=>node.reachable),"timber approach regressions");
  assert.deepEqual(failures,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
