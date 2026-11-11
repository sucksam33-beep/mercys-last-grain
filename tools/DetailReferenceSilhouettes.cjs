const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.join(__dirname,"reference-architecture-stage/game");
const file=path.join(root,"ArchitectureFinish.js");
let s=fs.readFileSync(file,"utf8");
function replace(a,b){assert.equal(s.split(a).length,2,a);s=s.replace(a,()=>b);}
replace(' for(const u of [0,1])tube(lift(point(u,0),.016),lift(point(u,1),.016),.067,.067,shade(roof,.69),material,4);',` for(const u of [0,1])tube(lift(point(u,0),.016),lift(point(u,1),.016),.067,.067,shade(roof,.69),material,4);
 const thatch=profile.style==="thatch";
 if(s.region===0||thatch){
  const u=a[1]+d[1]<b[1]+c[1]?0:1;
  const start=point(u,0),end=point(u,1);
  const dx=end[0]-start[0],dz=end[2]-start[2];
  const span=Math.hypot(dx,dz),count=Math.min(34,Math.ceil(span/.24));
  if(span>.28)for(let i=0;i<count;i++){
   const t=(i+.5)/count,p=point(u,t);
   const inward=point(u===0?.047:.953,t);
   const tone=shade(roof,.87+.15*Math.sin(i*3.8+p[0]));
   const tip=thatch?[p[0]+(p[0]-inward[0])*.25,p[1]-.08-Math.abs(Math.sin(i*2.4))*.07,p[2]+(p[2]-inward[2])*.25]:lift(p,.033);
   tube(lift(inward,.038),tip,thatch?.051:.075,thatch?.018:.063,tone,material,5);
  }
 }
`);
replace(' box(x,y+h-.065,front+.098,w+.12,.16,.23,shade(timber,1.19),0,mat.wood);',` box(x,y+h-.065,front+.098,w+.12,.16,.23,shade(timber,1.19),0,mat.wood);
 if([0,3,5,6].includes(s.region)){
  const span=w*.94,n=Math.ceil(span/.52);
  for(let i=0;i<=n;i++){
   const a=x-span*.5+i*span/n;
   box(a,y+h-.19,front+.19,.105,.15,.55,shade(timber,.88+(i%3)*.09),0,mat.wood);
  }
 }`);
fs.writeFileSync(file,s);
