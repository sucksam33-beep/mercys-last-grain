const fs=require("node:fs"),path=require("node:path");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game"),out=path.join(__dirname,"wardrobe-review");fs.mkdirSync(out,{recursive:true});
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
 actor.root.updateMatrixWorld(true);
 const inverse=actor.root.matrixWorld.clone().invert(),v=new T.Vector3();
 const local=b=>b.getWorldPosition(new T.Vector3()).applyMatrix4(inverse).toArray();
 const bones=actor.bones.map(b=>({name:b.name,xyz:local(b),parent:b.parent?.isBone?b.parent.name:null}));
 const mesh=actor.model.getObjectByName("char1");
 const joints=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight;
 const samples=[];
 for(let i=0;i<joints.count;i+=4){
  mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);
  let best=0;for(let j=1;j<4;j++)if(weights.getComponent(i,j)>weights.getComponent(i,best))best=j;
  samples.push([...v.toArray(),mesh.skeleton.bones[joints.getComponent(i,best)].name]);
 }
 const neutral=new Float32Array(joints.count*3);
 for(let i=0;i<joints.count;i++)mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse).toArray(neutral,i*3);
 const bytes=new Uint8Array(neutral.buffer);
 let packed="";
 for(let i=0;i<bytes.length;i+=16384)packed+=String.fromCharCode(...bytes.subarray(i,i+16384));
 return {bones,samples,forward:actor.forward,neutral:btoa(packed)};
};
async function dress(ids,phase){
 const item=Object.fromEntries(ids.map(i=>{
  const [id,slot,region]=slots[i];
  return [slot,[id,region,3,"","/assets/priority-models/"+(144+i)+".glb"]];
 }));
 actor.place([0,0,0],0,0,0,false);
 const expected=ids.map(i=>phase==="after"?"wardrobe-"+(144+i):i===0||i===5?"wearable-torso-"+(144+i):i===6?"fitted-hat":null).filter(Boolean);
 for(let tick=0;tick<125;tick++){
  gear.update(item,null);
  if(expected.every(key=>actor.root.getObjectByName(key)?.visible))return item;
  await new Promise(r=>setTimeout(r,24));
 }
 throw Error("Outfit load timed out "+expected.join(", "));
}
window.shot=async(i,phase,speed=0,frame=0,angle=.2,full=false)=>{
 const ids=Array.isArray(i)?i:i===8?[0,1,6]:[i],item=await dress(ids,phase);
 if(speed){
  actor.place([0,0,0],0,0,.016,true);
  for(let tick=1;tick<=frame;tick++){actor.place([0,0,tick*speed*.033],0,speed,.033,true);actor.groundFeet(()=>0);}
 }
 gear.update(item,null);actor.root.updateMatrixWorld(true);
 const slot=Array.isArray(i)||i===8?"combo":slots[i][1];
 const center=full||i===8?1.24:slot==="head"?2.08:slot==="feet"?.40:1.48;
 const distance=full||i===8?5.55:slot==="head"?2.18:slot==="feet"?2.34:3.2;
 camera.position.set(Math.sin(angle)*distance,center+(slot==="feet"?.22:.05),actor.root.position.z+Math.cos(angle)*distance);
 camera.lookAt(0,center,actor.root.position.z);
 renderer.render(scene,camera);
 let samples=0;
 if(phase==="after")for(const id of ids){
  const mesh=actor.root.getObjectByName("wardrobe-"+(144+id));
  if(!mesh?.visible||!mesh.isSkinnedMesh||!mesh.skeleton.bones.includes(actor.head))throw Error("Missing bound wardrobe");
  const v=new T.Vector3();
  for(let k=0;k<mesh.geometry.attributes.position.count;k+=17){
   mesh.getVertexPosition(k,v);
   if(!Number.isFinite(v.lengthSq())||v.lengthSq()>30)throw Error("Invalid skinned vertex");
   samples++;
  }
 }
 return {samples};
};

`;
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 try{
 const phase=process.argv.includes("after")?"after":"before";
 const page=await browser.newPage({viewport:{width:420,height:480}});
 const errors=[];page.on("pageerror",error=>errors.push(String(error)));
 page.on("console",event=>{if(event.type()==="error"&&event.text().includes("Shader Error"))errors.push(event.text());});
 await page.route("https://outfit.local/**",route=>{
  const url=new URL(route.request().url());
  if(url.pathname==="/")return route.fulfill({contentType:"text/html",body:'<!doctype html><script type="module" src="/review.mjs"></script>'});
  if(url.pathname==="/review.mjs")return route.fulfill({contentType:"text/javascript",body:source});
  const file=path.join(root,decodeURIComponent(url.pathname));
  if(phase==="before"&&["/fitted-outfits.mjs","/wearable-torsos.mjs"].includes(url.pathname))return route.fulfill({contentType:"text/javascript",path:path.join(out,path.basename(file).replace(".mjs","-before.mjs"))});
  if(url.pathname==="/rigged-scene.mjs")return route.fulfill({contentType:"text/javascript",body:fs.readFileSync(file,"utf8")+"\nexport {loadCharacter};"});
  return route.fulfill({path:file,contentType:/\.m?js$/.test(file)?"text/javascript":undefined});
 });
 await page.goto("https://outfit.local/");await page.waitForFunction(()=>window.inspect);
 if(process.argv.includes("calibrate")){const {neutral,...calibration}=await page.evaluate(()=>window.inspect());fs.writeFileSync(path.join(out,"calibration.json"),JSON.stringify(calibration));fs.writeFileSync(path.join(out,"player-neutral.f32"),Buffer.from(neutral,"base64"));return;}
 if(process.argv.includes("combos")){
  const report=[];
  for(const torso of [0,3,4,5,7])for(const head of [2,6])for(const [speed,frame] of [[3,9],[8.2,14]]){
   const ids=[torso,1,head],angle=frame===14?-.75:.42;
   const result=await page.evaluate(({ids,speed,frame,angle})=>window.shot(ids,"after",speed,frame,angle,true),{ids,speed,frame,angle});
   const file="combo-"+(144+torso)+"-"+(144+head)+"-"+frame+".png";
   await page.screenshot({path:path.join(out,file)});
   report.push({ids:ids.map(i=>144+i),speed,frame,file,skinSamples:result.samples});
  }
  if(errors.length)throw Error(errors.join("\n"));
  fs.writeFileSync(path.join(out,"combination-audit.json"),JSON.stringify(report,null,2));
  console.log("Verified",report.length,"combined walk and run frames");
  return;
 }
 const report=[];
 for(let i=0;i<9;i++){
  await page.evaluate(({i,phase})=>window.shot(i,phase,0,0,.20,i===8),{i,phase});
  await page.screenshot({path:path.join(out,i===8?"combo-"+phase+".png":phase+"-"+(144+i)+".png")});
 }
 if(phase==="after"){
  for(let i=0;i<8;i++)for(const speed of [3.0,8.2])for(const frame of [5,9,14,19]){
   const angle=frame===19?2.54:frame===14?-.83:.56;
   const result=await page.evaluate(({i,speed,frame,angle})=>window.shot(i,"after",speed,frame,angle,true),{i,speed,frame,angle});
   const file=(speed<5?"walk":"run")+"-"+(144+i)+"-"+frame+".png";
   await page.screenshot({path:path.join(out,file)});
   report.push({item:144+i,speed,frame,angle,file,skinSamples:result.samples});
  }
  fs.writeFileSync(path.join(out,"motion-audit.json"),JSON.stringify(report,null,2));
 }
 if(errors.length)throw Error(errors.join("\n"));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
