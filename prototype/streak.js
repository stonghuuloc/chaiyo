// Streak + Freeze for the prototype (rules: CONTEXT.md "Streak" / "Streak Freeze").
// A day counts when the learner finishes one lesson section or a practice session (prototype stand-in for
// "cleared every review due that day"). Freeze: +1 per 7 counted days in a row, hold max 2, spent automatically
// on a missed day; a frozen day keeps the streak but does not add to it.
// Demo week is fixed (T2..CN, today = T6). Today's count lives in localStorage 'streak-v1'; ?reset on Home clears it.
const KEY = 'streak-v1';
const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const BASE = { streak: 12, best: 12, freeze: 1, week: ['ok', 'ok', 'frozen', 'ok'], today: 4, missed: 'T4' };
const MAX_FREEZE = 2;
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

export function streak() {
  const s = read(), counted = !!s.counted;
  const n = BASE.streak + (counted ? 1 : 0);
  // a 7-day multiple reached today earns a freeze (cap 2)
  const earned = counted && n % 7 === 0 && BASE.freeze < MAX_FREEZE;
  return { counted, n, best: Math.max(BASE.best, n), freeze: BASE.freeze + (earned ? 1 : 0), earned, toNext: 7 - (n % 7 || 7) || 7,
    week: DAYS.map((d, i) => ({ d, st: i < BASE.today ? BASE.week[i] : i === BASE.today ? (counted ? 'ok' : 'today') : 'later' })), missed: BASE.missed };
}
export const resetStreak = () => localStorage.removeItem(KEY);

// called by section/session done screens. First count of the day → celebrate.
export function dayDone() {
  if (read().counted) return false;
  localStorage.setItem(KEY, JSON.stringify({ counted: true, at: Date.now() }));
  setTimeout(celebrateDay, 700);
  return true;
}

