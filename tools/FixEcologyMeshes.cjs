const fs=require("node:fs"),path=require("node:path");
const game=process.argv[2];
function edit(name,changes){
 const p=path.join(game,name);let s=fs.readFileSync(p,"utf8").replace(/\r\n/g,"\n");
 for(const [a,b] of changes){if(!s.includes(a))throw Error(name+" missing "+a);s=s.replace(a,b);}
 fs.writeFileSync(p,s);
}
edit("Timber.js",[
 ['    if(/소나무|가문비|편백|삼나무|전나무|낙우송/.test(group.species))pine(x,y,z,size,tint,index+2125,false);',`    // Harvest meshes belong to the ecology buffer, which is rebuilt independently of static trees.
    if(/소나무|가문비|편백|삼나무|전나무|낙우송/.test(group.species))paintPine(x,y,z,size,tint,index+2125,false);`],
 ['   }else if(grade>1)taper(x,y,z,.43,.27,.22,bark,9);',`    const trunk=Math.max(.16,size*.038);
    addSurface(x,z,trunk*2,trunk*2,y-.05,y+3,false);
   }else if(grade>1)taper(x,y,z,.43,.27,.22,bark,9);`]
]);
edit("region-ecology.js",[
 [" if(graphics.shadows)graphics.shadows.key=\"\";\n}\nfunction worldResourceAvailable",
  " if(graphics.shadows)graphics.shadows.key=\"\";\n if(graphics.foliageShadows)graphics.foliageShadows.key=\"\";\n}\nfunction worldResourceAvailable"]
]);
edit("BotanicalPlants.js",[
 ["let plantTexture=null,plantTextureLoading=false,wildVegetationReady=false;",
  "let plantTexture=null,plantTextureLoading=false,plantAtlasAttempts=0,plantAtlasRetryAt=0,wildVegetationReady=false;"],
 ["function combinePlantAtlases(existing,wild,accents){\n const canvas=document.createElement(\"canvas\");\n canvas.width=existing.width;canvas.height=existing.height;",
  "function combinePlantAtlases(existing,wild,accents,limit){\n const canvas=document.createElement(\"canvas\");\n canvas.width=Math.min(existing.width,limit);canvas.height=Math.min(existing.height,limit);"],
 [" context.drawImage(existing,0,0);"," context.drawImage(existing,0,0,canvas.width,canvas.height);"],
 [" if(plantTextureLoading||!gl||gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)<9||gl.getParameter(gl.MAX_TEXTURE_SIZE)<4096)return;\n plantTextureLoading=true;",
  " if(plantTexture||plantTextureLoading||plantAtlasAttempts>=3||performance.now()<plantAtlasRetryAt||!gl||gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)<9)return;\n const limit=gl.getParameter(gl.MAX_TEXTURE_SIZE);\n if(limit<512)return;\n plantTextureLoading=true;plantAtlasAttempts++;"],
 ["  const image=wild||accents?combinePlantAtlases(existing,wild,accents):existing;",
  "  const image=wild||accents||existing.width>limit||existing.height>limit?combinePlantAtlases(existing,wild,accents,limit):existing;"],
 ["  const texture=gl.createTexture();\n  gl.activeTexture(gl.TEXTURE8);","  const texture=gl.createTexture();\n  if(!texture)throw Error(\"식물 텍스처를 준비할 수 없습니다.\");\n  gl.activeTexture(gl.TEXTURE8);"],
 [" }).catch(()=>{console.warn(\"식물 텍스처를 불러오지 못했습니다.\");});",
  " }).catch(()=>{\n  plantAtlasRetryAt=performance.now()+1500*plantAtlasAttempts;\n  console.warn(\"식물 텍스처를 불러오지 못했습니다.\");\n }).finally(()=>{plantTextureLoading=false;});"]
]);
edit("index.html",[
 ["function ensureWorld(){\n if(riggedScene", "function ensureWorld(){\n if(!plantTexture&&plantAtlasAttempts>0)loadPlantAtlas();\n if(riggedScene"]
]);
edit("WildlifeModels.mjs",[
 ["  if(!models.has(index)){","  const prior=models.get(index);\n  if(!prior||(prior.retryAt<=performance.now()&&prior.attempt<3)){"],
 ["   const pending={};","   const pending={attempt:(prior?.attempt??0)+1};"],
 ["     disposeModel(model);\n     return;","     disposeModel(model);\n     pending.retryAt=Infinity;\n     return;"],
 ["    for(const variant of [model,young]){","    const boundsByAge=[];\n    for(const variant of [model,young]){"],
 ["     variant.position.sub(center);\n    }",`     variant.position.sub(center);
     const dimensions=fitted.getSize(new THREE.Vector3()).multiplyScalar(scale);
     boundsByAge.push({height:dimensions.y,length:Math.max(dimensions.x,dimensions.z),width:Math.min(dimensions.x,dimensions.z)});
    }`],
 ["    Object.assign(pending,{instances:new Map(),model,young,scale,yaw,height:size.y*scale,length:width*scale,\n     width:Math.min(size.x,size.z)*scale});\n   }).catch(error=>console.warn(\"Wildlife model unavailable:\",id,error));",`    Object.assign(pending,{instances:new Map(),model,young,scale,yaw,boundsByAge});
   }).catch(error=>{
    if(models.get(index)!==pending)return;
    pending.retryAt=performance.now()+1500*pending.attempt;
    console.warn("Wildlife model unavailable:",id,error);
   });`],
 ["   const variant=(ageScale<1?entry.young:entry.model).clone(true);",
  "   const variant=(ageScale<1?entry.young:entry.model).clone(true);\n   const dimensions=entry.boundsByAge[ageScale<1?1:0];"],
 ["   instance.userData={animal,shadow,ageScale,length:entry.length*shape[0],width:entry.width*shape[2],",
  "   instance.userData={animal,shadow,ageScale,dimensions,length:dimensions.length*shape[0],width:dimensions.width*shape[2],"],
 ["  return entry;\n }","  return motion.dimensions;\n }"]
]);
