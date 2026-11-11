import * as T from "./vendor/three/three.module.min.js";

export function createEstateWorkbench(){
 const group=new T.Group();
 const material=(color,roughness=.86,options={})=>new T.MeshStandardMaterial({color,roughness,...options});
 const oak=[0x735032,0x9a6a43,0x855638,0xa87548].map(color=>material(color));
 const iron=material(0x424546,.6,{metalness:.38});
 const rope=material(0xb19868),paper=material(0xe7c995),ink=material(0x604c37),water=material(0x487788);
 const flag=material(0xe2c69a,.87,{side:T.DoubleSide});
 const edging=material(0x9d5139,.87,{side:T.DoubleSide});
 const box=(w,h,d,x,y,z,mat,rx=0,rz=0,parent=group)=>{
  const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.rotation.set(rx,0,rz);parent.add(m);return m;
 };
 const rod=(a,b,r,mat,parent=group)=>{
  const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from);
  const m=new T.Mesh(new T.CylinderGeometry(r,r,delta.length(),8),mat);
  m.position.copy(from).lerp(to,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
  parent.add(m);return m;
 };
 for(const side of [-1,1]){
  for(const depth of [-1,1]){
   rod([side*.94,.04,depth*.54],[side*.76,1.03,depth*.38],.081,oak[0]);
   box(.18,.17,.16,side*.78,.86,depth*.39,iron);
  }
  rod([side*.84,.28,-.47],[side*.84,.28,.47],.053,oak[2]);
 }
 box(1.77,.14,.15,0,.33,0,oak[0]);
 for(let i=0;i<5;i++)box(2.25,.102,.229,0,1.035,(i-2)*.231,oak[i%oak.length]);
 for(const x of [-.84,.83]){
  box(.106,.019,1.18,x,1.094,0,iron);
  for(const z of [-.49,-.22,.25,.48])box(.026,.022,.025,x,1.105,z,rope);
 }
 // Small sloped map board and drawn relief contours.
 const map=new T.Group();map.position.set(-.25,1.44,-.44);map.rotation.x=-.24;group.add(map);
 box(.80,.57,.083,0,0,0,oak[0],0,0,map);
 box(.71,.48,.012,0,0,.049,paper,0,0,map);
 for(const y of [-.17,-.09,.00,.10,.17]){
  rod([-.29,y,.061],[-.10,y+.045,.061],.009,ink,map);
  rod([-.10,y+.045,.061],[.08,y-.022,.061],.009,ink,map);
  rod([.08,y-.022,.061],[.28,y+.010,.061],.009,ink,map);
 }
 rod([.18,.23,.071],[.04,.04,.071],.016,water,map);
 rod([.04,.04,.071],[-.07,-.09,.071],.016,water,map);
 rod([-.07,-.09,.071],[.02,-.23,.071],.016,water,map);
 for(const x of [-.55,.05])rod([x,1.06,-.53],[x,1.67,-.51],.033,oak[2]);
 box(.67,.014,.39,-.19,1.095,.22,paper);
 rod([-.51,1.11,.04],[-.51,1.11,.40],.035,paper);
 for(const z of [.12,.22,.32])rod([-.41,1.107,z],[.05,1.107,z+.021],.006,ink);
 rod([.32,1.119,.11],[.64,1.119,.36],.029,oak[1]);
 box(.20,.09,.11,.68,1.133,.33,oak[0],0,.08);
 // Tall flag with geometric folds and a contrasting lower edge.
 rod([.91,.13,-.53],[.91,2.93,-.53],.046,oak[0]);
 rod([.38,2.79,-.53],[1.00,2.79,-.53],.031,oak[2]);
 for(const y of [1.01,1.10,2.75,2.83])box(.116,.027,.111,.91,y,-.53,rope);
 const cloth=(bottom,top,mat)=>{
  const vertices=[],faces=[];
  for(let i=0;i<=12;i++){
   const u=i/12,x=.43+.46*u,z=-.52+Math.sin(u*12)*.034;
   const notch=.12*(1-Math.abs(2*u-1));
   vertices.push(x,bottom+notch,z,x,top+(top<2.7?notch:0),z);
   if(i){const j=i*2;faces.push(j-2,j,j-1,j-1,j,j+1);}
  }
  const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
  g.setIndex(faces);g.computeVertexNormals();group.add(new T.Mesh(g,mat));
 };
 cloth(1.91,2.75,flag);cloth(1.90,1.98,edging);
 for(const x of [.48,.60,.72,.84]){
  const u=(x-.43)/.46;
  rod([x-.027,2.30,-.47+Math.sin(u*12)*.03],[x,2.43,-.47+Math.sin(u*12)*.03],.018,water);
  rod([x,2.43,-.47+Math.sin(u*12)*.03],[x+.035,2.30,-.47+Math.sin(u*12)*.03],.018,water);
 }
 return group;
}
