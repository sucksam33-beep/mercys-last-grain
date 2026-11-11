import * as THREE from "./vendor/three/three.module.min.js";

const assets=["wood-fence-post","wood-fence-panel","wood-fence-end","closed-wood-crate","open-wood-crate","wood-storage-shelf","woven-basket"];
const livingAssets=["oil-lantern","oak-barrel","handcart","hand-pump","iron-stove","grain-sack","onggi-jar","water-bucket","wood-bench","firewood","stone-trough","rope-coil"];
const localFinishes={station:[.97,.95,.89],home:[.99,.93,.84],interior:[.91,.86,.78],market:[.87,.88,.84],water:[.83,.90,.91]};
// Saturation, anchor weight, linear albedo anchor and material tint.
const timber=[.29,.43,.11,.94,.77,.58],iron=[.24,.52,.075,.75,.76,.73];
const palettes={
 "oil-lantern":iron,"oak-barrel":[.23,.51,.115,.97,.80,.64],
 handcart:timber,"hand-pump":iron,"iron-stove":iron,
 "grain-sack":[.44,.33,.20,1,.88,.72],"onggi-jar":[.46,.44,.085,.95,.77,.61],
 "water-bucket":timber,"wood-bench":timber,firewood:timber,
 "stone-trough":[.23,.58,.19,.89,.92,.86],"rope-coil":[.39,.40,.13,.91,.80,.63]
};
const cellSize=20,drawDistance=42;
// Cedar, canal oak, dry timber, mountain pine, railway pine, cypress, saltwood, cold spruce.
const finishes=[0xb9b7ab,0xb3b3a8,0xc8bdac,0xbeb6a6,0xb7bfc0,0xa6b4a5,0xc4c2ae,0xa7b8c2];

