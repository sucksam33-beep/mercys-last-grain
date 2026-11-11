const fs=require("node:fs"),path=require("node:path");
const dir=path.join(__dirname,"game");
const edit=(name,fn)=>{
 const file=path.join(dir,name);fs.writeFileSync(file,fn(fs.readFileSync(file,"utf8")));
};
edit("AsagiActOne.js",s=>s.replace(` if(!buildingMaterials(3,2))return;
 if(!house())s.homes[0]={site:"home"};
 actState().repaired=true;
 tick(2,8);
 log("겐조와 지붕을 덮고 부엌의 아궁이를 고쳤다. 이제 집에서 잠자고 요리할 수 있다.");
 render();`,` timberConfirm(buildingMaterials(3,2),cost=>{
  if(s.region!==0||actState().repaired||!spend(cost))return;
  if(!house())s.homes[0]={site:"home"};
  actState().repaired=true;
  tick(2,8);
  $("dialog").close();
  log("겐조와 지붕을 덮고 부엌의 아궁이를 고쳤다. 이제 집에서 잠자고 요리할 수 있다.");
  render();
 },()=>$("dialog").close());`).replace("할머니 집 수리 · 목재 3 / 석재 2","할머니 집 수리 · 원목 3 / 석재 2"));
edit("Timber.js",s=>s+`
function timberTransit(from,to){
 const campaign=s.soilCampaign;
 const open=region=>Boolean(campaign?.routes?.[region]||region===7&&campaign?.history?.some(entry=>entry.mission==="snow"));
 if(!open(from)||!open(to)||from===to)return 0;
 const seen=new Set([from]),queue=[[from,0]];
 for(const [at,days] of queue){
  for(const road of worldRoads[at]){
   if(seen.has(road.to)||!open(road.to))continue;
   if(road.to===to)return days+1;
   seen.add(road.to);queue.push([road.to,days+1]);
  }
 }
 return 0;
}
function timberShipMenu(){
 const from=s.region,body=modal("목재 화물","지역 운송소");
 const consignments=s.timberShipments??=[];
 for(const shipment of consignments){
  const {id,count:n,to,arrival}=shipment;
  const label=craftName(id)+" ×"+n+" · "+regions[to].name+" · "+arrival+"일차";
  if(to===from&&arrival<=s.day)row(body,label,"수령",()=>{
   if(s.region!==to||!consignments.includes(shipment)||count(id)+n>999)return;
   const index=consignments.indexOf(shipment);
   consignments.splice(index,1);give(id,n);
   if(!autosave()){give(id,-n);consignments.splice(index,0,shipment);return;}
   timberShipMenu();render();
  });
  else craftParagraph(body,label);
 }
 const agreed=regions.flatMap((region,to)=>{
  const days=timberTransit(from,to);return days?[[to,days]]:[];
 });
 if(!agreed.length)craftParagraph(body,"연결된 운송 협약이 없어.");
 for(const [to,days] of agreed){
  for(const {id,name} of timberGrades){
   if(!timberFree(id))continue;
   row(body,regions[to].name+" · "+name+" ×1 · "+days+"일","발송",()=>{
    if(s.region!==from||!timberTransit(from,to)||!timberFree(id))return;
    give(id,-1);
    consignments.push({id,count:1,from,to,arrival:s.day+days});
    if(!autosave()){consignments.pop();give(id,1);return;}
    timberShipMenu();render();
   });
  }
 }
 button(body,"상점으로",shop);
}
`);
edit("index.html",s=>s.replace(" timberTradeRows(body);",' timberTradeRows(body);\n button(body,"목재 화물 발송·수령",timberShipMenu);'));
