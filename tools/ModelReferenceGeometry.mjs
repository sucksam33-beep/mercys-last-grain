import * as T from "/vendor/three/three.module.min.js";
const V=(x,y,z)=>new T.Vector3(x,y,z);
const Y=V(0,1,0);
const wood=0x9a6941, bark=0x654631, pale=0xc8a176, iron=0x697477, edge=0xb5bdba, copper=0xa86b4c, rope=0xb49970;
let seed;
const rng=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const mat=(color,metalness=0)=>new T.MeshStandardMaterial({color,metalness,roughness:.77,side:T.DoubleSide});
function mesh(g,geometry,color,x=0,y=0,z=0){
 const m=new T.Mesh(geometry,typeof color==="object"?color:mat(color));m.position.set(x,y,z);g.add(m);return m;
}
const box=(g,x,y,z,w,h,d,c)=>mesh(g,new T.BoxGeometry(w,h,d),c,x,y,z);
function egg(g,x,y,z,w,h,d,c){
 const m=mesh(g,new T.SphereGeometry(1,22,14),c,x,y,z);m.scale.set(w,h,d);return m;
}
function bar(g,a,b,r,c,taper=r,sides=12){
 const start=V(...a),end=V(...b),delta=end.clone().sub(start);
 const m=mesh(g,new T.CylinderGeometry(taper,r,delta.length(),sides),c);
 m.position.copy(start).lerp(end,.5);m.quaternion.setFromUnitVectors(Y,delta.normalize());return m;
}
function tube(g,coords,r,c){
 const curve=new T.CatmullRomCurve3(coords.map(p=>V(...p)));
 return mesh(g,new T.TubeGeometry(curve,Math.max(18,coords.length*5),r,8,false),c);
}
function ring(g,x,y,z,R,r,c,vertical=false){
 const m=mesh(g,new T.TorusGeometry(R,r,9,38),c,x,y,z);
 if(!vertical)m.rotation.x=Math.PI/2;
 return m;
}
function outline(g,points,depth,c){
 const shape=new T.Shape();
 points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));
 shape.closePath();
 const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2});
 geo.translate(0,0,-depth/2);
 return mesh(g,geo,c);
}
function rock(g,x,y,z,w,h,d,c){
 const geo=new T.IcosahedronGeometry(1,2),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){
  const a=p.getX(i),b=p.getY(i),cc=p.getZ(i);
  const f=1+.14*Math.sin(14*a+11*b+7*cc)+.07*Math.cos(29*cc+9*a);
  p.setXYZ(i,a*f,b*f,cc*f);
 }
 geo.computeVertexNormals();const m=mesh(g,geo,c,x,y,z);m.scale.set(w,h,d);return m;
}
function fish(g,item,profiles){
 const name=item.name;
 const p=profiles[name]??["minnow",.46,"#718b75","line"];
 const [type,depth,tint,pattern]=p;
 const length=(type==="eel"?2.8:2.25)*(.94+rng()*.12);
 const h=depth*(.47+rng()*.08),thick=h*(type==="flat"?.22:type==="eel"?.9:.54);
 const bodyRings=36,sides=24,positions=[],colors=[],indices=[];
 const base=new T.Color(tint),dark=new T.Color("#273b36"),belly=new T.Color("#e8e2c0");
 const centerline=t=>type==="eel"?.13*Math.sin(t*Math.PI*2.2):0;
 const taper=t=>Math.max(.035,Math.pow(Math.sin(Math.PI*t),.72)*(1.15-.48*t));
 for(let i=0;i<=bodyRings;i++)for(let j=0;j<=sides;j++){
  const t=i/bodyRings,a=j/sides*Math.PI*2,w=taper(t);
  const x=(t-.5)*length,y=Math.cos(a)*h*w,z=Math.sin(a)*thick*w+centerline(t);
  positions.push(x,y,z);
  const shade=base.clone().lerp(y>0?dark:belly,Math.min(.72,Math.abs(Math.cos(a))*.68));
  if(pattern==="bars"&&Math.sin(t*54+a*.8)>.48&&t>.15&&t<.88)shade.multiplyScalar(.62);
  if(pattern==="line"&&Math.abs(Math.cos(a))<.19)shade.lerp(new T.Color("#c6b887"),.42);
  if(pattern==="dark-line"&&Math.abs(Math.cos(a))<.21)shade.multiplyScalar(.59);
  if(/spots|dots|marble/.test(pattern)&&Math.sin(t*83+a*12)*Math.cos(t*55-a*13)>.57)shade.multiplyScalar(.56);
  shade.multiplyScalar(.95+.09*Math.sin(t*194+a*20)*Math.cos(t*125-a*22));
  colors.push(shade.r,shade.g,shade.b);
  if(i<bodyRings&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
 }
 const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(positions,3));
 geo.setAttribute("color",new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
 mesh(g,geo,new T.MeshStandardMaterial({vertexColors:true,roughness:.51,side:T.DoubleSide}));
 const tail=length*.5,finColor=pattern==="red-fin"?0xa95638:new T.Color(tint).multiplyScalar(.77).getHex();
 const fin=(points,z=0)=>{const m=outline(g,points,.022,finColor);m.position.z=z;return m;};
 const tailH=Math.max(type==="eel"?.085:.12,h*.84),fork=["minnow","tuna","salmon","swift","flying"].includes(type)?.19:.07;
 const tailFin=fin([[tail-.10,0],[tail+.40,tailH],[tail+.36-fork,0],[tail+.4,-tailH]]);
 tailFin.position.z=centerline(1);
 if(type!=="flat"){
  const ox=type==="pike"?.52:-.27,peak=type==="eel"?.035:type==="sail"?.39:type==="spiny"?.26:.15;
  fin([[ox-.23,h*.65],[ox-.07,h+peak],[ox+.045,h+peak*.53],[ox+.16,h+peak*.65],[ox+.35,h*.55]]);
 }
 for(const side of [-1,1]){
  const m=fin([[-.54,-h*.18],[-.25,-h*(type==="flying"?1.9:1.15)],[.20,-h*.72],[-.38,-h*.15]],side*thick*.67);
  m.rotation.x=side*.43;
  const x=-length*.355,y=h*.36,z=side*thick*.63+centerline(.145);
  egg(g,x,y,z,.067,.061,.028,0xbca772);
  egg(g,x-.014,y,z+side*.019,.039,.041,.021,0x1e2221);
  if(type==="cat"||type==="carp"){
   const n=type==="cat"?3:1;
   for(let i=0;i<n;i++)tube(g,[[-length*.47,-h*.15,side*thick*.25],[-length*.53,-h*.27,side*(.09+i*.035)],[-length*.66,-h*.46-i*.035,side*(.11+i*.06)]],.011,0x9e977e);
  }
 }
 if(type==="flat")g.rotateX(Math.PI/2);
}
function hide(g,name){
 const tanned=name.includes("무두질"),bird=/꿩|뇌조|오리|칠면조|기니새/.test(name),rept=/악어/.test(name),fur=/토끼|늑대|코요테|마멋|곰|포사/.test(name);
 const color=tanned?0xb18257:/눈신|툰드라|물범/.test(name)?0x9a9283:rept?0x66684b:bird?0x9b7858:0x7a5946;
 const hoof=/사슴|무스|뿔양|줄무늬말/.test(name),seal=/물범/.test(name),bear=/곰/.test(name),rabbit=/토끼/.test(name);
 const width=(bear?.94:bird?.99:seal?.60:rabbit?.58:hoof?.78:.69)+rng()*.11;
 const tail=/늑대|코요테|포사|비버|뉴트리아/.test(name)?.50:bird?.35:.18;
 const pts=[[0,.95],[.20,.76],[.30,.56],[width,.79],[width*.91,.46],[.43,.27],[.45,-.25],[width*.95,-.69],[width*.66,-.82],[.28,-.53],[.13,-.65],[.02,-.65-tail],[-.12,-.67],[-.28,-.52],[-width*.72,-.86],[-width*.97,-.65],[-.42,-.30],[-.43,.22],[-width*.96,.54],[-width,.76],[-.32,.57],[-.19,.78]];
 const controls=pts.map(([x,z],i)=>V(x*(1+rng()*.09),z*(seal?.9:hoof?1.13:1)+(.018*Math.sin(i*2)),0));
 const spline=new T.CatmullRomCurve3(controls,true,"centripetal",.48);
 const sample=spline.getPoints(105).slice(0,-1).map(p=>[p.x,p.y]);
 const flat=outline(g,sample,.044,color);flat.rotation.x=-Math.PI/2;
 for(let i=0;i<150;i++){
  const x=(rng()-.5)*.82,z=(rng()-.5)*1.05;
  if(Math.abs(x)>.36+Math.abs(z)*.07)continue;
  const tint=new T.Color(color).multiplyScalar(.67+rng()*.6).getHex();
  if(fur&&!tanned)bar(g,[x,.034,z],[x+.024,.046,z+.025],.006,tint,.001,5);
  else egg(g,x,.034,z,.016,.004,.024,tint);
 }
 if(/줄무늬말|멧돼지|페커리/.test(name)&&!tanned){
  for(let i=0;i<7;i++){const z=-.55+i*.15;tube(g,[[-.34,.058,z+.06],[0,.067,z],[.34,.058,z-.07]],.023,0x42342d);}
 }
 if(!tanned&&/기니새|뇌조|사슴|포사|물범/.test(name)){
  for(let j=0;j<34;j++)egg(g,(rng()-.5)*.66,.035,(rng()-.5)*.99,.014+rng()*.019,.004,.019+rng()*.017,j%3?0xb89b76:0x534b3b);
 }
 if(bird&&!tanned){
  for(const side of [-1,1])for(let i=0;i<6;i++)tube(g,[[0,.035,.37-i*.09],[side*.20,.046,.32-i*.09],[side*.41,.038,.42-i*.081]],.012,i%2?0x94745b:0xb19170);
 }
 if(/털감개/.test(name)){
  g.remove(flat);flat.geometry.dispose();flat.material.dispose();
  for(const y of [.15,.27,.40])ring(g,0,y,0,.38,.073,color);
  for(let i=0;i<9;i++)tube(g,[[.38*Math.cos(i*.7),.10,.38*Math.sin(i*.7)],[.41*Math.cos(i*.7),.29,.41*Math.sin(i*.7)],[.37*Math.cos(i*.7),.45,.37*Math.sin(i*.7)]],.012,0xb99f84);
 }
}
function timber(g,name){
 const beam=/널판|들보|보강편|적층재|질 좋은|고급/.test(name);
 if(beam){
  const h=/들보|고급/.test(name)?.29:.13,n=/고급|기본 들보|긴 들보/.test(name)?1:3;
  for(let i=0;i<n;i++){
   const z=i*.26-(n-1)*.13,len=2.10-i*.13;
   box(g,0,h*.5,z,len,h,.24,i%2?pale:wood);
   for(let j=0;j<5;j++){const offset=z-.10+j*.045;tube(g,[[-len*.49,h+.002,offset],[0,h+.006,offset+.014*Math.sin(i+j)],[len*.49,h+.002,offset]],.004,0x876243);}
  }
 }else{
  const n=name==="원목"?1:4;
  for(let i=0;i<n;i++){
   const z=i*.24-(n-1)*.12,y=n===1?.29:.14+(i===3?.13:0),r=n===1?.32:.13,len=n===1?1.65:1.15+rng()*.55;
   bar(g,[-len/2,y,z],[len/2,y,z+.035],r,bark,r*.92,14);
   for(const side of [-1,1]){
    const x=side*(len/2+.007);
    bar(g,[x-.006,y,z+(side>0?.035:0)],[x+.006,y,z+(side>0?.035:0)],r*.89,pale,r*.89,18);
    for(let j=1;j<=3;j++){const m=ring(g,x+side*.008,y,z+(side>0?.035:0),r*j*.21,.006,0x96673f,true);m.rotation.y=Math.PI/2;}
   }
  }
 }
}
function vessel(g,name){
 if(/통|연료/.test(name)){
  const top=.49,h=1.08;
  const profile=[[0,0],[.43,0],[.51,.14],[.55,.52],[.51,.93],[top,h],[0,h]];
  mesh(g,new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),40),wood);
  for(const y of [.17,.87])ring(g,0,y,0,.51,.041,iron);
  for(let i=0;i<13;i++){
   const a=i/13*Math.PI*2;tube(g,[[.448*Math.cos(a),.04,.448*Math.sin(a)],[.55*Math.cos(a),.54,.55*Math.sin(a)],[top*Math.cos(a),1.05,top*Math.sin(a)]],.006,0x5d412e);
  }
  return;
 }
 const jar=/항아리/.test(name),pot=/솥/.test(name),cup=/차/.test(name);
 const radius=jar?.55:cup?.51:.74;
 const profile=jar?[[0,0],[.34,0],[.53,.21],[.60,.58],[.54,.96],[.31,1.12],[.30,1.27],[.37,1.28],[.37,1.33],[.24,1.33],[.24,1.12],[.45,.82],[.43,.18],[0,.09]]:
 [[0,0],[radius*.55,0],[radius*.80,.13],[radius,.42],[radius,.49],[radius*.90,.48],[radius*.76,.17],[0,.11]];
 mesh(g,new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),48),pot?0x54595a:jar?0x85543e:0xb2a28a);
 if(jar){bar(g,[0,1.28,0],[0,1.38,0],.32,pale,.28,24);ring(g,0,1.19,0,.30,.027,rope);return;}
 if(pot){tube(g,[[-radius,.43,0],[-.55,.9,0],[0,1.11,0],[.55,.9,0],[radius,.43,0]],.027,iron);return;}
 bar(g,[0,.32,0],[0,.34,0],radius*.84,cup?0x95602e:/죽/.test(name)?0xc7ae7d:0x9e704b,radius*.84,40);
 for(let i=0;i<(cup?5:28);i++){
  const a=rng()*6.283,r=Math.sqrt(rng())*radius*.73;
  const c=cup?0x526347:[0xd4be8c,0x98634a,0x777b51][i%3];
  egg(g,Math.cos(a)*r,.347,Math.sin(a)*r,.034,.018,.024,c);
 }
}

