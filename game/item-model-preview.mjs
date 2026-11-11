import * as T from "./vendor/three/three.module.min.js";
import { GLTFLoader } from "./vendor/three/GLTFLoader.js";

export async function showItemModel(container,url){
 const {scene:model}=await new GLTFLoader().loadAsync(url);
 const disposeModel=()=>model.traverse(node=>{
  if(!node.isMesh)return;
  node.geometry.dispose();
  for(const material of [node.material].flat()){
   for(const value of Object.values(material))if(value?.isTexture)value.dispose();
   material.dispose();
  }
 });
 if(!container.isConnected){disposeModel();return;}
 const bounds=new T.Box3().setFromObject(model,true);
 const size=bounds.getSize(new T.Vector3()).length();
 if(!Number.isFinite(size)||size<.00001){disposeModel();throw Error("Empty item model");}
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 renderer.setSize(224,224);
 renderer.toneMapping=T.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.18;
 const canvas=renderer.domElement;
 canvas.style.display="block";canvas.style.maxWidth="100%";canvas.style.marginInline="auto";
 canvas.setAttribute("role","img");canvas.setAttribute("aria-label","회전하는 3D 아이템");
 const scene=new T.Scene(),pivot=new T.Group();
 model.position.sub(bounds.getCenter(new T.Vector3()));
 pivot.scale.setScalar(1.65/size);pivot.add(model);scene.add(pivot);
 scene.add(new T.HemisphereLight(0xfff8e9,0xaab0b2,2));
 scene.add(new T.AmbientLight(0xeee0cc,.48));
 const light=new T.DirectionalLight(0xfff8ed,2.7);light.position.set(3,5,4);scene.add(light);
 const fill=new T.DirectionalLight(0xe5ecff,1.3);fill.position.set(-4,3,3);scene.add(fill);
 const camera=new T.OrthographicCamera(-1,1,1,-1,.01,30);
 camera.position.set(2.5,1.7,4.8);camera.lookAt(0,0,0);
 container.prepend(canvas);
 renderer.setAnimationLoop(time=>{
  if(!canvas.isConnected||!document.getElementById("dialog").open){
   renderer.setAnimationLoop(null);renderer.dispose();renderer.forceContextLoss();disposeModel();canvas.remove();
   const button=container.querySelector("button");
   if(button)button.textContent="3D 모델 보기";
   return;
  }
  pivot.rotation.y=time*.00045;
  renderer.render(scene,camera);
 });
}
