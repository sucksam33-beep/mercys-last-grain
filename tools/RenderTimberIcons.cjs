const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const game=path.join(__dirname,"game");
const timber=[
 {id:"timber_common",name:"일반 목재",model:"assets/living-props/firewood.glb",falRequestId:"01a1bc7b-2169-7ec3-9f2f-3056e0de6187"},
 {id:"timber_log",name:"원목"},
 {id:"timber_quality",name:"질 좋은 목재"},
 {id:"timber_premium",name:"고급 목재"},
];
const render=String.raw`
import * as T from "/vendor/three/three.module.min.js";
import { GLTFLoader } from "/vendor/three/GLTFLoader.js";
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setSize(256,256);renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;
const camera=new T.OrthographicCamera(-1,1,1,-1,.1,20);
camera.position.set(3.2,2.5,4);camera.lookAt(0,0,0);
function texture(type,base,ink){
 const c=document.createElement("canvas");c.width=c.height=256;
 const x=c.getContext("2d");x.fillStyle=base;x.fillRect(0,0,256,256);
 for(let i=0;i<85;i++){
  x.strokeStyle=ink;x.globalAlpha=.07+(i%7)*.025;x.lineWidth=1+i%3;x.beginPath();
  if(type==="end"){
   const radius=2+i*2.6;x.moveTo(119+radius,133);
   for(let a=0;a<=64;a++){
    const angle=a*Math.PI/32,r=radius*(1+.024*Math.sin(angle*5+i*.18));
    x.lineTo(119+r*Math.cos(angle),133+.98*r*Math.sin(angle));
   }
  }else{
   const pos=(i*53)%256;x.moveTo(pos,0);
   x.bezierCurveTo(pos+7*Math.sin(i),86,pos+10*Math.cos(i),175,pos+3*Math.sin(i*2),256);
  }
  x.stroke();
 }
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
}
const material=(...args)=>new T.MeshStandardMaterial({map:texture(...args),roughness:.92});
const bark=material("grain","#60402b","#180e08"), cut=material("end","#c59156","#663a20");
const clean=material("grain","#ae7544","#5d3522"), cleanEnd=material("end","#d6ae74","#775129");
const select=material("grain","#754127","#32160c"), selectEnd=material("end","#b76e3f","#5e2a18");
function log(length,radius,mat=bark,end=cut,sides=16){
 const mesh=new T.Mesh(new T.CylinderGeometry(radius*.94,radius,length,sides),[mat,end,end]);
 mesh.rotation.z=Math.PI/2;return mesh;
}
function beam(length,depth,height,mat,end){
 const geometry=new T.BoxGeometry(length,height,depth);
 const uv=geometry.getAttribute("uv");
 for(const group of geometry.groups.slice(2))for(let i=group.materialIndex*4;i<group.materialIndex*4+4;i++){
  const u=uv.getX(i);uv.setXY(i,uv.getY(i),u);
 }
 return new T.Mesh(geometry,[end,end,mat,mat,mat,mat]);
}
window.capture=async index=>{
 const scene=new T.Scene();
 scene.add(new T.HemisphereLight(0xfff9ee,0xada4a0,1.5));
 const key=new T.DirectionalLight(0xfff7eb,2.35);key.position.set(3,6,4);scene.add(key);
 const fill=new T.DirectionalLight(0xf2f4ff,1.05);fill.position.set(-4,2,2);scene.add(fill);
 const object=new T.Group();scene.add(object);
 const put=(mesh,x,y,z,angle=0)=>{mesh.position.set(x,y,z);mesh.rotation.y=angle;object.add(mesh);};
 if(index===0){
  const {scene:firewood}=await new GLTFLoader().loadAsync("/assets/living-props/firewood.glb");
  const bounds=new T.Box3().setFromObject(firewood,true);
  const size=bounds.getSize(new T.Vector3());
  const scale=1.14/Math.max(size.x,size.y,size.z);
  firewood.scale.multiplyScalar(scale);
  object.add(firewood);
 }else if(index===1){
  put(log(1.38,.37),0,0,0,.13);
 }else if(index===2){
  put(beam(1.55,.27,.27,clean,cleanEnd),0,0,.14,.02);
  put(beam(1.43,.25,.23,clean,cleanEnd),-.035,0,-.17,.02);
  put(beam(1.36,.26,.20,clean,cleanEnd),.07,.23,.025,.02);
 }else{
  put(beam(1.54,.51,.41,select,selectEnd),0,0,0,.12);
 }
 const bounds=new T.Box3().setFromObject(object);
 object.position.sub(bounds.getCenter(new T.Vector3()));
 renderer.render(scene,camera);
 const probe=document.createElement("canvas");
 probe.width=probe.height=256;
 const ctx=probe.getContext("2d");
 ctx.drawImage(renderer.domElement,0,0);
 const pixels=ctx.getImageData(0,0,256,256).data;
 let visible=0;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  if(!pixels[(y*256+x)*4+3])continue;
  visible++;
  if(x<8||y<8||x>=248||y>=248)throw Error("Clipped timber "+index);
 }
 if(visible<500||visible>53000)throw Error("Invalid timber silhouette "+index);
 return renderer.domElement.toDataURL("image/png").split(",")[1];
};
`;
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
 try{
  const page=await browser.newPage();
  await page.route("https://timber-icons.local/**",route=>{
   const pathname=new URL(route.request().url()).pathname;
   if(pathname==="/")return route.fulfill({contentType:"text/html",body:'<script type="module" src="/render.mjs"></script>'});
   if(pathname==="/render.mjs")return route.fulfill({contentType:"text/javascript",body:render});
   return route.fulfill({path:path.join(game,pathname),contentType:pathname.endsWith(".glb")?"model/gltf-binary":"text/javascript"});
  });
  await page.goto("https://timber-icons.local/");
  await page.waitForFunction(()=>typeof window.capture==="function");
  for(const [i,item] of timber.entries()){
   const data=Buffer.from(await page.evaluate(i=>window.capture(i),i),"base64");
   assert.equal(data[25],6);
   item.icon="assets/item-icons/"+item.id+".png";
   fs.writeFileSync(path.join(game,item.icon),data);
  }
  fs.writeFileSync(path.join(game,"assets/item-icons/timber-manifest.json"),JSON.stringify(timber,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
