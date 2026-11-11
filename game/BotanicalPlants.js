let plantTexture=null,plantTextureLoading=false,plantAtlasAttempts=0,plantAtlasRetryAt=0,wildVegetationReady=false;
const plantUniforms=new Map();
const botanicalSpecies={
 2:{first:12,ground:[3,3,1,2,16,17,18,20,21],trees:[42,43]},
 5:{first:22,ground:[6,7,7,22,23,27,28,29,30,31],trees:[4,44]},
 6:{first:32,ground:[11,11,35,36,37,38,39,40,41],trees:[8,9,10,45,33]}
};

function floraImage(path){
 return new Promise((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>resolve(image);
  image.onerror=reject;
  image.src=path;
 });
}

function copyFloraCells(context,tile,wild,columns,bands,first){
 const source=document.createElement("canvas");
 source.width=wild.width;source.height=wild.height;
 const sourceCtx=source.getContext("2d",{willReadFrequently:true});
 sourceCtx.drawImage(wild,0,0);
 const pixels=sourceCtx.getImageData(0,0,source.width,source.height);
 for(let i=0;first===46&&i<pixels.data.length;i+=4){
  const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
  const low=Math.min(r,g,b),chroma=Math.max(r,g,b)-low;
  const matte=cap((low-164)/66,0,1)*(1-cap((chroma-7)/39,0,1));
  pixels.data[i+3]*=1-matte;
 }
 sourceCtx.putImageData(pixels,0,0);
 const rows=bands.map(y=>Math.round(y*source.height/1024));
 for(let i=0;i<columns*(rows.length-1);i++){
  const column=i%columns,row=Math.floor(i/columns),slot=first+i;
  const x=column*source.width/columns,y=rows[row],w=source.width/columns,h=rows[row+1]-y;
  const dx=(slot%8)*tile,dy=Math.floor(slot/8)*tile;
  context.clearRect(dx,dy,tile,tile);
  context.drawImage(source,x,y,w,h,dx+7,dy+7,tile-14,tile-14);
 }
}

let wildAccentsReady=false;
function combinePlantAtlases(existing,wild,accents,limit){
 const canvas=document.createElement("canvas");
 canvas.width=Math.min(existing.width,limit);canvas.height=Math.min(existing.height,limit);
 const context=canvas.getContext("2d"),tile=canvas.width/8;
 context.drawImage(existing,0,0,canvas.width,canvas.height);
 if(wild)copyFloraCells(context,tile,wild,4,[32,332,636,1024],46);
 if(accents)copyFloraCells(context,tile,accents,2,[0,512,1024],58);
 return canvas;
}

function loadPlantAtlas(){
 if(plantTexture||plantTextureLoading||plantAtlasAttempts>=3||performance.now()<plantAtlasRetryAt||!gl||gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)<9)return;
 const limit=gl.getParameter(gl.MAX_TEXTURE_SIZE);
 if(limit<512)return;
 plantTextureLoading=true;plantAtlasAttempts++;
 Promise.all([floraImage("assets/botanical-plants.webp"),
  floraImage("assets/wild-vegetation.png").catch(()=>null),
  floraImage("assets/wild-accents.png").catch(()=>null)]).then(([existing,wild,accents])=>{
  const image=wild||accents||existing.width>limit||existing.height>limit?combinePlantAtlases(existing,wild,accents,limit):existing;
  const texture=gl.createTexture();
  if(!texture)throw Error("식물 텍스처를 준비할 수 없습니다.");
  gl.activeTexture(gl.TEXTURE8);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
  setTextureFiltering();
  gl.activeTexture(gl.TEXTURE0);
  plantTexture=texture;
  wildVegetationReady=Boolean(wild);
  wildAccentsReady=Boolean(accents);
  loadedScene="";
 }).catch(()=>{
  plantAtlasRetryAt=performance.now()+1500*plantAtlasAttempts;
  console.warn("식물 텍스처를 불러오지 못했습니다.");
 }).finally(()=>{plantTextureLoading=false;});
}

function bindPlantAtlas(program){
 if(!plantUniforms.has(program))plantUniforms.set(program,gl.getUniformLocation(program,"plantAtlas"));
 gl.uniform1i(plantUniforms.get(program),plantTexture?8:0);
 if(!plantTexture)return;
 gl.activeTexture(gl.TEXTURE8);
 gl.bindTexture(gl.TEXTURE_2D,plantTexture);
 gl.activeTexture(gl.TEXTURE0);
}

function plantPatch(points,normals,uv,slot,material){
 for(const i of [0,1,2,0,2,3])verts.push(...points[i],...normals[i],...uv[i],slot,material);
}

