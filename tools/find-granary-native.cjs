const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const {once}=require("node:events");
const root=__dirname, out=path.join(root,"reference-architecture-comparison");
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
  await run("finishOpening();ensureWorld()");
  const sites=await run(`(()=>{
   const choices=[];
   for(let x=124;x<=285;x+=3)for(let z=134;z<=228;z+=3){
    if(buildingFootprints.some(p=>Math.abs(x-p.x)<p.w*.5+10.6&&Math.abs(z-p.z)<p.d*.5+7.9))continue;
    if(asagiPaddies.some(p=>Math.abs(x-p.x)<p.w*.5+11&&Math.abs(z-p.z)<14))continue;
    if(roadDist(x,z)<9||districtConnectionDistance(0,x,z)<15)continue;
    const ys=[];
    for(const dx of [-9,0,9])for(const dz of [-6,0,6,11])ys.push(terrainSurface(x+dx,z+dz));
    const floor=Math.max(...ys),spread=floor-Math.min(...ys),face=terrainSurface(x,z+11),road=roadDist(x,z+11);
    if(Math.min(...ys)<2.3||spread>2.35||road>16)continue;
    choices.push({x,z,spread,face,road,score:spread*8+Math.hypot(x-161,z-162)*.22+road*.22});
   }
   return choices.sort((a,b)=>a.score-b.score).slice(0,12);
  })()`);
  console.log(JSON.stringify(sites));
 }finally{ws?.close();cp.kill();}
}
const after=process.argv[2]==="after"; verify(after?"after":"before",after?path.join(root,"reference-architecture-stage"):root,after?9803:9800).catch(e=>{console.error(e);process.exitCode=1;});
