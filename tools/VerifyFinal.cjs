const fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"timber-qa.cjs");
let s=fs.readFileSync(base,"utf8");
s=s.replace('const placements=[],all=[];',`
  const placements=[],all=[];
  function roadAccess(x,z){
   const step=3,reach=115,queue=[[x,z,supportAt(x,z)]],seen=new Set(["0,0"]);
   for(let i=0;i<queue.length&&i<6500;i++){
    const [a,b,y]=queue[i];
    if(roadDist(a,b)<=4||openWorldGround(s.region,a,b,y).road>.75)return true;
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
     const px=a+dx*step,pz=b+dz*step,ix=Math.round((px-x)/step),iz=Math.round((pz-z)/step),key=ix+","+iz;
     if(seen.has(key)||Math.hypot(ix,iz)*step>reach||px<4||px>636||pz<12||pz>412)continue;
     const next=supportAt(px,pz,y);
     if(next===null||next<1.7||Math.abs(next-y)>.9||unobstructed({x:a,y:b,floor:y},{x:px,y:pz})===null)continue;
     seen.add(key);queue.push([px,pz,next]);
    }
   }
   return false;
  }`);
s=s.replace("return {id:n.id,x,z,accessible};","return {id:n.id,x,z,accessible,road:roadAccess(x,z)};");
s=s.replace('console.log("Local approach failures",JSON.stringify(bad));',`
 console.log("Local approach failures",JSON.stringify(bad));
 console.log("Road failures",report.placements.flatMap(g=>g.points.filter(p=>!p?.road).map(p=>p?.id)));
 assert.equal(bad.length,0);`);
s=s.replace('return {test,forestry,reinforced,renewed,once,protects,codex};',`
  $("dialog").close();
  s.reservedTimber={};s.stage=6;s.region=0;
  const catalogue=Object.values(craftRecipes).filter(r=>r.tier);
  const tierFive=catalogue.find(r=>r.tier===5&&r.needs.some(([id])=>id==="timber_premium"));
  const tested=[];
  for(const id of ["기본 작업대","수차 목재 부품","정밀 수문틀","대형 선박 용골",tierFive.id]){
   const recipe=craftRecipes[id];
   for(const [part,n] of recipe.needs)if(timberFree(part)<n)give(part,n-timberFree(part));
   const before=count(id);
   player={x:bench[0],y:bench[1]};
   tested.push([id,craftMake(id,"bench")&&count(id)-before===recipe.output]);
  }
  const needs=[["timber_log",2]];
  s.bag.timber_log=0;s.bag.timber_quality=3;
  let approved=null;timberConfirm(needs,cost=>{approved=cost;},()=>{});
  const prior=count("timber_quality");
  const button=[...$("dialogBody").querySelectorAll("button")].find(b=>b.textContent==="표시된 재료 사용");
  const unchanged=approved===null&&count("timber_quality")===prior;
  button.click();$("dialog").close();
  const manual=unchanged&&approved[0][0]==="timber_quality"&&approved[0][1]===2;
  const road=worldRoads[0].find(r=>r.to===1);
  player={x:road.edge[0]+1.25,y:road.edge[1]};loadedScene="";ensureWorld();
  heading=facing=-Math.PI/2;keys.add("w");
  for(let i=0;i<100&&s.region===0;i++)updateLocomotion(.044);
  keys.clear();
  return {test,forestry,reinforced,renewed,once,protects,codex,catalogue:catalogue.length,tested,manual,keyCrossing:s.region===1};`);
s=s.replace('assert.deepEqual(failures,[]);','assert.equal(play.catalogue,100);assert.ok(play.tested.every(([,ok])=>ok));assert.ok(play.manual&&play.keyCrossing);assert.deepEqual(failures,[]);');
fs.writeFileSync(path.join(__dirname,"final-qa.cjs"),s);
