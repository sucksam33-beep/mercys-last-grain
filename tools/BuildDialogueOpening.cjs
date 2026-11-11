const fs=require("node:fs"),path=require("node:path");
const old=fs.readFileSync(path.join(__dirname,"RenderOpeningFilm.cjs"),"utf8");
const dir=path.join(__dirname,"dialogue-cinematic");
const {scenes,titleStart,length}=JSON.parse(fs.readFileSync(path.join(dir,"dialogue.json"),"utf8"));
let source=old.slice(0,old.indexOf("const root="))+`const root=path.join(__dirname,"dialogue-cinematic"),output=path.join(root,"Mercys-Last-Grain-Opening-Dialogue.mp4");
const scenes=`+JSON.stringify(scenes)+`;
const titleStart=`+titleStart+`,length=`+length+`;
`+old.slice(old.indexOf("(async()=>{"));
const start=source.indexOf("   function frame(t){"),end=source.indexOf("   frame(0);",start);
if(start<0||end<0)throw Error("Missing frame compositor");
source=source.slice(0,start)+`   function frame(t){
    if(t>=titleStart){
     ctx.fillStyle="#101412";ctx.fillRect(0,0,width,height);
     const fade=Math.min(1,(t-titleStart)/1.1,(length-t)/.80);
     ctx.globalAlpha=Math.max(0,fade);
     ctx.textAlign="center";ctx.textBaseline="middle";
     ctx.font="bold 88px Georgia, serif";ctx.fillStyle="#f2e8d5";
     ctx.fillText("Mercy’s Last Grain",width*.5,height*.48);
     ctx.fillStyle="#ae8b56";ctx.fillRect(width*.5-52,height*.57,104,2);
     ctx.globalAlpha=1;
     return;
    }
    let i=scenes.length-1;
    while(t<scenes[i].start)i--;
    const shot=scenes[i];
    still(i,t);
    const a=Math.min(1,(t-shot.start)*8);
    const base=height*.917-(shot.lines.length-1)*52;
    const nameY=base-61;
    ctx.globalAlpha=a;
    const shade=ctx.createLinearGradient(0,height*.60,0,height);
    shade.addColorStop(0,"transparent");
    shade.addColorStop(.58,"rgba(8,9,8,.54)");
    shade.addColorStop(1,"rgba(8,9,8,.88)");
    ctx.fillStyle=shade;ctx.fillRect(0,height*.60,width,height*.40);
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font='700 31px "Malgun Gothic", sans-serif';
    const nameWidth=ctx.measureText(shot.speaker).width;
    const badgeWidth=nameWidth+68,x=(width-badgeWidth)*.5;
    ctx.fillStyle="rgba(17,19,17,.87)";
    ctx.strokeStyle="#ae8b56";ctx.lineWidth=1.25;
    ctx.beginPath();ctx.roundRect(x,nameY-23,badgeWidth,46,8);ctx.fill();ctx.stroke();
    ctx.fillStyle="#b9965d";ctx.fillRect(x-50,nameY,36,1.5);
    ctx.fillRect(x+badgeWidth+14,nameY,36,1.5);
    ctx.fillStyle="#e8c78d";ctx.fillText(shot.speaker,width*.5,nameY-1);
    ctx.font='500 43px "Malgun Gothic", sans-serif';
    ctx.shadowColor="#060706";ctx.shadowBlur=8;ctx.fillStyle="#f6eddd";
    shot.lines.forEach((line,lineIndex)=>ctx.fillText(line,width*.5,base+lineIndex*52,width*.86));
    ctx.shadowBlur=0;ctx.globalAlpha=1;
    const black=Math.max(0,1-t/.55);
    if(black){ctx.fillStyle="rgba(0,0,0,"+black+")";ctx.fillRect(0,0,width,height);}
   }
`+source.slice(end);
source=source.replace("async({scenes,length})","async({scenes,titleStart,length})")
 .replace("},{scenes,length});","},{scenes,titleStart,length});");
fs.writeFileSync(path.join(__dirname,"RenderDialogueOpening.cjs"),source);
