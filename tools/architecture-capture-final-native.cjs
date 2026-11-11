const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const {once}=require("node:events");
const root=__dirname, out=path.join(root,"architecture-comparison");
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
  await run("finishOpening();const photoStyle=document.createElement('style');photoStyle.textContent='.labels3d,.worldHud,.worldControls,.radar,.toast,.game-menu-entry,#quest-subtitle,.caption,.player-temperature {visibility:hidden!important}';document.head.append(photoStyle);draw=eval('('+draw.toString().replace('const {eye,at}=soilShot','const {eye,at}=window.villagePhoto??(soilShot').replace('{eye:gameEye,at:gameAt};','{eye:gameEye,at:gameAt});')+')');");
  const shots=[
   ["asagi",139,166,-27,-39],["brunnen",156,136,34,-43],
   ["santa-lucia",130,148,-33,-42],["juniperwell",144,121,-33,-46],
   ["beaverton",151,140,-27,-49],["saint-aurel",147,128,-38,-39],
   ["ambaro",143,166,-35,-45],["karuk",154,143,34,-44],
  ];
  for(const [region,[slug,x,z,dx,dz]] of shots.entries()){
   const result=await run(`(()=>{s.region=${region};s.hour=14;s.day=4;loadedScene="";actionSpot=null;
    player={x:${x},y:${z}};render();ensureWorld();
    const y=terrainSurface(${x},${z}), eyeX=${x+dx*.74}, eyeZ=${z+dz*.74};
    window.villagePhoto={eye:[eyeX,Math.max(y+16,terrainSurface(eyeX,eyeZ)+8),eyeZ],at:[${x},y+3,${z}]};
    draw(12000);
    return {name:r().name,houses:settlementAdded,blocked:buildingFootprints.filter(p=>p.expanded&&districtConnectionDistance(s.region,p.x,p.z)<7.5+Math.max(p.w,p.d)*.40).length,eye:window.villagePhoto.eye,at:window.villagePhoto.at,gl:gl.getError()};
   })()`);
   assert.equal(result.gl,0);assert.equal(result.blocked,0);
   await shot(slug);console.log(slug,JSON.stringify(result));
   if(after&&region===0&&process.argv.includes("--passes")){
    await run("window.architecturePasses=[architecturalRoofFace,architecturalWall,architecturalFloor,architecturalJoinery,architecturalWindows];window.architectureNoop=()=>{}");
    for(let pass=1;pass<=5;pass++){
     const status=await run(`(()=>{const [roof,wall,floor,joinery,windows]=window.architecturePasses;
      architecturalRoofFace=roof;architecturalWall=${pass}>=2?wall:architectureNoop;
      architecturalFloor=${pass}>=3?floor:architectureNoop;
      architecturalJoinery=${pass}>=4?joinery:architectureNoop;
      architecturalWindows=${pass}>=5?windows:architectureNoop;
      const start=performance.now();loadedScene="";draw(12000);
      return {vertices:graphics.worldCount,buildMs:Math.round(performance.now()-start),gl:gl.getError()};
     })()`);
     assert.equal(status.gl,0);
     await shot("pass-"+pass);console.log("pass",pass,JSON.stringify(status));
    }
   }
  }
  assert.deepEqual(exceptions,[]);
 }finally{ws?.close();cp.kill();}
}
const after=process.argv[2]==="after"; verify(after?"after":"before",after?path.join(root,"architecture-stage"):root,after?9789:9788).catch(e=>{console.error(e);process.exitCode=1;});
