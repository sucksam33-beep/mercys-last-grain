const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.join(__dirname,"reference-architecture-stage/game");
const index=path.join(root,"index.html");
let s=fs.readFileSync(index,"utf8");
function replace(a,b){assert.equal(s.split(a).length,2,a);s=s.replace(a,()=>b);}
replace(' houseApproach(x,y,doorZ,width,s.region===0);',` if(name==="아사기 공동 창고")asagiGranaryApproach(x,y,doorZ,width);
 else houseApproach(x,y,doorZ,width,s.region===0);`);
replace('  heading=facing=Math.PI;\n  pitch=.10;zoom=4.4;', '  heading=facing=Math.PI;\n  pitch=.015;zoom=7.4;');
fs.writeFileSync(index,s);
fs.appendFileSync(path.join(root,"ArchitectureFinish.js"),`
function asagiGranaryApproach(x,y,doorZ,doorWidth){
 const near=doorZ+1.49,far=asagiGranary.z+12.55,width=doorWidth+.66;
 const top=y+.43,foot=terrainSurface(x,far)+.05;
 const grade=(_,z)=>lerp(top,foot,cap((z-near)/(far-near),0,1));
 const underside=Math.min(top,foot)-.22;
 const ramp=addSurface(x,(near+far)*.5,width,far-near,underside,grade);
 const step=addSurface(x,near-.09,width,.24,y+.12,top);
 step.houseStep=true;
 const mat=architectureMaterials.wood,wood=color("#68523c");
 const boards=Math.ceil((far-near)/.23);
 for(let i=0;i<boards;i++){
  const a=lerp(near,far,i/boards),b=lerp(near,far,(i+.96)/boards);
  const left=x-width*.5,right=x+width*.5;
  quad([left,grade(x,a)+.01,a],[right,grade(x,a)+.01,a],
   [right,grade(x,b)+.01,b],[left,grade(x,b)+.01,b],shade(wood,.90+.16*Math.sin(i*2.7)),mat);
 }
 for(const side of [-1,1]){
  const a=x+side*(width*.5-.067);
  tube([a,top-.065,near],[a,foot-.065,far],.082,.064,shade(wood,.78),mat,4);
 }
 buildingFootprints.at(-1).approach=[x,far];
}
`);
