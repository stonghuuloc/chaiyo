// Shared Step-flow pieces for lesson sections (L2–L8): top bar, bottom CTA, audio, talking stage,
// choice questions, section-done screen. Pages provide <div class="top">…, <main id="main">, <div class="foot">.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const ic = (id, cls = 'ic') => `<svg class="${cls}"><use href="icons.svg#i-${id}"/></svg>`;
export const go = () => ic('regular-caret-right', 'ic go');

// ── audio: one element; taps on the same clip alternate 1× / 0.5× (pitch kept)
export const audio = new Audio();
let last = null, plays = 0, lit = null;
const unlight = () => { $$('.play.on').forEach((b) => b.classList.remove('on')); lit?.classList.remove('on'); lit = null; };
audio.addEventListener('ended', unlight);
audio.addEventListener('error', unlight);
audio.addEventListener('pause', () => { if (audio.paused) unlight(); });  // src swap fires a late pause; skip if already replaying
export function play(key, btn) {
  plays = key === last ? plays + 1 : 1; last = key;
  audio.src = `audio/${key}.mp3`; audio.preservesPitch = true; audio.playbackRate = plays % 2 ? 1 : 0.5;
  audio.currentTime = 0;
  unlight();
  if (btn) { btn.classList.add('on'); lit = btn; }
  return audio.play().catch(() => {});
}
export const ended = () => new Promise((r) => { if (audio.paused || audio.ended) return r(); audio.addEventListener('ended', r, { once: true }); audio.addEventListener('pause', r, { once: true }); });

// ── top bar: segmented progress (or a plain counter for test runners)
export function bar(lit, total, label = `${Math.min(lit + 1, total)}/${total}`) {
  const seg = $('#seg');
  if (seg) {
    if (seg.children.length !== total) { seg.style.setProperty('--n', total); seg.innerHTML = '<i></i>'.repeat(total); }
    [...seg.children].forEach((el, i) => el.classList.toggle('on', i < lit));
  }
  $('#count').textContent = label;
}

// ── bottom CTA
export function cta(label, { disabled = false, caret = true, hint = '', onClick } = {}) {
  const b = $('#cta');
  b.disabled = disabled; b.innerHTML = `${label}${caret ? go() : ''}`;
  if (onClick) b.onclick = onClick;
  $('#hint').textContent = hint;
}
export const hint = (t) => ($('#hint').textContent = t);

// ── talking stage: the red panda says the clip; tap it or ▶ to replay
export const stageHtml = () => `<div class="stage"><canvas id="talk" aria-hidden="true"></canvas><button class="play" id="play" aria-label="Nghe lại (bấm lần nữa để nghe chậm)">${ic('fill-speaker-high')}</button></div>`;
export function wireStage(key, { auto = true } = {}) {
  $('#play').onclick = (e) => play(key, e.currentTarget);
  $('#talk').onclick = () => play(key, $('#play'));
  const ready = import('./talk.js?v=3')
    .then(({ talker, envelope }) => { envelope(new URL(`audio/${key}.mp3`, location.href).href); return talker($('#talk'), audio); })
    .then((bg) => { const s = $('.stage'); if (s && bg) s.style.background = bg; }).catch(() => {});
  if (auto) ready.then(() => setTimeout(() => $('#talk')?.isConnected && play(key, $('#play')), 250));
  return ready;
}

// ── choice question. q = { ask, title, key?, promptHtml?, opts, ans, kind: 'hz'|'text', explain?(ans) , feedback = true }
// done(correct, pick) is called after the learner presses Tiếp (feedback) or Câu tiếp (no feedback).
export function choice(q, done) {
  const kind = q.kind || 'hz', fb = q.feedback !== false;
  let pick = null, checked = false;
  $('#main').innerHTML = `<div class="step">
    <p class="ask">${q.ask}</p><h2>${q.title}</h2>
    ${q.key ? stageHtml() : q.promptHtml || ''}
    <div class="opts ${kind}">${q.opts.map((o) => `<button class="opt ${kind === 'hz' ? 'hz' : ''} ${q.optCls || ''}" data-o="${o}" aria-pressed="false"${q.optLabel ? ` aria-label="${q.optLabel(o)}"` : ''}>${q.optHtml ? q.optHtml(o) : o}</button>`).join('')}</div>
    <p class="say" id="say"></p></div>`;
  if (q.key) wireStage(q.key, { auto: q.auto !== false });
  $$('.opt').forEach((b) => (b.onclick = () => {
    if (checked) return;
    pick = b.dataset.o;
    $$('.opt').forEach((x) => x.setAttribute('aria-pressed', x === b));
    $('#cta').disabled = false; hint('');
  }));
  const grade = () => {
    checked = true;
    const ok = pick === q.ans;
    $$('.opt').forEach((b) => {
      const o = b.dataset.o;
      if (o === q.ans) { b.classList.add('right'); b.insertAdjacentHTML('beforeend', `<span class="badge">${ic('bold-check')}</span>`); }
      else if (o === pick) { b.classList.add('wrong'); b.insertAdjacentHTML('beforeend', `<span class="badge">${ic('regular-x')}</span>`); }
    });
    $('#say').innerHTML = (ok ? '<b>Đúng rồi.</b> ' : '<b>Chưa đúng.</b> Đáp án là ') + (q.explain ? q.explain(q.ans) : `<span class="hz">${q.ans}</span>`);
    cta('Tiếp', { hint: ok ? '' : q.missHint ?? 'Câu này sẽ quay lại ở phần ôn', onClick: () => done(ok, pick) });
  };
  cta(fb ? 'Kiểm tra' : q.last ? 'Nộp bài' : 'Câu tiếp', {
    disabled: true, caret: !fb, hint: 'Chọn một đáp án',
    onClick: () => { if (!pick) return; if (fb) grade(); else done(pick === q.ans, pick); },
  });
}

