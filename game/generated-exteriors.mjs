import * as THREE from "./vendor/three/three.module.min.js";
import { fitHouseWindows, clearGlass } from "./frosted-windows.mjs";

const directory="assets/regional-exteriors/";
const houseFiles=["asagi","brunnen","santa-lucia","juniperwell","beaverton","saint-aurel","ambaro","karuk"];

function boundsOf(model){
 const box=new THREE.Box3().setFromObject(model);
 const size=box.getSize(new THREE.Vector3());
 if(size.toArray().some(value=>!Number.isFinite(value)||value<=0))throw new Error("Invalid exterior dimensions");
 return {box,size,center:box.getCenter(new THREE.Vector3())};
}

function doorFacadeDepth(scene,{box,size,center}){
 const ray=new THREE.Raycaster();
 const direction=new THREE.Vector3(0,0,-1),depths=[];
 // Probe the siding next to the baked door, above steps and porch railings.
 for(const y of [.32,.43,.54])for(const x of [-.13,-.07,.07,.13]){
  ray.set(new THREE.Vector3(center.x+x*size.x,box.min.y+y*size.y,box.max.z+.10),direction);
  const hit=ray.intersectObject(scene,true).find(({point})=>point.z>center.z);
  if(hit)depths.push((hit.point.z-center.z)/size.z);
 }
 depths.sort((a,b)=>a-b);
 return depths[Math.floor(depths.length*.5)]??.5/1.18;
}

// The visual mesh leaves room for the original door or moving wheels.
function maskedMaterial(source,min,max,localMatrix,windows=[]){
 const material=source.clone();
 material.onBeforeCompile=shader=>{
  shader.uniforms.exteriorMaskMin={value:min};
  shader.uniforms.exteriorMaskMax={value:max};
  if(windows.length){
   shader.uniforms.windowMin={value:windows.map(box=>box.min)};
   shader.uniforms.windowMax={value:windows.map(box=>box.max)};
  }
  if(localMatrix)shader.uniforms.exteriorLocalMatrix={value:localMatrix};
  const matrix=localMatrix?"exteriorLocalMatrix":"modelMatrix";
  shader.vertexShader="varying vec3 exteriorPoint;\n"+
   (localMatrix?"uniform mat4 exteriorLocalMatrix;\n":"")+
   shader.vertexShader.replace("#include <worldpos_vertex>",
    `#include <worldpos_vertex>\n exteriorPoint=(${matrix}*vec4(transformed,1.)).xyz;`);
  const windowCount=windows.length;
  const windowUniforms=windowCount?`uniform vec3 windowMin[${windowCount}],windowMax[${windowCount}];\n`:"";
  const windowCut=windowCount?`\n for(int w=0;w<${windowCount};w++){
   if(all(greaterThan(exteriorPoint,windowMin[w])) && all(lessThan(exteriorPoint,windowMax[w]))) discard;
  }`:"";
  shader.fragmentShader="varying vec3 exteriorPoint; uniform vec3 exteriorMaskMin,exteriorMaskMax;\n"+windowUniforms+
   shader.fragmentShader.replace("#include <clipping_planes_fragment>",
    "#include <clipping_planes_fragment>\n if(all(greaterThan(exteriorPoint,exteriorMaskMin)) && all(lessThan(exteriorPoint,exteriorMaskMax))) discard;"+windowCut);
 };
 material.customProgramCacheKey=()=>localMatrix?"generated-engine-wheel-cut":"generated-house-cuts-"+windows.length;
 return material;
}

function replaceMaterials(root,replace){
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  mesh.material=Array.isArray(mesh.material)?mesh.material.map(material=>replace(material,mesh)):replace(mesh.material,mesh);
 });
}

