const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const {chromium}=require(process.env.USERPROFILE+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=__dirname,game=path.join(root,"game"),out=path.join(root,"trellis-86-review");
const ref=path.join(root,"mercy-185-textured-references");
const rows=JSON.parse(fs.readFileSync(path.join(out,"results.json"),"utf8"));
const c=vm.createContext({});
for(const file of ["Timber.js","WeaponCatalogue.js","CraftingData.js","InventoryData.js","RegionalFoodData.js"])vm.runInContext(fs.readFileSync(path.join(game,file),"utf8"),c);
const oldIcons=vm.runInContext(`Object.fromEntries([...Object.values(CraftingData.items),...inventoryEntries,...regionalDishes,...regionalIngredients].map(x=>[x.id,x.icon]))`,c);
const oldRenderer=fs.readFileSync(path.join(root,"RenderFalIntegrationReview.cjs"),"utf8");
const preview=oldRenderer.match(/const preview=String.raw\x60([\s\S]+?)\x60;/)[1]
 .replace('const png=renderer.domElement.toDataURL("image/png").split(",")[1];',`const icon=document.createElement("canvas");
 icon.width=icon.height=320;
 const ctx=icon.getContext("2d",{willReadFrequently:true});
 ctx.drawImage(renderer.domElement,0,0);
 const pixels=ctx.getImageData(0,0,320,320).data;
 let left=320,top=320,right=-1,bottom=-1;
 for(let y=0;y<320;y++)for(let x=0;x<320;x++){
  if(pixels[(y*320+x)*4+3]<24)continue;
  left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
 }
 if(right<left||bottom<top)throw Error("No visible pixels");
 const width=right-left+1,height=bottom-top+1,fit=282/Math.max(width,height);
 ctx.clearRect(0,0,320,320);
 ctx.imageSmoothingQuality="high";
 ctx.drawImage(renderer.domElement,left,top,width,height,(320-width*fit)/2,(320-height*fit)/2,width*fit,height*fit);
 const png=icon.toDataURL("image/png").split(",")[1];`)
 .replace("return png;",`let triangles=0;
 model.traverse(x=>{if(x.isMesh)triangles+=(x.geometry.index?.count??x.geometry.attributes.position.count)/3});
 if(!triangles)throw Error("Empty triangle count");
 return {png,triangles,size:size.toArray()};`);
function checkGlb(file){
 const bytes=fs.readFileSync(file);
 assert.ok(bytes.length>20&&bytes.readUInt32LE(0)===0x46546c67&&bytes.readUInt32LE(4)===2&&bytes.readUInt32LE(8)===bytes.length,"Bad GLB header");
 assert.equal(bytes.readUInt32LE(16),0x4e4f534a);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString("utf8").trim());
 assert.ok([...(json.images??[]),...(json.buffers??[])].every(x=>!x.uri||x.uri.startsWith("data:")),"GLB needs external resources");
 return bytes.length;
}
(async()=>{
 const types={".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",".html":"text/html",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".glb":"model/gltf-binary"};
 for(const folder of ["before","model-renders"])fs.mkdirSync(path.join(out,folder),{recursive:true});
 for(const folder of ["priority-models","priority-icons"])fs.mkdirSync(path.join(game,"assets",folder),{recursive:true});
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--disable-gpu-shader-disk-cache"]});
 try{
  const page=await browser.newPage();
  await page.route("https://fal-review.local/**",route=>{
   const pathname=new URL(route.request().url()).pathname;
   if(pathname==="/")return route.fulfill({contentType:"text/html",body:'<!doctype html><script type="module" src="/preview.mjs"></script>'});
   if(pathname==="/preview.mjs")return route.fulfill({contentType:"text/javascript",body:preview});
   const file=path.join(game,decodeURIComponent(pathname));
   return route.fulfill({path:file,contentType:types[path.extname(file)]??"application/octet-stream"});
  });
  await page.goto("https://fal-review.local/");await page.waitForFunction(()=>typeof window.preview==="function");
  for(const row of rows){
   const key=String(row.number).padStart(3,"0"),old=oldIcons[row.id],fallback="assets/crafting/"+vm.runInContext("CraftingData.artKey("+JSON.stringify(row.id)+")",c)+".webp";
   const before=[old,fallback].filter(Boolean).map(file=>path.join(game,file)).find(file=>fs.existsSync(file));
   const source=before??path.join(ref,row.png);
   row.before="before/"+key+path.extname(source);row.beforeType=before?"기존 게임 아이콘":"Trellis 입력 원화";
   fs.copyFileSync(source,path.join(out,row.before));
   if(!row.url)continue;
   const model="assets/priority-models/"+key+".glb";
   try{
    row.bytes=checkGlb(path.join(game,model));
    const info=await page.evaluate(row=>window.preview(row),{...row,model});
    row.triangles=info.triangles;row.bounds=info.size;
    const png=Buffer.from(info.png,"base64");
    row.preview="model-renders/"+key+".png";
    row.icon="assets/priority-icons/"+key+".png";row.model=model;
    fs.writeFileSync(path.join(out,row.preview),png);
    fs.writeFileSync(path.join(game,row.icon),png);
   }catch(error){row.integrationError=error.message;}
   if(row.rank%10===0)console.log("rendered through",row.rank);
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,"results.json"),JSON.stringify(rows,null,2));
 console.log(JSON.stringify({requested:rows.length,applied:rows.filter(r=>r.preview).length,errors:rows.filter(r=>!r.preview).map(r=>[r.name,r.integrationError??r.generationError])}));
})().catch(error=>{console.error(error);process.exitCode=1;});