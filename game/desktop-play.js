(() => {
 const mode=window.desktopLaunchMode;
 if(!mode)return;
 const send=op=>chrome.webview.postMessage({op});
 const volume=Math.max(0,Math.min(100,Number(localStorage.getItem("returning-waters-volume")??75)))/100;
 if(window.AudioNode){
  const connect=AudioNode.prototype.connect, outputs=new WeakMap();
  AudioNode.prototype.connect=function(destination,...ports){
   if(destination===this.context.destination){
    let master=outputs.get(this.context);
    if(!master){
     master=this.context.createGain();master.gain.value=volume;
     connect.call(master,destination);outputs.set(this.context,master);
    }
    destination=master;
   }
   return connect.call(this,destination,...ports);
  };
 }
 const cover=document.createElement("div");
 cover.className="desktop-loading-cover";
 cover.setAttribute("role","status");
 cover.textContent=mode==="new"?"아사기로 이동 중…":"저장된 게임을 불러오는 중…";
 document.body.append(cover);
 let ready=false;
 addEventListener("error",()=>{if(!ready)send("gameError")});
 if(typeof graphics==="undefined"||!graphics){send("gameError");return}
 function check(){
  const openingVideo=opening.open?window.soilOpening?.video:null;
  if(!ready&&(openingVideo?.readyState>=2||(lastWorldFrame>0&&graphics.worldCount))){
   ready=true;
   cover.remove();
   send("gameReady");
  }
  if(ready&&!opening.open){send("controlReady");return}
  requestAnimationFrame(check);
 }
 requestAnimationFrame(check);
})();
