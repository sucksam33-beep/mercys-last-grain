const fs=require("node:fs"),path=require("node:path");
const root=__dirname;
let source=fs.readFileSync(path.join(root,"capture-opening-confirm-native.cjs"),"utf8");
const start=source.indexOf("  const status="),end=source.indexOf(" }finally",start);
const capture=`  await until(()=>run("location.pathname==='/index.html' && typeof riggedScene!=='undefined' && !!riggedScene && !!scenery && opening.open"),"native world ready",120000);
  await run("finishOpening();const photoStyle=document.createElement('style');photoStyle.textContent='.labels3d,.worldHud,.worldControls,.radar,.toast,.game-menu-entry,#quest-subtitle,.caption {visibility:hidden!important}';document.head.append(photoStyle);");
  const slugs=["asagi","brunnen","santa-lucia","juniperwell","beaverton","saint-aurel","ambaro","karuk"];
  for(let i=0;i<slugs.length;i++){
   const result=await run(\`(()=>{s.region=\${i};s.hour=13;s.day=3;loadedScene="";actionSpot=null;render();draw(12000);
    const center=s.region===1?[133,110]:s.region===7?[132,112]:[93,102];
    const houses=buildingFootprints.filter(p=>Math.hypot(p.x-center[0],p.z-center[1])<70);
    const average=houses.reduce((sum,p)=>[sum[0]+p.x,sum[1]+p.z],[0,0]).map(v=>v/Math.max(1,houses.length));
    const aim=houses.length?average:center;
    player={x:aim[0]-5,y:aim[1]-9};heading=facing=.50;pitch=.46;zoom=38;
    cameraClearance=1;draw(12000);return {name:r().name,houses:houses.length,aim,gl:gl.getError()};})()\`);
   assert.equal(result.gl,0);
   await shot(slugs[i]);console.log(slugs[i],JSON.stringify(result));
  }
  assert.deepEqual(exceptions,[]);
`;
source=(source.slice(0,start)+capture+source.slice(end)).replace('path.join(root,"dialogue-cinematic","walter-confirm")','path.join(root,"village-screenshots")').replace('verify("windows",root,9778)','verify("village",root,9783)');
fs.writeFileSync(path.join(root,"capture-villages-native.cjs"),source);
