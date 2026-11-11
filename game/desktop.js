const by=id=>document.getElementById(id);
const host=chrome.webview;
const send=(op,extra={})=>host.postMessage({op,...extra});
const qualityKey="returning-waters-render-quality";
const volumeKey="returning-waters-volume";
let state=null, panel=null, pending=false, switched=false, confirmAction=null;
let retryMode=null, titleReported=false;
const show=(id,visible)=>by(id).hidden=!visible;
const text=(id,value)=>by(id).textContent=value;
const menuFocus=()=>state?.nickname?(state.saved?by("continue"):by("new")):document.querySelector('[data-open="register"]');
function focusMenu(){
 const item=by("retry").hidden?menuFocus():by("retry");
 if(item){markFocus(item);item.focus()}
}
function markFocus(item){
 by("menu").querySelector(".menu-focus")?.classList.remove("menu-focus");
 item.classList.add("menu-focus");
}
by("menu").addEventListener("focusin",event=>{
 if(event.target.matches("nav button"))markFocus(event.target);
});
function busy(value){
 pending=value;
 by("submit").disabled=value;
 by("submit").textContent=value?"처리 중…":panel==="register"?"회원가입":"로그인";
}
function clearErrors(){
 text("panel-error","");
 for(const [name,id] of [["id","id"],["password","password"],["nickname","nick"]]){
  text(name+"-error","");by(id).removeAttribute("aria-invalid");
 }
}
function openPanel(next){
 panel=next;show("menu",false);show("panel",true);
 for(const id of ["form","settings","account-panel","confirm"])show(id,false);
 clearErrors();
 if(next==="login"||next==="register"){
  const register=next==="register";
  text("panel-title",register?"회원가입":"로그인");
  by("form").reset();
  by("password").autocomplete=register?"new-password":"current-password";
  passwordVisible(false);
  show("nick-field",register);show("form",true);busy(false);by("id").focus();
 }else if(next==="settings"){
  text("panel-title","설정");show("settings",true);by("display").focus();
 }else if(next==="account"){
  text("panel-title","계정");text("account-name",state.nickname+" 님");
  show("account-panel",true);by("switch").focus();
 }else{
  show("confirm",true);by("back").focus();
 }
}
function closePanel(){
 if(pending)return;
 panel=null;show("panel",false);show("menu",true);
 if(state)focusMenu();else document.querySelector('[data-open="settings"]').focus();
}
function passwordVisible(visible){
 by("password").type=visible?"text":"password";
 by("visibility").setAttribute("aria-pressed",String(visible));
 by("visibility").setAttribute("aria-label",visible?"비밀번호 숨기기":"비밀번호 표시");
 text("visibility",visible?"숨기기":"보기");
}
function confirmPanel(title,message,action,callback){
 openPanel("confirm");text("panel-title",title);text("confirm-text",message);
 text("confirm-action",action);confirmAction=callback;
}
function launch(mode,confirmed=false){
 if(pending)return;
 if(by(mode==="continue"?"continue":"new").getAttribute("aria-disabled")==="true"){
  by("update-button").focus();
  return;
 }
 pending=true;
 send(mode,{confirmed});
}
function render(next){
 state=next;
 show("checking",false);show("guest",!state.nickname);show("player",!!state.nickname);
 show("continue",!!state.saved);show("account",!!state.nickname);show("nickname",!!state.nickname);
 text("nickname",state.nickname?state.nickname+" 님":"");
 text("summary",[state.location,state.day?state.day+"일차":null].filter(Boolean).join(" · "));
 retryMode=state.retry;
 show("retry",!!retryMode);
 text("notice",state.notice||"");
 if(!titleReported){titleReported=true;requestAnimationFrame(()=>requestAnimationFrame(()=>send("titleReady")))}
 if(switched){switched=false;openPanel("login");return}
 if(panel==="settings")return;
 if(panel==="account"&&state.nickname){text("account-name",state.nickname+" 님");return}
 closePanel();
}
for(const button of document.querySelectorAll("[data-open]"))button.onclick=()=>openPanel(button.dataset.open);
for(const button of document.querySelectorAll("[data-launch]"))button.onclick=()=>launch(button.dataset.launch);
by("back").onclick=closePanel;
by("visibility").onclick=()=>passwordVisible(by("password").type==="password");
by("confirm-action").onclick=()=>confirmAction?.();
by("retry").onclick=()=>{
 if(retryMode==="state"){show("retry",false);text("notice","");send("state")}
 else if(retryMode)launch(retryMode);
};
by("exit").onclick=()=>send("exit");
by("switch").onclick=()=>{switched=true;send("switch")};
by("logout").onclick=()=>send("logout");
by("form").onsubmit=event=>{
 event.preventDefault();if(pending)return;
 clearErrors();
 const values=new FormData(event.currentTarget);
 busy(true);
 send(panel,{id:values.get("id"),password:values.get("password"),nickname:values.get("nickname")});
};
by("import-button").onclick=()=>by("import").click();
by("import").onchange=async event=>{
 const file=event.target.files[0];event.target.value="";
 if(!file)return;
 if(file.size>1048576){text("panel-error","저장 파일은 1MB 이하여야 합니다.");return}
 try{
  const data=await file.text();
  confirmPanel("저장 가져오기","이 계정에 저장을 가져올까요? 기존 저장은 백업됩니다.","가져오기",()=>send("import",{data}));
 }catch{text("panel-error","저장 파일을 읽을 수 없습니다.")}
};
by("quality").value=localStorage.getItem(qualityKey)??"2";
if(!by("quality").value)by("quality").value="1";
by("quality").onchange=()=>localStorage.setItem(qualityKey,by("quality").value);
by("volume").value=localStorage.getItem(volumeKey)??"75";
text("volume-label",by("volume").value+"%");
by("volume").oninput=()=>{
 localStorage.setItem(volumeKey,by("volume").value);
 text("volume-label",by("volume").value+"%");
};
by("display").value=localStorage.getItem("returning-waters-display")==="full"?"full":"window";
function display(){
 const value=by("display").value;
 localStorage.setItem("returning-waters-display",value);
 send("fullscreen",{value:value==="full"});
}
by("display").onchange=display;
function moveFocus(step){
 const area=panel?by("panel"):by("menu");
 const items=[...area.querySelectorAll("button,input,select")].filter(x=>!x.disabled&&x.getClientRects().length);
 if(!items.length)return;
 const index=items.indexOf(document.activeElement);
 items[index<0?(step>0?0:items.length-1):(index+step+items.length)%items.length].focus();
}
document.addEventListener("keydown",event=>{
 if(event.key==="Escape"&&panel){event.preventDefault();closePanel()}
 if(!panel&&(event.key==="ArrowUp"||event.key==="ArrowDown")){
  event.preventDefault();moveFocus(event.key==="ArrowUp"?-1:1);
 }
});
let previous=[];
function controller(){
 const pad=Array.from(navigator.getGamepads?.()||[]).find(device=>device?.connected);
 const next=pad?[pad.buttons[0]?.pressed,pad.buttons[1]?.pressed,pad.buttons[12]?.pressed||pad.axes[1]<-.65,pad.buttons[13]?.pressed||pad.axes[1]>.65]:[];
 const pressed=index=>next[index]&&!previous[index];
 if(pressed(2))moveFocus(-1);
 if(pressed(3))moveFocus(1);
 if(pressed(0)){
  if(document.activeElement instanceof HTMLButtonElement)document.activeElement.click();
  else if(panel==="login"||panel==="register")by("form").requestSubmit();
 }
 if(pressed(1)&&panel)closePanel();
 previous=next;requestAnimationFrame(controller);
}
host.addEventListener("message",event=>{
 const message=event.data;
 if(message.type==="state"){pending=false;render(message);return}
 if(message.type==="confirmNew"){
  pending=false;
  confirmPanel("새 게임","기존 저장을 백업한 뒤 아사기에서 새로 시작할까요?","새 게임 시작",()=>launch("new",true));
  return;
 }
 if(message.type==="loading"){
  show("panel",false);show("menu",false);show("loading",true);
  text("loading",message.mode==="new"?"아사기로 이동 중…":"저장된 게임을 불러오는 중…");
  return;
 }
 if(message.type==="error"){
  pending=false;
  if(panel==="login"||panel==="register")busy(false);
  if(message.field&&panel){
   const field=by(message.field==="nickname"?"nick":message.field);
   text(message.field+"-error",message.message);field.setAttribute("aria-invalid","true");field.focus();
  }else if(panel){text("panel-error",message.message);switched=false}
  else{
   text("notice",message.message);
   if(!state){show("checking",false);retryMode="state";show("retry",true);by("retry").focus()}
  }
 }
});
display();send("state");requestAnimationFrame(controller);
