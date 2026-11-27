import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildBundle, createMemorySink, importContent, type Bundle } from './import';
import { scopeFor, PRODUCTION_ROOTS } from './import/scope';
import fixture from './fixtures/h1-01.prototype-questions.json';

type FxQuestion = {
	id: string;
	section: string;
	page: string;
	kind: 'choice' | 'order' | 'tone' | 'typePinyin' | 'readAloud' | 'freeAnswer';
	prompt: string;
	options?: string[];
	answer: string;
};
type Proto = {
	WORDS: {
		hz: string;
		py: string;
		hv: string;
		vi: string;
		say?: string[];
		chars?: string[][];
		parts?: string[][];
		ex: string[];
	}[];
	SENTENCES: Record<
		string,
		{ hz: string; py: string; vi: string; spoken?: string; speaker?: string }
	>;
	DIALOGUE: { title: string; lines: string[] }[];
	GRAMMAR: ProtoGrammar<string[]>;
	GRAMMAR2: ProtoGrammar<string[][]>;
};
type ProtoGrammar<P> = {
	title: string;
	pattern: P;
	explain: string;
	more: string;
	examples: string[];
	wrong: string[];
};
type Section = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const FX = fixture as FxQuestion[];
const sid = (s: string) => `s-h1-01-${s.slice(1)}`;
const flat = (s: string) => s.normalize('NFC').replace(/\s+/g, '');
const unmark = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.normalize('NFC');
const toneOf = (s: string) => {
	const mark = s.normalize('NFD').match(/[\u0304\u0301\u030c\u0300]/)?.[0];
	return mark ? ['\u0304', '\u0301', '\u030c', '\u0300'].indexOf(mark) + 1 : 0;
};
const sameSet = (a: string[] = [], b: string[] = []) =>
	[...a].sort().join('|') === [...b].sort().join('|');

function parity(b: Bundle, proto: Proto, fx: FxQuestion[]): string[] {
	const out: string[] = [];
	const check = (name: string, ok: boolean) => ok || out.push(name);
	const sentence = (id: string) => b.sentences.find((s) => s.id === id);
	const lesson = b.lesson.sections as unknown as Record<string, Section>;

	check(
		'words ids',
		JSON.stringify(lesson.words?.ids) === JSON.stringify(proto.WORDS.map((p) => p.hz))
	);

	for (const p of proto.WORDS) {
		const w = b.words.find((x) => x.hanzi === p.hz);
		if (!w) {
			out.push(`${p.hz} missing`);
			continue;
		}
		check(`${p.hz} py`, flat(w.pinyin) === flat(p.py));
		check(`${p.hz} hv`, w.hanviet === p.hv);
		check(`${p.hz} vi`, w.senses[0]?.vi === p.vi);
		check(`${p.hz} say`, !p.say || w.spoken === p.say[0] + p.say[1]);
		(p.chars ?? []).forEach(([hz, py, hv, vi], i) => {
			const part = w.parts?.[i];
			check(`${p.hz} chars[${i}] hanzi`, part?.hanzi === hz);
			check(`${p.hz} chars[${i}] hanviet`, part?.hanviet === hv);
			check(`${p.hz} chars[${i}] vi`, part?.vi === vi);
			const marked = py.normalize('NFD') !== unmark(py).normalize('NFD');
			check(
				`${p.hz} chars[${i}] pinyin`,
				marked ? part?.pinyin === py : unmark(part?.pinyin ?? '') === py
			);
		});
		(p.parts ?? []).forEach(([hz, name, vi], i) => {
			const c = w.components?.[i];
			check(`${p.hz} parts[${i}]`, c?.hanzi === hz && c?.name === name && c?.vi === vi);
		});
		const ex = sentence(w.examples?.[0] ?? '');
		check(`${p.hz} ex hanzi`, ex?.hanzi === p.ex[0]);
		check(`${p.hz} ex vi`, ex?.vi === p.ex[2]);
		check(`${p.hz} ex pinyin`, (p.say ? ex?.spoken : ex?.pinyin) === p.ex[1]);
		if (p.hz === '不客气') check(`${p.hz} ex citation`, ex?.pinyin === 'bù kèqi');
	}

	for (const [key, p] of Object.entries(proto.SENTENCES)) {
		const s = sentence(sid(key));
		check(`${key} hz`, s?.hanzi === p.hz);
		check(`${key} py`, s?.pinyin === p.py);
		check(`${key} vi`, s?.vi === p.vi);
		check(`${key} speaker`, s?.speaker === p.speaker);
		check(`${key} spoken`, !p.spoken || s?.spoken === p.spoken);
	}

	proto.DIALOGUE.forEach((d, i) => {
		const part = lesson.dialogue?.parts?.[i];
		check(`dialogue[${i}] title`, part?.title === d.title);
		check(`dialogue[${i}] lines`, JSON.stringify(part?.lines) === JSON.stringify(d.lines.map(sid)));
	});

	const points: [string, ProtoGrammar<unknown>, string][] = [
		['grammar', proto.GRAMMAR, proto.GRAMMAR.pattern.join(' + ')],
		['grammar2', proto.GRAMMAR2, proto.GRAMMAR2.pattern.map((p) => p.join(' → ')).join(' / ')]
	];
	points.forEach(([name, pg, pattern], i) => {
		const g = b.grammar[i];
		check(`${name} title`, g?.title === pg.title);
		check(`${name} pattern`, g?.pattern === pattern);
		check(`${name} explain`, g?.explain === `${pg.explain}\n\n${pg.more}`);
		check(`${name} examples`, JSON.stringify(g?.examples) === JSON.stringify(pg.examples.map(sid)));
		check(
			`${name} pitfall`,
			g?.pitfalls?.[0]?.wrong === pg.wrong[0] && g?.pitfalls?.[0]?.right === pg.wrong[1]
		);
	});

	const text = (ref: string) => sentence(ref)?.hanzi ?? b.words.find((w) => w.id === ref)?.hanzi;
	for (const f of fx) {
		const q = b.questions.find((x) => x.id === f.id);
		if (!q) {
			out.push(`${f.id} missing`);
			continue;
		}
		const name = (field: string) => `${f.id} ${field}`;
		const prompt =
			'prompt' in q
				? q.prompt.kind === 'vi'
					? q.prompt.text
					: q.prompt.kind === 'syllable'
						? ''
						: text(q.prompt.ref)
				: undefined;
		check(name('type'), q.type === f.kind);
		if (q.type === 'choice') {
			check(name('prompt'), prompt === f.prompt);
			check(name('options'), sameSet(q.options, f.options));
			check(name('answer'), q.options[q.answer] === f.answer);
		} else if (q.type === 'order') {
			const target = sentence(q.answer);
			check(name('prompt'), target?.vi === f.prompt);
			check(name('tiles'), sameSet(q.tiles, f.options));
			check(
				name('answer'),
				target?.hanzi.replace(/[！。]/g, '') === f.answer && sameSet(q.tiles, [...f.answer])
			);
		} else if (q.type === 'tone') {
			check(name('prompt'), prompt === f.prompt);
			check(name('answer'), q.answer === toneOf(f.answer) && q.syllable === 0);
		} else if (q.type === 'typePinyin') {
			check(name('prompt'), prompt === f.prompt);
			check(name('answer'), q.answer === f.answer);
		} else if (q.type === 'readAloud') {
			check(name('answer'), text(q.sentence) === f.answer);
		} else if (q.type === 'freeAnswer') {
			check(name('prompt'), prompt === f.prompt);
			check(
				name('rubric'),
				q.rubric.some((r) => r.includes(f.answer))
			);
		}
	}
	return out;
}