// ── shared styles (pages that import this don't all share one stylesheet)
const css = `
.sk-scrim{position:fixed;inset:0;z-index:60;background:rgba(29,24,20,.55);display:flex;align-items:flex-end;justify-content:center;animation:sk-fade .2s ease-out}
.sk-scrim.center{align-items:center;padding:0}
.sk-card{width:min(430px,100%);background:var(--paper);border-radius:28px;padding:var(--s6) var(--s5) var(--s5);text-align:center;box-shadow:0 20px 60px rgba(29,24,20,.3);animation:sk-up .42s cubic-bezier(.2,.9,.3,1.2)}
.sk-scrim.center .sk-card{width:min(340px,calc(100% - 40px));padding:var(--s5) var(--s4) var(--s4);border-radius:24px}
.sk-scrim.center .sk-flame{width:88px;height:88px}.sk-scrim.center .sk-flame svg{width:68px;height:68px;font-size:68px}
.sk-scrim.center .sk-num{height:52px;font-size:46px;line-height:52px}
.sk-scrim.center .sk-card h2{font-size:21px}
.sk-scrim.center .sk-card>p{font-size:14.5px}
.sk-scrim.center .sk-week{gap:2px}.sk-scrim.center .sk-week i{width:30px;height:30px}
.sk-week i svg{width:18px;height:18px;font-size:18px;stroke-width:2}
.sk-week .frozen i svg{width:26px;height:26px;font-size:26px}
.sk-scrim.center .sk-btn{height:48px;font-size:17px}
.sk-scrim:not(.center) .sk-card{border-radius:24px 24px 0 0;padding-bottom:calc(env(safe-area-inset-bottom,0px) + var(--s5));text-align:left;animation:sk-slide .28s ease-out}
.sk-flame{position:relative;width:112px;height:112px;margin:0 auto;display:grid;place-items:center}
.sk-flame::before{content:"";position:absolute;inset:6px;border-radius:50%;background:radial-gradient(circle,rgba(198,48,29,.28),rgba(198,48,29,0) 70%);animation:sk-glow 1.6s ease-in-out infinite}
.sk-flame svg{position:relative;width:88px;height:88px;font-size:88px;color:var(--vermilion);--duo:.9;--duo-c:#f08a3c;transform-origin:50% 90%;animation:sk-pop .7s cubic-bezier(.2,.9,.3,1.4) both,sk-flick 1.4s ease-in-out .7s infinite}
.sk-flame.snow svg{color:var(--freeze);--duo:.35;--duo-c:var(--freeze);animation:sk-pop .7s cubic-bezier(.2,.9,.3,1.4) both,sk-spin 6s linear .7s infinite}
.sk-flame.snow::before{background:radial-gradient(circle,rgba(63,115,176,.25),rgba(63,115,176,0) 70%)}
.sk-num{margin-top:var(--s2);height:64px;overflow:hidden;font:600 56px/64px var(--font-display);font-variant-numeric:tabular-nums}
.sk-num span{display:block;animation:sk-roll .6s cubic-bezier(.3,1.3,.5,1) .55s both}
.sk-card h2{font:600 24px/1.2 var(--font-display)}
.sk-card>p{margin-top:var(--s2);color:var(--ink-2);font-size:15.5px;line-height:1.45}
.sk-week{margin:var(--s5) 0 0;display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.sk-week div{display:grid;justify-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--ink-3)}
.sk-week i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;border:1.5px solid var(--ink-5);color:#fff;font-size:15px}
.sk-week .ok i{background:var(--vermilion);border-color:var(--vermilion)}
.sk-week .frozen i{border-color:transparent;color:var(--freeze);font-size:22px}
.sk-week .now i{animation:sk-stamp .5s cubic-bezier(.2,.9,.3,1.5) 1.05s both}
.sk-week .now{color:var(--ink-1)}
.sk-note{margin-top:var(--s4);padding:var(--s3);border-radius:14px;background:#fff;font-size:14px;color:var(--ink-2);display:flex;gap:var(--s2);align-items:center;text-align:left}
.sk-note svg{flex:none;width:22px;height:22px;font-size:22px;color:var(--freeze)}
.sk-btn:focus:not(:focus-visible){outline:none}
.sk-btn{margin-top:var(--s5);width:100%;height:54px;border-radius:var(--r-cta);background:var(--ink-1);color:var(--paper);font:600 19px var(--font-display)}
.sk-rules{margin-top:var(--s4);list-style:none;display:grid;gap:var(--s3)}
.sk-rules li{display:grid;grid-template-columns:32px 1fr;gap:var(--s3);align-items:start;font-size:15px;color:var(--ink-2);line-height:1.4}
.sk-rules li b{color:var(--ink-1)}
.sk-rules li span.k{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:#fff;font:600 15px var(--font-display);color:var(--ink-1)}
.sk-have{margin-top:var(--s4);display:flex;align-items:center;gap:var(--s3);padding:var(--s3) var(--s4);border-radius:16px;background:#fff}
.sk-have .flakes{display:flex;gap:4px}
.sk-have .flakes svg{width:26px;height:26px;color:var(--freeze)}
.sk-have .flakes svg.off{color:var(--ink-5)}
.sk-have b{display:block;font-weight:600}
.sk-have small{display:block;font-size:13px;color:var(--ink-3)}
.sk-drop{position:fixed;z-index:61;top:-24px;pointer-events:none;color:var(--freeze);opacity:.85}
@keyframes sk-fade{from{opacity:0}}
@keyframes sk-up{from{transform:translateY(24px) scale(.96);opacity:0}}
@keyframes sk-slide{from{transform:translateY(100%)}}
@keyframes sk-pop{0%{transform:scale(.2) rotate(-8deg);opacity:0}70%{transform:scale(1.15) rotate(3deg);opacity:1}100%{transform:scale(1)}}
@keyframes sk-flick{0%,100%{transform:scale(1) rotate(0)}30%{transform:scale(1.05,0.97) rotate(-2deg)}60%{transform:scale(.97,1.04) rotate(2deg)}}
@keyframes sk-spin{to{transform:rotate(360deg)}}
@keyframes sk-glow{0%,100%{transform:scale(.9);opacity:.7}50%{transform:scale(1.1);opacity:1}}
@keyframes sk-roll{from{transform:translateY(100%);opacity:0}}
@keyframes sk-stamp{0%{transform:scale(0);background:var(--vermilion)}60%{transform:scale(1.3)}100%{transform:scale(1);background:var(--vermilion);border-color:var(--vermilion)}}
@keyframes sk-fall{to{transform:translateY(105vh) rotate(240deg)}}
.sk-drop.ember{top:auto;bottom:-24px;color:var(--vermilion)}
@keyframes sk-rise{to{transform:translateY(-105vh) rotate(-30deg);opacity:0}}
.sk-n{display:inline-block;height:1.2em;overflow:hidden;vertical-align:bottom;color:var(--vermilion)}.sk-n span{display:block;animation:sk-roll .6s cubic-bezier(.3,1.3,.5,1) .55s both}
@media (prefers-reduced-motion:reduce){.sk-scrim,.sk-card,.sk-flame svg,.sk-flame::before,.sk-num span,.sk-week .now i{animation:none!important}}`;
const ensureCss = () => { if (!document.getElementById('sk-css')) document.head.insertAdjacentHTML('beforeend', `<style id="sk-css">${css}</style>`); };
const ic = (id) => `<svg class="ic"><use href="icons.svg#i-${id}"/></svg>`;

