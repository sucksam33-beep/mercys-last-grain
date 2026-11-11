const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const {once}=require("node:events");
const root=__dirname, out=path.join(root,"estate-workbench-review");
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
  await run("finishOpening();window.soilOpening=null;const photoStyle=document.createElement('style');photoStyle.textContent='.labels3d,.worldHud,.worldControls,.radar,.toast,.game-menu-entry,#quest-subtitle,.caption,.player-temperature {visibility:hidden!important}';document.head.append(photoStyle);window.captureDraw=eval('('+draw.toString().replace('const {eye,at}=soilShot','const {eye,at}=window.regaliaPhoto??(soilShot').replace('{eye:gameEye,at:gameAt};','{eye:gameEye,at:gameAt});')+')');draw=()=>{};const qaRaf=requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>callback===loop?0:qaRaf(callback);");
  const key=k=>run("window.dispatchEvent(new KeyboardEvent('keydown',{key:"+JSON.stringify(k)+",bubbles:true,cancelable:true}))");
  await until(()=>run("Boolean(hammerCatalog['estate-workbench'])"),"workbench catalog");
  await run("s.soilCampaign=null;s.stage=6;s.introPending=false;s.hour=12;s.day=2;give('일반 목재',150);give('화강암',20);");
  const placement=(id,x,z,turn=0)=>`player={x:${x},y:${z}-3.1};heading=0;pitch=0;hammer.selected=${JSON.stringify(id)};hammer.turn=${turn};`;
  const camera=(position,target)=>run(`(()=>{s.hour=12;window.regaliaPhoto={eye:${JSON.stringify(position)},at:${JSON.stringify(target)}};window.captureDraw(12000);return gl.getError();})()`);
  const sites=[];
  for(let region=0;region<8;region++){
   await run(`s.region=${region};player={x:93,y:118};actionSpot=null;marker=target=null;hammer.open=false;ensureWorld();`);
   await key("h");
   assert.equal(await run("hammer.open&&hammer.selected==='estate-workbench'"),true);
   const blocked=await run(placement("floor",176,185)+"hammerTarget().problem");
   assert.match(blocked,/작업대를 먼저/);
   await run("hammer.selected='estate-workbench'");
   const site=await run(`(()=>{const ref=${region===0?"{x:183,y:181}":"here('home')"};
    const candidates=[];
    for(let dx=-38;dx<=38;dx+=2.4)for(let dz=-38;dz<=38;dz+=2.4)candidates.push({x:ref.x+dx,z:ref.y+dz,score:Math.hypot(dx,dz)});
    for(const {x,z} of candidates.sort((a,b)=>a.score-b.score)){
     player={x,y:z-3.1};heading=pitch=hammer.turn=0;
     const p=hammerTarget();if(p.problem)continue;
     if(${region}===0){
      hammer.selected="floor";player={x:p.x+5.6,y:p.z-3.1};const floor=hammerTarget();hammer.selected="estate-workbench";
      if(floor.problem!=="작업대를 먼저 설치하세요")continue;
     }
     player={x,y:z-3.1};return p;
    }
    return null;
   })()`);
   assert.ok(site,"No valid workbench site in region "+region);
   const {x,y,z}=site;
   if(region===0){
    await key("b");await shot("1-palette");
    await run("document.querySelector('.hammer-palette button').click()");
    assert.equal(await run("hammerTarget().problem"),"");
    assert.equal(await camera([x+4.9,y+3.3,z+6.5],[x,y+1.22,z]),0);
    await shot("2-preview");
   }
   const stock=await run("hammerStock(hammerCatalog['estate-workbench'])");
   await key("Enter");
   const installed=await run("estateWorkbench()");
   assert.equal(installed.x,x);assert.equal(installed.z,z);
   assert.equal(await run("hammerStock(hammerCatalog['estate-workbench'])"),stock-4);
   assert.match(await run(placement("estate-workbench",x+7,z)+"hammerTarget().problem"),/하나만/);
   await key("Enter");
   assert.equal(await run("hammerPlaced().filter(p=>p.id===estateWorkbenchId).length"),1);
   assert.match(await run(placement("floor",x+27,z)+"hammerTarget().problem"),/24m/);
   assert.match(await run(placement("floor",x,z+2.35)+"hammerTarget().problem"),/도착 공간/);
   sites.push(installed);
   console.log("Region",region,JSON.stringify(installed));
   if(region!==0)continue;
   const layout=await run(`(()=>{const b=estateWorkbench(),old=hammerPlaced();
    for(const [dx,dz] of [[6.4,0],[-6.4,0],[5.6,-4.8],[-5.6,-4.8],[0,-7.2],[6.4,6.4],[-6.4,6.4]]){
     const x=b.x+dx,z=b.z+dz;
     const layout=[["floor",x,z,0],["plain-wall",x,z-1.2,0],["doorway-wall",x,z+1.2,0],["plain-wall",x-1.2,z,1],["plain-wall",x+1.2,z,1],["gable-roof",x,z,0]];
     let valid=true;
     try{
      for(const [id,a,c,turn] of layout){
       player={x:a,y:c-3.1};heading=pitch=0;hammer.turn=turn;hammer.selected=id;
       const p=hammerTarget();
       if(p.problem){valid=false;break;}
       s.hammerPieces.push({...p,key:"probe:"+s.hammerPieces.length});
      }
     }finally{s.hammerPieces.length=old.length;}
     if(valid)return layout;
    }
    return null;
   })()`);
   assert.ok(layout,"No valid six-piece house layout");
   for(const [id,a,b,turn] of layout){
    await run(placement(id,a,b,turn));
    assert.equal(await run("hammerTarget().problem"),"");
    await key("Enter");
   }
   assert.equal(await run("hammerPlaced().length"),7);
   await run(placement("floor",x+26,z));
   assert.equal(await camera([x+14,y+42,z+43],[x,y,z]),0);
   await until(()=>run("['floor','plain-wall','doorway-wall','gable-roof'].every(id=>riggedScene.hammerModelReady(id))"),"house models");
   assert.equal(await camera([x+14,y+42,z+43],[x,y,z]),0);
   await shot("3-radius-and-house");
   await run(`player={x:${x}+2.8,y:${z}+5};hammer.open=false;hammerStatus();`);
   assert.equal(await camera([x+4.9,y+3.3,z+6.5],[x,y+1.25,z]),0);
   await shot("4-installed");
  }
  await key("m");
  const entries=await run("Array.from(document.querySelectorAll('.estate-map-action'),b=>b.textContent)");
  assert.equal(entries.length,8);assert.equal(entries[0],"아사기 저택");
  await shot("5-map");
  const destinations=[];
  for(const region of [0,1,2,3,4,5,6,7,0]){
   if(!(await run(`Array.from(document.querySelectorAll(".estate-map-action")).some(b=>Number(b.dataset.estateRegion)===${region})`))){
    await run("railMap()");
   }
   await run(`document.querySelector('[data-estate-region="${region}"]').click()`);
   const arrived=await run("(()=>{const b=estateWorkbench();return {region:s.region,player,expected:estateArrival(b),marker,dialog:$('dialog').open,safe:supportAt(player.x,player.y,terrainSurface(player.x,player.y))!==null}})()");
   assert.equal(arrived.region,region,JSON.stringify(arrived));assert.equal(arrived.player.x,arrived.expected.x);assert.equal(arrived.player.y,arrived.expected.z);
   assert.equal(arrived.marker,null);assert.equal(arrived.dialog,false);assert.equal(arrived.safe,true);
   destinations.push(arrived);
   if(destinations.length<9)await key("m");
  }
  const b=sites[0];
  assert.equal(await camera([b.x+5,b.y+3.3,b.z+7.4],[b.x,b.y+1.15,b.z+1.05]),0);
  await shot("6-arrival");
  const save=await run("(()=>{autosave();const raw=JSON.parse(localStorage.getItem(autoSaveKey));return {benches:raw.hammerPieces.filter(p=>p.id===estateWorkbenchId).length,region:raw.region,location:raw.savedLocation}})()");
  assert.equal(save.benches,8);assert.equal(save.region,0);assert.equal(save.location.y,destinations.at(-1).expected.z);
  assert.deepEqual(exceptions,[]);
  fs.writeFileSync(path.join(out,"test.json"),JSON.stringify({sites,entries,destinations,save},null,2));
 }finally{ws?.close();cp.kill();}
}
verify("game",root,9805).catch(e=>{console.error(e);process.exitCode=1;});