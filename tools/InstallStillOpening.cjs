const fs=require("node:fs"),path=require("node:path");
const dir=process.argv[2];
const file=path.join(dir,"index.html");
let html=fs.readFileSync(file,"utf8");
const replace=(old,next)=>{
 if(!html.includes(old))throw Error("Opening hook not found: "+old.slice(0,95));
 html=html.replace(old,next);
};
replace(' <button class="opening-skip"', ' <video id="soil-opening-film" class="soil-opening-film" aria-label="Mercy’s Last Grain 오프닝 영상" preload="none" playsinline muted hidden></video>\n <button class="opening-skip"');
replace(' if(soil){window.soilOpening=null;opening.classList.remove("soil-opening");}',
 ` if(soil){
  window.soilOpening=null;
  if(soil.video){soil.video.pause();soil.video.hidden=true;}
  opening.classList.remove("soil-opening");
 }`);
const start=html.indexOf('  const pending={previous};\n  window.soilOpening=pending;');
const end=html.indexOf('\n }\n}\n$("opening-skip")',start);
if(start<0||end<0)throw Error("Original Soil cinematic loader not found");
html=html.slice(0,start)+`  const video=$("soil-opening-film");
  const showing={previous,video};
  window.soilOpening=showing;
  const reportError=()=>{
   if(window.soilOpening!==showing)return;
   video.hidden=true;
   setOpeningShot(["soil","","오프닝 영상을 열 수 없습니다. 건너뛰기를 눌러 게임을 계속할 수 있습니다."]);
  };
  video.onended=()=>{if(window.soilOpening===showing)finishOpening();};
  video.onloadeddata=()=>{if(window.soilOpening===showing)setOpeningShot(["soil","",""]);};
  video.onerror=reportError;
  video.hidden=false;
  if(!video.getAttribute("src"))video.src="assets/cinematic/mercy-opening.mp4";
  else video.currentTime=0;
  video.play().catch(reportError);`+html.slice(end);
replace('  if(!frameCap||time-lastWorldFrame>=1000/30-1){',
 '  if((!opening.open||!window.soilOpening?.video||!lastWorldFrame)&&(!frameCap||time-lastWorldFrame>=1000/30-1)){');
fs.writeFileSync(file,html);
const css=path.join(dir,"soil-opening.css");
fs.appendFileSync(css,`
#opening.soil-opening{background:#080908}
#opening.soil-opening::backdrop{background:#080908}
.soil-opening-film{
 position:absolute;inset:0;width:100%;height:100%;object-fit:contain;
 background:#080908;z-index:1;pointer-events:none;
}
`);
