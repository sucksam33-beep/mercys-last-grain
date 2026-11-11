import * as T from "./vendor/three/three.module.min.js";

const {lerp,smoothstep}=T.MathUtils;
const TAU=Math.PI*2;
const styles={
 crop:[.91,1.68,.31,.16],part:[.89,1.94,.66,.25],waves:[.83,2.06,.55,.49],curls:[.84,1.97,.28,.84],
 bun:[.88,2.06,.50,.17],braid:[.88,2.13,.51,.25],scarf:[.94,1.96,.38,.14],cap:[.92,1.85,.44,.16],
 sparse:[.62,1.83,.35,.20],undercut:[.87,1.70,.77,.22],bald:[.52,1.72,.28,.07]
};
// Visible styles and hairline observations from the shipped resident portraits.
// [style, part angle, front height, ear exposure, crown fullness, nape length, sweep]
const portraitGuide={
 "ambaro-01-boat-pilot":["bun",.05,1.00,.78,.07,.41,.38],
 "ambaro-02-carpenter":["crop",-.05,.97,.81,.045,.55,.21],
 "asagi-01-rice-grower":["scarf",.10,1.02,.74,.041,.43,.21],
 "asagi-02-rail-clerk":["part",.44,.88,.65,.121,.43,.72],
 "beaverton-01-rail-technician":["crop",.11,.91,.76,.074,.53,.30],
 "beaverton-02-mine-surveyor":["cap",-.08,.96,.76,.036,.49,.20],
 "brunnen-01-wharf-forewoman":["curls",-.12,.96,.64,.135,.37,.32],
 "brunnen-02-lock-keeper":["cap",-.10,.98,.76,.033,.53,.20],
 "brunnen-03-courier":["braid",.04,.95,.69,.088,.36,.40],
 "brunnen-04-baker":["curls",-.24,.90,.67,.159,.42,.32],
 "brunnen-05-bookbinder":["waves",.32,.91,.54,.098,.28,.63],
 "brunnen-06-boat-hand":["crop",.02,.97,.83,.038,.56,.18],
 "brunnen-07-grocer":["waves",.03,.95,.66,.101,.32,.47],
 "brunnen-08-mason":["crop",-.12,.97,.77,.058,.51,.31],
 "brunnen-09-rail-porter":["bald",0,1.15,.87,.006,.69,.05],
 "brunnen-10-retired-boatbuilder":["bun",.12,.99,.71,.055,.34,.36],
 "brunnen-11-seamstress":["curls",.18,.96,.72,.091,.40,.28],
 "brunnen-12-canal-maintainer":["undercut",-.63,.96,.78,.119,.48,.77],
 "brunnen-13-inspector":["sparse",.26,1.04,.81,.039,.51,.24],
 "brunnen-14-boatwright":["waves",-.19,.97,.66,.099,.36,.49],
 "brunnen-15-butcher":["crop",.20,1.01,.80,.071,.54,.37],
 "brunnen-16-watchman":["waves",-.08,.91,.64,.146,.38,.59],
 "brunnen-17-glazier":["bun",.05,.98,.72,.073,.39,.43],
 "brunnen-18-cooper":["crop",-.20,.99,.78,.051,.51,.34],
 "brunnen-19-apprentice":["part",.02,.91,.63,.092,.38,.56],
 "brunnen-20-laundress":["scarf",-.07,.98,.72,.050,.39,.24],
 "brunnen-21-customs-officer":["bun",.43,1.03,.78,.051,.40,.55],
 "brunnen-22-cook":["undercut",.59,.95,.81,.105,.52,.79],
 "brunnen-23-ferryman":["curls",-.25,1.00,.67,.095,.40,.35],
 "brunnen-24-florist":["curls",.38,.93,.61,.148,.33,.57],
 "brunnen-25-quay-clerk":["braid",-.04,1.00,.72,.059,.38,.44],
 "brunnen-26-market-grocer":["waves",-.28,.98,.67,.112,.39,.60],
 "brunnen-27-lamplighter":["waves",.49,.92,.59,.105,.32,.65],
 "brunnen-28-cobbler":["curls",-.17,.88,.64,.166,.37,.41],
 "brunnen-29-canal-resident":["bun",.01,1.01,.76,.050,.35,.38],
 "brunnen-30-constable":["crop",.02,.97,.83,.043,.55,.15],
 "brunnen-31-printmaker":["braid",.15,.98,.72,.063,.38,.47],
 "juniperwell-01-sawmill-worker":["braid",-.04,.94,.61,.074,.32,.52],
 "juniperwell-02-timber-grader":["waves",.31,.99,.67,.096,.35,.57],
 "karuk-01-weather-observer":["braid",.04,.91,.62,.069,.30,.47],
 "karuk-02-supply-keeper":["cap",-.05,.98,.77,.037,.51,.20],
 "saint-aurel-01-boat-repairer":["braid",.09,1.00,.68,.084,.34,.43],
 "saint-aurel-02-net-mender":["crop",-.18,.94,.71,.078,.48,.35],
 "santa-lucia-01-adobe-mason":["bun",.22,.98,.67,.091,.35,.44],
 "santa-lucia-02-reservoir-keeper":["part",.12,.96,.69,.085,.41,.49],
 sae:["waves",.31,.94,.59,.093,.29,.63],
 elise:["waves",-.50,.94,.62,.113,.26,.71],
 grandmother:["waves",.12,.995,.64,.062,.29,.52]
};
export function portraitHairStyle(label,fallback){return portraitGuide[label]?.[0]??fallback;}

