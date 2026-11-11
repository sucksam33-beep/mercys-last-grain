const fs=require("node:fs"),path=require("node:path");
const dir=path.join(__dirname,"game");
const edit=(name,fn)=>{
 const file=path.join(dir,name);fs.writeFileSync(file,fn(fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n")));
};
edit("Timber.js",s=>s
 .replace(' if(timberGrades.some(g=>g.id===name))return name;',' if(timberGrades.some(g=>g.id===name)||name==="타마린드"&&!grade)return name;')
 .replace('"reservations","reserved","pendingConstruction"','"reservations","reserved","reservedTimber","pendingConstruction"')
 .replace('if(tool)beginToolMotion("손도끼",finish,valid);','if(tool)beginToolMotion(tool,finish,valid,"right",action);')
 .replace(' const cost=new Map();\n for(const [id,n] of needs){',' const cost=new Map();\n const ordered=upgrade?[...needs].sort(([a],[b])=>timberGrades.findIndex(g=>g.id===b)-timberGrades.findIndex(g=>g.id===a)):needs;\n for(const [id,n] of ordered){')
 +`
const timberRepairs={
 summer:{name:"지붕 골조와 대피로 정비",needs:[["timber_log",2]]},
 market:{name:"시장 지하 창고 받침",needs:[["timber_log",2]]},
 smith:{name:"구난 마차 화물 받침",needs:[["timber_quality",2]]},
 delta:{name:"생오렐 수차 보수",needs:[["timber_quality",2]]},
 snow:{name:"카루크 임시 구조물 받침",needs:[["timber_log",2]]},
 sealed:{name:"북부 구호 수송 장비 정비",needs:[["timber_quality",2]]}
};
function timberCampaignRepair(step){return timberRepairs[step];}
function timberStock(){
 const body=modal("목재","가방과 예약 물량");
 s.reservedTimber??={};
 const stock=s.reservedTimber["현장 비축"]??={};
 for(const grade of timberGrades){
  const id=grade.id;
  craftParagraph(body,grade.name+" · 가방 "+count(id)+" · 사용 가능 "+timberFree(id)+" · 예약 "+timberReserved(id));
  if(timberFree(id)>0)button(body,"현장용 "+grade.name+" 1개 예약",()=>{
   if(timberFree(id)>0){stock[id]=(stock[id]??0)+1;autosave();timberStock();}
  });
  if(stock[id]>0)button(body,grade.name+" 1개 예약 해제",()=>{
   if(stock[id]>0){stock[id]--;autosave();timberStock();}
  });
 }
 button(body,"가방으로",satchel);
}
`);
edit("region-ecology.js",s=>{
 const a=s.indexOf(' [r().wood,lumber[s.region]].forEach');
 const b=s.indexOf(' [r().stone,alternateStone',a);
 if(a<0||b<a)throw Error("Legacy timber ecology missing");
 return s.slice(0,a)+s.slice(b);
});
edit("ToolMotion.js",s=>s.replace('"손도끼":"axe",','"손도끼":"axe","벌목 도끼":"axe","강화 벌목 도끼":"heavyaxe",'));
edit("index.html",s=>s
 .replace('function spend(items){if(items.some(([name,n])=>count(name)<n))','function spend(items){if(items.some(([name,n])=>timberFree(name)<n))')
 .replace(' body.append($("pack").cloneNode(true));',' body.append($("pack").cloneNode(true));\n button(body,"목재 보관 및 예약",timberStock);')
 .replace('for(const [item,n] of Object.entries(s.bag)){const div=', 'for(const [item,n] of Object.entries(s.bag).filter(([id])=>!timberGrades.some(grade=>grade.id===id))){const div=')
 .replace('qty.textContent=n;div.append(name,qty);$("pack").append(div)}','qty.textContent=n;div.append(name,qty);$("pack").append(div)}\n const timber=document.createElement("section");craftParagraph(timber,"목재");\n for(const grade of timberGrades)craftParagraph(timber,grade.name+" × "+count(grade.id));\n $("pack").append(timber);')
 .replace('[r().wood,lumber[s.region],r().stone,alternateStone[s.region]]','[...timberGrades.map(grade=>grade.name),r().stone,alternateStone[s.region]]')
 .replace('function commit(option,quantities){','function commit(option,quantities,confirmed){')
 .replace('  if(repair&& !timberCost(repair.needs)){soilParagraph(body,repair.name+"에 "+repair.needs.map(([id,n])=>craftName(id)+" ×"+n).join(" · ")+" 필요");return;}','  if(repair&&!confirmed){timberConfirm(repair.needs,cost=>commit(option,quantities,cost),soilMission);return;}')
 .replace('  if(repair&&!spend(repair.needs))return;','  if(repair&&!spend(confirmed))return;')
 .replace(' if(soilEpisode()?.region===s.region&&soilEpisode()?.place===selected)add',' if(s.region===0&&selected==="home"&&s.soilCampaign?.act===1)add("감나무집 뒤 삼나무 숲 안내",timberCodex);\n if(soilEpisode()?.region===s.region&&soilEpisode()?.place===selected)add'));
