const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=__dirname;
const stage=path.join(root,"dialogue-opening-stage/game/index.html");
let html=fs.readFileSync(path.join(root,"game/index.html"),"utf8");
for(const [a,b] of [
 ['name==="민가"&&riggedScene?.addHouseExterior','name==="민가"&&(!expansion||style===1)&&riggedScene?.addHouseExterior'],
 [' variedFacade(x,y,z,w,d,h,plan);',' variedFacade(x,y,z,w,d,h,plan);\n if(!cityHouse&&name!=="내 집")villageIdentityDetails(x,y,z,w,d,h,plan);'],
 ...["VillageCharacter.js","BuildingVariation.js","SettlementExpansion.js"].map(f=>['src="'+f+'"','src="'+f+'?v=regional-villages"'])
]){
 assert.equal(html.split(a).length,2,a);
 html=html.replace(a,()=>b);
}
fs.writeFileSync(stage,html);
