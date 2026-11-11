"use strict";

function buildingVariation(x,z,w,d,h,wall,roof,name){
 let seed=2166136261;
 for(const letter of [s.region,x,z,name].join("|")){
  seed=Math.imul(seed^letter.charCodeAt(0),16777619)>>>0;
 }
 const random=rand(seed);
 const regional=villagePalette[s.region].map(color);
 const district=villageDistricts[s.region];
 const material=mix(regional[Math.floor(random()*4)],regional[Math.floor(random()*4)],random()*.54);
 const facade=mix(wall,material,.54+random()*.25);
 const roofTone=mix(roof,color(district.roof[Math.floor(random()*district.roof.length)]),.77);
 const heightVariation=random();
 return {
  w:w*(.85+random()*.15),d:d*(.86+random()*.14),
  h:Math.max(2.45,h*.76)+h*.51*heightVariation,wall:shade(facade,.84+random()*.34),
  roof:shade(roofTone,.90+random()*.19),trim:shade(material,.60+random()*.58),
  silhouette:district.roofForms[Math.floor(random()*district.roofForms.length)],rise:(s.region===0?.38:s.region===7?.68:district.rise)+(random()-.5)*.12,
  offset:(random()-.5)*.39,side:random()<.5?-1:1,
  feature:Math.floor(random()*5),span:.72+random()*.48
 };
}

function variedRoof(x,y,z,w,d,h,tint,wall,plan){
 const overhang=s.region===0?.60:[5,6].includes(s.region)?.62:.56;
 const eave=y+h,left=x-w*overhang,right=x+w*overhang,back=z-d*overhang,front=z+d*overhang;
 const peak=eave+h*plan.rise,ridge=x+w*plan.offset;
 const roofMaterial=s.region===1?surface.slate:surface.roof;
 const wallMaterial=s.region===1?surface.masonry:surface.wall;
 if(plan.silhouette===0&&[1,2,6].includes(s.region)){
  box(x,eave,z,right-left,.21,front-back,tint,0,roofMaterial);
  architecturalRoofFace([left,eave+.211,back],[right,eave+.211,back],[right,eave+.211,front],[left,eave+.211,front],tint);
  for(const edge of [back,front])box(x,eave+.20,edge,right-left,.34,.13,wall,0,wallMaterial);
  for(const edge of [left,right])box(edge,eave+.20,z,.13,.34,front-back,wall,0,wallMaterial);
  box(ridge,eave+.21,z-d*.14,w*.28,.49,d*.31,plan.trim,0,wallMaterial);
  return;
 }
 if(plan.silhouette===2){
  const raised=plan.side>0?right:left,low=plan.side>0?left:right;
  quad([low,eave,back],[low,eave,front],[raised,peak,front],[raised,peak,back],tint,roofMaterial);
  architecturalRoofFace([low,eave,back],[raised,peak,back],[raised,peak,front],[low,eave,front],tint);
  for(const edge of [front,back])triangle([low,eave,edge],[raised,eave,edge],[raised,peak,edge],wall,wallMaterial);
  quad([raised,eave,back],[raised,eave,front],[raised,peak,front],[raised,peak,back],wall,wallMaterial);
  return;
 }
 const inset=plan.silhouette===1?d*.25:plan.silhouette===4?d*.13:0;
 const a=[ridge,peak,back+inset],b=[ridge,peak,front-inset];
 const upperLeft=[lerp(left,ridge,.44),eave+h*plan.rise*.74,back];
 const upperRight=[lerp(right,ridge,.44),eave+h*plan.rise*.74,back];
 villageRidgeCap(a,b,tint);
 if(plan.silhouette===5){
  for(const [edge,knee,tone] of [[left,upperLeft,tint],[right,upperRight,shade(tint,.84)]]){
   const end=[knee[0],knee[1],front];
   quad([edge,eave,back],knee,end,[edge,eave,front],tone,roofMaterial);
  architecturalRoofFace([edge,eave,back],knee,end,[edge,eave,front],tone);
   quad(knee,a,b,end,shade(tone,1.06),roofMaterial);
  architecturalRoofFace(knee,a,b,end,shade(tone,1.06));
   triangle([edge,eave,front],end,[ridge,eave,front],wall,wallMaterial);
   triangle(end,b,[ridge,eave,front],wall,wallMaterial);
   triangle([edge,eave,back],knee,[ridge,eave,back],wall,wallMaterial);
   triangle(knee,a,[ridge,eave,back],wall,wallMaterial);
  }
 }else{
  quad([left,eave,back],a,b,[left,eave,front],tint,roofMaterial);
  architecturalRoofFace([left,eave,back],a,b,[left,eave,front],tint);
  quad(a,[right,eave,back],[right,eave,front],b,shade(tint,.84),roofMaterial);
  architecturalRoofFace(a,[right,eave,back],[right,eave,front],b,shade(tint,.84));
  triangle([left,eave,front],b,[right,eave,front],inset?tint:wall,inset?roofMaterial:wallMaterial);
  if(inset){
   architecturalRoofHip([left,eave,front],b,[right,eave,front],tint);
   architecturalRoofHip([left,eave,back],a,[right,eave,back],shade(tint,.93));
  }
  triangle([left,eave,back],[right,eave,back],a,inset?tint:wall,inset?roofMaterial:wallMaterial);
 }
 if(plan.silhouette===3||plan.silhouette===6){
  const bx=x+plan.side*w*.23,bw=w*.25*plan.span,base=eave+.02,top=base+h*.30;
  box(bx,base,front-d*.19,bw,.32,d*.28,plan.trim,0,wallMaterial);
  triangle([bx-bw*.5,base+.32,front],[bx,top,front],[bx+bw*.5,base+.32,front],wall,wallMaterial);
  quad([bx-bw*.56,base+.32,front-d*.29],[bx,top,front-d*.29],[bx,top,front+.07],[bx-bw*.56,base+.32,front+.07],tint,roofMaterial);
  quad([bx,top,front-d*.29],[bx+bw*.56,base+.32,front-d*.29],[bx+bw*.56,base+.32,front+.07],[bx,top,front+.07],shade(tint,.85),roofMaterial);
 }
}

