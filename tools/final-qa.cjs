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
 const report=await page.evaluate(()=>{
  if(opening.open)finishOpening();
  s.introPending=false;
  
  const placements=[],all=[];
  function roadAccess(x,z){
   const step=3,reach=115,queue=[[x,z,supportAt(x,z)]],seen=new Set(["0,0"]);
   for(let i=0;i<queue.length&&i<6500;i++){
    const [a,b,y]=queue[i];
    if(roadDist(a,b)<=4||openWorldGround(s.region,a,b,y).road>.75)return true;
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
     const px=a+dx*step,pz=b+dz*step,ix=Math.round((px-x)/step),iz=Math.round((pz-z)/step),key=ix+","+iz;
     if(seen.has(key)||Math.hypot(ix,iz)*step>reach||px<4||px>636||pz<12||pz>412)continue;
     const next=supportAt(px,pz,y);
     if(next===null||next<1.7||Math.abs(next-y)>.9||unobstructed({x:a,y:b,floor:y},{x:px,y:pz})===null)continue;
     seen.add(key);queue.push([px,pz,next]);
    }
   }
   return false;
  }
  for(let region=0;region<8;region++){
   s.region=region;player={x:93,y:118};loadedScene="";ensureWorld();
   const groups=timberGroups.filter(g=>g.region===region);
   for(const group of groups){
    const points=group.nodes.map(n=>{
     const action=aimObjects.find(o=>o.action?.id===n.id)?.action;
     if(!action)return null;
     const {x,z}=action;
     const accessible=[0,1,2,3,4,5,6,7].some(i=>{
      const a=x+Math.cos(i*Math.PI/4)*2,b=z+Math.sin(i*Math.PI/4)*2,base=supportAt(a,b);
      return base!==null&&unobstructed({x:a,y:b,floor:base},{x,y:z})!==null;
     });
     return {id:n.id,x,z,accessible,road:roadAccess(x,z)};
    });
    placements.push({region,group:group.label,species:group.species,grade:group.grade,points});
   }
   all.push(aimObjects.filter(o=>o.action?.type==="timberGrade").length);
  }
  const migrate={bag:{"삼나무":3,"유럽참나무":5,"선별 편백":2,"고급 종이자작나무":1,"방수 널판":2},reservedTimber:{repair:{"편백":2}},crafting:{wear:{"손도끼":67}}};
  migrateTimber(migrate);const first=JSON.stringify(migrate);migrateTimber(migrate);
  const migrates=JSON.stringify(migrate)===first&&migrate.bag.timber_log===8&&migrate.bag.timber_quality===2&&migrate.bag.timber_premium===1&&migrate.bag["방수 널판"]===2&&migrate.reservedTimber.repair.timber_log===2&&migrate.crafting.wear["손도끼"]===67;
  const recipes=Object.values(craftRecipes).filter(r=>r.needs.some(([id])=>id.startsWith("timber_"))).length;
  return {placements,all,migrates,recipes,grades:timberGrades.map(g=>g.id),error:gl.getError()};
 });
 fs.writeFileSync(path.join(__dirname,"comparison","timber-placement-check.json"),JSON.stringify(report,null,2));
 console.log("Placement",report.all,"recipes",report.recipes,"migration",report.migrates);
 assert.equal(report.placements.length,24);
 assert.equal(report.all.reduce((a,b)=>a+b,0),80);
 assert.ok(report.migrates);
 assert.equal(report.error,0);
 const bad=report.placements.flatMap(g=>g.points.filter(p=>!p?.accessible));
 
 console.log("Local approach failures",JSON.stringify(bad));
 console.log("Road failures",report.placements.flatMap(g=>g.points.filter(p=>!p?.road).map(p=>p?.id)));
 assert.equal(bad.length,0);assert.ok(report.placements.every(g=>g.points.every(p=>p.road)));
 const play=await page.evaluate(()=>{
  const test=[];
  function harvest(region,grade,tool){
   s.region=region;player={x:93,y:118};loadedScene="";ensureWorld();
   const group=timberGroups.find(g=>g.region===region&&g.grade===grade);
   const id=group.nodes[0].id,action=aimObjects.find(o=>o.action?.id===id).action;
   player={x:action.x-1.45,y:action.z};walkedFrom=null;toolMotion=null;
   const material=timberGrades[grade-1];
   const before=count(material.id);aimTarget={action};
   interactWithAim();
   if(toolMotion){simulationTime=toolMotion.contact+.01;stepToolMotion();toolMotion=null;}
   test.push({region,grade,tool,yield:count(material.id)-before,renew:s.worldHarvest?.[id]-s.day});
   return action;
  }
  s=fresh();migrateTimber(s);s.introPending=false;s.energy=100;
  const common=harvest(0,1);
  give("손도끼",1);harvest(0,2,"손도끼");
  const bench=craftStationPositions[0][0];player={x:bench[0],y:bench[1]};
  give("고철",2);const forestry=craftMake("벌목 도끼","bench");harvest(0,3,"벌목 도끼");
  player={x:bench[0],y:bench[1]};give("철재",2);
  const reinforced=craftMake("강화 벌목 도끼","bench");
  for(const region of [3,4,6,7])harvest(region,4,"강화 벌목 도끼");
  const before=s.worldHarvest[common.id],roundTrip=JSON.parse(JSON.stringify(s));
  const renewed=roundTrip.worldHarvest[common.id]===before;
  s=roundTrip;s.region=0;s.day=before;loadedScene="";player={x:common.x-1,y:common.z};ensureWorld();
  const initial=count("timber_common");aimTarget={action:common};
  interactWithAim();interactWithAim();
  const once=count("timber_common")-initial===2&&s.worldHarvest[common.id]===s.day+2;
  s.reservedTimber={repair:{timber_log:count("timber_log")}};
  const protects=!timberCost([["timber_log",1]])&&Boolean(timberCost([["timber_log",1]],true));
  timberCodex();const codex=$("dialogBody").textContent.includes("감나무집 뒤 삼나무 숲 가장자리");
  
  $("dialog").close();
  s.reservedTimber={};s.stage=6;s.region=0;
  const catalogue=Object.values(craftRecipes).filter(r=>r.tier);
  const tierFive=catalogue.find(r=>r.tier===5&&r.needs.some(([id])=>id==="timber_premium"));
  const tested=[];
  for(const id of ["기본 작업대","수차 목재 부품","정밀 수문틀","대형 선박 용골",tierFive.id]){
   const recipe=craftRecipes[id];
   for(const [part,n] of recipe.needs)if(timberFree(part)<n)give(part,n-timberFree(part));
   const before=count(id);
   player={x:bench[0],y:bench[1]};
   tested.push([id,craftMake(id,"bench")&&count(id)-before===recipe.output]);
  }
  const needs=[["timber_log",2]];
  s.bag.timber_log=0;s.bag.timber_quality=3;
  let approved=null;timberConfirm(needs,cost=>{approved=cost;},()=>{});
  const prior=count("timber_quality");
  const button=[...$("dialogBody").querySelectorAll("button")].find(b=>b.textContent==="표시된 재료 사용");
  const unchanged=approved===null&&count("timber_quality")===prior;
  button.click();$("dialog").close();
  const manual=unchanged&&approved[0][0]==="timber_quality"&&approved[0][1]===2;
  s.soilCampaign=SoilCampaign.state();s.soilCampaign.routes[0]=s.soilCampaign.routes[1]=true;
  const commonBefore=count("timber_common");
  if(!commonBefore)give("timber_common",1);
  const cargoStart=count("timber_common");
  timberShipMenu();
  const dispatch=[...$("dialogBody").querySelectorAll("button")].find(b=>b.textContent==="발송");
  dispatch.click();
  const shipped=count("timber_common")===cargoStart-1&&s.timberShipments.length===1;
  s.region=1;s.day++;
  timberShipMenu();
  [...$("dialogBody").querySelectorAll("button")].find(b=>b.textContent==="수령").click();
  const received=count("timber_common")===cargoStart&&s.timberShipments.length===0;
  $("dialog").close();
  s.region=0;s.soilCampaign=null;
  const road=worldRoads[0].find(r=>r.to===1);
  player={x:road.edge[0]+1.25,y:road.edge[1]};loadedScene="";ensureWorld();
  heading=facing=-Math.PI/2;keys.add("w");
  for(let i=0;i<100&&s.region===0;i++)updateLocomotion(.044);
  keys.clear();
  return {test,forestry,reinforced,renewed,once,protects,codex,catalogue:catalogue.length,tested,manual,shipped,received,keyCrossing:s.region===1};
 });
 console.log("Gameplay",JSON.stringify(play));
 assert.ok(play.forestry&&play.reinforced&&play.renewed&&play.once&&play.protects&&play.codex);
 assert.ok(play.test.every(t=>t.yield===[2,4,3,2][t.grade-1]&&t.renew===[2,7,12,20][t.grade-1]));
 assert.equal(play.catalogue,100);assert.ok(play.tested.every(([,ok])=>ok));assert.ok(play.manual&&play.shipped&&play.received&&play.keyCrossing);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});