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
  await until(()=>run("!document.querySelector('#guest')?.hidden"),"guest");
  console.log(name,"guest"); await shot("title"); console.log(name,"title capture");
  await run("document.querySelector('[data-open=register]').click();document.querySelector('#id').value='world_qa';document.querySelector('#password').value='Sample-QA-123';document.querySelector('#nick').value='QA';document.querySelector('#form').requestSubmit()");
  await until(()=>run("!document.querySelector('#player')?.hidden"),"profile");
  const save={region:0,stage:6,side:0,day:3,hour:13,introPending:false,asagiTrainDeparted:true,coins:100,energy:100,bag:{},homes:{},beds:{},ponds:{},seen:{},pity:{},log:[]};
  await run("chrome.webview.postMessage({op:'import',data:"+JSON.stringify(JSON.stringify(save))+"})");
  await until(()=>run("document.querySelector('#summary')?.textContent?.includes('3일차')"),"save import");
  await run("document.querySelector('#continue').click()");
  await until(()=>run("location.pathname==='/index.html'&&loadedScene&&lastWorldFrame>0"),"game ready");
  await run("railMap()");
  await delay(350);await shot("map");
  await run("$('dialog').close();player={x:29,y:198};walkedFrom=null;heading=-Math.PI/2;facing=heading;pitch=.05;zoom=10;");
  await delay(850);await shot("valley");
  if(name==="after"){
   const checks=await run("(()=>{const checks=[];for(const [a,b] of worldLinks)for(const [from,to] of [[a,b],[b,a]]){s.region=from;const road=worldRoads[from].find(r=>r.to===to);const [x,z]=road.edge;player={x:x-road.x*.85,y:z-road.z*.85};walkedFrom=null;ensureWorld();let steps=0;while(s.region===from&&steps++<12)moveOnSurfaces(road.x*.16,road.z*.16);checks.push([from,to,s.region,gl.getError(),steps]);}return checks;})()");
   console.log("Crossings",JSON.stringify(checks));
   assert.equal(checks.length,20);
   assert.ok(checks.every(([,to,actual,error])=>to===actual&&!error),JSON.stringify(checks));
   await run("s.region=0;player={x:11,y:198};walkedFrom=null;ensureWorld();heading=-Math.PI/2;facing=heading;");
   await send("Input.dispatchKeyEvent",{type:"keyDown",key:"w",code:"KeyW",windowsVirtualKeyCode:87});
   await until(()=>run("s.region===1"),"keyboard Asagi to Brunnen",30000);
   await send("Input.dispatchKeyEvent",{type:"keyUp",key:"w",code:"KeyW",windowsVirtualKeyCode:87});
   await shot("crossing");
   assert.deepEqual(exceptions,[]);
  }
 }finally{ws?.close();cp.kill();}
}
(async()=>{
 if(process.argv[2]!=="after")await verify("before",path.join(root,"before"),9721);
 if(process.argv[2]!=="before")await verify("after",root,9732);
})().catch(e=>{console.error(e);process.exitCode=1;});