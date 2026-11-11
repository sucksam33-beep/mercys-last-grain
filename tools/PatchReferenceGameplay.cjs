const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const stage=path.join(__dirname,"reference-architecture-stage/game");
function edit(file,changes){
 const p=path.join(stage,file);
 let text=fs.readFileSync(p,"utf8").replaceAll("\r\n","\n");
 for(const [a,b] of changes){assert.equal(text.split(a).length,2,file+" "+a.slice(0,85));text=text.replace(a,()=>b);}
 fs.writeFileSync(p,text);
}
edit("index.html",[
 ['const soilHandoff={x:309,y:348.4};','const asagiGranary={x:309,z:339,w:16.4,d:10.4,h:5.35};\nconst soilHandoff={x:309,y:350.5};'],
 ['foundationGrade(x,z,7.1,4.9).top+.27','foundationGrade(x,z,asagiGranary.w,asagiGranary.d).top+.27'],
 [' const open=name==="아사기 공동 창고"||Boolean(s.openDoors?.[id]);',' const open=Boolean(s.openDoors?.[id]);'],
 [' ({w,d,h,wall,roof}=plan);',' ({w,d,h,wall,roof}=plan);\n h=Math.max(h,3.35);\n plan.h=h;'],
 ['  const x=309,z=357,y=height(x,z),hx=309,hz=339;','  const x=309,z=357,y=height(x,z),{x:hx,z:hz,w:hw,d:hd,h:hh}=asagiGranary;'],
 ['  houseMesh(hx,hz,7.1,4.9,3.4,color("#6f5844"),color("#403e39"),"아사기 공동 창고");','  houseMesh(hx,hz,hw,hd,hh,color("#d0ba93"),color("#4d5661"),"아사기 공동 창고");'],
 ['  const floor=soilGranaryFloor(hx,hz);','  const floor=soilGranaryFloor(hx,hz);\n  dressAsagiGranary(hx,hz,floor);'],
 [' if(s.region===0)houseMesh(329,351,10,7,3.1,wood,roof,"아사기 공동 창고");',' if(s.region===0)houseMesh(329,351,10,7,3.35,wood,roof,"아사기 작업 헛간");'],
 ['  selected="field";actionSpot=null;\n  heading=facing=0;', '  selected="field";actionSpot=null;\n  heading=facing=Math.PI;'],
 ['player={...soilHandoff};heading=facing=0;','player={...soilHandoff};heading=facing=Math.PI;'],
 ['let walkHeight=null, walkedFrom=null, jumpVelocity=null;','let walkHeight=null, walkedFrom=null, jumpVelocity=null, jumpTime=0;'],
 [' jumpVelocity=5.1;', ' jumpTime=0;\n jumpVelocity=5.1;'],
 [' const x=player.x,z=player.y;\n const next=height+jumpVelocity', ' jumpTime+=dt;\n const x=player.x,z=player.y;\n const next=height+jumpVelocity'],
 ['airborne:jumpVelocity!==null,gear:', 'airborne:jumpVelocity!==null,jumpTime,jumpVelocity,gear:'],
 ['import("./rigged-scene.mjs")','import("./rigged-scene.mjs?v=granary-landing")'],
 ['src="ArchitectureFinish.js"','src="ArchitectureFinish.js?v=regional-reference"'],
 ['src="BuildingVariation.js?v=architecture-finish"','src="BuildingVariation.js?v=regional-reference"'],
 ['src="HouseInteriors.js"','src="HouseInteriors.js?v=entry-clearance"'],
 [`  quad([x-w*.53,y+h*.69,end+.2],[x+w*.53,y+h*.69,end+.2],
       [x+w*.54,y+h*.57,end+1.62],[x-w*.54,y+h*.57,end+1.62],roof,scenery?surface.roof:0);`,`  const fascia=Math.max(y+h*.72,y+.43+standingHeight+.38);
  const upper=fascia+.40;
  architecturalRoofFace([x-w*.54,fascia,end+1.62],[x-w*.53,upper,end+.16],
   [x+w*.53,upper,end+.16],[x+w*.54,fascia,end+1.62],roof);
  addSurface(x,end+.87,w*1.07,1.48,fascia-.08,upper+.12,false);`],
 ['box(x+side*w*.46,y+.2,end+1.25,.17,h*.69,.17,wood);','box(x+side*w*.46,y+.2,end+1.25,.17,Math.max(h*.69,2.53),.17,wood);'],
]);
edit("HouseInteriors.js",[
 [' const maxRun=asagi?4.15:4.6;',` const maxRun=asagi?5.55:4.6;
 const gradeAt=(a,b)=>terrainSurface(...villagePoint(a,b));`],
 ['landing-terrainSurface(x,edge+run)','landing-gradeAt(x,edge+run)'],
 ['const end=edge+run,low=terrainSurface(x,end)+.035;','const end=edge+run,low=gradeAt(x,end)+.035;'],
 ['Math.min(low,terrainSurface(x,near),terrainSurface(x,far),top-.105)','Math.min(low,gradeAt(x,near),gradeAt(x,far),top-.105)'],
]);
edit("rigged-scene.mjs",[
 ['from "./PlayerMotion.mjs"','from "./PlayerMotion.mjs?v=granary-landing"'],
 ['combat,airborne,hit,soilShot','combat,airborne,jumpTime,jumpVelocity,hit,soilShot'],
 ['   playerMotion?.update({active:grounded,airborne,dt,speed,combat,hit});',`   if(grounded&&airborne)prince.poseJump(facing,speed,jumpTime,jumpVelocity);
   playerMotion?.update({active:grounded,airborne,dt,speed,combat,hit});`],
 [' groundFeet(groundAt){',` poseJump(facing,speed,time,velocity){
  const forward=vector(Math.sin(facing),0,Math.cos(facing));
  const lateral=vector(Math.cos(facing),0,-Math.sin(facing));
  const ease=smooth(0,.12,time);
  const tuck=ease*smooth(-4.4,-.45,velocity)*(1-smooth(2.8,5.1,velocity));
  const reach=smooth(.4,5.5,speed);
  const extension=(1-smooth(-4.7,-1.2,velocity))*ease;
  for(const [i,leg] of this.legs.entries()){
   const [,knee,foot]=leg.chain;
   if(!knee||!foot)continue;
   const stagger=i===0?1:-1;
   const target=worldPosition(foot).addScaledVector(forward,tuck*(.055+stagger*(.025+.08*reach))+extension*stagger*.048);
   target.y+=tuck*(i===0?.30:.23)+extension*.035;
   solveLimb(leg.chain,target,forward);
  }
  for(const [i,arm] of this.arms.entries()){
   const side=i===0?1:-1;
   const amount=ease*(.64+.36*tuck);
   const target=worldPosition(arm[2]).addScaledVector(forward,amount*(.10+.08*side*reach))
    .addScaledVector(lateral,amount*side*.07);
   target.y+=amount*.09+tuck*.12;
   const bend=forward.clone().multiplyScalar(.65).addScaledVector(lateral,side*.55);
   solveLimb(arm,target,bend);
  }
  if(this.spine){
   const axis=lateral.clone().applyQuaternion(this.spine.parent.getWorldQuaternion(this.leanRotation).invert());
   this.spine.quaternion.premultiply(this.leanRotation.setFromAxisAngle(axis,(.06+.16*reach)*tuck));
  }
  this.root.updateMatrixWorld(true);
 }
 groundFeet(groundAt){`],
]);
edit("PlayerMotion.mjs",[
 ['this.landing+dt/.46','this.landing+dt/.34'],
 ['   this.apply("land",lerp(.20,.94,phase),.81*envelope(phase));','   const absorb=smoothstep(phase,0,.16)*(1-smoothstep(phase,.38,1));\n   this.apply("land",lerp(.20,.94,phase),.74*absorb);'],
]);