function coverage(b: Bundle, fx: FxQuestion[]): string[] {
	const lesson = b.lesson.sections as unknown as Record<string, Section>;
	const inBundle = (id: string) => b.sentences.some((s) => s.id === id);
	const table: { section: string; page: string; check: () => string[] }[] = [
		{
			section: 'Khởi động',
			page: 'l2-warmup.html',
			check: () => [
				...(JSON.stringify(lesson.warmup) === '{}' ? [] : ['warmup {}']),
				...['对不起', '谢谢', '没关系', '再见', '您', '不客气']
					.filter((id) => !lesson.words.ids.includes(id))
					.map((id) => `word ${id}`)
			]
		},
		{
			section: 'Từ mới',
			page: 'l3-words.html',
			check: () =>
				(lesson.words.ids as string[]).flatMap((id) => {
					const w = b.words.find((x) => x.id === id);
					if (!w) return [`${id} missing`];
					const gaps: [string, boolean][] = [
						['image.file', !!w.image?.file],
						['pinyin', !!w.pinyin],
						['hanviet', !!w.hanviet],
						['senses', w.senses.length >= 1],
						['parts|components', !!(w.parts?.length || w.components?.length)],
						['examples[0]', inBundle(w.examples?.[0] ?? '')]
					];
					return gaps.filter(([, ok]) => !ok).map(([f]) => `${id} ${f}`);
				})
		},
		{
			section: 'Ngữ pháp',
			page: 'l4-grammar.html',
			check: () => [
				...(JSON.stringify(b.grammar.map((g) => g.id)) === '["h1-g01","h1-g02"]'
					? []
					: ['grammar ids']),
				...(b.grammar.every((g) => g.examples.length === 2 && g.examples.every(inBundle))
					? []
					: ['examples']),
				...(lesson.grammar.drills.length === 6 ? [] : ['drills'])
			]
		},
		{
			section: 'Hội thoại',
			page: 'l5-dialogue.html',
			check: () => {
				const parts = lesson.dialogue.parts as { lines: string[] }[];
				return [
					...(parts.length === 2 && parts[0].lines.length === 4 && parts[1].lines.length === 3
						? []
						: ['parts']),
					...parts
						.flatMap((p) => p.lines)
						.filter((l) => !b.sentences.find((s) => s.id === l)?.speaker)
						.map((l) => `line ${l}`),
					...(lesson.dialogue.questions.length === 1 ? [] : ['questions'])
				];
			}
		},
		{
			section: 'Nghe nói',
			page: 'l6-listen.html',
			check: () =>
				sameSet(
					(lesson.listenSpeak.items as { type: string }[]).map((i, n) => `${n}${i.type}`),
					['tone', 'choice', 'choice', 'readAloud', 'freeAnswer', 'freeAnswer'].map(
						(t, n) => `${n}${t}`
					)
				)
					? []
					: ['items']
		},
		{
			section: 'Luyện viết',
			page: 'l7-writing.html',
			check: () => {
				const chars = lesson.writing.chars as string[];
				return [
					...(chars.join('') === '你好们' ? [] : ['chars']),
					...chars.filter((c) => {
						const e = b.chars.find((x) => x.hanzi === c);
						return !(e && e.strokes && e.readings.length >= 1);
					})
				];
			}
		},
		{
			section: 'Gate Test',
			page: 'l8-gate.html',
			check: () => [
				...(b.lesson.gate.pool.length === 22 ? [] : ['pool 22']),
				...(b.lesson.gate.draw === 10 ? [] : ['draw 10']),
				...fx
					.filter((f) => f.section === 'gate' && !b.lesson.gate.pool.some((q) => q.id === f.id))
					.map((f) => `pool ${f.id}`),
				...Object.entries(b.gateCoverage)
					.filter(([, ids]) => ids.length < 2)
					.map(([w]) => `gateCoverage ${w}`)
			]
		}
	];
	return table.flatMap((r) => r.check().map((gap) => `${r.section}: ${gap}`));
}

