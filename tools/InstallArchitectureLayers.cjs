const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const stage=path.join(__dirname,"architecture-stage","game");
function edit(file,changes){
 const p=path.join(stage,file);let source=fs.readFileSync(p,"utf8").replaceAll("\r\n","\n");
 for(const [from,to] of changes){assert.equal(source.split(from).length,2,file+": "+from.slice(0,95));source=source.replace(from,()=>to);}
 fs.writeFileSync(p,source);
}
edit("BuildingVariation.js",[
 ['const roofMaterial=s.region===1?surface.slate:surface.roof;', 'const roofMaterial=s.region===1?surface.slate:surface.roof;'],
 ['  box(x,eave,z,right-left,.21,front-back,tint,0,roofMaterial);', `  box(x,eave,z,right-left,.21,front-back,tint,0,roofMaterial);
  architecturalRoofFace([left,eave+.211,back],[right,eave+.211,back],[right,eave+.211,front],[left,eave+.211,front],tint);`],
 ...[
  ['[low,eave,back],[low,eave,front],[raised,peak,front],[raised,peak,back],tint','[low,eave,back],[raised,peak,back],[raised,peak,front],[low,eave,front],tint'],
  ['[edge,eave,back],knee,end,[edge,eave,front],tone'],
  ['knee,a,b,end,shade(tone,1.06)'],
  ['[left,eave,back],a,b,[left,eave,front],tint'],
  ['a,[right,eave,back],[right,eave,front],b,shade(tint,.84)'],
 ].map(([from,to])=>['quad('+from+',roofMaterial);','quad('+from+',roofMaterial);\n  architecturalRoofFace('+(to??from)+');']),
]);
edit("index.html",[
 ['<script src="BuildingVariation.js?v=regional-villages"></script>',`<script src="ArchitectureFinish.js"></script>
<script src="BuildingVariation.js?v=architecture-finish"></script>`],
 ['name==="민가"&&(!expansion||style===1)&&riggedScene?.addHouseExterior','name==="민가"&&expansion&&style===1&&riggedScene?.addHouseExterior'],
 [' if(!cityHouse&&name!=="내 집")villageIdentityDetails(x,y,z,w,d,h,plan);', ` if(!cityHouse&&name!=="내 집")villageIdentityDetails(x,y,z,w,d,h,plan);
 if(!cityHouse){
  architecturalWall(x,y,z,w,d,h,plan);
  architecturalFloor(x,y,z,w,d);
  architecturalJoinery(x,y,z,w,d,h,plan);
  architecturalWindows(x,y,z,w,d,h,plan);
 }`],
 [' if(s.region!==1)for(const k of', ' if(cityHouse&&s.region!==1)for(const k of'],
 [' if(!cityHouse)for(const side of [-1,1])box(x+w*.5*side,y+.2,z+d/2+.02,.19,h,.2,color("#675340"));',''],
 [' if(kind>16.5&&kind<18.5){',` if(kind>110.5&&kind<116.5){
  vec3 axis=abs(n);
  vec2 face=axis.y>.62?point.xz:(axis.z>axis.x?point.xy:point.zy);
  float fleck=noise2(face*31.7),weathering=noise2(face*2.61);
  float fadeDetail=1.-smoothstep(28.,130.,distance(camera,point));
  if(kind<111.5){
   float fiber=noise2(face*vec2(46.,2.2));
   float split=smoothstep(.58,.91,noise2(face*vec2(19.,.72)));
   albedo=baseColor*(.78+.36*weathering+(.29*fiber-.16*split)*fadeDetail);
  }else if(kind<112.5){
   float course=floor(face.y*2.9),row=fract(face.y*2.9);
   float brick=fract(face.x*2.25+mod(course,2.)*.5);
   float seam=max(1.-smoothstep(.026,.072,min(row,1.-row)),1.-smoothstep(.028,.061,min(brick,1.-brick)));
   vec3 warm=baseColor*(.87+.25*weathering+.17*fleck*fadeDetail);
   albedo=mix(warm,warm*.61,seam*.78*fadeDetail);
  }else if(kind<113.5){
   albedo=baseColor*(.87+.19*weathering+.18*fleck*fadeDetail);
  }else if(kind<114.5){
   albedo=baseColor*(.84+.24*weathering+.12*fleck*fadeDetail);
  }else if(kind<115.5){
   float grazing=pow(1.-abs(dot(n,normalize(camera-point))),2.);
   float pane=clamp(.22+.46*fract(point.y*.53)+grazing*.44,0.,1.);
   albedo=mix(baseColor*.52,mix(fog,baseColor,.51),pane);
  }else{
   float oxidized=smoothstep(.48,.74,weathering+fleck*.18);
   albedo=mix(baseColor*(.85+fleck*.30),baseColor*vec3(.78,.91,.85),oxidized*.63);
  }
 }
 if(kind>16.5&&kind<18.5){`],
]);
