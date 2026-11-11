"use strict";
const fs=require("node:fs"),path=require("node:path");
const game=process.argv[2];
const gameplay=fs.readFileSync(path.join(__dirname,'SoilGameplay.js'),'utf8');
const edit=(file,patch)=>{const dest=path.join(game,file), source=fs.readFileSync(dest,"utf8"), updated=patch(source);if(updated===source)throw Error("Campaign hook missing in "+file);fs.writeFileSync(dest,updated);};
edit("ResidentCast.mjs",s=>s.replace('   for(const entry of named)load','   const soilRoleLoads=[];\n   const roles={irena:"brunnen-12-canal-maintainer",mara:"brunnen-27-lamplighter",renat:"brunnen-18-cooper",genzo:"asagi-01-rice-grower",child:"asagi-02-rail-clerk",keeper:"brunnen-02-lock-keeper"};\n   for(const [role,label] of Object.entries(roles)){\n    if(!(region===0||region===1||region===7))continue;\n    const entry=entries.find(entry=>entry.label===label);\n    if(entry)soilRoleLoads.push(load(entry,0).then(actor=>{if(role==="child")actor.root.scale.multiplyScalar(.64);group.named.set(role,actor);}).catch(console.warn));\n   }\n   group.soilRoles=Promise.all(soilRoleLoads);\n   for(const entry of named)load'));
edit("ResidentCast.mjs",s=>s
 .replace('  tasks.then(actors=>','  group.loading=tasks;tasks.then(actors=>')
 .replace('  update(region,residents,named,time,eye){','  async prepareSoil(){const group=ensure(0);await group.loading;await group.soilRoles;},\n  wrist(label,index){return last?.named.get(label)?.arms[index].wrist.getWorldPosition(new THREE.Vector3());},\n  update(region,residents,named,time,eye){')
 .replace('if(resident){const p=routePose(resident,time);pose(actor,p.position,p.yaw,p.stride,p.effort);}',`if(resident){
     const p=routePose(resident,time);pose(actor,p.position,resident.yaw??p.yaw,p.stride,p.effort);
     if(resident.arms){
      for(const [i,{shoulder,elbow}] of actor.arms.entries()){
       shoulder.rotation.x=resident.arms[i]*-.65;
       elbow.rotation.x=resident.arms[i]*-.38;
      }
      actor.root.updateMatrixWorld(true);
     }
    }`));
