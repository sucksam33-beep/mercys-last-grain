"use strict";

function allDirtTrailRoutes(region){return dirtTrailRoutes[region].concat(trailConnections[region].links);}

function drawWeatheredTrack(route,halfWidth,style,lift,skip){
 let prior=null,along=0;
 const sideOf=(a,b)=>{
  const dx=b[0]-a[0],dz=b[1]-a[1],d=Math.hypot(dx,dz)||1;
  return [-dz/d,dx/d];
 };
 const emit=(v)=>verts.push(...v.p,...v.normal,v.side,style,v.along,110);
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(length<.05)continue;
  const side=sideOf(a,b),begin=sideOf(route[i-2]??a,b),end=sideOf(a,route[i+1]??b);
  const steps=Math.ceil(length/1.04);
  for(let j=0;j<=steps;j++){
   if(i>1&&j===0)continue;
   const t=j/steps,x=lerp(a[0],b[0],t),z=lerp(a[1],b[1],t);
   const y=terrainSurface(x,z);
   if(y<2.18||skip?.(x,z)){prior=null;continue;}
   const [nx,nz]=j===0?begin:j===steps?end:side;
   const width=halfWidth*(1+.09*Math.sin(x*.12+z*.17)+.04*Math.cos(x*.32-z*.21));
   const section=[-1.14,-.60,0,.60,1.14].map(side=>{
    const px=x+nx*width*side,pz=z+nz*width*side;
    const h=terrainSurface(px,pz);
    const normal=unit([terrainSurface(px-.34,pz)-terrainSurface(px+.34,pz),.68,terrainSurface(px,pz-.34)-terrainSurface(px,pz+.34)]);
    return {p:[px,h+lift,pz],normal,side,along:along+length*t};
   });
   if(prior)for(let k=0;k<section.length-1;k++){
    const a=prior[k],b=prior[k+1],c=section[k+1],d=section[k];
    emit(a);emit(b);emit(c);emit(a);emit(c);emit(d);
   }
   prior=section;
  }
  along+=length;
 }
}
function drawDirtTrails(region){
 const width=region===1||region===5?1.64:1.45;
 const skip=(x,z)=>onAsagiBridge(x,z)||Number.isFinite(trailBridgeDeckHeight(region,x,z));
 for(const [i,route] of allDirtTrailRoutes(region).entries())drawWeatheredTrack(route,width,0,.061+(i%13)*.0019,skip);
}
const dirtTrailCells=new Map();
const dirtTrailCellSize=20;
function dirtTrailDistance(region,x,z){
 let cells=dirtTrailCells.get(region);
 if(!cells){
  cells=new Map();
  for(const route of allDirtTrailRoutes(region))for(let i=1;i<route.length;i++){
   const [a,b]=route[i-1],[c,d]=route[i],dx=c-a,dz=d-b,square=dx*dx+dz*dz;
   if(square<.01)continue;
   const segment={a,b,dx,dz,square};
   for(let row=Math.floor((Math.min(b,d)-3)/dirtTrailCellSize);row<=Math.floor((Math.max(b,d)+3)/dirtTrailCellSize);row++){
    for(let col=Math.floor((Math.min(a,c)-3)/dirtTrailCellSize);col<=Math.floor((Math.max(a,c)+3)/dirtTrailCellSize);col++){
     const key=col+":"+row;
     if(!cells.has(key))cells.set(key,[]);
     cells.get(key).push(segment);
    }
   }
  }
  dirtTrailCells.set(region,cells);
 }
 const segments=cells.get(Math.floor(x/dirtTrailCellSize)+":"+Math.floor(z/dirtTrailCellSize));
 if(!segments)return Infinity;
 let distance=Infinity;
 for(const {a,b,dx,dz,square} of segments){
  const t=cap(((x-a)*dx+(z-b)*dz)/square,0,1);
  distance=Math.min(distance,Math.hypot(x-a-dx*t,z-b-dz*t));
 }
 return distance;
}
