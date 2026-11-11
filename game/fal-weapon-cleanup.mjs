import * as T from "./vendor/three/three.module.min.js";

function removeBackdrop(model,cutoff){
 model.traverse(node=>{
  if(!node.isMesh)return;
  const original=node.geometry;
  const triangles=original.index?original.toNonIndexed():original;
  const position=triangles.getAttribute("position"),keep=[];
  for(let i=0;i<position.count;i+=3){
   if(Math.min(position.getY(i),position.getY(i+1),position.getY(i+2))>cutoff)keep.push(i,i+1,i+2);
  }
  if(keep.length<position.count*.12)return;
  const cleaned=new T.BufferGeometry();
  for(const [key,attribute] of Object.entries(triangles.attributes)){
   const values=new attribute.array.constructor(keep.length*attribute.itemSize);
   for(const [index,vertex] of keep.entries())for(let i=0;i<attribute.itemSize;i++)values[index*attribute.itemSize+i]=attribute.array[vertex*attribute.itemSize+i];
   cleaned.setAttribute(key,new T.BufferAttribute(values,attribute.itemSize,attribute.normalized));
  }
  node.geometry=cleaned;
  if(triangles!==original)triangles.dispose();
  original.dispose();
 });
}
function restoredBambooBow(){
 const bow=new T.Group();
 const material=(color)=>new T.MeshStandardMaterial({color,roughness:.79,metalness:0});
 const bamboo=material(0xbb965f),dark=material(0x765539),binding=material(0xab956e);
 const points=[[-.01,-.51],[-.105,-.39],[-.144,-.22],[-.139,0],[-.113,.18],[-.053,.34],[.107,.50]].map(([x,y])=>new T.Vector3(x,y,0));
 const curve=new T.CatmullRomCurve3(points);
 bow.add(new T.Mesh(new T.TubeGeometry(curve,34,.016,8,false),bamboo));
 const sibling=new T.CatmullRomCurve3(points.map((p,i)=>p.clone().add(new T.Vector3(.008+(i===1||i===5?.021:0),0,.016))));
 bow.add(new T.Mesh(new T.TubeGeometry(sibling,34,.009,7,false),dark));
 const axis=new T.Vector3(0,1,0);
 for(const t of [.012,.045,.16,.27,.42,.44,.46,.48,.50,.52,.54,.56,.64,.76,.93,.975]){
  const ring=new T.Mesh(new T.CylinderGeometry(.022,.022,.009,10),binding);
  ring.position.copy(curve.getPoint(t));
  ring.quaternion.setFromUnitVectors(axis,curve.getTangent(t));bow.add(ring);
 }
 return bow;
}
export function prepareFalWeapon(model,id){
 if(id==="hunting-bow-01"){
  const bow=restoredBambooBow();
  bow.userData.restoredBamboo=true;
  return bow;
 }
 if(id==="harpoon-01")removeBackdrop(model,-.186);
 if(id==="harpoon-08")removeBackdrop(model,-.204);
 model.traverse(node=>{
  if(node.isMesh)for(const material of [].concat(node.material))material.metalness=Math.min(.24,material.metalness??0);
 });
 return model;
}
export function bambooBowString(model){
 if(!model.userData.restoredBamboo)return;
 const points=[new T.Vector3(-.01,-.51,0),new T.Vector3(.107,.50,0)];
 model.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xd0b281})));
}
