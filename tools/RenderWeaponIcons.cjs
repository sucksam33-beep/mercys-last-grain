const fs=require("node:fs"), path=require("node:path"), assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const source=process.argv[2], game=path.join(__dirname,"game");
const entries=JSON.parse(fs.readFileSync(path.join(source,"results.json"),"utf8"));
assert.equal(entries.length,54);
assert.equal(new Set(entries.map(e=>e.id)).size,54);
const old=JSON.parse(fs.readFileSync(path.join(game,"WeaponCatalogue.js"),"utf8").replace(/^const weaponCatalogue=/,"").trim().replace(/;$/,""));
const index=fs.readFileSync(path.join(source,"INDEX.md"),"utf8");
for(const entry of entries){
 const {id}=entry;
 const row=index.split("\n").find(line=>line.includes("models/"+id+".glb"));
 assert.ok(row,id);
 const name=row.slice(2).split(" · ")[0];
 entry.name=name;
 assert.match(id,/^(staff|hunting-bow|dagger|axe|harpoon|winter-spear)-\d{2}$/);
 assert.ok(name,id);
 const item=old.find(x=>x.id===id);
 assert.ok(item,id);
 if(item.name!==name) console.log("Manifest name replaces catalogue name",id,item.name,name);
 const buffer=fs.readFileSync(path.join(source,"models",id+".glb"));
 assert.equal(buffer.toString("ascii",0,4),"glTF",id);
 assert.equal(buffer.readUInt32LE(4),2,id);
 assert.equal(buffer.readUInt32LE(8),buffer.length,id);
 const doc=JSON.parse(buffer.toString("utf8",20,20+buffer.readUInt32LE(12)));
 assert.ok(doc.meshes?.length,id);
 assert.ok(![...(doc.buffers??[]),...(doc.images??[])].some(x=>x.uri&&!x.uri.startsWith("data:")),id);
}
const previous=fs.readFileSync(path.join(source,"render-weapons.cjs"),"utf8");
const orientation=previous.slice(previous.indexOf("function orient("),previous.indexOf("window.capture="));
const html='<!doctype html><meta charset="utf-8"><script type="importmap">{"imports":{"three":"/vendor/three/three.module.min.js"}}</script><script type="module" src="/render.mjs"></script>';
const script=`
import * as T from "three";
import {GLTFLoader} from "/vendor/three/GLTFLoader.js";
import { prepareFalWeapon, bambooBowString } from "/fal-weapon-cleanup.mjs";
${orientation}
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setSize(256,256);
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.22;
const scene=new T.Scene();
scene.add(new T.HemisphereLight(0xfffbf2,0xb1b5bf,2.0));
const key=new T.DirectionalLight(0xfffaf5,2.6);
key.position.set(3,4,5);scene.add(key);
const fill=new T.DirectionalLight(0xffffff,1.1);
fill.position.set(-4,2,2);scene.add(fill);
const camera=new T.OrthographicCamera(-1,1,1,-1,.01,20);
camera.position.set(.22,.18,5);camera.lookAt(0,0,0);
const loader=new GLTFLoader();
window.capture=async id=>{
 const {scene:raw}=await loader.loadAsync("/models/"+id+".glb");
 const model=prepareFalWeapon(raw,id);
 if(model.userData.restoredBamboo){bambooBowString(model);model.rotateZ(-.42);}
 else orient(model,id);
 const bounds=new T.Box3().setFromObject(model,true);
 const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 if(!Number.isFinite(size.length())||size.length()<1e-5)throw Error("Empty model "+id);
 const scale=1.63/Math.max(size.x,size.y,size.z);
 model.scale.multiplyScalar(scale);model.position.multiplyScalar(scale).sub(center.multiplyScalar(scale));
 const turntable=new T.Group();turntable.add(model);scene.add(turntable);
 function view(angle){
  turntable.rotation.y=angle;
  renderer.render(scene,camera);
  const probe=document.createElement("canvas");
  probe.width=probe.height=256;
  const ctx=probe.getContext("2d");ctx.drawImage(renderer.domElement,0,0);
  const pixels=ctx.getImageData(0,0,256,256).data;
  let opaque=0,brightness=0;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const pixel=(y*256+x)*4;
   if(!pixels[pixel+3])continue;
   opaque++;
   brightness+=pixels[pixel]*.21+pixels[pixel+1]*.72+pixels[pixel+2]*.07;
   if(x<8||y<8||x>=248||y>=248)throw Error("Clipped "+id);
  }
  if(opaque<350||opaque>55000)throw Error("Unexpected silhouette "+id);
  return {score:brightness/opaque,png:renderer.domElement.toDataURL("image/png")};
 }
 const front=view(0),back=view(Math.PI);
 const png=back.score>front.score*1.06?back.png:front.png;
 scene.remove(turntable);
 model.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of [].concat(o.material)){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}}});
 return png;
};
`;
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 try{
  const page=await browser.newPage();
  page.on("pageerror",e=>console.error(e));
  await page.route("https://weapon-icons.local/**",route=>{
   const pathname=new URL(route.request().url()).pathname;
   if(pathname==="/")return route.fulfill({contentType:"text/html",body:html});
   if(pathname==="/render.mjs")return route.fulfill({contentType:"text/javascript",body:script});
   const model=pathname.startsWith("/models/");
   return route.fulfill({path:path.join(model?source:game,pathname),contentType:model?"model/gltf-binary":"text/javascript"});
  });
  await page.goto("https://weapon-icons.local/");
  await page.waitForFunction(()=>typeof window.capture==="function");
  const staging=path.join(__dirname,"weapon-icon-staging");
  fs.mkdirSync(staging,{recursive:true});
  const hashes=new Set();
  for(const {id} of entries){
   const png=Buffer.from((await page.evaluate(id=>window.capture(id),id)).split(",")[1],"base64");
   assert.equal(png[25],6,id);
   const hash=require("node:crypto").createHash("sha256").update(png).digest("hex");
   assert.ok(!hashes.has(hash),id);hashes.add(hash);
   fs.writeFileSync(path.join(staging,id+".png"),png);
   console.log(id);
  }
  for(const dir of ["item-icons","weapon-models"])fs.mkdirSync(path.join(game,"assets",dir),{recursive:true});
  for(const {id} of entries){
   fs.copyFileSync(path.join(staging,id+".png"),path.join(game,"assets","item-icons",id+".png"));
   fs.copyFileSync(path.join(source,"models",id+".glb"),path.join(game,"assets","weapon-models",id+".glb"));
  }
  fs.writeFileSync(path.join(game,"assets","item-icons","weapon-manifest.json"),JSON.stringify(entries.map(({id,name})=>({id,name,icon:"assets/item-icons/"+id+".png",model:"assets/weapon-models/"+id+".glb"})),null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
