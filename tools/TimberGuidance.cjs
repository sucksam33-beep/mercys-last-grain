const fs=require("node:fs"),path=require("node:path");
const dir=path.join(__dirname,"game");
const edit=(name,fn)=>{
 const file=path.join(dir,name);fs.writeFileSync(file,fn(fs.readFileSync(file,"utf8")));
};
edit("Timber.js",s=>s
 .replace("const timberSites=new Map();","const timberSites=new Map();\nlet timberGuide=null;")
 .replace('   craftParagraph(section,regions[group.region].name','   if(s.region===group.region)menuAction(section,group.label+" · 길 안내",()=>{timberGuide={...spot,region:group.region};resumeGameplay();});\n   craftParagraph(section,regions[group.region].name')
 .replace(' const reserved=s.reservedTimber??{};\n return Object.values(reserved).reduce((sum,stock)=>sum+(Number(stock?.[id])||0),0);',` const scan=stock=>{
  if(!stock||typeof stock!=="object")return 0;
  if(Array.isArray(stock)&&stock[0]===id)return Math.max(0,Number(stock[1])||0);
  if(stock.id===id||stock.item===id||stock.itemId===id)return Math.max(0,Number(stock.count??stock.quantity)||0);
  return Object.entries(stock).reduce((sum,[key,value])=>sum+(key===id?Math.max(0,Number(value)||0):scan(value)),0);
 };
 return [s.reservedTimber,s.reservations,s.reserved].reduce((sum,stock)=>sum+scan(stock),0);`)
 .replace(' const exact=timberCost(needs);\n if(exact){done(exact);return;}',' const exact=timberCost(needs);\n if(exact){done(exact);return;}'));
edit("index.html",s=>s
 .replace('function buildingMaterials(wood,stone){return [["timber_log",wood],[r().stone,stone]];}',`function buildingMaterials(wood,stone){
 const primary=r().stone,alternate=alternateStone[s.region];
 const available=Math.min(stone,count(primary));
 return alternate&&available<stone?[["timber_log",wood],...(available?[[primary,available]]:[]),[alternate,stone-available]]:
  [["timber_log",wood],[primary,stone]];
}`)
 .replace(' radar.classList.toggle("navigation-active",Boolean(marker)||',' radar.classList.toggle("navigation-active",Boolean(marker)||timberGuide?.region===s.region||')
 .replace(' for(const p of actStops()){\n  c.beginPath();c.arc(72+',` for(const road of worldRoads[s.region])stroke([road.edge,road.approach,worldHubs[s.region]],"#92783f",2);
 if(timberGuide?.region===s.region){
  const a=cap(72+(timberGuide.x-x)*scale,9,135),b=cap(72+(timberGuide.z-y)*scale,9,135);
  c.strokeStyle="#3b4e40";c.lineWidth=2;c.fillStyle="#f5d27a";
  c.beginPath();c.arc(a,b,5,0,Math.PI*2);c.fill();c.stroke();
  if(Math.hypot(timberGuide.x-x,timberGuide.z-y)<4)timberGuide=null;
 }
 for(const p of actStops()){
  c.beginPath();c.arc(72+`));
