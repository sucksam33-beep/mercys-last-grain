const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const game=path.join(__dirname,"game"),out=path.join(__dirname,"regional-food-delivery");
const items=vm.runInNewContext(fs.readFileSync(path.join(game,"RegionalFoodData.js"),"utf8")+"\n[...regionalDishes,...regionalIngredients]");
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
 try{
  const page=await browser.newPage();
  await page.route("https://food-art.local/**",route=>{
   const file=new URL(route.request().url()).pathname;
   if(file==="/art.mjs")return route.fulfill({path:path.join(__dirname,"RegionalFoodArtwork.mjs"),contentType:"text/javascript"});
   return route.fulfill({contentType:"text/html",body:'<!doctype html><script type="module">import {renderFood} from "/art.mjs";const c=document.createElement("canvas");c.width=c.height=256;window.paint=(item,i)=>renderFood(c,item,i);</script>'});
  });
  await page.goto("https://food-art.local/");
  await page.waitForFunction(()=>typeof window.paint==="function");
  const hashes=new Set();
  for(const [i,item] of items.entries()){
   const png=Buffer.from(await page.evaluate(([item,i])=>window.paint(item,i),[item,i]),"base64");
   assert.equal(png.readUInt32BE(16),256);assert.equal(png.readUInt32BE(20),256);assert.equal(png[25],6);
   const hash=crypto.createHash("sha256").update(png).digest("hex");assert.ok(!hashes.has(hash));hashes.add(hash);
   fs.writeFileSync(path.join(game,item.icon),png);
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,"regional-food-manifest.json"),JSON.stringify(items,null,2));
 console.log(items.length+" RGBA icons verified");
})().catch(e=>{console.error(e);process.exitCode=1;});
