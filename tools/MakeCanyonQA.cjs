const fs=require("node:fs"),path=require("node:path");
const base=fs.readFileSync(path.join(__dirname,"visual-canyon.cjs"),"utf8");
const pre=base.slice(0,base.indexOf("  for(const [region,to]"));
const checks=`
  const qa=await page.evaluate(()=>{
   if(opening.open)finishOpening();
   const land=[],joins=[];
   const open=region=>{
    s.region=region;player={x:93,y:118};loadedScene="";walkedFrom=null;ensureWorld();
   };
   for(const region of [1,2,3,4]){
    open(region);
    for(const road of worldRoads[region].filter(r=>r.canyon)){
     const [ex,ez]=road.edge;
     for(const offset of [-2.5,0,2.5]){
      let prev=null,blocked=0,maxGrade=0;
      for(let d=86;d>=0;d-=.25){
       const x=ex-road.x*d-road.z*offset,z=ez-road.z*d+road.x*offset;
       const y=supportAt(x,z,prev??Infinity);
       if(y===null){blocked++;continue;}
       if(prev!==null)maxGrade=Math.max(maxGrade,Math.abs(y-prev)/.25);
       prev=y;
      }
      land.push({from:region,to:road.to,offset,blocked,maxGrade});
     }
     const start={x:ex-road.x*.75,y:ez-road.z*.75};
     player={...start};walkedFrom=null;
     const height=playerSupport();
     moveOnSurfaces(road.x*.95,road.z*.95);
     joins.push({from:region,to:road.to,landed:s.region===road.to,heightDifference:Math.abs(height-playerSupport())});
     open(region);
    }
   }
   return {land,joins,gl:gl.getError()};
  });
  fs.writeFileSync(path.join(out,"canyon-collision.json"),JSON.stringify(qa,null,2));
  console.log(JSON.stringify(qa));
  assert.equal(qa.land.length,18);
  assert.equal(qa.joins.length,6);
  assert.equal(qa.gl,0);
  assert.ok(qa.land.every(v=>v.blocked===0&&v.maxGrade<=.30),"a canyon lane is obstructed or too steep");
  assert.ok(qa.joins.every(v=>v.landed&&v.heightDifference<.15),"a canyon crossing is discontinuous");
  assert.deepEqual(failures,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});`;
fs.writeFileSync(path.join(__dirname,"canyon-collision-qa.cjs"),pre+checks);
