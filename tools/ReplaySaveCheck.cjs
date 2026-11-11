const vm=require("node:vm"),fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=__dirname,live=path.join(root,"game","index.html");
const source=fs.readFileSync(live,"utf8");
const start=source.indexOf("function makeSave(){"),end=source.indexOf("function autosave(){",start);
assert.ok(start>=0&&end>start);
const replacement=`function makeSave(){
 const replay=window.soilOpening?.previous;
 const view=replay??{player,heading,pitch,zoom,facing};
 return {version:1,savedAt:Date.now(),state:replay?{...s,hour:replay.hour}:s,
  location:{...view.player,heading:view.heading,pitch:view.pitch,zoom:view.zoom,facing:view.facing}};
}
`;
const scope={s:{hour:17.15,day:9},window:{soilOpening:{previous:{hour:22,player:{x:84,y:130},heading:1,pitch:.2,zoom:7,facing:2}}},player:{x:309,y:348},heading:0,pitch:.1,zoom:4.4,facing:0};
const old=vm.runInNewContext(source.slice(start,end)+"makeSave()",scope);
assert.equal(old.location.x,309);assert.equal(old.state.hour,17.15);
const replay=vm.runInNewContext(replacement+"makeSave()",scope);
assert.equal(replay.state.hour,22);assert.equal(replay.location.x,84);assert.equal(replay.location.facing,2);assert.equal(scope.s.hour,17.15);
scope.window.soilOpening=null;
const normal=vm.runInNewContext(replacement+"makeSave()",scope);
assert.equal(normal.state.hour,17.15);assert.equal(normal.location.x,309);
fs.writeFileSync(path.join(root,"campaign-play-stage","index-replay-check.tmp"),source.slice(0,start)+replacement+source.slice(end));
console.log("Reproduced replay save corruption and verified original location/time survive the fix.");
