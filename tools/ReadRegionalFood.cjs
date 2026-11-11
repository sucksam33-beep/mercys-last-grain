const fs=require("node:fs");
const names=["아사기","브뤼넨","산타 루시아","주니퍼웰","비버턴","생오렐","암바로","카루크"];
const text=fs.readFileSync(process.argv[2],"utf8");
const dishes=[];
for(const line of text.split(/\r?\n/)){
 if(!line.startsWith("| "))continue;
 const [region,scope,name,input,station,result]=line.split("|").slice(1,-1).map(v=>v.trim());
 if(!["Previous","New"].includes(scope))continue;
 const area=names.indexOf(region);
 const needs=input.split(",").map(item=>{const match=item.trim().match(/^(.+?)\s*×(\d+)$/);if(!match)throw Error(item);return [match[1],Number(match[2])];});
 const match=result.match(/^(\d+) servings, (\w+)/);
 if(area<0||!match)throw Error(line);
 const slot=dishes.filter(d=>d.region===area).length+1;
 const id="dish-"+(area+1)+"-"+slot;
 dishes.push({id,name,region:area,needs,station,servings:Number(match[1]),profile:match[2],icon:"assets/item-icons/"+id+".png"});
}
if(dishes.length!==24||names.some((_,i)=>dishes.filter(d=>d.region===i).length!==3))throw Error("Expected 24 dishes");
const ingredients=[
 {id:"감자",name:"감자",code:"potato",region:0,price:3,source:"아사기 논둑 식료품점 · 비버턴 역전 식료품점"},
 {id:"양파",name:"양파",code:"onion",region:1,price:3,source:"브뤼넨 시장 곡물상 · 생오렐 제방 식료품점"},
 {id:"소금",name:"소금",code:"salt",region:6,price:4,source:"암바로 해안 과일점 · 지역 교역"}
].map(e=>({...e,icon:"assets/item-icons/ingredient-"+e.code+".png"}));
fs.writeFileSync("game/RegionalFoodData.js","const regionalDishes="+JSON.stringify(dishes,null,1)+";\nconst regionalIngredients="+JSON.stringify(ingredients,null,1)+";\n");
