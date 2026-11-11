const fs=require("node:fs"),path=require("node:path");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game"),out=path.join(__dirname,"regalia-ornament-review");fs.mkdirSync(out,{recursive:true});
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
const mesh=actor.model.getObjectByName("char1"),compiled=mesh.material.onBeforeCompile;
let uniforms;
mesh.material.onBeforeCompile=function(shader,renderer){compiled.call(this,shader,renderer);uniforms=shader.uniforms;};
window.capture=async ({phase,tier=0,speed=0,frame=0,angle=.22,focus=null,hat=false})=>{
 const gearInput=tier?{coatTier:tier}:null;
 if(hat)gearInput.head=["암바로 썰물 모자",6,3,"","/assets/priority-models/150.glb"];
 actor.place([0,0,0],0,0,0,false);
 if(hat){
  for(let tick=0;tick<120;tick++){
   gear.update(gearInput,null);
   if(actor.root.getObjectByName("wardrobe-150")?.visible)break;
   await new Promise(r=>setTimeout(r,25));
  }
  if(!actor.root.getObjectByName("wardrobe-150")?.visible)throw Error("Hat not equipped");
 }
 if(speed){
  actor.place([0,0,0],0,0,.016,true);
  for(let i=1;i<=frame;i++){actor.place([0,0,i*speed*.033],0,speed,.033,true);actor.groundFeet(()=>0);}
 }
 gear.update(gearInput,null);actor.root.updateMatrixWorld(true);
 const center=focus==="hat"?2.14:focus==="upper"?1.64:focus==="lower"?.59:1.24;
 const distance=focus==="hat"?2.12:focus==="upper"?3.17:focus==="lower"?2.86:5.47;
 camera.position.set(Math.sin(angle)*distance,center+.10,actor.root.position.z+Math.cos(angle)*distance);
 camera.lookAt(0,center,actor.root.position.z);
 renderer.render(scene,camera);
 if(phase==="before")return null;
 const state=uniforms?.tailorState?.value;
 const panels=mesh.getObjectByName("tailored-garment-panels");
 if(!state||state.z!==tier||state.x!==tier+5||panels?.skeleton!==mesh.skeleton)throw Error("Missing rank "+tier);
 const v=new T.Vector3();
 let samples=0;
 for(let i=0;i<mesh.geometry.attributes.position.count;i+=27){
  mesh.getVertexPosition(i,v);
  if(!Number.isFinite(v.lengthSq()))throw Error("Invalid pose");
  samples++;
 }
 const ornaments=actor.root.getObjectByName("coat-ornaments");
 const visible=ornaments.visible?ornaments.children.filter(x=>x.visible&&x.children.some(g=>g.visible)).map(x=>x.name):[];
 if(visible.length!==(tier>=3?7:0))throw Error("Missing mounted ornaments "+JSON.stringify(visible));
 return {visible,tier,state:state.toArray(),nativeVertices:mesh.geometry.attributes.position.count,samples};
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
  if(phase==="before"&&url.pathname==="/fitted-outfits.mjs")return route.fulfill({contentType:"text/javascript",path:path.join(out,path.basename(file).replace(".mjs","-before.mjs"))});
  if(url.pathname==="/rigged-scene.mjs")return route.fulfill({contentType:"text/javascript",body:fs.readFileSync(file,"utf8")+"\nexport {loadCharacter};"});
  return route.fulfill({path:file,contentType:/\.m?js$/.test(file)?"text/javascript":undefined});
 });
 await page.goto("https://outfit.local/");await page.waitForFunction(()=>window.capture);
 const report=[];
 const cases=[];
 for(let tier=1;tier<=5;tier++){
  cases.push({label:"tier-"+tier,tier,angle:.25},{label:"upper-"+tier,tier,angle:.25,focus:"upper"},{label:"lower-"+tier,tier,angle:.30,focus:"lower"});
  if(tier>=3)cases.push({label:"run-"+tier,tier,speed:8.2,frame:26,angle:.56});
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
