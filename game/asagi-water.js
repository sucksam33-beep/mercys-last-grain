"use strict";

const asagiWater={level:0,ditch:0,gate:0,velocity:1,clock:0,initialized:false,buffer:null,reversal:false};
let fishingUntil=0,fishingBuffer,sluiceAudio,districtCast=null;
function prepareSluiceAudio(){
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio)return;
 try{sluiceAudio??=new Audio();prepareWorldAudio(sluiceAudio);}catch{}
}
function playSluice(){
 if(!sluiceAudio||localStorage.getItem("returning-waters-volume")==="0")return;
 const t=sluiceAudio.currentTime;
 for(let i=0;i<6;i++){
  const strike=sluiceAudio.createOscillator(),gain=sluiceAudio.createGain(),at=t+i*.14;
  strike.type="triangle";strike.frequency.setValueAtTime(90+(i%2)*44,at);
  strike.frequency.exponentialRampToValueAtTime(37,at+.20);
  gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(.001+.059*(Number(localStorage.getItem("returning-waters-volume")??100)/100),at+.018);
  gain.gain.exponentialRampToValueAtTime(.001,at+.24);
  strike.connect(gain).connect(sluiceAudio.destination);strike.start(at);strike.stop(at+.25);
 }
}
function advanceAsagiWater(dt){
 if(s.region!==0)return;
 const reversal=s.stage>=2||(s.stage===1&&(s.day>=2||s.hour>=18));
 const target=reversal?.70:0;
 const ditch=s.stage>=2?-.44:reversal?.12:0;
 const gate=reversal?.12:.96;
 if(!asagiWater.initialized){
  Object.assign(asagiWater,{level:target,ditch,gate,velocity:reversal?-1:1,initialized:true});
 }else if(asagiWater.reversal!==reversal){
  playSluice();
 }
 asagiWater.reversal=reversal;
 asagiWater.level=lerp(asagiWater.level,target,1-Math.exp(-dt*1.35));
 asagiWater.ditch=lerp(asagiWater.ditch,ditch,1-Math.exp(-dt*1.6));
 asagiWater.gate=lerp(asagiWater.gate,gate,1-Math.exp(-dt*1.55));
 asagiWater.velocity=lerp(asagiWater.velocity,reversal?-1:1,1-Math.exp(-dt*2.5));
 asagiWater.clock+=asagiWater.velocity*dt;
}
function riverCrossSection(z){
 const end=districtRiver().findIndex((point,i)=>i>0&&point[1]>=z);
 const i=end<0?districtRiver().length-2:end-1;
 const a=districtRiver()[i],b=districtRiver()[i+1];
 const before=districtRiver()[Math.max(0,i-1)],after=districtRiver()[Math.min(districtRiver().length-1,i+2)];
 const length=b[1]-a[1],t=cap((z-a[1])/length,0,1),u=t*t,v=u*t;
 const slopeA=(b[0]-before[0])/(b[1]-before[1]),slopeB=(after[0]-a[0])/(after[1]-a[1]);
 const x=(2*v-3*u+1)*a[0]+(v-2*u+t)*length*slopeA+(-2*v+3*u)*b[0]+(v-u)*length*slopeB;
 return {x,width:18.3+1.4*Math.sin(z*.048)+.7*Math.sin(z*.105)};
}
function buildRiverSurface(){
 for(let z=-30;z<460;z+=2.5){
  const next=Math.min(z+2.5,460),a=riverCrossSection(z),b=riverCrossSection(next);
  for(const [section,along,bank] of [[a,z,0],[b,next,0],[b,next,1],[a,z,0],[b,next,1],[a,z,1]]){
   verts.push(section.x+(bank*2-1)*section.width,2.12,along,0,1,0,bank,0,0,40);
  }
 }
}
function drawRiverDrift(mesh){
 const water=asagiWater,y=2.12+water.level+.039;
 verts=[];
 for(let i=0;i<56;i++){
  const local=i<12;
  const length=local?37:405;
  const phase=((i*(local?3.15:41)+water.clock*(2.1+(i%4)*.36))%length+length)%length;
  const z=(local?180:20)+phase;
  if(Math.abs(z-player.y)>112)continue;
  const section=riverCrossSection(z);
  const x=section.x+(local?-7.2:(i%9-4)*2.11)+Math.sin(z*.21+i)*.35;
  if(terrainSurface(x,z)>y-.01)continue;
  const angle=i*2.399+Math.sin(water.clock*.9+i)*.41;
  const dx=Math.cos(angle),dz=Math.sin(angle),radius=local?.21+(i%3)*.05:.14+(i%3)*.041;
  const leaf=color(i%3===0?"#d4ac45":i%3===1?"#bb6a29":"#99a447");
  const edge=local?.095:.058;
  const tip=[x+dx*radius,y,z+dz*radius],base=[x-dx*radius,y,z-dz*radius],vein=[x,y+.024,z];
  triangle(base,[x+dz*edge,y+.01,z-dx*edge],vein,leaf,0,[0,1,0]);
  triangle(vein,[x+dz*edge,y+.01,z-dx*edge],tip,shade(leaf,1.14),0,[0,1,0]);
  triangle(base,vein,[x-dz*edge,y+.01,z+dx*edge],shade(leaf,.73),0,[0,1,0]);
  triangle(vein,tip,[x-dz*edge,y+.01,z+dx*edge],shade(leaf,.88),0,[0,1,0]);
 }
 if(!verts.length)return;
 if(!water.buffer)water.buffer=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,water.buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.DYNAMIC_DRAW);
 const count=verts.length/10;
 verts=[];
 mesh(water.buffer,count,[0,0,0],0);
}
function reflectionTarget(){
 const size=512,texture=gl.createTexture(),depth=gl.createRenderbuffer(),fbo=gl.createFramebuffer();
 gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
 for(const key of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.LINEAR);
 for(const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);
 gl.bindRenderbuffer(gl.RENDERBUFFER,depth);
 gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,size,size);
 gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
 gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
 gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);
 const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 if(ok)return {size,texture,fbo,matrix:null,last:-Infinity};
 gl.deleteRenderbuffer(depth);gl.deleteTexture(texture);gl.deleteFramebuffer(fbo);
 return null;
}
function drawRiverReflection(time,eye,at,projection,matrix,width,h,fog,mesh){
 const {uniform}=graphics;
 gl.uniform1f(uniform.reflectPass,0);
 gl.uniform1f(uniform.reflectReady,0);
 gl.uniform1i(uniform.riverMirror,3);
 const reflection=graphicsValue("reflection");
 if(!reflection)return;
 const [worldX,worldZ]=watershedXZ(s.region,player.x,player.y);
 if(riverDist(player.x,player.y)>108&&watershedCoast(worldX,worldZ)>115)return;
 gl.activeTexture(gl.TEXTURE3);
 if(asagiWater.mirror===undefined)asagiWater.mirror=reflectionTarget();
 const mirror=asagiWater.mirror;
 if(!mirror)return;
 if(mirror.region!==s.region||time-mirror.last>(s.region>=5?145:reflection===2?75:120)){
  const level=watershedWaterLevel;
  const reflectedEye=[eye[0],2*level-eye[1],eye[2]], reflectedAt=[at[0],2*level-at[1],at[2]];
  mirror.matrix=multiply(projection,view(reflectedEye,reflectedAt));
  mirror.last=time;
  mirror.region=s.region;
  gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,null);
  gl.bindFramebuffer(gl.FRAMEBUFFER,mirror.fbo);
  gl.viewport(0,0,mirror.size,mirror.size);
  gl.clearColor(...fog,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.uniform1f(uniform.reflectPass,1);
  gl.uniform3fv(uniform.camera,reflectedEye);
  gl.uniformMatrix4fv(uniform.viewProjection,false,mirror.matrix);
  mesh(graphics.world,graphics.worldCount,[0,0,0],0);
  for(const {buffer,count} of graphics.treeBatches)mesh(buffer,count,[0,0,0],0);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.viewport(0,0,width,h);
  gl.uniform1f(uniform.reflectPass,0);
  gl.uniform3fv(uniform.camera,eye);
  gl.uniformMatrix4fv(uniform.viewProjection,false,matrix);
 }
 if(mirror.matrix){
  gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,mirror.texture);
  gl.uniformMatrix4fv(uniform.reflectionView,false,mirror.matrix);
  gl.uniform1f(uniform.reflectReady,1);
 }
}
function asagiDitch(){
 const home=here("home");
 const x=home.x+6,z=home.y+3,y=height(x,z);
 const stone=color("#7d7967");
 for(const side of [-1,1]){
  for(let i=0;i<16;i++){
   const zz=z-5+i*.61;
   box(x+side*.73,y-.04,zz,.32,.65,.56,shade(stone,.81+i%4*.059),0,surface.foundation);
  }
 }
 const surfaceY=y+.48;
 quad([x-.57,surfaceY,z-5.28],[x-.57,surfaceY,z+4.45],[x+.57,surfaceY,z+4.45],[x+.57,surfaceY,z-5.28],color("#5f776b"),43);
 const marker=x+.64;
 for(let i=0;i<4;i++){
  const markY=y+.13+i*.09;
  box(marker,markY,z-1,.034,.019,.31-i*.035,color("#313e38"),0,44);
 }
}
function drawFishingRig(mesh,time,y,facing,toolTip=null){
 const cast=districtCast?.region===s.region?districtCast:null;
 if(time>=fishingUntil||(!cast&&s.region!==0)||Math.hypot(player.x-(cast?.x??506),player.y-(cast?.z??270))>32)return;
 const old=verts;
 verts=[];
 const side=Math.sign(player.x-474)||1;
 const hand=[player.x+Math.cos(facing)*.32,y+1.08,player.y-Math.sin(facing)*.32];
 const tip=toolTip??[hand[0]-side*2.48,y+2.23,hand[2]-.43];
 const bite=cast?Math.max(0,1-(4200-(fishingUntil-time))*.002):0;
 const float=[(cast?.x??474+side*8)+Math.sin(time*.003)*.12,
              2.15+(s.region===0?asagiWater.level:0)+Math.sin(time*.008)*.025-bite*.12,
              (cast?.z??270)+Math.sin(time*.002)*.27];
 const bend=tip.map((v,i)=>lerp(v,float[i],.55)-(i===1?.24:0));
 if(!toolTip)tube(hand,tip,.034,.015,[.36,.23,.11],0,6);
 tube(tip,bend,.012,.012,[.64,.59,.46],0,4);
 tube(bend,float,.012,.012,[.64,.59,.46],0,4);
 box(float[0],float[1],float[2],.10,.17,.10,[.66,.19,.07]);
 fishingBuffer??=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,fishingBuffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.DYNAMIC_DRAW);
 mesh(fishingBuffer,verts.length/10,[0,0,0],0);
 verts=old;
}

