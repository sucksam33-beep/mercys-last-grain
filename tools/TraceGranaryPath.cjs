const fs=require("node:fs"),path=require("node:path");
const dir=__dirname,src=fs.readFileSync(path.join(dir,"reference-architecture-native.cjs"),"utf8");
const a=src.replace('const closeToDoor=()=>{for(let n=0;n<115;n++)moveOnSurfaces(0,-.12,false);return player.y;};',`const trace=[];
    const closeToDoor=()=>{for(let n=0;n<75;n++){
     const z=player.y, y=playerSupport();
     if(n%4===0)trace.push([z,y,supportAt(player.x,z-.12,y),houseStepHeight(player.x,z,terrainSurface(player.x,z))]);
     moveOnSurfaces(0,-.12,false);
     if(z===player.y)break;
    }return player.y;};`)
.replace('return {front,stopped,opened,inside,exited,level,peak,airY,landed:', 'return {front,stopped,opened,inside,exited,level,peak,airY,trace,landed:')
.replace('9801:9800','9809:9800');
fs.writeFileSync(path.join(dir,"trace-granary-native.cjs"),a);
