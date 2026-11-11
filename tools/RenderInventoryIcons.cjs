const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=__dirname,game=path.join(root,"game");
const audit=JSON.parse(fs.readFileSync(path.join(root,"inventory-audit.json"),"utf8"));
const existing=["timber","weapon"].flatMap(kind=>JSON.parse(fs.readFileSync(path.join(game,"assets/item-icons",kind+"-manifest.json"),"utf8")));
const prior=new Map(existing.map(x=>[x.id,x]));
function artKey(id){let hash=2166136261;for(const ch of id)hash=Math.imul(hash^ch.codePointAt(0),16777619);return "item-"+(hash>>>0).toString(16).padStart(8,"0");}
const entries=audit.map(item=>{
 const base=prior.get(item.id);
 const model="assets/crafting-models/"+artKey(item.id)+".glb";
 return {...item,...base,icon:base?.icon??"assets/item-icons/"+artKey(item.id)+".png",
  renderModel:!base&&fs.existsSync(path.join(game,model))?model:null};
});
assert.equal(new Set(entries.map(x=>x.icon)).size,entries.length);
const js=`
import * as T from "/vendor/three/three.module.min.js";
import {GLTFLoader} from "/vendor/three/GLTFLoader.js";
import {drawInventoryItem} from "/illustrations.mjs";
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setSize(256,256);renderer.toneMapping=T.ACESFilmicToneMapping;
const camera=new T.OrthographicCamera(-1,1,1,-1,.01,20);
camera.position.set(3.0,2.3,4.0);camera.lookAt(0,0,0);
const scene=new T.Scene();
scene.add(new T.HemisphereLight(0xfff9ee,0xadb4b5,1.6));
const key=new T.DirectionalLight(0xfff7eb,2.55);key.position.set(3,5,4);scene.add(key);
const fill=new T.DirectionalLight(0xf2f4ff,1.05);fill.position.set(-4,2,2);scene.add(fill);
const loader=new GLTFLoader();
function verify(source,id){
 const ctx=document.createElement("canvas").getContext("2d",{willReadFrequently:true});
 ctx.canvas.width=ctx.canvas.height=256;ctx.drawImage(source,0,0);
 const p=ctx.getImageData(0,0,256,256).data;
 let visible=0;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(p[(y*256+x)*4+3]){
  if(x<8||x>=248||y<8||y>=248)throw Error("Clipping "+id);
  visible++;
 }
 if(visible<280||visible>54000)throw Error("Invalid silhouette "+id+" "+visible);
 return ctx.canvas.toDataURL("image/png").split(",")[1];
}
window.makeIcon=async item=>{
 if(!item.renderModel)return verify(drawInventoryItem(item),item.id);
 const {scene:model}=await loader.loadAsync("/"+item.renderModel);
 const bounds=new T.Box3().setFromObject(model,true),size=bounds.getSize(new T.Vector3());
 const scale=1.51/size.length();
 if(!Number.isFinite(scale))throw Error("Empty model "+item.id);
 model.scale.multiplyScalar(scale);model.position.multiplyScalar(scale).sub(bounds.getCenter(new T.Vector3()).multiplyScalar(scale));
 scene.add(model);renderer.render(scene,camera);
 const result=verify(renderer.domElement,item.id);
 scene.remove(model);
 model.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of [].concat(o.material)){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}}});
 return result;
};
`;
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 const manifest=[];
 const hashes=new Set();
 try{
  const page=await browser.newPage();
  await page.route("https://inventory-art.local/**",route=>{
   const file=new URL(route.request().url()).pathname;
   if(file==="/")return route.fulfill({body:'<!doctype html><script type="module" src="/render.mjs"></script>',contentType:"text/html"});
   if(file==="/render.mjs")return route.fulfill({body:js,contentType:"text/javascript"});
   if(file==="/illustrations.mjs")return route.fulfill({path:path.join(root,"InventoryIllustrations.mjs"),contentType:"text/javascript"});
   return route.fulfill({path:path.join(game,file),contentType:file.endsWith(".glb")?"model/gltf-binary":"text/javascript"});
  });
  await page.goto("https://inventory-art.local/");
  await page.waitForFunction(()=>typeof window.makeIcon==="function");
  for(const item of entries){
   const {id,name,icon,renderModel,model,category}=item;
   const file=path.join(game,icon);
   const data=prior.has(id)?fs.readFileSync(file):Buffer.from(await page.evaluate(x=>window.makeIcon(x),item),"base64");
   assert.equal(data.readUInt32BE(16),256,id);assert.equal(data.readUInt32BE(20),256,id);assert.equal(data[25],6,id);
   const hash=crypto.createHash("sha256").update(data).digest("hex");
   assert.ok(!hashes.has(hash),id);hashes.add(hash);
   if(!prior.has(id))fs.writeFileSync(file,data);
   manifest.push({id,name,category,icon,...(model||renderModel?{model:model??renderModel}:{}),art:prior.has(id)?"previous-render":renderModel?"game-model-render":"original-illustration"});
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(game,"assets/item-icons/manifest.json"),JSON.stringify(manifest,null,2));
 fs.writeFileSync(path.join(game,"InventoryData.js"),"const inventoryEntries="+JSON.stringify(entries.map(({id,name,category,region,form,source,icon})=>({id,name,category,region,form,source,icon})),null,1)+";\n");
 console.log("Verified "+manifest.length+" PNGs, "+manifest.filter(x=>x.art==="game-model-render").length+" newly rendered from models");
})().catch(error=>{console.error(error);process.exitCode=1});
