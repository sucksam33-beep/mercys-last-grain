"use strict";

// Roof, masonry, joinery and finish are drawn over the original building shell.
const architectureMaterials={wood:111,stone:112,ceramic:113,plaster:114,glass:115,metal:116};
const architectureProfiles=[
 // roof, exterior, timber, trim, glass, module, eave treatment
 ["#515a60","#e5d6bb","#624a37","#987b5c","#675c4e",.31,"tile"],
 ["#785448","#bba58c","#56493b","#c9b79a","#647376",.37,"slate"],
 ["#a86143","#c78e62","#704e36","#637b72","#627971",.33,"tile"],
 ["#71675a","#88694f","#574335","#927154","#637274",.39,"shake"],
 ["#637984","#ad834a","#594c3f","#ddd0b9","#72868b",.60,"metal"],
 ["#788480","#819487","#5e4e3f","#c4ba9e","#678483",.51,"metal"],
 ["#88765a","#d8c19b","#77634b","#729386","#66796f",.28,"thatch"],
 ["#536a75","#985b4e","#564638","#b0a48d","#7a9097",.54,"metal"],
].map(([roof,wall,wood,trim,glass,step,style])=>({roof,wall,wood,trim,glass,step,style}));
function architecturalRoofFace(a,b,c,d,tint){
 const profile=architectureProfiles[s.region],mat=architectureMaterials;
 const roof=mix(tint,color(profile.roof),.75);
 const metal=profile.style==="metal";
 const material=metal?mat.metal:profile.style==="thatch"?mat.wood:mat.ceramic;
 const lift=(p,h)=>[p[0],p[1]+h,p[2]];
 const point=(u,v)=>mix(mix(a,b,u),mix(d,c,u),v);
 quad(lift(a,.008),lift(b,.008),lift(c,.008),lift(d,.008),roof,material);
 const length=Math.max(Math.hypot(a[0]-d[0],a[2]-d[2]),Math.hypot(b[0]-c[0],b[2]-c[2]));
 const count=cap(Math.round(length/profile.step),5,32);
 if(metal){
  for(let i=0;i<=count;i++){
   const v=i/count;
   tube(lift(point(0,v),.043),lift(point(1,v),.043),.038,.038,shade(roof,i%4===0?1.31:1.15),material,4);
  }
 }else{
  const rows=profile.style==="slate"?9:profile.style==="thatch"?11:7;
  for(let row=0;row<rows;row++){
   const lo=row/rows,hi=(row+1)/rows;
   const shift=row%2*.47;
   for(let i=-1;i<count;i++){
    const left=Math.max(0,(i+shift)/count),right=Math.min(1,(i+1+shift)/count);
    if(right-left<.003)continue;
    const change=Math.sin(i*2.67+row*3.79+a[0])*.12;
    quad(lift(point(lo,left),.039),lift(point(hi-.018,left),.014),
     lift(point(hi-.018,right-.001),.014),lift(point(lo,right-.001),.039),shade(roof,1+change),material);
   }
   tube(lift(point(lo,0),.039),lift(point(lo,1),.039),.025,.025,shade(roof,.75),material,4);
  }
 }
 for(const u of [0,1])tube(lift(point(u,0),.016),lift(point(u,1),.016),.067,.067,shade(roof,.69),material,4);
 const thatch=profile.style==="thatch";
 if(s.region===0||thatch){
  const u=a[1]+d[1]<b[1]+c[1]?0:1;
  const start=point(u,0),end=point(u,1);
  const dx=end[0]-start[0],dz=end[2]-start[2];
  const span=Math.hypot(dx,dz),count=Math.min(34,Math.ceil(span/.24));
  if(span>.28)for(let i=0;i<count;i++){
   const t=(i+.5)/count,p=point(u,t);
   const inward=point(u===0?.047:.953,t);
   const tone=shade(roof,.87+.15*Math.sin(i*3.8+p[0]));
   const tip=thatch?[p[0]+(p[0]-inward[0])*.25,p[1]-.08-Math.abs(Math.sin(i*2.4))*.07,p[2]+(p[2]-inward[2])*.25]:lift(p,.033);
   tube(lift(inward,.038),tip,thatch?.051:.075,thatch?.018:.063,tone,material,5);
  }
 }

}