function tool(g,name){
 const long=/지팡이|투창|장창|사냥창|갈고리창|작살|낚싯대/.test(name);
 if(/사냥활|사냥 활|장궁/.test(name)){
  const h=/장궁/.test(name)?1.31:.96;
  const pts=[[.22,-h,0],[.01,-h*.75,0],[-.21,-h*.36,0],[-.29,0,0],[-.22,h*.38,0],[.05,h*.78,0],[.25,h,0]];
  tube(g,pts,.035,wood);
  bar(g,pts[0],pts[6],.009,rope,.009,7);
  for(let i=0;i<9;i++)ring(g,-.29,(i-4)*.019,0,.038,.007,0x574538);
  return;
 }
 if(/화살/.test(name)){
  for(let i=0;i<3;i++){
   const x=(i-1)*.20,z=i*.064;
   bar(g,[x,-.96,z],[x,.97,z],.015,pale);
   bar(g,[x,.93,z],[x,1.14,z],.055,/철촉/.test(name)?iron:wood,.005,4);
   for(let j=0;j<3;j++){
    const vane=outline(g,[[0,-.86],[.11,-.83],[.079,-.65],[0,-.59]],.008,/꿩/.test(name)?0x9d5f45:0xb7aa8a);
    vane.position.set(x,0,z);vane.rotation.y=j*2.094;
   }
  }
  return;
 }
 if(/단검|검$/.test(name)){
  const d=/단검|짧은/.test(name),h=d?.67:1.08;
  bar(g,[0,-.75,0],[0,-.35,0],.062,0x6f5241,.053);
  bar(g,[-.23,-.34,0],[.23,-.34,0],.043,d?copper:iron);
  outline(g,[[-.078,-.32],[-.07,h-.25],[.012,h],[.084,h-.17],[.085,-.32]],.044,/구리/.test(name)?copper:edge);
  outline(g,[[0,-.30],[-.012,h-.15],[.022,h-.22],[.03,-.30]],.049,d?0xc58761:iron);return;
 }
 if(/뜰채/.test(name)){
  bar(g,[0,-1.12,0],[0,.44,0],.046,wood);
  ring(g,0,.76,0,.34,.025,pale,true);
  for(let i=0;i<13;i++){
   const a=i/13*Math.PI*2;tube(g,[[Math.cos(a)*.33,.76+Math.sin(a)*.33,0],[Math.cos(a)*.21,.76+Math.sin(a)*.21,.25],[0,.76,.42]],.006,rope);
  }
  return;
 }
 if(/채집가위/.test(name)){
  for(const side of [-1,1]){
   outline(g,[[0,0],[side*.12,.12],[side*.18,.67],[side*.035,.54],[-side*.05,.03]],.055,edge);
   bar(g,[0,0,0],[side*.21,-.42,0],.066,wood);
   ring(g,side*.24,-.52,0,.107,.044,wood,true);
  }
  egg(g,0,0,.044,.055,.055,.019,copper);return;
 }
 if(/채비/.test(name)){
  const sea=/바다/.test(name);
  for(let i=0;i<8;i++)ring(g,0,i*.017,0,.45-i*.012,.018,rope);
  const float=egg(g,-.27,.18,0,.13,.13,sea?.38:.27,0x984d3d);
  float.rotateY(.25);
  tube(g,[[.49,.09,0],[.72,.11,.06],[.73,.09,.27],[.62,.09,.29],[.58,.09,.19]],.019,iron);
  return;
 }
 if(/방패/.test(name)){
  const c=/조류/.test(name)?0x7b664a:wood;
  outline(g,[[-.64,.65],[.64,.65],[.59,-.17],[.29,-.62],[0,-.77],[-.28,-.62],[-.58,-.17]],.094,c);
  for(const x of [-.31,0,.31])bar(g,[x,-.43,.052],[x,.59,.052],.007,0x563d2b);
  for(const y of [.45,-.23])box(g,0,y,.072,1.03,.105,.045,iron);
  egg(g,0,.06,.102,.147,.147,.082,edge);
  tube(g,[[-.22,.17,-.054],[-.17,.17,-.16],[.17,.17,-.16],[.22,.17,-.054]],.033,bark);return;
 }
 const h=long?1.14:/강화|벌목|철도|곡괭이/.test(name)?.87:.65;
 bar(g,[0,-h,0],[.06,h,0],long?.038:.052,/조릿대/.test(name)?pale:wood,.035);
 if(/도끼/.test(name)){
  outline(g,[[-.03,h-.08],[.17,h+.07],[.53,h+.13],[.48,h-.27],[.15,h-.20],[-.03,h-.20]],.088,iron);
  outline(g,[[.46,h+.12],[.53,h+.13],[.48,h-.27],[.41,h-.26]],.09,edge);
  if(/강화/.test(name))for(const y of [h-.38,h-.47])ring(g,.052,y,0,.057,.018,iron);
 }else if(/곡괭이|괭이/.test(name)){
  outline(g,[[-.6,h-.18],[-.21,h+.11],[.10,h+.07],[.54,h-.02],[.47,h-.22],[.06,h-.06],[-.23,h-.07]],.077,iron);
 }else if(/낚싯대/.test(name)){
  tube(g,[[.06,h,0],[.24,h+.41,0],[.38,h+.61,0]],.019,pale);
  tube(g,[[.38,h+.61,0],[.51,.62,.01],[.64,-.30,.05]],.006,rope);
  const spool=ring(g,.07,-.56,.09,.11,.028,iron,true);spool.rotation.y=.25;
 }else if(/지팡이/.test(name)){
  tube(g,[[.06,h-.14,0],[.09,h+.13,0],[.24,h+.21,0],[.36,h+.09,0]],.048,wood);
 }else{
  outline(g,[[-.016,h-.18],[-.09,h+.05],[.055,h+.31],[.15,h+.07],[.103,h-.17]],.055,edge);
  if(/갈고리|작살/.test(name)){
   tube(g,[[.1,h+.09,0],[.31,h+.13,0],[.32,h-.045,0],[.24,h-.08,0]],.023,iron);
   if(/작살/.test(name))tube(g,[[.08,h-.28,0],[.39,h-.67,.10],[.4,-h*.72,.12],[.03,-h+.10,0]],.014,rope);
  }
 }
 for(let i=0;i<7;i++)ring(g,.013,-h*.62+i*.032,0,.053,.008,/방한/.test(name)?0xafa490:0x6d533e);
}
function apparel(g,item){
 const name=item.name,region=item.region;
 const fabric=[0x727653,0x6d6249,0xaa805b,0x665647,0x666867,0x5d756d,0xa08b56,0x777875][region]??0x827465;
 if(/장화/.test(name)){
  for(const side of [-1,1]){
   const x=side*.33;
   egg(g,x,.16,.20,.23,.16,.47,bark);
   bar(g,[x,.14,-.08],[x,.96,-.08],.20,0x665242,.23);
   ring(g,x,.96,-.08,.22,.026,0x90725a);
   box(g,x,.055,.19,.43,.09,.81,0x41362e);
  }
  return;
 }
 if(/모자|두건/.test(name)){
  const hood=/두건/.test(name);
  egg(g,0,.42,0,.48,.45,.42,fabric);
  if(hood){
   outline(g,[[-.49,.58],[-.56,-.16],[.52,-.16],[.49,.55],[.35,.17],[-.31,.17]],.18,fabric);
   egg(g,0,.49,.33,.33,.28,.13,0x493e31);
  }else{
   bar(g,[0,.12,0],[0,.17,0],.86,fabric,.80,40);
   for(let i=0;i<4;i++)ring(g,0,.18+i*.05,0,.48-i*.012,.012,pale);
  }
  return;
 }
 if(/장갑|팔보호대/.test(name)){
  for(const side of [-1,1]){
   const x=side*.47;
   box(g,x,.20,0,.47,.59,.18,/구리/.test(name)?copper:fabric);
   box(g,x,-.18,0,.50,.25,.22,bark);
   if(/장갑/.test(name)){
    for(let i=0;i<4;i++)bar(g,[x-.17+i*.11,.40,0],[x-.17+i*.11,.75-(i-1.4)**2*.052,0],.052,fabric,.042);
    bar(g,[x-side*.19,.11,0],[x-side*.32,.42,.034],.071,fabric,.055);
   }else for(const y of [.13,.39])box(g,x,y,.105,.44,.055,.029,iron);
  }
  return;
 }
 const armor=item.category===4,vest=/조끼|가죽갑|작업갑|사냥갑/.test(name);
 const cape=/망토/.test(name),liner=/안감/.test(name);
 const torso=[[0,.72],[.32,.90],[.66,.61],[.56,.23],[.43,.13],[.58,-.89],[-.58,-.89],[-.43,.13],[-.56,.23],[-.66,.61],[-.32,.90]];
 const body=outline(g,torso,armor?.24:.17,liner?0xb8aa90:armor?0x846047:fabric);
 body.scale.x=cape?1.26:1;
 if(!vest&&!cape&&!liner)for(const side of [-1,1])bar(g,[side*.42,.65,0],[side*.77,-.47,.01],.19,fabric,.125);
 if(armor){
  for(let i=0;i<4;i++){
   const y=.34-i*.23;
   for(const x of [-.23,.23]){
    box(g,x,y,.145,.41,.18,.068,/철판/.test(name)?iron:/비늘/.test(name)?0x5b6a56:0x956b50);
    for(const dx of [-.14,.14])egg(g,x+dx,y,.195,.025,.025,.02,edge);
   }
  }
 }else{
  bar(g,[0,-.87,.105],[0,.70,.105],.015,0x514638);
  for(let i=0;i<6;i++)egg(g,.09,.53-i*.22,.123,.028,.026,.015,pale);
  if(/누빔|안감|눈길/.test(name))for(let j=0;j<6;j++){
   const y=.61-j*.23;bar(g,[-.42,y,.103],[.42,y-.095,.103],.009,0x9b8e77);
  }
 }
}

