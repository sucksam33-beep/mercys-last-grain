"use strict";
module.exports=edit=>edit("ResidentPortrait.mjs",s=>{
 const text=s.replace(/\r\n/g,"\n");
 return text
  .replace(' const faceMaterial=new THREE.MeshStandardMaterial(', ' const scalpTint={value:new THREE.Color(0xffffff)};\n const faceMaterial=new THREE.MeshStandardMaterial(')
  .replace(' faceMaterial.onBeforeCompile=shader=>{',' faceMaterial.userData.scalpTint=scalpTint;\n faceMaterial.onBeforeCompile=shader=>{\n  shader.uniforms.scalpTint=scalpTint;')
  .replace('attribute float portraitMix; varying float vPortraitMix;','attribute float portraitMix; varying float vPortraitMix; attribute float hairRoots; varying float vHairRoots;')
  .replace('vPortraitMix=portraitMix;','vPortraitMix=portraitMix; vHairRoots=hairRoots;')
  .replace('\\nvarying float vPortraitMix;")','\\nvarying float vPortraitMix; varying float vHairRoots; uniform vec3 scalpTint;")')
  .replace('diffuseColor.rgb=mix(vColor,diffuseColor.rgb,vPortraitMix);','diffuseColor.rgb=mix(vColor,diffuseColor.rgb,vPortraitMix); diffuseColor.rgb=mix(diffuseColor.rgb,scalpTint,vHairRoots*.96);')
  .replace(' actor.head.add(head,hair);',' head.material.userData.scalpTint.value.copy(hair.userData.scalpTint);\n actor.head.add(head,hair);');
});
