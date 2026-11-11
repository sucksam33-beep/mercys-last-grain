const fs=require("node:fs"),path=require("node:path");
const file=path.join(__dirname,"RenderDialogueOpening.cjs");
let source=fs.readFileSync(file,"utf8");
for(const [from,to] of [["34px FilmSpeaker","24px FilmSpeaker"],["52px FilmDialogue","36px FilmDialogue"],["const lineHeight=62","const lineHeight=44"],["const nameY=base-70","const nameY=base-50"],['letterSpacing="5px"','letterSpacing="3.5px"']]){
 if(!source.includes(from))throw Error(from);
 source=source.replace(from,to);
}
fs.writeFileSync(file,source);
