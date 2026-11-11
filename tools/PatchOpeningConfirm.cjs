const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const stage=path.join(__dirname,"dialogue-opening-stage","game");
function edit(file,replacements){
 const target=path.join(stage,file);
 let source=fs.readFileSync(target,"utf8").replaceAll("\r\n","\n");
 for(const [old,next] of replacements){
  assert.equal(source.split(old).length,2,file+": "+old);
  source=source.replace(old,()=>next);
 }
 fs.writeFileSync(target,source);
}
edit("index.html",[
 [' <button class="opening-skip" id="opening-skip" type="button" autofocus>건너뛰기</button>',`</dialog>
<dialog id="opening-confirm" class="opening-confirm" aria-labelledby="opening-confirm-question">
 <h2 id="opening-confirm-question">영상을 스킵 하시겠습니까?</h2>
 <div class="opening-confirm-actions">
  <button id="opening-confirm-yes" type="button">예</button>
  <button id="opening-confirm-no" type="button" autofocus>아니오</button>
 </div>`],
 ['  if(pressed(0)||pressed(1)||pressed(9))finishOpening();',`  if(pressed(0))requestOpeningSkip();
  else if(pressed(1))cancelOpeningSkip();`],
 ['if(opening.open&&!window.soilOpening)updateOpening(simulationTime);','if(opening.open&&!openingConfirm.open&&!window.soilOpening)updateOpening(simulationTime);'],
 [` const k=e.key.toLowerCase();
 if(k==="escape"){`,` const k=e.key.toLowerCase();
 if(opening.open){
  if(k==="enter"||k==="escape"){
   e.preventDefault();
   if(!e.repeat){
    if(k==="enter")requestOpeningSkip();
    else cancelOpeningSkip();
   }
  }
  return;
 }
 if(k==="escape"){`],
 ['  if(opening.open)finishOpening();\n  else if($("dialog").open)backFromPause();','  if($("dialog").open)backFromPause();'],
 ['const openingMusic=$("opening-music");',`const openingMusic=$("opening-music");
const openingConfirm=$("opening-confirm");
let openingSuspended=null;
function requestOpeningSkip(){
 if(!opening.open)return;
 if(openingConfirm.open){finishOpening();return;}
 const video=window.soilOpening?.video;
 openingSuspended={time:simulationTime,resumeVideo:!!video&&!video.paused,resumeMusic:!openingMusic.paused};
 video?.pause();
 openingMusic.pause();
 openingConfirm.showModal();
}
function cancelOpeningSkip(){
 if(!openingConfirm.open)return;
 openingConfirm.close();
 const {time,resumeVideo,resumeMusic}=openingSuspended;
 openingSuspended=null;
 const video=window.soilOpening?.video;
 if(resumeVideo)video?.play().catch(()=>{});
 if(!video&&asagiFilm.started!==null)asagiFilm.started+=simulationTime-time;
 if(resumeMusic)playOpeningMusic();
}
$("opening-confirm-yes").onclick=finishOpening;
$("opening-confirm-no").onclick=cancelOpeningSkip;
openingConfirm.addEventListener("cancel",event=>{event.preventDefault();cancelOpeningSkip();});`],
 ['if(opening.open&&openingMusic.paused','if(opening.open&&!openingConfirm.open&&openingMusic.paused'],
 [' if(!opening.open)return;\n openingMusic.pause();',` if(!opening.open)return;
 if(openingConfirm.open)openingConfirm.close();
 openingSuspended=null;
 openingMusic.pause();`],
 ['오프닝 영상을 열 수 없습니다. 건너뛰기를 눌러 게임을 계속할 수 있습니다.','오프닝 영상을 열 수 없습니다. Enter 또는 게임패드 A를 눌러 계속할 수 있습니다.'],
 ['mercy-opening.mp4?v=dialogue-walter','mercy-opening.mp4?v=dialogue-confirm'],
 ['$("opening-skip").onclick=finishOpening;\nopening.addEventListener("cancel",event=>{event.preventDefault();finishOpening()});','opening.addEventListener("cancel",event=>event.preventDefault());'],
]);
edit("GameMenu.js",[['const body=gameMenuPanel("플레이어",gameplayPaused?gameMenu:null);','const body=gameMenuPanel("월터 보스",gameplayPaused?gameMenu:null);']]);
edit("soil-opening.css",[['#opening.soil-opening .opening-skip{z-index:3}\n','']]);
edit("intro.css",[
 ['.opening-caption, .opening-skip {','.opening-caption {'],
 ['font-size: clamp(1rem, 2vw, 1.3rem)','font-size: clamp(.7rem, 1.4vw, .91rem)'],
 [`.opening-skip {
  top: max(16px, env(safe-area-inset-top));
  right: max(16px, env(safe-area-inset-right));
  background: #191e16e8;
}`,`dialog.opening-confirm {
  width: min(26rem, calc(100% - 2rem));
  box-sizing: border-box;
  padding: 1.65rem;
  color: #f5e9d6;
  background: #151813;
  border: 1px solid #9b7950;
  text-align: center;
}
.opening-confirm::backdrop { background: #080906b8 }
.opening-confirm h2 { margin: 0 0 1.25rem; font-size: 1.2rem }
.opening-confirm-actions { display: flex; justify-content: center; gap: .75rem }
.opening-confirm-actions button { min-width: 5.5rem }`],
]);
