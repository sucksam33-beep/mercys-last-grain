"use strict";

module.exports=edit=>{
 edit("ResidentPortrait.mjs",s=>{
  const source=s.replace(/\r\n/g,"\n");
  return 'import {buildResidentGroom,portraitHairStyle} from "./CharacterGroom.mjs";\n'+source.replace(
   'actor.head.add(photoHead(portrait,height,width,lowered,neckline,neckScale),hairstyle(portrait,height,width,lowered,label));',
   `const style=portraitHairStyle(label,castHair[label]??"part");
 const head=photoHead(portrait,height,width,lowered,neckline,neckScale);
 const hair=buildResidentGroom(portrait,height,width,lowered,label,style,head.geometry);
 if(style==="cap"||style==="scarf"){
  const covering=hairstyle(portrait,height,width,lowered,label);
  covering.name="head-covering";hair.add(covering);
 }
 actor.head.add(head,hair);`);
 });
 edit("ResidentCast.mjs",s=>{
  const source=s.replace(/\r\n/g,"\n");
  return 'import {updateGroomDistance} from "./CharacterGroom.mjs";\n'+source
   .replace('if(actor.root.visible)pose(actor,p.position,p.yaw,p.stride,p.effort);',
    'if(actor.root.visible){pose(actor,p.position,p.yaw,p.stride,p.effort);updateGroomDistance(actor.head,Math.hypot(p.position[0]-eye[0],p.position[2]-eye[2]));}')
   .replace('const p=routePose(resident,time);pose(actor,p.position,resident.yaw??p.yaw,p.stride,p.effort);',
    'const p=routePose(resident,time);pose(actor,p.position,resident.yaw??p.yaw,p.stride,p.effort);updateGroomDistance(actor.head,Math.hypot(p.position[0]-eye[0],p.position[2]-eye[2]));');
 });
 edit("rigged-scene.mjs",s=>{
  const source=s.replace(/\r\n/g,"\n");
  return 'import {addGenzoGroom,updateGroomDistance} from "./CharacterGroom.mjs";\n'+source
   .replace(' const station=stationResult?', ' addGenzoGroom(genzo);\n const station=stationResult?')
   .replace('   crowd.update(region,residents,namedResidents,time,eye);',`   const {genzo:genzoRoute,...otherResidents}=namedResidents;
   crowd.update(region,residents,otherResidents,time,eye);`)
   .replace('    genzo.place([94.46,platformY+.11,117.72],-Math.PI/2,0,dt);',`    const missionPosition=filmTime===null&&!soilShot?genzoRoute?.points[0]:null;
    genzo.place(missionPosition??[94.46,platformY+.11,117.72],missionPosition?0:-Math.PI/2,0,dt,Boolean(missionPosition));`)
   .replace('   positionSoilProps();','   positionSoilProps();\n   updateGroomDistance(genzo.head,Math.hypot(genzo.root.position.x-eye[0],genzo.root.position.z-eye[2]));');
 });
};
