// Shared pieces for the Bài 0 pages: question runner, syllable chips, progress in localStorage.
import { $, $$, ic, play, choice, shuffle } from './step.js?v=9';
import { py, toneOf, label, audioKey, PHRASE, HZ, PRIMER, SECTIONS } from './data/h0-00.js?v=2';
export { $, $$, ic, play, shuffle, py, label, PRIMER, SECTIONS };

const CONTOUR = { 1: 'M4 5H40', 2: 'M4 19L40 5', 3: 'M4 7Q18 26 40 5', 4: 'M4 4L40 20' };
export const contour = (t, cls = 'contour') => CONTOUR[t] ? `<svg class="${cls}" viewBox="0 0 44 24" aria-hidden="true"><path d="${CONTOUR[t]}"/></svg>` : '';
export const nfc = (s) => String(s).normalize('NFC');
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── progress (prototype: localStorage)
const KEY = 'primer-h0-00';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const save = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} };
export const progress = {
  get: load,
  section(k, ok, total) { const d = load(); d.done = { ...d.done, [k]: { ok, total } }; save(d); },
  gate(pct, pass) { const d = load(); d.best = Math.max(d.best || 0, pct); if (pass) d.passed = true; save(d); },
};

// ── syllable chip: big pinyin, hanzi if any, tap to hear (2nd tap = 0.5×)
export function chipHtml(item) {
  const key = audioKey(item), lab = label(item);
  const p = PHRASE[key], hz = HZ[key] || p?.hz || '';
  const say = p && p.say !== p.py ? `<span class="say2">đọc: <span class="py">${p.say}</span></span>` : '';
  return `<button class="chip" data-k="${key}" aria-label="Nghe ${lab}"><span class="cp py">${lab}</span>${hz ? `<span class="hz ch">${hz}</span>` : ''}${say}${ic('fill-speaker-high', 'ic sp')}</button>`;
}
export function wireChips(root = document) {
  $$('.chip[data-k]', root).forEach((c) => (c.onclick = () => {
    $$('.chip.on').forEach((x) => x !== c && x.classList.remove('on'));
    play(`py/${c.dataset.k}`, c);
  }));
}

// ── question runner (drills + gate). done(ok, pick) after Tiếp / Câu tiếp.
const TITLE = { tone: 'Nghe rồi chọn thanh điệu', pinyin: 'Nghe rồi chọn pinyin', spell: 'Cách viết nào đúng?', sandhi: 'Nghe xem thực tế đọc thanh nào' };
export const shown = (q, v) => (q.t === 'tone' ? py(v) : v);
/** Plain-text prompt for the gate's wrong-answer list. */
export const plain = (q) => (q.prompt ? q.prompt.replace(/<[^>]+>/g, '') : `${q.title || TITLE[q.t]} (câu nghe)`);

export function drill(q, done, { ask, feedback = true, last = false } = {}) {
  const tone = q.t === 'tone';
  const promptHtml = `<div class="prompt">${q.prompt ? `<p class="pt">${q.prompt}</p>` : ''}${q.key ? `<button class="play" id="qplay" aria-label="Nghe (bấm lần nữa để nghe chậm)">${ic('fill-speaker-high')}</button>` : ''}</div>`;
  choice({
    ask, title: q.title || TITLE[q.t], promptHtml, kind: tone ? 'tones' : 'text', optCls: 'py', opts: shuffle(q.opts), ans: q.ans, feedback, last,
    optHtml: tone ? (k) => `<span class="syl py">${py(k)}</span>${contour(toneOf(k))}` : undefined,
    optLabel: tone ? py : undefined,
    explain: (a) => `<b class="py">${shown(q, a)}</b>${q.why ? ` · ${q.why}` : ''}`,
    missHint: 'Nghe lại vài lần cho quen tai',
  }, done);
  const b = $('#qplay');
  if (b) { b.onclick = () => play(`py/${q.key}`, b); setTimeout(() => b.isConnected && play(`py/${q.key}`, b), 250); }
}
