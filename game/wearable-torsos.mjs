import * as T from "./vendor/three/three.module.min.js";
import {GLTFLoader} from "./vendor/three/GLTFLoader.js";

let wardrobe;
const loader=new GLTFLoader();
function load(){
 wardrobe??=loader.loadAsync("assets/wardrobe/mercy-headgear.glb").then(({scene})=>scene).catch(error=>{
  wardrobe=null;throw error;
 });
 return wardrobe;
}

export function createHeadgear(actor){
 actor.root.updateMatrixWorld(true);
 const bind=actor.root.matrixWorld.clone(),skeleton=new T.Skeleton(actor.bones);
 const names=new Map(actor.bones.map((bone,index)=>[bone.name,index]));
 const pieces=new Map(),grade={value:0},thread={value:new T.Color()};
 const colors=["#8a7153","#8e9063","#ae8151","#a7b8c9","#d4a958"];
 let loading=false,failed=false;

 function attach(scene){
  scene.updateMatrixWorld(true);
  for(const key of ["146","150"]){
   const node=scene.getObjectByName("wardrobe-"+key);
   if(!node?.isSkinnedMesh)throw Error("Missing headgear "+key);
   const geometry=node.geometry.clone().applyMatrix4(node.matrixWorld);
   const joints=geometry.attributes.skinIndex,weights=geometry.attributes.skinWeight;
   const remap=node.skeleton.bones.map(bone=>names.get(bone.name));
   for(let i=0;i<joints.count;i++)for(let j=0;j<4;j++){
    const index=remap[joints.getComponent(i,j)];
    if(index===undefined&&weights.getComponent(i,j)>.0001)throw Error("Unmapped headgear bone");
    joints.setComponent(i,j,index??0);
   }
   const material=node.material.clone();material.side=T.DoubleSide;
   material.roughness=.92;
   material.onBeforeCompile=shader=>{
    shader.uniforms.headwearGrade=grade;shader.uniforms.headwearThread=thread;
    shader.vertexShader="varying vec3 vHeadwear;\n"+shader.vertexShader
     .replace("#include <begin_vertex>","#include <begin_vertex>\n vHeadwear=position;");
    shader.fragmentShader="varying vec3 vHeadwear; uniform float headwearGrade; uniform vec3 headwearThread;\n"+shader.fragmentShader
     .replace("#include <color_fragment>",`#include <color_fragment>
      float axis1=${key==="150"?"(length(vHeadwear.xz-vec2(0.,.105))*212.+vHeadwear.y*119.)":"(vHeadwear.x+vHeadwear.y*.34+vHeadwear.z*.66)*314."};
      float axis2=${key==="150"?"atan(vHeadwear.x,vHeadwear.z-.105)*22.":"(vHeadwear.y-vHeadwear.z*.4)*290."};
      float weave1=sin(axis1*6.283185)*(1.-smoothstep(.10,.52,fwidth(axis1)));
      float weave2=cos(axis2*6.283185)*(1.-smoothstep(.10,.52,fwidth(axis2)));
      float fibers=weave1*.095+weave2*.059;
      diffuseColor.rgb*=1.+fibers;
      float y=vHeadwear.y;
      float fineness=smoothstep(1.,5.,headwearGrade);
      float band=smoothstep(${key==="150"?"2.35,2.36":"2.11,2.119"},y)*(1.-smoothstep(${key==="150"?"2.392,2.398":"2.139,2.146"},y));
      float levelBand=band*step(.5,headwearGrade);
      float density=sin(atan(vHeadwear.x,vHeadwear.z-.10)*${key==="150"?"42.":"32."});
      float braided=sin(y*912.+density*1.25)*.5+.5;
      vec3 bandColor=headwearThread*(.40+braided*(.13+fineness*.22));
      diffuseColor.rgb=mix(diffuseColor.rgb,bandColor,levelBand*(.48+fineness*.39));`)
     .replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
      vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
      vec3 a=cross(dy,normal),b=cross(normal,dx);
      float determinant=dot(dx,a);
      if(abs(determinant)>1.e-12)normal=normalize(abs(determinant)*normal-sign(determinant)*.005*(dFdx(fibers)*a+dFdy(fibers)*b));`);
   };
   material.customProgramCacheKey=()=>"mercy-headwear-weave-"+key;
   const item=new T.SkinnedMesh(geometry,material);
   item.name="wardrobe-"+key;item.frustumCulled=false;item.visible=false;
   item.bind(skeleton,bind);
   pieces.set(key,item);actor.root.add(item);
  }
 }

 function update(gear){
  const rank=gear?.coatTier;
  grade.value=Number.isInteger(rank)&&rank>=1&&rank<=5?rank:0;
  if(grade.value)thread.value.set(colors[grade.value-1]);
  const selected=gear?.head?.[4]?.match(/\/priority-models\/(146|150)\.glb$/)?.[1];
  if(selected&&!pieces.size&&!loading&&!failed){
   loading=true;
   load().then(attach).catch(error=>{
    failed=true;console.warn("머리 장비를 불러오지 못했습니다.",error);
   }).finally(()=>loading=false);
  }
  for(const [key,mesh] of pieces)mesh.visible=selected===key;
  return pieces.has(selected);
 }
 return {update};
}
