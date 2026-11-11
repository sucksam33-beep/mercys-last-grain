const fs=require("node:fs"),path=require("node:path");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game"),out=path.join(__dirname,"outfit-dye-review");fs.mkdirSync(out,{recursive:true});
const source=String.raw`
import * as T from "/vendor/three/three.module.min.js";
import {GLTFLoader} from "/vendor/three/GLTFLoader.js";
import {loadCharacter} from "/rigged-scene.mjs";
import {createCraftGear} from "/craft-gear.mjs";
const loader=new GLTFLoader(),scene=new T.Scene();
scene.background=new T.Color("#343a37");
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(420,480);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
document.body.style.margin=0;document.body.append(renderer.domElement);
scene.add(new T.HemisphereLight(0xfff6e7,0xa6a9b0,2.45));
for(const [position,power] of [[[3,5,4],2.5],[[-4,3,-3],1.8]]){
 const light=new T.DirectionalLight(0xfff1dc,power);light.position.set(...position);scene.add(light);
}
const actor=await loadCharacter("/assets/prince.glb",2.44,"/assets/prince-walk.glb","/assets/prince-run.glb");
scene.add(actor.root);
const gear=createCraftGear(actor);
const camera=new T.PerspectiveCamera(29,420/480,.01,100);
const slots=[["아사기 논둑 작업복","torso",0],["브뤼넨 운하 장화","feet",1],["산타 루시아 모래바람 두건","head",2],["주니퍼웰 숲길 외투","torso",3],["비버턴 철도 작업 조끼","torso",4],["생오렐 나룻배 망토","torso",5],["암바로 썰물 모자","head",6],["카루크 눈길 외투","torso",7]];
window.inspect=async()=>{
 actor.place([0,0,0],0,0,0,false);
 const pos=b=>actor.root.worldToLocal(b.getWorldPosition(new T.Vector3())).toArray().map(v=>+v.toFixed(3));
 const body=[];
 actor.model.traverse(x=>{if(x.isSkinnedMesh)body.push([x.name,x.geometry.attributes.position.count,new T.Box3().setFromObject(x,true).getSize(new T.Vector3()).toArray()]);});
 const clothes=[];
 for(let i=144;i<=151;i++){
  const model=(await loader.loadAsync("/assets/priority-models/"+i+".glb")).scene;
  const bounds=new T.Box3().setFromObject(model,true);
  clothes.push([i,bounds.min.toArray(),bounds.max.toArray()]);
 }
 return {forward:actor.forward,arms:actor.arms.map(a=>a.map(pos)),hips:pos(actor.hips),spine:pos(actor.spine),neck:pos(actor.neck),head:pos(actor.head),legs:actor.legs.map(l=>l.chain.map(pos)),body,clothes};
};
window.shot=async(i,after,angle=0.20,walking=false)=>{
 const [id,slot,region]=slots[i];
 const item={[slot]:[id,region,3,"",after?"/assets/priority-models/"+(144+i)+".glb":undefined]};
 actor.place([0,0,0],0,0,0,false);
 gear.update(item,null);
 if(after&&i===6){
  for(let tick=0;tick<80&&!actor.root.getObjectByName("fitted-hat");tick++)await new Promise(r=>setTimeout(r,25));
 }
 if(walking){
  actor.place([0,0,0],0,0,.016,true);
  for(let tick=1;tick<=10;tick++)actor.place([0,0,tick*.09],0,3,.045,true);
 }
 gear.update(item,null);
 const center=slot==="head"?2.08:slot==="feet"?.40:1.48,distance=slot==="head"?2.18:slot==="feet"?2.34:3.1;
 camera.position.set(Math.sin(angle)*distance,center+(slot==="feet"?.22:.05),actor.root.position.z+Math.cos(angle)*distance);
 camera.lookAt(0,center,actor.root.position.z);
 renderer.render(scene,camera);
 const fitted=actor.root.getObjectByName("fitted-outfit");
 return {loaded:i!==6||!!actor.root.getObjectByName("fitted-hat"),skinned:!fitted};
};
window.combo=async(after)=>{
 const item=Object.fromEntries([0,1,6].map(i=>{
  const [id,slot,region]=slots[i];
  return [slot,[id,region,3,"",after?"/assets/priority-models/"+(144+i)+".glb":undefined]];
 }));
 actor.place([0,0,0],0,0,0,false);
 gear.update(item,null);
 if(after){
  for(let tick=0;tick<80&&!actor.root.getObjectByName("fitted-hat");tick++)await new Promise(r=>setTimeout(r,25));
 }
 gear.update(item,null);
 camera.position.set(1.27,1.4,5.45);camera.lookAt(0,1.24,0);
 renderer.render(scene,camera);
};

`;
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 try{
 const page=await browser.newPage({viewport:{width:420,height:480}});
 const errors=[];page.on("pageerror",error=>errors.push(String(error)));
 page.on("console",event=>{if(event.type()==="error"&&event.text().includes("Shader Error"))errors.push(event.text());});
 await page.route("https://outfit.local/**",route=>{
  const url=new URL(route.request().url());
  if(url.pathname==="/")return route.fulfill({contentType:"text/html",body:'<!doctype html><script type="module" src="/review.mjs"></script>'});
  if(url.pathname==="/review.mjs")return route.fulfill({contentType:"text/javascript",body:source});
  const file=path.join(root,decodeURIComponent(url.pathname));
  if(url.pathname==="/rigged-scene.mjs")return route.fulfill({contentType:"text/javascript",body:fs.readFileSync(file,"utf8")+"\nexport {loadCharacter};"});
  return route.fulfill({path:file,contentType:/\.m?js$/.test(file)?"text/javascript":undefined});
 });
 await page.goto("https://outfit.local/");await page.waitForFunction(()=>window.inspect);
 if(process.argv.includes("inspect"))console.log(JSON.stringify(await page.evaluate(()=>window.inspect()),null,2));
 const phase=process.argv.includes("after")?"after":"before";
 for(let i=0;i<8;i++){
  const result=await page.evaluate(({i,phase})=>window.shot(i,phase==="after"),{i,phase});
  if(phase==="after"&&(!result.loaded||!result.skinned))throw Error("Outfit did not bind: "+i);
  await page.screenshot({path:path.join(out,phase+"-"+(144+i)+".png")});
 }
 await page.evaluate(phase=>window.combo(phase==="after"),phase);
 await page.screenshot({path:path.join(out,"combo-"+phase+".png")});
 if(phase==="after"){
  for(const i of [0,1,7]){
   await page.evaluate(i=>window.shot(i,true,-.65,true),i);
   await page.screenshot({path:path.join(out,"walking-"+(144+i)+".png")});
  }
 }
 if(errors.length)throw Error(errors.join("\n"));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
