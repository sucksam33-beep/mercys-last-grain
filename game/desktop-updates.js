(() => {
 const web=window.chrome?.webview;
 if(!web)return;
 const by=id=>document.getElementById(id);
 const button=by("update-button"),message=by("update-message");
 const progress=by("update-progress"),notes=by("update-notes");
 let phase="initial";
 const blocked=()=>["initial","checking","available","downloading"].includes(phase);
 button.addEventListener("click",()=>{
  if(phase==="available"||phase==="failed")web.postMessage({op:"applyUpdate"});
  else if(phase==="offline")web.postMessage({op:"checkUpdate"});
 });
 document.addEventListener("click",event=>{
  if(blocked()&&event.target.closest("[data-launch],#retry")){
   event.preventDefault();
   event.stopImmediatePropagation();
  }
 },true);
 web.addEventListener("message",event=>{
  const info=event.data;
  if(info?.type!=="update")return;
  phase=info.phase;
  const downloading=phase==="downloading";
  by("updates").hidden=["initial","checking","current","complete"].includes(phase);
  message.textContent=info.message+(downloading?" "+info.progress+"%":"");
  progress.hidden=!downloading;
  progress.value=info.progress;
  notes.replaceChildren();
  for(const note of (info.notes||[]).slice(0,5)){
   const row=document.createElement("li");
   row.textContent=note;
   notes.append(row);
  }
  notes.hidden=!notes.children.length;
  button.hidden=!["available","failed","offline"].includes(phase);
  button.textContent=phase==="available"?"업데이트":"업데이트 다시 확인";
  if(phase==="failed")button.textContent="업데이트 다시 시도";
  document.querySelectorAll("[data-launch],#retry").forEach(item=>{
   if(blocked())item.setAttribute("aria-disabled","true");
   else item.removeAttribute("aria-disabled");
  });
 });
 web.postMessage({op:"updateState"});
})();