function buildTransmissiveWater(){
 if(!asagiWater.surfaceBuffer)asagiWater.surfaceBuffer=gl.createBuffer();
 verts=[];
 const tint=color("#627f67");
 for(const p of soilDryPaddies()?[]:asagiPaddies){
  const level=p.y+.135;
  const depth=(x,z)=>Math.min(level-terrainSurface(x,z)-.018,paddyEdge(p,x,z)-.05,(roadDist(x,z)-4.8)*.3);
  for(let z=Math.floor(p.z-7);z<p.z+7;z++)for(let x=Math.floor(p.x-p.w*.5);x<p.x+p.w*.5;x++){
   const corners=[[x,z],[x,z+1],[x+1,z+1],[x+1,z]];
   const depths=corners.map(([x,z])=>depth(x,z));
   for(const indices of [[0,1,2],[0,2,3]]){
    const polygon=[];
    for(let i=0;i<3;i++){
     const a=indices[i],b=indices[(i+1)%3],da=depths[a],db=depths[b];
     const [ax,az]=corners[a],[bx,bz]=corners[b];
     if(da>=0)polygon.push([ax,level,az]);
     if((da>=0)!==(db>=0)){
      const t=da/(da-db);
      polygon.push([lerp(ax,bx,t),level,lerp(az,bz,t)]);
     }
    }
    for(let i=1;i<polygon.length-1;i++)triangle(polygon[0],polygon[i],polygon[i+1],tint,46,[0,1,0]);
   }
  }
 }
 asagiWater.surfaceCount=verts.length/10;
 upload(asagiWater.surfaceBuffer);
 verts=[];
}
function opaqueWaterInput(width,height){
 let target=asagiWater.opaque;
 if(target?.width===width&&target?.height===height)return target;
 if(target){
  gl.deleteTexture(target.color);
  if(target.depth)gl.deleteTexture(target.depth);
  if(target.frame)gl.deleteFramebuffer(target.frame);
 }
 const texture=(format,internal,type,filter)=>{
  const tex=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texImage2D(gl.TEXTURE_2D,0,internal,width,height,0,format,type,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return tex;
 };
 target={width,height,color:texture(gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,gl.LINEAR),depth:null,frame:null,canReadDepth:false};
 if(typeof gl.blitFramebuffer==="function"){
  const bits=gl.getParameter(gl.DEPTH_BITS),stencil=gl.getParameter(gl.STENCIL_BITS)>0;
  if(bits===16||bits===24){
   gl.activeTexture(gl.TEXTURE5);
   target.depth=texture(stencil?gl.DEPTH_STENCIL:gl.DEPTH_COMPONENT,stencil?gl.DEPTH24_STENCIL8:bits===16?gl.DEPTH_COMPONENT16:gl.DEPTH_COMPONENT24,
    stencil?gl.UNSIGNED_INT_24_8:bits===16?gl.UNSIGNED_SHORT:gl.UNSIGNED_INT,gl.NEAREST);
   target.frame=gl.createFramebuffer();
   gl.bindFramebuffer(gl.FRAMEBUFFER,target.frame);
   gl.framebufferTexture2D(gl.FRAMEBUFFER,stencil?gl.DEPTH_STENCIL_ATTACHMENT:gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,target.depth,0);
   gl.drawBuffers([gl.NONE]);
   gl.readBuffer(gl.NONE);
   target.canReadDepth=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }
 }
 asagiWater.opaque=target;
 return target;
}
function drawTransmissiveWater(width,height,mesh){
 if(!asagiWater.surfaceCount)return;
 const {uniform}=graphics;
 gl.useProgram(graphics.program);
 if(typeof gl.bindVertexArray==="function")gl.bindVertexArray(null);
 gl.enable(gl.DEPTH_TEST);
 gl.disable(gl.CULL_FACE);
 gl.depthMask(true);
 gl.viewport(0,0,width,height);

 gl.activeTexture(gl.TEXTURE4);
 const input=opaqueWaterInput(width,height);
 gl.activeTexture(gl.TEXTURE4);
 gl.bindTexture(gl.TEXTURE_2D,input.color);
 gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,width,height);
 if(input.canReadDepth){
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,input.frame);
  gl.blitFramebuffer(0,0,width,height,0,0,width,height,gl.DEPTH_BUFFER_BIT,gl.NEAREST);
  input.canReadDepth=gl.getError()===gl.NO_ERROR;
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);
 }
 gl.activeTexture(gl.TEXTURE5);
 gl.bindTexture(gl.TEXTURE_2D,input.canReadDepth?input.depth:input.color);
 gl.uniform1i(uniform.waterColorBuffer,4);
 gl.uniform1i(uniform.waterDepthBuffer,5);
 gl.uniform1f(uniform.waterDepthReady,input.canReadDepth?1:0);
 gl.uniform2f(uniform.waterViewport,width,height);
 if(scenery){
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,scenery.texture);
  gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,scenery.normalTexture);
 }
 if(graphics.shadows){
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,graphics.shadows.texture);
 }
 if(asagiWater.mirror){
  gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,asagiWater.mirror.texture);
 }
 mesh(asagiWater.surfaceBuffer,asagiWater.surfaceCount,[0,0,0],0);
}
