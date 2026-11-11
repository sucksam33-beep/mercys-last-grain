"use strict";
module.exports=edit=>edit("ResidentPortrait.mjs",s=>s.replace(/\r\n/g,"\n")
 .replace('  positions.push(values[i*3]*width,chin+y*height,values[i*3+2]*height+.018-hairline);',`  const x=values[i*3], lateral=smoothstep(Math.abs(x),.23,.51);
  const cheek=smoothstep(y,.12,.31)*(1-smoothstep(y,.67,.82));
  const rawDepth=values[i*3+2];
  const relaxed=lerp(rawDepth,Math.max(-.21,Math.min(.16,rawDepth)),lateral*cheek*.50);
  positions.push(x*width*(1-.060*lateral*cheek),chin+y*height,relaxed*height+.018-hairline);`)
 .replace('  const tone=color(mesh.faceTone[i]);\n  colors.push(tone.r,tone.g,tone.b);\n  photoMix.push(1);',`  const sideSkin=color(mesh.skin).multiplyScalar(lerp(.91,1.04,smoothstep(y,.06,.72)));
  const tone=color(mesh.faceTone[i]).lerp(sideSkin,lateral*.76);
  colors.push(tone.r,tone.g,tone.b);
  photoMix.push(1-lateral*.72);`)
 .replace(' edge.forEach((id,i)=>{const tint=color(mesh.rim[i]);colors.splice(id*3,3,tint.r,tint.g,tint.b);});',` edge.forEach((id,i)=>{
  const lateral=smoothstep(Math.abs(values[id*3]),.18,.51);
  const tint=color(mesh.rim[i]).lerp(color(mesh.skin),.46+.40*lateral);
  colors.splice(id*3,3,tint.r,tint.g,tint.b);
  photoMix[id]*=1-.73*lateral;
 });`)
 .replace('const tint=color(mesh.rim[i]).lerp(skin,smoothstep(t,.02,.69));','const tint=color(mesh.rim[i]).lerp(skin,.56+.44*smoothstep(t,.02,.68));')
 .replace('photoMix.push(1-smoothstep(t,0,.38));','photoMix.push(.15*(1-smoothstep(t,0,.23)));'));
