const fs=require("node:fs"),path=require("node:path");
const original=fs.readFileSync(path.join(__dirname,"mercy-native-save-qa.cjs"),"utf8");
const stop=original.indexOf("  const title=");
if(stop<0)throw Error("Native test harness missing");
const steps=`
  await until(()=>run("document.querySelector('#guest')?.hidden===false"),"guest menu");
  await run("document.querySelector('[data-open=register]').click();document.querySelector('#id').value='film_qa';document.querySelector('#password').value='Sample-QA-123';document.querySelector('#nick').value='QA';document.querySelector('#form').requestSubmit()");
  await until(()=>run("document.querySelector('#player')?.hidden===false"),"QA profile");
  await run("document.querySelector('#new').click()");
  const status=await until(()=>run("location.pathname==='/index.html'&&(()=>{const v=document.querySelector('#soil-opening-film');return v?.currentTime>1&&{width:v.videoWidth,height:v.videoHeight,time:v.currentTime,paused:v.paused};})()"),"native WebView2 video starts",120000);
  console.log("Native playback",JSON.stringify(status));
  assert.equal(status.width,1920);assert.equal(status.height,1080);assert.equal(status.paused,false);
  await until(()=>run("location.pathname==='/index.html'&&typeof s!=='undefined'&&s.soilCampaign?.step==='guard'&&!opening.open"),"natural end and campaign handoff",145000);
  const result=await run("({step:s.soilCampaign.step,region:s.region,position:player,videoEnded:document.querySelector('#soil-opening-film').ended})");
  assert.deepEqual(result,{step:"guard",region:0,position:{x:309,y:348.4},videoEnded:true});
  assert.deepEqual(exceptions,[]);
  console.log("Natural handoff",JSON.stringify(result));
  fs.writeFileSync(path.join(root,"still-cinematic","native-verification.json"),JSON.stringify({status,result},null,2));
 }finally{ws?.close();cp.kill();}
}
verify("still-film",path.join(root,"still-cinematic-stage"),9770).catch(e=>{console.error(e);process.exitCode=1;});
`;
fs.writeFileSync(path.join(__dirname,"still-opening-native-qa.cjs"),original.slice(0,stop)+steps);
