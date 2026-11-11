const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=__dirname, file=path.join(root,"reference-architecture-stage/game/index.html");
let source=fs.readFileSync(file,"utf8");
function edit(a,b){assert.equal(source.split(a).length,2,a);source=source.replace(a,()=>b);}
edit('const asagiGranary={x:309,z:339,w:16.4,d:10.4,h:5.35};\nconst soilHandoff={x:309,y:350.5};','const asagiGranary={x:229,z:224,w:18.3,d:12.3,h:5.75};\nconst soilHandoff={x:asagiGranary.x,y:asagiGranary.z+10.5};');
edit('  const x=309,z=357,y=height(x,z),{x:hx,z:hz,w:hw,d:hd,h:hh}=asagiGranary;','  const {x:hx,z:hz,w:hw,d:hd,h:hh}=asagiGranary;\n  const x=hx+6.2,z=hz+10.9,y=terrainSurface(x,z);');
edit('  dressAsagiGranary(hx,hz,floor);','  dressAsagiGranary(hx,hz,floor);\n  const frontWalk=buildingFootprints.at(-1).approach;\n  villagePath(frontWalk,[hx,hz+13.6],2.65,true);');
edit('[309.2,soilGranaryFloor(309,339)+1.14,337.43]','[asagiGranary.x+.2,soilGranaryFloor(asagiGranary.x,asagiGranary.z)+1.14,asagiGranary.z-1.57]');
edit('  aimBox("창고 앞 경계초소",x,z,3.5,2.5,y-.1,y+2.5,null,{type:"soil-guard",x,z,reach:5});','  aimBox("창고 앞 경계초소",x,z,3.5,2.5,y-.1,y+2.5,null,{type:"soil-guard",x,z,reach:5});');
fs.writeFileSync(file,source);
const qa=path.join(root,"reference-architecture-native.cjs");
source=fs.readFileSync(qa,"utf8");
edit('assert.equal(spawn.x,309);assert.equal(spawn.z,350.5);','assert.equal(spawn.x,229);assert.equal(spawn.z,234.5);');
edit('const granary=buildingFootprints.find(p=>p.x===309&&p.z===339&&p.insideW);','const granary=buildingFootprints.find(p=>p.x===asagiGranary.x&&p.z===asagiGranary.z&&p.insideW);');
edit('id=objectKey("door",309,339);','id=objectKey("door",granary.x,granary.z);');
edit('id,type:"door",x:309,z:front','id,type:"door",x:granary.x,z:front');
edit('pathResult.exited>=350.2','pathResult.exited>=234.2');
fs.writeFileSync(qa,source);