edit("asagi-water.js",s=>s.replace(' for(const p of asagiPaddies){',' for(const p of soilDryPaddies()?[]:asagiPaddies){'));
edit("QuestMap.js",s=>s.replace('function activeMapQuests(){','function activeMapQuests(){\n if(s.soilCampaign?.step){const ep=soilEpisode();return ep?[{type:"main",region:ep.region,spot:ep.place,title:"왕이 먹는 흙",description:ep.title}]:[];}'));
edit("rigged-scene.mjs",s=>{
 s='import {makeSoilProps} from "./SoilOpening.mjs";\n'+s;
 s=s.replace(' const key=makeKey();',' const key=makeKey(),soilProps=makeSoilProps();')
  .replace('  residentCastReady:crowd.ready,','  residentCastReady:crowd.ready,prepareSoilCast:crowd.prepareSoil,')
  .replace(' scene.add(sky,sun,key,prince.root,genzo.root);',' scene.add(sky,sun,key,prince.root,genzo.root,soilProps.jar,soilProps.lantern);')
  .replace('weather,residents,namedResidents,eye})','weather,residents,namedResidents,eye,soilShot,seedJar})')
  .replace('   genzo.root.visible=asagi;','   genzo.root.visible=asagi&&(!soilShot||Boolean(soilShot.genzo));')
  .replace('   renderer.resetState();','   positionSoilProps();\n   renderer.resetState();')
  .replace('   positionSoilProps();',`   function positionSoilProps(){
    const jar=soilShot?soilShot.jar:seedJar;
    soilProps.jar.visible=Boolean(jar);
    if(jar){soilProps.jar.position.fromArray(jar);soilProps.jar.rotation.y=soilShot?.princeHands?2.6:0;}
    const lantern=soilShot?.lantern;
    soilProps.lantern.visible=Boolean(lantern);
    if(lantern){
     soilProps.lantern.position.fromArray(lantern);
     soilProps.lantern.scale.setScalar(soilShot?.lanternInHand?.75:1);
     if(soilShot?.lanternInHand){
      const grip=crowd.wrist("child",1);
      if(grip)soilProps.lantern.position.copy(grip).add(vector(.022,-.184,.035));
     }
    }
    if(soilShot?.genzo){
     const {position,yaw}=soilShot.genzo;
     genzo.place(position,yaw,0,dt,true);
     if(lantern){
      const grip=genzo.reach(1,vector(lantern[0],lantern[1]+.06,lantern[2]+.12),.92,.30);
      soilProps.lantern.position.copy(grip).add(vector(.053,-.076,-.070));
     }
    }
    if(soilShot?.princeHands&&jar){
     prince.reach(0,vector(jar[0]-.233,jar[1]+.22,jar[2]+.11),.96,.57);
     prince.reach(1,vector(jar[0]+.233,jar[1]+.22,jar[2]+.11),.96,.57);
    }
   }
   positionSoilProps();`);
 return s;
});
edit("index.html",s=>{
 s=s.replace(/\r\n/g,"\n");
 const replace=(a,b)=>{if(!s.includes(a))console.error("Campaign index hook missing "+a);s=s.replace(a,b)};
 replace('const $=id=>document.getElementById(id);','const $=id=>document.getElementById(id);\n'+gameplay);
 replace('<script>\n"use strict";\nconst regionData','<script src="SoilCampaign.js"></script><script>\n"use strict";\nconst regionData');
 replace('<div class="opening-caption"', '<link rel="stylesheet" href="soil-opening.css"><div class="opening-caption"');
 replace('if(opening.open)updateOpening(simulationTime);','if(opening.open&&!window.soilOpening)updateOpening(simulationTime);');
 replace(' opening.close();\n scene.classList.remove("playing-opening");',' const soil=window.soilOpening;\n if(soil){window.soilOpening=null;opening.classList.remove("soil-opening");}\n opening.close();\n scene.classList.remove("playing-opening");');
 replace(' if(firstArrival){\n  s.asagiTrainDeparted=true;',` if(firstArrival&&soil){
  player={...soilHandoff};
  selected="field";actionSpot=null;
  heading=facing=0;
  pitch=.10;zoom=4.4;
  s.soilCampaign??=SoilCampaign.state();
 }
 if(firstArrival){
  s.asagiTrainDeparted=true;`);
 replace(' if(firstArrival)questSubtitle(...firstAsagiWalk);',' if(firstArrival)soil?questSubtitle("왕이 먹는 흙",soilObjective()):questSubtitle(...firstAsagiWalk);');
 replace(' opening.showModal();\n}',` opening.showModal();
 if(s.introPending&&s.region===0&&s.stage===0){
  opening.classList.add("soil-opening");
  setOpeningShot(["soil","","시네마틱 준비 중"]);
  const pending={previous};
  window.soilOpening=pending;
  Promise.all([import("./SoilOpening.mjs"),riggedScene?.prepareSoilCast()]).then(([{createSoilOpening}])=>{
   if(window.soilOpening!==pending)return;
   window.soilOpening=createSoilOpening(performance.now(),previous);
  }).catch(error=>{
   console.warn("Soil opening",error);
   if(window.soilOpening===pending){window.soilOpening=null;opening.classList.remove("soil-opening");setOpeningShot(openingShots[0]);}
  });
 }
}`);
 replace(' if(s.region===0)buildAsagiValley();',` if(s.region===0){
  buildAsagiValley();
  if(s.soilCampaign?.step||s.introPending){
  const x=309,z=357,y=height(x,z),hx=309,hz=339;
  houseMesh(hx,hz,7.1,4.9,3.4,color("#6f5844"),color("#403e39"),"아사기 공동 창고");
  const floor=soilGranaryFloor(hx,hz);
  for(const level of [.54,1.04,1.58,2.12])box(hx-.38,floor+level,hz-1.62,4.45,.095,.62,color("#654d36"),0,surface.wall);
  for(const a of [hx-2.55,hx+1.82])box(a,floor,hz-1.62,.13,2.22,.60,color("#513e2d"),0,surface.wall);
  const lossNames=s.soilCampaign?.losses??[];
  for(let i=0;i<Math.max(11,lossNames.length);i++){
   const a=119.6+(i%6)*1.25+Math.sin(i*8)*.22,b=325.9-Math.floor(i/6)*1.6+Math.cos(i)*.21,base=height(a,b);
   const rise=.47+(i%4)*.14, width=.38+(i%3)*.048;
   box(a,base-.05,b,width*1.54,.22,.53,color("#777970"),i*.11,surface.masonry);
   box(a,base+.14,b,width,rise,.24,color("#888a7f"),i*.11,surface.masonry);
   aimBox(lossNames[i]??"묘석",a,b,.85,.54,base,base+rise+.2);
  }
  box(x+1.76,y,z,.24,2.40,.24,color("#544132"),0,surface.wall);
  box(x-1.76,y,z,.24,2.40,.24,color("#544132"),0,surface.wall);
  box(x,y+2.25,z,.28,.28,2.5,color("#584936"));
  for(const side of [-1,1]){
   const a=[x-2.19,y+2.47,z+side*1.62],b=[x+2.19,y+2.47,z+side*1.62];
   const c=[x+2.19,y+3.13,z],d=[x-2.19,y+3.13,z];
   quad(...(side===1?[a,b,c,d]:[b,a,d,c]),color("#41484b"),surface.roof);
   box(x+side*1.78,y,z-1.09,.22,2.40,.22,color("#514637"),0,surface.wall);
  }
  for(let i=0;i<11;i++){
   const b=z-9+i*.78,a=x-.25+Math.sin(i*.77)*.19,base=height(a,b);
   box(a,base-.045,b,1.12,.11,.52,shade(color("#858174"),.87+(i%4)*.05),Math.sin(i*2)*.12,surface.paving);
  }
  for(const side of [-1,1])box(x+side*1.61,y+1.05,z+1,.22,2.1,.22,color("#584936"));
  if(s.soilCampaign?.planted){
   const a=x+(s.soilCampaign.planted.plot==="공동 밭"?7:-7),b=z+8;
   const growth=Math.min(.55,.12+.07*Math.max(0,s.day-s.soilCampaign.planted.day));
   for(let i=0;i<6;i++)for(let j=0;j<4;j++)box(a+i*.23,height(a+i*.23,b+j*.21),b+j*.21,.038,growth,.038,color("#68814d"));
  }
  aimBox("창고 앞 경계초소",x,z,3.5,2.5,y-.1,y+2.5,null,{type:"soil-guard",x,z,reach:5});
  }
 }`);
 replace('const [title,hint]=s.region===0','const [title,hint]=soilObjective()?["왕이 먹는 흙",soilObjective()]:s.region===0');
 replace('function actionText(action){','function actionText(action){\n if(action.type==="soil-guard")return "경계초소 확인";');
 replace(' if(!actionInReach(action))return false;',` if(!actionInReach(action))return false;
 if(action.type==="soil-guard"){
  if(s.soilCampaign?.step!=="guard")return false;
  soilMission();
  return true;
 }`);
 replace('function unlocked(index){return','function unlocked(index){if(s.soilCampaign?.step){const act=s.soilCampaign.act;return index===0||(act>=2&&index===1)||(act>=3&&index<=6)||act>=4;}return');
 replace(' if(selected==="station"){add("상점 열기"',' if(soilEpisode()?.region===s.region&&soilEpisode()?.place===selected)add(soilEpisode().title,soilMission,true);\n if(s.soilCampaign?.step&&["station","field"].includes(selected))add("주민과 이야기",soilResidents);\n if(selected==="station"){add("상점 열기"');
 replace('if(s.region===0)add("사에와 이야기",talk)','if(s.region===0&&!s.soilCampaign?.step)add("사에와 이야기",talk)');
 replace('if(s.region===0)add("수문 살펴보기",storyGate,true);','if(s.region===0){if(!s.soilCampaign?.step)add("수문 살펴보기",storyGate,true);}');
 replace(' button(body,"설정",settingsMenu);',' button(body,"설정",settingsMenu);\n if(s.soilCampaign?.step){button(body,"보급 장부",soilLedger);button(body,"주민과 현장 업무",soilResidents);}');
 replace('namedResidents:cinematic?{}:namedResidentRoutes','namedResidents:cinematic?{}:soilNamedRoutes()');
 replace(' if(graphics&&s.region===0&&actionSpot==="station")button(body,"아사기 도착 장면 다시 보기",()=>{',' if(graphics&&s.soilCampaign?.step)button(body,"왕이 먹는 흙 오프닝 다시 보기",()=>{document.getElementById("dialog").close();playOpening(true);});\n if(graphics&&!s.soilCampaign?.step&&s.region===0&&actionSpot==="station")button(body,"왕이 먹는 흙 시작",()=>{document.getElementById("dialog").close();s.introPending=true;playOpening();});\n if(graphics&&!s.soilCampaign?.step&&s.region===0&&actionSpot==="station")button(body,"아사기 도착 장면 다시 보기",()=>{');
 replace('function playOpening(){','function playOpening(replay=false){\n const previous=replay?{player,selected,actionSpot,heading,facing,pitch,zoom}:null;');
 replace(' if(s.introPending&&s.region===0&&s.stage===0){',' if(replay||s.introPending&&s.region===0){');
 replace(' s.introPending=false;\n if(firstArrival&&soil){',' if(soil?.previous){({player,selected,actionSpot,heading,facing,pitch,zoom}=soil.previous);keys.clear();render();canvas.focus({preventScroll:true});return;}\n s.introPending=false;\n if(soil&&s.region===0){');
 replace(' if(firstArrival)soil?questSubtitle',' if(soil||firstArrival)soil?questSubtitle');
 replace(' if(index===1&&s.stage===4){',' if(!s.soilCampaign?.step&&index===1&&s.stage===4){');
 replace(' const previous=replay?{player,selected,actionSpot,heading,facing,pitch,zoom}:null;',' const previous=replay?{player,selected,actionSpot,heading,facing,pitch,zoom,hour:s.hour}:null;');
 replace(' if(replay||s.introPending&&s.region===0){',' if(s.region===0&&(replay||s.introPending)){\n  player={...soilHandoff};heading=facing=0;pitch=.10;zoom=4.4;\n  s.hour=17.15;loadedScene="";');
 replace('keys.clear();render();canvas.focus({preventScroll:true});return;}','s.hour=soil.previous.hour;keys.clear();render();canvas.focus({preventScroll:true});return;}');
 replace(' if(graphics&&s.soilCampaign?.step)button(body,"왕이 먹는 흙 오프닝',' if(graphics&&s.region===0&&s.soilCampaign?.step)button(body,"왕이 먹는 흙 오프닝');
 replace(' ensureWorld();\n const rect=canvas.getBoundingClientRect()',` ensureWorld();
 const soilFilm=window.soilOpening;
 let soilShot=soilFilm?.sample?.(time,terrainSurface,soilGranaryFloor);
 if(soilShot===null){finishOpening();soilShot=undefined;}
 if(soilShot){
  opening.dataset.soilTime=soilShot.t.toFixed(2);
  if($("opening-title").textContent!==soilShot.title)$("opening-title").textContent=soilShot.title;
  if($("opening-line").textContent!==soilShot.line)$("opening-line").textContent=soilShot.line;
 }
 const rect=canvas.getBoundingClientRect()`);
 replace(' const cinematic=opening.open;',' const cinematic=opening.open&&!soilFilm;');
 replace(' const {eye,at}=cinematic?openingCamera(gameEye,gameAt):{eye:gameEye,at:gameAt};',' const {eye,at}=soilShot?{eye:mix(soilShot.eye,gameEye,soilShot.blend??0),at:mix(soilShot.at,gameAt,soilShot.blend??0)}:cinematic?openingCamera(gameEye,gameAt):{eye:gameEye,at:gameAt};');
 replace('updateAim(eye,at,time,cinematic||','updateAim(eye,at,time,opening.open||');
 replace(' const projection=perspective(width/h), viewMatrix=view(eye,at);',' const projection=perspective(width/h);\n if(soilShot){projection[0]*=soilShot.lens;projection[5]*=soilShot.lens;}\n const viewMatrix=view(eye,at);');
 replace(' const actorFacing=cinematic?',' const actorFacing=soilShot?.yaw??(cinematic?');
 replace('smoothCut(16.8,18,asagiFilm.seconds)):facing;','smoothCut(16.8,18,asagiFilm.seconds)):facing);');
 replace('  player:[player.x,y,player.y],facing:actorFacing,speed:movement.speed,','  player:soilShot?.prince??[player.x,y,player.y],facing:actorFacing,speed:soilShot?.speed??movement.speed,');
 replace('  groundAt:(x,z)=>supportAt(x,z,y+.23),','  groundAt:(x,z)=>supportAt(x,z,(soilShot?.prince[1]??y)+.23),');
 replace('  residents:cinematic?[]:townResidents,namedResidents:cinematic?{}:soilNamedRoutes()','  residents:cinematic||soilShot?[]:townResidents,namedResidents:soilShot?soilShotResidents(soilShot):cinematic?{}:soilNamedRoutes(),soilShot,seedJar:s.region===0&&s.soilCampaign?.step?[309.2,soilGranaryFloor(309,339)+1.14,337.43]:null');
 replace('   ricePlant(xp,ground-.012,zp,random);',`   if(soilDryPaddies()){
    for(let stem=0;stem<4;stem++){
     const a=xp+(random()-.5)*.19,b=zp+(random()-.5)*.19,h=.14+random()*.16;
     tube([a,ground-.015,b],[a+(random()-.5)*.09,ground+h,b+.025],.008,.003,color("#a8925c"),0,4);
    }
   }else ricePlant(xp,ground-.012,zp,random);`);
 replace('  s.asagiFirstWalk=true;\n  loadedScene="";','  s.asagiFirstWalk=!soil;\n  if(!soil)loadedScene="";');
 replace(' const open=Boolean(s.openDoors?.[id]);',' const open=name==="아사기 공동 창고"||Boolean(s.openDoors?.[id]);');
 return s;
});

require("./IntegrateCharacterAnatomy.cjs")(edit);
require("./IntegrateCharacterGroom.cjs")(edit);
require("./IntegratePortraitSurface.cjs")(edit);
require("./IntegrateScalpTint.cjs")(edit);