describe('h1-01 prototype parity', () => {
	let b: Bundle;
	let proto: Proto;

	beforeAll(async () => {
		vi.stubEnv('CHAIYO_VAULT', join(tmpdir(), 'no-such-vault'));
		proto = (await import(
			/* @vite-ignore */ pathToFileURL(resolve('prototype/data/h1-01.js')).href
		)) as Proto;
		const sink = createMemorySink();
		const r = await importContent('content', sink, { only: scopeFor('content', PRODUCTION_ROOTS) });
		if (!('sha' in r)) throw new Error(JSON.stringify(r.errors, null, 2));
		if (!sink.content) throw new Error('import wrote no content');
		b = buildBundle(sink.content, 'h1-01');
	}, 60_000);
	afterAll(() => vi.unstubAllEnvs());

	it('compares the full prototype surface', () => {
		expect([
			proto.WORDS.length,
			Object.keys(proto.SENTENCES).length,
			proto.DIALOGUE.length,
			FX.length
		]).toEqual([10, 9, 2, 22]);
	});
	it.each([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])('word %i matches', (i) => {
		const hz = proto.WORDS[i].hz;
		expect(parity(b, proto, FX).filter((m) => m.startsWith(`${hz} `))).toEqual([]);
	});
	it.each(['s01', 's02', 's03', 's04', 's05', 's06', 's07', 's08', 's09'])(
		'sentence %s matches',
		(key) => {
			expect(parity(b, proto, FX).filter((m) => m.startsWith(`${key} `))).toEqual([]);
		}
	);
	it.each(['dialogue', 'grammar'])('%s matches', (prefix) => {
		expect(parity(b, proto, FX).filter((m) => m.startsWith(prefix))).toEqual([]);
	});
	it('questions match: 6 drills, 1 dialogue, 5 listenSpeak, 10 gate', () => {
		expect(FX.map((f) => f.section)).toEqual([
			...Array(6).fill('grammar'),
			'dialogue',
			...Array(5).fill('listenSpeak'),
			...Array(10).fill('gate')
		]);
		expect(parity(b, proto, FX).filter((m) => m.startsWith('q-h1-01-'))).toEqual([]);
	});
	it('has no mismatch at all', () => {
		expect(parity(b, proto, FX)).toEqual([]);
	});
	it('negative control: changing 你 senses[0].vi is the only mismatch', () => {
		const clone = structuredClone(b);
		const ni = clone.words.find((w) => w.hanzi === '你');
		if (!ni) throw new Error('你 missing from bundle');
		ni.senses[0].vi = 'changed';
		expect(parity(clone, proto, FX)).toEqual(['你 vi']);
	});

	describe('section coverage', () => {
		it('has no gap in the 7 sections', () => {
			expect(coverage(b, FX)).toEqual([]);
		});
		it('negative control: an emptied gate pool fails only the Gate Test row', () => {
			const clone = structuredClone(b);
			clone.lesson.gate.pool = [];
			for (const id of Object.keys(clone.gateCoverage)) clone.gateCoverage[id] = [];
			const gaps = coverage(clone, FX);
			expect(gaps.length).toBeGreaterThan(0);
			expect(gaps.filter((g) => !g.startsWith('Gate Test: '))).toEqual([]);
		});
	});
});
