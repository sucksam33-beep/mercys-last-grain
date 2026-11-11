const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.resolve(process.env.OPENING_FRAME_DIR??path.join(__dirname,"dialogue-cinematic")),output=path.join(root,"Mercys-Last-Grain-Opening-Dialogue.mp4");
const scenes=[{"shot":"01","start":0,"duration":9.6,"speaker":"이레나","lines":["군량 수레가 창고의 볏섬을 다 실어 갔어요.","남은 쌀은 오늘 밤 나눌 죽 한 솥 분량이에요."]},{"shot":"02","start":9.6,"duration":7.8,"speaker":"아이","lines":["전쟁에서 이겼다면서요.","그럼 왜 어제보다 죽이 더 묽어요?"]},{"shot":"03","start":17.4,"duration":8.6,"speaker":"월터","lines":["돌아오는 길에 빈 수레만 봤습니다.","그럼 내년에 심을 쌀까지 가져간 겁니까?"]},{"shot":"04","start":26,"duration":9.4,"speaker":"겐조","lines":["볍씨 한 항아리는 따로 남겼어.","삼나무 묘지, 키 낮은 묘석 아래에 숨겨 뒀다."]},{"shot":"05","start":35.4,"duration":8.7,"speaker":"겐조","lines":["등잔을 낮춰. 저 위 제방에서 불빛을 보면","순찰이 묘지까지 올라올 거다."]},{"shot":"06","start":44.1,"duration":7,"speaker":"겐조","lines":["저 항아리다.","천이 젖지 않았는지 먼저 봐라."]},{"shot":"07","start":51.1,"duration":9.6,"speaker":"이레나","lines":["저걸 풀어 죽을 끓이면 오늘은 더 먹을 수 있죠.","그런데 봄에 뿌릴 볍씨는 저게 전부예요."]},{"shot":"08","start":60.7,"duration":8,"speaker":"월터","lines":["천은 말랐고 끈도 그대로입니다.","제가 들겠습니다. 돌아가는 길을 열어 주세요."]},{"shot":"09","start":68.7,"duration":9.4,"speaker":"갑문지기","lines":["큰길은 제방 위에서 다 보여요.","수문 옆 낮은 둑을 따라가면 창고 뒤로 들어갈 수 있어요."]},{"shot":"10","start":78.1,"duration":8.8,"speaker":"이레나","lines":["물소리가 큰 데로 붙어요.","제가 먼저 건널 테니, 항아리는 가슴에 꼭 안고 따라와요."]},{"shot":"11","start":86.9,"duration":8.7,"speaker":"겐조","lines":["저 불 두 점 보이지? 순찰이 돌아오는 거야.","창고에 닿으면 문 앞에 사람을 세워 둬야 해."]},{"shot":"12","start":95.6,"duration":8.4,"speaker":"월터","lines":["항아리부터 선반에 올려 주세요.","제방 쪽에서 누가 오면 제가 먼저 보겠습니다."]},{"shot":"13","start":104,"duration":5.9,"speaker":"아이","lines":["이제 심을 수 있어요?"]},{"shot":"14","start":109.9,"duration":9.7,"speaker":"이레나","lines":["응. 봄까지 지켜야지.","지금은 땅이 얼었어. 해빙이 올 때까지 이 선반에 둘 거야."]},{"shot":"15","start":119.6,"duration":8,"speaker":"아이","lines":["그럼 제가 안에서 등잔을 볼게요.","기름이 다하면 바로 알려 드릴게요."]},{"shot":"16","start":127.6,"duration":8.2,"speaker":"월터","lines":["등잔은 문에서 보이지 않게 둬.","나는 창고 앞 초소에 있을게."]}];
const titleStart=135.8,length=141.8;
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--enable-gpu","--use-angle=d3d11","--disable-background-timer-throttling"]});
 try{
  const page=await browser.newPage({viewport:{width:960,height:540}});
  await page.route("https://opening.local/**",route=>{
   const file=new URL(route.request().url()).pathname.slice(1);
   if(file==="index.html")return route.fulfill({body:"<!doctype html><meta charset=utf-8><body style='margin:0;background:#000'><canvas id='film' width='1920' height='1080' style='width:100vw;display:block'></canvas></body>",contentType:"text/html"});
   const fontFiles={"dialogue.ttf":"HANBatang.ttf","speaker.ttf":"HANBatangB.ttf","title.ttf":"GARA.TTF"};
   if(Object.hasOwn(fontFiles,file))return route.fulfill({path:path.join(process.env.WINDIR,"Fonts",fontFiles[file]),contentType:"font/ttf"});
   if(!/^\d\d\.jpg$/.test(file))return route.abort();
   return route.fulfill({path:path.join(root,file),contentType:"image/jpeg"});
  });
  await page.goto("https://opening.local/index.html");
  fs.writeFileSync(output,"");
  await page.exposeFunction("writeFilmChunk",encoded=>{fs.appendFileSync(output,Buffer.from(encoded,"base64"));});
  await page.exposeFunction("filmProgress",sec=>console.log("Encoded",sec+"s"));
  await page.evaluate(async({scenes,titleStart,length})=>{
   const images=await Promise.all(scenes.map((_,index)=>new Promise((ok,fail)=>{
    const image=new Image();image.onload=()=>ok(image);image.onerror=fail;
    image.src=String(index+1).padStart(2,"0")+".jpg";
   })));
   const fonts=await Promise.all([
    new FontFace("FilmDialogue","url(/dialogue.ttf)").load(),
    new FontFace("FilmSpeaker","url(/speaker.ttf)").load(),
    new FontFace("FilmTitle","url(/title.ttf)").load(),
   ]);
   fonts.forEach(font=>document.fonts.add(font));
   const canvas=document.getElementById("film"),ctx=canvas.getContext("2d",{alpha:false});
   const [width,height]=[canvas.width,canvas.height];
   function still(i,t,alpha=1){
    const img=images[i],start=scenes[i].start,end=scenes[i+1]?.start??length;
    const p=Math.max(0,Math.min(1,(t-start)/(end-start)));
    const zoom=1.015+p*.047;
    const scale=Math.max(width/img.width,height/img.height)*zoom;
    const w=img.width*scale,h=img.height*scale;
    ctx.globalAlpha=alpha;
    ctx.drawImage(img,(width-w)*(.5+(i%2?-.1:.1)*p),(height-h)*(.50+(i%2?.05:-.05)*p),w,h);
    ctx.globalAlpha=1;
   }
   function frame(t){
    if(t>=titleStart){
     ctx.fillStyle="#101412";ctx.fillRect(0,0,width,height);
     const fade=Math.min(1,(t-titleStart)/1.1,(length-t)/.80);
     ctx.globalAlpha=Math.max(0,fade);
     ctx.textAlign="center";ctx.textBaseline="middle";
     ctx.font="116px FilmTitle";ctx.letterSpacing="2px";ctx.fillStyle="#f2e8d5";
     ctx.fillText("Mercy’s Last Grain",width*.5,height*.48);
     ctx.letterSpacing="0px";
     ctx.fillStyle="#ae8b56";ctx.fillRect(width*.5-64,height*.565,128,1.5);
     ctx.globalAlpha=1;
     return;
    }
    let i=scenes.length-1;
    while(t<scenes[i].start)i--;
    const shot=scenes[i];
    still(i,t);
    const a=Math.min(1,(t-shot.start)*8);
    const lineHeight=44;
    const base=height*.912-(shot.lines.length-1)*lineHeight;
    const nameY=base-50;
    ctx.globalAlpha=a;
    const shade=ctx.createLinearGradient(0,height*.60,0,height);
    shade.addColorStop(0,"transparent");
    shade.addColorStop(.58,"rgba(8,9,8,.54)");
    shade.addColorStop(1,"rgba(8,9,8,.88)");
    ctx.fillStyle=shade;ctx.fillRect(0,height*.60,width,height*.40);
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font="24px FilmSpeaker";
    ctx.letterSpacing="3.5px";
    const halfName=ctx.measureText(shot.speaker).width*.5;
    const left=width*.5-halfName-20,right=width*.5+halfName+20;
    ctx.fillStyle="#ae8b56";
    ctx.fillRect(left-43,nameY,43,1.5);
    ctx.fillRect(right,nameY,43,1.5);
    ctx.shadowColor="#090907";ctx.shadowBlur=9;
    ctx.fillStyle="#efcc8e";ctx.fillText(shot.speaker,width*.5,nameY);
    ctx.letterSpacing="0px";
    ctx.font="36px FilmDialogue";
    ctx.fillStyle="#fff2df";
    ctx.strokeStyle="rgba(13,11,8,.87)";ctx.lineWidth=2;ctx.lineJoin="round";
    shot.lines.forEach((line,lineIndex)=>{
     const y=base+lineIndex*lineHeight;
     ctx.strokeText(line,width*.5,y,width*.86);
     ctx.fillText(line,width*.5,y,width*.86);
    });
    ctx.shadowBlur=0;ctx.globalAlpha=1;
    const black=Math.max(0,1-t/.55);
    if(black){ctx.fillStyle="rgba(0,0,0,"+black+")";ctx.fillRect(0,0,width,height);}
   }
   frame(0);
   const stream=canvas.captureStream(24);
   const mime="video/mp4;codecs=avc1.640028";
   if(!MediaRecorder.isTypeSupported(mime))throw Error("H.264 encoder unavailable");
   const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:13_000_000});
   let writes=Promise.resolve();
   recorder.ondataavailable=event=>{
    if(!event.data.size)return;
    writes=writes.then(async()=>{
     const payload=await new Promise((ok,fail)=>{
      const reader=new FileReader();reader.onload=()=>ok(reader.result.split(",")[1]);reader.onerror=fail;
      reader.readAsDataURL(event.data);
     });
     await window.writeFilmChunk(payload);
    });
   };
   await new Promise((resolve,reject)=>{
    recorder.onerror=e=>reject(e.error);
    recorder.onstop=()=>writes.then(resolve,reject);
    recorder.start(900);
    const start=performance.now();
    let last=-1,report=0;
    const tick=now=>{
     const time=Math.max(0,(now-start)/1000),i=Math.floor(time*24);
     if(i!==last){frame(Math.min(length,time));last=i;}
     if(time>=length){recorder.stop();return;}
     if(time>=report+20){report+=20;window.filmProgress(report);}
     requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
   });
   stream.getTracks().forEach(track=>track.stop());
  },{scenes,titleStart,length});
  assert.ok(fs.statSync(output).size>200000,"encoded film has no media");
  console.log("Encoded file:",output,fs.statSync(output).size);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});