const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.join(__dirname,"architecture-stage/game");
const file=path.join(root,"BrunnenCity.js");
let source=fs.readFileSync(file,"utf8");
function edit(a,b){assert.equal(source.split(a).length,2,a);source=source.replace(a,()=>b);}
edit('const tint=color(["#b5a88d","#beaa8a","#9e836e","#c2b99e","#a59a8e"][i%5]);',`const tint=color(["#d4b88e","#b87861","#abaaa0","#d2bf9f","#aa795d"][(i+z)%5]);
  const slateTone=color(["#674440","#47596b","#7c5242","#4a625f"][(i+z)%4]);
  const glassTint=color("#6d94a3"),materials=architectureMaterials;`);
edit('box(x,base,z,w,h,d,tint,0,surface.plaster);','box(x,base,z,w,h,d,tint,0,materials.stone);');
edit('   quad(...panel,roof,slate);',`   quad(...panel,roof,slate);
   architecturalRoofFace([edge,eave+.026,z-d*.616],[x,ridge-.054,z-d*.616],
    [x,ridge-.054,z+d*.616],[edge,eave+.026,z+d*.616],slateTone);
   box(x+side*(w*.5+.033),base+h-.39,z,.16,.20,d+.17,trim,0,materials.stone);`);
edit('box(facade+side*.09,sill+.11,z+offset,.08,1.17,.88,color("#343e43"));','box(facade+side*.09,sill+.11,z+offset,.08,1.17,.88,glassTint,0,materials.glass);');
edit('box(bayX,sill+.12,glass,.81,1.17,.08,color("#343e43"));','box(bayX,sill+.12,glass,.81,1.17,.08,glassTint,0,materials.glass);');
edit('   box(x,base+h-.29,face,w+.12,.18,.22,trim,0,masonry);',`   box(x,base+h-.29,face,w+.12,.18,.22,trim,0,materials.stone);
   for(let floor=1;floor<4;floor++){
    const course=base+.32+floor*(h-1.2)/4;
    box(x,course,face,w+.10,.092,.16,shade(trim,.92),0,materials.stone);
   }
   for(const sideX of [-1,1])for(let n=0;n<12;n++){
    const width=n%2?.31:.46;
    box(x+sideX*(w*.50-width*.48),base+n*h/12,face+side*.02,width,h/12-.043,.12,shade(trim,.88+(n%2)*.08),0,materials.stone);
   }`);
fs.writeFileSync(file,source);
const index=path.join(root,"index.html");
source=fs.readFileSync(index,"utf8");
edit('src="BrunnenCity.js"','src="BrunnenCity.js?v=architecture-finish"');
fs.writeFileSync(index,source);