// ── section done
export function doneStep({ title, text, gridHtml = '', label = 'Về bài học', next = '', href = 'l1-hub.html' }) {
  import('./streak.js?v=10').then((m) => m.dayDone());   // a finished section counts the day
  $('#main').innerHTML = `<div class="step done">
    <div class="done-mark">${ic('bold-check')}</div><h2>${title}</h2><p>${text}</p>${gridHtml}</div>`;
  cta(label, { hint: next ? `Tiếp theo: ${next}` : '', onClick: () => (location.href = href) });
}

// ── Hanzi Writer char data, with radStrokes patched where hanzi-writer-data has none (Kangxi radical stroke indexes)
const RAD = { 再: [1, 2], 见: [0, 1, 2, 3], 气: [0, 1, 2, 3] };
export const loadChar = (c, ok, fail) => fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${c}.json`)
  .then((r) => r.json()).then((d) => ok(d.radStrokes || !RAD[c] ? d : { ...d, radStrokes: RAD[c] })).catch(fail);
export const STROKE = { rest: '#1d1814', radical: '#c6301d', outline: '#ddd5c8' };

export const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

// ── celebrate: side cannons in waves, then a slow shower from the top; headline pops; tap the art = another burst.
// Real wins only. Reduced motion → the pop only, no confetti.
const SHAPES = ['rect', 'rect', 'circle', 'strip'];
const COLORS = ['#c6301d', '#c6301d', '#e8604c', '#1d1814', '#f7f3ea', '#3f73b0'];
let fx = null;   // one shared canvas + particle list, so repeat bursts add to the same loop
function confetti() {
  if (fx) return fx;
  const cv = document.createElement('canvas'), dpr = devicePixelRatio || 1;
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100';
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  document.body.append(cv);
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  fx = { cv, g, bits: [], running: false };
  return fx;
}
function bit(x, y, vx, vy, slow) {
  return { x, y, vx, vy, slow, w: 6 + Math.random() * 6, h: 8 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35,
    wob: Math.random() * 6, c: COLORS[(Math.random() * COLORS.length) | 0], s: SHAPES[(Math.random() * SHAPES.length) | 0], life: 0 };
}
function cannons(n, power) {
  const W = innerWidth, H = innerHeight;
  for (let i = 0; i < n; i++) {
    const side = i % 2, a = 0.5 + Math.random() * 0.5, v = power * (0.7 + Math.random() * 0.6);
    fx.bits.push(bit(side ? W + 4 : -4, H * (0.55 + Math.random() * 0.15), Math.cos(a) * v * (side ? -1 : 1), -Math.sin(a) * v - 3, false));
  }
}
function shower(n, ms) {
  fx.pending = (fx.pending || 0) + n;
  for (let i = 0; i < n; i++) setTimeout(() => {
    if (!fx) confetti();
    fx.bits.push(bit(Math.random() * innerWidth, -12, (Math.random() - 0.5) * 1.5, 1 + Math.random() * 2, true));
    fx.pending--; loop();
  }, Math.random() * ms);
}
function loop() {
  if (fx.running) return; fx.running = true;
  const { g } = fx;
  (function frame() {
    const W = innerWidth, H = innerHeight;
    g.clearRect(0, 0, W, H);
    fx.bits = fx.bits.filter((b) => b.y < H + 30 && b.life < 420);
    for (const b of fx.bits) {
      b.life++;
      if (b.slow) { b.vy = Math.min(b.vy + 0.05, 2.6); b.wob += 0.08; b.x += b.vx + Math.sin(b.wob) * 0.8; }
      else { b.vy += 0.3; b.vx *= 0.982; b.vy *= 0.985; b.x += b.vx; }
      b.y += b.vy; b.r += b.vr;
      g.save(); g.globalAlpha = b.life > 340 ? (420 - b.life) / 80 : 1;
      g.translate(b.x, b.y); g.rotate(b.r); g.scale(1, Math.cos(b.r * 2)); g.fillStyle = b.c;
      if (b.s === 'circle') { g.beginPath(); g.arc(0, 0, b.w / 2, 0, 7); g.fill(); }
      else if (b.s === 'strip') g.fillRect(-1.5, -b.h, 3, b.h * 2);
      else g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      g.restore();
    }
    if (fx.bits.length || fx.pending > 0) requestAnimationFrame(frame);
    else { fx.cv.remove(); fx = null; }
  })();
}
export function burst(power = 15, n = 70) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  confetti(); cannons(n, power); loop();
}
export function celebrate({ big = false, pop = 'h1, .score b, .chaiyo', replay = '.pic' } = {}) {
  document.querySelectorAll(pop).forEach((el, i) => el.animate(
    [{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)' }],
    { duration: 520, delay: i * 90, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'backwards' }));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  navigator.vibrate?.(big ? [30, 60, 30, 60, 50] : [30, 60, 30]);
  confetti();
  const waves = big ? [0, 350, 750, 1200] : [0, 400, 850];
  fx.pending = waves.length;
  waves.forEach((t, i) => setTimeout(() => { if (!fx) confetti(); cannons(big ? 70 : 50, 15 + i); fx.pending--; loop(); }, t));
  setTimeout(() => { if (!fx) confetti(); shower(big ? 160 : 90, big ? 3200 : 2200); loop(); }, 600);
  const art = document.querySelector(replay);
  if (art && !art.dataset.burst) { art.dataset.burst = 1; art.style.cursor = 'pointer'; art.addEventListener('click', () => { navigator.vibrate?.(20); burst(); }); }
}
