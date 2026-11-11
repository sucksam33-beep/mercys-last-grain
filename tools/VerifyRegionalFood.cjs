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
  const out=path.join(__dirname,"regional-food-delivery");
  const shot=async name=>{
   await page.locator("#dialogBody img").first().evaluate(img=>img.decode());
   await page.screenshot({path:path.join(out,name+".png")});
  };
  const report=await page.evaluate(()=>{
   const check=(ok,message)=>{if(!ok)throw Error(message)};
   if(opening.open)finishOpening();
   s.introPending=false;s.coins=100;s.stage=6;s.region=0;loadedScene="";ensureWorld();
   for(const dish of regionalDishes)check(dish.needs.every(([id])=>craftItems[id]?.icon),"Recipe "+dish.name);
   check(regionalShops.length===24&&regionalDishes.length===24,"Registry");
   for(const shop of regionalShops)check(shop.items.every(id=>craftItems[id]?.icon),"Stock "+shop.name);
   const grocery=regionalShops[1],at=regionalFoodLocations()[grocery.id];
   check(at,"Asagi grocery");player={x:at.x,y:at.z};
   check(regionalBuy(grocery,"감자",2)&&count("감자")===2&&s.coins===94,"Buy potatoes");
   check(regionalShopQuote(grocery,"감자").quantity===6,"Stock persists");
   check(!regionalBuy(grocery,"감자",7),"Oversell");
   const camp=regionalFoodLocations()["여행솥"];check(camp,"Asagi camp");
   player={x:camp.x,y:camp.z};give("조릿대 잎");give("감자",2);
   check(makeRegionalFood("dish-1-2","여행솥")&&count("dish-1-2")===2,"Cook");
   s.energy=50;check(eatRegionalFood("dish-1-2")&&s.energy===64&&count("dish-1-2")===1,"Eat");
   const saved=readSave(autoSaveKey);check(saved.state.regionalFood.batches["dish-1-2"][0].servings===1,"Saved batch");
   regionalCookingMenu("여행솥");
   return {items:Object.keys(craftItems).length,dishes:regionalDishes.length,shops:regionalShops.length,asagiStock:regionalShopQuote(grocery,"감자").quantity};
  });
  await shot("cooking-in-game");
  await page.evaluate(()=>{const shop=regionalShops[1];regionalShopMenu(shop);});
  await shot("shop-in-game");
  await page.evaluate(()=>{foodCodex();});
  assert.equal(await page.locator("#dialogBody .inventory-slot").count(),24);
  await shot("codex-in-game");
  await page.getByRole("button",{name:"감자 산나물국",exact:true}).click();
  await shot("codex-detail-in-game");
  await page.evaluate(()=>{
   for(const dish of regionalDishes)if(!count(dish.id))addDishBatch(dish);
   for(const ingredient of regionalIngredients)if(!count(ingredient.id))give(ingredient.id);
   satchel();
  });
  assert.equal(await page.locator("#dialogBody .inventory-grid .inventory-slot img[src*='dish-']").count(),24);
  await shot("bag-in-game");
  const additional=await page.evaluate(()=>{
   const check=(ok,message)=>{if(!ok)throw Error(message)};
   resumeGameplay();
   const locations=[];
   for(let region=0;region<8;region++){
    s.region=region;loadedScene="";ensureWorld();
    const spots=regionalFoodLocations();
    locations.push(regionalShops.filter(shop=>shop.region===region&&spots[shop.id]).length);
    check(spots["여행솥"]&&spots["집 화덕"]&&spots["건조대"]&&spots["요리판"],"Stations "+region);
   }
   check(locations.every(n=>n===3),"World shops "+locations.join(","));
   s.region=3;loadedScene="";ensureWorld();
   foodState().learned[3]=true;
   const dry=regionalFoodLocations()["건조대"];player={x:dry.x,y:dry.z};
   const dish=regionalDishById["dish-4-3"],before=count(dish.id);
   for(const [id,n] of dish.needs)give(id,n);
   check(makeRegionalFood(dish.id,"건조대"),"Start dry");
   check(!makeRegionalFood(dish.id,"건조대")&&!collectDriedFood(dish.id),"Duplicate / early");
   s=readSave(autoSaveKey).state;s.day++;
   check(collectDriedFood(dish.id)&&count(dish.id)===before+dish.servings&&!collectDriedFood(dish.id),"Dry after save");
   s.region=1;loadedScene="";ensureWorld();
   const market=regionalShops.find(shop=>shop.region===1&&shop.kind===1),stock=regionalFoodLocations()[market.id];
   player={x:stock.x,y:stock.z};
   s.soilCampaign={step:"blockade",routes:Array(8).fill(false)};
   check(regionalShopQuote(market,"양파").quantity===0&&!regionalBuy(market,"양파",1),"Blockade");
   s.soilCampaign.routes[1]=true;
   check(regionalShopQuote(market,"양파").quantity>0&&regionalBuy(market,"양파",1),"Restored market route");
   const hearth=regionalFoodLocations()["집 화덕"];
   player={x:hearth.x,y:hearth.z};foodState().learned[1]=true;
   const stew=regionalDishById["dish-2-1"],prior=count(stew.id);
   for(const [id,n] of stew.needs)if(timberFree(id)<n)give(id,n-timberFree(id));
   check(makeRegionalFood(stew.id,"집 화덕"),"Hearth stew");
   const person=eligibleFoodResidents()[0];
   check(person&&shareRegionalFood(stew.id,person.id)&&!shareRegionalFood(stew.id,person.id)&&count(stew.id)===prior+1,"Shared serving and daily cap");
   const latest=readSave(autoSaveKey).state;
   check(latest.regionalFood.shared["1:"+person.id].meals.includes(stew.id),"Saved household variety");
   return {locations,dried:true,shared:true,blockade:true};
  });
  assert.deepEqual(failures,[]);
  console.log(JSON.stringify({...report,...additional}));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
