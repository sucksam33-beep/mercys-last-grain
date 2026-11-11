const fs=require("fs"),assert=require("assert/strict");
const p="game/Timber.js";
const original=fs.readFileSync(p,"utf8");
const a=`  for(const dx of [-1.2,0,1.2])box(x+dx,y,z,.14,1.11,.15,oak,0,surface.wall);
  const left=showMaterialModel("울타리",x-.60,y+.30,z,1.11,.58,0,true);
  const right=showMaterialModel("울타리",x+.60,y+.30,z,1.11,.58,0,true);
  if(!left||!right)for(const h of [.38,.79])box(x,y+h,z,2.6,.11,.10,oak,0,surface.wall);`;
const b=`  if(!showMaterialModel("울타리",x,y,z,2.6,1.11,0,true)){
   for(const dx of [-1.2,0,1.2])box(x+dx,y,z,.14,1.11,.15,oak,0,surface.wall);
   for(const h of [.38,.79])box(x,y+h,z,2.6,.11,.10,oak,0,surface.wall);
  }`;
const nl=s=>original.includes("\r\n")?s.replace(/\n/g,"\r\n"):s;
assert.ok(original.includes(nl(a)));fs.writeFileSync(p,original.replace(nl(a),nl(b)));
const file="fal-integration-review/fal-asset-list.json",report=JSON.parse(fs.readFileSync(file,"utf8"));
for(const [id,requestId] of [["화물 상자","01a1bc3e-2e7c-7232-b8f5-e30ac55391ef"],["울타리","01a1bc3e-2e7d-7272-97ec-2a4fb230a0"]])report.rows.find(x=>x.id===id&&x.group==="reused").requestId=requestId;
report.historicalComparisons={ingredients:"ingredient-cleanup/ingredients-before-after.jpg",meaning:"비교 시트의 왼쪽은 기존 원화 또는 아이콘, 오른쪽은 로컬 GLB 렌더입니다."};
fs.writeFileSync(file,JSON.stringify(report,null,2));
