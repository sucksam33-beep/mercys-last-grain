const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=__dirname,game=path.join(root,"game"),out=path.join(root,"mercy-new-model-references");
const prior=JSON.parse(fs.readFileSync(path.join(root,"model-reference-audit","item-model-audit.json"),"utf8"));
const items=prior.filter(row=>row.status==="no_model_match_in_audited_sources"&&!row.id.startsWith("dish-"));
assert.equal(items.length,185);
const art=fs.readFileSync(path.join(root,"InventoryIllustrations.mjs"),"utf8");
const profiles=vm.runInNewContext(art.slice(art.indexOf("const fishProfiles="),art.indexOf("function fish("))+"\n({fishProfiles,localFishProfiles})");
const fishProfiles={};
for(const {name,category} of items){
 if(category!==5&&name!=="치어")continue;
 const match=profiles.fishProfiles.find(([pattern])=>pattern.test(name));
 const [depth,tint,family,pattern]=profiles.localFishProfiles.get(name)??match?.slice(1)??[.46,"#718b75","minnow","line"];
 fishProfiles[name]=[family,depth,tint,pattern];
}
Object.assign(fishProfiles,{
 "눈 밑의 은등":["salmon",.57,"#a3b2b3","marble"],"종탑 아래의 파이크":["pike",.50,"#788759","spots"],
 "절벽의 붉은 송어":["salmon",.60,"#aa7258","spots"],"빙하 밑의 흰넙치":["flat",1.03,"#b9b6a4","marble"],
 "푸른돛 다랑어":["tuna",.72,"#587f9f","line"],"제방의 검은 민어":["spiny",.68,"#52635d","dark-line"],
 "구리등 메기":["cat",.68,"#9b7351","marble"],"치어":["small",.36,"#95a49e","line"],
 "피라미":["minnow",.39,"#718f8b","line"],"미꾸라지":["eel",.31,"#968459","spots"],
 "브림":["carp",1.03,"#878d85","scales"],"빙어":["small",.31,"#aab8aa","line"],"토끼고기":["spiny",.80,"#788856","spots"]
});
const client=`
import * as T from "/vendor/three/three.module.min.js";
import {makeReference} from "/geometry.mjs";
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:true});
renderer.setSize(720,720);renderer.setClearColor(0,0);
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;
const scene=new T.Scene();
scene.add(new T.HemisphereLight(0xfffcf7,0xd8c8b5,1.80));
const key=new T.DirectionalLight(0xfff7e7,2.48);key.position.set(-2,4,5);scene.add(key);
const fill=new T.DirectionalLight(0xf4f7ff,1.15);fill.position.set(4,2,-2);scene.add(fill);
const camera=new T.OrthographicCamera(-1,1,1,-1,.01,30);
const output=document.createElement("canvas");output.width=output.height=720;
const ctx=output.getContext("2d",{willReadFrequently:true});
function render(model,points,ray,item){
 camera.position.set(...ray);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
 const bounds=new T.Box2();
 for(const corner of points){
  const q=corner.clone().applyMatrix4(camera.matrixWorldInverse);
  bounds.expandByPoint(new T.Vector2(q.x,q.y));
 }
 const center=bounds.getCenter(new T.Vector2()),half=Math.max(...bounds.getSize(new T.Vector2()).toArray())*.60;
 camera.left=center.x-half;camera.right=center.x+half;camera.top=center.y+half;camera.bottom=center.y-half;
 camera.updateProjectionMatrix();renderer.render(scene,camera);
 ctx.clearRect(0,0,720,720);ctx.drawImage(renderer.domElement,0,0);
 const data=ctx.getImageData(0,0,720,720).data;
 let active=0;
 for(let y=0;y<720;y+=2)for(let x=0;x<720;x+=2)if(data[(y*720+x)*4+3]){
  if(x<22||x>698||y<22||y>698)throw Error("Frame clips "+item.name);
  active++;
 }
 if(active<400)throw Error("No clear silhouette "+item.name);
 ctx.globalCompositeOperation="destination-over";
 const gradient=ctx.createLinearGradient(0,0,0,720);gradient.addColorStop(0,"#eeebe4");gradient.addColorStop(1,"#d6d0c5");
 ctx.fillStyle=gradient;ctx.fillRect(0,0,720,720);ctx.globalCompositeOperation="source-over";
 return output.toDataURL("image/png").split(",")[1];
}
window.generate=({item,profiles,serial})=>{
 const original=makeReference(item,profiles),group=new T.Group();
 const shapeVariation=1+((serial%29)-14)*.0025;
 original.scale.set(shapeVariation,1/shapeVariation,1+((serial%19)-9)*.007);
 group.add(original);scene.add(group);
 const box=new T.Box3().setFromObject(group,true);
 original.position.sub(box.getCenter(new T.Vector3()));
 const fit=new T.Box3().setFromObject(group,true),points=[];
 for(const x of [fit.min.x,fit.max.x])for(const y of [fit.min.y,fit.max.y])for(const z of [fit.min.z,fit.max.z])points.push(new T.Vector3(x,y,z));
 const side=item.category===5||item.name==="치어";
 const laidFlat=/가죽|넙치/.test(item.name)&&item.category<2||/넙치/.test(item.name);
 const primary=laidFlat?[.45,5.0,2.3]:side?[.19,.63,5.4]:[2.8,2.1,4.6];
 const secondary=laidFlat?[-3.8,2.2,3.4]:side?[2.7,3.6,3.5]:[-3.6,3.1,-2.9];
 const images=[render(group,points,primary,item),render(group,points,secondary,item)];
 scene.remove(group);
 group.traverse(node=>{if(node.isMesh){node.geometry.dispose();node.material.dispose();}});
 return images;
};
`;
(async()=>{
 const target=path.join(out,"items");
 fs.mkdirSync(target,{recursive:true});
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-gpu-shader-disk-cache"]});
 const manifest=[],hashes=new Set();
 try{
  const page=await browser.newPage();
  page.on("pageerror",error=>console.error(error.message));
  await page.route("https://new-model-refs.local/**",route=>{
   const url=new URL(route.request().url()).pathname;
   if(url==="/")return route.fulfill({body:'<!doctype html><script type="module" src="/render.mjs"></script>',contentType:"text/html"});
   if(url==="/render.mjs")return route.fulfill({body:client,contentType:"text/javascript"});
   if(url==="/geometry.mjs")return route.fulfill({path:path.join(root,"ModelReferenceGeometry.mjs"),contentType:"text/javascript"});
   return route.fulfill({path:path.join(game,url),contentType:"text/javascript"});
  });
  await page.goto("https://new-model-refs.local/");
  await page.waitForFunction(()=>typeof window.generate==="function");
  for(const [serial,item] of items.entries()){
   const slug=path.basename(item.icon,".png");
   const files=[slug+".png",slug+"-alternate.png"];
   const result=await page.evaluate(args=>window.generate(args),{item,profiles:fishProfiles,serial});
   for(let i=0;i<2;i++){
    const png=Buffer.from(result[i],"base64");
    assert.equal(png.readUInt32BE(16),720,item.name);
    assert.equal(png.readUInt32BE(20),720,item.name);
    const hash=crypto.createHash("sha256").update(png).digest("hex");
    assert.ok(!hashes.has(hash),"Duplicate image "+item.name);
    hashes.add(hash);
    fs.writeFileSync(path.join(target,files[i]),png);
   }
   manifest.push({id:item.id,name:item.name,category:item.category,region:item.region,reference:"items/"+files[0],alternate:"items/"+files[1]});
   if((serial+1)%20===0)console.log("Rendered",serial+1);
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,"manifest.json"),JSON.stringify(manifest,null,2));
 console.log("Finished",manifest.length,"items",hashes.size,"unique PNGs");
})().catch(error=>{console.error(error);process.exitCode=1});