function architecturalRoofHip(left,peak,right,tint){
 const profile=architectureProfiles[s.region],metal=profile.style==="metal";
 const material=metal?architectureMaterials.metal:profile.style==="thatch"?architectureMaterials.wood:architectureMaterials.ceramic;
 const roof=mix(tint,color(profile.roof),.75);
 const height=(p,lift)=>[p[0],p[1]+lift,p[2]];
 const base=(u,v,lift)=>height(mix(mix(left,right,u),peak,v),lift);
 triangle(height(left,.009),height(peak,.009),height(right,.009),roof,material);
 const count=cap(Math.ceil(Math.abs(right[0]-left[0])/profile.step),6,22);
 if(metal){
  for(let i=0;i<=count;i++)tube(base(i/count,0,.041),base(i/count,1,.041),.026,.020,shade(roof,1.17),material,4);
 }else{
  for(let row=0;row<7;row++){
   const lo=row/7,hi=(row+1)/7-.008,shift=row%2*.42;
   const columns=Math.max(3,Math.round(count*(1-lo)));
   for(let i=-1;i<columns;i++){
    const a=Math.max(0,(i+shift)/columns),b=Math.min(1,(i+1+shift)/columns)-.001;
    if(b-a<.003)continue;
    quad(base(a,lo,.035),base(a,hi,.013),base(b,hi,.013),base(b,lo,.035),shade(roof,.97+.095*Math.sin(i*2.43+row)),material);
   }
  }
 }
 for(const side of [0,1])tube(base(side,0,.04),base(side,1,.04),.047,.042,shade(roof,.74),material,4);
}

function architecturalWall(x,y,z,w,d,h,plan){
 const mat=architectureMaterials,profile=architectureProfiles[s.region];
 const wall=mix(plan.wall,color(profile.wall),.64),timber=color(profile.wood),trim=color(profile.trim);
 const brick=s.region===1||s.region===2;
 const wallMat=brick?mat.stone:[0,6].includes(s.region)?mat.plaster:mat.wood;
 for(const [side,depth] of [[-1,z-d*.5],[1,z+d*.5]]){
  const bandZ=depth+side*.024;
  for(const hand of [-1,1]){
   const width=w*.49-cap(w*.17,1.16,2.05)*.5;
   const cx=x+hand*(w*.5-width*.5);
   if(side===1)box(cx,y+.29,bandZ,width,h-.08,.035,wall,0,wallMat);
  }
  if(side===-1)box(x,y+.29,bandZ,w-.10,h-.08,.035,wall,0,wallMat);
  if(brick){
   for(const edge of [-1,1])for(let n=0;n<7;n++)
    box(x+edge*(w*.5-.14),y+.30+n*(h-.11)/7,bandZ+side*.04,n%2?.42:.62,(h-.11)/7-.045,.09,shade(trim,n%2?.77:.92),0,mat.stone);
  }else if(s.region===0){
   for(const edge of [-1,1])box(x+edge*(w*.5-.11),y+.24,bandZ+side*.064,.18,h,.11,timber,0,mat.wood);
   box(x,y+h*.78,bandZ+side*.069,w,.13,.13,timber,0,mat.wood);
  }else{
   const courses=s.region===3||s.region===7?11:s.region===6?3:8;
   for(let n=1;n<courses;n++){
    const level=y+.32+(h-.13)*n/courses;
    if(side===-1||level>y+cap(h*.66,2.24,2.47)+.30)
     box(x,level,bandZ+side*.051,w-.06,.024,.045,shade(timber,.65),0,mat.wood);
    else for(const hand of [-1,1]){
     const span=w*.48-cap(w*.17,1.16,2.05)*.5;
     box(x+hand*(w*.5-span*.5),level,bandZ+side*.051,span,.024,.045,shade(timber,.65),0,mat.wood);
    }
   }
  }
 }
 for(const sign of [-1,1])box(x+sign*(w*.5+.023),y+.29,z,.039,h-.08,d-.035,shade(wall,.94),0,wallMat);
 // Foundation courses retain the original stone slab and do not affect collision.
 for(let row=0;row<2;row++){
  const count=Math.ceil(w/.74);
  for(let i=0;i<count;i++){
   const width=w/count;
   const a=x-w*.5+(i+.5)*width;
   box(a,y-.18+row*.20,z+d*.5+.204,width-.031,.16,.055,shade(color("#817964"),.83+.16*Math.sin(i*2.2+row)),0,mat.stone);
  }
 }
}
function architecturalFloor(x,y,z,w,d){
 const mat=architectureMaterials,profile=architectureProfiles[s.region];
 const wood=color(profile.wood),stone=s.region===1||s.region===2;
 const count=Math.ceil(w/.34),width=w/count;
 for(let i=0;i<count;i++){
  const a=x-w*.5+(i+.5)*width;
  const wear=Math.max(0,1-Math.abs(a-x)/Math.max(.65,w*.17));
  const shadeValue=.96+.12*Math.sin(i*2.4+x*.49)+wear*.12;
  box(a,y+.275,z,width-.012,.019,d-.16,shade(wood,shadeValue),0,mat.wood);
 }
 const threshold=cap(w*.17,1.16,2.05)+.18;
 const front=z+d*.5;
 box(x,y+.269,front,threshold,.031,.27,shade(wood,1.27),0,stone?mat.stone:mat.wood);
}

