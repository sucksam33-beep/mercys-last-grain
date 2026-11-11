const fs=require("node:fs"),path=require("node:path");
const game=process.argv[2];
const title="Mercy\u2019s Last Grain",tagline="The year we won, the harvest failed.";
function edit(file,fn){
 const p=path.join(game,file),s=fs.readFileSync(p,"utf8").replace(/\r\n/g,"\n");
 fs.writeFileSync(p,fn(s));
}
for(const file of ["index.html","desktop.html","QuestMap.js","SoilOpening.mjs","WinterFinale.js"]){
 edit(file,s=>s.replaceAll("왕이 먹는 흙",title));
}
edit("desktop.html",s=>s
 .replace('href="asagi-title.jpg"','href="mercy-granary.jpg"')
 .replace('  <div class="eyebrow">아르벤 강 합류부 <span></span> 브뤼넨</div>\n','')
 .replace('<header class="title-heading">','<header class="title-heading" aria-labelledby="official-title">')
 .replace('<h1>'+title+'</h1>','<h1 id="official-title" lang="en">'+title+'</h1>\n  <p class="title-tagline" lang="en">'+tagline+'</p>')
 .replace('aria-label="타이틀 메뉴"','aria-label="'+title+'"')
 .replace('>이어하기<small','>계속하기<small'));
edit("desktop.css",s=>s
 .replace('url("asagi-title.jpg")','url("mercy-granary.jpg")')
 .replace('background:#1b2626','background:#181918')
 +`
.title-page{background-position:64% center}
.title-page::before,.desktop-loading-cover::before{
 background:linear-gradient(90deg,#151615ed 0%,#181918c2 30%,#1a1b185c 57%,transparent 78%),
 linear-gradient(0deg,#11110fb3,transparent 28%);
}
.title-shell{width:min(630px,calc(100vw - clamp(42px,7.4vw,165px) - 26px));padding-top:clamp(44px,13vh,140px)}
.title-heading{display:block}
.title-heading h1{
 font-family:Georgia,"Times New Roman",serif;font-size:clamp(38px,5.65vw,91px);
 font-weight:700;letter-spacing:-.048em;line-height:1.03;white-space:normal;color:#f2e9d6;
}
.title-tagline{
 font:italic clamp(15px,2.1vw,26px)/1.4 Georgia,"Times New Roman",serif;
 margin:.65em 0 0;color:#eadcc1;letter-spacing:.005em;
}
@media(max-width:640px){
 .title-page{background-position:62% center}
 .title-page::before{background:linear-gradient(90deg,#131413ef,#17171595 72%,#18171362)}
 .title-shell{width:auto;margin:0;padding:clamp(28px,9vh,66px) 25px 56px}
 .title-heading h1{font-size:clamp(37px,9vw,57px)}
 .title-page footer{margin-left:25px}
}
@media(max-height:690px) and (min-width:641px){.title-shell{padding-top:32px}}
`);
edit("GameMenu.js",s=>s
 .replace('const body=modal("일시정지","게임 메뉴");','const body=modal("일시정지","'+title+'");')
 .replace('const body=modal("게임 메뉴",title);','const body=modal("'+title+'",title);'));
edit("index.html",s=>s.replace('RETURNING WATERS · 3D OPEN WORLD','3D 오픈월드'));
const win=path.join(game,"GameWindow.Mercy.cs");
fs.writeFileSync(win,fs.readFileSync(path.join(path.dirname(game),"GameWindow.cs"),"utf8").replaceAll("왕이 먹는 흙",title));
