const canvas=document.createElement("canvas");canvas.width=canvas.height=256;
const c=canvas.getContext("2d",{willReadFrequently:true});
let seed=1;
const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
const range=(a,b)=>a+(b-a)*rand();
function shape(d,fill,stroke="#201812",width=2.2){
 const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin="round";c.stroke(p);}return p;
}
function blend(x,y,x2,y2,...colors){
 const g=c.createLinearGradient(x,y,x2,y2);colors.forEach((v,i)=>g.addColorStop(i/(colors.length-1),v));return g;
}
function ellipse(x,y,a,b,fill,stroke=null,w=1){
 c.beginPath();c.ellipse(x,y,a,b,0,0,Math.PI*2);
 if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}
}
function moved(x,y,angle,fn){c.save();c.translate(x,y);c.rotate(angle);fn();c.restore();}
const timber=blend(-10,-8,10,12,"#cba26b","#755034","#3d2c20");
const steel=blend(-20,-18,35,32,"#e3ebe6","#7d8c91","#29363b");
const brass=blend(-15,-22,32,23,"#f5d397","#b6763c","#663b28");
function leaf(x,y,len,w,a,palette,serrated=false){
 moved(x,y,a,()=>{
  const path=serrated?`M0 0 Q${-w*.4} ${-len*.2} ${-w} ${-len*.33} l${w*.17} ${-len*.09} l${-w*.10} ${-len*.1} l${w*.29} ${-len*.09} l${w*.02} ${-len*.1} L0 ${-len} Q${w*1.62} ${-len*.40} 0 0Z`:`M0 0 Q${-w*1.7} ${-len*.39} 0 ${-len} Q${w*1.72} ${-len*.55} 0 0Z`;
  shape(path,blend(-w,0,w,0,...palette),"#2b4126",1.2);
  shape(`M0 0 Q${w*.16} ${-len*.55} 0 ${-len*.90}`,null,"#c0bf77aa",1.1);
  for(let j=1;j<5;j++){const yy=-len*j*.16;shape(`M0 ${yy} l${w*.53*(1-j*.095)} ${-len*.12} M0 ${yy} l${-w*.57*(1-j*.095)} ${-len*.12}`,null,"#c0bf7760",.75);}
 });
}
const fishProfiles=[
 [/장어|미꾸라지/,.30,"#846b3c","eel","dots"],[/넙치/,.95,"#95886d","flat","marble"],
 [/메기|버봇/,.68,"#607675","cat","marble"],[/흡반어/,.64,"#80724f","sucker","spots"],
 [/파이크/,.42,"#778751","pike","spots"],[/삼치/,.51,"#587777","swift","bars"],
 [/날치/,.37,"#7196a9","flying","line"],[/다랑어/,.65,"#4d7584","tuna","line"],
 [/볼락|그루퍼/,.84,"#9a6955","spiny","bars"],[/농어/,.69,"#738044","spiny","bars"],
 [/선피시|블루길|크래피|토끼고기/,.97,"#71836a","spiny","bars"],
 [/민어|퉁돔/,.78,"#a4604d","spiny","line"],[/배스/,.76,"#687649","spiny","line"],
 [/연어|송어|트라우트|돌리바든|곤들매기|컷스로트/,.57,"#6f817a","salmon","spots"],
 [/그레이링/,.60,"#758789","sail","dots"],[/잉어|붕어|브림|텐치/,.94,"#968454","carp","scales"],
 [/정어리|멸치|청어|빙어|실버사이드|전갱이/,.42,"#728e98","swift","line"],
 [/송사리|모기고기|치어/,.43,"#8b956f","small","line"],
 [/황어|로치|러드|처브|데이스|화이트피시/,.60,"#86916d","minnow","scales"]
];
const localFishProfiles=new Map([
 ["피라미",[.39,"#718f8b","minnow","line"]],["갈겨니",[.45,"#596d5d","swift","dark-line"]],["돌고기",[.72,"#6b6747","sucker","dark-line"]],
 ["황어",[.61,"#a99252","minnow","bars"]],["로치",[.57,"#9eaa94","minnow","red-fin"]],["러드",[.73,"#b3a065","carp","red-fin"]],
 ["브림",[1.03,"#878d85","flat","scales"]],["텐치",[.83,"#697848","carp","dots"]],["처브",[.53,"#a18f67","minnow","red-fin"]],
 ["붕어",[1.03,"#879174","carp","scales"]],["잉어",[.75,"#a68a54","carp","scales"]],["샘물송사리",[.39,"#7e9da0","small","line"]],
 ["사막황어",[.51,"#a5995e","minnow","dots"]],["모래피라미",[.34,"#a6a381","minnow","dark-line"]],
 ["그린선피시",[.91,"#597d64","spiny","bars"]],["블루길",[1.09,"#627f94","spiny","bars"]],["화이트크래피",[.86,"#9a9d81","spiny","spots"]],
 ["호박씨선피시",[.99,"#929452","spiny","dots"]],["황농어",[.70,"#ac9a45","spiny","bars"]],
 ["산악화이트피시",[.47,"#a6aca4","salmon","scales"]],["고원황어",[.58,"#908b52","minnow","dark-line"]],
 ["호수피라미",[.42,"#749595","minnow","dots"]],["데이스",[.47,"#9ba9a0","swift","line"]],
 ["브룩트라우트",[.61,"#4e6f6b","salmon","marble"]],["갈색송어",[.57,"#9a875b","salmon","spots"]],
 ["컷스로트송어",[.58,"#9d915c","salmon","red-fin"]],["산천어",[.54,"#769583","salmon","bars"]],
 ["모기고기",[.35,"#a39d71","small","dots"]],["실버사이드",[.31,"#9ab6be","swift","line"]],["줄무늬송사리",[.47,"#727964","small","bars"]],
 ["청어",[.45,"#839caa","swift","line"]],["빙어",[.31,"#9fa998","small","line"]],["정어리",[.52,"#7e8f9e","swift","dots"]],["멸치",[.27,"#859a9b","swift","line"]]
]);
function fish(id){
 const [,height,base,family,mark]=(localFishProfiles.has(id)?[null,...localFishProfiles.get(id)]:fishProfiles.find(([re])=>re.test(id)))??[null,.49,"#75865e","minnow","line"];
 const h=height*range(31,44),tailX=range(165,182),head=range(25,39),mid=range(87,117),top=range(.73,1.15);
 const accent=id.includes("붉")||/산천어|홍연어|러드|컷스로트/.test(id)?"#a94538":id.includes("은")?"#c7d7cf":id.includes("구리")?"#b27645":base;
 const tail=family==="eel"?24:range(27,43),fork=["swift","minnow","carp","tuna","flying"].includes(family)?range(12,22):range(3,12);
 moved(1,1,0,()=>{c.translate(128,128);c.rotate(-.17);c.translate(-128,-128);
 const fin=blend(68,64,150,169,mark==="red-fin"?"#be5e46":accent,"#494e43",mark==="red-fin"?"#d78455":"#a69a79");
 shape(`M${tailX-4} 128 Q${tailX+18} 118 ${tailX+tail} ${128-h*.74} L${tailX+tail-fork} 128 L${tailX+tail} ${128+h*.73} Q${tailX+12} 137 ${tailX-4} 132Z`,fin);
 const dorsal=family==="sail"?39:family==="spiny"?29:family==="eel"?9:range(12,24);
 if(family!=="flat"){
  const x=family==="pike"?141:mid-12;
  shape(`M${x-15} ${128-h*.75} L${x} ${128-h-dorsal} ${family==="spiny"?`L${x+8} ${125-h-dorsal*.67} L${x+12} ${125-h-dorsal*.82}`:""} Q${x+21} ${128-h-dorsal*.85} ${x+36} ${128-h*.62}Z`,fin);
 }
 if(family==="salmon")shape(`M144 ${127-h*.54} Q154 ${110-h*.60} 160 ${126-h*.38}Z`,fin);
 const noseY=family==="sucker"?136:family==="pike"?133:127;
 const body=shape(`M${head} ${noseY} C${head+8} ${124-h*top} ${mid-15} ${127-h*1.25} ${mid} ${126-h} C${mid+25} ${126-h*.86} ${tailX-18} 121 ${tailX} 124 L${tailX} 134 C${tailX-19} 137 ${mid+14} ${139+h} ${mid-8} ${129+h} Q${head+12} ${129+h*.7} ${head} ${noseY}Z`,
 blend(60,87,88,175,"#323f3a",accent,"#d8d3a7","#826d56"));
 c.save();c.clip(body);
 if(mark==="line"||mark==="dark-line"||id.includes("줄무늬")||id.includes("무지개"))shape(`M${head} 128 Q108 ${range(115,135)} ${tailX+3} 128`,null,id.includes("무지개")?"#cf6878aa":mark==="dark-line"?"#263b34ba":"#f3deb2aa",range(3,7));
 if(mark==="bars")for(let i=0;i<Math.floor(range(5,10));i++){
  const x=63+i*range(10,14);shape(`M${x-8} 73 Q${x+12} 123 ${x-4} 153 Q${x+20} 116 ${x+2} 70Z`,"#2638308c",null);
 }
 if(["spots","dots","marble","scales"].includes(mark))for(let i=0;i<(mark==="scales"?75:39);i++){
  const x=range(head+23,tailX),y=range(87,157),a=range(.8,mark==="marble"?6:2.8);
  if(mark==="scales")shape(`M${x} ${y-2} q5 2 1 5`,null,"#e4ddab72",.8);
  else ellipse(x,y,a,a*range(.45,1.2),mark==="spots"&&i%4===0?"#bd5b3a":"#263b36a4");
 }
 c.restore();
 shape(`M${head+32} ${112-h*.27} Q${head+44} 125 ${head+29} ${133+h*.32}`,null,"#343d32",2.1);
 if(family==="cat")for(const dy of [-16,11,21])shape(`M${head+5} 131 q-12 ${dy*.1} -30 ${dy}`,null,"#b0aa87",1.5);
 shape(`M${head} ${noseY} q10 4 18 0`,null,"#453c2b",1.45);
 const eyeX=head+range(13,21),eyeY=family==="flat"?111:range(114,121);
 ellipse(eyeX,eyeY,5.3,4.5,"#bba563","#302c22",1);ellipse(eyeX+.3,eyeY,2.55,3,"#161a17");ellipse(eyeX-.8,eyeY-1.2,1,1,"#ffffff");
 if(family==="flat")ellipse(eyeX+8,eyeY-7,3.2,2.8,"#413b27","#c5b77d",1);
 shape(`M${head+43} 134 Q${head+53} 139 ${head+(family==="flying"?107:66)} ${146+h*.43} Q${head+60} ${146+h*.24} ${head+39} 142Z`,fin,"#423d2f",1.4);
 });
}
const greens=["#849846","#466d3f","#263e28"];
function plant(item){
 const id=item.id,form=item.form;
 if(form==="찻잎"||id.endsWith(" 잎")||id.includes("향초")){
  const long=/갈대|조릿대|레몬그라스|파이어위드/.test(id),rounded=/민트|박하|밤/.test(id);
  const count=long?5:Math.floor(range(6,12));
  for(let i=0;i<count;i++){
   const y=long?range(175,210):192-i*(110/count),x=long?range(89,159):128+Math.sin(i*.68)*14;
   leaf(x,y,range(long?90:36,long?137:68),range(long?5:rounded?13:10,long?10:rounded?20:15),long?range(-.62,.68):(i%2?1:-1)*range(.64,1.38),greens,rounded);
  }
  if(!long)shape("M108 211 Q144 156 126 77",null,"#779052",4);
  return;
 }
 if(form==="곡식"||/볍씨|손질한 곡물|^씨앗$/.test(id)){
  const oat=/귀리|엘리무스/.test(id),grain=/보리|호밀|벼|쌀|돌피/.test(id),red=/붉은|수수/.test(id),round=/기장|야생 조|메밀/.test(id);
  const rice=/벼|쌀|볍씨/.test(id),base=red?"#b87d55":rice?"#dec487":"#d0a963";
  if(/볍씨|손질|^씨앗/.test(id)){
   for(let i=0;i<32;i++){const a=range(0,6.29),r=range(2,76);moved(125+Math.cos(a)*r,131+Math.sin(a)*r*.65,range(-1.7,1.7),()=>ellipse(0,0,range(5,12),range(2.7,5),blend(0,-4,0,5,"#f6e2ae",base,"#88592c"),"#796245",.9));}
   return;
  }
  for(let i=0;i<3;i++){
   const x=93+i*34,angle=(i-1)*range(.17,.37),len=range(113,148);
   moved(x,207,angle,()=>{
    shape(`M0 0 Q12 -67 -3 ${-len}`,null,"#8c7a48",3.2);
    leaf(0,-28,range(54,82),5,(i%2?-1:1)*.8,["#9da35b","#788044","#4d5830"]);
    const ears=Math.floor(range(6,11));
    for(let j=0;j<ears;j++)for(const side of [-1,1]){
     const xx=side*(oat?range(11,29):round?range(4,13):range(5,10)),yy=-len+j*(grain?6:7);
     if(oat||rice)shape(`M0 ${yy+10} l${xx} -10`,null,"#af965b",1.3);
     moved(xx,yy,side*range(.22,.78),()=>ellipse(0,0,round?4.3:3.7,round?5.2:range(6,10),blend(-4,0,5,0,"#eed29b",base,"#76512d"),"#805a33",.7));
     if(grain&&!rice)shape(`M${xx} ${yy} l${side*5} -14`,null,"#cfad6b",.8);
    }
   });
  }return;
 }
 const fruit=/망고|사과|들자두|야생 자두|야생 배|산감|야생 감|으름|무화과|구아바|가시배|선인장|사와로|타마린드|꼬투리|콩|대추야자/;
 const berry=/딸기|오디|블랙베리|클라우드베리|새먼베리/.test(id),cluster=/포도|머루|베리|커런트|월귤/.test(id);
 const red=/딸기|감|월귤|사과|가시배|사와로/.test(id),purple=/오디|머루|자두|블랙|포도|무화과|크로베리|빌베리/.test(id);
 const orange=/망고|클라우드|감|새먼베리|대추/.test(id);
 const color=orange?["#ffcf68","#c67831","#6b3920"]:purple?["#b49ab9","#604664","#2d253a"]:red?["#ed9472","#ad392f","#522723"]:["#c8b16c","#8d893d","#485128"];
 leaf(129,126,range(43,67),range(11,19),-.89,greens,true);leaf(132,124,range(42,65),range(11,18),.9,greens);
 if(/꼬투리|타마린드|콩/.test(id)){
  for(let i=0;i<3;i++)moved(82+i*42,130+i*7,-.54+i*.55,()=>{
   shape("M-11 -55 Q18 -52 15 -32 Q31 -10 13 9 Q22 32 -2 46 Q-18 44 -15 26 Q-32 11 -16 -9 Q-26 -29 -11 -55Z",blend(-23,0,22,0,...color));
   shape("M-8 -52 Q5 -8 -8 43",null,"#dfbd75",1.2);
  });return;
 }
 if(berry||cluster||!fruit.test(id)){
  const aggregate=berry&&!/야생 딸기/.test(id),n=aggregate?Math.floor(range(23,42)):Math.floor(range(6,15));
  const width=range(43,63),height=range(45,67);
  const fruits=Array.from({length:n},(_,i)=>{const a=i*2.39996,r=Math.sqrt((i+.35)/n);return [126+Math.cos(a)*width*r,135+Math.sin(a)*height*r,aggregate?range(7,13):range(12,23)];}).sort((a,b)=>a[1]-b[1]);
  for(const [x,y,r] of fruits){
   ellipse(x,y,r,r*(/오디/.test(id)?1.24:1),blend(x-r,y-r,x+r,y+r,...color),"#49352c",1);
   ellipse(x-r*.24,y-r*.33,r*.24,r*.13,"#f8e9c57a");
   if(!aggregate)shape(`M${x-2} ${y-r*.7} l4 3 -4 2 -3 -3Z`,"#443f30",null);
  }return;
 }
 const wide=/감|사과/.test(id),pear=/배|구아바/.test(id),long=/으름|망고|선인장|대추/.test(id);
 for(const [i,x,y] of [[0,99,134],[1,153,145]])moved(x,y,i?.24:-.33,()=>{
  const w=wide?range(38,47):range(26,35),h=long?range(47,58):range(31,45);
  shape(`M-5 ${-h} C${w*.75} ${-h*1.12} ${w} ${-h*.20} ${w} 10 Q${w*.75} ${h*1.2} -4 ${h} Q${-w*1.22} ${h*.7} ${-w} 0 Q${-w*(pear?.32:.88)} ${-h*.9} -5 ${-h}Z`,blend(-w,-h,w,h,...color));
  shape(`M0 ${-h+4} q-4 -11 3 -17`,null,"#534129",3);
  for(let j=0;j<17;j++)ellipse(range(-w*.68,w*.58),range(-h*.55,h*.65),range(.6,1.7),1.2,"#533a3c73");
 });
}

