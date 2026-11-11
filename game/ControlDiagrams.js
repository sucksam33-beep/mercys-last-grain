"use strict";

const keyboardActions={
 Esc:"일시정지",Tab:"가방",W:"앞",A:"왼쪽",S:"뒤",D:"오른쪽",E:"상호작용",
 V:"말 호출",R:"승하차",I:"플레이어",J:"퀘스트",M:"지도",Shift:"회피·질주",Enter:"메뉴 확인",Space:"점프",Q:"대상 고정",F:"전기",
 "↑":"앞","←":"왼쪽","↓":"뒤","→":"오른쪽"
};

function diagramSvg(view,title,description,body,variant=""){
 return `<svg class="controls-svg ${variant}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${view}" role="img" aria-label="${title}"><title>${title}</title><desc>${description}</desc>${body}</svg>`;
}
function diagramText(x,y,label,style="",anchor="middle"){
 return `<text class="${style}" x="${x}" y="${y}" text-anchor="${anchor}">${label}</text>`;
}
function diagramLine(points){return `<polyline class="diagram-leader" points="${points}"/>`;}
function diagramRect(x,y,w,h,style,rx=7){
 return `<rect class="${style}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
}
function diagramKey(x,y,w,key,action,h=43){
 const active=Boolean(action);
 return diagramRect(x,y+3,w,h,"diagram-key-shadow",6)+diagramRect(x,y,w,h,active?"diagram-key is-bound":"diagram-key",6)+
  diagramText(x+w*.5,y+(active?16:h*.5+5),key,active?"diagram-symbol":"diagram-idle")+
  (active?diagramText(x+w*.5,y+34,action,"diagram-key-action"):"");
}
function keyboardPicture(compact=false){
 const fullRows=[
  ["Esc","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12"],
  ["~","1","2","3","4","5","6","7","8","9","0","−","+","⌫"],
  ["Tab","Q","W","E","R","T","Y","U","I","O","P","[","]","＼"],
  ["Caps","A","S","D","F","G","H","J","K","L",";", "’","Enter"],
  ["Shift","Z","X","C","V","B","N","M",",",".","/","Shift"],
  ["Ctrl","Win","Alt","Space","Alt","Ctrl"]
 ];
 const widths={Esc:71,Tab:60,Caps:64,Enter:76,Shift:73,Space:232,"⌫":59};
 const compactRows=[["Esc","Tab","E","I"],["A","W","S","D"],["J","M","Shift","Enter"],["←","↑","↓","→"],["Q","F","Space"]];
 const rows=compact?compactRows:fullRows;
 const keys=rows.map((row,i)=>{
  let x=compact?17:19;
  return row.map(key=>{
   const w=compact?(key==="Space"?158:77):(widths[key]??(key==="I"?61:key==="E"||key==="Q"?61:42));
   const result=diagramKey(x,16+i*49,w,key,keyboardActions[key]);
   x+=w+4;
   return result;
  }).join("");
 }).join("");
 const arrows=compact?"":diagramKey(662,216,42,"↑","앞")+["←","↓","→"].map((key,i)=>
  diagramKey(616+i*46,265,42,key,keyboardActions[key])).join("");
 return diagramSvg(compact?"354 271":"770 327","키보드 조작",
  Object.entries(keyboardActions).map(([key,action])=>key+" "+action).join(", ")+
  ". 방향키는 메뉴 선택에도 사용. 왼쪽 Shift 짧게 회피 또는 백스텝, 길게 질주, Esc는 메뉴 뒤로 또는 도입부 건너뛰기, Tab과 Shift+Tab은 메뉴 포커스 이동.",
  diagramRect(4,5,compact?346:762,compact?259:315,"diagram-case",13)+
  diagramRect(8,9,compact?338:754,compact?250:304,"diagram-inlay",10)+keys+arrows,
  compact?"diagram-compact":"diagram-full");
}
function mousePicture(){
 return diagramSvg("354 153","마우스 조작","마우스 이동은 시점 회전, 좌클릭 일반 공격, 우클릭 가드 또는 왼손 공격, 휠 클릭 대상 고정, 휠 거리 조절. Ctrl과 좌클릭으로 강공격, Ctrl과 우클릭으로 전기, E와 좌우 클릭으로 양손잡기.",
  '<path class="diagram-case" d="M82 9C49 9 32 35 32 62v36c0 28 19 44 50 44s50-16 50-44V62C132 35 115 9 82 9Z"/>'+
  '<path class="diagram-key is-bound" d="M78 15C54 16 38 35 38 59v11h40Z"/>'+
  '<path class="diagram-key" d="M86 15c24 1 40 20 40 44v11H86Z"/>'+
  diagramRect(75,27,14,31,"diagram-key is-bound",7)+
  diagramLine("48,36 23,36 23,15 156,15")+
  diagramText(164,21,"좌클릭 · 일반 공격","diagram-callout","start")+
  diagramLine("89,43 145,43 155,50")+
  diagramText(164,57,"휠 클릭 · 대상 고정","diagram-callout","start")+
  diagramLine("131,97 151,97")+
  diagramText(164,102,"우클릭 · 가드/왼손","diagram-callout","start")+
  diagramText(164,129,"휠 · 거리 조절","diagram-note","start"));
}

function gamepadPicture(){
 const circle=(x,y,r,key,style="diagram-key is-bound")=>
  `<circle class="diagram-key-shadow" cx="${x}" cy="${y+3}" r="${r}"/><circle class="${style}" cx="${x}" cy="${y}" r="${r}"/>`+
  diagramText(x,y+5,key,"diagram-symbol");
 const label=(x,y,text)=>diagramText(x,y,text,"diagram-callout");
 return diagramSvg("530 290","게임패드 조작",
  "왼쪽 스틱 이동, 오른쪽 스틱 시점 회전. 방향 패드 왼쪽 퀘스트, 오른쪽 가방, 아래 상태 패널. A 또는 × 점프와 메뉴 확인, B 또는 ○ 회피와 백스텝 또는 길게 질주. Y 상호작용. LB 가드 또는 왼손, LT 전기, RB 일반 공격, RT 강공격, 길게 모아 공격. 오른쪽 스틱 누르기 대상 고정. Y와 왼쪽 또는 오른쪽 범퍼나 트리거를 눌러 해당 무기의 양손잡기 전환. 보기 버튼 거리 변경과 메뉴 뒤로. 메뉴 버튼 일시정지와 뒤로. 메뉴에서 방향 패드와 왼쪽 스틱으로 상하좌우 이동. 분류 탭은 LB와 RB로 전환. 도입부는 A, B, 메뉴 버튼으로 건너뛰기.",
  '<path class="diagram-case" d="M132 108Q145 66 204 77H326Q385 66 398 108l32 128c6 35-13 53-33 50-22-4-37-30-56-57H189c-19 27-34 53-56 57-20 3-39-15-33-50Z"/>'+
  '<path class="diagram-inlay" d="M145 105q12-30 58-24h124q46-6 58 24l26 109q-12 14-28 5l-37-38H184l-37 38q-16 9-28-5Z"/>'+
  '<path class="diagram-grip" d="M113 215q17 13 36 2l29-25-26 62q-18 28-34 20-12-8-5-59Z M417 215q-17 13-36 2l-29-25 26 62q18 28 34 20 12-8 5-59Z"/>'+
  diagramKey(137,43,58,"LT","전기")+diagramKey(335,43,58,"RT","강공격")+
  diagramKey(73,60,58,"LB","가드")+diagramKey(400,46,66,"RB","일반 공격")+
  diagramText(265,27,"RT 길게 · 모아 공격","diagram-note")+
  circle(168,133,25,"LS")+circle(307,198,25,"RS")+
  circle(372,118,15,"Y")+circle(394,141,15,"B")+circle(350,141,15,"X","diagram-key")+circle(372,164,15,"A")+
  diagramKey(215,108,28,"⧉",null,25)+diagramKey(287,108,28,"≡",null,25)+
  '<path class="diagram-key is-bound" d="M206 159h24v19h19v25h-19v20h-24v-20h-19v-25h19Z"/>'+
  diagramText(218,174,"↑","diagram-symbol")+diagramText(195,195,"←","diagram-symbol")+
  diagramText(241,195,"→","diagram-symbol")+diagramText(218,215,"↓","diagram-symbol")+
  label(88,131,"이동")+diagramLine("109,126 136,126 143,130")+
  label(86,193,"퀘스트")+diagramLine("116,188 177,188 187,191")+
  label(262,222,"가방")+diagramLine("250,192 264,192 264,207")+
  label(218,253,"상태")+diagramLine("218,224 218,237")+
  label(307,254,"시점 회전")+diagramLine("307,224 307,235")+
  label(461,114,"상호작용")+diagramLine("388,116 419,110")+
  label(470,148,"회피 · 뒤로")+diagramLine("409,141 429,141")+
  label(455,187,"점프 · 확인")+diagramLine("386,172 406,179")+
  label(458,213,"B 길게 · 질주")+
  label(227,69,"거리")+diagramLine("229,76 229,107")+
  label(292,69,"일시정지")+diagramLine("293,76 301,88 301,107"));
}
function gamepadHints(){
 const icon=(symbol,label,shape)=>`<span class="pad-icon pad-icon--${shape}" role="img" aria-label="${label}">${symbol}</span>`;
 const face=symbol=>icon(symbol,symbol+" 버튼","round");
 const stick=symbol=>icon(symbol,symbol+" 스틱","stick");
 const shoulder=symbol=>icon(symbol,symbol+" 버튼",symbol.endsWith("T")?"trigger":"shoulder");
 const view=icon("⧉","보기 버튼","center");
 const menu=icon("≡","메뉴 버튼","center");
 const dpad=icon('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 1h8v7h7v8h-7v7H8v-7H1V8h7z"/></svg>',"방향 패드","dpad");
 const keys=(...buttons)=>`<span class="pad-hint-keys">${buttons.join("")}</span>`;
 return `<dl class="pad-hints">
  <div><dt>상태 패널 열기 · 닫기</dt><dd>${keys(dpad)} 아래</dd></div>
  <div><dt>백마 부르기</dt><dd>${keys(dpad)} 위</dd></div>
  <div><dt>백마 타기 / 내리기</dt><dd>${keys(face("Y"))}</dd></div>
  <div><dt>승마 중 가속</dt><dd>${keys(shoulder("RT"))} 길게</dd></div>
  <div><dt>지도 범례 열기 / 닫기</dt><dd>${keys(face("X"))}</dd></div>
  <div><dt>이전 · 다음 분류</dt><dd>${keys(shoulder("LB"),shoulder("RB"))}</dd></div>
  <div><dt>메뉴 상하좌우 이동</dt><dd>${keys(dpad)} 또는 ${keys(stick("LS"))}</dd></div>
  <div><dt>메뉴에서 뒤로</dt><dd>${keys(view,menu,face("B"))} 중 하나</dd></div>
  <div><dt>도입부 건너뛰기</dt><dd>${keys(face("A"),face("B"),menu)} 중 하나</dd></div>
  <div><dt>대상 고정 · 해제</dt><dd>${keys(stick("RS"))} 누르기</dd></div>
  <div><dt>왼손 무기 양손잡기</dt><dd>${keys(face("Y"))}를 누른 채 ${keys(shoulder("LB"))} 또는 ${keys(shoulder("LT"))}</dd></div>
  <div><dt>오른손 무기 양손잡기</dt><dd>${keys(face("Y"))}를 누른 채 ${keys(shoulder("RB"))} 또는 ${keys(shoulder("RT"))}</dd></div>
 </dl>`;
}
function keyboardHints(){
 return '<div class="diagram-notes"><p><kbd>V</kbd> 백마 호출 / <kbd>R</kbd> 타기와 내리기</p><p><kbd>Shift</kbd> 승마 중 가속</p><p><kbd>Esc</kbd> 메뉴 뒤로 · 도입 건너뛰기</p><p><kbd>왼쪽 Shift</kbd> 회피 · 길게 질주</p><p><kbd>↑ ↓ ← →</kbd> 메뉴 선택</p><p><kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> 메뉴 포커스 이동</p><p><kbd>Ctrl</kbd> + 좌클릭 강공격 · 길게 모아 공격</p><p><kbd>Ctrl</kbd> + 우클릭 또는 <kbd>F</kbd> 전기</p><p><kbd>E</kbd> + 좌/우클릭 해당 손 양손잡기</p></div>';
}
function renderControlDiagrams(body){
 const tabs=document.createElement("div"),panel=document.createElement("div");
 tabs.className="controls-tabs";tabs.dataset.padSections="";tabs.setAttribute("role","tablist");tabs.setAttribute("aria-label","입력 장치");
 panel.id="controls-illustrations";panel.setAttribute("role","tabpanel");
 const buttons=["키보드·마우스","게임패드"].map((name,index)=>{
  const tab=menuAction(tabs,name,()=>select(index));
  tab.id="controls-tab-"+index;tab.setAttribute("role","tab");tab.setAttribute("aria-controls",panel.id);
  return tab;
 });
 function select(index){
  buttons.forEach((tab,i)=>tab.setAttribute("aria-selected",String(i===index)));
  panel.setAttribute("aria-labelledby",buttons[index].id);
  panel.className=index?"control-pad-layout":"control-keyboard-layout";
  panel.innerHTML=index?gamepadPicture()+gamepadHints():keyboardPicture()+keyboardPicture(true)+
   '<div class="diagram-secondary">'+mousePicture()+keyboardHints()+'</div>';
 }
 body.append(tabs,panel);select(0);buttons[0].focus();
}
