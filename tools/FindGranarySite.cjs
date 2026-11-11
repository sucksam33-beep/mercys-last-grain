const fs=require("node:fs"),path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,"reference-architecture-native.cjs"),"utf8");
const a=src.indexOf('  if(after&&process.argv.includes("--gameplay")){'),b=src.indexOf('  await run("finishOpening();const photoStyle',a);
const body=`  await run("finishOpening();ensureWorld()");
  const sites=await run(\`(()=>{
   const choices=[];
   for(let x=124;x<=285;x+=3)for(let z=134;z<=228;z+=3){
    if(buildingFootprints.some(p=>Math.abs(x-p.x)<p.w*.5+10.6&&Math.abs(z-p.z)<p.d*.5+7.9))continue;
    if(asagiPaddies.some(p=>Math.abs(x-p.x)<p.w*.5+11&&Math.abs(z-p.z)<14))continue;
    if(roadDist(x,z)<9||districtConnectionDistance(0,x,z)<15)continue;
    const ys=[];
    for(const dx of [-9,0,9])for(const dz of [-6,0,6,11])ys.push(terrainSurface(x+dx,z+dz));
    const floor=Math.max(...ys),spread=floor-Math.min(...ys),face=terrainSurface(x,z+11),road=roadDist(x,z+11);
    if(Math.min(...ys)<2.3||spread>2.35||road>16)continue;
    choices.push({x,z,spread,face,road,score:spread*8+Math.hypot(x-161,z-162)*.22+road*.22});
   }
   return choices.sort((a,b)=>a.score-b.score).slice(0,12);
  })()\`);
  console.log(JSON.stringify(sites));
`;
fs.writeFileSync(path.join(__dirname,"find-granary-native.cjs"),(src.slice(0,a)+body+src.slice(src.indexOf(" }finally",b))).replace("9801:9800","9803:9800"));
