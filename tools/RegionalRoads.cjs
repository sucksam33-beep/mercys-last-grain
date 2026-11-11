const fs=require("node:fs"),path=require("node:path");
const dir=process.argv[2];
function edit(name,changes){
 const file=path.join(dir,name);let text=fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n");
 for(const [before,after] of changes){if(!text.includes(before))throw Error(name+" hook missing: "+before);text=text.replace(before,after);}
 fs.writeFileSync(file,text);
}
edit("OpenWorld.js",[
 ["const canyonLaneHalfWidth=10;",`const canyonLaneHalfWidth=10;
// Signed shoulder elevations in metres. A negative lobe lowers the verge.
const regionalVergeProfiles={
 0:{left:[[23,7,5.8],[41,10,5.6]],right:[[20,6,2.8],[34,10,7]],tint:[.43,.49,.30]},
 1:{left:[[20,10,2.6],[37,13,3.5]],right:[[19,7,3.7],[34,11,-1.8]],tint:[.50,.47,.38]},
 4:{left:[[27,10,11],[49,13,8]],right:[[25,9,6],[42,10,8]],tint:[.49,.53,.49]},
 5:{left:[[17,8,1.9],[37,12,-2.6]],right:[[17,8,2.2],[38,12,-3.6]],tint:[.39,.44,.32]},
 6:{left:[[27,13,6],[47,10,5]],right:[[18,9,2.9],[39,14,-2.1]],tint:[.64,.57,.42]},
 7:{left:[[30,10,12.3],[49,12,8.2]],right:[[23,8,6.7],[40,12,8.5]],tint:[.59,.64,.65]}
};
`],
 ["const ramp=road.canyon ? lerp(.14*terrainEase(18,48,distance),.24,terrainEase(112,155,distance)):.24;",
  "const ramp=lerp(.14*terrainEase(18,48,distance),.24,terrainEase(112,155,distance));"],
 [" const relief=canyon&&(region===2||region===3)?canyonPassRelief(region,closest,along,side):0;",
  " const relief=canyon&&(region===2||region===3)?canyonPassRelief(region,closest,along,side):regionalVergeRelief(region,along,side);"],
 ["function canyonPassRelief(region,road,distance,side){",`function regionalVergeRelief(region,along,side){
 const profile=regionalVergeProfiles[region],offset=Math.abs(side);
 if(!profile||along>94||offset<11||offset>62)return 0;
 const fade=terrainEase(4,22,along)*(1-terrainEase(72,94,along));
 const limit=terrainEase(11,16,offset)*(1-terrainEase(51,62,offset));
 const shift=Math.sin(along*.092+region)*2.4+Math.sin(along*.201)*.7;
 const lobes=side<0?profile.left:profile.right;
 const height=lobes.reduce((sum,[center,width,rise])=>sum+rise*landBell(offset,center+shift,width),0);
 return fade*limit*height*(.85+.15*Math.sin(along*.065+region));
}
function regionalVergeTint(region,x,y,z,up,tint){
 const profile=regionalVergeProfiles[region];
 if(!profile)return tint;
 const offset=regionalVergeDistance(region,x,z);
 if(offset<9||offset>=63)return tint;
 const edge=terrainEase(9,22,offset)*(1-terrainEase(48,63,offset));
 const exposed=(1-terrainEase(.50,.96,up))*.56+.12;
 const fleck=.91+.055*Math.sin(y*2.7+x*.09)+.04*Math.cos(z*.23);
 return mix(tint,shade(profile.tint,fleck),edge*exposed);
}
function regionalVergeDistance(region,x,z){
 if(!regionalVergeProfiles[region])return Infinity;
 let distance=Infinity;
 for(const road of worldRoads[region]){
  const [a,b]=road.edge,along=-road.x*(x-a)-road.z*(z-b);
  if(along<0||along>94)continue;
  const offset=Math.abs(road.z*(x-a)+road.x*(z-b));
  distance=Math.min(distance,offset+terrainEase(74,94,along)*64);
 }
 return distance;
}
function roadVergeDistance(region,x,z){
 return Math.min(canyonVergeDistance(region,x,z),regionalVergeDistance(region,x,z));
}
function canyonPassRelief(region,road,distance,side){`],
 [" if(region!==2&&region!==3)return [];\n const snap="," const sculpted=region===2||region===3;\n const snap="],
 [" return worldRoads[region].filter(road=>road.canyon).map(({edge,x:dx,z:dz})=>{",
  " return worldRoads[region].filter(road=>!sculpted||road.canyon).map(({edge,x:dx,z:dz})=>{"],
 ["  const a=x-dx*103,b=z-dz*103;","  const span=sculpted?103:94;\n  const a=x-dx*span,b=z-dz*span;"],
 ["  const canyon=region===2||region===3,columns=canyon?159:65,rows=canyon?101:41;",
  "  const canyon=region===2||region===3,columns=159,rows=101;"],
 ["   if(canyon){","   {"],
 ["     p.rockTint??=canyonPassTint(region,...p.pos,p.normal[1],p.tint);",
  "     p.rockTint??=(canyon?canyonPassTint:regionalVergeTint)(region,...p.pos,p.normal[1],p.tint);"],
 ["   }else{\n    triangle(a.pos,b.pos,c.pos,mix(a.tint,c.tint,.5),2);\n    triangle(a.pos,c.pos,d.pos,mix(b.tint,d.tint,.5),2);\n   }","   }"],
 ["   const a=points[row-1][col-1],b=points[row][col-1],c=points[row][col],d=points[row-1][col];\n",""]
]);
edit("index.html",[
 ["?canyonPassTint(s.region,x,y,z,up,canyonTint(s.region,x,y,z,up,ground)):ground;",
  "?canyonPassTint(s.region,x,y,z,up,canyonTint(s.region,x,y,z,up,ground)):regionalVergeTint(s.region,x,y,z,up,ground);"],
 ["canyonVergeDistance(s.region,x,z)<3.8+trunk","roadVergeDistance(s.region,x,z)<3.8+trunk"],
 [" if(!villageFrame&&s.region!==2&&s.region!==3&&openWorldCrossing(x,z))return height(x,z);\n",""]
]);
edit("asagi-plants.js",[["canyonVergeDistance(region,x,z)-1.15","roadVergeDistance(region,x,z)-1.15"]]);
edit("regional-terrain.js",[["canyonVergeDistance(s.region,x,z)<3.8+radius*.65","roadVergeDistance(s.region,x,z)<3.8+radius*.65"]]);

edit("OpenWorld.js",[["return {x:left,z:top,step:2,columns:(right-left)/2+1,rows:(bottom-top)/2+1};","const step=base.step===5?2.5:2; return {x:left,z:top,step,columns:(right-left)/step+1,rows:(bottom-top)/step+1};"]]);
