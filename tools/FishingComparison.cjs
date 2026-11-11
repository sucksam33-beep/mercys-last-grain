const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const base=__dirname, root=path.join(base,"game"),origin="https://game.returningwaters.local";
const out=path.join(base,"comparison","campaign-playthrough","fishing-frames");
fs.mkdirSync(out,{recursive:true});
const before=fs.readdirSync(base).filter(f=>/^pre-interaction-motion-.*\.html$/.test(f)).sort().at(-1);
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"};
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--enable-gpu","--use-angle=d3d11"]});
 try{
  const results={};
  for(const phase of ["before","after"]){
   const page=await browser.newPage({viewport:{width:640,height:400}});
   await page.route("**/*",route=>{
    const url=new URL(route.request().url()),p=path.join(root,decodeURIComponent(url.pathname));
    if(url.origin!==origin||!p.startsWith(root+path.sep)||!fs.existsSync(p))return route.abort();
    return route.fulfill({path:phase==="before"&&url.pathname==="/index.html"?path.join(base,before):p,contentType:types[path.extname(p)]??"application/octet-stream"});
   });
   await page.addInitScript(()=>{
    const state={region:0,stage:6,side:0,day:13,hour:13,introPending:false,asagiTrainDeparted:true,coins:32,energy:22,bag:{"낚싯대":1,"민물 채비":1},homes:{},beds:{},ponds:{},seen:{},pity:{},log:[],savedLocation:{x:497.3136657296939,y:267.4003741425973,heading:0,pitch:.08,zoom:6,facing:0}};
    localStorage.setItem("returning-waters-v1",JSON.stringify(state));localStorage.setItem("returning-waters-render-quality","0");
   });
   await page.goto(origin+"/index.html");
   await page.waitForFunction(()=>typeof actionSpot!=="undefined"&&actionSpot==="fish"&&!!riggedScene&&lastWorldFrame>0,{},{timeout:90000});
   await page.evaluate(()=>{aimTarget=null;interact();});
   const button=page.getByRole("button",{name:"얕은 물 낚시",exact:true}).filter({visible:true});
   await button.waitFor();
   await page.screenshot({path:path.join(out,phase+"-0.png"),timeout:20000});
   await button.click();
   for(let i=1;i<=6;i++){
    await page.waitForTimeout(135);
    await page.screenshot({path:path.join(out,phase+"-"+i+".png"),timeout:20000});
   }
   results[phase]=await page.evaluate(()=>({caught:r().fish.flat().reduce((sum,id)=>sum+count(id),0),message:s.log[0]??""}));
   console.log(phase,results[phase]);
   await page.close();
  }
  assert.equal(results.before.caught,0);
  assert.equal(results.after.caught,1);
  fs.writeFileSync(path.join(out,"results.json"),JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});