function hide(item){
 const id=item.id,tanned=id.startsWith("무두질"),fur=/털감개|솜 안감/.test(id);
 const bird=/꿩|칠면조|뇌조|오리|기니새/.test(id), reptile=/악어/.test(id), rabbit=/토끼/.test(id), wolf=/늑대|코요테/.test(id);
 const pale=/눈신|물범|자작/.test(id),stripe=/줄무늬말|멧돼지|페커리/.test(id),spot=/꽃사슴|기니새|포사/.test(id);
 const side=range(28,44),height=range(60,83),leg=range(35,53),tail=wolf||reptile?range(21,41):range(3,15);
 const colors=tanned?["#d6a976","#a66b44","#603c2c"]:pale?["#e9dfcf","#b4a998","#726b65"]:reptile?["#8c945c","#576047","#303d32"]:bird?["#ad946d","#735340","#382c2b"]:["#c39b75","#81604b","#463329"];
 const paths=bird?`M128 ${123-height} Q151 56 151 80 L${163+side} 86 L${175+side} 119 L181 126 L${160+side} 149 L170 150 L182 171 L144 178 L${126+tail} 203 L108 196 L109 177 L72 174 L86 149 L${69-side} 132 L70 112 L${75-side} 97 L107 78 Q109 47 128 ${123-height}Z`:
 `M122 ${127-height} Q139 ${119-height} 150 68 L149 91 L${169+side} ${91-leg*.23} L${173+side} 97 L160 119 Q158 134 169 146 L${170+side} 167 L${165+side} ${168+leg*.50} L144 169 L${130+tail} ${184+tail*.67} L119 ${191+tail*.62} L113 168 L${82-side} ${179+leg*.32} L${76-side} 161 L92 141 Q101 127 92 112 L${78-side} 99 L${87-side} ${85-leg*.26} L106 87 L106 ${rabbit?51:70}Z`;
 const p=shape(paths,blend(42,49,177,206,...colors),"#3e3029",2.9);
 c.save();c.clip(p);
 if(stripe||reptile)for(let i=0;i<10;i++){const x=range(41,93),y=64+i*14;shape(`M${x} ${y} Q128 ${y+28} 226 ${y-14} L227 ${y-9} Q123 ${y+37} ${x} ${y+8}Z`,reptile?"#263b2b73":"#312820a5",null);}
 if(spot)for(let i=0;i<48;i++)ellipse(range(46,205),range(65,191),range(1.5,4.3),range(1.2,3.2),"#e5c99a8c");
 for(let i=0;i<(tanned?130:300);i++){
  const x=range(29,225),y=range(47,207);
  if(tanned)ellipse(x,y,range(.3,1.4),range(.3,1.2),"#492f2b68");
  else shape(`M${x} ${y} l${range(-2,2)} ${range(2,7)}`,null,i%4?"#f5d3a64c":"#29252165",.65);
 }
 c.restore();
 if(fur){ellipse(127,140,42,27,blend(96,114,164,171,"#d5b89a","#795a48","#4b382e"),"#362920",2);ellipse(128,140,25,13,"#443428");}
}
function stick(x,y,h,w=13,mat=timber){shape(`M${x-w*.5} ${y-h} l${w} 1 ${w*.08} ${h-2} q${-w*.53} 8 ${-w*1.06} 1Z`,mat,"#443027",1.8);}
function tool(item){
 const id=item.id;
 if(/뜰채/.test(id)){
  moved(124,137,.73,()=>{stick(0,89,100,12);ellipse(0,-45,33,44,null,"#a49162",7);for(let i=-3;i<4;i++)shape(`M${i*8-5} -85 Q${i*7+28} -49 ${i*4} -8 M-25 ${i*8-44} Q1 ${i*7-14} 25 ${i*8-44}`,null,"#c3a36b",1.2);});return;
 }
 if(/채비/.test(id)){
  const sea=id.includes("바다");
  moved(117,108,sea?.33:-.45,()=>{ellipse(0,0,39,44,sea?steel:timber,"#514538",2.5);for(let i=0;i<6;i++)ellipse(0,0,31-i*3.3,35-i*3.5,null,"#d7ba7e",1.6);});
  shape("M143 108 Q183 135 173 163 q-8 28 -26 13 q-9 -8 2 -20",null,"#d5d4b9",4);
  ellipse(80,156,sea?14:9,26,blend(64,134,95,173,sea?"#e9b68e":"#e7cc7e","#af5241","#5c3027"),"#6a4035",2);return;
 }
 if(/채집가위/.test(id)){
  moved(128,132,.50,()=>{
   for(const side of [-1,1]){shape(`M0 0 Q${side*31} -18 ${side*21} -77 Q${side*1} -61 ${side*-8} 2 L${side*-11} 31Z`,steel);ellipse(side*22,40,14,23,null,side===1?"#a26845":"#74513e",9);}
   ellipse(0,2,6,6,brass);
  });return;
 }
 if(/방패/.test(id)){
  moved(128,127,.20,()=>{
   shape("M-60 -57 Q0 -72 60 -56 L55 13 Q45 53 0 70 Q-53 44 -57 5Z",timber);
   for(let i=-2;i<3;i++)shape(`M${i*18} -57 q3 65 0 116`,null,"#50351f",1.7);
   shape("M-52 -44 L48 -44 M-54 0 L50 0",null,"#9b9b83",7);
   ellipse(0,2,15,17,steel,"#3d3226",2);
  });return;
 }
 if(/활/.test(id)){
  const long=/장궁/.test(id),b=long?82:range(67,78),bend=range(39,56);
  moved(128,127,.50,()=>{
   shape(`M13 ${-b} Q${-bend} ${-b*.47} ${-bend*.72} 0 Q${-bend} ${b*.46} 13 ${b}`,null,/조릿대/.test(id)?"#bea067":"#9d7046",long?7:9);
   shape(`M13 ${-b} L8 0 L13 ${b}`,null,"#d9c696",1.7);
   shape("M-36 -15 Q-42 0 -37 16",null,"#40352a",8);
  });return;
 }
 if(/낚싯대/.test(id)){
  shape("M66 211 Q125 130 173 42",null,"#654b33",8);shape("M68 208 Q143 126 174 43",null,"#c49e62",3);
  shape("M175 45 Q195 70 193 165 q-8 17 -16 1",null,"#bdc2aa",1.9);ellipse(91,181,13,11,brass,"#55422f",2);return;
 }
 if(/화살/.test(id)){
  for(let i=0;i<3;i++)moved(103+i*22,127,.63,()=>{
   stick(0,79,147,4);
   shape("M0 -80 L-8 -63 0 -66 8 -64Z",/철촉/.test(id)?steel:timber);
   shape("M-1 47 q-10 6 -9 20 l10 -5 q8 3 10 -8 l-9 3Z",/꿩/.test(id)?"#ae6547":"#c6b189");
  });return;
 }
 const axe=/도끼/.test(id),pick=/곡괭이|괭이/.test(id),knife=/단검|짧은 검|여행자의 검/.test(id);
 const pole=/창|작살/.test(id),staff=/지팡이/.test(id),len=knife?range(50,64):range(132,159);
 moved(128,130,.58,()=>{
  stick(0,72,len,knife?17:range(10,15),/조릿대/.test(id)?brass:timber);
  if(axe)shape(`M-10 -72 Q12 -70 ${/강화|철도/.test(id)?53:38} -87 Q50 -56 39 -40 Q11 -54 -11 -49Z`,steel);
  else if(pick)shape(/곡괭이/.test(id)?"M-56 -57 Q-15 -99 10 -82 Q40 -77 54 -54 Q21 -70 3 -65 Q-22 -76 -56 -57Z":"M-10 -78 L32 -78 L45 -48 L-7 -48Z",steel);
  else if(knife){const long=id.includes("여행자");shape(`M-8 19 L${long?-12:-8} ${long?-72:-52} L1 ${long?-91:-72} Q21 ${long?-66:-41} 10 19Z`,/구리/.test(id)?brass:steel);shape("M-18 18 L19 15 18 23 -16 25Z",brass);}
  else if(pole){shape("M0 -94 L-11 -65 -4 -69 -5 -48 5 -48 7 -65 14 -64Z",steel);if(/갈고리|작살/.test(id))shape("M4 -70 Q35 -70 24 -51 L22 -60Z",steel);}
  else if(staff)shape("M-5 -70 Q-15 -90 1 -93 Q25 -95 27 -76 Q19 -66 11 -72 Q20 -81 10 -83Z",timber);
 });
}
function apparel(item){
 const id=item.id,color=/구리/.test(id)?brass:/철판/.test(id)?steel:blend(57,58,184,211,"#aa9975",["#685446","#585d42","#8b6353","#536b69","#77737f"][Math.floor(range(0,5))],"#312e2a");
 const d=/모자/.test(id)?"M56 150 Q79 125 100 124 L105 75 Q133 59 156 79 L164 125 Q207 135 205 158 Q164 182 60 166Z":
 /두건/.test(id)?"M65 165 L80 139 Q75 99 99 72 Q128 51 156 76 Q182 103 175 151 L197 174 Q163 206 92 194Z":
 /장화/.test(id)?"M55 66 L102 68 99 140 117 165 116 193 49 192 47 174 58 145Z M124 74 L169 72 175 151 204 170 206 194 128 197 122 177 132 153Z":
 /장갑|팔보호대/.test(id)?"M67 191 L63 147 45 114 Q43 100 52 100 L64 116 61 76 Q65 62 73 73 L82 101 84 66 Q95 62 96 74 L100 106 Q117 76 123 87 L115 148 119 187Z M146 194 L149 154 131 126 Q127 107 140 110 L151 129 147 76 Q153 67 159 78 L166 106 170 71 Q181 66 184 82 L180 114 Q195 92 202 101 L191 156 198 190Z":
 /망토/.test(id)?"M102 56 Q123 79 153 56 L174 79 206 194 Q120 212 48 184 L82 83Z":
 /조끼|가죽갑|사냥갑|작업갑|누빔갑/.test(id)?"M91 62 L110 56 Q127 84 146 57 L166 65 L175 97 169 129 181 193 Q125 209 73 193 L87 130 79 101Z":
 "M86 64 L108 55 Q126 77 145 55 L168 65 205 118 179 145 160 127 171 200 84 200 93 127 76 144 48 120Z";
 const p=shape(d,color,"#453a2f",3);c.save();c.clip(p);
 for(let i=0;i<21;i++){const x=range(41,211),y=range(53,212);shape(`M${x} ${y} q2 6 -1 24`,null,"#f0dcab4d",1.2);}
 if(/갑|보호|조끼|누빔/.test(id))for(let i=0;i<4;i++)shape(`M68 ${93+i*25} Q127 ${105+i*24} 185 ${91+i*25}`,null,"#403731",2.5);
 if(/외투|작업복|조끼|작업갑/.test(id)){
  shape("M126 83 L128 200",null,"#3e342c",3);
  for(let i=0;i<6;i++)ellipse(133,94+i*16,2.5,2.6,"#c0a575");
 }c.restore();
}
function board(x,y,length,width,depth,mat=timber){
 shape(`M${x} ${y} l${length} ${-length*.19} ${width} ${width*.56} -${length} ${length*.22}Z`,mat);
 shape(`M${x} ${y} l${width} ${width*.56} ${length} ${-length*.22} v${depth} l-${length} ${length*.22} -${width} ${-width*.56}Z`,blend(x,y,x+length,y+depth,"#9d6945","#64402d"),"#4f3828",1.45);
 for(let i=0;i<4;i++)shape(`M${x+5+i*2} ${y+1+i*2} l${length-10} ${-length*.19}`,null,"#dcb17a77",1.05);
}
function bowl(tea,porridge=false){
 shape("M49 131 Q65 194 128 201 Q185 192 201 131Z",blend(55,121,182,194,"#c5ab89","#74685b","#373b35"));
 ellipse(125,129,75,34,"#aa9a82","#483c31",3);
 ellipse(125,132,65,25,tea?blend(58,121,178,151,"#d5a55f","#9a663d","#5e3a24"):blend(59,121,182,158,porridge?"#e8d5a2":"#d9ae66","#ad784a","#694630"),"#6b4a33",1.2);
 for(let i=0;i<(tea?8:24);i++){const a=range(0,6.28),r=range(1,61);ellipse(124+Math.cos(a)*r,131+Math.sin(a)*r*.33,range(1.5,4.2),2,i%3?"#ead5a8":"#65834b");}
 for(const x of [93,128,161])shape(`M${x} 99 q-15 -17 1 -34 q7 -8 0 -19`,null,"#e7ded29c",2.6);
}
function jar(id){
 const barrel=/통|연료/.test(id);
 const cap=/항아리|연료/.test(id);
 const mat=barrel?timber:cap?blend(65,77,185,201,"#b78b60","#875c45","#493129"):blend(55,58,186,194,"#a5ac71","#59775d","#344e42");
 shape(barrel?"M65 81 Q53 128 63 177 Q123 204 184 173 Q196 119 184 82Z":"M99 81 Q100 98 74 114 Q55 131 67 174 Q91 203 154 190 Q193 176 182 136 Q179 112 150 99 L147 80Z",mat);
 ellipse(124,80,barrel?58:31,barrel?21:12,cap?timber:steel,"#4c3929",2.5);
 if(barrel)for(let i=0;i<6;i++){const x=72+i*20;shape(`M${x} 90 Q${x-8} 143 ${x+4} 178`,null,"#423a31",2);}
 if(cap){shape("M105 66 Q123 59 141 65 L148 83 Q129 94 101 84Z",timber);shape("M91 100 Q127 106 156 97",null,"#bf9565",5);}
}
function props(item){
 const id=item.id;
 if(item.form==="물고기"||id==="치어"){fish(id);return;}
 if(item.form==="가죽"||/가죽|털감개|솜 안감/.test(id)&&!item.slot){hide(item);return;}
 if(item.slot==="weapon"||item.stats?.ammo||/도끼|곡괭이|낚싯대|채비|채집가위|손괭이|뜰채|사냥 활|검$|지팡이|나무 방패/.test(id)){tool(item);return;}
 if(item.slot||item.category===3||item.category===4){apparel(item);return;}
 if(["열매","찻잎","곡식"].includes(item.form)||/조릿대 잎|가시배|타마린드|볍씨|손질한 곡물|^씨앗$/.test(id)){plant(item);return;}
 if(/고기/.test(id)){
  const size=/매우/.test(id)?1.16:/작은|조각/.test(id)?.79:1;
  moved(128,128,-.26,()=>{c.scale(size,size);shape("M-69 -16 Q-58 -56 -10 -46 Q20 -34 52 -37 Q75 -16 64 22 Q45 52 -3 41 Q-32 46 -61 27Z",blend(-64,-51,60,46,"#e2a68a","#a45144","#632c2b"),"#593326",3);
  for(let i=0;i<6;i++)shape(`M${-53+i*17} ${-30+i*2} q-12 18 9 43`,null,i%2?"#edaf9080":"#f4d0acb0",range(1.6,4.5));
  if(!/조각/.test(id))ellipse(35,-6,13,12,"#efdbb6","#c78a71",3);});return;
 }
 if(/따뜻한|곡물죽/.test(id)){bowl(id.includes("차"),id.includes("죽"));return;}
 if(/주먹밥/.test(id)){
  shape("M58 170 Q75 132 105 82 Q124 59 145 87 L197 169 Q206 195 135 194 Q57 199 58 170Z",blend(79,73,156,191,"#f3e7cc","#d2c7a9","#8e8f79"));
  shape("M104 151 Q128 143 154 149 L155 195 104 195Z",blend(102,149,157,194,"#61724b","#394935","#222c27"));
  for(let i=0;i<90;i++){const x=range(70,184),y=range(96,182);if(Math.abs(x-128)<(y-79)*.56&&!(x>105&&x<153&&y>150))ellipse(x,y,range(.6,2.9),1.1,"#faf2d9aa");}return;
 }
 if(/여행솥|항아리|방수 자작나무 통|보급 연료/.test(id)){
  if(id==="여행솥"){
   shape("M74 124 Q63 52 124 53 Q179 50 178 124",null,"#b5a589",7);
   shape("M59 121 Q60 193 120 203 Q182 199 195 121Z",steel);
   ellipse(127,121,69,22,"#535953","#d4c3a3",4);ellipse(126,100,11,5,brass);
  }else jar(id);return;
 }
 if(/수위 관측 기록/.test(id)){
  moved(128,126,-.16,()=>{shape("M-61 -65 L55 -58 62 65 -59 70Z",blend(-60,-63,62,67,"#e5cf9b","#c8ad76","#95754c"));
   shape("M-47 -35 H39 M-47 -15 H43 M-44 7 H37 M-43 28 H35 M-41 48 H43",null,"#765d44",2);
   shape("M-45 34 L-18 20 4 29 25 4 44 12",null,"#638275",3);
  });return;
 }
 if(/밧줄|끈|시위/.test(id)){
  const n=/굵은|표류/.test(id)?6:4;
  moved(124,134,range(-.35,.35),()=>{
   for(let i=0;i<n;i++){ellipse(i*3,-i*4,67-i*6,33-i*1.7,null,"#4a3b2d",10);ellipse(i*3,-i*4,67-i*6,33-i*1.7,null,/방수/.test(id)?"#7c8a61":"#b59865",6.2);}
   shape("M-56 12 Q-61 42 -39 60 Q-24 72 -12 58",null,"#ac8d5f",7);
  });return;
 }
 if(/숫돌|석회암|사암촉/.test(id)){
  const sharp=/촉/.test(id),gray=/화강암/.test(id);
  const rock=sharp?"M53 151 L188 80 154 161 99 182Z":/숫돌/.test(id)?"M54 143 L139 70 203 111 125 184 58 172Z":"M54 161 L61 110 109 72 158 75 198 119 188 174 132 194 83 181Z";
  const p=shape(rock,blend(68,77,181,180,gray?"#a2aaa8":"#d2bd91",gray?"#78817f":"#a08969","#51483c"));
  c.save();c.clip(p);
  for(let i=0;i<170;i++)ellipse(range(53,204),range(72,187),range(.4,1.6),1,i%3?"#574d425b":"#f3debd87");
  c.restore();return;
 }
 if(/구리 배관|양수기 부품|정밀 연결부|단조 철재/.test(id)){
  const mat=/구리|양수기/.test(id)?brass:steel;
  if(/배관/.test(id)){
   shape("M57 150 L100 150 Q127 150 128 123 L128 107 Q128 75 161 75 H186 V107 H167 Q157 107 158 121 Q161 177 103 182 H57Z",mat);
   ellipse(57,166,8,19,brass,"#714b34",3);ellipse(185,91,7,16,"#56392e","#b78250",3);
  }else{
   moved(127,127,/정밀/.test(id)?-.23:/단조/.test(id)?.76:.40,()=>{
    shape("M-65 -24 L-33 -29 -29 -45 -1 -45 3 -34 25 -33 33 -19 63 -19 65 26 30 26 20 40 -26 38 -32 22 -65 23Z",mat);
    ellipse(3,1,24,24,mat,"#4f4236",3);ellipse(3,1,/단조/.test(id)?7:12,/정밀/.test(id)?8:12,"#343a38");
    for(const x of [-48,47])ellipse(x,3,5,5,"#c1a77d","#4a4035",1.4);
   });
  }return;
 }
 if(/수차/.test(id)){
  moved(126,126,-.15,()=>{
   ellipse(0,0,65,65,null,"#503623",19);ellipse(0,0,64,64,null,"#b58757",12);
   for(let i=0;i<8;i++)moved(0,0,i*Math.PI/4,()=>shape("M-5 0 V-59 L6 -60 5 0Z",timber));
   ellipse(0,0,14,14,brass,"#59402f",3);
  });return;
 }
 if(/작업대|울타리|상자|수문틀/.test(id)){
  if(/상자/.test(id)){
   board(53,110,102,41,53);shape("M94 135 L94 186 M127 129 L127 180 M160 122 L160 172",null,"#bc9161",3);
  }else if(/울타리/.test(id)){
   for(const x of [58,126,196])shape(`M${x-7} 189 V${85-(x-58)*.12} l7 -9 7 7 V185Z`,timber);
   board(58,110,138,8,12);board(58,147,138,8,12);
  }else if(/수문/.test(id)){
   shape("M49 188 L63 73 179 52 203 159 180 168 161 79 88 92 74 182Z",timber);board(68,148,111,12,17);
  }else{
   for(const [x,y] of [[67,137],[179,119],[103,153],[207,137]])shape(`M${x-6} ${y} l13 -2 -1 39 -13 4Z`,timber);
   board(46,108,122,57,14);board(73,157,108,10,9);
  }return;
 }
 if(/용골|얕은 배/.test(id)){
  shape("M38 131 Q62 141 79 142 Q154 143 211 80 Q195 150 135 169 Q68 194 38 131Z",timber);
  shape("M62 150 Q128 171 195 113",null,"#d2a374",4);
  if(/부품/.test(id))for(let i=0;i<4;i++)shape(`M${88+i*22} 151 l${-9+i*5} -26`,null,"#bd986a",7);
  return;
 }
 if(/부표/.test(id)){
  moved(128,125,.52,()=>{ellipse(0,0,28,65,timber,"#463428",2.5);shape("M-24 -7 Q0 6 23 -8 M-23 0 Q0 14 25 0",null,"#c4aa73",5);});return;
 }
 if(/널판|들보|장작|보강편|적층재/.test(id)){
  const n=/들보/.test(id)?2:/적층|장작/.test(id)?4:3;
  for(let i=0;i<n;i++)board(44+i*9,143-i*16,range(108,145),range(20,35),range(8,14),/방수/.test(id)?blend(51,91,167,154,"#ad9370","#746653","#4b463c"):timber);
  return;
 }
 throw Error("No illustration for "+id);
}
export function drawInventoryItem(item){
 seed=2166136261;
 for(const letter of item.id)seed=Math.imul(seed^letter.codePointAt(0),16777619)>>>0;
 c.clearRect(0,0,256,256);
 c.save();props(item);c.restore();
 const {data}=c.getImageData(0,0,256,256);
 let minX=256,minY=256,maxX=-1,maxY=-1;
 for(let i=0;i<data.length;i+=4)if(data[i+3]){
  const p=i/4,x=p%256,y=Math.floor(p/256);
  minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
 }
 if(maxX<0)throw Error("Empty illustration "+item.id);
 const out=document.createElement("canvas");out.width=out.height=256;
 const w=maxX-minX+1,h=maxY-minY+1,scale=212/Math.max(w,h);
 const context=out.getContext("2d");context.imageSmoothingQuality="high";
 context.drawImage(canvas,minX,minY,w,h,(256-w*scale)/2,(256-h*scale)/2,w*scale,h*scale);
 return out;
}
