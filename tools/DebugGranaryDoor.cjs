const fs=require("node:fs"),path=require("node:path");
const p=path.join(__dirname,"reference-architecture-native.cjs");
let src=fs.readFileSync(p,"utf8");
src=src.replace('const inside=player.y;', `const inside=player.y;
    const y0=playerSupport(),probe=inside-.12;
    const solids=(sceneryCells.get(Math.floor(player.x/cellSize)+","+Math.floor(probe/cellSize))??[]).filter(p=>Math.abs(p.x-player.x)<p.w*.5+.31&&Math.abs(p.z-probe)<p.d*.5+.31).map(p=>({...p,active:p.active?.(),top:typeof p.top==="function"?p.top(player.x,probe):p.top}));
    const doorDebug={id,doors:s.openDoors,y0,terrain:terrainSurface(player.x,probe),support:supportAt(player.x,probe,y0),solids};`);
src=src.replace('return {front,stopped,opened,inside,exited,level,peak,airY,landed:', 'return {front,stopped,opened,inside,exited,level,peak,airY,doorDebug,landed:').replace("9801:9800","9804:9800");
fs.writeFileSync(path.join(__dirname,"granary-door-native.cjs"),src);
