const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"timber-qa.cjs"),"utf8");
const head=source.slice(0,source.indexOf(" const report=await"));
const tail=`
  await page.waitForFunction(()=>!!riggedScene&&opening.open&&!!window.soilOpening?.sample,{},{timeout:90000});
  const intro=await page.evaluate(()=>{
   draw(performance.now()+2000);
   return Boolean(window.soilOpening?.sample&&opening.dataset.soilTime&&gl.getError()===0);
  });
  if(!intro)throw Error("Opening draw failed");
  await page.evaluate(()=>{
   finishOpening();s.hour=13;
   const group=timberGroups[2];ensureWorld();
   const spot=timberSites.get(group.nodes[0].id);
   player={x:spot.x,y:spot.z-3.3};walkedFrom=null;
   facing=heading=0;pitch=.06;zoom=4.4;draw(performance.now());
  });
  await page.screenshot({path:path.join(__dirname,"comparison","timber-cypress.png")});
  await page.evaluate(()=>{timberCodex();});
  await page.screenshot({path:path.join(__dirname,"comparison","timber-codex.png")});
  console.log("Intro rendered; grove and codex captured");
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});`;
fs.writeFileSync(path.join(__dirname,"capture-qa.cjs"),head+tail);