// Curved sheets share the same texel mask in the lit, reflection and shadow passes.
function plantSheet(x,y,z,w,h,a,bend,slot,lean=0){
 const right=[Math.cos(a),0,Math.sin(a)],forward=[-right[2],0,right[0]];
 const point=(u,t)=>{
  const bow=Math.sin(t*Math.PI)*bend+t*lean+Math.sin(t*Math.PI)*Math.abs(u-.5)*w*.19;
  return [x+right[0]*(u-.5)*w+forward[0]*bow,y+h*t,z+right[2]*(u-.5)*w+forward[2]*bow];
 };
 for(let i=0;i<3;i++){
  const a=i/3,b=(i+1)/3;
  for(const [left,right] of [[0,.5],[.5,1]]){
   const corners=[point(left,a),point(right,a),point(right,b),point(left,b)];
   const normal=unit(cross(sub(corners[1],corners[0]),sub(corners[3],corners[0])));
   plantPatch(corners,[normal,normal,normal,normal],[[left,1-a],[right,1-a],[right,1-b],[left,1-b]],slot,63);
  }
 }
}

const addFlora=(a,b)=>a.map((value,index)=>value+b[index]);

// Each leaf has a raised midrib. The two sides catch light independently.
function foldedFloraLeaf(root,tip,side,width,ridge,tint){
 const middle=mix(root,tip,.44);
 const left=middle.map((value,i)=>value+side[i]*width);
 const right=middle.map((value,i)=>value-side[i]*width);
 const spine=addFlora(middle,ridge);
 const emit=(a,b,c,weights,color)=>{
  const normal=unit(cross(sub(b,a),sub(c,a)));
  for(const [i,point] of [a,b,c].entries())verts.push(...point,...normal,...color,47+.39*weights[i]);
 };
 emit(root,left,spine,[.08,.53,.48],tint);
 emit(left,tip,spine,[.53,1,.48],tint);
 emit(root,spine,right,[.08,.48,.53],shade(tint,.80));
 emit(spine,tip,right,[.48,1,.53],shade(tint,.87));
}

function groundFloraVolume(x,y,z,size,angle,slot){
 const dry=slot===55||slot===58;
 const broad=slot===57||slot===59||slot===60||slot===61;
 const tint=color(dry?"#a19354":slot===61?"#627052":"#718644");
 for(let i=0;i<(broad?4:5);i++){
  const a=angle+i*2.399,dx=Math.cos(a),dz=Math.sin(a);
  const reach=size*(broad?.40:.22)*(1+(i%3)*.21);
  const height=size*(broad?.28:.66)*(.71+(i%4)*.14);
  const root=[x+dx*size*.07,y,z+dz*size*.07];
  const elbow=[root[0]+dx*reach*.38,y+height*.75,root[2]+dz*reach*.38];
  const tip=[root[0]+dx*reach,y+height,root[2]+dz*reach];
  const side=[-dz,0,dx],width=size*(broad?.084:.022);
  if(!broad&&size>.58){
   foldedFloraLeaf(root,elbow,side,width,[0,size*.022,0],shade(tint,.80+(i%3)*.13));
   foldedFloraLeaf(elbow,tip,side,width*.66,[0,size*.014,0],tint);
  }else foldedFloraLeaf(root,tip,side,width,[0,size*.029,0],shade(tint,.80+(i%3)*.13));
 }
}

function wildGroundPlant(x,y,z,size,angle,slot,volume=false){
 if(slot<58?!wildVegetationReady:!wildAccentsReady)return false;
 if(volume&&size>.31)groundFloraVolume(x,y,z,size,angle,slot);
 for(let layer=0;layer<2;layer++){
  const a=angle+layer*1.67,offset=layer*size*.11;
  plantSheet(x+Math.cos(a)*offset,y-size*.08,z+Math.sin(a)*offset,
   size*(.89-layer*.13),size*(1-layer*.19),a,size*.10,slot,size*.12);
 }
 return true;
}

function coniferNeedles(root,tip,radius,tint,random,count){
 const axis=unit(sub(tip,root));
 const side=unit(cross(axis,Math.abs(axis[1])>.90?[1,0,0]:[0,1,0]));
 const up=cross(axis,side);
 for(let i=0;i<count;i++){
  const angle=i*2.399,offset=.20+.77*(i/count);
  const base=mix(root,tip,offset);
  const around=side.map((value,k)=>value*Math.cos(angle)+up[k]*Math.sin(angle));
  const reach=radius*(.56+random()*.62);
  const end=base.map((value,k)=>value+around[k]*reach+axis[k]*reach*.47);
  const span=cross(axis,around).map(value=>value*reach*.13);
  const left=addFlora(base,span),right=sub(base,span),normal=unit(cross(sub(right,left),sub(end,left)));
  const color=shade(tint,.75+random()*.35);
  verts.push(...left,...normal,...color,47.10,...right,...normal,...color,47.10,...end,...normal,...color,47.33);
 }
}