export function createGeneratedExteriors(loader){
 const root=new THREE.Group(), engine=new THREE.Group(), houses=new THREE.Group();
 engine.visible=false;
 root.add(engine,houses);
 let engineReady=false;
 const engineLoaded=loader.loadAsync(directory+"locomotive.glb").then(({scene})=>{
  // The source runs along Z. Put its smokebox at the existing X origin.
  scene.rotation.y=-Math.PI/2;
  const {box,size,center}=boundsOf(scene);
  scene.position.set(-box.min.x,-box.min.y,-center.z);
  const fitted=new THREE.Group();
  fitted.add(scene);
  fitted.scale.set(10.8/size.x,3.61/size.y,2.53/size.z);
  fitted.updateMatrixWorld(true);
  const min=new THREE.Vector3(-100,-100,-100),max=new THREE.Vector3(100,.97,100);
  replaceMaterials(fitted,(source,mesh)=>{
   const material=maskedMaterial(source,min,max,mesh.matrixWorld.clone());
   material.metalness=.50;
   return material;
  });
  engine.add(fitted);
  engine.rotation.z=-.041;
  engineReady=true;
 }).catch(error=>console.warn("Generated Asagi locomotive unavailable",error));

 const sources=new Map(),placements=[];
 const litGlass=clearGlass.clone();
 const warmWindow=new THREE.Color(0xdca46c);
 function begin(region){
  for(const {group} of placements)group.traverse(mesh=>{
   if(!mesh.isMesh||mesh.material===clearGlass||mesh.material===litGlass)return;
   for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();
  });
  houses.clear();
  placements.length=0;
  if(sources.has(region)||!houseFiles[region])return;
  sources.set(region,null);
  loader.loadAsync(directory+houseFiles[region]+".glb").then(({scene})=>{
   let bounds=boundsOf(scene);
   const {box,size,center}=bounds;
   const panes=fitHouseWindows(region,scene,box,size,center);
   if(region===1){
    // The Brunnen model has its entrance on the right-hand facade.
    const turn=new THREE.Matrix4().makeRotationY(-Math.PI/2);
    scene.rotation.y-=Math.PI/2;
    panes.geometry.applyMatrix4(turn);
    for(const corners of panes.cuts)for(const corner of corners)corner.applyMatrix4(turn);
    bounds=boundsOf(scene);
   }
   sources.set(region,{scene,...bounds,facadeDepth:doorFacadeDepth(scene,bounds),panes});
  }).catch(error=>console.warn("Generated village house unavailable",houseFiles[region],error));
 }
 function add(region,{x,y,z,w,d,h,doorWidth,doorHeight,c=1,sine=0,lit=false}){
  const source=sources.get(region);
  if(!source)return false;
  const {scene,box,size,center,panes,facadeDepth}=source;
  const model=scene.clone();
  model.position.set(-center.x,-box.min.y,-center.z);
  const group=new THREE.Group();
  group.add(model);
  const depth=facadeDepth*d*1.18;
  const offset=THREE.MathUtils.clamp(d*.5-depth,-d*.13,d*.13);
  const front=depth+offset;
  // The stilt-house mesh starts at the posts, with the porch deck 31% up.
  // Fit that deck to the existing threshold and keep the original roof height.
  const porch=region===5?.31:0;
  const fittedHeight=porch?(h*1.53-.07)/(1-porch):h*1.53;
  const base=porch?.27-porch*fittedHeight:.20;
  // These two source entrances sit slightly right of the facade center.
  const doorCenter=region===4?.085:region===7?.025:0;
  const sideOffset=-doorCenter*w*1.11;
  group.position.set(x-offset*sine+sideOffset*c,y+base,z+offset*c+sideOffset*sine);
  group.rotation.y=-Math.atan2(sine,c);
  group.scale.set(w*1.11/size.x,fittedHeight/size.y,d*1.18/size.z);
  const half=doorWidth*.5+.045;
  // The four village orientations keep the doorway cut aligned to world axes.
  const near=Math.min(d*.20,front-.32),far=Math.max(d,front+.30);
  const middle=(near+far)*.5,span=(far-near)*.5;
  const doorX=x-middle*sine,doorZ=z+middle*c;
  const halfX=Math.abs(c)*half+Math.abs(sine)*span;
  const halfZ=Math.abs(sine)*half+Math.abs(c)*span;
  const min=new THREE.Vector3(doorX-halfX,y-.1,doorZ-halfZ);
  const max=new THREE.Vector3(doorX+halfX,y+.27+doorHeight+.025,doorZ+halfZ);
  group.updateMatrixWorld(true);
  const windows=panes.cuts.map(([a,b])=>new THREE.Box3().setFromPoints([
   a.clone().applyMatrix4(group.matrixWorld),b.clone().applyMatrix4(group.matrixWorld)
  ]));
  replaceMaterials(model,sourceMaterial=>{
   const material=maskedMaterial(sourceMaterial,min,max,null,windows);
   if(!material.metalnessMap)material.metalness=0;
   return material;
  });
  group.add(new THREE.Mesh(panes.geometry,lit?litGlass:clearGlass));
  houses.add(group);
  placements.push({group,x,z,w:c===0?d:w,d:c===0?w:d});
  const fittedWindows=[];
  const vertices=panes.geometry.getAttribute("position");
  const at=i=>new THREE.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(group.matrixWorld);
  for(let i=0;i<vertices.count;i+=6){
   const a=at(i),b=at(i+1),c=at(i+2);
   const center=a.clone().lerp(b,.5);
   const along=b.clone().sub(a);
   fittedWindows.push({x:center.x,y:center.y,z:center.z,width:along.length(),
    height:Math.abs(c.y-b.y),angle:Math.atan2(-along.z,along.x)});
  }
  return {frontZ:z+front,fittedWindows};
 }
 return {
  root,begin,add,engineLoaded,
  ready:region=>Boolean(sources.get(region)),
  get hasLocomotive(){return engineReady;},
  update(train,player,night=0){
   litGlass.opacity=.07+night*.63;
   litGlass.color.copy(clearGlass.color).lerp(warmWindow,night);
   engine.visible=engineReady&&Boolean(train);
   if(engine.visible)engine.position.fromArray(train);
   for(const {group,x,z,w,d} of placements){
    group.visible=Math.abs(player[0]-x)>=w*.5-.12||Math.abs(player[2]-z)>=d*.5-.12;
   }
  }
 };
}
