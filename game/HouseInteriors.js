"use strict";
let interiorLoad,interiorTexture,interiorUniform;
function loadHouseInteriors(){
 if(interiorLoad||gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)<10)return;
 interiorLoad=true;
 const image=new Image();
 image.onload=()=>{
  const texture=gl.createTexture();
  gl.activeTexture(gl.TEXTURE9);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
  setTextureFiltering();
  gl.activeTexture(gl.TEXTURE0);
  interiorTexture=texture;
 };
 image.onerror=()=>console.warn("민가 실내 재질을 불러오지 못했습니다.");
 image.src="assets/house-interiors.png";
}
function bindHouseInteriors(){
 interiorUniform??=["interiorAtlas","interiorReady"].map(name=>gl.getUniformLocation(graphics.program,name));
 gl.uniform1i(interiorUniform[0],interiorTexture?9:0);
 gl.uniform1f(interiorUniform[1],interiorTexture?1:0);
 if(interiorTexture){
  gl.activeTexture(gl.TEXTURE9);gl.bindTexture(gl.TEXTURE_2D,interiorTexture);gl.activeTexture(gl.TEXTURE0);
 }
}
function houseApproach(x,y,doorZ,width,asagi){
 const landing=asagi?y+.43:y+.27,edge=doorZ+(asagi?1.53:.14);
 const maxRun=asagi?5.55:4.6;
 const gradeAt=(a,b)=>terrainSurface(...villagePoint(a,b));
 let run=.52;
 while(run<maxRun&&landing-gradeAt(x,edge+run)>run*.54)run+=.34;
 const end=edge+run,low=gradeAt(x,end)+.035;
 const approach=villagePoint(x,landing-low<=.12?edge:end);
 if(villageFrame)villageFrame.approach=approach;
 else buildingFootprints.at(-1).approach=approach;
 if(landing-low<=.12)return;
 const rise=landing-low,steps=Math.ceil(rise/.22),depth=run/steps,stepWidth=width+.26;
 const timber=asagi||[3,4,5,6].includes(s.region);
 const stone=villageStoneTone(),tint=timber?mix(color("#6c5945"),color(villagePalette[s.region][1]),.37):stone;
 const material=timber?architectureMaterials.wood:surface.paving;
 houseThresholdApron(x,end,stepWidth,stone);
 villageStairStructure(x,edge,end,landing,low,stepWidth,timber);
 for(let i=0;i<steps;i++){
  const near=edge+i*depth,far=near+depth,z=(near+far)*.5;
  const top=landing-rise*(i+1)/(steps+1);
  const bottom=Math.min(low,gradeAt(x,near),gradeAt(x,far),top-.105)-.025;
  const tone=shade(tint,.94+.038*Math.sin(i*1.77+x));
  const nose=Math.min(depth*.16,.052),face=top-Math.min(.037,(top-bottom)*.18);
  box(x,bottom,z-nose*.18,stepWidth*.965,face-bottom,depth-nose*.36,shade(tone,.79),0,timber?architectureMaterials.wood:surface.masonry);
  const at=(t,side,lift)=>[x+side*stepWidth*.5,top+lift,lerp(near,far,t)];
  if(timber){
   const split=.48+.055*Math.sin(i+x);
   for(const [from,to] of [[0,split-.019],[split+.019,1]]){
    const a=at(from,.985,0),b=at(from,-.985,0),c=at(to,-.985,0),d=at(to,.985,0);
    quad(a,b,c,d,tone,material);
   }
   quad(at(.98,-.985,0),at(.98,.985,0),at(1,.96,face-top),at(1,-.96,face-top),shade(tone,.84),material);
  }else{
   const shift=.11*Math.sin(i+x);
   for(const [left,right] of [[-.99,-.34+shift],[-.32+shift,.32+shift],[.34+shift,.99]]){
    const facingPoint=(t,side,lift)=>at(t,side,lift);
    villagePaver(facingPoint,.012,.992,left,right,x+i+left,tone,face-top,0);
   }
  }
  addSurface(x,z,stepWidth,depth,bottom,top).houseStep=true;
 }
}
function houseThresholdApron(x,end,width,tint){
 const verge=mix(shade(tint,.77),color(villagePalette[s.region][0]),.27);
 for(let row=0;row<3;row++){
  const near=end+row*.23,far=near+.23;
  const point=(t,side,lift)=>{
   const z=lerp(near,far,t),a=x+side*width*(.53+row*.075);
   return [a,terrainSurface(a,z)+lift,z];
  };
  for(let col=0;col<4;col++){
   const left=-1+col*.5,right=left+.5;
   quad(point(0,right,.018),point(0,left,.018),point(1,left,.018),point(1,right,.018),verge,surface.ground);
   if(row===2&&(col===0||col===3))continue;
   villagePaver(point,.055,.947,left+.027,right-.027,x+row*11+col,shade(tint,.96+.05*Math.sin(col+row)),.029,.047);
  }
 }
}
function houseStepHeight(x,z,ground){
 const nearby=sceneryCells.get(Math.floor(x/cellSize)+","+Math.floor(z/cellSize))||[];
 for(const surface of nearby){
  if(!surface.houseStep||Math.abs(x-surface.x)>surface.w*.5||Math.abs(z-surface.z)>surface.d*.5)continue;
  ground=Math.max(ground,typeof surface.top==="function"?surface.top(x,z):surface.top);
 }
 return ground;
}
function enamelBasin(x,y,z,rise,radius,tint){
 const rim=(angle,r,h)=>[x+Math.cos(angle)*r,y+h,z+Math.sin(angle)*r];
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12,b=(i+1)*Math.PI/12;
  const outerA=rim(a,radius,rise),outerB=rim(b,radius,rise);
  const innerA=rim(a,radius*.85,rise+.008),innerB=rim(b,radius*.85,rise+.008);
  quad(rim(a,radius*.58,0),rim(b,radius*.58,0),outerB,outerA,tint,71);
  quad(outerA,outerB,innerB,innerA,tint,71);
  quad(innerA,innerB,rim(b,radius*.47,.034),rim(a,radius*.47,.034),shade(tint,.75),71);
  triangle(rim(a,radius*.47,.034),rim(b,radius*.47,.034),[x,y+.034,z],shade(tint,.71),71);
 }
}
function furnishHouse(x,y,z,w,d,name){
 const base=y+.272,left=x-w*.5,right=x+w*.5,back=z-d*.5,front=z+d*.5;
 const oak=color("#766044"),linen=color("#b5a888"),iron=color("#54534e"),ceramic=color("#b2a992");
 const wicker=color("#9d8050"),dark=color("#4c3a2b"),clay=color("#817669");
 const piece=(a,b,dx,dy,dz,e,tint,kind)=>box(a,base+e,b,dx,dy,dz,tint,0,kind);
 const fixed=(name,a,b,dx,dy,dz,tint,kind)=>{
  piece(a,b,dx,dy,dz,0,tint,kind);
  addSurface(a,b,dx,dz,base,base+dy,false);
  aimBox(name,a,b,dx,dz,base,base+dy);
 };
 // Kitchen along the rear wall.
 const cookX=left+w*.26,cookZ=back+.63;
 fixed("부엌 조리대",cookX,cookZ,w*.35,.91,.80,oak,73);
 piece(cookX,cookZ,w*.37,.08,.93,.9,dark,68);
 const stoveX=left+w*.07;
 if(s.region===0&&name==="할머니의 집"&&riggedScene?.hasLivingProp("iron-stove")){
  addAsagiProp("iron-stove",stoveX,base,back+.71,.53,.79,.64,0,0,"interior");
  addSurface(stoveX,back+.71,.53,.64,base,base+.79,false);
  aimBox("무쇠 화덕",stoveX,back+.71,.53,.64,base,base+.79);
 }else fixed("무쇠 화덕",stoveX,back+.71,.53,.79,.64,iron,70);
 tube([stoveX,base+.73,back+.49],[stoveX,base+2.40,back+.49],.069,.066,iron,70,12);
 rounded(cookX-.19,base+1.12,cookZ,.16,.18,.16,iron,70);
 enamelBasin(cookX+.30,base+.99,cookZ,.07,.18,ceramic);
 piece(cookX,back+.28,w*.35,.08,.28,1.62,dark,73);
 for(const shift of [-.35,.06,.34])rounded(cookX+shift,base+1.77,back+.28,.095,.116,.095,ceramic,71);
 // Bed, mattress and layered linen at the opposite rear corner.
 const bedX=right-.83,bedZ=back+1.33;
 fixed("침실 침대",bedX,bedZ,1.21,.38,2.05,oak,73);
 piece(bedX,bedZ,1.17,.18,1.98,.38,linen,69);
 piece(bedX,bedZ+.34,1.24,.09,1.27,.54,color("#6e7766"),69);
 rounded(bedX,base+.62,bedZ-.67,.43,.11,.23,linen,69);
 piece(bedX,bedZ-1.01,1.27,.70,.12,.20,oak,73);
 for(const a of [-.59,.59])for(const b of [-.97,.97]){
  piece(bedX+a,bedZ+b,.075,b<0?.93:.53,.075,0,dark,73);
  rounded(bedX+a,base+(b<0?.93:.53),bedZ+b,.064,.061,.064,oak,73);
 }
 // Washroom with a low privacy screen and enamel fixtures.
 const washX=right-.81,washZ=front-1.29;
 fixed("화장실 칸막이",right-1.54,washZ,.085,1.80,1.37,clay,74);
 fixed("세면대",washX,washZ+.40,.55,.72,.45,oak,73);
 enamelBasin(washX,base+.72,washZ+.40,.14,.26,ceramic);
 tube([washX,base+.06,washZ-.45],[washX,base+.43,washZ-.45],.15,.22,ceramic,71,16);
 enamelBasin(washX,base+.40,washZ-.45,.12,.25,ceramic);
 // Storage shelves, crates and woven baskets near the side wall.
 const storeX=left+.58,storeZ=front-1.29;
 addSurface(storeX,storeZ,.63,1.42,base,base+1.63,false);
 aimBox("저장고 선반",storeX,storeZ,.63,1.42,base,base+1.63);
 const storageUse=Math.floor(Math.abs(x*3.7+z*5.3))%5;
 if(asagiPropsReady()&&storageUse!==4){
  addAsagiProp("wood-storage-shelf",storeX,base,storeZ,1.39,1.61,.62,Math.PI/2);
  // Keep heavy boxes low and leave room for the objects a household actually uses.
  const offset=storageUse%2===0?.22:-.24;
  if(storageUse!==2){
   addAsagiProp("woven-basket",storeX,base+1.115,storeZ+offset,.29,.25,.29,.21);
   if(s.region===0||s.region===5||s.region===6)
    addAsagiProp("woven-basket",storeX-.04,base+.65,storeZ-offset,.32,.27,.32,-.26);
  }
  if(storageUse!==3){
   const open=storageUse===2||s.region===5||s.region===6;
   addAsagiProp(open?"open-wood-crate":"closed-wood-crate",storeX,base+.17,storeZ-offset,.43,.27,.39,Math.PI/2+.12);
  }
 }else{
 piece(storeX-.29,storeZ,.07,1.61,1.42,0,oak,73);
 for(const a of [-.24,.24])for(const b of [-.65,.65])piece(storeX+a,storeZ+b,.075,1.58,.075,0,dark,73);
 for(const e of [.26,.78,1.33])piece(storeX,storeZ,.67,.065,1.39,e,oak,68);
 for(const b of [-.35,.27])tube([storeX,base+.84,storeZ+b],[storeX,base+1.16,storeZ+b],.15,.21,wicker,72,14);
 piece(storeX,storeZ-.37,.38,.25,.38,1.40,dark,73);
 }
 furnishWear(x,base,left,right,back,front,cookX);
 // Small tufts in floor cracks and around the edge of the porch.
 for(const [a,b,scale] of [[left+.17,back+.18,.20],[right-.13,front-.20,.15],[x-.86,front+.40,.31],[x+.90,front+.48,.26]]){
  const ground=b>front?terrainSurface(a,b):base;
  for(const angle of [0,Math.PI*.5]){
   const dx=Math.cos(angle)*scale*.5,dz=Math.sin(angle)*scale*.5;
   texturedQuad([[a-dx,ground,b-dz],[a+dx,ground,b+dz],
    [a+dx,ground+scale,b+dz],[a-dx,ground+scale,b-dz]],75);
  }
 }
}
