const fs=require("node:fs"),path=require("node:path");
const script=fs.readFileSync(path.join(__dirname,"visual-regional-roads.cjs"),"utf8");
let pre=script.slice(0,script.indexOf("  for(const [region,to]"));
pre=pre.replace('"regional-roads"','"ecology-fix"').replace('  await page.goto(origin+"/index.html");','  page.on("console",m=>{if(m.type()==="warning"||m.type()==="error")console.log(m.type(),m.text().slice(0,700));});\n  page.on("requestfailed",r=>{if(/\\.(glb|png|webp)$/.test(r.url()))console.log("failed",r.url());});\n  await page.goto(origin+"/index.html");');
fs.writeFileSync(path.join(__dirname,"ecology-runtime-qa.cjs"),pre+`
  const list=[];
  const regions=process.env.ECOLOGY_ALL?[0,1,2,3,4,5,6,7]:[0,5,7];
  for(const region of regions){
   const setup=await page.evaluate(region=>{
    if(opening.open)finishOpening();
    s.region=region;s.day=4;s.hour=12;s.introPending=false;
    player={x:300,y:350};loadedScene="";walkedFrom=null;ensureWorld();
    const timber=aimObjects.filter(o=>o.action?.type==="timberGrade"&&o.action.group.grade>1);
    const count=timber.filter(o=>sceneryCells.get(Math.floor(o.action.x/cellSize)+","+Math.floor(o.action.z/cellSize))?.some(c=>c.districtResource&&!c.walkable&&Math.hypot(c.x-o.action.x,c.z-o.action.z)<.25)).length;
    const fields=here("field");
    player={x:fields.x,y:fields.y+16};heading=facing=0;zoom=9;pitch=.1;walkedFrom=null;
    const place=riggedScene.placeWildlife;
    riggedScene.placeWildlife=(...args)=>{const result=place(...args);if(result)window.seenWildlife.add(args[1]);return result;};
    window.seenWildlife=new Set();
    draw(12000);
    return {timber:timber.length,trunkColliders:count,expected:[...new Set(wildlife.filter(a=>a.target.action.available()).map(a=>a.target.action.index))],atlas:Boolean(plantTexture)};
   },region);
   await page.waitForFunction(()=>Boolean(plantTexture));
   await page.waitForFunction(({expected})=>{
    draw(12000);
    return expected.every(index=>seenWildlife.has(index));
   },setup,{timeout:35000,polling:500}).catch(e=>console.error("Missing wildlife",region,e.message));
   const result=await page.evaluate(()=>({loaded:[...seenWildlife],gl:gl.getError(),plant:gl.getParameter(gl.MAX_TEXTURE_SIZE)}));
   list.push({region,...setup,...result});
   console.log(JSON.stringify(list.at(-1)));
  }
  fs.writeFileSync(path.join(out,phase+".json"),JSON.stringify({list,failures},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`);
