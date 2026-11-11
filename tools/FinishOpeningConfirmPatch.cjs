const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const target=path.join(__dirname,"dialogue-opening-stage/game/index.html");
let source=fs.readFileSync(target,"utf8");
for(const [from,to] of [
 ['video.play().catch(reportError);','video.play().catch(error=>{if(error.name!=="AbortError")reportError();});'],
 ['if(resumeVideo)video?.play().catch(()=>{});','if(resumeVideo)video?.play().catch(error=>{if(error.name!=="AbortError")video.onerror?.();});'],
 ['href="intro.css"','href="intro.css?v=opening-confirm"'],
 ['href="soil-opening.css"','href="soil-opening.css?v=opening-confirm"'],
 ['src="GameMenu.js"','src="GameMenu.js?v=walter"'],
]){
 assert.equal(source.split(from).length,2,from);
 source=source.replace(from,()=>to);
}
fs.writeFileSync(target,source);