export function createAsagiProps(loader){
 const root=new THREE.Group(),sources=new Map(),cells=new Map();
 const matrix=new THREE.Matrix4(),rotation=new THREE.Euler(0,0,0,"YXZ"),quaternion=new THREE.Quaternion();
 const position=new THREE.Vector3(),scale=new THREE.Vector3();
 const contactGeometry=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
 const contactMaterial=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,
  uniforms:{opacity:{value:.24}},
  vertexShader:"varying vec2 footprint; void main(){ footprint=uv-.5; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.); }",
  fragmentShader:"uniform float opacity; varying vec2 footprint; void main(){ vec2 d=abs(footprint); float fade=(1.-smoothstep(.23,.5,d.x))*(1.-smoothstep(.23,.5,d.y)); gl_FragColor=vec4(.085,.071,.052,fade*opacity); }"
 });
 let loading=false,ready=false,livingLoad=null,livingReady=false;
 const materials=new Map(),instanceTint=new THREE.Color();
 const lightUniform={value:1};

 function finish(material,name){
  if(materials.has(material))return materials.get(material);
  const shaded=material.clone();
  shaded.roughness=Math.max(shaded.roughness,.84);
  shaded.metalness*=.45;
  const palette=palettes[name];
  if(palette)shaded.metalness=Math.min(shaded.metalness,palette===iron?.30:.10);
  const chroma=name==="woven-basket"?".73":".60";
  const bounce=palette?(name==="stone-trough"?".52":".26"):"0.";
  let grade="mix(vec3(propLuma),diffuseColor.rgb,"+chroma+")";
  if(palette){
   const [saturation,weight,anchor,...bias]=palette.map(value=>value.toFixed(3));
   const midtone="mix(propLuma,"+anchor+","+weight+")";
   grade="max(vec3(0.),"+midtone+"*vec3("+bias.join(",")+")+(diffuseColor.rgb-vec3(propLuma))*"+saturation+")";
  }
  shaded.customProgramCacheKey=()=>grade+bounce;
  shaded.onBeforeCompile=shader=>{
   shader.uniforms.propLight=lightUniform;
   shader.fragmentShader="uniform float propLight;\n"+shader.fragmentShader
    .replace("#include <map_fragment>","#include <map_fragment>\n float propLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)); diffuseColor.rgb="+grade+";")
    .replace("#include <opaque_fragment>","outgoingLight = (outgoingLight + diffuseColor.rgb * "+bounce+" * propLight);\n#include <opaque_fragment>");
  };
  materials.set(material,shaded);
  return shaded;
 }

 function begin(region){
  for(const {group} of cells.values())group.traverse(object=>{if(object.isInstancedMesh)object.dispose();});
  root.clear();
  cells.clear();
  for(const material of materials.values())material.dispose();
  materials.clear();
  if(region<=1&&!livingLoad){
   livingLoad=Promise.allSettled(livingAssets.map(name=>load(name,"living-props"))).then(results=>{
    for(const result of results)if(result.status==="rejected")console.warn("Living prop unavailable",result.reason);
    livingReady=true;
   });
  }
  if(loading)return;
  loading=true;
  Promise.all(assets.map(name=>load(name,"asagi-props"))).then(()=>{ready=true;}).catch(error=>console.warn("Asagi prop models unavailable",error));
 }

 async function load(name,folder){
   const {scene}=await loader.loadAsync("assets/"+folder+"/"+name+".glb");
   const originalSize=new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
   if((name==="wood-fence-panel"||name==="wood-fence-end"||name==="wood-storage-shelf")&&originalSize.z>originalSize.x){
    scene.rotation.y=Math.PI/2;
    scene.updateMatrixWorld(true);
   }
   const bounds=new THREE.Box3().setFromObject(scene);
   const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
   if(size.toArray().some(n=>!Number.isFinite(n)||n<=0))throw new Error("Invalid bounds: "+name);
   // The generated fence post has a flared footing. Fit the exposed shaft and bury the footing.
   const footing=name==="wood-fence-post"?.18:0;
   const width=footing?size.x*.24:size.x,depth=footing?size.z*.23:size.z;
   const fit=new THREE.Matrix4().makeScale(1/width,1/(size.y*(1-footing)),1/depth)
    .multiply(new THREE.Matrix4().makeTranslation(-center.x,-bounds.min.y-size.y*footing,-center.z));
   const pieces=[];
   scene.traverse(mesh=>{
    if(mesh.isMesh)pieces.push({geometry:mesh.geometry,material:mesh.material,local:fit.clone().multiply(mesh.matrixWorld)});
   });
   if(!pieces.length)throw new Error("No mesh: "+name);
   sources.set(name,pieces);
 }

 function add(name,x,y,z,w,h,d,yaw,tilt,style){
  if(!sources.has(name))return false;
  const col=Math.floor(x/cellSize),row=Math.floor(z/cellSize),key=col+":"+row;
  if(!cells.has(key))cells.set(key,{col,row,placements:new Map(),contacts:[],group:new THREE.Group()});
  const {placements,contacts}=cells.get(key);
  if(!placements.has(name))placements.set(name,[]);
  position.set(x,y,z);
  quaternion.setFromEuler(rotation.set(0,yaw,tilt));
  placements.get(name).push({transform:new THREE.Matrix4().compose(position,quaternion,scale.set(w,h,d)),style});
  // Soft ambient contact stays near the footprint, separate from the directional world shadows.
  if(name==="wood-storage-shelf"||name.endsWith("wood-crate")||name==="woven-basket"||(style&&name!=="oil-lantern")){
   position.y+=.012;
   quaternion.setFromEuler(rotation.set(0,yaw,0));
   const spread=style?1.12:1.24;
   contacts.push(new THREE.Matrix4().compose(position,quaternion,scale.set(w*spread,1,d*spread)));
  }
  return true;
 }

 function update(region,player,weather,daylight){
  lightUniform.value=(.80+.20*daylight)*(1-.43*weather.cover-.15*weather.rain);
  contactMaterial.uniforms.opacity.value=.19+daylight*.08-weather.cover*.07;
  for(const {col,row,placements,contacts,group} of cells.values()){
   const dx=Math.max(col*cellSize-player[0],0,player[0]-(col+1)*cellSize);
   const dz=Math.max(row*cellSize-player[2],0,player[2]-(row+1)*cellSize);
   group.visible=dx*dx+dz*dz<=drawDistance*drawDistance;
   if(!group.visible||group.parent)continue;
   for(const [name,transforms] of placements)for(const {geometry,material,local} of sources.get(name)){
    const shaded=finish(material,name);
    const living=livingAssets.includes(name);
    shaded.color.setHex(living?0xffffff:name==="woven-basket"?0xc3bcae:finishes[region]);
    const mesh=new THREE.InstancedMesh(geometry,shaded,transforms.length);
    transforms.forEach(({transform,style},i)=>{
     mesh.setMatrixAt(i,matrix.multiplyMatrices(transform,local));
     if(living)mesh.setColorAt(i,instanceTint.fromArray(localFinishes[style]??localFinishes.station));
    });
    mesh.computeBoundingSphere();
    group.add(mesh);
   }
   if(contacts.length){
    const contact=new THREE.InstancedMesh(contactGeometry,contactMaterial,contacts.length);
    contacts.forEach((transform,i)=>contact.setMatrixAt(i,transform));
    contact.computeBoundingSphere();
    group.add(contact);
   }
   root.add(group);
  }
 }

 return {root,begin,add,update,get ready(){return ready;},get livingReady(){return livingReady;},has:name=>sources.has(name)};
}
