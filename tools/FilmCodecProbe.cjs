const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--enable-gpu","--use-angle=d3d11"]});
 try{const page=await browser.newPage();console.log(await page.evaluate(()=>["video/mp4;codecs=avc1.420034","video/mp4;codecs=avc1.640028","video/mp4","video/webm;codecs=vp9"].map(m=>[m,MediaRecorder.isTypeSupported(m)])));}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});