const fs=require("node:fs"),path=require("node:path");
const base=fs.readFileSync(path.join(__dirname,"visual-regional-roads.cjs"),"utf8");
const pre=base.slice(0,base.indexOf("  for(const [region,to]"));
fs.writeFileSync(path.join(__dirname,"regional-road-qa.cjs"),pre+`
  const data=await page.evaluate(()=>{
   if(opening.open)finishOpening();
   const walks=[],sides=[];
   for(const [region,roads] of worldRoads.entries()){
    for(const road of roads){
     s.region=region;player={x:93,y:118};loadedScene="";walkedFrom=null;ensureWorld();
     const [x,z]=road.edge;
     const point=(d,side)=>({x:x-road.x*d-road.z*side,y:z-road.z*d+road.x*side});
     for(const side of [-2.5,2.5]){
      let blocked=null,grade=0,prev=null;
      for(let d=76;d>=0;d-=.25){
       const p=point(d,side),y=supportAt(p.x,p.y,prev??Infinity);
       if(y===null){blocked={d,...p,near:sceneryCells.get(Math.floor(p.x/cellSize)+","+Math.floor(p.y/cellSize))?.filter(c=>Math.abs(c.x-p.x)<3&&Math.abs(c.z-p.y)<3)};break;}
       if(prev!==null)grade=Math.max(grade,Math.abs(prev-y)/.25);
       prev=y;
      }
      sides.push({from:region,to:road.to,side,blocked,grade});
     }
     player=point(76,0);walkedFrom=null;
     let stall=0,maxStep=0,tries=0;
     while(s.region===region&&tries++<510&&stall<3){
      const previous={...player},floor=playerSupport();
      moveOnSurfaces(road.x*.16,road.z*.16);
      if(s.region===region&&Math.hypot(previous.x-player.x,previous.y-player.y)<.001)stall++;
      maxStep=Math.max(maxStep,Math.abs(playerSupport()-floor));
     }
     walks.push({from:region,to:road.to,landed:s.region===road.to,maxStep,tries,stalled:stall?player:null});
    }
   }
   return {walks,sides,gl:gl.getError()};
  });
  fs.writeFileSync(path.join(out,"road-check.json"),JSON.stringify(data,null,2));
  console.log(JSON.stringify({walks:data.walks.length,sides:data.sides.length,walkIssues:data.walks.filter(v=>!v.landed||v.maxStep>.32),sideIssues:data.sides.filter(v=>v.blocked||v.grade>.45),gl:data.gl}));
  assert.equal(data.gl,0);
  assert.ok(data.walks.every(v=>v.landed&&v.maxStep<=.32));
  assert.ok(data.sides.every(v=>!v.blocked&&v.grade<=.45));
  assert.deepEqual(failures,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`);
