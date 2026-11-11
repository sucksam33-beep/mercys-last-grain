const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.join(__dirname,"still-cinematic"), output=path.join(root,"Mercys-Last-Grain-Opening.mp4");
const scenes=[
 {start:0,caption:[[2.1,7.7,"공동 창고는 비어 있었다."],[8.1,12.6,"이레나는 등잔불을 낮췄다."]]},
 {start:13,caption:[[15.0,22.1,"마른 논둑을 따라 삼나무 묘지로 향했다."]]},
 {start:26,caption:[[28.6,34.7,"겐조가 손으로 등잔불을 가렸다."],[35.0,39.3,"겐조  ·  저 항아리다."]]},
 {start:40,caption:[[42.5,49.8,"묘석 사이에 숨겨 둔 씨앗 항아리를 들어 올렸다."]]},
 {start:51,caption:[[54.1,61.3,"이레나와 함께 수문 옆 제방을 건넜다."]]},
 {start:64,caption:[[66.4,70.6,"씨앗은 공동 창고로 돌아왔다."],[71.1,74.7,"아이  ·  이제 심을 수 있어요?"],[75.1,79.8,"이레나  ·  응. 봄까지 지켜야지."]]},
 {start:80,caption:[[81.5,85.9,"주인공은 창고 앞 초소로 나섰다."]]}
];
const length=92;
(async()=>{
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--enable-gpu","--use-angle=d3d11","--disable-background-timer-throttling"]});
 try{
  const page=await browser.newPage({viewport:{width:960,height:540}});
  await page.route("https://opening.local/**",route=>{
   const file=new URL(route.request().url()).pathname.slice(1);
   if(file==="index.html")return route.fulfill({body:"<!doctype html><meta charset=utf-8><body style='margin:0;background:#000'><canvas id='film' width='1920' height='1080' style='width:100vw;display:block'></canvas></body>",contentType:"text/html"});
   if(!/^\d\d\.jpg$/.test(file))return route.abort();
   return route.fulfill({path:path.join(root,file),contentType:"image/jpeg"});
  });
  await page.goto("https://opening.local/index.html");
  fs.writeFileSync(output,"");
  await page.exposeFunction("writeFilmChunk",encoded=>{fs.appendFileSync(output,Buffer.from(encoded,"base64"));});
  await page.exposeFunction("filmProgress",sec=>console.log("Encoded",sec+"s"));
  await page.evaluate(async({scenes,length})=>{
   const images=await Promise.all(scenes.map((_,index)=>new Promise((ok,fail)=>{
    const image=new Image();image.onload=()=>ok(image);image.onerror=fail;
    image.src=String(index+1).padStart(2,"0")+".jpg";
   })));
   await document.fonts.load('500 42px "Malgun Gothic"',"씨앗");
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
    let i=scenes.length-1;
    while(t<scenes[i].start)i--;
    still(i,t);
    const fade=(t-scenes[i].start)/.7;
    if(i&&fade<1)still(i-1,t,1-fade*fade*(3-2*fade));
    const captions=scenes[i].caption.find(([a,b])=>t>=a&&t<b);
    if(captions){
     const fade=Math.min(1,(t-captions[0])*7,(captions[1]-t)*7);
     const shade=ctx.createLinearGradient(0,height*.72,0,height);
     shade.addColorStop(0,"transparent");shade.addColorStop(1,"rgba(10,10,9,.77)");
     ctx.globalAlpha=fade;ctx.fillStyle=shade;ctx.fillRect(0,height*.72,width,height*.28);
     ctx.font='500 43px "Malgun Gothic", sans-serif';ctx.textAlign="center";ctx.textBaseline="middle";
     ctx.shadowColor="rgba(0,0,0,.9)";ctx.shadowBlur=11;ctx.fillStyle="#f6ecda";
     ctx.fillText(captions[2],width*.5,height*.895);
     ctx.shadowBlur=0;ctx.globalAlpha=1;
    }
    if(t>=86.3){
     const f=Math.min(1,(t-86.3)/1.25);
     ctx.fillStyle="rgba(13,14,15,"+(.47*f)+")";ctx.fillRect(0,0,width,height);
     ctx.globalAlpha=f;
     ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold 90px Georgia, serif";
     ctx.shadowColor="#050505";ctx.shadowBlur=18;ctx.fillStyle="#f2e8d5";
     ctx.fillText("Mercy’s Last Grain",width*.5,height*.48);
     ctx.shadowBlur=0;ctx.globalAlpha=1;
    }
    const black=Math.max(0,1-t/.55,(t-(length-1))/(1));
    if(black>0){ctx.fillStyle="rgba(0,0,0,"+Math.min(1,black)+")";ctx.fillRect(0,0,width,height);}
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
  },{scenes,length});
  assert.ok(fs.statSync(output).size>200000,"encoded film has no media");
  console.log("Encoded file:",output,fs.statSync(output).size);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});