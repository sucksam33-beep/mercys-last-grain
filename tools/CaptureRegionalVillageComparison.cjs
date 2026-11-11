const fs=require("node:fs"),path=require("node:path");
const root=__dirname;
let source=fs.readFileSync(path.join(root,"capture-villages-native.cjs"),"utf8");
const start=source.indexOf('  await run("finishOpening()'),end=source.indexOf("  assert.deepEqual(exceptions,[]);",start);
const body=`  await run("finishOpening();const photoStyle=document.createElement('style');photoStyle.textContent='.labels3d,.worldHud,.worldControls,.radar,.toast,.game-menu-entry,#quest-subtitle,.caption,.player-temperature {visibility:hidden!important}';document.head.append(photoStyle);draw=eval('('+draw.toString().replace('const {eye,at}=soilShot','const {eye,at}=window.villagePhoto??(soilShot').replace('{eye:gameEye,at:gameAt};','{eye:gameEye,at:gameAt});')+')');");
  const shots=[
   ["asagi",139,166,-27,-39],["brunnen",156,136,34,-43],
   ["santa-lucia",130,148,-33,-42],["juniperwell",144,121,-33,-46],
   ["beaverton",151,140,-27,-49],["saint-aurel",147,128,-38,-39],
   ["ambaro",143,166,-35,-45],["karuk",154,143,34,-44],
  ];
  for(const [region,[slug,x,z,dx,dz]] of shots.entries()){
   const result=await run(\`(()=>{s.region=\${region};s.hour=14;s.day=4;loadedScene="";actionSpot=null;
    player={x:\${x},y:\${z}};render();ensureWorld();
    const y=terrainSurface(\${x},\${z}), eyeX=\${x+dx}, eyeZ=\${z+dz};
    window.villagePhoto={eye:[eyeX,Math.max(y+24,terrainSurface(eyeX,eyeZ)+9),eyeZ],at:[\${x},y+3,\${z}]};
    draw(12000);
    return {name:r().name,houses:settlementAdded,eye:window.villagePhoto.eye,at:window.villagePhoto.at,gl:gl.getError()};
   })()\`);
   assert.equal(result.gl,0);
   await shot(slug);console.log(slug,JSON.stringify(result));
  }
`;
if(start<0||end<0)throw Error("Missing capture section");
source=(source.slice(0,start)+body+source.slice(end))
 .replace('path.join(root,"village-screenshots")','path.join(root,"village-redesign-comparison")')
 .replace('verify("village",root,9783).catch(e=>{console.error(e);process.exitCode=1;});','const after=process.argv[2]==="after"; verify(after?"after":"before",after?path.join(root,"dialogue-opening-stage"):root,after?9786:9785).catch(e=>{console.error(e);process.exitCode=1;});');
fs.writeFileSync(path.join(root,"regional-village-comparison-native.cjs"),source);
