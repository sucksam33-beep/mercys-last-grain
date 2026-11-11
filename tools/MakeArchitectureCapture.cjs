const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=__dirname;
let source=fs.readFileSync(path.join(root,"regional-village-comparison-native.cjs"),"utf8");
source=source.replace('path.join(root,"village-redesign-comparison")','path.join(root,"architecture-comparison")');
source=source.replace('const after=process.argv[2]==="after"; verify(after?"after":"before",after?path.join(root,"dialogue-opening-stage"):root,after?9786:9785)','const after=process.argv[2]==="after"; verify(after?"after":"before",after?path.join(root,"architecture-stage"):root,after?9789:9788)');
source=source.replace('   const result=await run(',`   const result=await run(`);
source=source.replace('const y=terrainSurface(', 'const y=terrainSurface(');
source=source.replace('eyeX=\${x+dx}, eyeZ=\${z+dz}','eyeX=\${x+dx*.74}, eyeZ=\${z+dz*.74}');
source=source.replace('Math.max(y+24,terrainSurface(eyeX,eyeZ)+9)','Math.max(y+16,terrainSurface(eyeX,eyeZ)+8)');
source=source.replace('   await shot(slug);console.log(slug,JSON.stringify(result));',`   await shot(slug);console.log(slug,JSON.stringify(result));
   if(after&&region===0){
    await run("window.architecturePasses=[architecturalRoofFace,architecturalWall,architecturalFloor,architecturalJoinery,architecturalWindows];window.architectureNoop=()=>{}");
    for(let pass=1;pass<=5;pass++){
     const status=await run(\`(()=>{const [roof,wall,floor,joinery,windows]=window.architecturePasses;
      architecturalRoofFace=roof;architecturalWall=\${pass}>=2?wall:architectureNoop;
      architecturalFloor=\${pass}>=3?floor:architectureNoop;
      architecturalJoinery=\${pass}>=4?joinery:architectureNoop;
      architecturalWindows=\${pass}>=5?windows:architectureNoop;
      const start=performance.now();loadedScene="";draw(12000);
      return {vertices:graphics.worldCount,buildMs:Math.round(performance.now()-start),gl:gl.getError()};
     })()\`);
     assert.equal(status.gl,0);
     await shot("pass-"+pass);console.log("pass",pass,JSON.stringify(status));
    }
   }`);
assert.ok(source.includes('if(after&&region===0)')&&source.includes('9789'));
fs.writeFileSync(path.join(root,"architecture-capture-native.cjs"),source);