function coniferForks(root,end,reach,angle,h,radius,slot,seed,detailed){
 const random=rand(seed),tint=color(slot===48?"#526d55":slot===47?"#657343":"#486440");
 for(let fork=0;fork<(detailed?3:2);fork++){
  const sign=fork%2?1:-1,start=mix(root,end,.34+fork*.135);
  const azimuth=angle+sign*(.62+random()*.43);
  const span=reach*(.43-fork*.043);
  const lift=h*(fork%3===0?-.034:.027)*(1+random()*.49);
  const forkTip=[start[0]+Math.cos(azimuth)*span,start[1]+lift,start[2]+Math.sin(azimuth)*span];
  const joint=mix(start,forkTip,.49);
  if(detailed)tube(start,forkTip,radius*.11,.005,shade(tint,.55),80.10,4,80.32);
  coniferNeedles(start,forkTip,reach*.125,tint,random,detailed?10:5);
  const twigAngle=azimuth+sign*.72;
  const tip=[joint[0]+Math.cos(twigAngle)*span*.57,joint[1]-lift*.71,joint[2]+Math.sin(twigAngle)*span*.57];
  if(detailed)coniferNeedles(joint,tip,reach*.10,tint,random,7);
 }
}

function wildConifer(x,y,z,h,seed,detailed){
 if(!wildVegetationReady||!scenery)return false;
 const random=rand(seed),angle=random()*Math.PI*2;
 const slot=s.region===0?49:s.region===7?48:s.region===3?(seed%4===0?47:46):47;
 const narrow=slot===48||s.region===4,lean=(random()-.5)*h*.10;
 const trunk=t=>[x+lean*t*t,y+h*t,z];
 const radius=h*(slot===47?.043:.035);
 pineLimb([0,.23,.53,.77,1].map(t=>[...trunk(t),radius*(1-t*.96)]),seed);
 const tiers=detailed?8:6;
 for(let layer=0;layer<tiers;layer++){
  const t=.27+layer*.67/tiers;
  const branches=detailed?6:4;
  for(let branch=0;branch<branches;branch++){
   const a=angle+layer*1.19+branch*2*Math.PI/branches+(random()-.5)*.48;
   const dx=Math.cos(a),dz=Math.sin(a);
   const root=trunk(t+(random()-.5)*.07);
   const reach=h*(narrow?.32:.41)*Math.pow(1-t,.83)*(.79+random()*.42);
   const lift=h*(slot===46?-.037:.016)+(random()-.5)*h*.043;
   const end=[root[0]+dx*reach,root[1]+lift,root[2]+dz*reach];
   const limbSeed=seed+layer*97+branch*11;
   if(detailed){
    pineLimb([[...root,radius*.38],[...mix(root,end,.57),radius*.16],[...end,.012]],limbSeed,.39);
   }
   coniferForks(root,end,reach,a,h,radius,slot,limbSeed,detailed);
   const width=reach*(.62+random()*.18), thickness=reach*.40;
   const foliage=(tilt,offset)=>{
    const start=mix(root,end,offset),tip=[end[0]+dx*reach*.23,end[1]+tilt,end[2]+dz*reach*.23];
    const left=[-dz*width*.5,thickness*.30,dx*width*.5];
    const right=[dz*width*.5,-thickness*.30,-dx*width*.5];
    const corners=[addFlora(start,right),addFlora(tip,right),addFlora(tip,left),addFlora(start,left)];
    const normal=unit(cross(sub(corners[1],corners[0]),sub(corners[3],corners[0])));
    plantPatch(corners,[normal,normal,normal,normal],[[1,1],[0,1],[0,0],[1,0]],slot,63);
   };
   foliage(lift,.22);
   if(detailed||branch%2===0)foliage(thickness*.81,.41);
   const fringe=mix(root,end,.77);
   plantSheet(fringe[0],fringe[1]-reach*.24,fringe[2],reach*.79,reach*.47,
    a+.29,reach*.09,slot,reach*.08);
  }
 }
 plantSheet(x+lean*.88,y+h*.83,z,h*.18,h*.19,angle,h*.013,slot);
 plantSheet(x+lean*.88,y+h*.83,z,h*.18,h*.19,angle+1.57,h*.013,slot);
 return true;
}
function paintRegionalPlant(x,y,z,seed,slot){
 const profile=botanicalSpecies[s.region];
 if(!plantTexture||!profile)return false;
 const rng=rand(seed);
 slot??=profile.ground[Math.floor(rng()*profile.ground.length)];
 const size=(.48+rng()*.56)*([1,2,6,7,11,29,30,31,38,39,40].includes(slot)?1.36:1);
 if(slot===12)botanicalCactus(x,y,z,size*.83,seed,false);
 if(slot===14)botanicalBarrel(x,y,z,size*.46);
 const angle=rng()*Math.PI*2;
 if(slot!==12&&slot!==14)groundFloraVolume(x,y,z,size,angle,[1,2,6,7,11,29,30,31,38,39,40].includes(slot)?54:57);
 for(let i=0;i<3;i++){
  const a=angle+i*2.399;
  const offset=i===0?0:size*.17;
  const shortCactus=slot===12||slot===14;
  const start=shortCactus?size*.25:-.055;
  plantSheet(x+Math.cos(a)*offset,y+start,z+Math.sin(a)*offset,
   size*(.72+rng()*.27),size*(.72+rng()*.33),a,size*.08,slot,size*.14);
 }
 return true;
}

