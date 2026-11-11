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
  console.log("Native playback",JSON.stringify(status));
  assert.equal(status.width,1920);assert.equal(status.height,1080);assert.equal(status.paused,false);
  assert.ok(Math.abs(status.duration-141.8)<2,JSON.stringify(status));
  await run("document.querySelector('#soil-opening-film').currentTime=139.4");
  await until(()=>run("location.pathname==='/index.html'&&typeof s!=='undefined'&&s.soilCampaign?.step==='guard'&&!opening.open"),"natural end and campaign handoff",145000);
  const result=await run("({step:s.soilCampaign.step,region:s.region,position:player,videoEnded:document.querySelector('#soil-opening-film').ended})");
  assert.deepEqual(result,{step:"guard",region:0,position:{x:309,y:348.4},videoEnded:true});
  assert.deepEqual(exceptions,[]);
  console.log("Natural handoff",JSON.stringify(result));
  fs.writeFileSync(path.join(root,"dialogue-cinematic","native-verification.json"),JSON.stringify({status,result},null,2));
 }finally{ws?.close();cp.kill();}
}
verify("still-film",path.join(root,"dialogue-opening-stage"),9773).catch(e=>{console.error(e);process.exitCode=1;});
