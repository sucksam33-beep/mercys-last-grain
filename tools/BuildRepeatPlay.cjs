const fs=require("node:fs"),path=require("node:path");
const base=fs.readFileSync(path.join(__dirname,"CampaignPlay.cjs"),"utf8");
const source=base.slice(0,base.indexOf("  let revision=0;"));
const runner=`
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
`;
fs.writeFileSync(path.join(__dirname,"RepeatCampaignPlay.cjs"),source.replace('if(m.type()==="error")','if(m.type()==="info"&&m.text().startsWith("PLAY "))console.log(m.text());if(m.type()==="error")')+runner);
