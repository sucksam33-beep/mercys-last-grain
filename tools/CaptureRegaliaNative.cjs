const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const {once}=require("node:events");
const root=__dirname, out=path.join(root,"regalia-ornament-review");
fs.mkdirSync(out,{recursive:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,ms=90000){
 const deadline=Date.now()+ms;let error;
 while(Date.now()<deadline){try{const value=await fn();if(value)return value;}catch(e){error=e;}await delay(200);}
 throw Error(label+(error?" "+error.stack:""));
}
async function verify(name,dir,port){
 const data=fs.mkdtempSync(path.join(root,"qa-"+name+"-"));
 const cp=spawn(path.join(dir,"ReturningWaters.exe"),[],{windowsHide:true,env:{...process.env,TEMP:data,TMP:data,RETURNING_WATERS_DATA:data,WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS:"--remote-debugging-port="+port+" --disk-cache-size=1048576 --disable-gpu-shader-disk-cache"}});
 let ws;
 try{
  const tab=await until(async()=> (await (await fetch("http://127.0.0.1:"+port+"/json")).json()).find(t=>t.url.endsWith("/desktop.html")),"desktop target");
  ws=new WebSocket(tab.webSocketDebuggerUrl);await once(ws,"open");
  let id=0;
  const exceptions=[];
  const send=(method,params={})=>new Promise((resolve,reject)=>{
   const seq=++id; const timeout=setTimeout(()=>reject(Error("CDP timeout "+method)),120000);
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
  await until(()=>run("location.pathname==='/index.html' && typeof riggedScene!=='undefined' && !!riggedScene && !!scenery && opening.open"),"native world ready",120000);
  await run("finishOpening();window.soilOpening=null;const photoStyle=document.createElement('style');photoStyle.textContent='.labels3d,.worldHud,.worldControls,.radar,.toast,.game-menu-entry,#quest-subtitle,.caption,.player-temperature {visibility:hidden!important}';document.head.append(photoStyle);window.captureDraw=eval('('+draw.toString().replace('const {eye,at}=soilShot','const {eye,at}=window.regaliaPhoto??(soilShot').replace('{eye:gameEye,at:gameAt};','{eye:gameEye,at:gameAt});')+')');draw=()=>{};");
  const results=[];
  for(let tier=1;tier<=5;tier++){
   const result=await run(`(()=>{s.hour=12;s.day=2;player={x:248,y:211};heading=facing=0;
    const y=playerSupport();window.regaliaPhoto={eye:[249.0,y+1.51,216.0],at:[248,y+1.26,211]};
    craftState().coatTier=${tier};window.captureDraw(12000);
    return {tier:${tier},location:[s.region,player.x,player.y],hour:s.hour,day:s.day,gl:gl.getError(),eye:window.regaliaPhoto.eye};
   })()`);
   assert.equal(result.gl,0);
   await shot("tier-"+tier);results.push(result);console.log(result);
  }
  assert.deepEqual(exceptions,[]);
  fs.writeFileSync(path.join(out,"game-test.json"),JSON.stringify(results,null,2));
 }finally{ws?.close();cp.kill();}
}
verify("game",root,9793).catch(e=>{console.error(e);process.exitCode=1;});