const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const stage=path.join(__dirname,"dialogue-opening-stage","game");
const settlement=path.join(stage,"SettlementExpansion.js");
let source=fs.readFileSync(settlement,"utf8");
const marker=' }\n const slope=(x,z,w,d)=>{';
assert.ok(source.includes(marker));
source=source.replace(marker,`  // Fill gaps left by steep slopes without relaxing clearance around routes or rail.
  const [along,across]={
   terraces:[1.31,.76],courts:[1.07,.89],contours:[1.34,.68],
   rail:[1.33,.81],embankments:[1.35,.68],beach:[.77,1.34],windbreaks:[1.30,.72]
  }[district.layout];
  for(let column=0;column<92;column++)for(const [row,[x,z]] of centers.entries()){
   const angle=column*2.399963+row*1.1+s.region*.57;
   const radius=8+28*Math.sqrt((column+.5)/92);
   const dx=Math.cos(angle)*radius*along,dz=Math.sin(angle)*radius*across;
   const facesSide=district.layout==="beach"||(district.layout==="courts"&&Math.abs(dx)>Math.abs(dz));
   const turn=facesSide?(dx>0?1:3):(dz>0?2:0);
   const yard=facesSide?[x,z+dz*.67]:[x+dx*.67,z];
   candidates.push({x:x+dx,z:z+dz,lane:z,key:row,row,column,yard,turn});
  }
 }
 const slope=(x,z,w,d)=>{`);
fs.writeFileSync(settlement,source);
const capture=path.join(__dirname,"regional-village-comparison-native.cjs");
source=fs.readFileSync(capture,"utf8");
source=source.replace('houses:settlementAdded,eye:', 'houses:settlementAdded,blocked:buildingFootprints.filter(p=>p.expanded&&districtConnectionDistance(s.region,p.x,p.z)<7.5+Math.max(p.w,p.d)*.40).length,eye:');
source=source.replace('assert.equal(result.gl,0);','assert.equal(result.gl,0);assert.equal(result.blocked,0);');
fs.writeFileSync(capture,source);
