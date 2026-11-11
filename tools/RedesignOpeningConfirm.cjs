const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const stage=path.join(__dirname,"dialogue-opening-stage","game");
const index=path.join(stage,"index.html"),css=path.join(stage,"intro.css");
let html=fs.readFileSync(index,"utf8");
const old=`<h2 id="opening-confirm-question">영상을 스킵 하시겠습니까?</h2>
 <div class="opening-confirm-actions">
  <button id="opening-confirm-yes" type="button">예</button>
  <button id="opening-confirm-no" type="button" autofocus>아니오</button>
 </div>`;
assert.ok(html.includes(old));
html=html.replace(old,`<div class="opening-confirm-mark" aria-hidden="true"><span></span></div>
 <h2 id="opening-confirm-question">영상을 스킵 하시겠습니까?</h2>
 <p class="opening-confirm-note">영상은 현재 장면에서 일시정지되었습니다.</p>
 <div class="opening-confirm-actions">
  <button id="opening-confirm-no" type="button" autofocus><span>아니오</span><span class="opening-confirm-shortcut"><kbd>Esc</kbd><kbd>B</kbd></span></button>
  <button id="opening-confirm-yes" type="button"><span>예, 건너뛰기</span><span class="opening-confirm-shortcut"><kbd>Enter</kbd><kbd>A</kbd></span></button>
 </div>`).replace('intro.css?v=opening-confirm','intro.css?v=opening-confirm-design');
let style=fs.readFileSync(css,"utf8");
const start=style.indexOf("dialog.opening-confirm {"),end=style.indexOf(".playing-opening",start);
assert.ok(start>=0&&end>start);
style=style.slice(0,start)+`#opening-confirm {
  width: min(34rem, calc(100% - 2rem));
  max-width: none;
  padding: clamp(22px, 4vw, 42px);
  border: 1px solid #a48656;
  border-radius: 6px;
  color: #f6ebd7;
  background: radial-gradient(ellipse at 50% 0%, #443322 0%, transparent 63%),
    linear-gradient(145deg, #241d16, #131412 86%);
  box-shadow: inset 0 0 0 5px #171512, inset 0 0 0 6px #ac8a533e,
    0 20px 80px #080705bc;
  text-align: center;
}
#opening-confirm::backdrop {
  background: radial-gradient(ellipse at center, #08070540, #0807059c);
  backdrop-filter: blur(2px);
}
.opening-confirm-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 22px;
  color: #d9b477;
}
.opening-confirm-mark::before, .opening-confirm-mark::after {
  content: "";
  width: 57px;
  height: 1px;
  background: linear-gradient(90deg, transparent, currentColor);
}
.opening-confirm-mark::after { transform: scaleX(-1) }
.opening-confirm-mark span {
  display: grid;
  place-items: center;
  width: 33px;
  aspect-ratio: 1;
  border: 1px solid #ac8955;
  transform: rotate(45deg);
}
.opening-confirm-mark span::before {
  content: "";
  width: 10px;
  height: 12px;
  border-inline: 3px solid currentColor;
  transform: rotate(-45deg);
}
#opening-confirm h2 {
  margin: 0;
  font: 700 clamp(20px, 3.5vw, 31px)/1.35 "Hanyang Batang", Batang, "Malgun Gothic", serif;
  letter-spacing: -.045em;
}
.opening-confirm-note { margin: 10px 0 26px; color: #c5b39b; font-size: 13px }
.opening-confirm-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px }
#opening-confirm button {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 7px;
  min-height: 67px;
  padding: 8px 5px;
  border: 1px solid #7f6848;
  border-radius: 4px;
  color: #f2dfbc;
  background: #191713;
  font-weight: 650;
}
#opening-confirm button:hover, #opening-confirm button:focus-visible {
  border-color: #f3cc87;
  outline: 2px solid #d5ac69;
  outline-offset: 2px;
}
#opening-confirm-yes { --shortcut-line: #594122; --shortcut-ink: #2c2012 }
#opening-confirm #opening-confirm-yes {
  background: linear-gradient(#e2bd7f, #bc9050);
  color: #24190e;
}
.opening-confirm-shortcut { display: flex; gap: 5px; justify-content: center }
.opening-confirm-shortcut kbd {
  min-width: 21px;
  padding: 1px 4px;
  border: 1px solid var(--shortcut-line, #7f6848);
  border-radius: 3px;
  color: var(--shortcut-ink, #d4bd93);
  font: 600 10px/1.35 system-ui, sans-serif;
}
`+style.slice(end);
fs.writeFileSync(index,html);fs.writeFileSync(css,style);
