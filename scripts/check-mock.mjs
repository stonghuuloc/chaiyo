// Node check for prototype/data/mock-h1.js: shape, answers, level-1 vocabulary, picture files.
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = new URL('..', import.meta.url).pathname;
const { MOCK } = await import(pathToFileURL(`${root}prototype/data/mock-h1.js`));
const dict = JSON.parse(readFileSync(`${root}prototype/data/dict.json`, 'utf8'));
const lv1 = new Set(dict.filter((r) => r[5] === 1).map((r) => r[0]));
const errs = [];
const bad = (m) => errs.push(m);

const PIC = new Set(['pic3', 'pic6', 'rpic6']);
const SHARED = new Set(['pic6', 'rpic6', 'reply6', 'gap6']);
const HANZI = /[一-鿿]/;

function unknown(s) {
  const out = [];
  for (let i = 0; i < s.length;) {
    if (!HANZI.test(s[i])) { i++; continue; }
    let n = 4;
    while (n > 0 && !lv1.has(s.slice(i, i + n))) n--;
    if (n) i += n; else { out.push(s[i]); i++; }
  }
  return out;
}

let total = 0;
if (MOCK.sections?.length !== 2) bad(`sections: ${MOCK.sections?.length}`);
for (const sec of MOCK.sections ?? []) {
  if (sec.parts?.length !== 4) bad(`${sec.key}: ${sec.parts?.length} parts`);
  sec.parts.forEach((p, pi) => {
    const where = `${sec.key}.p${pi + 1}(${p.type})`;
    if (p.items?.length !== 5) bad(`${where}: ${p.items?.length} items`);
    if (SHARED.has(p.type) && p.opts?.length !== 6) bad(`${where}: shared opts ${p.opts?.length}`);
    const pos = {};
    p.items.forEach((it) => { const o = SHARED.has(p.type) ? p.opts : it.opts; const l = 'ABCDEF'[o?.indexOf(it.ans)]; pos[l] = (pos[l] || 0) + 1; });
    for (const [l, c] of Object.entries(pos)) if (c > 2) bad(`${where}: answer ${l} used ${c} times`);
    p.items.forEach((it, ii) => {
      total++;
      const w = `${where}.i${ii + 1}`;
      const opts = SHARED.has(p.type) ? p.opts : it.opts;
      if (opts?.length !== (SHARED.has(p.type) ? 6 : 3)) bad(`${w}: opts ${opts?.length}`);
      if (!opts?.includes(it.ans)) bad(`${w}: ans "${it.ans}" not in opts`);
      if (!it.why) bad(`${w}: no why`);
      if (!(it.say || it.text)) bad(`${w}: no say/text`);
      const texts = [it.say, it.text, it.q, ...(PIC.has(p.type) ? [] : opts ?? [])].filter(Boolean);
      for (const t of texts) { const u = unknown(t); if (u.length) bad(`${w}: not level 1: ${u.join('')} in "${t}"`); }
      if (PIC.has(p.type)) for (const k of opts ?? []) if (!existsSync(`${root}assets/words/mock-h1/${k}.png`)) bad(`${w}: missing picture ${k}`);
    });
  });
}
if (total !== 40) bad(`total ${total}`);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`ok ${total} questions`);
