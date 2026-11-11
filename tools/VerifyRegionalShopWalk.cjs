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
  await page.evaluate(()=>{
   if(opening.open)finishOpening();
   s.introPending=false;s.stage=6;s.coins=1500;loadedScene="";ensureWorld();
   window.visitFoodShop=(region,kind)=>{
    if(s.region!==region)travel(region);
    if(s.region!==region)throw Error("Travel failed "+region);
    ensureWorld();
    const shop=regionalShops.find(shop=>shop.region===region&&shop.kind===kind),site=regionalFoodLocations()[shop.id];
    if(!site)throw Error("Missing site "+shop.name);
    const sight=(x,z,y)=>{
     const origin=[x,y+1.60,z];
     for(const h of [.85,.55,1.08]){
      const hit=pickAimObject(origin,unit([site.x-x,site.y+h-origin[1],site.z-z]));
      if(hit?.action?.id===shop.id)return hit;
     }
    };
    const options=[];
    for(const radius of [2.5,3.1,1.8])for(let i=0;i<12;i++){
     const angle=i*Math.PI/6,x=site.x+Math.cos(angle)*radius,y=site.z+Math.sin(angle)*radius,floor=supportAt(x,y,site.y);
     if(floor!==null&&sight(x,y,floor))options.push({x,y,floor});
    }
    options.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
    let route=null;
    for(const goal of options.slice(0,8)){
     route=detourTo(goal);
     if(route)break;
    }
    if(!route)throw Error("No walk route to "+shop.name+" from "+JSON.stringify(player)+" candidates "+options.length);
    const [first,...rest]=route;
    const origin={...player};
    marker={id:selected??"station",...first,route:rest};target=null;
    let distance=0,steps=0;
    while(marker&&steps++<4500){
     const before={...player};updateLocomotion(.045);
     distance+=Math.hypot(before.x-player.x,before.y-player.y);
    }
    const hit=sight(player.x,player.y,playerSupport());
    if(!hit||!actionInReach(hit.action))throw Error("Cannot aim after walking to "+shop.name+" from "+JSON.stringify(origin)+" stopped "+JSON.stringify(player)+" distance "+distance);
    aimTarget=hit;
    interact();
    if(!$("dialog").open||$("dialogTitle").textContent!==shop.name)throw Error("Counter UI "+shop.name);
    const item=regionalShopItems(shop).find(id=>regionalShopQuote(shop,id).quantity>0);
    const quote=regionalShopQuote(shop,item);
    return {shop:shop.name,id:shop.id,item,price:quote.price,stock:quote.quantity,before:count(item),coins:s.coins,distance:Math.round(distance*10)/10};
   };
  });
  const visits=[];
  for(const region of [0,1,2,3,4,7,4,1,5,6]){
   if(visits.some(v=>v.region===region)){await page.evaluate(region=>{travel(region);ensureWorld()},region);continue;}
   for(const kind of [0,1,2]){
    const info=await page.evaluate(([r,k])=>window.visitFoodShop(r,k),[region,kind]);
    const row=page.locator("#dialogBody .food-shop-row").filter({has:page.getByRole("spinbutton",{name:info.item+" 구매 수량",exact:true})});
    await row.getByRole("button",{name:"구매",exact:true}).click();
    await page.evaluate(info=>{
     const shop=regionalShops.find(s=>s.id===info.id);
     if(count(info.item)!==info.before+1||s.coins!==info.coins-info.price||regionalShopQuote(shop,info.item).quantity!==info.stock-1)throw Error("Purchase "+info.shop);
     const saved=readSave(autoSaveKey).state;
     if(saved.bag[info.item]!==info.before+1||saved.regionalFood.stock[info.id].sold[info.item]<1)throw Error("Saved purchase "+info.shop);
     resumeGameplay();
    },info);
    visits.push({...info,region,kind});
    console.log("Visited and traded",info.shop,info.distance+"m");
   }
  }
  assert.equal(visits.length,24);
  const supplies=await page.evaluate(()=>{
   const check=(ok,msg)=>{if(!ok)throw Error(msg);};
   travel(5);travel(1);
   check(s.region===1,"Expedition travel");
   s.karukAct={phase:"departure",kits:4,villages:{0:2,1:3},plan:"wait"};
   const preserved=regionalDishById["dish-4-3"],warm=regionalDishById["dish-3-2"],shared=regionalDishById["dish-2-1"];
   addDishBatch(preserved);addDishBatch(shared);
   check(!packExpeditionFood(warm.id)&&!packExpeditionFood(shared.id),"Ineligible packing");
   check(packExpeditionFood(preserved.id)&&s.karukAct.kits===5&&count(preserved.id)===2,"Pack");
   const originalSave=autosave;
   autosave=()=>false;
   try{check(!packExpeditionFood(preserved.id)&&s.karukAct.kits===5&&count(preserved.id)===2,"Packing rollback");}
   finally{autosave=originalSave;}
   s.reservedTimber={qa:{[preserved.id]:2}};
   check(!packExpeditionFood(preserved.id),"Reserved rations");
   delete s.reservedTimber;
   check(readSave(autoSaveKey).state.karukAct.packedFood[preserved.id]===1,"Saved packing");
   expeditionDepart();
   check(s.region===7&&s.karukAct.phase==="front"&&s.karukAct.kits===5,"Departure takes packed supplies");
   expeditionStart();
   check(s.karukAct.battle.kits===5,"Battle receives packed kits");
   s.karukAct.phase="done";
   s.winterCampaign={phase:"aftercare",ending:{regions:Array.from({length:8},(_,id)=>({id,food:1,shortage:id===7?1:0,seeds:3,workers:1}))}};
   const expired=regionalDishById["dish-1-2"];addDishBatch(expired);foodState().batches[expired.id][0].expires=foodClock();
   check(!deliverWinterRelief(expired.id),"Expired relief");
   autosave=()=>false;
   try{check(!deliverWinterRelief(shared.id)&&s.winterCampaign.ending.regions[7].shortage===1&&count(shared.id)===2,"Relief rollback");}
   finally{autosave=originalSave;}
   check(deliverWinterRelief(shared.id)&&!deliverWinterRelief(shared.id),"Relief only until shortage filled");
   const after=readSave(autoSaveKey).state;
   check(after.winterCampaign.ending.regions[7].food===2&&after.winterCampaign.ending.regions[7].shortage===0&&after.winterCampaign.ending.regions[7].seeds===3&&after.bag[shared.id]===1,"Relief saved together");
   return {kits:5,relief:1,rollback:true,reserves:true};
  });
  assert.deepEqual(failures,[]);
  fs.writeFileSync(path.join(__dirname,"regional-food-delivery","shop-trade-qa.json"),JSON.stringify({visits,supplies},null,2));
  console.log(JSON.stringify({visited:visits.length,supplies}));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
