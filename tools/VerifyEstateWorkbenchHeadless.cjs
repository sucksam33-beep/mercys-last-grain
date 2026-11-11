const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game"),origin="https://estate.game.local";
const fixture={region:0,stage:6,side:0,day:4,hour:12,introPending:false,asagiTrainDeparted:true,coins:50,energy:100,bag:{"일반 목재":30},homes:{},beds:{},ponds:{},seen:{},pity:{},log:[],savedLocation:{x:180,y:183,heading:0,facing:0,pitch:0,zoom:7}};
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".webp":"image/webp",".glb":"model/gltf-binary"};
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-gpu-shader-disk-cache"]});
 try{
  const page=await browser.newPage({viewport:{width:900,height:720}}),errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.route(origin+"/**",route=>{
   const file=path.join(root,decodeURIComponent(new URL(route.request().url()).pathname));
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
   return route.fulfill({path:file,contentType:types[path.extname(file)]??"application/octet-stream"});
  });
  await page.addInitScript(data=>{
   const raf=requestAnimationFrame.bind(window);
   window.requestAnimationFrame=cb=>cb.name==="loop"?0:raf(cb);
   if(!localStorage.getItem("returning-waters-v1"))localStorage.setItem("returning-waters-v1",JSON.stringify(data));
  },fixture);
  await page.goto(origin+"/index.html");
  await page.waitForFunction(()=>Boolean(graphics&&hammerCatalog["estate-workbench"]),null,{timeout:60000});
  await page.evaluate(()=>{ensureWorld();if(opening.open)finishOpening();});
  await page.keyboard.press("h");
  assert.equal(await page.evaluate(()=>hammer.selected),"estate-workbench");
  await page.keyboard.press("b");
  await page.locator(".hammer-tabs button").nth(2).click();
  assert.equal(await page.locator(".hammer-palette button:enabled").count(),0);
  await page.locator(".hammer-tabs button").first().click();
  await page.locator(".hammer-palette button").click();
  const chosen=await page.evaluate(()=>{
   for(let x=174;x<194;x+=.8)for(let z=171;z<192;z+=.8){
    player={x,y:z-3.1};heading=pitch=0;const p=hammerTarget();
    if(!p.problem)return p;
   }
   return null;
  });
  assert.ok(chosen);
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(()=>estateWorkbench()?.id),"estate-workbench");
  const targets=await page.evaluate(()=>{
   const b=estateWorkbench();
   function test(x,z){player={x,y:z-3.1};return hammerTarget();}
   return {inside:test(b.x+6.4,b.z),outside:test(b.x+27,b.z),arrival:test(b.x,b.z+2.35)};
  });
  assert.equal(targets.inside.problem,"");
  assert.match(targets.outside.problem,/24m/);
  assert.match(targets.arrival.problem,/도착 공간/);
  await page.evaluate(({x,z})=>{player={x,y:z-3.1};},targets.inside);
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(()=>hammerPlaced().filter(p=>p.id==="floor").length),1);
  await page.keyboard.press("m");
  await page.locator(".estate-map-list").screenshot({path:path.join(__dirname,"estate-workbench-review","headless-map-list.png")});
  await page.getByRole("button",{name:"아사기 저택",exact:true}).click();
  const travel=await page.evaluate(()=>({player,arrival:estateArrival(estateWorkbench())}));
  assert.equal(travel.player.x,travel.arrival.x);assert.equal(travel.player.y,travel.arrival.z);
  await page.reload();
  await page.waitForFunction(()=>Boolean(hammerCatalog["estate-workbench"]));
  const restored=await page.evaluate(()=>({player,pieces:hammerPlaced().map(p=>p.id)}));
  assert.deepEqual(restored.pieces,["estate-workbench","floor"]);
  assert.deepEqual(restored.player,travel.player);
  assert.deepEqual(errors,[]);
  const result={chosen,targets,travel,restored};
  fs.writeFileSync(path.join(__dirname,"estate-workbench-review","headless-test.json"),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});