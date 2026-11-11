const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {pathToFileURL}=require("node:url");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const folder=path.resolve(process.env.OPENING_FRAME_DIR??path.join(__dirname,"dialogue-cinematic"));
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--enable-gpu","--use-angle=d3d11"]});
 try{
  const page=await browser.newPage({viewport:{width:960,height:540}});
  await page.goto(pathToFileURL(path.join(folder,"Mercys-Last-Grain-Opening-Dialogue.mp4")).href);
  await page.waitForFunction(()=>document.querySelector("video")?.readyState>=2);
  const metadata=await page.evaluate(()=>{
   const v=document.querySelector("video");v.pause();
   return {width:v.videoWidth,height:v.videoHeight,duration:v.duration};
  });
  assert.equal(metadata.width,1920);assert.equal(metadata.height,1080);
  assert.ok(Math.abs(metadata.duration-141.8)<2,JSON.stringify(metadata));
  const timeline=JSON.parse(fs.readFileSync(path.join(__dirname,"dialogue-cinematic","dialogue.json"),"utf8"));
  for(const time of [...timeline.scenes.map(shot=>+(shot.start+shot.duration/2).toFixed(2)),139.4]){
   await page.evaluate(async time=>{
    const video=document.querySelector("video");
    await new Promise((resolve,reject)=>{
     video.addEventListener("seeked",resolve,{once:true});video.addEventListener("error",reject,{once:true});video.currentTime=time;
    });
    video.controls=false;
   },time);
   await page.screenshot({path:path.join(folder,"qa-"+time+".jpg"),type:"jpeg",quality:91});
  }
  console.log(metadata);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
