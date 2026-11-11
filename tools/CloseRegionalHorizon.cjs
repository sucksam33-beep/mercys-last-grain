const fs=require("node:fs"),path=require("node:path");
const game=process.argv[2];
const p=path.join(game,"OpenWorld.js");
let s=fs.readFileSync(p,"utf8").replace(/\r\n/g,"\n");
function replace(a,b){if(!s.includes(a))throw Error("Horizon hook missing "+a);s=s.replace(a,b);}
replace("const worldCorners=new Map();","const worldCorners=new Map();\nconst worldExteriorMeshes=new Map(),worldExteriorEdges=new Map();");
replace(" return weight?lerp(natural,sum/weight,influence):natural;\n}"," const base=weight?lerp(natural,sum/weight,influence):natural;\n return blendWorldCorner(region,x,z,base);\n}");
replace("function openWorldRoad(region,x,z){",`function blendWorldCorner(region,x,z,natural){
 const {west,east,north,south}=worldBounds;
 const ix=x<(west+east)*.5?0:1,iz=z<(north+south)*.5?0:1;
 const distance=Math.hypot(x-(ix?east:west),z-(iz?south:north));
 if(distance>=36)return natural;
 const [col,row]=openWorldTiles[region];
 return lerp(worldCornerHeight(col+ix,row+iz),natural,terrainEase(0,36,distance));
}
function openWorldRoad(region,x,z){`);
replace(' if(relative==vec2(0.))return false;\n vec2 tile=openWorldOwner+relative;\n if(any(lessThan(tile,vec2(0.)))||any(greaterThan(tile,vec2(2.))))return false;\n return mod(floor(openWorldMask/exp2(tile.x+tile.y*3.)),2.)>.5;',
 ' return any(notEqual(relative,vec2(0.)));');
replace('const openWorldMask=openWorldTiles.reduce((mask,[col,row])=>mask+(1<<(row*3+col)),0);\n','');
replace('uniform vec2 openWorldOwner;\n','');
replace(' gl.uniform2fv(uniform.openWorldOwner,openWorldTiles[s.region]);\n gl.uniform1f(uniform.openWorldMask,active?openWorldMask:0);',' gl.uniform1f(uniform.openWorldMask,Number(active));');
replace("function drawOpenWorld(mesh,eye){",`function worldExteriorEdge(col,row,dx,dz){
 const neighbor=openWorldTiles.findIndex(([x,z])=>x===col+dx&&z===row+dz);
 if(neighbor<0)return null;
 const key=[neighbor,dx,dz].join(":");
 if(worldExteriorEdges.has(key))return worldExteriorEdges.get(key);
 worldRoadGrades(neighbor);
 const prior=s.region,positions=[],tints=[];
 const {west,east,north,south}=worldBounds,step=worldTerrainStep;
 try{
  s.region=neighbor;
  for(let along=dx?north:west;along<=(dx?south:east);along+=step){
   const x=dx?(dx>0?west:east):along,z=dz?(dz>0?north:south):along;
   const y=height(x,z);
   positions.push(y);
   tints.push(openWorldTerrainTint(neighbor,x,z,y,.88));
  }
 }finally{s.region=prior;}
 const edge={positions,tints,dx,dz};
 worldExteriorEdges.set(key,edge);
 return edge;
}
function makeExteriorMesh(col,row){
 const key=col+":"+row;
 if(worldExteriorMeshes.has(key))return worldExteriorMeshes.get(key);
 const edges=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dz])=>worldExteriorEdge(col,row,dx,dz)).filter(Boolean);
 const step=worldTerrainStep,{west,east,north,south}=worldBounds;
 const columns=1+worldBounds.width/step,rows=1+worldBounds.depth/step,points=[];
 const seabed=[.29,.36,.32],water=[.40,.58,.62];
 const previous=verts;
 verts=[];
 try{
  for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){
   const x=west+c*step,z=north+r*step;
   const gx=x+col*worldBounds.width,gz=z+row*worldBounds.depth;
   const floor=.45+.17*Math.sin(gx*.028+gz*.011)+.16*Math.cos(gz*.021-gx*.009);
   let heightSum=0,tintSum=[0,0,0],total=0,influence=0;
   for(const {positions,tints,dx,dz} of edges){
    const distance=dx?(dx>0?east-x:x-west):(dz>0?south-z:z-north);
    if(distance>=158)continue;
    const along=dx?r:c;
    const w=1-terrainEase(0,158,distance);
    const priority=w/Math.max(.012,distance*distance);
    heightSum+=positions[along]*priority;
    for(let i=0;i<3;i++)tintSum[i]+=tints[along][i]*priority;
    total+=priority;influence=Math.max(influence,w);
   }
   const y=total?lerp(floor,heightSum/total,influence):floor;
   points.push({position:[x,y,z],tint:total?mix(seabed,tintSum.map(v=>v/total),influence):seabed});
  }
  for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){
   const i=r*columns+c,y=points[i].position[1];
   const left=c?points[i-1].position[1]:y,right=c<columns-1?points[i+1].position[1]:y;
   const near=r?points[i-columns].position[1]:y,far=r<rows-1?points[i+columns].position[1]:y;
   points[i].normal=unit([left-right,step*2,near-far]);
  }
  for(let r=0;r<rows-1;r++)for(let c=0;c<columns-1;c++){
   const a=r*columns+c,b=a+columns,d=a+1,k=b+1;
   for(const i of [a,b,k,a,k,d]){
    const {position,normal,tint}=points[i];
    verts.push(...position,...normal,...tint,2);
   }
  }
  quad([west,2.12,north],[west,2.12,south],[east,2.12,south],[east,2.12,north],water,1);
  const buffer=gl.createBuffer();
  upload(buffer);
  const part={buffer,count:verts.length/10};
  worldExteriorMeshes.set(key,part);
  return part;
 }finally{verts=previous;}
}
function drawOpenWorld(mesh,eye){`);
replace("  mesh(part.buffer,part.count,[ox,0,oz],0);\n }\n}","  mesh(part.buffer,part.count,[ox,0,oz],0);\n }\n drawExteriorWorld(mesh,eye,col,row);\n}");
replace("function decorateOpenWorld(){",`function drawExteriorWorld(mesh,eye,col,row){
 const {width,depth,west,east,north,south}=worldBounds;
 for(let z=row-1;z<=row+1;z++)for(let x=col-1;x<=col+1;x++){
  if(openWorldTiles.some(([a,b])=>a===x&&b===z))continue;
  const ox=(x-col)*width,oz=(z-row)*depth;
  const distance=Math.hypot(Math.max(0,ox+west-eye[0],eye[0]-ox-east),Math.max(0,oz+north-eye[2],eye[2]-oz-south));
  if(distance>370)continue;
  const part=makeExteriorMesh(x,z);
  mesh(part.buffer,part.count,[ox,0,oz],0);
 }
}
function decorateOpenWorld(){`);
fs.writeFileSync(p,s);
const html=path.join(game,"index.html");
s=fs.readFileSync(html,"utf8");
s=s.replace(' const paintLand=topographicPainter(s.region);\n','').replace(' appendTerrainHorizon(activeTerrain,terrainPoints,paintLand);\n','')
 .replaceAll('"openWorldOwner","openWorldMask"','"openWorldMask"');
fs.writeFileSync(html,s);