function architecturalJoinery(x,y,z,w,d,h,plan){
 const mat=architectureMaterials,profile=architectureProfiles[s.region];
 const timber=color(profile.wood),trim=color(profile.trim),front=z+d*.5;
 const stone=s.region===1||s.region===2;
 const postMat=stone?mat.stone:mat.wood;
 const post=stone?.26:.20,base=y+.27;
 for(const sign of [-1,1]){
  const a=x+sign*(w*.5-.18);
  box(a,base,front+.10,post,h-.26,post,trim,0,postMat);
  for(const offset of [0,h-.47])box(a,base+offset,front+.10,post*1.55,.18,post*1.55,shade(trim,.80),0,postMat);
  if([0,3,4,5,6].includes(s.region)){
   tube([a,y+h*.80,front+.22],[a-sign*.37,y+h*.93,front+.37],.073,.058,shade(timber,1.25),mat.wood,4);
  }
 }
 box(x,y+h-.065,front+.098,w+.12,.16,.23,shade(timber,1.19),0,mat.wood);
 if([0,3,5,6].includes(s.region)){
  const span=w*.94,n=Math.ceil(span/.52);
  for(let i=0;i<=n;i++){
   const a=x-span*.5+i*span/n;
   box(a,y+h-.19,front+.19,.105,.15,.55,shade(timber,.88+(i%3)*.09),0,mat.wood);
  }
 }
 const door=cap(w*.17,1.16,2.05),top=cap(h*.66,2.24,2.47);
 for(const sign of [-1,1])box(x+sign*(door*.5+.075),base,front+.111,.124,top+.13,.16,trim,0,postMat);
 box(x,base+top+.035,front+.111,door+.36,.16,.18,trim,0,postMat);
}
function architecturalWindows(x,y,z,w,d,h,plan){
 const mat=architectureMaterials,profile=architectureProfiles[s.region];
 const trim=color(profile.trim),shadow=color(profile.wood),glass=color(profile.glass);
 const height=h*(s.region===1?.33:.26),width=w*(s.region===0?.20:s.region===1?.135:.15);
 function windowAt(a,b,axis,sign,level){
  const piece=(u,v,depth,width,height,thick,tint,material)=>
   box(a+(axis===0?u:sign*depth),level+v,b+(axis===0?sign*depth:u),
    axis===0?width:thick,height,axis===0?thick:width,tint,0,material);
  piece(0,0,.04,width+.15,height+.15,.11,shade(shadow,.72),mat.wood);
  piece(0,.08,.115,width-.075,height-.05,.04,glass,mat.glass);
  for(const edge of [-1,1])piece(edge*width*.5,.034,.17,.062,height+.13,.083,trim,mat.wood);
  for(const rise of [.045,height+.13])piece(0,rise,.17,width+.10,.065,.083,trim,mat.wood);
  piece(0,height*.53,.183,width,.047,.065,trim,mat.wood);
  const bars=s.region===0?7:s.region===7?2:1;
  for(let i=1;i<=bars;i++)piece((i/(bars+1)-.5)*width,.06,.183,.047,height+.09,.065,trim,mat.wood);
  piece(0,0,.15,width+.24,.079,.235,shade(trim,1.17),mat.wood);
 }
 for(const side of [-1,1]){
  const a=x+side*w*.28;
  windowAt(a,z+d*.5,0,1,y+h*.39);
  windowAt(x+side*w*.49,z-d*.19,1,side,y+h*.39);
 }
 if(s.region===1&&h>4.1){
  for(const side of [-1,1])windowAt(x+side*w*.28,z+d*.5,0,1,y+h*.76);
 }
}

