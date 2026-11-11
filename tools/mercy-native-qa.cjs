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

  const title="Mercy’s Last Grain",tagline="The year we won, the harvest failed.";
  const read=()=>run("(()=>{const h=document.querySelector('#official-title'),p=document.querySelector('.title-tagline');return {title:h.textContent,tagline:p.textContent,tab:document.title,width:innerWidth,scroll:document.documentElement.scrollWidth,headingRight:h.getBoundingClientRect().right,taglineRight:p.getBoundingClientRect().right};})()");
  await until(()=>run("document.querySelector('#guest')?.hidden===false"),"guest");
  const desktop=await read();
  assert.equal(desktop.title,title);assert.equal(desktop.tagline,tagline);assert.equal(desktop.tab,title);
  const windowTitle=require("node:child_process").execFileSync("powershell.exe",["-NoProfile","-Command","[Console]::OutputEncoding=[Text.Encoding]::UTF8; (Get-Process -Id "+cp.pid+").MainWindowTitle"],{encoding:"utf8",windowsHide:true}).trim();
  assert.equal(windowTitle,title);
  await send("Emulation.setDeviceMetricsOverride",{width:480,height:700,deviceScaleFactor:1,mobile:false});
  const narrow=await read();
  assert.equal(narrow.width,480);assert.ok(narrow.headingRight<=480&&narrow.taglineRight<=480&&narrow.scroll<=480);
  await send("Emulation.clearDeviceMetricsOverride");
  await run("document.querySelector('#exit').focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}))");
  assert.equal(await run("document.activeElement.dataset.open"),"register");
  await run("Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[{connected:true,buttons:Array.from({length:14},(_,i)=>({pressed:i===13})),axes:[0,0]}]})");
  await until(()=>run("document.activeElement.dataset.open==='login'"),"gamepad down",7000);
  await run("delete navigator.getGamepads");
  await run("document.querySelector('[data-open=register]').click();document.querySelector('#id').value='mercy_qa';document.querySelector('#password').value='Sample-QA-123';document.querySelector('#nick').value='플레이어';document.querySelector('#form').requestSubmit()");
  await until(()=>run("document.querySelector('#player')?.hidden===false"),"profile");
  const save={region:2,stage:6,side:0,day:17,hour:13,introPending:false,asagiTrainDeparted:true,coins:173,energy:81,bag:{"편백":2},homes:{},beds:{},ponds:{},seen:{},pity:{},log:[]};
  await run("chrome.webview.postMessage({op:'import',data:"+JSON.stringify(JSON.stringify(save))+"})");
  await until(()=>run("document.querySelector('#summary')?.textContent?.includes('17일차')"),"existing save fixture");
  await shot("start-screen");
  assert.equal((await read()).tagline,tagline);
  await run("document.querySelector('#continue').click()");
  await until(()=>run("location.pathname==='/index.html'&&typeof s!=='undefined'&&s.day===17"),"continue loads saved day");
  assert.equal(await run("document.title"),title);
  assert.deepEqual(await run("[s.region,s.day,s.coins]"),[2,17,173]);
  const pause=await run("gameMenu();[$('dialogTitle').textContent,$('dialogBody').textContent.includes("+JSON.stringify(tagline)+")]");
  assert.deepEqual(pause,[title,false]);
  const submenu=await run("gameMenuPanel('설정');[$('dialogLabel').textContent,$('dialogTitle').textContent]");
  assert.deepEqual(submenu,[title,"설정"]);
  assert.deepEqual(exceptions,[]);
  console.log(JSON.stringify({desktop,narrow,windowTitle,pause,submenu,continue:"day 17, Santa Lucia, 173 coins",gamepad:"down"}));
 }finally{ws?.close();cp.kill();}
}
verify("mercy",path.join(root,"mercy-native"),9762).catch(e=>{console.error(e);process.exitCode=1;});