const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game");
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".glb":"model/gltf-binary"};
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:800}});
  const failures=[];
  page.on("pageerror",error=>failures.push(error.stack));
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
  const capture=async name=>{
   await page.locator("#dialogBody").waitFor({state:"visible"});
   await page.locator("#dialogBody img").evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
   await page.locator("#dialog").screenshot({path:path.join(out,name+".png")});
  };
  await page.evaluate(()=>{
   if(opening.open)finishOpening();
   s.introPending=false;s.stage=6;s.region=1;
   s.karukAct={phase:"departure",plan:"wait",kits:4,villages:{0:2,1:3}};
   addDishBatch(regionalDishById["dish-4-3"]);
   expeditionProvisionMenu();
  });
  await capture("expedition-before");
  await page.getByRole("button",{name:"1인분 포장"}).click();
  await page.evaluate(()=>{
   const saved=readSave(autoSaveKey).state;
   if(count("dish-4-3")!==2||saved.bag["dish-4-3"]!==2||saved.karukAct.kits!==5||saved.karukAct.packedFood["dish-4-3"]!==1)throw Error("Expedition screenshot state");
  });
  await capture("expedition-after");
  await page.evaluate(()=>{
   resumeGameplay();
   s.region=7;s.karukAct.phase="done";
   s.winterCampaign={phase:"done",ending:{regions:Array.from({length:8},(_,id)=>({id,food:1,shortage:id===7?2:0,seeds:3,workers:1}))}};
   addDishBatch(regionalDishById["dish-2-1"]);
   winterAftercare();
  });
  await capture("relief-before");
  await page.getByRole("button",{name:/보리 고기 스튜.*1인분 지원/}).click();
  await page.evaluate(()=>{
   const saved=readSave(autoSaveKey).state,record=saved.winterCampaign.ending.regions[7];
   if(count("dish-2-1")!==1||saved.bag["dish-2-1"]!==1||record.food!==2||record.shortage!==1||record.seeds!==3)throw Error("Relief screenshot state");
  });
  await capture("relief-after");
  assert.deepEqual(failures,[]);
  console.log("Captured four real game states; checked inventory and saved ledgers.");
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
