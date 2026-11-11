const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.join(__dirname,"architecture-stage/game");
const file=path.join(root,"ArchitectureFinish.js");
let s=fs.readFileSync(file,"utf8");
const marker="function architecturalWall(";
assert.ok(s.includes(marker));
s=s.replace(marker,`function architecturalRoofHip(left,peak,right,tint){
 const profile=architectureProfiles[s.region],metal=profile.style==="metal";
 const material=metal?architectureMaterials.metal:architectureMaterials.ceramic;
 const roof=mix(tint,color(profile.roof),.75);
 const height=(p,lift)=>[p[0],p[1]+lift,p[2]];
 const base=(u,v,lift)=>height(mix(mix(left,right,u),peak,v),lift);
 triangle(height(left,.009),height(peak,.009),height(right,.009),roof,material);
 const count=cap(Math.ceil(Math.abs(right[0]-left[0])/profile.step),6,22);
 if(metal){
  for(let i=0;i<=count;i++)tube(base(i/count,0,.041),base(i/count,1,.041),.026,.020,shade(roof,1.17),material,4);
 }else{
  for(let row=0;row<7;row++){
   const lo=row/7,hi=(row+1)/7-.008,shift=row%2*.42;
   const columns=Math.max(3,Math.round(count*(1-lo)));
   for(let i=-1;i<columns;i++){
    const a=Math.max(0,(i+shift)/columns),b=Math.min(1,(i+1+shift)/columns)-.001;
    if(b-a<.003)continue;
    quad(base(a,lo,.035),base(a,hi,.013),base(b,hi,.013),base(b,lo,.035),shade(roof,.97+.095*Math.sin(i*2.43+row)),material);
   }
  }
 }
 for(const side of [0,1])tube(base(side,0,.04),base(side,1,.04),.047,.042,shade(roof,.74),material,4);
}

`+marker);
s=s.replace(" const wall=mix(plan.wall", " const wall=mix(plan.wall");
fs.writeFileSync(file,s);
const roofs=path.join(root,"BuildingVariation.js");
s=fs.readFileSync(roofs,"utf8");
const marker2='  triangle([left,eave,front],b,[right,eave,front],inset?tint:wall,inset?roofMaterial:wallMaterial);';
assert.ok(s.includes(marker2));
s=s.replace(marker2,marker2+`
  if(inset){
   architecturalRoofHip([left,eave,front],b,[right,eave,front],tint);
   architecturalRoofHip([left,eave,back],a,[right,eave,back],shade(tint,.93));
  }`);
fs.writeFileSync(roofs,s);
const index=path.join(root,"index.html");
s=fs.readFileSync(index,"utf8");
const start=s.indexOf(" if(cityHouse&&s.region!==1)for(const k of ");
const end=s.indexOf(" if(s.region===0){",start);
assert.ok(start>=0&&end>start);
s=s.slice(0,start)+s.slice(end);
fs.writeFileSync(index,s);
