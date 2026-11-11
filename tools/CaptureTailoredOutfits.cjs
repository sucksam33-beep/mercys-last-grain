const fs=require("node:fs"),path=require("node:path");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game"),out=path.join(__dirname,"tailored-review");fs.mkdirSync(out,{recursive:true});
const source=String.raw`
import * as T from "/vendor/three/three.module.min.js";
import {GLTFLoader} from "/vendor/three/GLTFLoader.js";
import {loadCharacter} from "/rigged-scene.mjs";
import {createCraftGear} from "/craft-gear.mjs";
const loader=new GLTFLoader(),scene=new T.Scene();
scene.background=new T.Color("#343a37");
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(600,680);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
document.body.style.margin=0;document.body.append(renderer.domElement);
scene.add(new T.HemisphereLight(0xfff6e7,0xa6a9b0,2.45));
for(const [position,power] of [[[3,5,4],2.5],[[-4,3,-3],1.8]]){
 const light=new T.DirectionalLight(0xfff1dc,power);light.position.set(...position);scene.add(light);
}
const actor=await loadCharacter("/assets/prince.glb",2.44,"/assets/prince-walk.glb","/assets/prince-run.glb");
scene.add(actor.root);
const gear=createCraftGear(actor);
const camera=new T.PerspectiveCamera(29,600/680,.01,100);
const names=[
 ["아사기 논둑 작업복","torso",0],["브뤼넨 운하 장화","feet",1],["산타 루시아 모래바람 두건","head",2],
 ["주니퍼웰 숲길 외투","torso",3],["비버턴 철도 작업 조끼","torso",4],["생오렐 나룻배 망토","torso",5],
 ["암바로 썰물 모자","head",6],["카루크 눈길 외투","torso",7]];
const mesh=actor.model.getObjectByName("char1"),compiled=mesh.material.onBeforeCompile;
let uniforms;
mesh.material.onBeforeCompile=function(shader,renderer){compiled.call(this,shader,renderer);uniforms=shader.uniforms;};
window.capture=async ({phase,item=-1,speed=0,frame=0,angle=.22,zoom=false,focus=null})=>{
 const ids=item===8?[0,1,6]:item<0?[]:[item];
 const entries=Object.fromEntries(ids.map(i=>{const [id,slot,region]=names[i];return [slot,[id,region,3,"","/assets/priority-models/"+(144+i)+".glb"]];}));
 const gearInput=ids.length?entries:null;
 actor.place([0,0,0],0,0,0,false);
 const expected=phase==="after"?ids.filter(i=>i===2||i===6).map(i=>"wardrobe-"+(144+i)):
  ids.length?ids.map(i=>"wardrobe-"+(144+i)):["default-top","default-pants","default-shoes"];
 for(let i=0;i<130;i++){
  gear.update(gearInput,null);
  if(expected.every(name=>actor.root.getObjectByName(name)?.visible))break;
  await new Promise(r=>setTimeout(r,25));
 }
 if(speed){
  actor.place([0,0,0],0,0,.016,true);
  for(let i=1;i<=frame;i++){actor.place([0,0,i*speed*.033],0,speed,.033,true);actor.groundFeet(()=>0);}
 }
 gear.update(gearInput,null);actor.root.updateMatrixWorld(true);
 if(!expected.every(name=>actor.root.getObjectByName(name)?.visible))throw Error("Missing wardrobe "+expected);
 const center=zoom?(item===1?.36:item===2||item===6?2.12:1.59):1.24;
 const distance=zoom?(item===1?2.30:item===2||item===6?2.08:3.29):5.47;
 camera.position.set(Math.sin(angle)*distance,center+.10,actor.root.position.z+Math.cos(angle)*distance);
 camera.lookAt(0,center,actor.root.position.z);
 if(focus){
  const anchor=focus==="wrist"?actor.arms[1][2]:focus==="ankle"?actor.legs[0].chain[2]:actor.head;
  const point=anchor.getWorldPosition(new T.Vector3());
  point.y+=focus==="wrist"?.055:focus==="ankle"?.035:.14;
  const dist=focus==="neck"?1.75:1.45;
  camera.position.set(point.x+dist*Math.sin(angle),point.y+.12,point.z+dist*Math.cos(angle));
  camera.lookAt(point);
 }
 renderer.render(scene,camera);
 if(phase==="before")return null;
 const chosen=ids.find(i=>names[i][1]==="torso");
 const state=uniforms?.tailorState?.value;
 const wanted={0:1,3:2,4:3,5:4,7:5}[chosen]??0;
 if(!state||state.x!==wanted||state.y!==Number(ids.includes(1)))throw Error("Incorrect tailored material state");
 const panels=mesh.getObjectByName("tailored-garment-panels");
 if(!panels?.isSkinnedMesh||panels.skeleton!==mesh.skeleton||
  panels.geometry.attributes.position!==mesh.geometry.attributes.position||
  panels.geometry.attributes.skinWeight!==mesh.geometry.attributes.skinWeight)throw Error("Layer bind mismatch");
 if(["default-top","default-pants","default-shoes","wardrobe-base","wardrobe-144","wardrobe-145","wardrobe-147","wardrobe-148","wardrobe-149","wardrobe-151"].some(name=>actor.root.getObjectByName(name)?.visible))throw Error("Old shell still visible");
 let samples=0;const p=new T.Vector3();
 for(let i=0;i<mesh.geometry.attributes.position.count;i+=29){
  mesh.getVertexPosition(i,p);
  if(!Number.isFinite(p.lengthSq()))throw Error("Bad skinned vertex");
  samples++;
 }
 return {style:wanted,boots:Boolean(state.y),nativeVertexCount:mesh.geometry.attributes.position.count,samples};
};

`;
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 try{
 const phase=process.argv.includes("after")?"after":"before";
 const page=await browser.newPage({viewport:{width:600,height:680}});
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
 await page.goto("https://outfit.local/");await page.waitForFunction(()=>window.capture);
 const report=[];
 const cases=[];
 for(let item=-1;item<=8;item++){
  cases.push({label:"fit-"+item,item,zoom:item>=0&&item<8,angle:.21});
  if(item===-1||item===8)cases.push({label:"rear-"+item,item,angle:2.77});
  if(phase==="after"){
   for(const [mode,speed] of [["walk",3],["run",8.2]])for(const [frame,angle] of [[6,.45],[11,-.77],[20,2.59],[26,.56]]){
    cases.push({label:mode+"-"+item+"-"+frame,item,speed,frame,angle});
   }
  }
 }
 if(phase==="after"){
  for(const [focus,item,speed,frame,angle] of [["wrist",-1,8.2,20,2.59],["wrist",8,8.2,11,-.77],["ankle",-1,3,20,2.59],["ankle",8,8.2,26,.56],["neck",2,3,11,-.77]]){
   cases.push({label:"detail-"+focus+"-"+item,item,speed,frame,angle,focus});
  }
 }
 for(const item of cases){
  const samples=await page.evaluate(data=>window.capture(data),{...item,phase});
  const file=phase+"-"+item.label+".png";
  await page.screenshot({path:path.join(out,file)});
  report.push({...item,file,samples});
 }
 fs.writeFileSync(path.join(out,phase+"-motion.json"),JSON.stringify(report,null,2));
 if(errors.length)throw Error(errors.join("\n"));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1;});
