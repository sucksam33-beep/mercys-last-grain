const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const target=path.join(__dirname,"reference-architecture-native.cjs");
let source=fs.readFileSync(target,"utf8");
const match='  await run("finishOpening();const photoStyle';
assert.ok(source.includes(match));
const start=source.indexOf(match);
const insert=`  if(after&&process.argv.includes("--gameplay")){
   await until(()=>run("window.soilOpening?.video.currentTime>.5"),"opening video plays");
   await run("window.soilOpening.video.currentTime=window.soilOpening.video.duration-1.6");
   await until(()=>run("!opening.open && s.soilCampaign?.step==='guard'"),"opening reaches guard chapter",45000);
   const spawn=await run("ensureWorld();({x:player.x,z:player.y,facing,floor:playerSupport(),clear:supportAt(player.x,player.y,playerSupport())!==null})");
   assert.equal(spawn.x,309);assert.equal(spawn.z,350.5);assert.equal(spawn.facing,Math.PI);assert.equal(spawn.clear,true);
   await shot("granary-spawn");
   const pathResult=await run(\`(()=>{
    const granary=buildingFootprints.find(p=>p.x===309&&p.z===339&&p.insideW);
    const front=granary.z+granary.insideD*.5, id=objectKey("door",309,339);
    const start={...player}, level=playerSupport();
    const closeToDoor=()=>{for(let n=0;n<115;n++)moveOnSurfaces(0,-.12,false);return player.y;};
    const stopped=closeToDoor();
    aimTarget={action:{id,type:"door",x:309,z:front,reach:3.15}};
    const opened=interactWithAim();ensureWorld();
    for(let n=0;n<65&&player.y>front-2.4;n++)moveOnSurfaces(0,-.12,false);
    const inside=player.y;
    for(let n=0;n<100&&player.y<start.y-.08;n++)moveOnSurfaces(0,.12,false);
    const exited=player.y;
    jump();let peak=playerSupport(),frames=0,airY=0;
    while(jumpVelocity!==null&&frames++<120){
     updateJump(1/120);peak=Math.max(peak,playerSupport());
     if(frames===32){airY=playerSupport();draw(12000);}
    }
    draw(12000);
    return {front,stopped,opened,inside,exited,level,peak,airY,landed:jumpVelocity===null,gl:gl.getError()};
   })()\`);
   console.log("Granary and jump",JSON.stringify(pathResult));
   assert.ok(pathResult.stopped>pathResult.front&&pathResult.stopped<pathResult.front+3.15);
   assert.equal(pathResult.opened,true);
   assert.ok(pathResult.inside<pathResult.front-1);
   assert.ok(pathResult.exited>=350.2);
   assert.ok(pathResult.peak-pathResult.level>.35&&pathResult.landed);
   assert.equal(pathResult.gl,0);
   assert.deepEqual(exceptions,[]);
   return;
  }
`;
source=source.slice(0,start)+insert+source.slice(start);
fs.writeFileSync(target,source);
