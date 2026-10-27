// One-off: prototype lesson data (prototype/data/h*-01.js) → content/ YAML in the docs/content-schema.md layout.
// Usage: node scripts/lessons-to-yaml.mjs h1-01 h2-01 …   Writes content/lessons/hsk<L>/<id>.yaml, content/words/<hz>.yaml, content/grammar/<id>.yaml.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'content');
const POS = {
	'danh từ': 'n',
	'động từ': 'v',
	'tính từ': 'adj',
	'phó từ': 'adv',
	'đại từ': 'pron',
	'số từ': 'num',
	'lượng từ': 'mw',
	'giới từ': 'prep',
	'liên từ': 'conj',
	'trợ từ': 'part',
	'thán từ': 'interj',
	'cụm từ': 'phrase'
};
const pos = (s) =>
	s
		? s.split(/\s*[/,]\s*/).map((p) => POS[p] ?? (p.startsWith('danh từ') ? 'n' : 'phrase'))
		: ['phrase'];
const strip = (s) => s.replace(/[，。！？、,.!?\s]/g, '');
const dict = JSON.parse(
	await import('node:fs').then((fs) =>
		fs.readFileSync(join(ROOT, 'prototype/data/dict.json'), 'utf8')
	)
);
const levelOf = (hz) => Math.min(...dict.filter((r) => r[0] === hz).map((r) => r[5]), 9);

// h1-01 predates the preview format: adapt to the same shape
function fromOld(m) {
	const S = Object.fromEntries(Object.entries(m.SENTENCES).map(([k, s]) => [k, s]));
	const words = m.WORDS.map((w, i) => {
		S[`x${i + 1}`] = { hz: w.ex[0], py: w.ex[1], vi: w.ex[2] };
		return { ...w, ex: `x${i + 1}`, pos: '', art: null, file: `words/${w.img}.png` };
	});
	const G = m.GRAMMAR;
	return {
		...m.LESSON,
		goal: 'Chào hỏi, xin lỗi, cảm ơn và tạm biệt',
		words,
		sentences: S,
		dialogue: m.DIALOGUE,
		grammar: [{ ...G, pattern: G.pattern }],
		writing: [...'你好们'],
		gate: [],
		cover: 'The panda and the fawn meeting on a path by a calm lake, waving hello'
	};
}

const flow = (o) => {
	const n = new YAML.YAMLMap();
	n.flow = true;
	for (const [k, v] of Object.entries(o)) if (v !== undefined) n.add(new YAML.Pair(k, v));
	return n;
};
const seqFlow = (a) => {
	const s = new YAML.YAMLSeq();
	s.flow = true;
	s.items = a;
	return s;
};
const write = (rel, doc, head) => {
	const f = join(OUT, rel);
	mkdirSync(dirname(f), { recursive: true });
	writeFileSync(
		f,
		`${head ? `# ${head}\n` : ''}${new YAML.Document(doc).toString({ lineWidth: 0 })}`
	);
	return rel;
};

