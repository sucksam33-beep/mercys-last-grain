const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.join(__dirname,"reference-architecture-stage/game");
function edit(file,changes,extra=""){
 const p=path.join(root,file);let text=fs.readFileSync(p,"utf8").replaceAll("\r\n","\n");
 for(const [a,b] of changes){assert.equal(text.split(a).length,2,file+" "+a.slice(0,80));text=text.replace(a,()=>b);}
 fs.writeFileSync(p,text+extra);
}
edit("ArchitectureFinish.js",[
 ['["#4f7181","#e5cda4","#5d3420","#f0cf96","#60888d",.32,"tile"]','["#515a60","#e5d6bb","#624a37","#987b5c","#675c4e",.31,"tile"]'],
 ['["#70463f","#d8bb90","#584133","#d9c3a2","#557a8b",.43,"slate"]','["#785448","#bba58c","#56493b","#c9b79a","#647376",.37,"slate"]'],
 ['["#b66041","#d59861","#74442a","#4d8b87","#608884",.34,"tile"]','["#a86143","#c78e62","#704e36","#637b72","#627971",.33,"tile"]'],
 ['["#5f7157","#aa7951","#593a25","#d8a970","#617981",.43,"shake"]','["#71675a","#88694f","#574335","#927154","#637274",.39,"shake"]'],
 ['["#40586b","#b47d4c","#653c25","#e3c690","#7294a5",.64,"metal"]','["#637984","#ad834a","#594c3f","#ddd0b9","#72868b",.60,"metal"]'],
 ['["#497b70","#91ad9b","#553a2b","#f0d6a3","#629c9d",.56,"metal"]','["#788480","#819487","#5e4e3f","#c4ba9e","#678483",.51,"metal"]'],
 ['["#a0834f","#e0ad72","#61462b","#4e9184","#639997",.29,"shake"]','["#88765a","#d8c19b","#77634b","#729386","#66796f",.28,"thatch"]'],
 ['["#3e6579","#a06854","#4d3c37","#d6d9c9","#82aab9",.62,"metal"]','["#536a75","#985b4e","#564638","#b0a48d","#7a9097",.54,"metal"]'],
 ['const wallMat=brick?mat.stone:s.region===0?mat.plaster:mat.wood;', 'const wallMat=brick?mat.stone:[0,6].includes(s.region)?mat.plaster:mat.wood;'],
 ['const courses=s.region===3||s.region===7?11:8;','const courses=s.region===3||s.region===7?11:s.region===6?3:8;'],
 ['const shadeValue=.93+.18*Math.sin(i*2.4+x*.49);','const wear=Math.max(0,1-Math.abs(a-x)/Math.max(.65,w*.17));\n  const shadeValue=.96+.12*Math.sin(i*2.4+x*.49)+wear*.12;'],
 ['const height=h*(s.region===1?.33:.26),width=w*(s.region===1?.135:.15);','const height=h*(s.region===1?.33:.26),width=w*(s.region===0?.20:s.region===1?.135:.15);'],
 ['  piece(0,.06,.183,.050,height+.09,.065,trim,mat.wood);','  const bars=s.region===0?7:s.region===7?2:1;\n  for(let i=1;i<=bars;i++)piece((i/(bars+1)-.5)*width,.06,.183,.047,height+.09,.065,trim,mat.wood);'],
 [' const material=metal?mat.metal:mat.ceramic;',' const material=metal?mat.metal:profile.style==="thatch"?mat.wood:mat.ceramic;'],
 ['  const rows=profile.style==="slate"?9:7;','  const rows=profile.style==="slate"?9:profile.style==="thatch"?11:7;'],
 [' const material=metal?architectureMaterials.metal:architectureMaterials.ceramic;', ' const material=metal?architectureMaterials.metal:profile.style==="thatch"?architectureMaterials.wood:architectureMaterials.ceramic;'],
],`
function dressAsagiGranary(x,z,floor){
 const house=buildingFootprints.find(p=>p.x===x&&p.z===z&&p.insideW);
 const {insideW:w,insideD:d,wallHeight:h}=house;
 const wood=color("#624735"),stone=color("#8e8570"),canvas=color("#b9a278");
 const front=z+d*.5,mat=architectureMaterials;
 // The entrance stays open between the two stacks and underneath the porch beams.
 for(const side of [-1,1]){
  const a=x+side*(w*.5-.47);
  box(a,floor-.43,front+1.23,.52,.49,.54,stone,0,mat.stone);
  box(a,floor,front+1.23,.27,h*.65,.29,wood,0,mat.wood);
  for(let i=0;i<3;i++){
   const b=z-d*.29+i*.94;
   const size=.40+i%2*.08;
   rounded(x+side*(w*.5-1.06),floor+size*.47,b,size,size*.49,size*.46,shade(canvas,.82+i*.085),mat.plaster);
   rounded(x+side*(w*.5-1.06),floor+size*.98,b,.09,.05,.07,wood,mat.wood);
  }
 }
 box(x,floor+h*.66,front+1.22,w*.93,.24,.26,wood,0,mat.wood);
 houseLamp(x,floor-.27,z,w*.44,front,true);
 for(const side of [-1,1]){
  const px=x+side*(w*.5-1.9),pz=z+d*.14;
  const crate=shade(wood,side>0?1.11:.91);
  box(px,floor,pz,1.17,.67,.85,crate,0,mat.wood);
  for(const q of [-.43,.43])box(px+q,floor+.08,pz+.446,.09,.49,.08,shade(crate,1.28),0,mat.wood);
 }
}
`);
edit("BuildingVariation.js",[
 ['rise:district.rise+(random()-.5)*.16,','rise:(s.region===0?.38:s.region===7?.68:district.rise)+(random()-.5)*.12,'],
 ['const eave=y+h,left=x-w*.56,right=x+w*.56,back=z-d*.56,front=z+d*.56;','const overhang=s.region===0?.60:[5,6].includes(s.region)?.62:.56;\n const eave=y+h,left=x-w*overhang,right=x+w*overhang,back=z-d*overhang,front=z+d*overhang;'],
]);
edit("index.html",[
 ['   albedo=baseColor*(.78+.36*weathering+(.29*fiber-.16*split)*fadeDetail);',`   float silver=smoothstep(.34,.76,weathering)*(.26+.37*max(0.,n.y));
   vec3 wood=mix(baseColor,baseColor*vec3(1.15,1.18,1.20),silver);
   albedo=wood*(.84+.25*weathering+(.26*fiber-.14*split)*fadeDetail);`],
 ['   albedo=baseColor*(.87+.19*weathering+.18*fleck*fadeDetail);',`   float deposit=smoothstep(.69,.91,weathering+fleck*.12);
   vec3 tile=baseColor*(.86+.20*weathering+.15*fleck*fadeDetail);
   albedo=mix(tile,tile*vec3(.93,1.06,.86),deposit*(.24+surfaceClimate.x*.34));`],
 ['   albedo=baseColor*(.84+.24*weathering+.12*fleck*fadeDetail);',`   float drip=smoothstep(.59,.85,noise2(face*vec2(9.4,.40)))*(.27+surfaceClimate.x*.52);
   vec3 lime=baseColor*(.89+.18*weathering+.11*fleck*fadeDetail);
   albedo=mix(lime,lime*vec3(.75,.76,.71),drip*(1.-axis.y));`],
 [' if(!cityHouse){\n  architecturalWall', ' if(!cityHouse){\n  architecturalWall'],
]);
