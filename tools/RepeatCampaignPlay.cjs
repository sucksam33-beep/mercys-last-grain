const fs=require("node:fs"),path=require("node:path");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.resolve(process.env.CAMPAIGN_ROOT??path.join(__dirname,"game"));
const out=path.join(__dirname,"comparison","campaign-playthrough");
fs.mkdirSync(out,{recursive:true});
const origin="https://game.returningwaters.local";
const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".glb":"model/gltf-binary"};
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--enable-gpu","--use-angle=d3d11","--disable-background-timer-throttling","--disable-gpu-shader-disk-cache"]});
 try{
  const page=await browser.newPage({viewport:{width:720,height:450}});
  page.on("pageerror",e=>console.error("PAGE",e.stack));
  page.on("console",m=>{if(m.type()==="info"&&m.text().startsWith("PLAY "))console.log(m.text());if(m.type()==="error")console.error(m.text().slice(0,500));});
  await page.route("**/*",route=>{
   const url=new URL(route.request().url()),file=path.join(root,decodeURIComponent(url.pathname));
   if(url.origin!==origin||!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.abort();
   return route.fulfill({path:file,contentType:types[path.extname(file)]??"application/octet-stream"});
  });
  await page.addInitScript(()=>localStorage.setItem("returning-waters-render-quality","0"));
  await page.goto(origin+"/index.html");
  await page.waitForFunction(()=>typeof opening!=="undefined"&&opening.open&&!!window.soilOpening?.sample,{},{timeout:120000});
  console.log("Opening started");
  console.log("GPU",await page.evaluate(()=>{const ext=gl.getExtension("WEBGL_debug_renderer_info");return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null;}));
  await page.waitForFunction(()=>!opening.open&&Boolean(s.soilCampaign?.step),{},{timeout:600000,polling:1500});
  console.log("Opening completed naturally",await page.evaluate(()=>({region:s.region,step:s.soilCampaign.step,player,day:s.day})));


  const result=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const history=[],activities=[];
   const click=(root,label)=>{const b=[...$(root).querySelectorAll("button")].find(b=>b.textContent===label);if(!b)throw Error("Missing "+label+" at "+s.region+"/"+s.soilCampaign.step);b.click();};
   const close=()=>{if($("dialog").open)$("dialog").close();};
   const walk=async id=>{
    if(actionSpot===id)return;
    go(id);
    const deadline=performance.now()+150000;
    while(performance.now()<deadline){
     if(actionSpot===id){marker=target=null;return;}
     if(!marker)throw Error("Path to "+id+" blocked at "+s.region+" "+JSON.stringify(player));
     await wait(200);
    }
    throw Error("Walking timed out at "+s.region+"/"+id+" "+JSON.stringify(player));
   };
   const episode=async(i=0)=>{
    const step=s.soilCampaign.step,e=soilEpisode();
    if(e.region!==s.region)throw Error("Wrong region for "+step);
    await walk(e.place);
    click("actions",e.title);click("dialogBody",e.options[i].label);
    if(s.soilCampaign.step===step)throw Error("No advancement at "+step+" | "+$("dialogBody").innerText);
    history.push(step);
    console.info("PLAY",JSON.stringify({step,region:s.region,day:s.day}));
   };
   const buy=(label,n=1)=>{
    for(let i=0;i<n;i++){
     const row=[...$("dialogBody").querySelectorAll(".item")].find(e=>e.firstElementChild.textContent===label||e.firstElementChild.textContent.startsWith(label+" · "));
     if(!row)throw Error("Store row missing: "+label);
     row.querySelector("button").click();
    }
   };
   const shopAt=async entries=>{
    await walk("station");click("actions","상점 열기");for(const [label,n] of entries)buy(label,n);close();
   };
   const travelTo=async region=>{
    await walk("station");railMap();
    const pin=[...$("dialogBody").querySelectorAll(".atlasPin")].find(p=>p.textContent.trim().startsWith(regions[region].name));
    pin.click();click("dialogBody","출발");
    if(s.region!==region)throw Error("Travel rejected: "+s.log[0]);
    console.info("PLAY",JSON.stringify({arrived:region,day:s.day}));
    await wait(120);
   };
   await episode();await episode();await episode();
   await shopAt([["원목",2],["목동 지팡이"],["손괭이"],["씨앗"],["낚싯대"],["민물 채비"],["채집가위"]]);
   activities.push("상점 구매");
   await episode();await episode();await episode();
   await walk("field");click("actions","텃밭");click("dialogBody","파종");
   if(!s.beds[0])throw Error("Crop was not planted");
   close();activities.push("텃밭 파종");
   for(let i=0;i<8;i++){
    click("actions","목동");[...$("dialogBody").querySelectorAll("button")].filter(b=>b.textContent==="유도").at(-1).click();
   }
   activities.push("방목");
   await episode(0);await episode(1);await episode(0);
   await walk("station");click("actions","쉼터에서 쉬기");
   if(s.energy!==100)throw Error("Rest did not restore energy");
   activities.push("쉼터 휴식");
   await travelTo(1);await shopAt([["원목",4],["질 좋은 목재",6]]);
   await episode(0);await episode(1);await episode(0);await episode(0);
   await travelTo(2);await episode(0);await travelTo(3);await episode(0);await travelTo(4);await episode(0);
   await travelTo(1);await travelTo(5);await episode(0);await travelTo(6);await episode(0);
   await travelTo(5);await travelTo(1);await travelTo(0);
   await walk("field");click("actions","텃밭");click("dialogBody","수확");
   if(s.beds[0])throw Error("Mature crop did not harvest");
   close();activities.push("텃밭 수확");
   await episode(0);await episode(0);await travelTo(1);await travelTo(4);await travelTo(7);
   await episode(0);await episode(1);await episode(0);
   await walk("station");click("actions",soilEpisode().title);
   const inputs=[...$("dialogBody").querySelectorAll("input")];
   for(const [i,n] of [5,3,3].entries())inputs[i].value=String(n);
   click("dialogBody","지역 위임 배분 확정");
   if(s.soilCampaign.step!=="return")throw Error("Distribution did not advance: "+$("dialogBody").innerText);
   history.push("distribute");
   await travelTo(4);await travelTo(1);await travelTo(0);await episode(0);await episode(0);await episode(0);
   const saved=JSON.parse(localStorage.getItem(autoSaveKey));
   if(!s.soilCampaign.complete||!saved?.soilCampaign?.complete)throw Error("Ending was not persisted");
   return {complete:true,history,activities,ending:s.soilCampaign.planted,day:s.day};
  });
  console.log("COMPLETE",JSON.stringify(result));
  fs.writeFileSync(path.join(out,"repeat-"+(process.env.PLAY_ROUND??"2")+".json"),JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
