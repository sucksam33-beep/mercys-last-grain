const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"mercy-native","game");
const title="Mercy\u2019s Last Grain",tagline="The year we won, the harvest failed.";
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.addInitScript(()=>{
   const host=new EventTarget();
   host.postMessage=message=>{
    if(message.op==="state")queueMicrotask(()=>host.dispatchEvent(new MessageEvent("message",{data:{type:"state",nickname:"플레이어",saved:true,location:"산타 루시아",day:17}})));
   };
   Object.defineProperty(window.chrome,"webview",{value:host});
  });
  const origin="https://game.returningwaters.local",types={".html":"text/html",".js":"text/javascript",".css":"text/css",".jpg":"image/jpeg"};
  await page.route("**/*",route=>{
   const url=new URL(route.request().url()),file=path.join(root,decodeURIComponent(url.pathname));
   if(url.origin!==origin||!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
   return route.fulfill({path:file,contentType:types[path.extname(file)]??"application/octet-stream"});
  });
  await page.goto(origin+"/desktop.html");
  await page.locator("#continue").waitFor();
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.title(),title);
  assert.equal(await page.locator("#official-title").textContent(),title);
  assert.equal(await page.locator(".title-tagline").textContent(),tagline);
  await page.screenshot({path:path.join(__dirname,"comparison","mercy-start-screen.png")});
  const layouts=[];
  for(const width of [1280,840,480,360]){
   await page.setViewportSize({width,height:700});
   const fit=await page.evaluate(()=>{
    const heading=document.querySelector("#official-title"),tag=document.querySelector(".title-tagline"),actions=document.querySelector("#continue");
    const line=[heading,tag,actions].map(x=>x.getBoundingClientRect());
    return {width:innerWidth,scroll:document.documentElement.scrollWidth,ends:line.map(x=>x.right),menuBottom:line[2].bottom};
   });
   assert.ok(fit.ends.every(x=>x<=width)&&fit.scroll<=width&&fit.menuBottom<=700);
   layouts.push(fit);
  }
  await page.locator('[data-open=settings]').click();
  await page.locator("#panel").waitFor();
  await page.keyboard.press("Escape");
  await page.keyboard.press("ArrowDown");
  assert.equal(await page.evaluate(()=>document.activeElement.tagName),"BUTTON");
  await page.evaluate(()=>{
   window.testPad=-1;
   Object.defineProperty(navigator,"getGamepads",{configurable:true,value:()=>[{connected:true,buttons:Array.from({length:14},(_,i)=>({pressed:i===testPad})),axes:[0,0]}]});
   document.querySelector("[data-open=settings]").focus();
   window.testPad=0;
  });
  await page.locator("#panel").waitFor();
  await page.evaluate(()=>{window.testPad=1;});
  await page.locator("#panel").waitFor({state:"hidden"});
  console.log("Desktop, narrow, keyboard, mouse, and emulated gamepad checks",JSON.stringify(layouts));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});