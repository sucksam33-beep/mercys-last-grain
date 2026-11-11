const fs=require("node:fs"),path=require("node:path");
const game=process.argv[2];
const edit=(name,patch)=>{
 const dest=path.join(game,name);
 fs.writeFileSync(dest,patch(fs.readFileSync(dest,"utf8").replace(/\r\n/g,"\n")));
};
edit("index.html",source=>{
 let s=source;
 const replace=(old,next)=>{
  if(!s.includes(old))throw new Error("Open world hook missing: "+old);
  s=s.replace(old,next);
 };
 replace('<script src="SoilCampaign.js"></script>','<script src="SoilCampaign.js"></script><script src="OpenWorld.js"></script>');
 replace("function height(x,z){","function districtHeight(x,z){");
 replace("function color(hex){",`function height(x,z){
 return openWorldGround(s.region,x,z,districtHeight(x,z)).height;
}
function color(hex){`);
 replace("function terrainSurface(x,z){","function terrainSurface(x,z){\n if(!villageFrame&&openWorldCrossing(x,z))return height(x,z);");
 replace("  let x=cap(player.x+dx/count,4,636),z=cap(player.y+dz/count,12,412);",`  const proposedX=player.x+dx/count,proposedZ=player.y+dz/count;
  const crossing=slide&&openWorldStep(s.region,proposedX,proposedZ);
  if(crossing&&openWorldCrossing(player.x,player.y)){
   openWorldMove(crossing);
   return;
  }
  let x=cap(proposedX,4,636),z=cap(proposedZ,12,412);`);
 replace("   const px=player.x,pz=player.y;","   const px=player.x,pz=player.y,previousRegion=s.region;");
 replace("   const moved=Math.hypot(player.x-px,player.y-pz);","   const moved=previousRegion===s.region?Math.hypot(player.x-px,player.y-pz):budget;");
 replace("   if(movement.speed>.12){","   if(movement.speed>.12&&s.region===previousRegion){");
 replace("  makeWorld();loadedScene=sceneKey;","  worldRoadGrades(s.region);\n  makeWorld();loadedScene=sceneKey;");
 replace("  const road=cap((10-roadDist(x,z))/8,0,1);","  const road=Math.max(cap((10-roadDist(x,z))/8,0,1),openWorldGround(s.region,x,z,y).road);");
 replace(" appendTerrainHorizon(activeTerrain,terrainPoints,paintLand);"," decorateOpenWorld();\n appendTerrainHorizon(activeTerrain,terrainPoints,paintLand);");
 replace("uniform vec3 camera,sun,fog;","uniform vec3 camera,sun,fog;\nuniform vec4 openWorldClip;");
 replace("void main(){\n if(reflectPass",`void main(){
 if(!(kind>2.5&&kind<3.5)&&(point.x<openWorldClip.x||point.x>openWorldClip.y||point.z<openWorldClip.z||point.z>openWorldClip.w))discard;
 if(reflectPass`);
 replace('"viewProjection","origin","rotation","camera"','"openWorldClip","viewProjection","origin","rotation","camera"');
 replace(" drawRiverReflection(time,eye,at,projection,matrix,width,h,fog,mesh);",` const clip=uniform.openWorldClip;
 const roads=worldRoads[s.region];
 const bound=(dx,dz,limit,fallback)=>roads.some(road=>road.x===dx&&road.z===dz)?limit:fallback;
 gl.uniform4f(clip,bound(-1,0,4,-3000),bound(1,0,636,3000),bound(0,-1,12,-3000),bound(0,1,412,3000));
 drawRiverReflection(time,eye,at,projection,matrix,width,h,fog,mesh);`);
 replace(' if(!cinematic){\n  drawDistrictWildlife',` gl.uniform4f(clip,-3000,3000,-3000,3000);
 drawOpenWorld(mesh,eye);
 if(!cinematic){
  drawDistrictWildlife`);
 replace(' const points=[[94,34],[55,34],[11,62],[13,31],[30,20],[51,66],[88,85],[75,11]];',' const points=openWorldPins;');
 replace('painting.src="world-map.png"','painting.src="open-world-map.jpg"');
 replace('  if(!unlocked(i)){available.textContent="아사기의 첫 겨울을 마치면 여정이 열려.";return}','  openWorldMapDetail(detail,available,i);\n  if(!unlocked(i)||!leg)return;');
 replace('  if(!leg){available.textContent="여기서 직행편이 없어. 연결된 지역에서 갈아타.";return}\n  available.textContent=leg[2]+" · "+leg[3]+"시간";','  available.textContent+=" | "+leg[2]+" "+leg[3]+"시간";');
 replace('if(connection(s.region,i)&&unlocked(i))pin.classList.add("connected");','if(worldRoads[s.region].some(road=>road.to===i))pin.classList.add("connected");');
 return s.replaceAll("돌아오는 물길","왕이 먹는 흙");
});
edit("rigged-scene.mjs",s=>s
 .replace("genzo.root,wildlifeModels.root);","genzo.root,wildlifeModels.root,soilProps.jar,soilProps.lantern);")
 .replace("eye,combat,airborne})","eye,combat,airborne,soilShot,seedJar})"));
for(const file of ["desktop.html","desktop.js","desktop-play.js"]){
 edit(file,s=>s.replaceAll("돌아오는 물길","왕이 먹는 흙"));
}