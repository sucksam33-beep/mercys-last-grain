export const foodArt=[
 ["box","#875438",["rice","meat","green"]],["bowl","#a89653",["potato","leaf","green"]],["bowl","#b78046",["rice","persimmon"]],
 ["pot","#8e5238",["barley","meat","onion"]],["plate","#7f9b79",["fish","onion","herb"]],["bread","#925233",["apple","grain"]],
 ["bowl","#a88241",["bean","millet","salt"]],["plate","#aa4853",["pinkfruit","fig","leaf"]],["pot","#935038",["bean","meat","herb"]],
 ["box","#8e693e",["oat","meat","blueberry"]],["bowl","#a48c57",["barley","herb","meat"]],["roll","#966439",["oat","blueberry"]],
 ["pot","#b27042",["potato","steak","onion"]],["plate","#ae6551",["salmon","potato","salt"]],["pancake","#826042",["currant","grain"]],
 ["bowl","#999971",["fish","wildrice","herb"]],["pot","#7d8d66",["bluefish","onion","millet"]],["dumpling","#bc884a",["persimmon","grain"]],
 ["dried","#a0a69a",["sardine","salt"]],["box","#af7947",["redfish","millet","salt"]],["bowl","#a89943",["mango","bean","millet"]],
 ["bowl","#8f9b7b",["herring","barley","onion"]],["bar","#9a6b4b",["oat","lingonberry"]],["pot","#976445",["steak","potato","barley"]]
];
const colors={
 rice:["#f5e6b1","#c8aa71"],wildrice:["#d4c69b","#694934"],barley:["#dac289","#9b7547"],millet:["#ecd274","#a5783d"],
 oat:["#e1c79b","#a68654"],grain:["#dfb06c","#9b6c43"],bean:["#c48d55","#815339"],potato:["#e6ca80","#9d7449"],
 onion:["#efe0b8","#b69375"],green:["#b5b976","#637345"],leaf:["#a0a55f","#50693d"],herb:["#9a9e65","#455e35"],
 meat:["#b67958","#713b31"],steak:["#ae6c51","#613628"],persimmon:["#eea353","#b95528"],apple:["#dd9c64","#9e4439"],
 pinkfruit:["#e87991","#a83f57"],fig:["#c67885","#673f53"],blueberry:["#8d91b4","#4a4c74"],currant:["#74648c","#3f314e"],
 lingonberry:["#c85d52","#6c2f35"],mango:["#f3b454","#c37736"],fish:["#d3c9aa","#829080"],salmon:["#efa882","#9c5747"],
 bluefish:["#b1b2a5","#637d81"],redfish:["#d98974","#944b47"],sardine:["#c4c6af","#687d83"],herring:["#c1c9c2","#71838d"],salt:["#faf1db","#bfb6a5"]
};
const grains=new Set(["rice","wildrice","barley","millet","oat","grain","salt"]);
const fish=new Set(["fish","salmon","bluefish","redfish","sardine","herring"]);
const greens=new Set(["leaf","herb","green"]);
const fruit=new Set(["fig","pinkfruit","blueberry","currant","lingonberry"]);
export function renderFood(canvas,item,index){
 const c=canvas.getContext("2d",{willReadFrequently:true});
 let seed=(index+1)*14713;
 const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const range=(lo,hi)=>lo+(hi-lo)*rand();
 function grad(x,y,xx,yy,...stops){const g=c.createLinearGradient(x,y,xx,yy);stops.forEach((v,i)=>g.addColorStop(i/(stops.length-1),v));return g}
 function path(d,fill,stroke="#4a392d",width=2.2){
  const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p);}
  if(stroke){c.strokeStyle=stroke;c.lineJoin="round";c.lineWidth=width;c.stroke(p);}return p;
 }
 function oval(x,y,w,h,fill,stroke=null,angle=0){
  c.beginPath();c.ellipse(x,y,w,h,angle,0,Math.PI*2);
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.6;c.stroke();}
 }
 function local(x,y,a,draw){c.save();c.translate(x,y);c.rotate(a);draw();c.restore();}
 function chunk(kind,x,y,r,angle=0){
  const [light,dark]=colors[kind],paint=grad(-r,-r,r,r,light,dark);
  local(x,y,angle,()=>{
   if(grains.has(kind)){oval(0,0,r,kind==="salt"?r*.66:r*.39,paint);return;}
   if(greens.has(kind)){
    path(`M${-r} 1 Q${-r*.35} ${-r*.8} ${r} ${-r*.36} Q${r*.48} ${r*.64} ${-r} 1Z`,paint,"#48553d",.75);
    path(`M${-r*.88} 1 L${r*.85} ${-r*.31}`,null,"#d5ca8b88",.8);return;
   }
   if(fish.has(kind)){
    path(`M${-r} 0 Q${-r*.55} ${-r*.45} ${r*.62} ${-r*.22} L${r} ${-r*.38} L${r*.84} 0 L${r} ${r*.33} L${r*.61} ${r*.18} Q${-r*.65} ${r*.42} ${-r} 0Z`,paint,dark,.8);
    oval(-r*.71,-r*.07,Math.max(1,r*.055),Math.max(1,r*.055),"#463d33");
    path(`M${-r*.66} ${r*.1} Q0 ${-r*.02} ${r*.7} 0`,null,"#e4d2a5a0",1);return;
   }
   if(fruit.has(kind)||kind==="bean"){
    oval(0,0,r,r*(kind==="bean"?.62:.79),paint,dark);oval(-r*.25,-r*.24,r*.30,r*.17,"#f4d8a569");return;
   }
   if(kind==="onion"){oval(0,0,r,r*.60,paint,dark);oval(0,0,r*.7,r*.41,null,"#c3948c");oval(0,0,r*.38,r*.22,null,"#eac6ad");return;}
   path(`M${-r} ${-r*.27} L${-r*.43} ${-r*.61} ${r*.59} ${-r*.56} ${r} ${r*.11} ${r*.46} ${r*.66} ${-r*.72} ${r*.42}Z`,paint,dark,.9);
   path(`M${-r*.66} ${-r*.24} L${r*.27} ${-r*.41}`,null,"#f4d3a280",1.1);
  });
 }
 function pile(items,wide,depth,y){
  for(let k=0;k<items.length;k++){
   const kind=items[k],grain=grains.has(kind),f=fish.has(kind);
   const n=grain?46:f?1:greens.has(kind)?8:10;
   for(let j=0;j<n;j++){
    const a=range(0,Math.PI*2),rr=range(.1,.96);
    const x=f?126:128+Math.cos(a)*wide*rr,yy=f?y+3:y+Math.sin(a)*depth*rr;
    chunk(kind,x,yy,f?wide*.86:grain?range(2,5):range(4,11),f?-.11:range(-Math.PI,Math.PI));
   }
  }
 }
 function dish(vessel,tone,toppings){
  if(vessel==="bowl"||vessel==="pot"){
   const pot=vessel==="pot";
   if(pot){oval(48,135,20,12,"#504c44","#8a7964");oval(208,135,20,12,"#504c44","#8a7964");}
   path("M48 128 Q53 190 105 205 Q128 213 151 205 Q205 187 208 128Z",pot?grad(48,138,200,181,"#a39683","#6b655d","#39352f"):grad(52,127,192,190,"#c4b498","#807c67","#4b4a3c"));
   oval(128,127,81,39,pot?"#6c6253":"#c4b194","#4b4035");
   oval(128,128,71,31,grad(65,102,184,148,"#eed09a",tone,"#6c533a"),"#73604a");
   pile(toppings,67,27,126);
   for(let i=0;i<4;i++)path(`M${73+i*36} 174 q7 4 16 5`,null,"#e9d5b453",1.5);
  }else if(vessel==="plate"){
   oval(129,146,90,43,"#5b5445");oval(128,140,91,44,grad(70,110,181,177,"#e7d8b9","#b2aa93","#746d5c"),"#615344");
   oval(128,141,77,33,grad(57,122,190,160,"#d9c8a8","#a89d82"),"#8a8068");
   const mains=toppings.filter(x=>fish.has(x));
   if(mains.length){
    chunk(mains[0],127,133,64,-.16);
    pile(toppings.filter(x=>!fish.has(x)),68,20,145);
   }else pile(toppings,72,29,138);
  }else if(vessel==="box"){
   path("M39 128 L171 83 L217 115 L207 165 L80 207 L40 172Z",grad(43,98,207,191,"#c49161","#795038","#4b352a"));
   path("M39 126 L172 83 L217 113 L81 162Z",grad(52,112,188,151,"#a87851","#604431"),"#bc936a",3.2);
   c.save();c.clip(new Path2D("M47 124 L171 91 L207 113 L81 153Z"));pile(toppings,84,31,123);c.restore();
   path("M80 162 L207 118 M81 161 L81 204",null,"#d5a274",2.4);
  }else if(vessel==="dried"){
   for(let i=0;i<3;i++){chunk("sardine",111+i*16,102+i*28,66,-.30+i*.04);}
   for(let i=0;i<35;i++)chunk("salt",range(64,195),range(95,175),range(1,2.5),range(0,6));
   path("M104 94 Q117 132 133 169 M112 92 Q122 132 142 166",null,"#b7a480",3);
  }else{
   const n=vessel==="bread"?3:vessel==="pancake"?4:5;
   const radius=vessel==="dumpling"?23:vessel==="bar"?27:vessel==="roll"?31:49;
   for(let i=0;i<n;i++){
    const x=vessel==="pancake"?122+i*3:70+(i%3)*53+(i>=3?20:0),y=vessel==="pancake"?161-i*10:127+(i>=3?37:0)+(i%3)*2;
    local(x,y,vessel==="bar"?-.34+i*.11:vessel==="bread"?-.28+i*.22:0,()=>{
     const flat=vessel==="pancake"?14:vessel==="bar"?16:vessel==="bread"?32:22;
     if(vessel==="bar")path("M-27 -13 Q-30 -17 -18 -17 H22 Q31 -14 29 10 L19 17 H-22 Q-29 15 -27 -13Z",grad(-16,-16,24,18,"#c49c67",tone,"#68462e"));
     else oval(0,0,radius,flat,grad(-radius,-flat,radius,flat,"#e4ba77",tone,"#694833"),"#694c37");
     for(let j=0;j<26;j++){
      const a=range(0,Math.PI*2),r=range(.1,.91);
      chunk(toppings[j%toppings.length],Math.cos(a)*radius*r,Math.sin(a)*flat*r,range(1.4,3.7),range(0,6.2));
     }
     if(vessel==="roll"){oval(-12,-1,10,11,"#b2945e","#71503c");oval(-12,-1,4,5,"#6d5270");}
     if(vessel==="bread")path("M-26 -15 Q-9 -6 -2 8 M-8 -24 Q9 -13 15 1",null,"#eac58f",2.7);
    });
   }
  }
 }
 c.clearRect(0,0,256,256);
 if(item.code==="potato"){
  for(const [x,y,w,h,a] of [[100,117,49,34,-.45],[154,151,49,35,.32],[83,159,30,22,.14]]){
   oval(x,y,w,h,grad(x-w,y-h,x+w,y+h,"#e0bb78","#ae804e","#6c5038"),"#6e513a",a);
   for(let i=0;i<15;i++){const xx=x+range(-w*.66,w*.66),yy=y+range(-h*.59,h*.59);oval(xx,yy,range(.8,2.1),1.1,"#755637a3");}
  }
 }else if(item.code==="onion"){
  for(const [x,y,w,a] of [[101,140,42,-.24],[155,145,39,.30]])local(x,y,a,()=>{
   path(`M-6 -62 Q-6 -45 -25 -27 Q${-w-12} -8 ${-w} 19 Q-21 46 5 43 Q${w+13} 28 ${w} 0 Q20 -25 7 -50 L5 -61Z`,grad(-39,-32,36,35,"#ebcf9a","#c19461","#89593b"));
   for(let i=0;i<4;i++)path(`M${i*4-6} -41 Q${-26+i*17} -9 ${i*5-10} 38`,null,"#e2b885",1.3);
  });
 }else if(item.code==="salt"){
  path("M58 131 Q70 183 128 192 Q184 180 198 131Z",grad(67,131,188,172,"#b1946e","#7a614b","#493b30"));
  oval(128,131,70,34,"#b79a74","#594436");
  path("M67 136 Q75 118 97 116 L126 85 L147 104 Q175 109 190 133 Q149 163 67 136Z",grad(91,96,158,153,"#f7f1de","#dfd6bf","#a9a290"),"#a59c86");
  for(let i=0;i<100;i++)chunk("salt",range(89,166),range(114,137),range(.8,2.3),range(0,6));
 }else dish(...foodArt[index]);
 const rgba=c.getImageData(0,0,256,256).data;
 let n=0,minX=256,minY=256,maxX=0,maxY=0;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(rgba[(y*256+x)*4+3]){
  if(x<8||y<8||x>247||y>247)throw Error("Clipped "+item.name);
  n++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
 }
 if(n<2500||n>50000)throw Error("Bad silhouette "+item.name+" "+n);
 const out=document.createElement("canvas");out.width=out.height=256;
 const width=maxX-minX+1,height=maxY-minY+1,scale=209/Math.max(width,height);
 const target=out.getContext("2d");target.imageSmoothingQuality="high";
 target.drawImage(canvas,minX,minY,width,height,(256-width*scale)/2,(256-height*scale)/2,width*scale,height*scale);
 return out.toDataURL("image/png").split(",")[1];
}