function botanicalBarrel(x,y,z,radius){
 const bands=9,sides=40;
 const vertex=(i,j)=>{
  const lat=(i/bands-.5)*Math.PI,a=j/sides*Math.PI*2;
  const normal=[Math.cos(a)*Math.cos(lat),Math.sin(lat),Math.sin(a)*Math.cos(lat)];
  const rib=1+.10*Math.cos(a*10);
  return {n:normal,p:[x+normal[0]*radius*rib,y+(normal[1]+1)*radius*.8,z+normal[2]*radius*rib]};
 };
 for(let i=0;i<bands;i++)for(let j=0;j<sides;j++){
  const ring=[vertex(i,j),vertex(i,j+1),vertex(i+1,j+1),vertex(i+1,j)];
  const u=.27+.44*(j%4)/4,v=.85-i/bands*.73;
  plantPatch(ring.map(p=>p.p),ring.map(p=>p.n),[[u,v],[u+.11,v],[u+.11,v-.73/bands],[u,v-.73/bands]],14,64);
 }
}

function botanicalCactus(x,y,z,h,seed,branched=true){
 const angle=seed*2.399;
 const radius=h*(branched?.055:.17);
 const detailed=x>85&&x<325&&z>85&&z<325;
 const stem=(controls,r)=>{
  const sides=branched?(detailed?36:18):24, subdivisions=detailed?4:2;
  const segments=controls.flatMap((start,index)=>{
   if(index===controls.length-1)return [start];
   const previous=controls[Math.max(0,index-1)],end=controls[index+1],next=controls[Math.min(controls.length-1,index+2)];
   return Array.from({length:subdivisions},(_,step)=>{
    const t=step/subdivisions,t2=t*t,t3=t2*t;
    return start.map((b,k)=>{
     const a=previous[k],c=end[k],d=next[k];
     return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);
    });
   });
  });
  const rings=segments.map(([distance,elevation,scale],i)=>{
   const previous=segments[Math.max(0,i-1)],next=segments[Math.min(i+1,segments.length-1)];
   const tangent=unit([Math.cos(angle)*(next[0]-previous[0]),next[1]-previous[1],Math.sin(angle)*(next[0]-previous[0])]);
   const axis=[Math.sin(angle),0,-Math.cos(angle)],other=cross(tangent,axis);
   return Array.from({length:sides+1},(_,j)=>{
    const a=j/sides*Math.PI*2;
    const n=axis.map((v,k)=>v*Math.cos(a)+other[k]*Math.sin(a));
    const ribs=1+.11*Math.cos(a*9);
    return {n,p:[x+distance*Math.cos(angle)+n[0]*r*scale*ribs,y+elevation+n[1]*r*scale*ribs,z+distance*Math.sin(angle)+n[2]*r*scale*ribs]};
   });
  });
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++){
   const corners=[rings[i][j],rings[i][j+1],rings[i+1][j+1],rings[i+1][j]];
   const u=.35+.30*(j%4)/4,v=1-i/(rings.length-1),nextV=v-1/(rings.length-1);
   plantPatch(corners.map(c=>c.p),corners.map(c=>c.n),[[u,v],[u+.075,v],[u+.075,nextV],[u,nextV]],0,64);
  }
 };
 stem([[0,0,.86],[.015*h,.40*h,1],[.024*h,.82*h,.83],[.025*h,.91*h,.64],[.025*h,.95*h,0]],radius);
 if(branched)for(const side of [-1,1]){
  const base=h*(side===1?.45:.31),arm=h*.19*side;
  stem([[0,base,1],[arm*.65,base+h*.015,.92],[arm,base+h*.09,.86],
   [arm*1.07,base+h*.25,.80],[arm*1.08,base+h*.30,.56],[arm*1.08,base+h*.32,0]],radius*.68);
 }
}