function randomFor(label){
 let state=Array.from(label).reduce((value,letter)=>Math.imul(value,31)+letter.charCodeAt(0)|0,127);
 return ()=>((state=Math.imul(1664525,state)+1013904223|0)>>>0)/4294967296;
}
const strandMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.88,side:T.DoubleSide});
const denseStrandMaterial=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});
denseStrandMaterial.onBeforeCompile=shader=>{
 shader.vertexShader=shader.vertexShader
  .replace("#include <common>","#include <common>\nattribute vec3 hairCenter; attribute float hairId; attribute float hairT; uniform float hairSpread;")
  .replace("#include <begin_vertex>","#include <begin_vertex>\nfloat fiberSeed=hairId*19.923+float(gl_InstanceID)*.6180339;\nfloat fiberAngle=6.2831853*fract(sin(fiberSeed)*43758.5453);\nfloat fiberWave=(.48+.23*sin(hairT*2.8+fiberAngle))*sin(hairT*3.14159265);\ntransformed=hairCenter+(position-hairCenter)*.34+vec3(cos(fiberAngle)*fiberWave,.38*fiberWave,sin(fiberAngle)*fiberWave)*hairSpread;");
 shader.uniforms.hairSpread={value:.00055};
};
denseStrandMaterial.customProgramCacheKey=()=>"returning-waters-independent-strands-v7";

function batch(material){
 const position=[],color=[],uv=[],index=[],paths=[];
 return {
  vertex(p,c,u,v){position.push(...p);color.push(c.r,c.g,c.b);uv.push(u,v);return position.length/3-1;},
  quad(a,b,c,d){index.push(a,b,d,b,c,d);},
  fiber(start,steps){paths.push({start,steps});},
  mesh(){
   const g=new T.BufferGeometry();
   g.setAttribute("position",new T.Float32BufferAttribute(position,3));
   g.setAttribute("color",new T.Float32BufferAttribute(color,3));
   g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
   g.setIndex(index);g.computeVertexNormals();
   const mesh=new T.Mesh(g,material);
   mesh.userData.strandCount=paths.length;
   mesh.userData.compact=()=>{
    const points=[],tones=[],centers=[],ids=[],phases=[],indices=[];
    for(const [id,{start,steps}] of paths.entries()){
     const first=points.length/3;
     for(let sample=0;sample<=5;sample++){
      const a=start+2*Math.round(steps*sample/5),b=a+1;
      const center=[0,1,2].map(axis=>(position[a*3+axis]+position[b*3+axis])*.5);
      for(const v of [a,b]){
       points.push(...position.slice(v*3,v*3+3));tones.push(...color.slice(v*3,v*3+3));
       centers.push(...center);ids.push(id);phases.push(sample/5);
      }
      if(sample){const j=first+sample*2;indices.push(j-2,j-1,j,j-1,j+1,j);}
     }
    }
    const result=new T.BufferGeometry();
    result.setAttribute("position",new T.Float32BufferAttribute(points,3));
    result.setAttribute("color",new T.Float32BufferAttribute(tones,3));
    result.setAttribute("hairCenter",new T.Float32BufferAttribute(centers,3));
    result.setAttribute("hairId",new T.Float32BufferAttribute(ids,1));
    result.setAttribute("hairT",new T.Float32BufferAttribute(phases,1));
    result.setIndex(indices);
    return result;
   };
   return mesh;
  }
 };
}
function matchLength(curve,length,fall){
 const points=Array.from({length:25},(_,i)=>curve(i/24)),spans=[0];
 for(let i=1;i<points.length;i++)spans.push(spans[i-1]+points[i].distanceTo(points[i-1]));
 const end=points[points.length-1],total=spans[spans.length-1];
 if(total<length){points.push(end.clone().addScaledVector(fall,length-total));spans.push(length);}
 return t=>{
  const distance=t*length;
  const j=Math.max(1,spans.findIndex(span=>span>=distance-1e-8));
  return points[j-1].clone().lerp(points[j],(distance-spans[j-1])/Math.max(1e-8,spans[j]-spans[j-1]));
 };
}

