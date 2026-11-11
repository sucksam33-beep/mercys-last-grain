const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.join(__dirname,"dialogue-opening-stage","game");
function edit(file,changes){
 const p=path.join(root,file);
 let source=fs.readFileSync(p,"utf8").replaceAll("\r\n","\n");
 for(const [before,after] of changes){
  assert.equal(source.split(before).length,2,file+" "+before.slice(0,60));
  source=source.replace(before,()=>after);
 }
 fs.writeFileSync(p,source);
}
edit("VillageCharacter.js",[[
`const villagePalette=[
 ["#9c9880","#5d4937","#b5a887","#555b52"],["#b99b75","#8c6956","#b7ae93","#565d65"],
 ["#b87e55","#cc9d69","#9a5844","#775440"],["#7f7659","#9a7359","#6a6e54","#53493b"],
 ["#788887","#9b8e7d","#829485","#4b5961"],["#829483","#8d765c","#a7a084","#4f6256"],
 ["#d4b57c","#a77550","#c6b997","#806649"],["#929fa6","#8b918d","#707f86","#475864"]
];`,
`// Asagi terraces, Brunnen blocks, Santa Lucia courts, Juniperwell contour rows,
 // Beaverton rail lanes, Saint Aurel embankments, Ambaro beach lanes, Karuk windbreaks.
const villageDistricts=[
 {walls:["#e6d8b5","#a27a52","#c19d72","#e8d9bd"],roof:["#354e57","#565d5c","#5d453c"],trim:"#70462c",roofForms:[1,4,1],rise:.43,size:[1.12,1.02,.88],layout:"terraces",goal:22,spacing:3.6},
 {walls:["#debc89","#c27960","#e2cfac","#ab9c87"],roof:["#46596d","#884a40","#54586d"],trim:"#5b594f",roofForms:[3,5,6],rise:.63,size:[.91,1.11,1.39],layout:"blocks",goal:76,spacing:2.6},
 {walls:["#e6b278","#d48353","#f3d0a0","#b86344"],roof:["#a85135","#86472e","#b77a4e"],trim:"#317178",roofForms:[0,0,4],rise:.28,size:[1.16,1.04,.84],layout:"courts",goal:23,spacing:3.5},
 {walls:["#b38658","#907052","#bc9b70","#876149"],roof:["#3f4f40","#884b32","#595042"],trim:"#633d28",roofForms:[3,3,2],rise:.49,size:[1.03,.91,1.02],layout:"contours",goal:22,spacing:3.7},
 {walls:["#a26743","#c78b48","#dbbe8a","#805445"],roof:["#516771","#455164","#745342"],trim:"#ede0b9",roofForms:[5,3,6],rise:.75,size:[1.02,1.18,1.06],layout:"rail",goal:22,spacing:3.9},
 {walls:["#9eb6a1","#6c9c99","#dfc69b","#9a715a"],roof:["#5b7273","#855648","#537c69"],trim:"#e9d8ab",roofForms:[1,2,4],rise:.36,size:[.92,1.15,.97],layout:"embankments",goal:24,spacing:3.6},
 {walls:["#e8bb79","#c69459","#e8d6a3","#bd7950"],roof:["#b67248","#7a6641","#99774a"],trim:"#307873",roofForms:[1,4,1],rise:.55,size:[1.10,.95,.88],layout:"beach",goal:23,spacing:3.9},
 {walls:["#a45d48","#a6a7a0","#566d75","#c19b6c"],roof:["#3d5263","#685d53","#434c51"],trim:"#c5d3d5",roofForms:[5,5,2],rise:.81,size:[.90,1.10,.91],layout:"windbreaks",goal:23,spacing:3.7}
];
const villagePalette=villageDistricts.map(district=>district.walls);
function villageIdentityDetails(x,y,z,w,d,h,plan){
 const district=villageDistricts[s.region],trim=color(district.trim),front=z+d*.5;
 const wood=surface.wall,stone=surface.masonry;
 const beam=(a,b,width=.12,tint=trim)=>tube(a,b,width,width,tint,wood,4);
 const band=(level,tint=trim)=>box(x,y+h*level,front+.04,w+.12,.13,.16,tint,0,wood);
 const shutters=(tall=false)=>{
  for(const offset of [-.30,.30])for(const side of [-1,1])
   box(x+w*offset+side*w*.097,y+h*.42,front+.30,w*.054,h*(tall?.39:.28),.085,trim,0,wood);
 };
 switch(district.layout){
  case "terraces":
   band(.34);band(.77);
   for(const sign of [-1,1])for(let n=0;n<5;n++)
    box(x+sign*w*.28+(n-2)*w*.033,y+h*.41,front+.34,.048,h*.28,.062,trim,0,wood);
   break;
  case "blocks":
   for(const level of [.28,.67,.92])band(level,shade(trim,1.24));
   for(const offset of [-.32,0,.32]){
    const a=x+offset*w,high=y+h*.73;
    box(a,high,front+.10,w*.13,h*.16,.16,shade(plan.wall,.44),0,stone);
    beam([a-w*.09,high+h*.16,front+.23],[a+w*.09,high+h*.16,front+.23],.055,shade(plan.wall,1.25));
   }
   break;
  case "courts":
   band(.18,shade(plan.wall,.75));band(.86,shade(plan.wall,1.17));shutters();
   for(const offset of [-.44,.44])box(x+offset*w,y+h*.87,front+.12,.18,.18,.62,shade(trim,.56),0,wood);
   break;
  case "contours":
   for(let n=1;n<7;n++)band(n/8,shade(trim,.78+n*.045));
   for(const sign of [-1,1])beam([x+sign*w*.11,y+h*.83,front+.22],[x+sign*w*.44,y+h*.39,front+.22],.095);
   break;
  case "rail":
   band(.22);band(.72);
   for(const offset of [-.44,-.18,.18,.44])box(x+w*offset,y+h*.23,front+.13,.105,h*.57,.13,trim,0,wood);
   box(x,y+h*.84,front+.09,w*.37,.32,.12,shade(trim,.82),0,wood);
   break;
  case "embankments":
   band(.22);band(.82);shutters(true);
   for(const offset of [-.42,.42]){
    const a=x+w*offset;
    beam([a,y+h*.26,front+.15],[a,y+h*.84,front+.15],.085);
   }
   break;
  case "beach":
   band(.26);band(.78);shutters();
   for(const offset of [-.33,.33]){
    const a=x+w*offset;
    for(let n=0;n<4;n++)beam([a-.41,y+h*.43+n*.12,front+.42],[a+.41,y+h*.43+n*.12,front+.42],.028,shade(trim,1.14));
   }
   break;
  case "windbreaks":
   band(.20);band(.82);shutters();
   for(const offset of [-.42,.42])beam([x+w*offset,y+h*.24,front+.15],[x+w*offset,y+h*.88,front+.15],.080,trim);
   break;
 }
}
`]]);
edit("BuildingVariation.js",[
 [' const material=mix(regional', ' const district=villageDistricts[s.region];\n const material=mix(regional'],
 [' const facade=mix(wall,material,.40+random()*.36);',' const facade=mix(wall,material,.54+random()*.25);'],
 [' const roofTone=mix(roof,regional[Math.floor(random()*4)],.20+random()*.38);',' const roofTone=mix(roof,color(district.roof[Math.floor(random()*district.roof.length)]),.77);'],
 ['  silhouette:Math.floor(random()*7),rise:.23+random()*.35,','  silhouette:district.roofForms[Math.floor(random()*district.roofForms.length)],rise:district.rise+(random()-.5)*.16,'],
 ['roof:shade(roofTone,.73+random()*.39)','roof:shade(roofTone,.90+random()*.19)'],
]);
edit("SettlementExpansion.js",[
 [' const city=s.region===1,goal=city?72:14;', ' const city=s.region===1,district=villageDistricts[s.region],goal=district.goal;'],
 [` }else geographySites[s.region].forEach(([x,z],row)=>{
  for(let column=0;column<56;column++){
   const district=s.region;
   const angle=column*2.399963+row*1.1+district*.57;
   const radius=8+19*Math.sqrt((column+.5)/56);
   const shape=[[1.23,.69],[1,1],[.78,1.25],[1.25,.62],[1.20,.80],[1.44,.58],[.75,1.34],[1.34,.63]][district];
   const dx=Math.cos(angle)*radius*shape[0],dz=Math.sin(angle)*radius*shape[1];
   candidates.push({x:x+dx,z:z+dz,lane:z,key:row,row,column,
    yard:[x,z],turn:Math.abs(dx)>Math.abs(dz)?(dx>0?1:3):(dz>0?2:0)});
  }
 });`,` }else{
  const centers=geographySites[s.region];
  const lots=[];
  const add=(along,across)=>lots.push([along,across]);
  switch(district.layout){
   case "terraces": for(const across of [-13,13,-26,26])for(const a of [-24,-12,0,12,24])add(a+(across>0?4:0),across+a*.12);break;
   case "courts": for(const depth of [13,25,37])for(let n=0;n<12;n++){const a=n*Math.PI/6;add(Math.cos(a)*depth,Math.sin(a)*depth*.81);}break;
   case "contours": for(const across of [-12,12,-24,24])for(const a of [-24,-12,0,12,24])add(a,across+a*.26);break;
   case "rail": for(const across of [-14,14,-27,27])for(const a of [-26,-13,0,13,26])add(a,across);break;
   case "embankments": for(const across of [-12,12,-25,25])for(const a of [-24,-12,0,12,24])add(a,across+a*.35);break;
   case "beach": for(const a of [-15,15,-28,28])for(const b of [-26,-13,0,13,26])add(a+b*.20,b);break;
   case "windbreaks": for(const a of [-13,0,13,-25,25])for(const b of [-15,15,-28,28])add(a+(b>0?5:0),b);break;
  }
  for(let column=0;column<lots.length;column++)for(const [row,[x,z]] of centers.entries()){
   const [dx,dz]=lots[column];
   const facesSide=district.layout==="beach"||(district.layout==="courts"&&Math.abs(dx)>Math.abs(dz));
   const turn=facesSide?(dx>0?1:3):(dz>0?2:0);
   const yard=facesSide?[x,z+dz*.78]:[x+dx*.78,z];
   candidates.push({x:x+dx,z:z+dz,lane:z,key:row,row,column,yard,turn});
  }
 }`],
 ['if(!city&&(occupied.get(plot.key)??0)>=5)continue;', 'if(!city&&(occupied.get(plot.key)??0)>=Math.ceil(goal/geographySites[s.region].length)+1)continue;'],
 ['const w=[6.0,7.1,6.0,7.4][style]+random()*1.2,d=[6.3,5.6,7.2,5.7][style]+random()*.8;', 'const w=([6.0,7.1,6.0,7.4][style]+random()*1.2)*district.size[0],d=([6.3,5.6,7.2,5.7][style]+random()*.8)*district.size[1];'],
 ['(city?2.6:5.3)','district.spacing'],
 ['(city?4.4:5.3)','(city?4.4:district.spacing)'],
 ['const h=[3.0,3.65,2.85,3.30][style]+random()*(city?1.25:.65);','const h=([3.0,3.65,2.85,3.30][style]+random()*(city?1.25:.65))*district.size[2];'],
 ['roofTone,turn,style,settlementAdded);','roofTone,turn,style,settlementAdded);'],
]);
edit("index.html",[
 ['name==="민가"&&riggedScene?.addHouseExterior','name==="민가"&&(!expansion||style===1)&&riggedScene?.addHouseExterior'],
 [' variedFacade(x,y,z,w,d,h,plan);',' variedFacade(x,y,z,w,d,h,plan);\n if(!cityHouse&&name!=="내 집")villageIdentityDetails(x,y,z,w,d,h,plan);'],
 ...["VillageCharacter.js","BuildingVariation.js","SettlementExpansion.js"].map(f=>['src="'+f+'"','src="'+f+'?v=regional-villages"']),
]);
