// Talking Cast (red panda): three art frames that differ only in the mouth (closed / half / open,
// mouth patched onto the closed still), picked by the playing clip's loudness, plus a bob.
// talker(canvas, audio) draws until the canvas leaves the DOM; resolves to the art's background colour.
const FRAMES = ['talk/redpanda-closed.png', 'talk/redpanda-half-m.png', 'talk/redpanda-open-m.png'];
const CROP = [60, 420];                                  // source y, height: head + shoulders
const imgs = FRAMES.map((src) => Object.assign(new Image(), { src }));
const ready = Promise.all(imgs.map((i) => i.decode()));
const envs = new Map();

export function envelope(src) {
  if (envs.has(src)) return envs.get(src);
  const p = (async () => {
    const ac = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
    const ab = await ac.decodeAudioData(await (await fetch(src)).arrayBuffer());
    const d = ab.getChannelData(0), win = Math.round(ab.sampleRate * 0.02), out = [];
    for (let s = 0; s < d.length; s += win) { let e = 0; for (let k = s; k < s + win && k < d.length; k++) e += d[k] * d[k]; out.push(Math.sqrt(e / win)); }
    const max = Math.max(...out) || 1;
    return out.map((v) => Math.min(1, (v / max) * 1.3));
  })();
  envs.set(src, p);
  return p;
}

export async function talker(cv, audio) {
  await ready;
  const [sy, sh] = CROP, W = imgs[0].naturalWidth;
  cv.width = W; cv.height = sh;
  const g = cv.getContext('2d', { willReadFrequently: true });
  const draw = (i) => g.drawImage(imgs[i], 0, sy, W, sh, 0, 0, W, sh);
  draw(0);
  const c = g.getImageData(4, 4, 1, 1).data, bg = `rgb(${c[0]},${c[1]},${c[2]})`;
  let env = null, level = 0, shown = 0;
  const onPlay = async () => { env = null; env = await envelope(audio.src); };
  audio.addEventListener('play', onPlay);
  if (!audio.paused) onPlay();

  const tick = (t) => {
    if (!cv.isConnected) { audio.removeEventListener('play', onPlay); return; }
    const target = env && !audio.paused && !audio.ended ? env[Math.floor(audio.currentTime / 0.02)] || 0 : 0;
    level += (target - level) * (target > level ? 0.6 : 0.35);
    const f = level < 0.18 ? 0 : level < 0.5 ? 1 : 2;
    if (f !== shown) { draw(f); shown = f; }
    cv.style.transform = `translateY(${(-5 * level).toFixed(1)}px) rotate(${(Math.sin(t / 140) * 1.4 * level).toFixed(2)}deg)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return bg;
}