function variedFacade(x,y,z,w,d,h,plan){
 const front=z+d*.5,a=x+plan.side*w*.34,level=y+h*(.38+plan.offset*.45);
 const material=s.region===1?surface.masonry:surface.wall;
 if(plan.feature===0){
  for(const side of [-1,1])box(a+side*.39*plan.span,level,front+.28,.19*plan.span,.91,.12,plan.trim,0,material);
 }else if(plan.feature===1){
  box(a,level-.16,front+.23,1.07*plan.span,.17,.41,plan.trim,0,material);
  for(let i=0;i<3;i++)rounded(a+(i-1)*.29*plan.span,level+.14,front+.23,.16,.18,.13,color(i===1?"#a17d46":"#626f45"));
 }else if(plan.feature===2){
  const bx=x+plan.side*w*.36;
  box(bx,y+h*.80,z-d*.20,.43*plan.span,h*.59,.45,plan.trim,0,material);
  box(bx,y+h*1.39,z-d*.20,.62*plan.span,.12,.64,plan.trim,0,material);
 }else if(plan.feature===3){
  box(a,y+.44,front+.36,.88*plan.span,.11,.48,plan.trim,0,material);
  for(const side of [-1,1])box(a+side*.32*plan.span,y+.25,front+.36,.095,.21,.34,plan.trim,0,material);
 }else{
  const beamWidth=1.35*plan.span;
  box(a,level+1.0,front+.18,beamWidth,.12,.34,plan.trim,0,material);
  box(a,level+.64,front+.30,beamWidth*.78,.28,.13,shade(plan.trim,1.32),0,material);
 }
}
