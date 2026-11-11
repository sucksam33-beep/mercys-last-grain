const regionalMusic = (() => {
 const tracks = ["asagi", "brunnen", "santa-lucia", "juniperwell", "beaverton", "saint-aurel", "ambaro", "karuk"].map(name => {
  const audio = new Audio("assets/music/" + name + ".mp3");
  audio.preload = "none";
  audio.loop = true;
  audio.volume = 0;
  return audio;
 });
 const volumeKey = "returning-waters-music-volume";
 const minVolume = 5;
 function clampVolume(value) {
  return Number.isFinite(value) ? Math.max(minVolume, Math.min(100, value)) : 40;
 }
 let volume = 40;
 try { volume = clampVolume(Number(localStorage.getItem(volumeKey) ?? volume)); } catch {}
 const gains = tracks.map(() => 0);
 function applyVolume() {
  tracks.forEach((track, index) => { track.volume = gains[index] * volume / 100; });
 }
 const fadeDuration = 1000;
 let active = null;
 let frame = 0;

 function playActive() {
  if (active?.paused) active.play().catch(() => {});
 }

 // Chromium may require a gesture before allowing audible playback.
 window.addEventListener("pointerup", playActive, true);
 window.addEventListener("keydown", playActive, true);

 function select(region) {
  const next = tracks[region] ?? null;
  if (next === active) return;
  active = next;
  playActive();
  cancelAnimationFrame(frame);

  const from = gains.slice();
  const start = performance.now();
  function fade(now) {
   const progress = Math.max(0, Math.min(1, (now - start) / fadeDuration));
   tracks.forEach((track, index) => {
    const target = track === active ? 1 : 0;
    gains[index] = from[index] + (target - from[index]) * progress;
    if (progress === 1 && track !== active) track.pause();
   });
   applyVolume();
   if (progress < 1) frame = requestAnimationFrame(fade);
  }
  frame = requestAnimationFrame(fade);
 }
 return {
  select,
  minVolume,
  get volume() { return volume; },
  set volume(value) {
   volume = clampVolume(value);
   applyVolume();
   try { localStorage.setItem(volumeKey, String(volume)); } catch {}
  }
 };
})();
