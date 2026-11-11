const fs=require("node:fs"),path=require("node:path");
const game=process.argv[2];
const edit=(file,patch)=>{
 const target=path.join(game,file);
 let source=fs.readFileSync(target,"utf8").replace(/\r\n/g,"\n");
 const replace=(old,next)=>{
  if(!source.includes(old))throw Error(file+" missing "+old.slice(0,100));
  source=source.replace(old,next);
 };
 patch(replace);
 fs.writeFileSync(target,source);
};
edit("OpenWorld.js",replace=>{
 replace("const worldMeshes=new Map();","const worldMeshes=new Map();\nconst canyonLaneHalfWidth=10;");
 replace("  worldRoads[from].push({to,x,z,edge,approach,name});","  const canyon=[2,3].includes(from)||[2,3].includes(to);\n  worldRoads[from].push({to,x,z,edge,approach,name,canyon});");
 replace("     const grade=distance<25?5:cap(ground,previous.y-.24*(distance-previous.distance),previous.y+.24*(distance-previous.distance));",`     const ramp=road.canyon ? .14*terrainEase(18,48,distance):.24;
     const grade=distance<25?5:cap(ground,previous.y-ramp*(distance-previous.distance),previous.y+ramp*(distance-previous.distance));`);
 replace(" let distance=Infinity,grade=natural;"," let distance=Infinity,grade=natural,closest=null,along=0,side=0;");
 replace("   distance=gap;\n   grade=lerp",`   distance=gap;
   closest=road;
   along=lerp(samples[start].distance,samples[start+count].distance,t);
   side=((x-a[0])*dz-(z-a[1])*dx)/Math.hypot(dx,dz);
   grade=lerp`);
 replace(" const shoulder=cap((34-gap)/25,0,1);\n return {height:lerp(natural,grade,shoulder*shoulder*(3-2*shoulder)),road:cap((8-gap)/3,0,1)};",` const canyon=closest?.canyon;
 const shoulder=canyon?1-terrainEase(canyonLaneHalfWidth,37,gap):terrainEase(0,1,cap((34-gap)/25,0,1));
 const relief=canyon&&(region===2||region===3)?canyonPassRelief(region,closest,along,side):0;
 return {height:lerp(natural,grade,shoulder)+relief,road:1-terrainEase(5,canyon?9:8,gap)};`);
 replace("function openWorldCrossing(x,z){",`function canyonPassRelief(region,road,distance,side){
 if(distance>108||Math.abs(side)<13)return 0;
 const depth=terrainEase(5,28,distance)*(1-terrainEase(78,108,distance));
 const left=side<0;
 const tallSide=(region+road.to)%2===0?left:!left;
 const wave=Math.sin(distance*.094+region*1.2),ripple=Math.sin(distance*.227+road.to*.83);
 const crest=(tallSide?34:28)+wave*(tallSide?6:4)+ripple*2.2;
 const across=Math.abs(side);
 const rise=terrainEase(13,crest,across)*(1-terrainEase(crest,crest+28,across));
 const brokenShoulder=terrainEase(15,24,across)*(1-terrainEase(25,36,across));
 const cut=terrainEase(10,15,across)*(1-terrainEase(15,23,across));
 const ridge=(tallSide?16.5:10.2)*(1+wave*.21+ripple*.08)*rise;
 return depth*(ridge+brokenShoulder*(1.65+.70*ripple)-cut*(tallSide?2.2:1.2));
}
function canyonTerrainPatches(region,base){
 if(region!==2&&region!==3)return [];
 const snap=(v,start,ceil)=>start+(ceil?Math.ceil:Math.floor)((v-start)/base.step)*base.step;
 return worldRoads[region].filter(road=>road.canyon).map(({edge,x:dx,z:dz})=>{
  const [x,z]=edge;
  const a=x-dx*103,b=z-dz*103;
  const left=snap(Math.min(x,a)-Math.abs(dz)*66-8,base.x,false);
  const top=snap(Math.min(z,b)-Math.abs(dx)*66-8,base.z,false);
  const right=snap(Math.max(x,a)+Math.abs(dz)*66+8,base.x,true);
  const bottom=snap(Math.max(z,b)+Math.abs(dx)*66+8,base.z,true);
  return {x:left,z:top,step:2,columns:(right-left)/2+1,rows:(bottom-top)/2+1};
 });
}
function openWorldCrossing(x,z){`);
 replace(" const {west,east,north,south}=worldBounds,points=[],columns=65,rows=41;"," const {west,east,north,south}=worldBounds,points=[];\n  const canyon=region===2||region===3,columns=canyon?159:65,rows=canyon?101:41;");
 replace("   triangle(a.pos,b.pos,c.pos,mix(a.tint,c.tint,.5),2);\n   triangle(a.pos,c.pos,d.pos,mix(b.tint,d.tint,.5),2);",`   if(canyon){
    for(const [u,v] of [[row-1,col-1],[row,col-1],[row,col],[row-1,col-1],[row,col],[row-1,col]]){
     const p=points[u][v];
     p.normal??=unit([
      points[u][Math.max(0,v-1)].pos[1]-points[u][Math.min(columns-1,v+1)].pos[1],8,
      points[Math.max(0,u-1)][v].pos[1]-points[Math.min(rows-1,u+1)][v].pos[1]
     ]);
     verts.push(...p.pos,...p.normal,...p.tint,2);
    }
   }else{
    triangle(a.pos,b.pos,c.pos,mix(a.tint,c.tint,.5),2);
    triangle(a.pos,c.pos,d.pos,mix(b.tint,d.tint,.5),2);
   }`);
});
edit("index.html",replace=>{
 replace(' const patches=[5,6].includes(s.region)?',' const legacyPatches=[5,6].includes(s.region)?');
 replace(' terraceTerrain=patches.map(grid=>({',' const patches=[...legacyPatches,...canyonTerrainPatches(s.region,activeTerrain)];\n terraceTerrain=patches.map(grid=>({');
 replace(' if(!villageFrame&&openWorldCrossing(x,z))return height(x,z);',' if(!villageFrame&&s.region!==2&&s.region!==3&&openWorldCrossing(x,z))return height(x,z);');
});
