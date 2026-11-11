"use strict";

// Local landforms in the playable approaches. The edge tapers back into the regional terrain.
const districtDetails={
 0:{x:118,z:122,rx:29,rz:17,height:1.9,material:55},
 3:{x:157,z:149,rx:38,rz:15,height:7.6,material:56},
 4:{x:231,z:154,rx:35,rz:20,height:5.4,material:57},
 5:{x:145,z:154,rx:44,rz:11,height:1.5,material:58},
 6:{x:151,z:159,rx:32,rz:16,height:4.8,material:59},
 7:{x:149,z:151,rx:35,rz:18,height:6.1,material:60}
};
function regionalDetailRelief(region,x,z){
 const p=districtDetails[region];
 if(!p||Math.abs(x-p.x)>p.rx*1.55||Math.abs(z-p.z)>p.rz*1.55)return 0;
 const u=(x-p.x)/p.rx,v=(z-p.z-2.2*Math.sin(x*.14))/p.rz;
 const shape=Math.max(0,1-(u*u+v*v));
 if(shape<=0)return 0;
 const worn=shape*shape*(.85+.12*Math.sin(x*.34+z*.19)+.06*Math.cos(x*.79-z*.62));
 const bedding=region===3?terrainEase(.35,.54,worn)*.22:0;
 return p.height*(worn+bedding)*terrainEase(3.1,7.8,roadDist(x,z));
}
function regionalDetailPatch(region){
 const p=districtDetails[region];
 if(!p)return [];
 const grid=region===0?terrainGrid:districtTerrain;
 const align=(n,start)=>start+Math.floor((n-start)/grid.step)*grid.step;
 const x=align(p.x-p.rx-4,grid.x),z=align(p.z-p.rz-4,grid.z);
 const right=align(p.x+p.rx+grid.step+4,grid.x);
 const bottom=region===0?135:align(p.z+p.rz+grid.step+4,grid.z);
 return [{x,z,step:1,columns:right-x+1,rows:bottom-z+1}];
}
function regionalGroundMaterial(region,x,z,up){
 if(![3,4,6,7].includes(region))return 2;
 const relief=regionalDetailRelief(region,x,z);
 const exposure=terrainEase(.58,2.3,relief+(1-up)*.8);
 return districtDetails[region].material+26+.4*exposure;
}

function regionalYardDetails(){
 const p=districtDetails[s.region];
 if(!p)return;
 const random=rand(9173+s.region*631),wet=s.region===5||s.region===6;
 const tones={
 0:["#536943","#819353"],3:["#686a42","#9b8959"],4:["#6c825b","#a6aa76"],
 5:["#4f7448","#7e9356"],6:["#7c8448","#a1a45d"],7:["#52624e","#8e956f"]
 }[s.region];
 const dark=color(tones[0]),light=color(tones[1]);
 for(let i=0;i<650;i++){
  const x=p.x+(random()-.5)*p.rx*2.45,z=p.z+(random()-.5)*p.rz*2.7;
  const y=terrainSurface(x,z);
  if(roadDist(x,z)<2.8||y<2.23||!fitsTree(x,z,.55)||asagiPaddies.some(q=>s.region===0&&paddyEdge(q,x,z)>.1))continue;
  const support=supportAt(x,z,y+.12);
  if(support===null||support>y+.14)continue;
  const size=.20+random()*.65;
  if(i%13===0&&scenery){
   appendModel(scenery.boulder,x,y-.10,z,size*(.75+random()*1.05),i*2.399,surface.rock);
   continue;
  }
  const tint=mix(dark,light,random()*.80),angle=random()*6.28;
  for(let k=0;k<4;k++)curvedPlantLeaf(x,y-.018,z,angle+k*2.399,
   size*(wet?.61:.40)*(.58+random()*.74),size*(.15+random()*.34),.013+size*.035,tint,.54);
 }
}

function regionalHouseDetail(x,y,z,w,d,h,eave,ridge,alreadyRoofed=false){
 const region=s.region,p=districtDetails[region];
 if(!p)return;
 const seed=rand(Math.round(x*613+z*317)),wood=color("#655e49"),metal=color("#484f4b");
 const face=z+d*.5+.075;
 const colorByRegion={0:"#656255",3:"#857365",4:"#897b65",5:"#819082",6:"#a89973",7:"#737b7b"};
 const tint=color(colorByRegion[region]);
 if(region!==0&&!alreadyRoofed)clayRoof(x,z,w,d,eave,ridge);
 for(const sign of [-1,1]){
  const edge=x+sign*w*.58;
  tube([edge,eave-.04,z-d*.61],[edge,eave-.04,z+d*.61],.055,.055,metal,0,8);
 }
 const threshold=cap(w*.17,1.16,2.05);
 const planks=region===0||region===3||region===5||region===6;
 if(planks)for(let j=0;j<Math.floor(w/.24);j++){
  const px=x-w*.5+.13+j*.24;
  const low=Math.abs(px-x)<threshold*.53?y+2.74:y+.29;
  if(low>=eave-.02)continue;
  if(Math.abs(Math.abs(px-x)-w*.31)<w*.086)continue;
  box(px,low,face,.034,eave-low,.036,shade(tint,.74+seed()*.40),0,region===0||region===5?p.material:surface.wall);
 }
 for(const side of [-1,1]){
  const cx=x+side*w*.31,base=y+h*.44,ww=w*.13,hh=h*.29;
  box(cx,base-.048,face+.238,ww*1.24,.078,.26,tint,0,region===0||region===5?p.material:surface.foundation);
  for(const bar of [-1,0,1])box(cx+bar*ww*.40,base,face+.269,.037,hh,.04,wood);
  for(const t of [.30,.62])box(cx,base+hh*t,face+.268,ww,.035,.045,wood);
 }
 const flueX=x+w*.21,flueZ=z-d*.18,top=lerp(ridge,eave,.21/.58);
 if(region!==0){
  box(flueX,top-.14,flueZ,.42,.86,.45,tint,0,region===5?surface.foundation:p.material);
  box(flueX,top+.69,flueZ,.54,.11,.54,metal);
 }
}
