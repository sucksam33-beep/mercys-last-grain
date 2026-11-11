const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const game=path.join(__dirname,"game"),out=path.join(__dirname,"fal-integration-review"),ref=process.argv[2],read=file=>fs.readFileSync(path.join(game,file),"utf8");
const c=vm.createContext({});
for(const f of ["Timber.js","WeaponCatalogue.js","CraftingData.js","InventoryData.js","RegionalFoodData.js"])vm.runInContext(read(f),c);
const lookup=vm.runInContext(`Object.fromEntries([...inventoryEntries,...regionalDishes,...regionalIngredients].map(x=>[x.id,x]))`,c);
const weapons=JSON.parse(fs.readFileSync(path.join(ref,"returning-waters-weapon-models-54","results.json"),"utf8"));
const ingredients=JSON.parse(fs.readFileSync(path.join(ref,"mercys-last-grain-ingredients-80","geometry-audit.json"),"utf8"));
const crafted=JSON.parse(fs.readFileSync(path.join(out,"crafted-fal-audit.json"),"utf8"));
const retired={"item-eb899809":"시트카가문비","item-d843ea65":"해안 카수아리나","item-55d438b1":"메스키트","item-e07745b7":"낙우송","item-5b5ce5b3":"더글러스전나무","item-9acb20e5":"로지폴소나무","item-cb6d3942":"편백","item-29f17136":"유럽참나무"};
const rows=[];
const add=(data)=>{
 assert.ok(fs.existsSync(path.join(game,data.model)),data.model);
 data.before=fs.existsSync(path.join(game,data.before??"missing-before"))?data.before:lookup[data.id]?.icon??null;
 rows.push(data);
};
for(const r of weapons){
 const live=vm.runInContext("CraftingData.recipes["+JSON.stringify(r.id)+"]",c);
 assert.ok(live?.model,r.id);
 add({id:r.id,name:live.name,group:"weapons",model:live.model,before:"assets/timber-weapons/"+r.id+".jpg",requestId:r.request_id,endpoint:r.endpoint_id,status:"기존 적용",view:"장착 및 배치"});
}
for(const r of ingredients)add({id:r.name,name:r.name,group:"ingredients",model:"assets/crafting-models/"+r.id+".glb",before:lookup[r.name]?.icon,requestId:r.request_id,endpoint:r.endpoint_id,status:"기존 적용",view:"식재료 아이콘 및 상점 진열",meshReview:r.review});
for(const r of crafted.filter(row=>row.id))add({id:r.id,name:r.name,group:"materials",model:r.model,before:"assets/crafting/"+r.key+".webp",requestId:r.requestId,endpoint:r.endpoint,status:"기존 적용",view:ingredients.some(x=>x.name===r.id)?"제작 재료 · 식재료 전용 모델 우선":"제작 재료 진열"});
const mapped=[
 ["장작","assets/living-props/firewood.glb","01a1bc7b-2169-7ec3-9f2f-3056e0de6187","fal-ai/trellis","작업대 재료 진열"],
 ["굵은 밧줄","assets/living-props/rope-coil.glb","01a1bc7b-2161-70a1-8342-855b618831df","fal-ai/trellis","작업대 재료 진열"],
 ["화물 상자","assets/asagi-props/closed-wood-crate.glb",null,"fal-ai/hunyuan-3d-pro-text-to-3d/v3.1/pro/text-to-3d","작업대 재료 진열"],
 ["울타리","assets/asagi-props/wood-fence-panel.glb",null,"fal-ai/hunyuan-3d-pro-text-to-3d/v3.1/pro/text-to-3d","작업대 재료 진열 및 건설 울타리"]
];
for(const [id,model,requestId,endpoint,view] of mapped)add({id,name:id,group:"reused",model,before:lookup[id]?.icon,requestId,endpoint,status:"이번 연결",view});
const old=crafted.filter(r=>!r.id).map(r=>({id:retired[r.key],model:r.model,requestId:r.requestId,status:"목재 등급 통합으로 제외"}));
assert.equal(rows.length,193);assert.equal(old.length,8);
const runtime=read("index.html");
const world=[];
for(const [folder,role] of [["wildlife","야생동물"],["regional-exteriors","지역 외관과 교통"],["asagi-props","목재 건축 소품"],["living-props","생활 소품"],["regional","지역 지형·건축 보조"],["brunnen","브뤼넨 건축"]]){
 for(const f of fs.readdirSync(path.join(game,"assets",folder)).filter(x=>x.endsWith(".glb")))world.push({model:"assets/"+folder+"/"+f,role,status:"현재 빌드에 포함",provenance:"아이템 매니페스트와 별도"});
}
const tracked=new Set(rows.map(r=>r.id));
const report={rows,retired:old,world,canonicalCount:tracked.size,scope:"Fal 계정에서 확인한 3D 작업과 현재 빌드의 로컬 연결"};
const preview=String.raw`
import * as T from "/vendor/three/three.module.min.js";
import {GLTFLoader} from "/vendor/three/GLTFLoader.js";
import {loadFalWeapon} from "/fal-weapon.mjs";
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setSize(320,320);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
const scene=new T.Scene();
scene.add(new T.HemisphereLight(0xfff8e9,0xaab0b2,2));
const light=new T.DirectionalLight(0xfff8ed,2.7);light.position.set(3,5,4);scene.add(light);
const fill=new T.DirectionalLight(0xe5ecff,1.3);fill.position.set(-4,3,3);scene.add(fill);
const loader=new GLTFLoader();
window.preview=async row=>{
 const model=row.group==="weapons"?await loadFalWeapon("/"+row.model,row.id,row.id.startsWith("hunting-bow")?"bow":"staff",1,true):(await loader.loadAsync("/"+row.model)).scene;
 const b=new T.Box3().setFromObject(model,true),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());
 if(!Number.isFinite(size.length())||size.length()<.00001)throw Error("Empty mesh "+row.id);
 const scale=1.54/size.length();
 model.scale.multiplyScalar(scale);model.position.multiplyScalar(scale).sub(center.multiplyScalar(scale));
 model.traverse(x=>{if(x.isMesh)for(const m of [].concat(x.material)){m.metalness=Math.min(.26,m.metalness??0);}});
 const camera=new T.OrthographicCamera(-1,1,1,-1,.01,30);
 camera.position.set(...(row.group==="weapons"?[.32,.30,5]:[3.3,2.7,4.8]));
 camera.lookAt(0,0,0);
 scene.add(model);renderer.render(scene,camera);
 const png=renderer.domElement.toDataURL("image/png").split(",")[1];
 scene.remove(model);
 if(row.group!=="weapons")model.traverse(x=>{if(x.isMesh){x.geometry.dispose();for(const m of [].concat(x.material)){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}}});
 return png;
};
`;
(async()=>{
 const output=path.join(out,"model-renders");fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-gpu-shader-disk-cache"]});
 try{
  const page=await browser.newPage();
  await page.route("https://fal-review.local/**",route=>{
   const pathname=new URL(route.request().url()).pathname;
   if(pathname==="/")return route.fulfill({contentType:"text/html",body:'<!doctype html><script type="module" src="/preview.mjs"></script>'});
   if(pathname==="/preview.mjs")return route.fulfill({contentType:"text/javascript",body:preview});
   return route.fulfill({path:path.join(game,pathname),contentType:pathname.endsWith(".glb")?"model/gltf-binary":"text/javascript"});
  });
  await page.goto("https://fal-review.local/");await page.waitForFunction(()=>typeof window.preview==="function");
  for(const [i,row] of rows.entries()){
   row.preview="model-renders/"+String(i+1).padStart(3,"0")+".png";
   const data=await page.evaluate(row=>window.preview(row),row);
   fs.writeFileSync(path.join(out,row.preview),Buffer.from(data,"base64"));
   if((i+1)%25===0)console.log("Rendered",i+1);
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,"fal-asset-list.json"),JSON.stringify(report,null,2));
 console.log(JSON.stringify({files:rows.length,canonical:tracked.size,retired:old.length,world:world.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