function filament(target,curve,width,cross,tone,steps=11){
 let previous,first;
 for(let i=0;i<=steps;i++){
  const t=i/steps,p=curve(t);
  const side=cross(t);
  const size=width*(.28+.72*Math.sin(Math.PI*t*.86))*(1-.92*t**3);
  const c=tone(t);
  const a=target.vertex(p.clone().addScaledVector(side,-size),c,0,t);
  const b=target.vertex(p.clone().addScaledVector(side,size),c,1,t);
  if(previous!==undefined)target.quad(previous,previous+1,b,a);else first=a;
  previous=a;
 }
 target.fiber(first,steps);
}

function scalpRadii(geometry,chin,height){
 const rows=35, columns=96, min=.24, max=1.17;
 const zCenter=-height*.17;
 const attr=geometry.attributes.position,index=geometry.index;
 const radii=new Float32Array(rows*columns);
 for(let r=0;r<rows;r++){
  const y=chin+height*lerp(min,max,r/(rows-1)), slices=[];
  for(let i=0;i<index.count;i+=3){
   const hits=[];
   for(let j=0;j<3;j++){
    const a=index.getX(i+j),b=index.getX(i+(j+1)%3), ay=attr.getY(a),by=attr.getY(b);
    if((ay<y)===(by<y))continue;
    const t=(y-ay)/(by-ay);
    hits.push([lerp(attr.getX(a),attr.getX(b),t),lerp(attr.getZ(a),attr.getZ(b),t)-zCenter]);
   }
   if(hits.length===2)slices.push(hits);
  }
  for(let c=0;c<columns;c++){
   const angle=c/columns*TAU,dx=Math.sin(angle),dz=Math.cos(angle);
   let range=0;
   for(const [[ax,az],[bx,bz]] of slices){
    const x=bx-ax,z=bz-az, cross=dx*z-dz*x;
    if(Math.abs(cross)<1e-7)continue;
    const t=(ax*dz-az*dx)/cross;
    if(t<0||t>1)continue;
    range=Math.max(range,(ax*z-az*x)/cross);
   }
   radii[r*columns+c]=range;
  }
 }
 return (y,az)=>{
  const row=T.MathUtils.clamp((y-min)/(max-min)*(rows-1),0,rows-1.001);
  const column=T.MathUtils.euclideanModulo(az,TAU)/TAU*columns;
  const r=Math.floor(row),c=Math.floor(column),c2=(c+1)%columns;
  const a=lerp(radii[r*columns+c],radii[r*columns+c2],column-c);
  const b=lerp(radii[(r+1)*columns+c],radii[(r+1)*columns+c2],column-c);
  return Math.max(0,lerp(a,b,row-r));
 };
}

function crownHeight(geometry,width,height){
 const cells=39,xmin=-width*.53,xmax=width*.53,zmin=-height*.83,zmax=height*.60;
 const position=geometry.attributes.position,index=geometry.index;
 const values=new Float32Array(cells*cells).fill(-10);
 const gridX=x=>(x-xmin)/(xmax-xmin)*(cells-1);
 const gridZ=z=>(z-zmin)/(zmax-zmin)*(cells-1);
 for(let i=0;i<index.count;i+=3){
  const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);
  const ax=gridX(position.getX(a)),az=gridZ(position.getZ(a)),bx=gridX(position.getX(b)),bz=gridZ(position.getZ(b)),cx=gridX(position.getX(c)),cz=gridZ(position.getZ(c));
  const determinant=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);
  if(Math.abs(determinant)<1e-6)continue;
  const ay=position.getY(a),by=position.getY(b),cy=position.getY(c);
  for(let z=Math.max(0,Math.ceil(Math.min(az,bz,cz)));z<=Math.min(cells-1,Math.floor(Math.max(az,bz,cz)));z++){
   for(let x=Math.max(0,Math.ceil(Math.min(ax,bx,cx)));x<=Math.min(cells-1,Math.floor(Math.max(ax,bx,cx)));x++){
    const u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/determinant;
    const v=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/determinant,w=1-u-v;
    if(Math.min(u,v,w)<-.001)continue;
    values[z*cells+x]=Math.max(values[z*cells+x],u*ay+v*by+w*cy);
   }
  }
 }
 return (x,z)=>{
  const a=T.MathUtils.clamp(gridX(x),0,cells-1.001),b=T.MathUtils.clamp(gridZ(z),0,cells-1.001);
  const i=Math.floor(a),j=Math.floor(b);
  const row=j=>lerp(values[j*cells+i],values[j*cells+i+1],a-i);
  return lerp(row(j),row(j+1),b-j);
 };
}

