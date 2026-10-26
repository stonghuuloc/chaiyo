// Lexicon (Từ của tôi) for the prototype: Bài 1 words with mock SRS state + "tự thêm" words.
// Words saved from W2 go to localStorage 'lexicon-added' as dict rows; practice results go to 'srs-log-2'.
// Memory is tracked PER SKILL: knowing 你 on a card ≠ hearing it ≠ writing it.
import { WORDS } from './h1-01.js';

// skill → label, seconds per item (for the "≈ N phút" estimate)
export const SKILLS = {
  the: { label: 'Thẻ từ', sec: 10 },
  nghe: { label: 'Nghe', sec: 15 },
  viet: { label: 'Viết chữ', sec: 35 },
};
// state: due = practise today · learning · known · new (never practised). next = days until due, ivl = last interval.
// [state, next, ok, tries] per word per skill
const SEED = {
  the: {
    你: ['due', 0, 3, 4], 好: ['due', 0, 2, 3], 您: ['due', 0, 1, 2], 对不起: ['due', 0, 2, 3],
    你们: ['learning', 1, 3, 3], 没关系: ['learning', 2, 3, 4], 不客气: ['learning', 2, 4, 5],
    你好: ['known', 9, 6, 6], 谢谢: ['known', 7, 5, 5], 再见: ['known', 5, 5, 6],
  },
  nghe: {
    谢谢: ['due', 0, 2, 3], 再见: ['due', 0, 3, 4], 没关系: ['due', 0, 1, 2],
    你好: ['learning', 3, 3, 3], 对不起: ['learning', 2, 2, 3], 不客气: ['learning', 1, 2, 2],
  },
  viet: { 你: ['due', 0, 1, 2], 好: ['due', 0, 2, 2], 你们: ['learning', 2, 1, 1] },
};
const SEED_ADDED = [
  ['熊猫', 'xióng māo', 'xiongmao', 'hùng miêu', 'gấu trúc', 0, 'learning', 3],
  ['奶茶', 'nǎi chá', 'naicha', 'nãi trà', 'trà sữa', 0, 'new', 0],
];

const key = 'lexicon-added', LOG = 'srs-log-2';
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
const saved = () => read(key, []);
const log = () => { const L = read(LOG, {}); return { the: { ...read('srs-log', {}), ...L.the }, nghe: L.nghe || {}, viet: L.viet || {} }; };
const entry = (skill, hz, fallback, L) => {
  if (L[skill][hz]) return L[skill][hz];
  const [state, next, ok, tries] = SEED[skill][hz] || fallback;
  return { state, next, ok, tries };
};

// one shape for every row: { hz, py, hv, vi, from, taught, sk: {the, nghe, viet} } + the flashcard entry spread on top
export function lexicon() {
  const L = log();
  const build = (base, theFallback) => {
    const sk = {};
    for (const s of Object.keys(SKILLS)) sk[s] = entry(s, base.hz, s === 'the' ? theFallback : ['new', 0, 0, 0], L);
    if (!base.taught) delete sk.nghe;   // listening needs a recorded clip
    return { ...base, ...sk.the, sk };
  };
  const taught = WORDS.map((w) => build({ hz: w.hz, py: w.py, hv: w.hv, vi: w.vi, from: 'Bài 1', taught: w }, ['new', 0, 0, 0]));
  const added = [...SEED_ADDED, ...saved().map((r) => [...r.slice(0, 6), 'new', 0])]
    .filter((r, i, a) => a.findIndex((x) => x[0] === r[0]) === i && !SEED.the[r[0]])
    .map(([hz, py, , hv, vi, level, state, next]) => build({ hz, py, hv, vi, level, from: 'tự thêm' }, [state, next, +(state !== 'new'), +(state !== 'new')]));
  return [...taught, ...added];
}
// due in one skill. Flashcards also take never-practised saved words; writing only what the lessons already taught.
export const dueIn = (skill, all = lexicon()) => all.filter((w) => w.sk[skill] && (w.sk[skill].state === 'due' || (skill === 'the' && w.sk.the.state === 'new')));
export const dueToday = () => dueIn('the');
// today's mixed session: every due item across skills, skills interleaved, never the same word twice in a row
export function session(all = lexicon(), only = Object.keys(SKILLS)) {
  const lanes = only.map((s) => dueIn(s, all).map((w) => ({ skill: s, w })));
  const out = [];
  while (lanes.some((l) => l.length)) {
    for (const l of lanes) {
      if (!l.length) continue;
      const i = l.findIndex((x) => x.w.hz !== out.at(-1)?.w.hz);
      out.push(...l.splice(i < 0 ? 0 : i, 1));
    }
  }
  return out;
}
export const minutes = (items) => Math.max(1, Math.round(items.reduce((n, x) => n + SKILLS[x.skill].sec, 0) / 60));
// 0 = never practised … 3 = solid. Prototype stand-in for FSRS stability.
export function strength(e) {
  if (!e?.tries) return 0;
  const r = e.ok / e.tries;
  return e.next >= 5 && r >= 0.8 ? 3 : r >= 0.7 || e.next >= 2 ? 2 : 1;
}
// one result. Remembered → interval × 2.5 (min 2 days); forgot → tomorrow. Prototype stand-in for FSRS.
export function review(hz, remembered, skill = 'the') {
  const e = lexicon().find((x) => x.hz === hz).sk[skill];
  const ivl = remembered ? Math.max(2, Math.round((e.ivl || e.next || 1) * 2.5)) : 1;
  const L = read(LOG, {});
  (L[skill] ??= {})[hz] = { state: ivl >= 7 ? 'known' : 'learning', next: ivl, ivl, ok: e.ok + (remembered ? 1 : 0), tries: e.tries + 1 };
  localStorage.setItem(LOG, JSON.stringify(L));
  return L[skill][hz];
}
export const resetReviews = () => { localStorage.removeItem(LOG); localStorage.removeItem('srs-log'); };
export const inLexicon = (hz) => lexicon().some((w) => w.hz === hz);
export function addWord(row) { const s = saved(); if (!s.some((r) => r[0] === row[0])) { s.push(row); localStorage.setItem(key, JSON.stringify(s)); } }

export const when = (w) => (w.state === 'due' ? 'hôm nay' : w.state === 'new' ? 'chưa ôn' : w.next === 1 ? 'ngày mai' : `${w.next} ngày nữa`);

// dictionary rows [hz, py, toneless, hv, vi, level, senses, others] for word pages; loaded once
let dict;
export const loadDict = () => (dict ??= fetch('data/dict.json?v=3').then((r) => r.json()));