// Mock learner directory shared by U2 (Bạn bè) and U3 (hồ sơ). All numbers are demo data.
// Minh / Lan / Huy match the Home friends strip (colors, streak, lesson).
export const ME = { id: 'me', name: 'Tống Lộc', initial: 'TL', bg: '#efd6cf', fg: '#8a3324', streak: 12, week: 9 };

export const LEARNERS = [
  { id: 'minh', name: 'Minh', initial: 'M', bg: '#e9dcc6', fg: '#6a4b25', hsk: 1, lesson: 14, streak: 30, best: 30, words: 142, week: 14 },
  { id: 'lan', name: 'Lan', initial: 'L', bg: '#efd6cf', fg: '#8a3324', hsk: 1, lesson: 6, streak: 4, best: 7, words: 48, week: 25 },
  { id: 'huy', name: 'Huy', initial: 'H', bg: '#fff3d6', fg: '#594001', hsk: 1, lesson: 9, streak: 9, best: 9, words: 87, week: 17 },
  { id: 'quan', name: 'Quân', initial: 'Q', bg: '#dbe7dc', fg: '#2f5a3a', hsk: 1, lesson: 11, streak: 21, best: 21, words: 103, week: 31 },
  { id: 'thao', name: 'Thảo', initial: 'T', bg: '#dde4f0', fg: '#34476e', hsk: 1, lesson: 3, streak: 2, best: 5, words: 22, week: 12 },
  { id: 'bao', name: 'Bảo', initial: 'B', bg: '#ecdcea', fg: '#6b3a66', hsk: 1, lesson: 8, streak: 15, best: 15, words: 71, week: 8 },
  { id: 'vy', name: 'Vy', initial: 'V', bg: '#f4e3d2', fg: '#7a4a1c', hsk: 1, lesson: 12, streak: 6, best: 8, words: 95, week: 20 },
  { id: 'nam', name: 'Nam', initial: 'N', bg: '#d9ecec', fg: '#255a5a', hsk: 1, lesson: 5, streak: 1, best: 3, words: 30, week: 6 },
  // hidden profile: never listed, never ranked, profile page shows the "ẩn" state
  { id: 'hidden', name: 'Người học ẩn danh', initial: '?', bg: '#ece6dc', fg: '#6b645a', hidden: true },
];

export const byId = (id) => LEARNERS.find((l) => l.id === id);

// earned badges derived from the learner's state (same rules as Tôi)
export const badgesOf = (l) => [
  { id: 'first', t: 'Bước đầu tiên' },
  l.best >= 7 && { id: 'streak7', t: 'Chuỗi 7 ngày' },
  l.best >= 30 && { id: 'streak30', t: 'Chuỗi 30 ngày' },
  l.words >= 100 && { id: 'words100', t: '100 từ' },
].filter(Boolean);

// follow state, one key for both pages
export const KEY = 'chaiyo-u2-follow';
const DEFAULT = ['minh', 'lan', 'huy'];
export function follows() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(v)) return v; } catch {}
  return [...DEFAULT];
}
export function setFollow(id, on) {
  const s = new Set(follows());
  on ? s.add(id) : s.delete(id);
  localStorage.setItem(KEY, JSON.stringify([...s]));
  return on;
}
export const resetFollows = () => localStorage.removeItem(KEY);
export const clearFollows = () => localStorage.setItem(KEY, '[]');
