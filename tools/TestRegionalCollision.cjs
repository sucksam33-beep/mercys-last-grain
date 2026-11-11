const fs=require("node:fs"),path=require("node:path");
const base=fs.readFileSync(path.join(__dirname,"visual-regions.cjs"),"utf8");
const pre=base.slice(0,base.indexOf("  for(const [region,to]"));
const checks=`
  const qa=await page.evaluate(()=>{
   if(opening.open)finishOpening();
   const samples=new Map(),water=[],rails=[];
   const openRegion=region=>{
    s.region=region;player={x:93,y:118};walkedFrom=null;loadedScene="";
    ensureWorld();
   };
   for(const [region,roads] of worldRoads.entries()){
    openRegion(region);
    for(const road of roads){
     const [ex,ez]=road.edge,alongStart=road.x?worldBounds.north:worldBounds.west;
     const alongEnd=road.x?worldBounds.south:worldBounds.east;
     const values=[];
     for(let along=alongStart;along<=alongEnd;along+=.5){
      values.push(terrainSurface(road.x?ex:along,road.x?along:ez));
     }
     samples.set(region+":"+road.to,values);
     if(road.seam.coast){
      const side=road.x?ez:ex;
      const gap=36;
      const x=ex-road.x*10+road.z*gap,z=ez-road.z*10+road.x*gap;
      water.push({region,x,z,height:terrainSurface(x,z),support:supportAt(x,z)});
     }
     if([5,6,7].includes(region)||[5,6,7].includes(road.to)){
      const x=ex-road.x*8,z=ez-road.z*8;
      const sx=x-road.z*4.5,sz=z+road.x*4.5,ground=terrainSurface(sx,sz);
      rails.push({from:region,to:road.to,blocked:supportAt(sx,sz,ground)===null,clear:supportAt(x,z)!==null});
     }
    }
   }
   const seams=worldLinks.map(([a,b])=>{
    const left=samples.get(a+":"+b),right=samples.get(b+":"+a);
    return {a,b,max:Math.max(...left.map((y,i)=>Math.abs(y-right[i])))};
   });
   const crossings=[];
   for(const [a,b] of worldLinks)for(const [from,to] of [[a,b],[b,a]]){
    openRegion(from);
    const road=worldRoads[from].find(r=>r.to===to),[x,z]=road.edge;
    player={x:x-road.x*23,y:z-road.z*23};walkedFrom=null;
    const initial=playerSupport();let delta=0,steps=0;
    while(s.region===from&&steps++<178){
     const before=playerSupport();
     moveOnSurfaces(road.x*.16,road.z*.16);
     delta=Math.max(delta,Math.abs(playerSupport()-before));
    }
    crossings.push({from,to,landed:s.region===to,initial,delta,steps});
   }
   return {seams,crossings,water,rails,gl:gl.getError()};
  });
  fs.writeFileSync(path.join(out,"collision-check.json"),JSON.stringify(qa,null,2));
  console.log(JSON.stringify(qa));
  assert.equal(qa.gl,0);
  assert.ok(qa.seams.every(seam=>seam.max<.05),"boundary heights differ");
  assert.ok(qa.crossings.every(c=>c.landed&&c.delta<.4),"crossing blocked or discontinuous");
  assert.ok(qa.rails.every(rail=>rail.blocked&&rail.clear),"railing collision");
  assert.deepEqual(failures,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
`;
fs.writeFileSync(path.join(__dirname,"regional-collision-qa.cjs"),pre+checks);
