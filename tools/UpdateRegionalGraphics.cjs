const fs=require("node:fs"),path=require("node:path");
const game=process.argv[2]??path.join(__dirname,"game");
const edit=(file,change)=>{
 const p=path.join(game,file);
 const replace=(s,a,b)=>{
  if(!s.includes(a))throw Error(file+" hook missing "+a.slice(0,120));
  return s.replace(a,b);
 };
 fs.writeFileSync(p,change(fs.readFileSync(p,"utf8").replace(/\r\n/g,"\n"),replace));
};
edit("OpenWorld.js",(s,replace)=>{
 s=replace(s,"const worldMeshes=new Map();","const worldMeshes=new Map();\nconst worldLandStyles=new Map();\nconst worldSeamWidth=68;\nconst worldTerrainStep=4;");
 s=replace(s,"for(const [a,b,axis,name] of worldLinks){","for(const [a,b,axis,name] of worldLinks){\n const seam={};");
 s=replace(s,"{to,x,z,edge,approach,name}","{to,x,z,edge,approach,name,seam}");
 const a=s.indexOf("function worldRoadGrades("),b=s.indexOf("function openWorldMove(",a);
 s=s.slice(0,a)+`function prepareWorldSeam(region,road){
 const seam=road.seam;
 if(seam.heights)return;
 const {x:dx,z:dz,edge,to}=road;
 const opposite=worldRoads[to].find(other=>other.to===region);
 const start=dx?worldBounds.north:worldBounds.west;
 const length=dx?worldBounds.depth:worldBounds.width;
 const source=s.region,heights=[];
 const coast=(region===5&&to===6)||(region===6&&to===5);
 const frost=(region===4&&to===7)||(region===7&&to===4);
 const samplingDistance=worldSeamWidth*.78;
 try{
  for(let along=start;along<=start+length;along+=worldTerrainStep){
   const sample=(tile,border)=>{
    s.region=tile;
    return districtHeight(dx?border.edge[0]-border.x*samplingDistance:along,
     dx?along:border.edge[1]-border.z*samplingDistance);
   };
   const left=sample(region,road),right=sample(to,opposite);
   const axis=dx?edge[1]:edge[0];
   const band=Math.exp(-((along-axis)**2)/(frost?86**2:55**2));
   const water=coast?Math.max(.58,Math.min(left,right)*.22):0;
   const shared=coast?lerp((left+right)*.5,water,band*.96):(left+right)*.5;
   heights.push(shared);
  }
 }finally{s.region=source;}
 // Use the same filtered profile from both districts.
 seam.heights=heights.map((value,i)=>(heights[Math.max(0,i-2)]+2*heights[Math.max(0,i-1)]+4*value+
  2*heights[Math.min(heights.length-1,i+1)]+heights[Math.min(heights.length-1,i+2)])*.1);
 seam.start=start;
 seam.tint=mix(color(regions[region].grass),color(regions[to].grass),.5);
 seam.coast=coast;
}
function seamHeight(road,along){
 const {start,heights}=road.seam;
 const offset=cap((along-start)/worldTerrainStep,0,heights.length-1);
 const i=Math.min(heights.length-2,Math.floor(offset));
 return lerp(heights[i],heights[i+1],offset-i);
}
function worldRoadGrades(region){
 const original=s.region;
 s.region=region;
 try{
  for(const road of worldRoads[region])prepareWorldSeam(region,road);
  for(const road of worldRoads[region]){
   if(road.samples)continue;
   const hub=worldHubs[region],points=[road.edge,road.approach,hub],samples=[];
   const edgeGrade=Math.max(3.25,seamHeight(road,road.x?road.edge[1]:road.edge[0]));
   road.seam.roadGrade??=edgeGrade;
   road.segments=[];
   for(let i=0;i<2;i++){
    const a=points[i],b=points[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const count=Math.ceil(length/7);
    road.segments.push({a,b,start:Math.max(0,samples.length-1),count});
    for(let j=i?1:0;j<=count;j++){
     const x=lerp(a[0],b[0],j/count),z=lerp(a[1],b[1],j/count);
     const distance=(i?84:0)+length*j/count;
     const natural=openWorldBorder(region,x,z,districtHeight(x,z));
     const previous=samples.at(-1);
     const target=lerp(edgeGrade,Math.max(3.25,natural),terrainEase(8,54,distance));
     const rise=previous?.distance===undefined?0:(distance-previous.distance)*.20;
     const grade=previous?cap(target,previous.y-rise,previous.y+rise):edgeGrade;
     samples.push({x,z,y:grade,distance});
    }
   }
   road.samples=samples;
  }
 }finally{s.region=original;}
}
function openWorldBorder(region,x,z,natural){
 let sum=0,weight=0,influence=0;
 for(const road of worldRoads[region]){
  if(!road.seam.heights)continue;
  const gap=Math.abs(road.x*(x-road.edge[0])+road.z*(z-road.edge[1]));
  if(gap>=worldSeamWidth)continue;
  const along=road.x?z:x;
  const w=1-terrainEase(0,worldSeamWidth,gap);
  sum+=seamHeight(road,along)*w;
  weight+=w;
  influence=Math.max(influence,w);
 }
 return weight?lerp(natural,sum/weight,influence):natural;
}
function openWorldRoad(region,x,z){
 let distance=Infinity,grade=0,coast=false;
 for(const road of worldRoads[region]){
  const samples=road.samples;
  if(!samples)continue;
  for(const {a,b,start,count} of road.segments){
   const dx=b[0]-a[0],dz=b[1]-a[1];
   const t=cap(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);
   const gap=(x-a[0]-dx*t)**2+(z-a[1]-dz*t)**2;
   if(gap>=distance)continue;
   const offset=t*count,index=Math.min(count-1,Math.floor(offset));
   distance=gap;
   grade=lerp(samples[start+index].y,samples[start+index+1].y,offset-index);
   coast=road.seam.coast&&start===0;
  }
 }
 return {gap:Math.sqrt(distance),grade,coast};
}
function openWorldGround(region,x,z,natural){
 natural=openWorldBorder(region,x,z,natural);
 const {gap,grade,coast}=openWorldRoad(region,x,z);
 const shoulder=coast?27:42+Math.min(22,Math.abs(grade-natural)*.6);
 return {height:lerp(natural,grade,1-terrainEase(9,shoulder,gap)),road:1-terrainEase(3,8,gap)};
}
function openWorldCrossing(x,z){
 return worldRoads[s.region].some(({edge,x:dx,z:dz})=>
  Math.abs(dx*(x-edge[0])+dz*(z-edge[1]))<22&&Math.abs(dz*(x-edge[0])+dx*(z-edge[1]))<11);
}
function openWorldTerrainTint(region,x,z,y,up){
 let style=worldLandStyles.get(region);
 if(!style){
  const art=districtArt[region];
  style={paint:topographicPainter(region),path:color(art?.path||"#a49877"),rock:color(art?.rock||"#95836a")};
  worldLandStyles.set(region,style);
 }
 const channel=riverDist(x,z)-channelWidth(z),bank=cap((channel+1)/9,0,1);
 const legacy=roadDist(x,z),route=openWorldRoad(region,x,z).gap;
 const road=Math.max(terrainEase(0,1,cap((10-legacy)/8,0,1)),1-terrainEase(3,8,route));
 const gravel=shade(style.rock,.73+.16*Math.sin(z*.043-x*.025));
 const meadow=style.paint(x,y,z,up);
 const layered=sandTerrainColor(x,z,meadow,gravel,style.path,legacy,channel+13);
 let ground=mix(mix(gravel,mix(meadow,style.path,road),bank),layered,.54);
 if(region===2||region===3)ground=canyonTint(region,x,y,z,up,ground);
 for(const entry of worldRoads[region]){
  if(!entry.seam.tint)continue;
  const [a,b]=entry.edge,axis=Math.abs(entry.x*(x-a)+entry.z*(z-b));
  if(axis>=31)continue;
  const edgeTint=mix(shade(entry.seam.tint,.82+.12*up),style.path,1-terrainEase(3,8,route));
  ground=mix(ground,edgeTint,(1-terrainEase(0,31,axis))*.76);
 }
 return ground;
}
`+s.slice(b);
 const m=s.indexOf("function makeOpenWorldMesh("),d=s.indexOf("function drawOpenWorld(",m);
 s=s.slice(0,m)+`function makeOpenWorldMesh(region){
 if(worldMeshes.has(region))return worldMeshes.get(region);
 worldRoadGrades(region);
 const previous=s.region,stored=verts;
 s.region=region;
 verts=[];
 try{
  const {west,east,north,south}=worldBounds,step=worldTerrainStep;
  const columns=1+(east-west)/step,rows=1+(south-north)/step,points=[];
  const water=color(regions[region].water);
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const x=west+col*step,z=north+row*step;
   points.push({position:[x,height(x,z),z]});
  }
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const i=row*columns+col,{position:[x,y,z]}=points[i];
   const left=col?points[i-1].position[1]:height(x-step,z);
   const right=col<columns-1?points[i+1].position[1]:height(x+step,z);
   const near=row?points[i-columns].position[1]:height(x,z-step);
   const far=row<rows-1?points[i+columns].position[1]:height(x,z+step);
   const normal=unit([left-right,step*2,near-far]);
   points[i].normal=normal;
   points[i].tint=openWorldTerrainTint(region,x,z,y,normal[1]);
  }
  const waterCells=[];
  for(let row=0;row<rows-1;row++)for(let col=0;col<columns-1;col++){
   const a=row*columns+col,b=a+columns,c=b+1,d=a+1;
   for(const index of [a,b,c,a,c,d]){
    const {position,normal,tint}=points[index];
    verts.push(...position,...normal,...tint,2);
   }
   if(Math.min(...[a,b,c,d].map(i=>points[i].position[1]))<2.12)waterCells.push(a);
  }
  for(const i of waterCells){
   const [x,,z]=points[i].position;
   quad([x,2.12,z],[x,2.12,z+step],[x+step,2.12,z+step],[x+step,2.12,z],water,1);
  }
  paintOpenWorldCanopy(region);
  const buffer=gl.createBuffer();
  upload(buffer);
  const part={buffer,count:verts.length/10};
  worldMeshes.set(region,part);
  return part;
 }finally{verts=stored;s.region=previous;}
}
function paintOpenWorldCanopy(region){
 const {west,east,north,south}=worldBounds,random=rand(431+region*57);
 const leaf=color(regions[region].tree),bark=color("#5f5447");
 const evergreen=[0,3,4,5,7].includes(region);
 for(let i=0;i<1100;i++){
  const x=lerp(west+2,east-2,random()),z=lerp(north+2,south-2,random()),y=height(x,z);
  const density=woodlandCover(region,x,z);
  if(y<2.8||y>(region===7?62:106)||openWorldRoad(region,x,z).gap<10||roadDist(x,z)<5||
   random()>.16+density*.73||Math.abs(height(x+2,z)-height(x-2,z))>2.5)continue;
  const size=(region===2?1.8:3.6)+random()*(evergreen?6.2:4.7);
  const tint=shade(leaf,.77+random()*.47);
  taper(x,y-.10,z,size*.89,size*.034,.028,bark,6);
  if(evergreen){
   for(let tier=0;tier<4;tier++){
    const bottom=size*(.21+tier*.157),radius=size*(.215-tier*.043);
    taper(x,y+bottom,z,size*.37,radius,.028,shade(tint,.88+tier*.064),8);
   }
  }else{
   for(const [dx,dz,h] of [[0,0,.69],[-.13,.09,.58],[.16,-.07,.62]]){
    crown(x+dx*size,y+h*size,z+dz*size,size*(region===6?.24:.17),size*.28,tint);
   }
  }
 }
}
`+s.slice(d);
 return s;
});