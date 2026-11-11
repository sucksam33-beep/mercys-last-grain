const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game"),out=path.join(__dirname,"regalia-ornament-review"),origin="https://regalia.game.local";
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".glb":"model/gltf-binary"};
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-gpu-shader-disk-cache"]});
 try{
  const page=await browser.newPage({viewport:{width:800,height:640}}),errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",event=>{if(event.type()==="error"&&event.text().includes("Shader Error"))errors.push(event.text());});
  await page.route(origin+"/**",route=>{
   const pathname=decodeURIComponent(new URL(route.request().url()).pathname),file=path.join(root,pathname);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
   if(pathname==="/rigged-scene.mjs")return route.fulfill({contentType:"text/javascript",body:fs.readFileSync(file,"utf8").replace("const craftingGear=createCraftGear(prince);","const craftingGear=createCraftGear(prince);window.regaliaPlayer=prince;")});
   if(pathname==="/index.html"){
    let html=fs.readFileSync(file,"utf8");
    html=html.replace(" updateAim(eye,at,time,opening.open",` if(window.regaliaCamera){
     eye.splice(0,3,player.x+1.0,y+1.51,player.y+5.0);
     at.splice(0,3,player.x,y+1.26,player.y);
    }
    updateAim(eye,at,time,opening.open`);
    html=html.replace("   if(skip.some(p=>coversCell",`   if(window.regaliaCamera&&(Math.abs(grid.x+col*step-player.x)>100||Math.abs(grid.z+row*step-player.y)>100))continue;
   if(skip.some(p=>coversCell`);
    html=html.replace(" for(const {buffer,count} of graphics.treeBatches)mesh(buffer,count,[0,0,0],0);",` for(const {buffer,count,x:tx,z:tz} of graphics.treeBatches){
     if(window.regaliaCamera&&Math.hypot(tx-player.x,tz-player.y)>135)continue;
     mesh(buffer,count,[0,0,0],0);
    }`);
    html=html.replace(" drawOpenWorld(mesh,eye);"," if(!window.regaliaCamera)drawOpenWorld(mesh,eye);");
    return route.fulfill({contentType:"text/html",body:html});
   }
   if((pathname.endsWith(".bin")||pathname.endsWith(".glb")||pathname.endsWith(".png"))&&fs.statSync(file).size>8500000&&!/prince|genzo|station|locomotive/.test(pathname))return route.abort();
   return route.fulfill({path:file,contentType:types[path.extname(file)]??"application/octet-stream"});
  });
  await page.addInitScript(()=>{
   window.regaliaCamera=true;
   const raf=requestAnimationFrame.bind(window);
   window.requestAnimationFrame=cb=>cb.name==="loop"?0:raf(cb);
   localStorage.setItem("returning-waters-render-quality","0");
  });
  await page.goto(origin+"/index.html");
  await page.waitForFunction(()=>!!window.regaliaPlayer&&!!riggedScene&&!!graphics,null,{timeout:60000});
  console.log("Game renderer ready");
  await page.evaluate(()=>{
   window.soilOpening=null;
   if(opening.open)opening.close();
   s.introPending=false;s.stage=6;s.region=0;s.hour=12;s.day=2;
   player={x:248,y:211};walkedFrom=null;heading=facing=0;
   graphicsOverrides={resolution:0,shadows:0,vegetation:0,reflection:0};
   window.regaliaCamera=true;
  });
  const results=[];
  for(let tier=1;tier<=5;tier++){
   console.log("Drawing stage",tier);
   const result=await page.evaluate(tier=>{
    craftState().coatTier=tier;
    draw(5000);
    const ornaments=window.regaliaPlayer.root.getObjectByName("coat-ornaments");
    const visible=ornaments.visible?ornaments.children.filter(x=>x.visible&&x.children.some(g=>g.visible)).map(x=>x.name):[];
    return {tier,visible,location:[s.region,player.x,player.y],hour:s.hour,day:s.day};
   },tier);
   assert.equal(result.visible.length,tier>=3?7:0);
   results.push(result);
   await page.screenshot({path:path.join(out,"game-tier-"+tier+".png")});
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,"game-test.json"),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
