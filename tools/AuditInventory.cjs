const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const game=path.join(__dirname,"game"),read=file=>fs.readFileSync(path.join(game,file),"utf8");
const c=vm.createContext({});const html=read("index.html");
for(const file of ["Timber.js","WeaponCatalogue.js","CraftingData.js"])vm.runInContext(read(file),c);
vm.runInContext(html.slice(html.indexOf("const regionData"),html.indexOf("const sizes"))+"\n"+html.match(/const storeItems=.*;/)[0],c);
const items=vm.runInContext(`(()=>{
 const out={};
 const add=(id,category,region,form,source)=>out[id]??={id,name:id,category,region,form,source};
 for(const [i,r] of regions.entries()){
  r.fish.flat().forEach(id=>add(id,5,i,"물고기","지역 낚시"));
  r.plants.forEach((group,j)=>group.forEach(id=>add(id,6,i,["열매","찻잎","곡식"][j],"지역 채집")));
  r.animals.slice(0,4).forEach(id=>add(id+" 가죽",0,i,"가죽","지역 사냥"));
  if(i)add(r.exportItem,8,i,"교역품","지역 상점");
 }
 Object.keys(storeItems).forEach(id=>add(id,8,0,"상점 장비","지역 상점"));
 meat.forEach(id=>add(id,7,0,"고기","지역 사냥"));
 for(const id of ["따뜻한 식사","따뜻한 차","손질한 곡물","곡물죽"])add(id,7,0,"요리","여행솥");
 for(const id of ["마지막 씨앗 항아리","심을 수 있는 아사기 볍씨"])add(id,8,0,"캠페인","이야기 진행");
 return {...out,...CraftingData.items};
})()`,c);
const hashes=new Map(Object.keys(items).map(id=>[vm.runInContext("CraftingData.artKey("+JSON.stringify(id)+")",c),id]));
for(const dir of ["crafting","crafting-models"]){
 const ids=fs.readdirSync(path.join(game,"assets",dir)).filter(x=>!x.includes("-detail")).map(f=>hashes.get(f.split(".")[0])).filter(Boolean);
 console.log(dir,ids.length);if(dir==="crafting-models")console.log(Object.values(items).filter(i=>i.category!==5&&i.category!==6&&!i.icon&&!ids.includes(i.id)).map(i=>i.name).join(" / "));
}
console.log(Object.keys(items).length,Object.entries(Object.values(items).reduce((g,v)=>(g[v.category]=(g[v.category]??0)+1,g),{})));
console.log(Object.keys(items).filter(id=>id.includes("씨앗")));
fs.writeFileSync(path.join(__dirname,"inventory-audit.json"),JSON.stringify(Object.values(items),null,2));