const denseCopies=20;
const ultraCopies=(denseCopies+1)*40-1;
function addDensity(groom,source,pivot,scale,label){
 if(!source.geometry.index?.count)return;
 const detail=groom.userData.hairDetail;
 const mesh=new T.InstancedMesh(source.geometry,source.material,denseCopies);
 const ultra=new T.InstancedMesh(source.userData.compact(),denseStrandMaterial,ultraCopies);
 delete source.userData.compact;
 ultra.userData.strandCount=source.userData.strandCount;
 const object=new T.Object3D(),rng=randomFor(label),color=new T.Color();
 for(let i=0;i<ultraCopies;i++){
  const angle=i*2.39996323,ring=Math.sqrt((i+1)/(i<denseCopies?denseCopies:ultraCopies));
  const radial=.002+.008*ring;
  object.scale.set(1+radial*(.55+rng()*.45),1+radial*(rng()*.90-.34),1+radial);
  object.rotation.set((rng()-.5)*.005,(rng()-.5)*.014,(rng()-.5)*.006);
  object.updateMatrix();
  const center=pivot.clone().applyMatrix4(object.matrix);
  object.position.copy(pivot).sub(center).addScaledVector(new T.Vector3(Math.sin(angle),.18*Math.sin(angle*2),Math.cos(angle)),scale*ring*.007);
  object.updateMatrix();
  const tint=color.setScalar(lerp(.79,.91,rng()));
  ultra.setMatrixAt(i,object.matrix);ultra.setColorAt(i,tint);
  if(i<denseCopies){mesh.setMatrixAt(i,object.matrix);mesh.setColorAt(i,tint);}
 }
 mesh.instanceMatrix.needsUpdate=true;
 mesh.instanceColor.needsUpdate=true;
 mesh.computeBoundingSphere();
 mesh.count=0;
 mesh.visible=false;
 detail.add(mesh);
 (groom.userData.densityLayers??=[]).push(mesh);
 ultra.instanceMatrix.needsUpdate=true;ultra.instanceColor.needsUpdate=true;ultra.frustumCulled=false;
 ultra.count=0;ultra.visible=false;detail.add(ultra);
 (groom.userData.ultraLayers??=[]).push(ultra);
}

