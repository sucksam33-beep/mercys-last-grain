const fs=require("node:fs"),path=require("node:path");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"game"),out=path.join(__dirname,"default-outfit-review");fs.mkdirSync(out,{recursive:true});
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
const names=["default-top","default-pants","default-shoes"];
window.capture=async ({phase,speed=0,frame=0,angle=.23,variant=false})=>{
 const item=variant?{torso:["아사기 논둑 작업복",0,3,"","/assets/priority-models/144.glb"],feet:["브뤼넨 운하 장화",1,3,"","/assets/priority-models/145.glb"]}:null;
 const expected=variant?["wardrobe-144","wardrobe-base","wardrobe-145"]:names;
 actor.place([0,0,0],0,0,0,false);
 for(let i=0;i<120;i++){
  gear.update(item,null);
  if(phase==="before"||expected.every(name=>actor.root.getObjectByName(name)?.visible))break;
  await new Promise(r=>setTimeout(r,25));
 }
 if(speed){
  actor.place([0,0,0],0,0,.016,true);
  for(let i=1;i<=frame;i++){
   actor.place([0,0,i*speed*.033],0,speed,.033,true);
   actor.groundFeet(()=>0);
  }
 }
 gear.update(item,null);actor.root.updateMatrixWorld(true);
 camera.position.set(Math.sin(angle)*5.38,1.35,actor.root.position.z+Math.cos(angle)*5.38);
 camera.lookAt(0,1.22,actor.root.position.z);
 renderer.render(scene,camera);
 if(phase==="before")return null;
 const result={};
 for(const name of expected){
  const mesh=actor.root.getObjectByName(name);
  if(!mesh?.visible||!mesh.isSkinnedMesh||!mesh.skeleton.bones.includes(actor.head))throw Error("Wardrobe not rigged: "+name);
  const p=new T.Vector3();let samples=0;
  for(let i=0;i<mesh.geometry.attributes.position.count;i+=9){
   mesh.getVertexPosition(i,p);
   if(!Number.isFinite(p.lengthSq())||p.lengthSq()>30)throw Error("Invalid deformation: "+name);
   samples++;
  }
  result[name]=samples;
 }
 if(variant&&names.some(name=>actor.root.getObjectByName(name)?.visible))throw Error("Double layer on equipped outfit");
 return result;
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
 await page.goto("https://outfit.local/");await page.waitForFunction(()=>window.capture);
 const report=[];
 const cases=[{label:"front",angle:.20},{label:"back",angle:2.78}];
 for(const [label,speed] of [["walk",3.0],["run",8.2]]){
  for(const frame of [4,6,8,10,12,14,17,20,23,26,29,32]){
   cases.push({label:label+"-"+frame,speed,frame,angle:frame%3===0?2.63:frame%3===1?.42:-.85});
  }
 }
 if(phase==="after")cases.push({label:"equipment",variant:true,angle:.35},{label:"unequipped",angle:.35});
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
