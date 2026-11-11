"use strict";

// Apply to the staged Windows game. The website keeps its original character modules.
module.exports=edit=>{
 edit("ResidentCast.mjs",source=>{
  const s=source.replace(/\r\n/g,"\n");
  return s
   .replace('side*width*.27,-.111,0), wrist=bone(elbow,side*width*.21,-.119,.005)','side*width*.27,-.112,0), wrist=bone(elbow,side*width*.21,-.142,.005)')
   .replace('guide(wrist,vector(side*width,.486,.016));','guide(wrist,vector(side*width,.410,.016));')
   .replace('const namedLegMix=entry.label==="sae"?1:.66;','const namedLegMix=entry.label==="sae"?1:.74;')
   .replace(' if(!model.geometry.hasAttribute("skinIndex")){\n for(let i=0;i<positions.count;i++){',` if(!model.geometry.hasAttribute("skinIndex")){
 const handBlend=new Float32Array(positions.count);
 const armInfluences=new Float32Array(positions.count);
 for(let i=0;i<positions.count;i++){`)
   .replace('  const armMix=smoothstep(Math.abs(x),width*.49,width*.80)*smoothstep(y,.43,.52)*(1-smoothstep(y,.79,.85));',`  const sideX=Math.abs(x);
  const handGate=smoothstep(y,.377,.414)*(1-smoothstep(y,.493,.55));
  const outerHand=smoothstep(sideX,width*.70,width*.88)*handGate;
  const sleeve=smoothstep(sideX,width*.46,width*.75)*smoothstep(y,.40,.53)*(1-smoothstep(y,.76,.84));
  const armMix=Math.max(outerHand,sleeve);
  const wristMix=smoothstep(outerHand,.18,.78)*(1-smoothstep(y,.466,.525));
  handBlend[i]=wristMix;
  armInfluences[i]=armMix;`)
   .replace('  chain(Object.values(arms[side]),armMix);',`  chain(Object.values(arms[side]),armMix*(1-wristMix));
  add(arms[side].wrist,armMix*wristMix);`)
   .replace('  const headMix=smoothstep(y,.831,.924)*(1-armMix);','  const headMix=smoothstep(y,.829,.904)*(1-armMix);')
   .replace(' model.geometry.setAttribute("skinIndex",',` // Shorten the hand toward the bind wrist while keeping its UVs and cuff anchors.
 for(let i=0;i<positions.count;i++){
  const weight=handBlend[i]*armInfluences[i];
  if(weight<.001)continue;
  point.fromBufferAttribute(positions,i);
  const wrist=world[bones.indexOf(arms[point.x<0?0:1].wrist)];
  point.y+=(wrist.y-point.y)*.17*weight;
  point.x+=(wrist.x-point.x)*.045*weight;
  positions.setXYZ(i,point.x,point.y,point.z);
 }
 positions.needsUpdate=true;
 model.geometry.computeBoundingBox();
 model.geometry.computeBoundingSphere();
 model.geometry.setAttribute("handBlend",new THREE.BufferAttribute(handBlend,1));
 model.geometry.setAttribute("skinIndex",`)
   .replace(' const mesh=new THREE.SkinnedMesh(model.geometry,model.material);',` const material=model.material.clone();
 material.roughness=.88;
 const handTone={value:new THREE.Color("#9b7761")};
 material.onBeforeCompile=shader=>{
  shader.uniforms.handTone=handTone;
  shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\\nattribute float handBlend; varying float vHandBlend;")
   .replace("#include <begin_vertex>","#include <begin_vertex>\\nvHandBlend=handBlend;");
  shader.fragmentShader=shader.fragmentShader.replace("#include <common>","#include <common>\\nvarying float vHandBlend; uniform vec3 handTone;")
   .replace("#include <color_fragment>","#include <color_fragment>\\nfloat handLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)); vec3 matched=handTone*(.45+.55*clamp(handLuma/.28,0.0,2.0)); diffuseColor.rgb=mix(diffuseColor.rgb,matched,vHandBlend*.21);");
 };
 material.customProgramCacheKey=()=>"returning-waters-resident-skin";
 const mesh=new THREE.SkinnedMesh(model.geometry,material);`)
   .replace('hip,mesh,feet,named:true','hip,mesh,feet,handTone,named:true')
   .replace('  actor.root.name=entry.label;','  actor.handTone.value.setRGB(...portrait.mesh.skin.map(value=>value/255),THREE.SRGBColorSpace);\n  actor.root.name=entry.label;')
   .replace('actor.head.rotation.y=Math.sin(step*.5)*.045;','actor.head.rotation.y=Math.sin(step*.5)*.027;')
   .replace('actor.head.rotation.z=-actor.body.rotation.z*.67;','actor.head.rotation.z=-actor.body.rotation.z*.38;')
   .replace('shoulder.rotation.z=(i===0?1:-1)*.15;','shoulder.rotation.z=(i===0?1:-1)*.085;')
   .replace('shoulder.rotation.x=-Math.sin(phase)*.29*effort;','shoulder.rotation.x=-Math.sin(phase)*.22*effort;')
   .replace('elbow.rotation.x=-(.08+Math.max(0,-Math.sin(phase))*.22)*effort;','elbow.rotation.x=-(.055+Math.max(0,-Math.sin(phase))*.19)*effort;');
 });
 edit("ResidentPortrait.mjs",source=>source.replace(/\r\n/g,"\n")
  .replace('const profile=[[.13,.88],[.25,.79],[.42,.76],[.60,.78],[.76,.73],[.89,.57],[1,.36]];','const profile=[[.10,.96],[.22,.91],[.38,.83],[.54,.82],[.70,.84],[.86,.77],[1,.63]];')
  .replace('shape=smoothstep(t,0,.67);','shape=smoothstep(t,.04,.88);')
  .replace('width*.30*radius*neckScale','width*.34*radius*neckScale')
  .replace('width*.34*radius*neckScale;\n   const front','width*.35*radius*neckScale;\n   const front')
  .replace('lerp(.80,1.03,front)*lerp(.91,1,t)','lerp(.88,1.035,front)*lerp(.95,1,t)')
  .replace('const mix=smoothstep(t,0,.27);','const mix=smoothstep(t,.01,.55);')
  .replace('1-smoothstep(t,0,.14)','1-smoothstep(t,.01,.34)')
  .replace('Math.sin(theta)/.30,.14-.19*t,Math.cos(theta)/.34','Math.sin(theta)/.34,.12-.13*t,Math.cos(theta)/.35')
  .replace('smoothstep(t,.06,.43)','smoothstep(t,.13,.69)')
  .replace('const fit={sae:[.012,.90,-.081],elise:[.026,.81,-.053],grandmother:[.029,.80,-.064]};','const fit={sae:[.021,.91,-.071],elise:[.032,.82,-.062],grandmother:[.036,.81,-.067]};')
  .replace('[.010,.92,-.081]','[.020,.89,-.072]'));
 edit("rigged-scene.mjs",source=>source.replace(/\r\n/g,"\n")
  .replace('  this.hips=boneEnd(this.bones,"hips","pelvis");',`  this.fingerTipRest=new Map(this.fingers.flat().map(({tip})=>[tip,tip.position.clone()]));
  this.neck=boneEnd(this.bones,"neck");
  this.head=boneEnd(this.bones,"head");
  this.hips=boneEnd(this.bones,"hips","pelvis");`)
  .replace('  if(this.hips&&this.turnLoad>.005){',`  if(this.neck)this.neck.position.multiplyScalar(.91);
  if(this.head)this.head.position.multiplyScalar(.88);
  for(const [index,arm] of this.arms.entries()){
   arm[2].position.multiplyScalar(.96);
   for(const {joints,tip} of this.fingers[index]){
    joints[0].position.y*=.90;
    for(const segment of joints.slice(1))segment.position.multiplyScalar(.94);
    tip.position.copy(this.fingerTipRest.get(tip)).multiplyScalar(.94);
   }
  }
  this.root.updateMatrixWorld(true);
  if(this.hips&&this.turnLoad>.005){`)
  .replace('   const desired=this.gripPoint(side).lerp(target,weight);',`   const desired=this.gripPoint(side).lerp(target,weight);
   const span=worldPosition(upper).distanceTo(worldPosition(lower))+worldPosition(lower).distanceTo(worldPosition(hand));
   const palmReach=this.gripPoint(side).distanceTo(worldPosition(hand));
   const extension=desired.clone().sub(shoulder).clampLength(0,span*.985+palmReach*.78);
   desired.copy(shoulder).add(extension);`)
  .replace(',.40*weight));',',.24*weight));')
  .replace('    wrist.addScaledVector(error,.85);','    wrist.addScaledVector(error,.70);'));
};