function dressAsagiGranary(x,z,floor){
 const house=buildingFootprints.find(p=>p.x===x&&p.z===z&&p.insideW);
 const {insideW:w,insideD:d,wallHeight:h}=house;
 const wood=color("#624735"),stone=color("#8e8570"),canvas=color("#b9a278");
 const front=z+d*.5,mat=architectureMaterials;
 // The entrance stays open between the two stacks and underneath the porch beams.
 for(const side of [-1,1]){
  const a=x+side*(w*.5-.47);
  box(a,floor-.43,front+1.23,.52,.49,.54,stone,0,mat.stone);
  box(a,floor,front+1.23,.27,h*.65,.29,wood,0,mat.wood);
  for(let i=0;i<3;i++){
   const b=z-d*.29+i*.94;
   const size=.40+i%2*.08;
   rounded(x+side*(w*.5-1.06),floor+size*.47,b,size,size*.49,size*.46,shade(canvas,.82+i*.085),mat.plaster);
   rounded(x+side*(w*.5-1.06),floor+size*.98,b,.09,.05,.07,wood,mat.wood);
  }
 }
 box(x,floor+h*.66,front+1.22,w*.93,.24,.26,wood,0,mat.wood);
 houseLamp(x,floor-.27,z,w*.44,front,true);
 for(const side of [-1,1]){
  const px=x+side*(w*.5-1.9),pz=z+d*.14;
  const crate=shade(wood,side>0?1.11:.91);
  box(px,floor,pz,1.17,.67,.85,crate,0,mat.wood);
  for(const q of [-.43,.43])box(px+q,floor+.08,pz+.446,.09,.49,.08,shade(crate,1.28),0,mat.wood);
 }
}

function asagiGranaryApproach(x,y,doorZ,doorWidth){
 const near=doorZ+1.49,far=asagiGranary.z+12.55,width=doorWidth+.66;
 const top=y+.43,foot=terrainSurface(x,far)+.05;
 const grade=(_,z)=>lerp(top,foot,cap((z-near)/(far-near),0,1));
 const underside=Math.min(top,foot)-.22;
 addSurface(x,(near+far)*.5,width,far-near,underside,grade).houseStep=true;
 const step=addSurface(x,near-.09,width,.24,y+.12,top);
 step.houseStep=true;
 const mat=architectureMaterials.wood,wood=color("#68523c");
 const boards=Math.ceil((far-near)/.23);
 for(let i=0;i<boards;i++){
  const a=lerp(near,far,i/boards),b=lerp(near,far,(i+.96)/boards);
  const left=x-width*.5,right=x+width*.5;
  quad([left,grade(x,a)+.01,a],[right,grade(x,a)+.01,a],
   [right,grade(x,b)+.01,b],[left,grade(x,b)+.01,b],shade(wood,.90+.16*Math.sin(i*2.7)),mat);
 }
 for(const side of [-1,1]){
  const a=x+side*(width*.5-.067);
  tube([a,top-.065,near],[a,foot-.065,far],.082,.064,shade(wood,.78),mat,4);
 }
 buildingFootprints.at(-1).approach=[x,far];
}
