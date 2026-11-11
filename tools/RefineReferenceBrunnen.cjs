const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const stage=path.join(__dirname,"reference-architecture-stage/game");
function edit(file,replacements){
 const target=path.join(stage,file);let text=fs.readFileSync(target,"utf8").replaceAll("\r\n","\n");
 for(const [a,b] of replacements){assert.equal(text.split(a).length,2,a);text=text.replace(a,()=>b);}
 fs.writeFileSync(target,text);
}
edit("BrunnenCity.js",[
 ['const tint=color(["#d4b88e","#b87861","#abaaa0","#d2bf9f","#aa795d"][(i+z)%5]);','const tint=color(["#d8c8a7","#aa6755","#bfb7a3","#e0cbae","#9e6453"][(i+z)%5]);'],
 ['const eave=base+h,ridge=eave+2.1+random()*.9;','const eave=base+h,ridge=eave+2.45+random()*1.2;'],
 ['  const glassTint=color("#6d94a3"),materials=architectureMaterials;','  const glassTint=color("#657b80"),shutter=color(["#7a8170","#695e53","#74847d"][(i+z)%3]),materials=architectureMaterials;'],
 ['    box(facade+side*.10,sill-.04,z+offset,.23,.12,1.25,trim,0,masonry);',`    box(facade+side*.10,sill-.04,z+offset,.23,.12,1.25,trim,0,masonry);
    if(floor>0)for(const wing of [-1,1]){
     const leaf=z+offset+wing*.69;
     box(facade+side*.045,sill+.11,leaf,.095,1.22,.25,shutter,0,materials.wood);
     for(const bar of [.32,.98])box(facade+side*.101,sill+bar,leaf,.034,.044,.25,shade(shutter,.70),0,materials.wood);
    }`],
 ['    box(x+bay*1.68,sill-.04,face+side*.10,1.18,.11,.21,trim,0,masonry);',`    box(x+bay*1.68,sill-.04,face+side*.10,1.18,.11,.21,trim,0,masonry);
    const lintel=sill+1.40;
    box(bayX,lintel,face+side*.071,1.18,.12,.15,shade(trim,1.09),0,materials.stone);
    if(floor>0&&bay!==0)for(const wing of [-1,1])
     box(bayX+wing*.64,sill+.14,face+side*.06,.24,1.18,.11,shutter,0,materials.wood);`],
]);
edit("index.html",[['src="BrunnenCity.js?v=architecture-finish"','src="BrunnenCity.js?v=regional-reference"']]);
