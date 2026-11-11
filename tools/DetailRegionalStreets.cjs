const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const stage=path.join(__dirname,"dialogue-opening-stage","game");
const village=path.join(stage,"VillageCharacter.js");
let text=fs.readFileSync(village,"utf8");
const key='const villageStoneTones=["#767b73","#85857e","#8f8579","#78796e","#798086","#777c76","#88887e","#828890"];';
assert.ok(text.includes(key));
text=text.replace(key,`const villageStoneTones=["#979a85","#a99c87","#bf8d61","#8b806a","#939591","#86948a","#c4a983","#889ea4"];
const villagePathSoils=["#b0a279","#a29782","#cf975f","#a18360","#a79883","#8e9c7c","#d4b178","#8f9694"];
const villageVergeColors=[
 ["#667a44","#9ca45b","#cbb694"],["#496844","#738751","#a77e46"],["#687752","#a0a16d","#d4a95f"],
 ["#4d6742","#708651","#a5a16a"],["#55634e","#78876b","#c6ad69"],["#527153","#77965c","#b1aa6d"],
 ["#527b4b","#839c58","#d9a261"],["#55685d","#75867a","#a1a68e"]
];
function dressVillageVerges(nodes){
 const district=villageDistricts[s.region],palette=villageVergeColors[s.region].map(color);
 const random=rand(7131+s.region*211),used=[];
 const count=Math.min(nodes.length,240);
 for(let i=0;i<count;i++){
  const [cx,cz]=nodes[Math.floor(i*nodes.length/count)];
  const angle=random()*Math.PI*2,distance=2.1+random()*2.1;
  const x=cx+Math.cos(angle)*distance,z=cz+Math.sin(angle)*distance;
  if(used.some(([a,b])=>Math.hypot(a-x,b-z)<3.4)||!villageRouteGround(x,z,.72)||
    onVillageWalk(x,z,.90)||roadDist(x,z)<3.8||districtConnectionDistance(s.region,x,z)<8)continue;
  const y=terrainSurface(x,z);
  used.push([x,z]);
  const patches=district.layout==="blocks"||district.layout==="windbreaks"?3:6;
  for(let n=0;n<patches;n++){
   const a=x+(random()-.5)*1.18,b=z+(random()-.5)*1.18,base=terrainSurface(a,b);
   if(onVillageWalk(a,b,.35))continue;
   const size=.11+random()*.16,stem=palette[n%2],bloom=palette[2];
   if(n===0&&["blocks","courts","windbreaks"].includes(district.layout)){
    box(a,base-.025,b,.55,.24,.49,shade(villageStoneTone(),.91),0,surface.masonry);
    rounded(a,base+.24,b,.27,.14,.23,stem,surface.leaves);
   }else{
    rounded(a,base+size*.48,b,size,size*.72,size*.75,stem,surface.leaves);
    if(n%3===0)rounded(a,base+size*1.22,b,size*.35,size*.27,size*.34,bloom);
   }
  }
 }
}
`);
text=text.replace('const soil=mix(color("#a99571"),color(villagePalette[s.region][0]),.36);','const soil=color(villagePathSoils[s.region]);');
fs.writeFileSync(village,text);
const settlement=path.join(stage,"SettlementExpansion.js");
text=fs.readFileSync(settlement,"utf8");
assert.ok(text.includes(" planResidents(city,streetNetwork.pockets);"));
text=text.replace(" planResidents(city,streetNetwork.pockets);"," dressVillageVerges(streetNetwork.nodes);\n planResidents(city,streetNetwork.pockets);");
fs.writeFileSync(settlement,text);