function prop(g,item){
 const n=item.name;
 if(/털감개|가죽/.test(n)&&item.category<2){hide(g,n);return;}
 if(/목재|^원목$|들보|널판|적층재|^장작$/.test(n)&&!/수차/.test(n)){timber(g,n);return;}
 if(/통$|항아리|연료|여행솥|따뜻한|곡물죽/.test(n)){vessel(g,n);return;}
 if(/숫돌|석회암|사암촉/.test(n)){
  const c=/화강암/.test(n)?0x797e7c:/사암/.test(n)?0xa48866:0xb7b4a0;
  if(/숫돌/.test(n)){
   box(g,0,.16,0,1.72,.30,.60,c);box(g,0,.07,0,1.66,.14,.65,wood);
   for(let i=0;i<12;i++){const z=(i-5.5)*.037;bar(g,[-.68,.314,z],[.68,.314,z+.018],.002,i%2?0x6d6d63:0xc2b7a0);}
  }else if(/촉/.test(n))outline(g,[[0,.83],[.35,.10],[.23,-.53],[-.29,-.48],[-.34,.08]],.20,c);
  else for(let i=0;i<3;i++)rock(g,(i-1)*.58,.27,i%2*.25,.40,.32,.41,c);
  return;
 }
 if(/밧줄|끈|시위/.test(n)){
  const r=/굵은/.test(n)?.045:/시위/.test(n)?.018:.031,c=/갈대/.test(n)?0x8b8760:rope;
  const points=[];
  for(let i=0;i<92;i++){
   const a=i/91*12.5*Math.PI,d=.56-i/91*.27;
   points.push([Math.cos(a)*d,.05+Math.floor(i/16)*r*.24,Math.sin(a)*d*.85]);
  }
  tube(g,points,r,c);
  tube(g,[[.55,.05,0],[.71,.07,.12],[.80,.07,.31],[.58,.06,.49]],r,c);
  for(const z of [-.19,.17])bar(g,[-.27,.11,z],[.31,.11,z],.018,0x6e5841);return;
 }
 if(/부표/.test(n)){
  const f=egg(g,0,.34,0,.37,.32,.80,wood);f.rotateY(.32);
  for(const z of [-.38,.38]){const m=ring(g,0,.36,z,.28,.036,rope,true);m.rotation.y=.25;}
  return;
 }
 if(/배 부품|용골/.test(n)){
  const length=/용골/.test(n)?2.55:1.75;
  tube(g,[[-length*.5,.45,0],[-length*.28,.12,0],[0,.06,0],[length*.28,.12,0],[length*.5,.45,0]],.087,wood);
  for(let i=0;i<5;i++){
   const x=(i-2)*length*.15,w=.41-(i-2)**2*.045;
   tube(g,[[x,.33,-w],[x,.105,0],[x,.33,w]],.04,pale);
  }
  return;
 }
 if(/수문틀/.test(n)){
  for(const x of [-.60,.60])box(g,x,.64,0,.15,1.28,.25,wood);
  for(const y of [.18,1.19])box(g,0,y,0,1.34,.16,.27,wood);
  for(const x of [-.47,.47])box(g,x,.59,.13,.067,.98,.061,iron);
  bar(g,[0,.64,.05],[0,1.47,.05],.032,iron);
  ring(g,0,1.48,.05,.21,.025,iron);return;
 }
 if(/수차/.test(n)){
  const r=.71;
  for(const z of [-.15,.15])ring(g,0,.75,z,r,.066,wood,true);
  for(let i=0;i<10;i++){
   const a=i/10*Math.PI*2,x=Math.cos(a),y=Math.sin(a);
   bar(g,[0,.75,0],[x*r,.75+y*r,0],.035,wood);
   const paddle=box(g,x*r,.75+y*r,0,.20,.070,.42,pale);paddle.rotation.z=a+Math.PI/2;
  }
  bar(g,[0,.75,-.27],[0,.75,.28],.13,iron);return;
 }
 if(/울타리|작업대|상자/.test(n)){
  if(n==="울타리"){
   for(const x of [-.83,0,.83])box(g,x,.47,0,.105,.94,.14,wood);
   for(const y of [.25,.63])box(g,0,y,0,1.78,.10,.10,pale);
  }else if(/작업대/.test(n)){
   for(const x of [-.63,.63])for(const z of [-.28,.28])box(g,x,.43,z,.11,.86,.11,wood);
   box(g,0,.91,0,1.61,.15,.77,pale);
   for(const z of [-.28,.28])box(g,0,.49,z,1.28,.11,.085,wood);
  }else{
   for(const z of [-.45,.45])box(g,0,.34,z,1.45,.67,.09,wood);
   for(const x of [-.70,.70])box(g,x,.34,0,.09,.67,.87,wood);
   for(const x of [-.61,.61])for(const z of [-.40,.40])box(g,x,.36,z,.11,.72,.13,pale);
   for(let i=0;i<5;i++)box(g,0,.69,(i-2)*.18,1.44,.077,.17,pale);
  }return;
 }
 if(/배관/.test(n)){
  const points=[[-.81,.10,0],[-.36,.10,0],[-.10,.10,0],[.11,.30,0],[.14,.66,0],[.37,.89,0],[.78,.89,0]];
  tube(g,points,.119,copper);
  for(const [x,y] of [[-.81,.10],[.78,.89]]){
   const m=ring(g,x,y,0,.126,.030,copper,true);m.rotation.y=Math.PI/2;
   bar(g,[x-.005,y,0],[x+.006,y,0],.094,0x4d3a30);
  }return;
 }
 if(/양수기|연결부|단조 철재/.test(n)){
  if(/단조/.test(n)){
   for(let i=0;i<3;i++)box(g,0,.083+i*.15,(i-1)*.19,1.25-i*.10,.135,.31,iron);
  }else if(/연결부/.test(n)){
   for(const side of [-1,1]){
    box(g,side*.28,.09,0,.48,.15,.45,iron);
    ring(g,side*.28,.17,0,.13,.027,copper);
   }
   box(g,0,.15,0,.24,.14,.30,edge);
  }else{
   bar(g,[0,0,0],[0,.61,0],.27,copper,.21);
   box(g,0,.07,0,.83,.15,.59,iron);
   tube(g,[[.19,.48,0],[.54,.48,0],[.59,.32,0]],.084,copper);
   bar(g,[0,.56,0],[0,.90,0],.046,edge);
   bar(g,[-.31,.84,0],[.31,.97,0],.042,wood);
  }
  return;
 }
 if(/기록/.test(n)){
  const book=box(g,0,.10,0,1.02,.19,1.31,0x916a4a);book.rotation.y=.13;
  box(g,.022,.104,.01,.95,.15,1.26,0xd7c2a0);
  for(let i=0;i<8;i++)bar(g,[-.40,.207,-.49+i*.12],[.34,.207,-.49+i*.12],.004,0x846e56);
  bar(g,[-.42,.21,-.58],[-.40,.21,.59],.029,0x594631);return;
 }
 if(/주먹밥/.test(n)){
  const m=outline(g,[[0,.86],[.57,.02],[.53,-.18],[-.55,-.18],[-.57,.03]],.38,0xe3d9b7);
  box(g,0,-.028,.205,.39,.33,.047,0x414e39);
  for(let i=0;i<80;i++){const y=-.11+rng()*.86,x=(rng()-.5)*(1.10-y);if(y<.13&&Math.abs(x)<.20)continue;egg(g,x,y,.203,.022,.013,.011,0xeee3c6);}
  return;
 }
 if(/씨앗|볍씨|곡물/.test(n)){
  const c=/볍씨/.test(n)?0xc6a063:0xd6b986;
  for(let i=0;i<72;i++){
   const a=rng()*Math.PI*2,r=Math.sqrt(rng())*.61;
   const m=egg(g,Math.cos(a)*r,.033+(1-r/.62)*rng()*.09,Math.sin(a)*r*.73,.059,.029,.020,c);m.rotation.y=rng()*Math.PI;
  }
  return;
 }
 if(item.category===2||/도끼|곡괭이|낚싯대|채비|가위|손괭이|뜰채|사냥 활|검$|방패|지팡이/.test(n)){tool(g,n);return;}
 throw Error("No reference geometry for "+n);
}
export function makeReference(item,fishProfiles){
 seed=2166136261;
 for(const ch of item.id)seed=Math.imul(seed^ch.codePointAt(0),16777619)>>>0;
 const group=new T.Group();
 if(item.category===5||item.name==="치어")fish(group,item,fishProfiles);
 else if(item.category===3||item.category===4&&!/방패/.test(item.name))apparel(group,item);
 else prop(group,item);
 if(!group.children.length)throw Error("Empty reference: "+item.name);
 return group;
}