export function buildResidentGroom({mesh},height,width,chin,label,style,headGeometry){
 const profile=portraitGuide[label];
 if(profile)style=profile[0];
 const group=new T.Group(), detail=new T.Group();
 detail.name="hair-near-detail";group.add(detail);
 group.userData.hairDetail=detail;
 const rng=randomFor(label), [line,nape,defaultSweep,wave]=styles[style]??styles.part;
 const sweep=profile?.[6]??defaultSweep;
 const side=profile?Math.sign(profile[1])||1:rng()<.5?-1:1;
 const part=profile?.[1]??side*lerp(.17,.54,rng());
 const headAsym=lerp(-.045,.045,rng()), crown=lerp(.98,1.025,rng());
 const density=lerp(.84,1.16,rng()), curlSeed=rng()*TAU;
 const tone=new T.Color().setRGB(...mesh.hair.map(v=>v/255),T.SRGBColorSpace);
 const silver=new T.Color(label==="grandmother"?"#a9a49c":"#938a80");
 const positions=headGeometry.attributes.position;
 const roots=new Float32Array(positions.count);
 headGeometry.setAttribute("hairRoots",new T.BufferAttribute(roots,1));
 group.userData.scalpTint=tone.clone();
 group.userData.referenceStyle=style;
 if(style==="bald")return group;
 const normals=headGeometry.attributes.normal;
 let peak=-Infinity,base=Infinity,front=-Infinity;
 for(let i=0;i<positions.count;i++){
  peak=Math.max(peak,positions.getY(i));base=Math.min(base,positions.getY(i));front=Math.max(front,positions.getZ(i));
 }
 const headSpan=peak-base;
 for(let i=0;i<positions.count;i++){
  const high=smoothstep(positions.getY(i),peak-headSpan*.29,peak-headSpan*.14);
  const behind=1-smoothstep(positions.getZ(i),front-headSpan*.19,front-headSpan*.045);
  const upward=smoothstep(normals.getY(i),.18,.65);
  roots[i]=smoothstep(high*behind*upward,.20,.66)*.995;
 }
 const left=-mesh.position[127*3],right=mesh.position[356*3];
 const xs=mesh.position.filter((_,i)=>i%3===0);
 const faceLeft=Math.max(.38,left,-Math.min(...xs)),faceRight=Math.max(.38,right,Math.max(...xs));
 const centerY=chin+height*.545,centerZ=-height*.159;
 const temple=lerp(.050,.099,rng()), napeShift=lerp(-.105,.065,rng());
 const brow=[];
 for(let i=0;i<468;i++){
  const x=mesh.position[i*3],y=mesh.position[i*3+1],z=mesh.position[i*3+2];
  if(y>.65)brow.push([x,y,z*height+.018-smoothstep(y,.78,.98)*height*.17]);
 }
 function scalpOutside(x,y,z){
  const u=x/width,v=(y-chin)/height;
  let sum=0,total=0;
  for(const [bx,by,bz] of brow){
   const distance=((bx-u)/.115)**2+((by-v)/.085)**2;
   if(distance>=1)continue;
   const weight=(1-distance)**3;sum+=weight*bz;total+=weight;
  }
  return total>.13?Math.max(z,sum/total+height*.019):z;
 }
 const sparse=style==="sparse";
 const capped=style==="cap"||style==="scarf";
 const shade=(t,k=0,gray=false)=>tone.clone().lerp(silver,gray?lerp(.24,.58,t):.028*t)
  .multiplyScalar(lerp(.81,1.08,smoothstep(t,.04,.92))*(1+k));
 function surface(t,az,lift=0){
  const front=(Math.cos(az)+1)*.5, lateral=Math.sin(az);
  const corner=smoothstep(Math.abs(lateral),.38,.9)*front;
  const ear=Math.exp(-(((Math.abs(lateral)-.97)*5.8)**2));
  const recess=temple*corner*(sparse?2.5:1)+ear*(style==="waves"?.11:.22);
  const edge=lerp(nape+napeShift,line+headAsym*lateral,front**1.48)-recess
    -(style==="undercut"?.28*smoothstep(lateral*side,.14,.9):0);
  const polar=Math.max(.001,t*edge);
  const flow=az-part-side*sweep*t*(.37+.22*(1-front))+wave*.09*Math.sin(t*7+curlSeed);
  const lock=Math.cos(flow*(style==="curls"?22:15)+curlSeed);
  const fine=Math.cos(flow*79+Math.sin(t*9)*.73);
  const waveShape=(.025*lock+.007*fine)*Math.sin(polar)*smoothstep(t,.04,.57);
  const groove=Math.exp(-((Math.sin(az-part)*13)**2))*front**3;
  const shell=1+waveShape-groove*.025+lift;
  const x=lateral*Math.sin(polar)*width*((lateral<0?faceLeft:faceRight)+.023)*shell+part*height*.050*(1-t);
  const y=centerY+Math.cos(polar)*height*.665*crown*shell;
  const z=centerZ+Math.cos(az)*Math.sin(polar)*height*.664*shell+height*.235*front**5*Math.sin(polar);
  return new T.Vector3(x,y,front>.55?scalpOutside(x,y,z):z);
 }
 if(!capped){
  const forms={
   crop:[.91,.74,.54,.022],part:[.92,.69,.47,.075],waves:[.885,.61,.33,.146],curls:[.89,.62,.39,.153],
   bun:[.965,.73,.37,.060],braid:[.945,.67,.35,.056],sparse:[1.06,.73,.47,.019],undercut:[.94,.82,.56,.112],bald:[1.20,.77,.53,.004]
  };
  const [fore,temporal,back,body]=forms[style]??forms.part;
  const low=label==="grandmother";
  const zones={
   crown:[profile?.[4]??body,part*.67,part+.21],
   forehead:[profile?.[2]??fore,style==="waves"?.067:.034,part*.72],
   nape:[profile?.[5]??back,style==="waves"?.055:.031,part*.48],
   temple:[profile?.[3]??temporal,style==="undercut"?.044:.073,part*.55]
  };
  group.userData.zones=zones;
  const cutoff=az=>{
   const f=Math.max(0,Math.cos(az)),rear=Math.max(0,-Math.cos(az));
   const peak=Math.exp(-((Math.sin(az-part)*3.2)**2))*f;
   const [foreY,foreSpan,foreShift]=zones.forehead,[templeY,templeDrop,templeTilt]=zones.temple;
   const [backY,backWidth,backShift]=zones.nape;
   const sidePoint=Math.exp(-(((Math.abs(az)-1.16-templeTilt*.16)*4.4)**2));
   const fringe=foreSpan*(Math.sin(az*1.93+foreShift)*.52+peak*.51)*f;
   const hairline=lerp(templeY-templeDrop*sidePoint,foreY,f**1.35)+fringe;
   const napeLine=backY+backWidth*Math.cos((az-Math.PI+backShift)*2.2);
   return lerp(hairline,napeLine,rear**.73)+.014*Math.sin(az*17+curlSeed);
  };
  let top=0,highest=0;
  for(let i=0;i<positions.count;i++){
   const y=(positions.getY(i)-chin)/height;
   if(y>top){top=y;highest=i;}
  }
  const crownRoot=new T.Vector3().fromBufferAttribute(positions,highest);
  const targetLength=height*(({crop:.71,part:.82,waves:.92,curls:.88,bun:.90,braid:.95,sparse:.67,undercut:.74})[style]??.80);
  for(let i=0;i<positions.count;i++){
   const y=(positions.getY(i)-chin)/height;
   const az=Math.atan2(positions.getX(i),positions.getZ(i)+height*.17);
   const foreheadGuard=1-smoothstep(positions.getZ(i)/height,.19,.48);
   const crown=smoothstep(y,top-.43,top-.24)*foreheadGuard;
   roots[i]=Math.max(roots[i],Math.max(smoothstep(y-cutoff(az),-.016,.078),crown)*.995);
  }
  const baseStrands=batch(strandMaterial),nearStrands=batch(strandMaterial);
  const radiusAt=scalpRadii(headGeometry,chin,height);
  const [crownVolume,crownTilt,crownPhase]=zones.crown;
  const thinning=style==="bald"?.11:style==="sparse"?.58:label==="grandmother"?.73:1;
  const budget={crop:1650,part:2050,waves:2630,curls:2780,bun:2260,braid:2440,sparse:1640,undercut:1970,bald:1320};
  const count=Math.round((budget[style]??2000)*density*thinning);
  for(let i=0;i<count;i++){
   const az=(i*.61803398875%1)*TAU-Math.PI,front=Math.max(0,Math.cos(az));
   const layer=i%7,groupAngle=Math.round(az*6)/6;
   const phase=groupAngle*(style==="curls"?7.6:3.35)+curlSeed*.18;
   const gray=rng()<(label==="grandmother"?.69:sparse?.25:.047);
   const finish=cutoff(az)-lerp(.005,.032,rng());
   const begin=lerp(Math.max(finish+.082,top-.21),top-.047,rng()**.58);
   if(begin<=finish+.022||radiusAt(begin,az)<height*.025)continue;
   const strandWidth=height*lerp(.0010,.0026,rng());
   const waveStrength=(style==="waves"?.16:style==="curls"?.25:.045)*(1-front*.36);
   const nearPart=Math.atan2(Math.sin(az-part),Math.cos(az-part));
   const comb=Math.sign(nearPart||side)*sweep*(.48+.22*Math.cos(groupAngle-part));
   const aAt=t=>az-comb*(1-t)**1.35+waveStrength*Math.sin(phase+t*(style==="curls"?11:5.5))*Math.sin(Math.PI*t);
   const lift=height*(.008+layer*.005+.004*Math.sin(groupAngle*4));
   const shapeLift=({curls:1.16,waves:1.04,braid:.78,bun:.69,undercut:.82,part:.79,crop:.53,sparse:.45,bald:.20})[style]??.74;
   const down=t=>{
    const a=aAt(t), baseY=lerp(begin,finish,t);
    const radius=radiusAt(baseY,a);
    const waveLift=Math.sin(t*Math.PI)*crownVolume*height*shapeLift*(1+.42*Math.sin(a+crownPhase)*crownTilt);
    const frontFit=1-.55*Math.max(0,Math.cos(a));
    const r=radius+(lift*Math.sin(t*Math.PI*.89)+waveLift)*frontFit;
    const y=chin+height*baseY+waveLift*Math.max(0,1-radius/(height*.42));
    return new T.Vector3(Math.sin(a)*r,y,-height*.17+Math.cos(a)*r);
   };
   const topRoot=crownRoot.clone().add(new T.Vector3(Math.sin(az)*width*.022,0,Math.cos(az)*height*.025));
   const guide=down(0);
   const curve=t=>{
    if(t>=.29)return down((t-.29)/.71);
    const k=t/.29;
    const point=topRoot.clone().lerp(guide,k);
    point.y+=height*.036*Math.sin(k*Math.PI);
    return point;
   };
   const fall=new T.Vector3(Math.sin(az)*.31,-.93,-.24).normalize();
   const fitted=matchLength(curve,targetLength,fall);
   const batchTarget=i%3===0?baseStrands:nearStrands;
   filament(batchTarget,fitted,strandWidth,t=>{const a=aAt(t);return new T.Vector3(Math.cos(a),.12,-Math.sin(a)).normalize();},
    t=>shade(t,lerp(-.055,.08,Math.cos(phase)*.5+.5),gray),style==="curls"?13:9);
  }
  if(!sparse){
   const projection=crownHeight(headGeometry,width,height);
   const topStrands=style==="waves"||style==="curls"?440:320;
   for(let i=0;i<topStrands;i++){
    const z0=height*lerp(-.35,.29,rng()),length=height*lerp(.15,.39,rng());
    const x0=width*lerp(-.36,.21,rng())*side,drift=width*lerp(.12,.30,rng())*side;
    const level=i%9,gray=rng()<(label==="grandmother"?.52:.06);
    const path=Array.from({length:10},(_,k)=>{
     const t=k/9,x=x0+drift*t+width*.015*Math.sin(t*4+i),z=z0-length*t;
     return new T.Vector3(x,projection(x,z)+height*(.012+level*.005+.035*Math.sin(Math.PI*t)),z);
    }).filter(p=>p.y>chin+height*.70);
    if(path.length<7)continue;
    const curve=new T.CatmullRomCurve3(path);
    filament(nearStrands,t=>curve.getPoint(t),height*lerp(.0013,.0024,rng()),
     ()=>new T.Vector3(length,0,drift).normalize(),t=>shade(t,-.055,gray),9);
   }
   const crownBase=Math.min(top-.044,1.13);
   for(let i=0;i<144;i++){
    const az=(i*.61803398875%1)*TAU-Math.PI, root=crownBase-lerp(.018,.102,rng());
    const end=Math.max(cutoff(az)+.016,root-lerp(.16,.32,rng()));
    if(root<=end||radiusAt(root,az)<height*.018)continue;
    const bend=side*lerp(.12,.48,rng()),wave=lerp(.013,.034,rng());
    const curve=t=>{
     const y=lerp(root,end,t),a=az+bend*t;
     const radius=radiusAt(y,a)+height*(.010+wave*Math.sin(Math.PI*t));
     return new T.Vector3(Math.sin(a)*radius,chin+y*height,-height*.17+Math.cos(a)*radius);
    };
    filament(nearStrands,curve,height*lerp(.0011,.0024,rng()),
     t=>new T.Vector3(Math.cos(az+bend*t),.05,-Math.sin(az+bend*t)),
     t=>shade(t,.012,i%13===0),8);
   }
  }
  const base=baseStrands.mesh(),near=nearStrands.mesh();
  group.add(base);detail.add(near);
  const pivot=new T.Vector3(0,chin+height*.60,-height*.17);
  addDensity(group,base,pivot,height,label+"-base");
  addDensity(group,near,pivot,height,label+"-detail");
 }
 const main=batch(strandMaterial), wisps=batch(strandMaterial);
 const count=capped?Math.round(38*density):0;
 for(let i=0;i<count;i++){
  const az=i/count*TAU+(rng()-.5)*.12,front=(Math.cos(az)+1)*.5;
  const from=capped?lerp(.79,.92,rng()):sparse?lerp(.64,.91,rng()):lerp(.06,.53,rng());
  const to=capped?lerp(.99,1.13,rng()):lerp(.90,1.055,rng());
  if(capped&&front>.72)continue;
  if(sparse&&front>.54&&i%3!==0)continue;
  const phase=rng()*TAU, w=width*lerp(.0024,.0052,rng()), clump=lerp(.009,.020,rng())*(capped?.61:1);
  const variation=lerp(-.085,.105,rng()), gray=rng()<(label==="grandmother"?.48:sparse?.26:.044);
  const driftAngle=t=>{
   const drift=side*sweep*t*(1-.44*front)+wave*.23*Math.sin(phase+t*(style==="curls"?14:6.5))*Math.sin(Math.PI*t);
   return az+drift;
  };
  const curve=t=>surface(lerp(from,to,t),driftAngle(t),clump*Math.sin(Math.PI*t*.89)+.007);
  filament(main,curve, w, t=>{const a=driftAngle(t),r=lerp(from,to,t);return surface(r,a+.008).sub(surface(r,a-.008)).normalize();},
    t=>shade(t,variation,gray),style==="curls"?13:10);
 }
 for(let i=0;i<(capped?26:0);i++){
  const az=rng()*TAU,front=(Math.cos(az)+1)*.5;
  if(capped&&front>.67)continue;
  const from=lerp(.67,.91,rng()),to=lerp(1.015,1.14,rng()),phase=rng()*TAU;
  const gray=rng()<(label==="grandmother"?.72:.18),heightFactor=lerp(.012,.047,rng());
  const curve=t=>surface(lerp(from,to,t),az+side*t*.14+Math.sin(phase+t*6)*.041,heightFactor*Math.sin(Math.PI*t));
  const cross=()=>new T.Vector3(Math.cos(az),.08,-Math.sin(az)).normalize();
  filament(wisps,curve,height*lerp(.0012,.0026,rng()),cross,t=>shade(t,.07,gray),8);
  filament(wisps,curve,height*.0016,()=>new T.Vector3(0,1,0),t=>shade(t,.02,gray),8);
 }
 if(style==="bun"||style==="braid"){
  const isBun=style==="bun", low=label==="grandmother";
  const center=new T.Vector3(side*width*(low?.09:.18),chin+height*(low?.27:.45),-height*(low?.56:.56));
  const radius=height*(isBun?.205:.078);
  for(let i=0;i<(isBun?330:360);i++){
   const a=rng()*TAU,band=rng(),gray=low&&i%3!==0;
   const curve=t=>{
    const angle=a+t*TAU*(isBun?.69:1.83),r=radius*(isBun?lerp(.28,1,band)*Math.sin((.15+t*.72)*Math.PI):lerp(1,.42,t));
    return center.clone().add(new T.Vector3(Math.cos(angle)*r+(isBun?0:t*height*.10*side),isBun?Math.sin(angle)*r*.74:-height*(low?.54:.86)*t,
     isBun?-height*.09*Math.sin(Math.PI*t)+Math.cos(angle*2)*radius*.12:Math.sin(angle)*r));
   };
   filament(main,curve,height*(isBun?.0042:.0035),()=>new T.Vector3(Math.cos(a),Math.sin(a),.39).normalize(),
     t=>shade(t,.15*Math.sin(a),gray),15);
  }
 }
 const grouped=main.mesh(),fine=wisps.mesh();
 group.add(grouped);detail.add(fine);
 const gatheredPivot=new T.Vector3(0,chin+height*.46,-height*.17);
 addDensity(group,grouped,gatheredPivot,height,label+"-gathered");
 addDensity(group,fine,gatheredPivot,height,label+"-wisps");
 return group;
}

