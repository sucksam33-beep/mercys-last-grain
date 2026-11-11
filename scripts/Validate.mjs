import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = join(root, 'docs', 'FILE-MANIFEST.json');
const excluded = new Set(['.git', '.build', 'dist', 'node_modules']);
async function walk(dir) {
 const result = [];
 for (const entry of await readdir(dir, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  const full = join(dir, entry.name);
  if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${full}`);
  if (entry.isDirectory()) result.push(...await walk(full));
  else if (entry.isFile() && full !== manifestPath) result.push(full);
 }
 return result;
}
async function digest(path) {
 const hash = createHash('sha256');
 for await (const chunk of createReadStream(path)) hash.update(chunk);
 return hash.digest('hex');
}
const required = ['game/index.html', 'game/desktop.html', 'game/program-only.flag', 'game/vendor/three/LICENSE', 'src/GameWindow.cs', 'src/ContentUpdates.cs', 'src/LauncherUpdates.cs', 'branding/MercysLastGrain.ico'];
for (const path of required) await stat(join(root, path));
const files = [];
for (const full of (await walk(root)).sort()) {
 const path = relative(root, full).replaceAll('\\', '/');
 const info = await stat(full);
 if (info.size > 0 && info.size < 1024) {
  const head = await readFile(full, 'utf8');
  if (head.startsWith('version https://git-lfs.github.com/spec/v1\n')) throw new Error(`Run git lfs pull: ${path}`);
 }
 files.push({ path, size: info.size, sha256: await digest(full) });
}
if (process.argv.includes('--write-manifest')) {
 await writeFile(manifestPath, JSON.stringify({ schema: 1, snapshotDate: '2026-11-12', files }, null, 2) + '\n');
 console.log(`Manifest written: ${files.length} files, ${files.reduce((n,f)=>n+f.size,0)} bytes`);
} else {
 const expected = JSON.parse(await readFile(manifestPath, 'utf8'));
 const actual = new Map(files.map(f => [f.path, f]));
 const failures = [];
 for (const file of expected.files) {
  const found = actual.get(file.path);
  if (!found || found.size !== file.size || found.sha256 !== file.sha256) failures.push(file.path);
 }
 const expectedPaths = new Set(expected.files.map(f => f.path));
 for (const file of files) if (!expectedPaths.has(file.path)) failures.push(`Unrecorded: ${file.path}`);
 if (failures.length) throw new Error(`Manifest mismatch:\n${failures.join('\n')}`);
 console.log(`Verified ${files.length} files; SHA-256 and LFS assets OK.`);
}
