import * as T from "./vendor/three/three.module.min.js";

const sites=[
 ["lapel",-.145,1.873],["lapel",.145,1.873],
 ["cuff",-.354,1.389],["cuff",.343,1.395],
 ["bag",-.283,1.393],
 ["shoe",-.248,.141],["shoe",.224,.139],
 ["bag-edge",.115,1.393,"left"],["bag-back",-.225,1.418,"rear"],
 ["boot-wing",-.265,.195,"rear"],["boot-wing",.250,.195,"rear"],
 ["boot-wing",.020,.188,"left"],["boot-wing",.020,.188,"right"]
];
const palettes={
 3:[0xcb8d45,0x64422b,0x73312b],
 4:[0xd0e2e9,0x566b88,0x254f77],
 5:[0xeab65e,0x79501f,0x942d43]
};
const directions={front:[0,0,1],rear:[0,0,-1],left:[-1,0,0],right:[1,0,0]};
const axis=new T.Vector3(0,1,0),forward=new T.Vector3(0,0,1);
const smooth=T.MathUtils.smoothstep;

function add(group,geometry,material,x=0,y=0,z=0){
 const mesh=new T.Mesh(geometry,material);
 mesh.position.set(x,y,z);
 group.add(mesh);
 return mesh;
}
function ring(group,material,w,h,x=0,y=0,z=.013){
 const points=[[-w,-h],[w,-h],[w,h],[-w,h],[-w,-h]].map(([u,v])=>new T.Vector3(x+u,y+v,z));
 return add(group,new T.TubeGeometry(new T.CatmullRomCurve3(points,false,"centripetal",0),24,.003,6),material);
}
function relief(group,rank,part,metal,shade,jewel){
 if(part==="bag-edge"||part==="bag-back"||part==="boot-wing"){
  const bag=part!=="boot-wing",back=part==="bag-back";
  const w=(back?.060:bag?.040:.030)+(rank-3)*(bag?.007:.005);
  const h=(back?.035:bag?.024:.016)+(rank-3)*.004;
  const plate=add(group,new T.CylinderGeometry(1,1,.012,rank===3?4:rank===4?8:12),metal,0,0,.008);
  plate.rotation.x=Math.PI/2;
  plate.scale.set(w,1,h);
  if(back)for(const x of [-w*.82,w*.82])add(group,new T.SphereGeometry(.007,10,7),metal,x,0,.020);
  add(group,new T.BoxGeometry(w*1.22,h*.86,.007),shade,0,0,.016);
  if(rank===3) {
   add(group,new T.BoxGeometry(w*1.21,.005,.005),metal,0,0,.022);
  }else{
   const stone=add(group,new T.IcosahedronGeometry(h*.62,1),jewel,0,0,.021);
   stone.scale.set(1.15,.78,.46);
   for(const x of [-w*.64,w*.64])
    add(group,new T.SphereGeometry(rank===5?.008:.005,10,8),metal,x,0,.021).scale.z=.52;
   if(rank===5){
    for(const x of [-w*.38,w*.38]){
     const petal=add(group,new T.SphereGeometry(.012,10,8),metal,x,h*.68,.017);
     petal.scale.set(.60,1.13,.48);petal.rotation.z=x<0?-.55:.55;
    }
   }
  }
  return;
 }
 const broad=part==="bag"?1.22:part==="cuff"?.85:part==="shoe"?.90:1;
 group.scale.setScalar(broad);
 if(part==="shoe"){
  const w=rank===3?.028:rank===4?.037:.045,h=rank===3?.016:rank===4?.022:.025;
  add(group,new T.BoxGeometry(w*2+.013,h*2+.012,.010),shade,0,0,.001);
  ring(group,metal,w,h,0,0,.008);
  add(group,new T.BoxGeometry(.006,h*2,.007),metal,0,0,.010);
  if(rank===5){
   ring(group,metal,w-.007,h-.006,0,0,.013);
   for(const x of [-w*.58,w*.58])add(group,new T.SphereGeometry(.008,10,8),jewel,x,0,.016).scale.z=.64;
  }
  return;
 }
 if(rank===3){
  const plate=add(group,new T.CylinderGeometry(.032,.032,.009,4),metal);
  plate.rotation.x=Math.PI/2;plate.rotateY(Math.PI/4);
  add(group,new T.SphereGeometry(.014,12,8),shade,0,0,.009).scale.z=.38;
  if(part==="bag")ring(group,metal,.024,.016);
 }else if(rank===4){
  const plate=add(group,new T.CylinderGeometry(.041,.041,.010,8),shade);
  plate.rotation.x=Math.PI/2;
  const border=add(group,new T.TorusGeometry(.037,.0048,8,24),metal,0,0,.009);
  border.scale.set(1.11,.78,1);
  add(group,new T.SphereGeometry(.018,14,10),jewel,0,0,.014).scale.set(1,.77,.55);
  for(const x of [-.031,.031])add(group,new T.SphereGeometry(.006,8,6),metal,x,0,.016);
 }else{
  const back=add(group,new T.CylinderGeometry(.049,.049,.011,12),shade);
  back.rotation.x=Math.PI/2;
  add(group,new T.TorusGeometry(.043,.0049,8,28),metal,0,0,.011);
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3;
   const petal=add(group,new T.SphereGeometry(.014,10,7),metal,.026*Math.cos(a),.026*Math.sin(a),.014);
   petal.scale.set(1.35,.61,.47);
   petal.rotation.z=a;
  }
  const stone=add(group,new T.IcosahedronGeometry(.021,1),jewel,0,0,.020);
  stone.scale.z=.65;
  if(part==="lapel"||part==="bag"){
   for(const x of [-.024,.024]){
    const tip=add(group,new T.ConeGeometry(.009,.033,5),metal,x,-.050,.012);
    tip.rotation.z=Math.PI;
   }
  }
 }
}

