"use strict";

let gameplayPaused=false;
let pauseBack=null;
let restoreCameraLock=false;
const pausedAudio=new Set();
const blockedPadButtons=new Set();
let waitForLeftStick=false,waitForRightStick=false;

function clearPauseInputs(){
 keys.clear();
 stopMoving();
 resetCombatInputs();
 movement.lastShift=-Infinity;
 drag=null;
 pad.x=pad.z=0;
 pad.run=pad.sprint=pad.focus=false;
 pad.lastTap=-Infinity;
 pad.sprintUntil=0;
 waitForLeftStick=waitForRightStick=true;
 pad.buttons.forEach((down,index)=>{if(down)blockedPadButtons.add(index);});
}

function prepareWorldAudio(audio){
 if(gameplayPaused){
  pausedAudio.add(audio);
  if(audio.state==="running")audio.suspend().catch(()=>{});
 }else if(audio.state==="suspended")audio.resume().catch(()=>{});
}

function setGameplayPause(paused){
 if(gameplayPaused===paused)return;
 gameplayPaused=paused;
 clearPauseInputs();
 last=0;
 lastClockFrame=null;
 if(paused){
  restoreCameraLock=document.pointerLockElement===canvas;
  if(document.pointerLockElement)document.exitPointerLock();
  for(const audio of [sluiceAudio,thunderAudio]){
   if(audio?.state==="running")prepareWorldAudio(audio);
  }
 }else{
  pauseBack=null;
  for(const audio of pausedAudio)audio.resume().catch(()=>{});
  pausedAudio.clear();
 }
}

function setPauseBack(back){
 pauseBack=back;
 const close=$("dialog").querySelector('form[method="dialog"] button');
 if(close)close.textContent=back?"뒤로":"닫기";
}

function resumeGameplay(event){
 const restore=restoreCameraLock;
 $("dialog").close();
 setGameplayPause(false);
 restoreCameraLock=false;
 if(!opening.open){
  canvas.focus({preventScroll:true});
  // Escape and controller navigation can always restore the camera with a canvas click.
  if(restore&&event?.isTrusted&&event instanceof MouseEvent){
   try{canvas.requestPointerLock?.()?.catch(()=>{});}catch{}
  }
 }
}

function backFromPause(){
 if(pauseBack)pauseBack();
 else resumeGameplay();
}

function mountGameplayPause(dialog){
 dialog.addEventListener("cancel",event=>{event.preventDefault();backFromPause();});
 dialog.addEventListener("submit",event=>{event.preventDefault();backFromPause();});
 dialog.addEventListener("close",()=>{
  if(dialog.open)return;
  setGameplayPause(false);
  setPauseBack(null);
  restoreCameraLock=false;
 });
}
