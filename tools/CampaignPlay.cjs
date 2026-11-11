const fs=require("node:fs"),path=require("node:path");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.resolve(process.env.CAMPAIGN_ROOT??path.join(__dirname,"game"));
const out=path.join(__dirname,"comparison","campaign-playthrough");
fs.mkdirSync(out,{recursive:true});
const origin="https://game.returningwaters.local";
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".glb":"model/gltf-binary"};
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--enable-gpu","--use-angle=d3d11","--disable-background-timer-throttling","--disable-gpu-shader-disk-cache"]});
 try{
  const page=await browser.newPage({viewport:{width:720,height:450}});
  page.on("pageerror",e=>console.error("PAGE",e.stack));
  page.on("console",m=>{if(m.type()==="error")console.error(m.text().slice(0,500));});
  await page.route("**/*",route=>{
   const url=new URL(route.request().url()),file=path.join(root,decodeURIComponent(url.pathname));
   if(url.origin!==origin||!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
   return route.fulfill({path:file,contentType:types[path.extname(file)]??"application/octet-stream"});
  });
  await page.addInitScript(()=>localStorage.setItem("returning-waters-render-quality","0"));
  await page.goto(origin+"/index.html");
  await page.waitForFunction(()=>typeof opening!=="undefined"&&opening.open&&!!window.soilOpening?.sample,{},{timeout:120000});
  console.log("Opening started");
  console.log("GPU",await page.evaluate(()=>{const ext=gl.getExtension("WEBGL_debug_renderer_info");return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null;}));
  await page.waitForFunction(()=>!opening.open&&Boolean(s.soilCampaign?.step),{},{timeout:600000,polling:1500});
  console.log("Opening completed naturally",await page.evaluate(()=>({region:s.region,step:s.soilCampaign.step,player,day:s.day})));

  let revision=0;
  const commandFile=path.join(out,"commands.json");
  for(;;){
   await new Promise(r=>setTimeout(r,350));
   if(!fs.existsSync(commandFile))continue;
   let command;
   try{command=JSON.parse(fs.readFileSync(commandFile,"utf8"));}catch{continue;}
   if(command.revision<=revision)continue;
   revision=command.revision;
   try{
    let value;
    if(command.type==="quit")break;
    if(command.type==="key")value=await page.keyboard.press(command.key);
    if(command.type==="click")value=await page.locator(command.selector).click();
    if(command.type==="read")value=await page.evaluate(command.expression);
    if(command.type==="shot")value=await page.screenshot({path:path.join(out,command.name+".png")}).then(()=>command.name);
    if(command.type==="move"){
     await page.keyboard.down(command.key);
     try{await page.waitForTimeout(command.milliseconds);}finally{await page.keyboard.up(command.key);}
    }
    console.log("COMMAND",revision,JSON.stringify(value??null));
   }catch(error){console.error("COMMAND",revision,error.message);}
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});