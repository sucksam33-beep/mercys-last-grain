const fs=require("node:fs"),path=require("node:path");
const source=process.argv[2],game=path.join(__dirname,"game");
const entries=JSON.parse(fs.readFileSync(path.join(source,"manifest.json"),"utf8")).images;
if(entries.length!==100||new Set(entries.map(v=>v.id)).size!==100)throw Error("Expected 100 stable weapon IDs");
const catalogue=entries.map(({id,name,family,tier,materials})=>({id,name,family,tier,materials}));
fs.writeFileSync(path.join(game,"WeaponCatalogue.js"),"const weaponCatalogue="+JSON.stringify(catalogue,null,1)+";\n");
const patch=(file,old,next)=>{
 const p=path.join(game,file),s=fs.readFileSync(p,"utf8");
 if(!s.includes(old))throw Error("Missing catalogue hook "+file);
 fs.writeFileSync(p,s.replace(old,next));
};
patch("index.html",'<script src="Timber.js"></script>','<script src="Timber.js"></script><script src="WeaponCatalogue.js"></script>');
patch("CraftingData.js"," return {regions,categories,stations,slots,items,recipes,artKey};",`
 for(const [name,station,needs] of [
  ["가공 사암촉","bench","사암:1"],
  ["굵은 밧줄","sew","표류 밧줄:1|삼 끈:1"],
  ["낙우송 부표","bench","timber_quality:1|숭어 기름:1"],
  ["눈신토끼 털감개","sew","무두질 눈신토끼 가죽:1|삼실:1"],
  ["단조 철재","forge","철재:1|숯:1"],
  ["방수 갈대 끈","sew","갈대 끈:1|숭어 기름:1"],
  ["복합 시위","sew","엘크 힘줄:1|삼 끈:1"],
  ["산토끼 털감개","sew","무두질 산토끼 가죽:1|삼실:1"],
  ["정밀 연결부","forge","철재:1|구리판:1"]
 ])recipe(name,0,station,needs,1,null,"장비 제작용 가공 재료");
 const families=["staff","javelin","hunting-bow","hook-spear","dagger","longbow","axe","levee-pike","harpoon","winter-spear"];
 const districts=[0,0,0,1,2,3,4,5,6,7];
 for(const variant of weaponCatalogue){
  const i=families.indexOf(variant.family);
  const stats={...weapons[i][3],power:Math.round(weapons[i][3].power*(.87+variant.tier*.085))};
  const grade=[1,2,3,3,4][variant.tier-1],needs=new Map();
  for(const material of variant.materials){
   const item=timberAliases.has(material)?timberGrades[grade-1].id:material==="방수 널판"?"craft:waterproof-board":material;
   needs.set(item,(needs.get(item)??0)+1);
  }
  const ingredients=[...needs].map(([id,n])=>id+":"+n).join("|");
  const tier=["생활형","숙련형","전문형","정밀형","명품형"][variant.tier-1];
  recipe(variant.name,districts[i],"bench",ingredients,2,"weapon",tier+" · "+weapons[i][2],stats,1,variant.id);
  recipes[variant.id].tier=variant.tier;
  items[variant.id].concept=variant.id;
 }
 return {regions,categories,stations,slots,items,recipes,artKey};`);
patch("ToolMotion.js","const toolMotionTiming={",`for(const entry of weaponCatalogue){
 const base={staff:"staff",javelin:"javelin","hunting-bow":"bow","hook-spear":"hook",dagger:"knife",longbow:"longbow",axe:"heavyaxe","levee-pike":"spear",harpoon:"harpoon","winter-spear":"winter-spear"};
 toolMotionByName[entry.name]=base[entry.family];
}
const toolMotionTiming={`);
patch("CraftingMenu.js",' img.src="assets/crafting/"+CraftingData.artKey(entry.id)+(large?"-detail":"")+".webp";',` if(entry.concept)img.src="assets/timber-weapons/"+entry.concept+".jpg";
 else if(!timberGrades.some(grade=>grade.id===entry.id))img.src="assets/crafting/"+CraftingData.artKey(entry.id)+(large?"-detail":"")+".webp";`);
