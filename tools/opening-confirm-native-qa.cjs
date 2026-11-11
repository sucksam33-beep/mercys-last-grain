const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const {once}=require("node:events");
const root=__dirname, out=path.join(root,"comparison");
fs.mkdirSync(out,{recursive:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,ms=90000){
 const deadline=Date.now()+ms;let error;
 while(Date.now()<deadline){try{const value=await fn();if(value)return value;}catch(e){error=e;}await delay(200);}
 throw Error(label+(error?" "+error.stack:""));
}
async function verify(name,dir,port){
 const data=fs.mkdtempSync(path.join(root,"qa-"+name+"-"));
 const cp=spawn(path.join(dir,"ReturningWaters.exe"),[],{env:{...process.env,TEMP:data,TMP:data,RETURNING_WATERS_DATA:data,WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS:"--remote-debugging-port="+port+" --disk-cache-size=1048576 --disable-gpu-shader-disk-cache"}});
 let ws;
 try{
  const tab=await until(async()=> (await (await fetch("http://127.0.0.1:"+port+"/json")).json()).find(t=>t.url.endsWith("/desktop.html")),"desktop target");
  ws=new WebSocket(tab.webSocketDebuggerUrl);await once(ws,"open");
  let id=0;
  const exceptions=[];
  const send=(method,params={})=>new Promise((resolve,reject)=>{
   const seq=++id; const timeout=setTimeout(()=>reject(Error("CDP timeout "+method)),30000);
   const handle=e=>{const data=JSON.parse(e.data);if(data.id!==seq)return;clearTimeout(timeout);ws.removeEventListener("message",handle);data.error?reject(Error(data.error.message)):resolve(data.result);};
   ws.addEventListener("message",handle);ws.send(JSON.stringify({id:seq,method,params}));
  });
  ws.addEventListener("message",e=>{const event=JSON.parse(e.data);if(event.method==="Runtime.exceptionThrown"){const ex=event.params.exceptionDetails;const msg=ex.exception?.description||ex.text;if(!exceptions.includes(msg)){exceptions.push(msg);console.error(name,msg);}}});
  const run=async expression=>{
   const result=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
   if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
   return result.result.value;
  };
  const shot=async file=>{
   const shot=await send("Page.captureScreenshot",{format:"png"});
   assert.ok(shot.data.length>45000,file+" capture");
   fs.writeFileSync(path.join(out,name+"-"+file+".png"),Buffer.from(shot.data,"base64"));
  };
  console.log(name,"attached"); await send("Runtime.enable"); console.log(name,"enabled");


  await until(()=>run("document.querySelector('#guest')?.hidden===false"),"guest menu");
  await run("document.querySelector('[data-open=register]').click();document.querySelector('#id').value='film_qa';document.querySelector('#password').value='Sample-QA-123';document.querySelector('#nick').value='QA';document.querySelector('#form').requestSubmit()");
  await until(()=>run("document.querySelector('#player')?.hidden===false"),"QA profile");
  await run("document.querySelector('#new').click()");
  const status=await until(()=>run("location.pathname==='/index.html'&&(()=>{const v=document.querySelector('#soil-opening-film');return v?.currentTime>1&&{width:v.videoWidth,height:v.videoHeight,time:v.currentTime,paused:v.paused,duration:v.duration};})()"),"native WebView2 video starts",120000);
  assert.equal(await run("!!document.querySelector('#opening-skip')"),false);
  const key=key=>run("window.dispatchEvent(new KeyboardEvent('keydown',{key:"+JSON.stringify(key)+",cancelable:true}))");
  const isOpen=()=>run("openingConfirm.open");
  await key("Escape");assert.equal(await isOpen(),false);
  await key("Enter");
  assert.equal(await run("openingConfirm.open && openingConfirm.querySelector('h2').textContent==='영상을 스킵 하시겠습니까?' && window.soilOpening.video.paused"),true);
  await key("Escape");assert.equal(await isOpen(),false);
  await until(()=>run("!window.soilOpening.video.paused"),"resume after Escape");
  await key("Enter");await run("document.querySelector('#opening-confirm-no').click()");
  assert.equal(await isOpen(),false);
  await run("window.qaButtons=Array(17).fill(false);Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[{index:0,connected:true,axes:[0,0,0,0],buttons:qaButtons.map(pressed=>({pressed,value:Number(pressed)}))}]})");
  const padButton=(index,down)=>run("qaButtons["+index+"]="+down+";pollPad(.016)");
  await padButton(0,true);assert.equal(await isOpen(),true);
  await padButton(0,true);assert.equal(await isOpen(),true);
  await padButton(0,false);await padButton(1,true);assert.equal(await isOpen(),false);
  await padButton(1,false);await padButton(0,true);await padButton(0,false);
  await padButton(0,true);assert.equal(await run("!opening.open && s.soilCampaign.step==='guard'"),true);
  await padButton(0,false);
  await key("i");
  assert.equal(await run("document.querySelector('#dialogTitle').textContent"),"월터 보스");
  await run("document.querySelector('#dialog').close();playOpening(true)");
  await until(()=>run("window.soilOpening?.video.currentTime>0.2"),"replay starts");
  await key("Enter");assert.equal(await isOpen(),true);
  await key("Enter");assert.equal(await run("!opening.open"),true);
  await run("gameMenu();document.querySelector('#dialogBody button:nth-child(10)').click()");
  await until(()=>run("document.querySelector('#manual-save-feedback')?.dataset.uiState==='success'"),"manual save",30000);
  const previous=await run("({step:s.soilCampaign.step,region:s.region,position:player})");
  await run("gameNative('title')");
  await until(()=>run("location.pathname==='/desktop.html' && document.querySelector('#continue')?.hidden===false"),"continue menu",45000);
  await run("document.querySelector('#continue').click()");
  await until(()=>run("location.pathname==='/index.html' && typeof s!=='undefined' && s.soilCampaign?.step==='guard' && !opening.open"),"continued save",90000);
  const continued=await run("({step:s.soilCampaign.step,region:s.region,position:player})");
  assert.deepEqual(continued,previous);
  assert.deepEqual(exceptions,[]);
  console.log("Skip confirmation keyboard, mouse, simulated gamepad, profile, and save reload passed",JSON.stringify(continued));
 }finally{ws?.close();cp.kill();}
}
verify("still-film",path.join(root,"dialogue-opening-stage"),9776).catch(e=>{console.error(e);process.exitCode=1;});
