const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const f=path.join(__dirname,"reference-architecture-stage/game/index.html");
let s=fs.readFileSync(f,"utf8");
function edit(a,b){assert.equal(s.split(a).length,2,a);s=s.replace(a,()=>b);}
edit(' addSurface(x,z,w+.65,d+.65,footing,base);',' addSurface(x,z,w+.65,d+.65,footing,base).houseStep=true;');
edit(' solidBox(x,y+.15,end+.76,w*1.02,.28,1.55,color("#574333"),scenery?surface.wall:0);',` box(x,y+.15,end+.76,w*1.02,.28,1.55,color("#574333"),0,scenery?surface.wall:0);
 addSurface(x,end+.76,w*1.02,1.55,y+.15,y+.43).houseStep=true;`);
fs.writeFileSync(f,s);
