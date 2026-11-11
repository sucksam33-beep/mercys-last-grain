import * as T from "./vendor/three/three.module.min.js";
import {createCoatOrnaments} from "./coat-ornaments.mjs";
import {createHeadgear} from "./wearable-torsos.mjs";

const styles={
 base:{id:0,cloth:"#41434a",panel:"#585047",trim:"#897052",shape:[.993,1,.056]},
 144:{id:1,cloth:"#2e445c",panel:"#4c6d82",trim:"#c1a477",shape:[.975,.985,-.075]},
 147:{id:2,cloth:"#46503a",panel:"#6e7051",trim:"#a88c53",shape:[1.028,1.025,.043]},
 148:{id:3,cloth:"#835f3c",panel:"#ad8250",trim:"#503b29",shape:[.982,.98,.025]},
 149:{id:4,cloth:"#26464a",panel:"#507776",trim:"#bb9354",shape:[1.032,1.025,.133]},
 151:{id:5,cloth:"#343844",panel:"#515a64",trim:"#d2be98",shape:[1.050,1.036,.094]}
};
const regalia=[
 {id:6,cloth:"#50463b",panel:"#685848",trim:"#92785a",lining:"#61514b",vest:"#75624d",pants:"#4e5047",leather:"#624831",shape:[1,1,0]},
 {id:7,cloth:"#354735",panel:"#546544",trim:"#a29771",lining:"#66664c",vest:"#7d785a",pants:"#49554c",leather:"#694734",shape:[.987,1,.01]},
 {id:8,cloth:"#653c39",panel:"#855655",trim:"#c79c62",lining:"#854448",vest:"#b79a71",pants:"#504957",leather:"#543a37",shape:[.98,1.012,.028]},
 {id:9,cloth:"#293e60",panel:"#465f83",trim:"#b8c4d0",lining:"#4b6585",vest:"#bac5d6",pants:"#384452",leather:"#393644",shape:[.976,1.02,.048]},
 {id:10,cloth:"#28263f",panel:"#504668",trim:"#dab16a",lining:"#8d3843",vest:"#c3a066",pants:"#3f3a54",leather:"#37303b",shape:[.97,1.027,.068]}
];
function itemNumber(gear,slot){
 return gear?.[slot]?.[4]?.match(/(?:^|\/)assets\/priority-models\/(14[4-9]|15[01])\.glb$/)?.[1];
}
const shared=String.raw`
varying vec3 vTailorRest;
varying vec2 vTailorLimbs;
uniform vec4 tailorState;
uniform float tailorLayer;
uniform vec3 tailorCloth,tailorPanel,tailorTrim,tailorLining,tailorVest,tailorPants,tailorLeather;
float tailorEdge(float distance,float halfWidth){
 float aa=max(fwidth(distance),.00055);
 return 1.-smoothstep(max(0.,halfWidth-aa),halfWidth+aa,abs(distance));
}
float tailorRange(float x,float low,float high,float fade){
 return smoothstep(low-fade,low+fade,x)*(1.-smoothstep(high-fade,high+fade,x));
}
float tailorLine(float value){
 float a=max(fwidth(value),.006);
 return (1.-smoothstep(.09-a,.09+a,abs(fract(value+.5)-.5)))*(1.-smoothstep(.17,.40,a));
}
float tailorRosette(vec2 q,float size,float petals){
 float r=length(q)/size,angle=atan(q.y,q.x);
 float flower=.65+.19*cos(petals*angle);
 float aa=max(fwidth(r),.021);
 return (1.-smoothstep(.065,.065+aa,abs(r-flower)))*
  smoothstep(.11,.31,r)*(1.-smoothstep(.88,1.02,r));
}
float tailorRepeat(float v,float origin,float interval){
 return (fract((v-origin)/interval+.5)-.5)*interval;
}

`;

