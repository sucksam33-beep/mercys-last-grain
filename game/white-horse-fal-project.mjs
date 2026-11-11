import * as T from "./vendor/three/three.module.min.js";

// Project the Fal source's actual color map onto the repaired rest shape.
// Source geometry is used for correspondence only, never added to the scene.
export function projectFalHorseCoat(target,source){
 const mesh=source.getObjectByProperty("isMesh",true),texture=mesh?.material.map;
 if(!texture?.image)return false;
 const {width,height}=texture.image,canvas=document.createElement("canvas");
 canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext("2d",{willReadFrequently:true});
 ctx.drawImage(texture.image,0,0);
 const pixels=ctx.getImageData(0,0,width,height).data;
 const rest=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv,sourceNormal=mesh.geometry.attributes.normal;
 const bins=new Map(),cell=.047,color=new T.Color(),ivory=new T.Color("#eee9e3"),targetN=new T.Vector3(),sampleN=new T.Vector3();
 const grid=n=>Math.floor(n/cell),key=(x,y,z)=>x+","+y+","+z;
 for(let i=0;i<rest.count;i++){
  const x=rest.getX(i),y=rest.getY(i),z=rest.getZ(i);
  const u=T.MathUtils.clamp(Math.round(uv.getX(i)*(width-1)),0,width-1);
  const t=texture.flipY?1-uv.getY(i):uv.getY(i);
  const v=T.MathUtils.clamp(Math.round(t*(height-1)),0,height-1);
  const j=(v*width+u)*4;
  const k=key(grid(x),grid(y),grid(z));
  if(!bins.has(k))bins.set(k,[]);
  bins.get(k).push([x,y,z,pixels[j]/255,pixels[j+1]/255,pixels[j+2]/255,sourceNormal.getZ(i),sourceNormal.getY(i),-sourceNormal.getX(i)]);
 }
 const positions=target.attributes.position,colors=target.attributes.color,normals=target.attributes.normal;
 for(let i=0;i<positions.count;i++){
  const px=positions.getX(i),py=positions.getY(i),pz=positions.getZ(i);
  if(py<.33)continue;
  const face=T.MathUtils.smoothstep(pz,.58,.95)*T.MathUtils.smoothstep(py,1.25,1.58);
  const x=-pz/2.65-.015,y=py/2.65-.372-.013*face,z=px/2.65;
  const gx=grid(x),gy=grid(y),gz=grid(z);
  targetN.fromBufferAttribute(normals,i);
  let r=0,g=0,b=0,nx=0,ny=0,nz=0,total=0,nearest=.012;
  for(let dz=-1;dz<=1;dz++)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const group=bins.get(key(gx+dx,gy+dy,gz+dz));if(!group)continue;
   for(const p of group){
    const alignment=targetN.x*p[6]+targetN.y*p[7]+targetN.z*p[8];
    const d=(x-p[0])**2+1.32*(y-p[1])**2+1.7*(z-p[2])**2+Math.max(0,.80-alignment)*.0018;
    if(d>.0065)continue;
    if(d<nearest)nearest=d;
    const w=1/(d+.000052)**2.65;
    r+=p[3]*w;g+=p[4]*w;b+=p[5]*w;total+=w;
    nx+=p[6]*w;ny+=p[7]*w;nz+=p[8]*w;
   }
  }
  if(!total)continue;
  color.setRGB(r/total,g/total,b/total,T.SRGBColorSpace);
  // The generation carries studio shadows. Temper them where game lighting supplies its own.
  color.lerp(ivory,.23-.09*face);
  const fit=1-T.MathUtils.smoothstep(nearest,.0016,.0065);
  const blend=(.48+.38*face)*fit;
  sampleN.set(nx,ny,nz).normalize();
  const normalFit=T.MathUtils.smoothstep(sampleN.dot(targetN),.70,.95)*fit;
  targetN.lerp(sampleN,normalFit*(.14+.14*face)).normalize();
  normals.setXYZ(i,targetN.x,targetN.y,targetN.z);
  colors.setXYZ(i,T.MathUtils.lerp(colors.getX(i),color.r,blend),
   T.MathUtils.lerp(colors.getY(i),color.g,blend),T.MathUtils.lerp(colors.getZ(i),color.b,blend));
 }
 colors.needsUpdate=true;normals.needsUpdate=true;
 return true;
}
