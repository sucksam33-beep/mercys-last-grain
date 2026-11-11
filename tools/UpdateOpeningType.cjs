const fs=require("node:fs"),path=require("node:path");
const file=path.join(__dirname,"RenderDialogueOpening.cjs");
let script=fs.readFileSync(file,"utf8");
function replace(before,after){
 if(!script.includes(before))throw Error("Missing renderer section: "+before.slice(0,70));
 script=script.replace(before,after);
}
replace('   if(!/^', `   const fontFiles={"dialogue.ttf":"HANBatang.ttf","speaker.ttf":"HANBatangB.ttf","title.ttf":"GARA.TTF"};
   if(Object.hasOwn(fontFiles,file))return route.fulfill({path:path.join(process.env.WINDIR,"Fonts",fontFiles[file]),contentType:"font/ttf"});
   if(!/^`);
replace(`   await document.fonts.load('500 42px "Malgun Gothic"',"씨앗");`, `   const fonts=await Promise.all([
    new FontFace("FilmDialogue","url(/dialogue.ttf)").load(),
    new FontFace("FilmSpeaker","url(/speaker.ttf)").load(),
    new FontFace("FilmTitle","url(/title.ttf)").load(),
   ]);
   fonts.forEach(font=>document.fonts.add(font));`);
replace(`ctx.font="bold 88px Georgia, serif";ctx.fillStyle="#f2e8d5";`, `ctx.font="116px FilmTitle";ctx.letterSpacing="2px";ctx.fillStyle="#f2e8d5";`);
replace(`     ctx.fillStyle="#ae8b56";ctx.fillRect(width*.5-52,height*.57,104,2);`, `     ctx.letterSpacing="0px";
     ctx.fillStyle="#ae8b56";ctx.fillRect(width*.5-64,height*.565,128,1.5);`);
replace(`const base=height*.917-(shot.lines.length-1)*52;
    const nameY=base-61;`, `const lineHeight=62;
    const base=height*.912-(shot.lines.length-1)*lineHeight;
    const nameY=base-70;`);
replace(`    ctx.font='700 31px "Malgun Gothic", sans-serif';
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
    ctx.shadowBlur=0;ctx.globalAlpha=1;`, `    ctx.font="34px FilmSpeaker";
    ctx.letterSpacing="5px";
    const halfName=ctx.measureText(shot.speaker).width*.5;
    const left=width*.5-halfName-20,right=width*.5+halfName+20;
    ctx.fillStyle="#ae8b56";
    ctx.fillRect(left-43,nameY,43,1.5);
    ctx.fillRect(right,nameY,43,1.5);
    ctx.shadowColor="#090907";ctx.shadowBlur=9;
    ctx.fillStyle="#efcc8e";ctx.fillText(shot.speaker,width*.5,nameY);
    ctx.letterSpacing="0px";
    ctx.font="52px FilmDialogue";
    ctx.fillStyle="#fff2df";
    ctx.strokeStyle="rgba(13,11,8,.87)";ctx.lineWidth=2;ctx.lineJoin="round";
    shot.lines.forEach((line,lineIndex)=>{
     const y=base+lineIndex*lineHeight;
     ctx.strokeText(line,width*.5,y,width*.86);
     ctx.fillText(line,width*.5,y,width*.86);
    });
    ctx.shadowBlur=0;ctx.globalAlpha=1;`);
fs.writeFileSync(file,script);