export function createFittedOutfits(actor){
 actor.place([0,0,0],0,0,0,false);
 actor.root.updateMatrixWorld(true);
 const inverse=actor.root.matrixWorld.clone().invert(),point=new T.Vector3();
 const head=createHeadgear(actor),ornaments=[];
 const state={value:new T.Vector4()},shape={value:new T.Vector3(1,1,0)};
 const cloth={value:new T.Color()},panel={value:new T.Color()},trim={value:new T.Color()};
 const lining={value:new T.Color()},vestColor={value:new T.Color()},pants={value:new T.Color()},leatherColor={value:new T.Color()};
 actor.model.traverse(mesh=>{
  if(!mesh.isSkinnedMesh||mesh.name==="tailored-garment-panels")return;
  const local=inverse.clone().multiply(mesh.matrixWorld);
  const joint=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight;
  const rest=new Float32Array(joint.count*3),limbs=new Float32Array(joint.count*2);
  const kind=mesh.skeleton.bones.map(bone=>/Hand|Thumb|Index|Middle|Ring|Little/i.test(bone.name)?2:
   /Shoulder|ForeArm|LeftArm|RightArm/i.test(bone.name)?1:0);
  for(let i=0;i<joint.count;i++){
   mesh.getVertexPosition(i,point).applyMatrix4(local).toArray(rest,i*3);
   for(let j=0;j<4;j++){
    const k=kind[joint.getComponent(i,j)],w=weights.getComponent(i,j);
    if(k===2)limbs[i*2]+=w;
    if(k)limbs[i*2+1]+=w;
   }
  }
  mesh.geometry.setAttribute("tailorRest",new T.BufferAttribute(rest,3));
  mesh.geometry.setAttribute("tailorLimbs",new T.BufferAttribute(limbs,2));
  const original=mesh.material;
  function tailoringMaterial(layer){
   const material=original.clone(),layerUniform={value:layer};
   const onCompile=original.onBeforeCompile;
   material.onBeforeCompile=function(shader,renderer){
   onCompile.call(this,shader,renderer);
   Object.assign(shader.uniforms,{tailorState:state,tailorShape:shape,tailorCloth:cloth,tailorPanel:panel,tailorTrim:trim,tailorLining:lining,tailorVest:vestColor,tailorPants:pants,tailorLeather:leatherColor,tailorLayer:layerUniform});
   shader.vertexShader="attribute vec3 tailorRest; attribute vec2 tailorLimbs; varying vec3 vTailorRest; varying vec2 vTailorLimbs; uniform vec3 tailorShape; uniform vec4 tailorState; uniform float tailorLayer;\n"+shader.vertexShader
    .replace("#include <begin_vertex>",`#include <begin_vertex>
     vTailorRest=tailorRest;
     vTailorLimbs=tailorLimbs;
     float center=(1.-smoothstep(.22,.37,abs(tailorRest.x)))*(1.-smoothstep(1.95,2.07,tailorRest.y));
     center*=smoothstep(.75,1.16,tailorRest.y)*(1.-smoothstep(.10,.32,tailorLimbs.x));
     transformed.x*=1.+(tailorShape.x-1.)*center;
     transformed.z*=1.+(tailorShape.y-1.)*center;
     float tail=(1.-smoothstep(.62,1.24,tailorRest.y))*smoothstep(.44,.56,tailorRest.y);
     float coatEdge=max(smoothstep(.207,.268,abs(tailorRest.x)),1.-smoothstep(-.13,-.080,tailorRest.z));
     transformed.x*=1.+tail*coatEdge*tailorShape.z*.25;
     transformed.z*=1.+tail*coatEdge*tailorShape.z*.16;
     float gaiter=smoothstep(.22,.31,tailorRest.y)*(1.-smoothstep(.52,.59,tailorRest.y))*tailorState.y;
     transformed.z*=1.+gaiter*.028;
     float hemEdge=smoothstep(.43,.49,tailorRest.y)*(1.-smoothstep(.68,.78,tailorRest.y))*coatEdge;
     transformed+=normal*(hemEdge*.0019+tailorLayer*.0042);
    `);
   shader.fragmentShader=shared+shader.fragmentShader.replace("#include <map_fragment>",`#include <map_fragment>
     vec3 p=vTailorRest;
     float ax=abs(p.x), style=tailorState.x;
     vec3 source=diffuseColor.rgb;
     float lightness=dot(source,vec3(.2126,.7152,.0722));
     float shoulderTop=mix(2.009,2.121,smoothstep(.118,.267,ax));
     float clothY=tailorRange(p.y,.53,shoulderTop,.028);
     float warm=smoothstep(.005,.027,source.r-source.g);
     float outer=max(smoothstep(.185,.30,ax),1.-smoothstep(-.13,-.085,p.z));
     float coat=clothY*mix(max(warm,.79*outer),1.,smoothstep(1.24,1.44,p.y));
     float face=1.-smoothstep(shoulderTop-.026,shoulderTop+.022,p.y);
     float hand=1.-smoothstep(.21,.54,vTailorLimbs.x);
     float carry=smoothstep(.20,.28,-p.x)*tailorRange(p.y,1.22,1.59,.058)*smoothstep(.10,.21,p.z)*smoothstep(.055,.12,source.r);
     carry*=hand;
     coat*=face*hand*(1.-carry*.92);
     float front=smoothstep(.057,.164,p.z);
     float linen=front*smoothstep(.20,.41,lightness)*(1.-smoothstep(.075,.141,ax))*tailorRange(p.y,1.875,2.095,.051);
     coat*=1.-linen*.96;
     float back=1.-smoothstep(-.14,-.03,p.z);
     float vest=(1.-smoothstep(.175,.27,ax))*tailorRange(p.y,1.39,1.985,.038)*(1.-vTailorLimbs.y*.70);
     if(style>2.5&&style<3.5)coat*=mix(.18,1.,vest);
     float lip=0.,detail=0.,metal=0.,panelMask=0.,heraldry=0.,signature=0.;
     float rank=clamp(tailorState.z,0.,5.);
     float cuff=tailorRange(p.y,1.31,1.43,.027)*smoothstep(.32,.74,vTailorLimbs.y);
     float shoulder=tailorRange(p.y,1.80,1.985,.048);
     float frontEdge=tailorEdge(ax-(.074+.30*clamp(p.y-1.65,0.,.35)),.0045)*front*tailorRange(p.y,1.61,1.987,.023);
     float hipSeam=tailorEdge(p.y-(1.40+.08*ax),.004)*front*smoothstep(.065,.102,ax)*(1.-smoothstep(.23,.267,ax));
     if(style<.5){
      panelMask=.54*shoulder*back+.45*cuff;
      detail=.64*frontEdge+.53*hipSeam+.64*tailorEdge(ax-.142,.0038)*back*tailorRange(p.y,1.34,1.90,.035);
      lip=.63*tailorEdge(p.y-.64,.008);
     }else if(style<1.5){
      float lap=p.x-(.025+.63*(p.y-1.51));
      float wrap=tailorEdge(lap,.009)*front*tailorRange(p.y,1.50,1.955,.032);
      float belt=tailorEdge(p.y-(1.461+.022*sin(p.x*8.)),.014)*front;
      panelMask=.48*shoulder*back+.55*cuff+.68*wrap;
      lip=max(wrap*.57,belt*.53);
      metal=tailorEdge(length(vec2(p.x-.039,(p.y-1.466)*1.35))-.024,.0034)*front;
      detail=tailorEdge(abs(lap)-.010,.0021)*front*tailorRange(p.y,1.51,1.95,.025)+hipSeam*.54;
     }else if(style<2.5){
      float yoke=tailorEdge(p.y-(1.835+.23*ax),.0035);
      panelMask=shoulder*.69+cuff*.36;
      detail=max(frontEdge,yoke*.79)+hipSeam*.56;
      lip=tailorEdge(p.y-.637,.007)*.73;
     }else if(style<3.5){
      float diag=tailorLine((p.y+p.x*.88)*33.)+tailorLine((p.y-p.x*.88)*33.);
      panelMask=vest*(.40+.33*front);
      detail=(diag*.56+frontEdge*.75+hipSeam)*vest;
      lip=tailorEdge(p.y-1.43,.011)*vest;
     }else if(style<4.5){
      float curve=p.y-(1.69+.22*ax+.17*ax*ax);
      panelMask=smoothstep(-.025,.035,curve)*tailorRange(p.y,1.60,2.00,.050)*.86;
      detail=tailorEdge(curve,.0043)*.65+tailorEdge(p.y-.65,.008)*.83;
      metal=front*(1.-smoothstep(.016,.035,length(vec2(p.x,p.y-1.862))));
      lip=tailorEdge(curve+.020,.0025)*.54;
     }else if(style<5.5){
      float fleece=tailorEdge(ax-(.100+.36*(p.y-1.84)),.020)*tailorRange(p.y,1.84,2.055,.018)*front;
      float toggles=tailorEdge(fract((p.y-1.42)*8.)-.5,.034)*front*tailorRange(p.y,1.47,1.83,.025)*(1.-smoothstep(.032,.069,ax));
      lip=max(cuff*.74,fleece*.86);
      detail=.53*frontEdge+.50*hipSeam;
      metal=toggles*.85;
      panelMask=.38*shoulder;
     }
     if(rank>.5){
      float piping=tailorEdge(ax-(.079+.285*clamp(p.y-1.60,0.,.36)),.0039)*front*tailorRange(p.y,1.58,2.014,.033);
      float cuffRing=tailorEdge(p.y-1.367,.0045)*cuff;
      float yoke=tailorEdge(p.y-(1.872+.115*ax),.0038)*back*tailorRange(ax,.025,.246,.027);
      float lowerHem=tailorEdge(p.y-.588,.0043)*outer;
      float luxury=smoothstep(1.,4.8,rank);
      panelMask=clamp((.26+luxury*.38)*shoulder*back+cuff*(.19+.40*luxury)+vest*.21,0.,1.);
      detail=hipSeam*.42+piping*(.35+.57*luxury)+yoke*luxury+cuffRing*luxury;
      lip=lowerHem*(.24+.67*luxury)+piping*.38*luxury;
      if(rank>1.5){
       lip+=tailorEdge(p.y-1.395,.0042)*cuff*.56;
       detail+=tailorEdge(p.y-(1.435+.083*ax),.0036)*front*tailorRange(ax,.10,.235,.028)*.53;
      }
      if(rank>2.5){
       float row=tailorRepeat(p.y,1.54,.106);
       float buttonX=rank>3.5?.105:.051;
       vec2 at=vec2(ax-buttonX,row);
       metal=(1.-smoothstep(.006,.013,length(at)))*front*tailorRange(p.y,1.48,1.88,.018);
       detail+=tailorEdge(p.y-(1.418+.10*ax),.0038)*front*tailorRange(ax,.095,.235,.026)*.66;
      }
      if(rank>3.5){
       float braid=tailorEdge(p.y-(.612+.006*sin(p.x*80.)),.0033)*outer;
       float cuffBraid=tailorEdge(p.y-(1.382+.003*cos(p.z*72.)),.0033)*cuff;
       lip+=braid*.73+cuffBraid*.80;
       detail+=tailorLine((p.y+p.z*.28)*48.)*cuff*.39;
      }
      if(rank>4.5){
       float stem=.096+.267*clamp(p.y-1.60,0.,.36);
       float lace=tailorRosette(vec2(ax-stem,tailorRepeat(p.y,1.65,.056)),.020,5.);
       float crest=tailorRosette(vec2(p.x,(p.y-1.81)*.84),.092,7.);
       float border=tailorEdge(length(vec2(p.x,(p.y-1.81)*.84))-.087,.0028);
       float hemLace=tailorRosette(vec2(tailorRepeat(p.x,0.,.062),p.y-.634),.022,5.);
       heraldry=max(lace*front*tailorRange(p.y,1.58,1.995,.024),max((crest+border*.63)*back,hemLace*outer*.87));
       lip+=heraldry*.92;
      }
     }
     if(rank>.5){
      float edgePath=ax-(.089+.27*clamp(p.y-1.59,0.,.39));
      float lapelZone=front*tailorRange(p.y,1.60,2.02,.025);
      float cuffZone=cuff*tailorRange(p.y,1.335,1.419,.012);
      float hemZone=tailorRange(p.y,.575,.663,.021)*outer;
      if(rank<1.5){
       signature=tailorEdge(edgePath,.004)*lapelZone*.34+tailorEdge(p.y-.606,.004)*hemZone*.44;
      }else if(rank<2.5){
       float saddle=tailorLine((p.y+p.x*.15)*81.);
       signature=tailorEdge(abs(edgePath)-.010,.004)*lapelZone*saddle*.79;
       signature+=tailorEdge(p.y-1.367,.010)*cuffZone*.61;
      }else if(rank<3.5){
       float diamond=abs(edgePath)*1.25+abs(tailorRepeat(p.y,1.68,.058));
       signature=tailorEdge(diamond-.022,.0038)*lapelZone;
       signature+=tailorEdge(p.y-.621,.006)*hemZone*.78;
      }else if(rank<4.5){
       float braid=tailorEdge(edgePath+.008*sin(p.y*126.),.004)+tailorEdge(edgePath-.008*sin(p.y*126.),.0034);
       signature=braid*lapelZone+tailorEdge(p.y-.619,.004)*hemZone+tailorEdge(p.y-1.376,.008)*cuffZone;
      }else{
       float leaf=tailorRosette(vec2(edgePath,tailorRepeat(p.y,1.68,.054)),.024,5.);
       float backSprig=tailorRosette(vec2(ax-.145,tailorRepeat(p.y,1.84,.059)),.021,5.)*back*tailorRange(p.y,1.71,1.97,.024);
       float cuffFlower=tailorRosette(vec2(tailorRepeat(p.z,0.,.041),p.y-1.373),.016,5.)*cuffZone;
       signature=leaf*lapelZone+backSprig+cuffFlower+heraldry*.46;
      }
      signature=clamp(signature,0.,1.);
      detail=max(detail,signature*.83);
     }
     float weaveA=tailorLine((p.x+p.z*.61+p.y*.25)*290.);
     float weaveB=tailorLine((p.y-p.z*.34)*323.);
     float weave=(weaveA+weaveB)*.5;
     float contrast=clamp(.44+lightness*3.64,.44,1.83);
     float stitches=detail*tailorLine((p.x*.63+p.y)*113.);
     vec3 fabric=mix(tailorCloth,tailorPanel,clamp(panelMask,0.,1.));
     fabric*=contrast*(.91+.12*weave);
     fabric=mix(fabric,tailorTrim*contrast,clamp(lip*.94+detail*.34+stitches*.32,0.,1.));
     fabric=mix(fabric,tailorTrim*(1.02+.40*lightness),clamp(metal,0.,1.));
     fabric=mix(fabric,tailorTrim*(.85+.23*contrast),signature*(.37+rank*.095));
     diffuseColor.rgb=mix(source,fabric,coat*.91);
     float bootMask=(1.-smoothstep(.30+tailorState.y*.185,.38+tailorState.y*.185,p.y));
     float bootLine=(tailorEdge(p.y-(.31+tailorState.y*.211),.006)+tailorState.y*.52*tailorEdge(p.y-.488,.004))*bootMask;
     vec3 leather=mix(vec3(.078,.045,.022),vec3(.042,.052,.061),tailorState.y);
     vec3 shoe=leather*(.58+lightness*3.8)+bootLine*vec3(.052,.037,.021);
     diffuseColor.rgb=mix(diffuseColor.rgb,shoe,bootMask*(.58+tailorState.y*.30));
     float liningMark=smoothstep(.014,.060,source.r-max(source.g*1.28,source.b*1.20));
     float innerHem=tailorRange(p.y,.395,1.17,.052)*hand*max(coat*(gl_FrontFacing?0.:.90),liningMark*.98);
     float hemBinding=tailorRange(p.y,.392,.585,.045)*hand*max(outer*warm*.90,liningMark);
     vec3 smoothLining=tailorLining*(.67+clamp(lightness,.048,.26)*.77);
     diffuseColor.rgb=mix(diffuseColor.rgb,smoothLining,innerHem*.98);
     diffuseColor.rgb=mix(diffuseColor.rgb,mix(tailorCloth,tailorLining,innerHem)*(.73+lightness*.61),hemBinding*.98);
     innerHem=max(innerHem,hemBinding*.67);
     float waistcoatRelief=0., innerTailoring=0.;
     if(rank>.5){
      float vestEdge=.156-.050*smoothstep(1.75,2.00,p.y);
      float vestHem=1.44+.37*abs(ax-.068);
      float chest=smoothstep(.063,.123,p.z)*tailorRange(p.y,vestHem,2.021,.009)*face*hand;
      float waistcoat=chest*(1.-smoothstep(vestEdge-.004,vestEdge+.004,ax));
      innerTailoring=waistcoat;
      // Signed distance to the two sewn edges of the waistcoat opening.
      float neckline=.48*(p.y-1.747)-ax;
      float abovePoint=smoothstep(1.735,1.755,p.y);
      float shirt=waistcoat*abovePoint*smoothstep(-.003,.003,neckline);
      float rolledEdge=tailorEdge(neckline+.007,.006)*waistcoat*abovePoint;
      float edgeShadow=tailorEdge(neckline-.002,.004)*waistcoat*abovePoint;
      float outerBinding=tailorEdge(ax-vestEdge+.006,.0045)*chest;
      float closure=tailorEdge(p.x+.012,.0045)*waistcoat*(1.-shirt)*tailorRange(p.y,1.46,1.75,.017);
      float buttonRadius=length(vec2(p.x-.008,tailorRepeat(p.y,1.495,.066)));
      float button=(1.-smoothstep(.006,.009,buttonRadius))*waistcoat*tailorRange(p.y,1.48,1.727,.008);
      float buttonSeat=(1.-smoothstep(.009,.012,buttonRadius))*waistcoat*tailorRange(p.y,1.48,1.727,.008);
      float vestTexture=(tailorLine((p.x+p.y)*58.)+tailorLine((p.x-p.y)*58.))*.5;
      vec3 fittedVest=tailorVest*(.78+lightness*.77);
      float fineBrocade=tailorRosette(vec2(tailorRepeat(p.x,0.,.043),tailorRepeat(p.y,1.58,.048)),.016,4.);
      fittedVest*=.91+.19*vestTexture*smoothstep(2.,4.5,rank);
      fittedVest+=tailorTrim*fineBrocade*.15*step(4.5,rank);
      diffuseColor.rgb=mix(diffuseColor.rgb,fittedVest,waistcoat*.99);
      float placket=tailorEdge(p.x-.009,.0031)*shirt;
      vec3 collarTone=vec3(.83,.77,.66);
      diffuseColor.rgb=mix(diffuseColor.rgb,collarTone*(.87+lightness*.20)*(1.-placket*.19),shirt);
      diffuseColor.rgb=mix(diffuseColor.rgb,tailorCloth*.39,edgeShadow*.90+closure*.47);
      diffuseColor.rgb=mix(diffuseColor.rgb,mix(tailorVest,tailorTrim,.43)*1.18,rolledEdge*.95);
      diffuseColor.rgb=mix(diffuseColor.rgb,tailorTrim*.81,outerBinding*.79*(1.-shirt));
      diffuseColor.rgb=mix(diffuseColor.rgb,tailorCloth*.48,buttonSeat*.78);
      diffuseColor.rgb=mix(diffuseColor.rgb,tailorTrim*(.63+.51*(1.-buttonRadius/.009)),button*.92);
      waistcoatRelief=rolledEdge*.0018-edgeShadow*.00065+outerBinding*.0011+button*.0017;
      float slacks=tailorRange(p.y,.29,1.41,.070)*(1.-warm)*smoothstep(.055,.112,ax)*hand;
      float trouserSeam=tailorEdge(ax-(.195+.035*(1.-p.y)),.0035)*slacks*smoothstep(1.8,4.8,rank);
      vec3 wovenPants=tailorPants*(.44+3.4*lightness)*(.94+weave*.10);
      diffuseColor.rgb=mix(diffuseColor.rgb,wovenPants+trouserSeam*tailorTrim*.091,slacks*.92);
      float strapLine=p.x-(.59*(p.y-1.61)-.105);
      float strap=tailorEdge(strapLine,.015)*front*tailorRange(p.y,1.38,2.02,.055)*smoothstep(.02,.09,source.r-source.b);
      float bag=max(carry,strap);
      vec3 bags=tailorLeather*(.43+lightness*2.8);
      float bagSeam=(tailorEdge(p.y-1.440,.0038)+.63*tailorEdge(p.y-1.421,.0031))*carry*smoothstep(1.6,4.8,rank);
      float leatherBorder=tailorEdge(length(vec2((p.x+.264)*.78,(p.y-1.399)*1.18))-.026,.0034)*carry*smoothstep(2.4,4.7,rank);
      float clasp=(1.-smoothstep(.006,.015,length(vec2(p.x+.264,p.y-1.398))))*carry*smoothstep(2.,4.8,rank);
      diffuseColor.rgb=mix(diffuseColor.rgb,bags+tailorTrim*(bagSeam*.36+clasp*.67+leatherBorder*.51),bag*.91);
      float toe=tailorEdge(p.z-(.084+.040*ax),.0043)*bootMask*tailorRange(p.y,.09,.22,.037)*smoothstep(1.,4.7,rank);
      float band=tailorEdge(p.y-.252,.008)*bootMask*smoothstep(.012,.123,p.z)*smoothstep(2.,4.8,rank);
      float buckle=tailorEdge(length(vec2(ax-.215,(p.y-.251)*1.32))-.020,.0034)*bootMask*smoothstep(.055,.112,p.z)*smoothstep(2.5,4.9,rank);
      shoe=tailorLeather*(.44+lightness*3.25)+tailorTrim*(toe*.36+band*.40+buckle*.79);
      diffuseColor.rgb=mix(diffuseColor.rgb,shoe,bootMask*.94);
      metal=max(metal,max(clasp,buckle));
      detail+=toe*.54+bagSeam*.58+trouserSeam*.40;
     }
     if(tailorLayer>.5){
      float layerMask=0.;
      if(style<.5)layerMask=max(frontEdge*.82,cuff*.78);
      else if(style<1.5)layerMask=max(lip,max(.76*metal,cuff*.70));
      else if(style<2.5)layerMask=max(panelMask,frontEdge*.76);
      else if(style<3.5)layerMask=vest*tailorRange(p.y,1.43,1.94,.029);
      else if(style<4.5)layerMask=max(panelMask,metal);
      else if(style<5.5)layerMask=max(lip,metal);
      else layerMask=max(max(lip,metal),max(panelMask*.83,max(heraldry,signature*.91)));
      layerMask*=coat*(1.-innerTailoring);
      float gaiterPanel=tailorState.y*tailorRange(p.y,.292,.523,.017);
      if(max(layerMask,gaiterPanel)<.48)discard;
      vec3 raised=mix(tailorPanel,tailorTrim,clamp(.62*lip+.34*metal+.18*detail,0.,1.));
      if(gaiterPanel>.48){
       float tongue=tailorEdge(p.y-.515,.004)+tailorEdge(p.y-.488,.003);
       diffuseColor.rgb=mix(diffuseColor.rgb,shoe*(.96+.08*weave)+tongue*vec3(.037,.026,.014),gaiterPanel*.71);
      }else diffuseColor.rgb=mix(diffuseColor.rgb,raised*contrast,smoothstep(.48,.78,layerMask)*.42);
     }
     float wool=style>4.5&&style<5.5?lip:0.;
     float tailorRelief=coat*(1.-innerHem*.82)*(detail*.00115+stitches*.0004+lip*.0016+metal*.0018+weave*.00055+signature*.00115+wool*weave*.0012)+bootLine*.00115+waistcoatRelief;`)
    .replace("#include <metalnessmap_fragment>",`#include <metalnessmap_fragment>
     metalnessFactor=max(metalnessFactor,metal*clamp(coat+.7*bootMask,0.,1.)*.60);`)
    .replace("#include <normal_fragment_maps>",`vec3 liningNormal=normal;
     #include <normal_fragment_maps>
     normal=normalize(mix(normal,liningNormal,innerHem*.90));
     vec3 tp=-vViewPosition,tx=dFdx(tp),ty=dFdy(tp);
     vec3 rx=cross(ty,normal),ry=cross(normal,tx);
     float det=dot(tx,rx);
     if(abs(det)>1.e-12)normal=normalize(abs(det)*normal-sign(det)*(dFdx(tailorRelief)*rx+dFdy(tailorRelief)*ry));`);
  };
   material.customProgramCacheKey=()=>"mercy-tailored-original-v4-"+layer;
   return material;
  }
  mesh.material=tailoringMaterial(0);
  // Decorative shells reuse the source vertices and the exact same bind weights.
  const sourceIndex=mesh.geometry.index,faces=[];
  for(let i=0;i<(sourceIndex?.count??joint.count);i+=3){
   const face=[0,1,2].map(j=>sourceIndex?sourceIndex.getX(i+j):i+j);
   if(face.some(v=>{const y=rest[v*3+1];return y>.12&&y<.70||y>1.24&&y<2.15&&limbs[v*2]<.38;}))faces.push(...face);
  }
  const geometry=new T.BufferGeometry();
  for(const [key,attribute] of Object.entries(mesh.geometry.attributes))geometry.setAttribute(key,attribute);
  geometry.setIndex(faces);
  const raisedPanels=new T.SkinnedMesh(geometry,tailoringMaterial(1));
  raisedPanels.name="tailored-garment-panels";
  raisedPanels.frustumCulled=false;
  raisedPanels.receiveShadow=mesh.receiveShadow;
  raisedPanels.bindMode=mesh.bindMode;
  raisedPanels.bind(mesh.skeleton,mesh.bindMatrix);
  mesh.add(raisedPanels);
  ornaments.push(createCoatOrnaments(actor,mesh,rest));
 });
 let readyHead=false;
 function update(gear){
  const selected=itemNumber(gear,"torso"),shoes=itemNumber(gear,"feet");
  const rank=Number.isInteger(gear?.coatTier)&&gear.coatTier>=1&&gear.coatTier<=5?gear.coatTier:0;
  const design=regalia[rank-1]??styles[selected]??styles.base;
  state.value.set(design.id,shoes==="145"?1:0,rank,0);
  shape.value.fromArray(design.shape);
  cloth.value.set(design.cloth);panel.value.set(design.panel);trim.value.set(design.trim);
  lining.value.set(design.lining??design.panel);
  vestColor.value.set(design.vest??design.panel);pants.value.set(design.pants??"#4e5047");
  leatherColor.value.set(design.leather??"#5d4633");
  for(const item of ornaments)item.update(rank,shape.value,state.value.y);
  readyHead=head.update(gear);
 }
 return {update,ready:slot=>slot==="torso"?Boolean(state.value.x):slot==="feet"?Boolean(state.value.y):slot==="head"&&readyHead};
}
