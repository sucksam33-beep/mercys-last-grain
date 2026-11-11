"use strict";
const trailBridgeHalfWidth=1.63;
function trailBridgeHeight(a,b,x,z){
 const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
 const px=x-a[0],pz=z-a[1],along=(px*dx+pz*dz)/length,side=(-px*dz+pz*dx)/length;
 if(along<-.085||along>length+.085||Math.abs(side)>=trailBridgeHalfWidth+.06)return -Infinity;
 return lerp(terrainSurface(...a),terrainSurface(...b),cap(along/length,0,1))+.08;
}
function trailBridgeDeckHeight(region,x,z){
 let top=-Infinity;
 for(const {a,b} of trailConnections[region].bridges)top=Math.max(top,trailBridgeHeight(a,b,x,z));
 return top;
}
function drawTrailConnections(region){
 const {bridges,destinations}=trailConnections[region];
 const post=color("#654c35"),deck=color("#95744c"),iron=color("#59594e");
 for(const {a,b} of bridges){
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
  const ux=dx/length,uz=dz/length,nx=-uz,nz=ux,half=trailBridgeHalfWidth;
  const aY=terrainSurface(...a)+.08,bY=terrainSurface(...b)+.08;
  const point=(t,side,lift=0)=>[lerp(a[0],b[0],t)+nx*side,lerp(aY,bY,t)+lift,lerp(a[1],b[1],t)+nz*side];
  const count=Math.ceil(length/.45);
  for(let i=0;i<count;i++){
   const t=i/count,v=(i+1)/count;
   quad(point(t,-half),point(t,half),point(v,half),point(v,-half),shade(deck,.83+(i%7)*.044),surface.wall);
  }
  addSurface((a[0]+b[0])*.5,(a[1]+b[1])*.5,Math.abs(dx)+2*Math.abs(nx)*half+.12,
   Math.abs(dz)+2*Math.abs(nz)*half+.12,Math.min(aY,bY)-.27,(x,z)=>trailBridgeHeight(a,b,x,z));
  for(const side of [-half,half]){
   tube(point(0,side,.77),point(1,side,.77),.061,.061,post,surface.wall,6);
   tube(point(0,side,.35),point(1,side,.35),.041,.041,post,surface.wall,6);
   const posts=Math.ceil(length/3.7);
   for(let i=0;i<=posts;i++){
    const [x,y,z]=point(i/posts,side);
    box(x,y-.16,z,.17,1.09,.17,post,0,surface.wall);
    if(i%2===0){
     const ground=terrainSurface(x,z);
     if(y-ground>.24)box(x,ground-.06,z,.34,y-ground+.06,.34,post,0,surface.wall);
    }
   }
  }
 }
 for(const {point:[x,z],kind,name} of destinations){
  const y=terrainSurface(x,z);
  if(y<2.2)continue;
  const tone=kind==="gather"?color("#8c8048"):kind==="village"?color("#82623c"):color("#788373");
  const px=x+1.18,pz=z+.80,py=terrainSurface(px,pz);
  box(px,py,pz,.12,1.42,.12,post,0,surface.wall);
  box(px,py+.98,pz,.76,.38,.09,tone,0,surface.wall);
  box(px,py+1.31,pz,.83,.08,.16,post,0,surface.wall);
  aimBox(name,px,pz,.78,.26,py+.9,py+1.43);
  if(kind==="view"){
   const bx=x-1.72,bz=z+.51,by=terrainSurface(bx,bz);
   if(Math.abs(by-y)<.43){
    box(bx,by+.42,bz,1.38,.12,.38,deck,.14,surface.wall);
    for(const side of [-.49,.49])box(bx+side,by-.04,bz,.11,.47,.26,iron,.14,surface.wall);
   }
  }
 }
}
