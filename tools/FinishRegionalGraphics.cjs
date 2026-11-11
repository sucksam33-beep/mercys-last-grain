const fs=require("node:fs"),path=require("node:path");
const game=process.argv[2]??path.join(__dirname,"game");
const p=path.join(game,"index.html");
let s=fs.readFileSync(p,"utf8").replace(/\r\n/g,"\n");
function replace(a,b){
 if(!s.includes(a))throw Error("Graphics hook missing "+a.slice(0,145));
 s=s.replace(a,b);
}
replace("const terrainGrid={x:-230,z:-225,step:5,columns:221,rows:173};","const terrainGrid={x:-232,z:-228,step:worldTerrainStep,columns:277,rows:218};");
replace("const districtTerrain={x:-230,z:-225,step:8,columns:139,rows:109};","const districtTerrain=terrainGrid;");
replace(" if(!villageFrame&&openWorldCrossing(x,z))return height(x,z);\n","");
replace(' if(col<0||row<0||col>=grid.columns-1||row>=grid.rows-1)return null;',` if(u<0||v<0||u>grid.columns-1||v>grid.rows-1)return null;
 if(col===grid.columns-1||row===grid.rows-1){
  const c=Math.min(col,grid.columns-2),r=Math.min(row,grid.rows-2);
  const base=r*grid.columns+c,dx=u-c,dz=v-r;
  return dx===1?lerp(points[base+1].position[1],points[base+grid.columns+1].position[1],dz):
   lerp(points[base+grid.columns].position[1],points[base+grid.columns+1].position[1],dx);
 }`);
const start=s.indexOf(" const terrainTint=(x,z,y,up)=>{"),end=s.indexOf(" const sampleTerrain=",start);
s=s.slice(0,start)+" const terrainTint=(x,z,y,up)=>openWorldTerrainTint(s.region,x,z,y,up);\n"+s.slice(end);
replace(' terraceTerrain=patches.map(grid=>({',' terraceTerrain=alignWorldTerrainPatches(activeTerrain,patches).map(grid=>({');
replace(' emitTerrain(activeTerrain,terrainPoints,patches);',' emitTerrain(activeTerrain,terrainPoints,terraceTerrain.map(patch=>patch.grid));');
replace('  if(onVillageWalk(x,z,trunk+.34)||!fitsTree(x,z,spread)||collected(id))return;','  if(openWorldRoad(s.region,x,z).gap<8+trunk||onVillageWalk(x,z,trunk+.34)||!fitsTree(x,z,spread)||collected(id))return;');
replace('uniform vec4 openWorldClip;','${openWorldOwnershipShader}');
replace(' if(!(kind>2.5&&kind<3.5)&&(point.x<openWorldClip.x||point.x>openWorldClip.y||point.z<openWorldClip.z||point.z>openWorldClip.w))discard;',
 ' if(!(kind>2.5&&kind<3.5)&&foreignTerrain(point.xz))discard;');
replace('const shadowFragment=`\nprecision highp float;','const shadowFragment=`\nprecision highp float;\n${openWorldOwnershipShader}\nvarying vec3 point;');
replace(' if((kind>2.5&&kind<3.5)||(kind>39.5&&kind<40.5)||(kind>102.5&&kind<103.5))discard;',
 ' if(foreignTerrain(point.xz)||(kind>2.5&&kind<3.5)||(kind>39.5&&kind<40.5)||(kind>102.5&&kind<103.5))discard;');
replace('["openWorldClip","viewProjection"','["openWorldOwner","openWorldMask","viewProjection"');
replace('["viewProjection","origin","rotation","stride","atlas","roll","meshScale","time","stormWind"]',
 '["openWorldOwner","openWorldMask","viewProjection","origin","rotation","stride","atlas","roll","meshScale","time","stormWind"]');
replace(' gl.uniform2f(shadow.uniform.stormWind,wind,direction);',' gl.uniform2f(shadow.uniform.stormWind,wind,direction);\n setOpenWorldOwner(shadow.uniform,true);');
const c=s.indexOf(" const clip=uniform.openWorldClip;"),e=s.indexOf(" drawRiverReflection(",c);
s=s.slice(0,c)+" setOpenWorldOwner(uniform,true);\n"+s.slice(e);
replace(" gl.uniform4f(clip,-3000,3000,-3000,3000);\n drawOpenWorld(mesh,eye);",
 " setOpenWorldOwner(uniform,false);\n drawOpenWorld(mesh,eye);");
replace(" drawGroundCover(mesh,eye,graphicsValue(\"vegetation\"));",
 " setOpenWorldOwner(uniform,true);\n drawGroundCover(mesh,eye,graphicsValue(\"vegetation\"));\n setOpenWorldOwner(uniform,false);");
replace("  if(crossing&&openWorldCrossing(player.x,player.y)){",
 "  if(crossing&&!airborne&&openWorldCrossing(player.x,player.y)&&supportAt(cap(proposedX,4,636),cap(proposedZ,12,412),y)!==null){");
fs.writeFileSync(p,s);
const world=path.join(game,"OpenWorld.js");
fs.appendFileSync(world,`
const openWorldMask=openWorldTiles.reduce((mask,[col,row])=>mask+(1<<(row*3+col)),0);
const openWorldOwnershipShader=\`
uniform vec2 openWorldOwner;
uniform float openWorldMask;
bool foreignTerrain(vec2 point){
 if(openWorldMask<.5)return false;
 vec2 relative=floor((point-vec2(4.,12.))/vec2(632.,400.));
 if(relative==vec2(0.))return false;
 vec2 tile=openWorldOwner+relative;
 if(any(lessThan(tile,vec2(0.)))||any(greaterThan(tile,vec2(2.))))return false;
 return mod(floor(openWorldMask/exp2(tile.x+tile.y*3.)),2.)>.5;
}\`;
function setOpenWorldOwner(uniform,active){
 gl.uniform2fv(uniform.openWorldOwner,openWorldTiles[s.region]);
 gl.uniform1f(uniform.openWorldMask,active?openWorldMask:0);
}
function alignWorldTerrainPatches(base,patches){
 const snap=(position,start,ceil)=>start+(ceil?Math.ceil:Math.floor)((position-start)/base.step)*base.step;
 const aligned=[];
 for(const patch of patches){
  const rect={
   left:snap(patch.x,base.x,false),top:snap(patch.z,base.z,false),
   right:snap(patch.x+(patch.columns-1)*patch.step,base.x,true),
   bottom:snap(patch.z+(patch.rows-1)*patch.step,base.z,true)
  };
  for(let i=aligned.length-1;i>=0;i--){
   const other=aligned[i];
   if(rect.right<other.left||rect.left>other.right||rect.bottom<other.top||rect.top>other.bottom)continue;
   rect.left=Math.min(rect.left,other.left);rect.top=Math.min(rect.top,other.top);
   rect.right=Math.max(rect.right,other.right);rect.bottom=Math.max(rect.bottom,other.bottom);
   aligned.splice(i,1);i=aligned.length;
  }
  aligned.push(rect);
 }
 return aligned.map(({left,top,right,bottom})=>({x:left,z:top,step:1,columns:right-left+1,rows:bottom-top+1}));
}
`);