for (const id of process.argv.slice(2)) {
	const m = await import(join(ROOT, `prototype/data/${id}.js`));
	const L = m.LESSON.words ? m.LESSON : fromOld(m);
	const sid = Object.fromEntries(
		Object.keys(L.sentences).map((k, i) => [k, `s-${id}-${String(i + 1).padStart(2, '0')}`])
	);
	const reading = new Set(L.reading?.lines ?? []);
	const sentences = Object.entries(L.sentences).map(([k, s]) =>
		flow({
			id: sid[k],
			hanzi: s.hz,
			pinyin: s.py,
			...(s.spoken && s.spoken !== s.py ? { spoken: s.spoken } : {}),
			vi: s.vi,
			speaker: reading.has(k) ? undefined : s.speaker,
			...(s.unknown?.length ? { unknown: seqFlow(s.unknown) } : {})
		})
	);
	const bySentence = (ans) =>
		Object.keys(L.sentences).find((k) => strip(L.sentences[k].hz) === strip(ans));

	// questions
	const gate = L.gate.map((q, i) => {
		const qid = `q-${id}-x${String(i + 1).padStart(2, '0')}`;
		const tests = {
			words: L.words
				.filter((w) => JSON.stringify(q).includes(w.hz) || q.ans === w.vi)
				.map((w) => w.hz)
		};
		const t = flow(tests.words.length ? { words: seqFlow(tests.words) } : {});
		if (q.t === 'order') {
			const s = bySentence(q.ans);
			return {
				id: qid,
				type: 'order',
				tests: t,
				tiles: seqFlow(q.tiles),
				answer: s ? sid[s] : q.ans
			};
		}
		return {
			id: qid,
			type: 'choice',
			tests: t,
			prompt:
				q.t === 'listen'
					? flow({ kind: 'audio', ref: sid[q.sid] })
					: flow({ kind: 'vi', text: q.title }),
			optionKind: q.kind === 'hz' ? 'hanzi' : 'vi',
			options: seqFlow(q.opts),
			answer: q.opts.indexOf(q.ans)
		};
	});

	const lesson = {
		id,
		level: L.level,
		topic: L.topic,
		order: L.order,
		title: L.title,
		titleHanzi: L.titleHanzi,
		goal: L.goal,
		scene: {
			file: `lessons/${id}.png`,
			cast: seqFlow(
				['panda', 'redpanda', 'fawn', 'takin'].filter((c) =>
					({ panda: /(?<!red )panda/, redpanda: /red panda/, fawn: /fawn/, takin: /takin/ })[
						c
					].test(L.cover)
				)
			),
			prompt: L.cover
		},
		sentences,
		sections: {
			warmup: {},
			words: { ids: seqFlow(L.words.map((w) => w.hz)) },
			grammar: { ids: seqFlow(L.grammar.map((g) => g.id)), drills: [] },
			dialogue: {
				parts: L.dialogue.map((d) => ({
					title: d.title,
					lines: seqFlow(d.lines.map((k) => sid[k]))
				})),
				questions: []
			},
			...(L.reading
				? {
						reading: { title: L.reading.title, lines: seqFlow(L.reading.lines.map((k) => sid[k])) }
					}
				: {}),
			listenSpeak: { items: [] },
			writing: { chars: seqFlow(L.writing) }
		},
		gate: { draw: Math.min(10, Math.floor(gate.length / 2) || 10), pool: gate }
	};
	const files = [
		write(`lessons/hsk${L.level}/${id}.yaml`, lesson, `content/lessons/hsk${L.level}/${id}.yaml`)
	];

	for (const [i, w] of L.words.entries()) {
		const word = {
			id: w.hz,
			hanzi: w.hz,
			pinyin: w.py,
			...(w.say ? { spoken: w.say.slice(0, 2).join('').trim() } : {}),
			hanviet: w.hv,
			level: levelOf(w.hz),
			pos: seqFlow(pos(w.pos)),
			senses: [flow({ vi: w.vi })],
			parts:
				w.chars || w.parts
					? w.chars
						? w.chars.map((c) => flow({ hanzi: c[0], pinyin: c[1], hanviet: c[2], vi: c[3] }))
						: w.parts.map((c) => flow({ hanzi: c[0], name: c[1], vi: c[2] }))
					: undefined,
			examples: seqFlow([sid[w.ex]]),
			image: flow({
				file: w.file ?? `words/${id}/w${String(i + 1).padStart(2, '0')}.png`,
				prompt: w.art ?? undefined
			})
		};
		files.push(write(`words/${w.hz}.yaml`, word, `content/words/${w.hz}.yaml`));
	}
	for (const g of L.grammar) {
		const gp = {
			id: g.id,
			level: L.level,
			std: seqFlow(g.std ?? []),
			title: g.title,
			pattern: Array.isArray(g.pattern) ? g.pattern.join(' + ') : g.pattern,
			explain: g.more ? `${g.explain}\n\n${g.more}` : g.explain,
			examples: seqFlow(g.examples.map((k) => sid[k])),
			...(g.wrong ? { pitfalls: [flow({ wrong: g.wrong[0], right: g.wrong[1] })] } : {})
		};
		files.push(write(`grammar/${g.id}.yaml`, gp, `content/grammar/${g.id}.yaml`));
	}
	console.log(
		`${id}: ${files.length} files (${L.words.length} words, ${L.grammar.length} grammar)`
	);
}