export function createCoatOrnaments(actor,mesh,rest){
 const root=new T.Group();root.name="coat-ornaments";root.visible=false;actor.root.add(root);
 const index=mesh.geometry.index,attribute=mesh.geometry.attributes.position;
 const tri=new T.Triangle(),hit=new T.Vector3(),probe=new T.Vector3(),ray=new T.Ray(probe,new T.Vector3(0,0,-1));
 const tmp=new T.Vector3(),normal=new T.Vector3(),offset=new T.Vector3();
 const points=[new T.Vector3(),new T.Vector3(),new T.Vector3()];
 const posed=[new T.Vector3(),new T.Vector3(),new T.Vector3()];
 const basis=new T.Matrix4(),right=new T.Vector3(),up=new T.Vector3(),inverse=new T.Matrix4();
 const original=new T.Vector3();
 let anchors;
 function buildAnchors(){
  return sites.map(([part,u,y,view="front"])=>{
  const [dx,,dz]=directions[view];
  const horizontal=p=>dx?p.z:p.x;
  ray.direction.set(-dx,0,-dz);
  let best=null,score=-Infinity;
  for(let i=0;i<(index?.count??attribute.count);i+=3){
   const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);
   for(let k=0;k<3;k++)points[k].fromArray(rest,ids[k]*3);
   if(points.every(p=>horizontal(p)<u-.027)||points.every(p=>horizontal(p)>u+.027)||points.every(p=>p.y<y-.027)||points.every(p=>p.y>y+.027))continue;
   tri.set(...points);
   probe.set(dx?dx*2:u,y,dx?u:dz*2);
   if(!ray.intersectTriangle(...points,false,hit)){
    tri.closestPointToPoint(probe.set(dx?points[0].x:u,y,dx?u:points[0].z),hit);
    if(Math.hypot(horizontal(hit)-u,hit.y-y)>.019)continue;
   }
   const quality=(hit.x*dx+hit.z*dz)-4*Math.hypot(horizontal(hit)-u,hit.y-y);
   if(quality<=score)continue;
   tri.getNormal(normal);
   const sign=normal.x*dx+normal.z*dz<0?-1:1;
   normal.multiplyScalar(sign);
   const verticalAxis=Math.abs(normal.y)>.94?forward:axis;
   offset.copy(verticalAxis).addScaledVector(normal,-verticalAxis.dot(normal)).normalize().multiplyScalar(.024).add(hit);
   const at=tri.getBarycoord(hit,new T.Vector3()),vertical=tri.getBarycoord(offset,new T.Vector3());
   if(at&&vertical){score=quality;best={part,ids,at,vertical,sign};}
  }
  if(!best)return null;
  best.mount=new T.Group();
  best.mount.name="coat-ornament-"+part;
  root.add(best.mount);
  best.ranks=new Map();
  for(const [rank,colors] of Object.entries(palettes)){
   const group=new T.Group();group.name="coat-ornament-rank-"+rank;
   const metal=new T.MeshStandardMaterial({color:colors[0],metalness:.58,roughness:.33,emissive:colors[0],emissiveIntensity:.10});
   const shade=new T.MeshStandardMaterial({color:colors[1],metalness:.39,roughness:.45});
   const jewel=new T.MeshStandardMaterial({color:colors[2],metalness:.24,roughness:.24,emissive:colors[2],emissiveIntensity:.12});
   relief(group,Number(rank),part,metal,shade,jewel);
   group.visible=false;best.mount.add(group);best.ranks.set(Number(rank),group);
  }
  return best;
  }).filter(Boolean);
 }

 function vertex(i,shape,gaiter,target){
  const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2];
  const hand=mesh.geometry.attributes.tailorLimbs.getX(i);
  const center=(1-smooth(Math.abs(x),.22,.37))*(1-smooth(y,1.95,2.07))*smooth(y,.75,1.16)*(1-smooth(hand,.10,.32));
  const tail=(1-smooth(y,.62,1.24))*smooth(y,.44,.56);
  const edge=Math.max(smooth(Math.abs(x),.207,.268),1-smooth(z,-.13,-.08));
  const shin=smooth(y,.22,.31)*(1-smooth(y,.52,.59))*gaiter;
  original.fromBufferAttribute(attribute,i);
  attribute.setXYZ(i,original.x*(1+(shape.x-1)*center)*(1+tail*edge*shape.z*.25),original.y,
   original.z*(1+(shape.y-1)*center)*(1+tail*edge*shape.z*.16)*(1+shin*.028));
  mesh.getVertexPosition(i,target);
  attribute.setXYZ(i,original.x,original.y,original.z);
  target.applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);
 }
 function update(rank,shape,gaiter){
  root.visible=rank>=3;
  if(!root.visible)return;
  anchors??=buildAnchors();
  inverse.copy(actor.root.matrixWorld).invert();
  for(const a of anchors){
   for(const [level,group] of a.ranks)group.visible=level===rank;
   for(let k=0;k<3;k++)vertex(a.ids[k],shape,gaiter,posed[k]);
   tri.set(...posed).getNormal(normal).multiplyScalar(a.sign);
   if(normal.lengthSq()<.5){a.mount.visible=false;continue;}
   a.mount.visible=true;
   a.mount.position.set(0,0,0);
   tmp.set(0,0,0);
   for(let k=0;k<3;k++){
    a.mount.position.addScaledVector(posed[k],a.at.getComponent(k));
    tmp.addScaledVector(posed[k],a.vertical.getComponent(k));
   }
   up.copy(tmp).sub(a.mount.position).normalize();
   right.crossVectors(up,normal).normalize();up.crossVectors(normal,right).normalize();
   basis.makeBasis(right,up,normal);
   a.mount.quaternion.setFromRotationMatrix(basis);
   a.mount.position.addScaledVector(normal,a.part==="bag-back"?.013:a.part==="shoe"?.006:.005);
  }
 }
 return {update};
}