export function updateGroomDistance(head,distance){
 const groom=head?.children.find(child=>child.userData.hairDetail);
 if(!groom)return;
 const {hairDetail,densityLayers,ultraLayers}=groom.userData;
 hairDetail.visible=distance<(hairDetail.visible?19:16);
 const ultra=distance<1.45;
 const copies=ultra?0:distance<2.8?denseCopies:distance<4.6?7:distance<7.1?2:0;
 for(const layer of ultraLayers??[]){layer.count=ultra?ultraCopies:0;layer.visible=ultra;}
 for(const layer of densityLayers??[]){layer.count=copies;layer.visible=copies>0;}
}

// Follow the existing GLB hair surface so the original bun and hairline stay aligned to Genzo's head.
export function addGenzoGroom(actor){
 const head=actor.head;if(!head)return;
 actor.root.updateMatrixWorld(true);
 const samples=[],p=new T.Vector3();
 actor.model.traverse(node=>{
  if(!node.isSkinnedMesh)return;
  const position=node.geometry.attributes.position;
  for(let i=0;i<position.count;i++){
   node.getVertexPosition(i,p);
   head.worldToLocal(node.localToWorld(p));
   if(p.y>3&&p.y<28&&Math.abs(p.x)<15&&Math.abs(p.z)<21)samples.push(p.clone());
  }
 });
 if(samples.length<20)return;
 const layer=batch(strandMaterial), rng=randomFor("genzo-silver"), color=new T.Color("#969490"), dark=new T.Color("#4a4745");
 const top=samples.reduce((value,v)=>Math.max(value,v.y),0);
 const centerZ=-1.8;
 for(let strand=0;strand<100;strand++){
  const az0=lerp(1.01,TAU-1.01,rng()),start=top*lerp(.74,.93,rng()),end=lerp(4.9,8.7,rng());
  const points=[];
  for(let step=0;step<=10;step++){
   const t=step/10,y=lerp(start,end,t),az=lerp(az0,Math.PI,t*.64);
   const dx=Math.sin(az),dz=Math.cos(az);
   let far=0;
   for(const v of samples){
    if(Math.abs(v.y-y)>1.6)continue;
    const radial=v.x*dx+(v.z-centerZ)*dz,off=Math.abs(v.x*dz-(v.z-centerZ)*dx);
    if(off<1.22&&radial>far)far=radial;
   }
   if(far)points.push(new T.Vector3(dx*(far+.21),y,centerZ+dz*(far+.21)));
  }
  if(points.length<8)continue;
  const curve=new T.CatmullRomCurve3(points);
  filament(layer,t=>curve.getPoint(t),lerp(.066,.11,rng()),()=>new T.Vector3(Math.cos(az0),.04,-Math.sin(az0)),t=>dark.clone().lerp(color,.52+.37*t),9);
 }
 const groom=new T.Group(), detail=new T.Group();
 const strands=layer.mesh();detail.add(strands);groom.add(detail);groom.userData.hairDetail=detail;
 addDensity(groom,strands,new T.Vector3(0,13,-1.8),20,"genzo-silver-layer");head.add(groom);
}
