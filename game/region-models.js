"use strict";

function saguaro(x,y,z,h,seed){
 if(paintRegionalTree(x,y,z,h,seed,0))return;
 const random=rand(seed),r=h*(.043+random()*.017);
 const olive=color("#657347");
 function stem(nodes){
  const sides=36;
  const rings=nodes.map(([x,y,z,radius],i)=>{
   const a=nodes[Math.max(0,i-1)],b=nodes[Math.min(nodes.length-1,i+1)];
   const axis=unit(sub(b.slice(0,3),a.slice(0,3)));
   const side=unit(cross(axis,[0,0,1])),normal=cross(axis,side);
   return Array.from({length:sides},(_,j)=>{
    const t=j*Math.PI*2/sides, ridge=j%2===0?1:.82;
    return [x,y,z].map((v,k)=>v+(side[k]*Math.cos(t)+normal[k]*Math.sin(t))*radius*ridge);
   });
  });
  for(let i=1;i<rings.length;i++)for(let j=0;j<sides;j++){
   const next=(j+1)%sides;
   const a=rings[i-1][j],b=rings[i-1][next],c=rings[i][next],d=rings[i][j];
   quad(a,b,c,d,shade(olive,(j%2?.85:1.04)+.12*Math.sin(j*4.32+seed)));
  }
 }
 stem([[x,y-.15,z,r*.75],[x,y+h*.09,z,r],[x+r*.2,y+h*.48,z,r*.94],
  [x+r*.31,y+h*.92,z,r*.75],[x+r*.31,y+h*.985,z,r*.44],[x+r*.31,y+h,z,.012]]);
 for(let i=0;i<(seed%4===0?1:2);i++){
  const a=seed*2.399+i*2.9,dx=Math.cos(a),dz=Math.sin(a);
  const base=y+h*(.36+i*.16+random()*.07), reach=r*(2.3+random()*.9);
  const rise=h*(.20+random()*.14);
  const point=(t,l,w)=>[x+dx*reach*t,base+rise*l,z+dz*reach*t,r*w];
  stem([point(.07,0,.72),point(.38,.015,.78),point(.72,.10,.73),point(.94,.27,.69),
   point(1,.48,.62),point(1.02,.90,.49),point(1.02,.98,.30),point(1.02,1,.025)]);
 }
}

function broadleafTree(x,y,z,h,seed,kind){
 if(silhouetteTreeRange(x,z)&&craftedCanopy(x,y,z,h,seed,false,h<10))return;
 if((s.region===5||s.region===6)&&paintRegionalTree(x,y,z,h,seed))return;
 if(wildVegetationReady&&paintRegionalTree(x,y,z,h,seed,kind==="aspen"?51:kind==="cypress"?52:kind==="baobab"?53:50))return;
 const random=rand(seed),baobab=kind==="baobab",cypress=kind==="cypress",aspen=kind==="aspen";
 const radius=h*(baobab?.138:cypress?.056:aspen?.019:.044);
 const lean=(random()-.5)*h*.14;
 const trunk=[0,.10,.40,.69,.90,1].map((t,i)=>[
  x+lean*t*t,y+h*t,z,radius*(baobab?[.89,1,.90,.71,.36,.07]:[1.5,1,.71,.47,.22,.02])[i]
 ]);
 pineLimb(trunk,seed);
 if(cypress||baobab)for(let i=0;i<6;i++){
  const a=i*1.047+random()*.42,dx=Math.cos(a),dz=Math.sin(a);
  const end=radius*(1.8+random()*1.4);
  pineLimb([[x,y+h*.10,z,radius*.44],[x+dx*end*.55,y+.06,z+dz*end*.55,radius*.23],
   [x+dx*end,y-.08,z+dz*end,.022]],seed+i);
  if(cypress)pileRoot(x+dx*end*1.17,y,z+dz*end*1.17,h*.08*(.65+random()));
 }
 const branches=baobab?6:aspen?7:8;
 for(let i=0;i<branches;i++){
  const a=i*2.399+seed*.14,dx=Math.cos(a),dz=Math.sin(a);
  const reach=h*(baobab?.32:aspen?.20:.30)*(.70+random()*.46);
  const base=y+h*(baobab?.72:.45+i/branches*.42),rise=h*(baobab?.23:.10);
  const point=(t,j,r)=>[x+dx*reach*t,base+rise*j,z+dz*reach*t,radius*r];
  pineLimb([point(0,0,.50),point(.36,.34,.32),point(.72,.54,.18),point(1,1,.027)],seed+i);
  for(let twig=0;twig<3;twig++){
   const sign=twig%2?1:-1,t=.56+twig*.20;
   const bx=x+dx*reach*t,bz=z+dz*reach*t,by=base+rise*t;
   const tx=bx-dz*reach*.33*sign,tz=bz+dx*reach*.33*sign,ty=by+rise*.32;
   pineLimb([[bx,by,bz,radius*.15],[tx,ty,tz,radius*.012]],seed+i+twig);
   const spread=reach*(baobab?.36:.57),lift=h*(aspen?.135:.10);
   for(let plane=0;plane<3;plane++){
    const theta=plane*2.094+a,xx=Math.cos(theta)*spread,zz=Math.sin(theta)*spread;
    texturedQuad([[tx-xx,ty-lift*.26,tz-zz],[tx+xx,ty-lift*.27,tz+zz],
     [tx+xx*.75,ty+lift,tz+zz*.75],[tx-xx*.73,ty+lift*.83,tz-zz*.73]],50,.76+random()*.30);
   }
   if(cypress)for(let moss=0;moss<2;moss++){
    const mx=tx+(random()-.5)*spread,mz=tz+(random()-.5)*spread;
    curvedPlantLeaf(mx,ty,mz,a+moss*1.6,-h*(.075+random()*.07),.08,.036,color("#8e9470"),.2);
   }
  }
 }
}

function pileRoot(x,y,z,h){
 taper(x,y-.05,z,h,h*.24,.023,color("#655d42"),8);
}
