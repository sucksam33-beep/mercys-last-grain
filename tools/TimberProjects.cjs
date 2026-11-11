const fs=require("node:fs"),path=require("node:path");
const dir=path.join(__dirname,"game");
const edit=(name,fn)=>{
 const file=path.join(dir,name);fs.writeFileSync(file,fn(fs.readFileSync(file,"utf8")));
};
edit("Crafting.js",s=>s
 .replace(' return point&&Math.hypot(player.x-point[0],player.y-point[1])<=3.7;',' const bench=station==="bench"?s.timberStructures?.[s.region]?.bench:null;\n return Boolean(point&&Math.hypot(player.x-point[0],player.y-point[1])<=3.7||bench&&Math.hypot(player.x-bench.x,player.y-bench.z)<=3.7);')
 .replace('s.stage<recipe.unlock','!craftRecipeUnlocked(recipe)'));
edit("CraftingMenu.js",s=>s.replace('s.stage>=recipe.unlock','craftRecipeUnlocked(recipe)'));
edit("index.html",s=>s.replace(' if(s.region===0&&selected==="home"&&s.soilCampaign?.act===1)add',' if(selected==="home")add("목공 시설 놓기",timberStructuresMenu);\n if(selected==="gate"&&s.region===0||selected==="station"&&[1,6].includes(s.region))add("목재 시설 개선",timberProjectsMenu);\n if(s.region===0&&selected==="home"&&s.soilCampaign?.act===1)add'));
edit("region-ecology.js",s=>s.replace("paintTimberSites();","paintTimberSites();paintTimberStructures();"));
edit("Timber.js",s=>s
 .replace("if(road.to===to)return days+1;","if(road.to===to)return Math.max(1,days+1-(s.timberProjects?.ship&&[from,to].includes(6)?1:0));")
 +`
const timberProjects=[
 {id:"market",region:1,spot:"station",name:"시장 화물 분류대",needs:[["timber_quality",2],["고철",1]],act:2},
 {id:"sluice",region:0,spot:"gate",name:"정밀 수문틀 설치",needs:[["정밀 수문틀",1],["정밀 연결부",2]],after:true},
 {id:"ship",region:6,spot:"station",name:"대형 수송선 보강",needs:[["대형 선박 용골",1],["단조 철재",2],["craft:waterproof-board",2]],after:true},
 {id:"workshop",region:1,spot:"station",name:"고급 작업대 고정구",needs:[["timber_premium",2],["정밀 연결부",1]],after:true}
];
function craftRecipeUnlocked(recipe){
 if(["정밀 수문틀","대형 선박 용골"].includes(recipe.id)&&s.soilCampaign?.step)return Boolean(s.soilCampaign.complete);
 return s.stage>=recipe.unlock;
}
function timberProjectsMenu(){
 const body=modal("목재 시설","지역 기반 시설 개선");
 for(const project of timberProjects.filter(p=>p.region===s.region&&p.spot===selected)){
  const label=project.name;
  if(s.timberProjects?.[project.id]){craftParagraph(body,label+" · 완료");continue;}
  if(project.after&&!s.soilCampaign?.complete&&s.stage<6||project.act&&(s.soilCampaign?.act??0)<project.act&&s.stage<5){
   craftParagraph(body,label+" · 이야기 진행 후 개방");continue;
  }
  row(body,label+" · "+project.needs.map(([id,n])=>craftName(id)+" ×"+n).join(" · "),"개선",()=>{
   timberConfirm(project.needs,cost=>{
    if(s.region!==project.region||s.timberProjects?.[project.id]||!spend(cost))return;
    s.timberProjects??={};s.timberProjects[project.id]=true;
    if(project.id==="market"&&s.soilCampaign)s.soilCampaign.cargo+=2;
    autosave();districtEcologyDirty=true;log(label+" 완료");timberProjectsMenu();render();
   },timberProjectsMenu);
  });
 }
}
function timberStructuresMenu(){
 const region=s.region,body=modal("목공 시설","집터 주변에 설치");
 const home=here("home");
 for(const [id,item,dx,dz] of [["bench","기본 작업대",4,9],["fence","울타리",-5,8]]){
  if(s.timberStructures?.[region]?.[id]){craftParagraph(body,item+" · 설치됨");continue;}
  row(body,item+" · 1개","놓기",()=>{
   if(s.region!==region||!count(item)||s.timberStructures?.[region]?.[id])return;
   const x=home.x+dx,z=home.y+12+dz,y=supportAt(x,z);
   if(y===null||!fitsTree(x,z,.85)){log("시설을 놓을 자리가 비어 있지 않아.");return;}
   give(item,-1);
   const structures=(s.timberStructures??={})[region]??={};
   structures[id]={x,z};
   if(!autosave()){delete structures[id];give(item);return;}
   districtEcologyDirty=true;timberStructuresMenu();render();
  });
 }
}
function paintTimberStructures(){
 const local=s.timberStructures?.[s.region];
 const oak=color("#765438");
 if(local?.bench){
  const {x,z}=local.bench,y=terrainSurface(x,z);
  for(const side of [-1,1])box(x+side*.4,y,z,.13,.79,.47,oak,0,surface.wall);
  box(x,y+.78,z,1.17,.15,.72,oak,0,surface.wall);
  aimBox("내 목공 작업대",x,z,1.3,1.1,y,y+1.1,null,{type:"craftStation",station:"bench",x,z,reach:3.6});
 }
 if(local?.fence){
  const {x,z}=local.fence,y=terrainSurface(x,z);
  for(const dx of [-1.2,0,1.2])box(x+dx,y,z,.14,1.11,.15,oak,0,surface.wall);
  for(const h of [.38,.79])box(x,y+h,z,2.6,.11,.10,oak,0,surface.wall);
  addSurface(x,z,2.6,.20,y,y+1.1,false);
 }
 for(const project of timberProjects.filter(p=>p.region===s.region&&s.timberProjects?.[p.id])){
  const base=here(project.spot);
  const x=base.x+(project.id==="workshop"?4:-4),z=base.y+13,y=terrainSurface(x,z);
  box(x,y,z,1.45,.30,.8,oak,0,surface.wall);
  box(x,y+.28,z,.93,.13,.51,color("#8b8d80"),0,surface.masonry);
  aimBox(project.name,x,z,1.5,1,y,y+.6);
 }
}
`);
