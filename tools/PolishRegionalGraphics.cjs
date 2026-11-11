const fs=require("node:fs"),path=require("node:path");
const game=process.argv[2];
const edit=(file,changes)=>{
 const p=path.join(game,file);
 let s=fs.readFileSync(p,"utf8").replace(/\r\n/g,"\n");
 for(const [a,b] of changes){
  if(!s.includes(a))throw Error(file+" missing "+a.slice(0,90));
  s=s.replace(a,b);
 }
 fs.writeFileSync(p,s);
};
edit("OpenWorld.js",[
 ["const worldLandStyles=new Map();","const worldLandStyles=new Map();\nconst worldCorners=new Map();\nconst worldTrailTint=[.64,.56,.43];"],
 ["function prepareWorldSeam(region,road){",`function worldCornerHeight(col,row){
 const key=col+","+row;
 if(worldCorners.has(key))return worldCorners.get(key);
 const original=s.region,heights=[];
 try{
  for(const [region,[tileX,tileZ]] of openWorldTiles.entries()){
   if((tileX!==col&&tileX+1!==col)||(tileZ!==row&&tileZ+1!==row))continue;
   s.region=region;
   const x=tileX===col?worldBounds.west+33:worldBounds.east-33;
   const z=tileZ===row?worldBounds.north+33:worldBounds.south-33;
   heights.push(districtHeight(x,z));
  }
 }finally{s.region=original;}
 const height=heights.reduce((sum,y)=>sum+y,0)/heights.length;
 worldCorners.set(key,height);
 return height;
}
function prepareWorldSeam(region,road){`],
 [" const samplingDistance=worldSeamWidth*.78;"," const samplingDistance=worldSeamWidth*.78;\n const [col,row]=openWorldTiles[region];\n const corner=offset=>dx?worldCornerHeight(col+Number(dx>0),row+offset):worldCornerHeight(col+offset,row+Number(dz>0));\n const first=corner(0),last=corner(1);"],
 ["   heights.push(shared);","   const fromCorner=along-start;\n   heights.push(lerp(lerp(first,shared,terrainEase(0,45,fromCorner)),last,1-terrainEase(0,45,length-fromCorner)));"],
 [" seam.start=start;"," seam.heights[0]=first;\n seam.heights[seam.heights.length-1]=last;\n seam.start=start;"],
 ["  sum+=seamHeight(road,along)*w;\n  weight+=w;","  const priority=w/Math.max(.012,gap*gap);\n  sum+=seamHeight(road,along)*priority;\n  weight+=priority;"],
 ["  const edgeTint=mix(shade(entry.seam.tint,.82+.12*up),style.path,1-terrainEase(3,8,route));\n  ground=mix(ground,edgeTint,(1-terrainEase(0,31,axis))*.76);","  const edgeTint=shade(entry.seam.tint,.82+.12*up);\n  ground=mix(ground,edgeTint,1-terrainEase(0,31,axis));"],
 [" return ground;\n}"," const rut=terrainEase(.4,1.55,route)*(1-terrainEase(2.35,3.45,route));\n const gravelTrack=shade(mix(style.path,worldTrailTint,.54),.92+.08*Math.sin(x*.32+z*.22)-rut*.09);\n return mix(ground,gravelTrack,(1-terrainEase(3.9,7.8,route))*.89);\n}"],
 ["   box(rx,h-.25,rz,.20,1.23,.20,oak,0,surface.wall);","   box(rx,h-.25,rz,.20,1.23,.20,oak,0,surface.wall);\n   addSurface(rx,rz,.20,.20,h-.25,h+.98,false);"],
 ["   tube([rx,h+.78,rz],[bx,height(bx,bz)+.78,bz],.07,.07,oak,0,5);","   const far=height(bx,bz);\n   tube([rx,h+.78,rz],[bx,far+.78,bz],.07,.07,oak,0,5);\n   addSurface((rx+bx)*.5,(rz+bz)*.5,Math.abs(rx-bx)+.14,Math.abs(rz-bz)+.14,Math.min(h,far)+.65,Math.max(h,far)+.86,false);"],
 ["const openWorldMask=openWorldTiles.reduce",`function inWorldCoastalSeam(x,z){
 return worldRoads[s.region].some(road=>road.seam.coast&&
  Math.abs(road.x*(x-road.edge[0])+road.z*(z-road.edge[1]))<worldSeamWidth&&
  Math.abs(road.z*(x-road.edge[0])+road.x*(z-road.edge[1]))<125);
}
function emitWorldCoastalWater(){
 const tint=color(regions[s.region].water),step=worldTerrainStep;
 const {west,east,north,south}=worldBounds;
 const coastal=worldRoads[s.region].find(road=>road.seam.coast);
 if(!coastal)return;
 const {edge}=coastal;
 for(let x=west;x<east;x+=step)for(let z=north;z<south;z+=step){
  if(!inWorldCoastalSeam(x+step*.5,z+step*.5))continue;
  // The existing shoreline already covers these cells.
  if(s.region===5&&x>=245&&z>=310||s.region===6&&x>=506)continue;
  if(Math.min(terrainSurface(x,z),terrainSurface(x+step,z),terrainSurface(x,z+step),terrainSurface(x+step,z+step))>=2.12)continue;
  const y=2.12;
  quad([x,y,z],[x,y,z+step],[x+step,y,z+step],[x+step,y,z],tint,1);
 }
}
const openWorldMask=openWorldTiles.reduce`],
 [" const {edge}=coastal;\n",""]
]);
edit("index.html",[
 [" return floor<1.42&&coastExposure(s.region,x,z)>.24?null:floor;",
 " return floor<1.42&&(coastExposure(s.region,x,z)>.24||inWorldCoastalSeam(x,z))?null:floor;"],
 [" appendCoastalWater(s.region,color(v.water));"," appendCoastalWater(s.region,color(v.water));\n emitWorldCoastalWater();"],
 [" const art=districtArt[s.region];\n const grass=color(s.region===0"," const art=districtArt[s.region];\n const grass=color(s.region===0"],
 [" const grass=color(s.region===0?\"#7e8e49\":v.grass), path=color(art?.path||\"#a49877\"), woods=color(v.tree), mineral=color(art?.rock||\"#95836a\");",
  " const grass=color(s.region===0?\"#7e8e49\":v.grass), woods=color(v.tree);"]
]);
edit("asagi-plants.js",[
 ["  const road=roadDist(x,z),river=riverDist(x,z),bank=channelWidth(z);",
 "  const road=Math.min(roadDist(x,z),openWorldRoad(region,x,z).gap-.8),river=riverDist(x,z),bank=channelWidth(z);"]
]);