function paintRegionalTree(x,y,z,h,seed,forcedSlot){
 const profile=botanicalSpecies[s.region];
 if(!plantTexture||(!profile&&forcedSlot===undefined))return false;
 const rng=rand(seed),sample=rng();
 if(forcedSlot===0||(s.region===2&&sample<.79)){botanicalCactus(x,y,z,h,seed);return true}
 const slot=forcedSlot??profile.trees[Math.floor(rng()*profile.trees.length)];
 const palm=slot===9,baobab=slot===8||slot===53,cypress=slot===4||slot===52;
 const trunk=color(baobab?"#82604d":palm?"#76644b":"#635545");
 const radius=h*(baobab?.084:palm?.031:.037), angle=rng()*Math.PI*2;
 const bend=h*(palm?.14:.047);
 const spine=t=>[x+Math.cos(angle)*bend*t*t,y+h*t,z+Math.sin(angle)*bend*t*t];
 const crown=palm?.91:baobab?.69:cypress?.91:.80;
 for(let i=0;i<5;i++)tube(spine(i*crown/5),spine((i+1)*crown/5),
  radius*(1-i*.13),radius*(.87-i*.13),trunk,surface.wall,10);
 const branches=palm?10:baobab?9:11;
 for(let i=0;i<branches;i++){
  const a=i*2.399+angle;
  const root=spine(palm?.90:baobab?.63:cypress?.37+i*.045:.44+i*.033);
  const reach=h*(palm?.22:baobab?.31:cypress?.26-i*.015:.19+rng()*.11);
  const rise=h*(palm?-.05:baobab?.19:.06+rng()*.052);
  const mid=[root[0]+Math.cos(a)*reach*.49,root[1]+rise*.65+h*.038,root[2]+Math.sin(a)*reach*.49];
  const end=[root[0]+Math.cos(a)*reach,root[1]+rise,root[2]+Math.sin(a)*reach];
  pineLimb([[...root,radius*.46],[...mid,radius*.25],[...end,radius*.066]],seed+i,.35);
  for(let layer=0;layer<3;layer++){
   const center=mix(mid,end,.2+layer*.38);
   const size=h*(palm?.23:baobab?.19:cypress?.22-i*.009:.16)*(1+rng()*.25);
   plantSheet(center[0],center[1]-size*.43,center[2],size*(palm?1.40:1.20),size,
    a+layer*.83,size*.15,slot,size*(palm?.78:.21));
   if(h>2.7){
    const leafColor=color(palm?"#678047":cypress?"#647946":"#6e8849");
    const twig=addFlora(center,[Math.cos(a+layer)*size*.31,(layer-1)*size*.20,Math.sin(a+layer)*size*.31]);
    tube(center,twig,radius*.085,radius*.021,trunk,80.09,4,80.31);
    for(let leaf=0;leaf<(palm?7:5);leaf++){
     const angle=a+leaf*2.399+layer*.71,dx=Math.cos(angle),dz=Math.sin(angle);
     const root=mix(center,twig,.18+leaf*.13);
     const tip=addFlora(root,[dx*size*.42,(leaf%2?-.21:.22)*size,dz*size*.42]);
     foldedFloraLeaf(root,tip,[-dz,0,dx],size*(palm?.032:.091),[0,size*.055,0],leafColor);
    }
   }
  }
  if(cypress&&i%2===0)plantSheet(end[0],end[1]-h*.18,end[2],h*.13,h*.19,a,h*.025,5);
 }
 return true;
}

function buildBotanicalPlots(){
 const profile=botanicalSpecies[s.region];
 if(!plantTexture||!profile)return;
 const [cx,cz]=s.region===2?[121,160]:s.region===5?[138,161]:[140,157];
 const covered=new Set();
 for(let i=0;i<60;i++){
  const a=i*2.399,r=2+Math.sqrt(i)*1.27,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;
  const slot=profile.first+i%10;
  if(i>=30&&covered.has(slot))continue;
  if(riverDist(x,z)<10||roadDist(x,z)<2.8)continue;
  paintRegionalPlant(x,height(x,z),z,1677+i,slot);
  covered.add(slot);
 }
}
