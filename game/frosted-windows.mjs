import * as THREE from "./vendor/three/three.module.min.js";

// Pane rectangles from the front, right, left and rear orthographic views.
// In each view the model fits the 400px square starting at (50, 50).
const windowsByRegion=[
 [
  // The tall infill panels are walls. Only the small front transoms are glazed.
  [[110,221,187,242],[308,223,392,243]]
 ],
 [
  [[272,94,289,113],[186,244,215,297],[332,244,360,297],[186,349,215,397],[332,349,361,397]],
  [[222,151,280,179],[145,250,192,298],[307,250,353,298],[141,352,184,395],[320,352,359,395]],
  [[154,244,182,293],[318,244,347,293]],
  [[211,94,230,113],[137,244,169,297],[278,244,313,297],[137,347,168,396],[273,347,315,396]]
 ],
 [
  [[136,215,164,270],[338,216,363,270]],
  [[142,215,163,270],[337,216,360,270]],
  [[142,215,163,270],[337,216,360,270]],
  [[136,215,164,270],[338,216,363,270]]
 ],
 [
  [[160,274,196,312],[313,275,345,314]],
  [[278,275,305,324]],
  [[195,274,223,324]],
  [[215,279,237,325]]
 ],
 [
  [],
  [[182,258,211,314],[328,258,351,314]],
  [[151,258,178,314],[276,258,301,314]],
  [[240,158,259,178]]
 ],
 [
  [],
  [[368,202,398,269]],
  [[101,200,131,270]]
 ],
 [
  [[158,278,195,343],[307,278,338,343]],
  [[155,275,195,343],[300,276,344,343]],
  [[156,276,197,343],[306,276,342,343]],
  [[159,278,194,343],[305,278,341,343]]
 ],
 [
  [[233,147,266,181]],
  [[139,282,168,324],[241,284,265,322],[340,282,370,324]],
  [[130,282,158,324],[235,284,260,322],[331,282,360,324]],
  [[233,147,266,181]]
 ]
];

export const clearGlass=new THREE.MeshBasicMaterial({
 color:0x829198,transparent:true,opacity:.07,depthWrite:false,side:THREE.DoubleSide,toneMapped:false
});

export function fitHouseWindows(region,scene,box,size,center){
 const vertices=[],cuts=[];
 const ray=new THREE.Raycaster();
 for(const [face,panes] of windowsByRegion[region].entries()){
  const c=[1,0,0,-1][face],s=[0,1,-1,0][face];
  const relative=(u,v,depth)=>new THREE.Vector3((u*c+depth*s)*size.x,v*size.y,(-u*s+depth*c)*size.z);
  const origin=new THREE.Vector3(center.x,box.min.y,center.z);
  const direction=new THREE.Vector3(-s,0,-c);
  for(const [left,top,right,bottom] of panes){
   const u0=(left-250)/400,u1=(right-250)/400,v0=(450-bottom)/400,v1=(450-top)/400;
   const depths=[];
   for(const [u,v] of [[.5,.5],[.2,.25],[.8,.25],[.2,.75],[.8,.75]]){
    ray.set(relative(THREE.MathUtils.lerp(u0,u1,u),THREE.MathUtils.lerp(v0,v1,v),.65).add(origin),direction);
    const hit=ray.intersectObject(scene,true).find(({point})=>
     (point.x-center.x)/size.x*s+(point.z-center.z)/size.z*c>.06);
    if(hit)depths.push((hit.point.x-center.x)/size.x*s+(hit.point.z-center.z)/size.z*c);
   }
   depths.sort((a,b)=>a-b);
   const depth=(depths[Math.floor(depths.length*.65)]??.36)+.008;
   const corners=[relative(u0,v0,depth),relative(u1,v0,depth),relative(u1,v1,depth),relative(u0,v1,depth)];
   for(const i of [0,1,2,0,2,3]){
    vertices.push(...corners[i].toArray());
   }
   cuts.push([relative(u0,v0,depth-.23),relative(u1,v1,.60)]);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
 return {geometry,cuts};
}
