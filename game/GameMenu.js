"use strict";

function gameMenu(){
 if(opening.open)return;
 const dialog=$("dialog");
 const body=modal("일시정지","Mercy’s Last Grain");
 setPauseBack(null);
 body.classList.add("game-menu-grid");
 dialog.dataset.pauseRoot="";
 const items=[
  ["계속하기",resumeGameplay],
  ["지도",()=>{gameMenuPanel("지도");openMap()}],
  ["플레이어",gamePlayer],
  ["장비",craftGearMenu],
  ["망치 건축",hammerMenu],
  ["도감",craftShowCodex],
  ["가방",()=>{gameMenuPanel("가방");satchel()}],
  ["일지",()=>{gameMenuPanel("일지");journalMenu()}],
  ["설정",settingsMenu],
  ["조작법",gameControls],
  ["저장",()=>manualGameSave(body)],
  ["불러오기",()=>{
   if(!window.chrome?.webview&&typeof showSavedGames==="function"){
    showSavedGames(gameMenu);return;
   }
   gameConfirm("불러오기","마지막 수동 저장을 불러올까요? 지금 진행 중인 상태가 저장 시점으로 돌아갑니다.",requestGameLoad);
  }],
  ["메인화면으로",()=>gameConfirm("메인화면으로","타이틀 화면으로 돌아갈까요?",()=>gameNative("title"))],
  ["종료",()=>gameConfirm("종료","게임을 종료할까요?",()=>gameNative("gameExit"))]
 ];
 if(!window.chrome?.webview){
  items.splice(-2,2);
 }
 for(const [label,action] of items)menuAction(body,label,action,label==="계속하기");
 body.querySelector("button")?.focus();
}
function menuAction(parent,label,action,primary=false){
 const item=document.createElement("button");
 item.type="button";item.textContent=label;
 if(primary)item.className="primary";
 item.onclick=action;parent.append(item);
 return item;
}
function gameMenuPanel(title,back=gameMenu){
 delete $("dialog").dataset.pauseRoot;
 const body=modal("Mercy’s Last Grain",title);
 setPauseBack(back);
 body.classList.remove("game-menu-grid");
 return body;
}
function gameConfirm(title,message,action){
 const body=gameMenuPanel(title);
 const p=document.createElement("p");p.textContent=message;body.append(p);
 menuAction(body,title,action,true);
 menuAction(body,"취소",gameMenu).focus();
}
function gamePlayer(){
 const body=gameMenuPanel("월터 보스",gameplayPaused?gameMenu:null);
 for(const value of [r().name+" · "+s.day+"일차","기운 "+s.energy+" / 100"]){
  const p=document.createElement("p");p.textContent=value;body.append(p);
 }
 body.append(coinAmount(s.coins,"소지금"));
 menuAction(body,"가방 열기",satchel);
 if(typeof settingsMenu==="function")menuAction(body,"설정",settingsMenu);
 menuAction(body,"게임 메뉴로",gameMenu);
}
function gameControls(){
 const body=gameMenuPanel("조작법");
 $("dialog").dataset.controlDiagrams="";
 renderControlDiagrams(body);
}
function questList(){
 const body=gameMenuPanel("퀘스트 목록",gameplayPaused?gameMenu:null);
 const quests=activeMapQuests();
 questMapActions(body,quests.filter((q,i)=>quests.findIndex(v=>v.type===q.type&&v.title===q.title)===i));
 body.append($("journal").cloneNode(true));
 menuAction(body,"게임 메뉴로",gameMenu);
}
function gameNative(op,extra={}){
 window.chrome?.webview?.postMessage({op,...extra});
}
function manualGameSave(body){
 const state={...s,manualPosition:{x:player.x,y:player.y,heading}};
 const message=document.createElement("p");
 message.id="manual-save-feedback";message.setAttribute("role","status");
 body.querySelector("#manual-save-feedback")?.remove();body.append(message);
 message.textContent="저장 중…";
 message.dataset.uiState="loading";
 if(!window.chrome?.webview){
  try{
   const data=typeof manualSaves==="function"?[makeSave(),...manualSaves()]:state;
   localStorage.setItem("returning-waters-manual-v1",JSON.stringify(data));
   message.textContent="저장이 완료되었습니다.";message.dataset.uiState="success";
  }catch{
   message.textContent="저장 공간을 사용할 수 없습니다.";message.dataset.uiState="error";
  }
  return;
 }
 gameNative("manualSave",{data:JSON.stringify(state)});
}
function requestGameLoad(){
 if(window.chrome?.webview){gameNative("manualLoad");return}
 try{
  const state=JSON.parse(localStorage.getItem("returning-waters-manual-v1"));
  if(state?.homes&&regions[state.region]&&story[state.stage]&&Array.isArray(state.log)){applyManualGameSave(state);return}
 }catch{}
 const body=gameMenuPanel("불러오기"),message=document.createElement("p");
 message.dataset.uiState="error";message.setAttribute("role","alert");
 message.textContent="불러올 수 있는 수동 저장이 없습니다.";body.append(message);
 menuAction(body,"게임 메뉴로",gameMenu).focus();
}
function applyManualGameSave(save){
 const position=save.manualPosition;
 if(typeof applyProgress==="function"){
  applyProgress({...fresh(),...save,introPending:false},position);
  showProgressToast("수동 저장을 불러왔습니다.");
  return;
 }
 s={...fresh(),...save,introPending:false};
 delete s.manualPosition;
 if(position&&Number.isFinite(position.x)&&Number.isFinite(position.y)&&Number.isFinite(position.heading)){
  player={x:cap(position.x,4,636),y:cap(position.y,12,412)};
  facing=heading=position.heading;
 }else player={x:93,y:118};
 keys.clear();stopMoving();
 selected="station";actionSpot=null;target=marker=null;loadedScene="";
 asagiWater.initialized=false;
 $("dialog").close();
 render();
 log("수동 저장을 불러왔습니다.");
}
function mountGameMenu(){
 const dialog=$("dialog");
 mountGameplayPause(dialog);
 dialog.addEventListener("keydown",event=>{
  const columns=dialog.hasAttribute("data-pause-root")?2:1;
  const direction={ArrowLeft:-1,ArrowRight:1,ArrowUp:-columns,ArrowDown:columns}[event.key];
  if(!direction||!event.target.closest("button"))return;
  const buttons=menuButtons(dialog);
  const index=buttons.indexOf(document.activeElement);
  event.preventDefault();
  buttons[(Math.max(0,index)+direction+buttons.length)%buttons.length]?.focus();
 });
 dialog.addEventListener("close",()=>{
  delete dialog.dataset.pauseRoot;
  $("dialogBody").classList.remove("game-menu-grid");
 });
 const entry=document.createElement("button");
 entry.className="game-menu-entry";entry.type="button";
 entry.textContent="메뉴";entry.title="게임 메뉴 (Esc)";
 entry.onclick=gameMenu;worldActionStack.prepend(entry);
 window.chrome?.webview?.addEventListener("message",event=>{
  const message=event.data;
  if(message.type==="manualSave"){
   const feedback=$("manual-save-feedback");
   if(feedback){
    feedback.textContent=message.message;
    feedback.dataset.uiState=message.ok===false?"error":"success";
   }
  }
  if(message.type==="manualLoad"){
   if(message.save)applyManualGameSave(message.save);
   else{
    const body=gameMenuPanel("불러오기");
    const p=document.createElement("p");p.textContent=message.message;body.append(p);
    menuAction(body,"게임 메뉴로",gameMenu).focus();
   }
  }
 });
}
