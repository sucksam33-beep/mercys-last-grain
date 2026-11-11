const fs=require("node:fs"),path=require("node:path"),{execFileSync}=require("node:child_process");
const stage=path.join(__dirname,"architecture-stage");
const live=path.join(__dirname,"game/index.html"),base=path.join(stage,"baseline/index.html"),staged=path.join(stage,"game/index.html");
const merged=execFileSync("git",["merge-file","-p",live,base,staged],{maxBuffer:16*1024*1024});
fs.writeFileSync(staged,merged);
fs.copyFileSync(live,base);