function open(html, { center = false } = {}) {
  ensureCss();
  document.querySelector('.sk-scrim')?.remove();
  const scrim = document.createElement('div');
  scrim.className = `sk-scrim${center ? ' center' : ''}`;
  scrim.innerHTML = `<div class="sk-card" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { scrim.remove(); removeEventListener('keydown', esc); };
  const esc = (e) => e.key === 'Escape' && close();
  scrim.onclick = (e) => { if (e.target === scrim || e.target.closest('[data-close]')) close(); };
  addEventListener('keydown', esc);
  document.body.append(scrim);
  scrim.querySelector('[data-close]')?.focus({ focusVisible: false });
  return scrim;
}
const week = (s, nowIdx) => `<div class="sk-week" aria-hidden="true">${s.week.map((w, i) =>
  `<div class="${w.st === 'ok' ? 'ok' : w.st === 'frozen' ? 'frozen' : ''}${i === nowIdx ? ' now' : ''}"><i>${w.st === 'ok' ? ic('bold-check') : w.st === 'frozen' ? ic('regular-snowflake') : ''}</i>${w.d}</div>`).join('')}</div>`;

// day just counted: flame pops, number rolls up, today's circle gets stamped
export function celebrateDay() {
  const s = streak();
  navigator.vibrate?.([20, 40, 20]);
  const tail = s.earned ? `<p class="sk-note">${ic('fill-snowflake')}<span><b>Được tặng 1 lượt đóng băng!</b> Lỡ bận một hôm thì chuỗi vẫn giữ.</span></p>`
    : s.freeze < MAX_FREEZE ? `<p class="sk-note">${ic('fill-snowflake')}<span>Thêm <b>${s.toNext} ngày</b> nữa là được thêm 1 lượt đóng băng.</span></p>` : '';
  const scrim = open(`<div class="sk-flame">${ic('fill-fire')}</div>
    <h2 style="margin-top:var(--s3)">${s.n === s.best && s.n > BASE.best ? 'Kỷ lục mới' : 'Chuỗi lên'} <span class="sk-n"><span>${s.n}</span></span> ngày!</h2>
    <p>Hôm nay đã tính rồi, lửa đang cháy đượm. Mai ghé tiếp là thành ${s.n + 1} nha.</p>
    ${week(s, BASE.today)}${tail}
    <button class="sk-btn" data-close>Tuyệt!</button>`, { center: true });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < 18; i++) {                                      // embers rise, mirror of the freeze snow
    const f = document.createElement('span');
    f.className = 'sk-drop ember'; f.innerHTML = ic('fill-fire');
    const size = 10 + Math.random() * 12;
    f.style.cssText = `left:${Math.random() * 100}vw;width:${size}px;height:${size}px;font-size:${size}px;animation:sk-rise ${3 + Math.random() * 3}s linear ${Math.random() * 1.5}s forwards`;
    scrim.append(f);
  }
}

// Home after a missed day: snow falls, the freeze explains itself
export function freezeUsed() {
  const s = streak();
  const scrim = open(`<div class="sk-flame snow">${ic('fill-snowflake')}</div>
    <h2 style="margin-top:var(--s3)">Chuỗi vẫn còn nguyên!</h2>
    <p>Hôm ${s.missed} bạn nghỉ, 1 lượt đóng băng đã tự giữ chuỗi ${BASE.streak} ngày cho bạn. Hôm nay học để chuỗi chạy tiếp nhé.</p>
    ${week(s, -1)}
    <p class="sk-note">${ic('fill-snowflake')}<span>Còn <b>${s.freeze} lượt</b>. Học đủ 7 ngày liền được tặng thêm 1.</span></p>
    <button class="sk-btn" data-close>Học ngay thôi</button>`, { center: true });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < 18; i++) {
    const f = document.createElement('span');
    f.className = 'sk-drop'; f.innerHTML = ic('regular-snowflake');
    const size = 12 + Math.random() * 14;
    f.style.cssText = `left:${Math.random() * 100}vw;width:${size}px;height:${size}px;font-size:${size}px;animation:sk-fall ${3 + Math.random() * 3}s linear ${Math.random() * 1.5}s forwards`;
    scrim.append(f);
  }
}

// tap the chip or any day: what a freeze is and how to get one
export function freezeInfo() {
  const s = streak();
  open(`<h2>Lượt đóng băng là gì?</h2>
    <p>Là "bùa hộ mệnh" cho chuỗi ngày. Bạn không cần làm gì, app tự dùng khi bạn lỡ nghỉ một hôm.</p>
    <div class="sk-have"><span class="flakes">${Array.from({ length: MAX_FREEZE }, (_, i) => ic('fill-snowflake').replace('class="ic"', `class="ic${i < s.freeze ? '' : ' off'}"`)).join('')}</span>
      <span><b>Bạn đang có ${s.freeze}/${MAX_FREEZE} lượt</b><small>${s.freeze < MAX_FREEZE ? `Thêm ${s.toNext} ngày học liền nữa là được tặng 1` : 'Đầy túi rồi, cứ yên tâm'}</small></span></div>
    <ol class="sk-rules">
      <li><span class="k">1</span><span><b>Ngày được tính</b> khi bạn học xong một phần bài hoặc một buổi luyện.</span></li>
      <li><span class="k">2</span><span><b>Học 7 ngày liền</b> được tặng 1 lượt, giữ tối đa ${MAX_FREEZE} lượt.</span></li>
      <li><span class="k">3</span><span><b>Lỡ nghỉ một ngày?</b> App tự dùng 1 lượt, chuỗi giữ nguyên nhưng không cộng thêm.</span></li>
      <li><span class="k">4</span><span><b>Hết lượt mà nghỉ</b> thì chuỗi về 0. Huy hiệu đã có vẫn giữ.</span></li>
    </ol>
    <button class="sk-btn" data-close>Hiểu rồi</button>`);
}
