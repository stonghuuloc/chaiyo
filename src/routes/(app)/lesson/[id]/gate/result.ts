import type { LessonContent } from '#lib/catalog/index.js';
import { LESSONS } from '#lib/curriculum/index.js';
import type { Answer, LessonStep } from '#lib/lesson/index.js';
import { toMarks } from '#lib/lesson/pinyin.js';
import { m } from '#lib/paraglide/messages.js';
import type { StudyEvent } from '#lib/study/index.js';
import { bare } from './gate';

type ResultInput = { lesson: string; answers: Answer[]; events: StudyEvent[]; best: number };

export function resultView(i: ResultInput) {
	const of = i.answers.length;
	const right = i.answers.filter((a) => a.correct).length;
	const pass = right * 100 >= 80 * of;
	const at = LESSONS.findIndex((l) => l.id === i.lesson);
	const next = at < 0 ? undefined : LESSONS[at + 1];
	const nOf = (id: string) => LESSONS.find((l) => l.id === id)?.n ?? 0;
	const parts = i.events.flatMap((e) => {
		if (e.type === 'LessonUnlocked') return [m.gate_result_unlocked({ n: nOf(e.lesson) })];
		if (e.type === 'DayCounted') return [m.gate_result_streak()];
		return [];
	});
	return {
		pct: Math.floor((right * 100) / of),
		right,
		of,
		pass,
		best: i.best,
		n: LESSONS[at]?.n ?? 0,
		primer: LESSONS[at]?.testOut === true,
		next: next ? { id: next.id, n: next.n } : null,
		line: pass ? parts.join(' · ') || null : m.gate_result_fail({ n: next?.n ?? 0 }),
		art: pass ? 'b1-pass' : 'b1-fail'
	};
}

export type ResultView = ReturnType<typeof resultView>;

type Entry = { pinyin: string; spoken?: string; vi?: string };
export type Lookup = Map<string, Entry>;
type Seg = { text: string; bold: boolean };
export type ReviewRow = {
	id: string;
	prompt: string;
	pick: string;
	right: string;
	pinyin: Seg[] | null;
};

export function pinyinLookup(c: Pick<LessonContent, 'words' | 'sentences'>): Lookup {
	const map: Lookup = new Map();
	for (const w of c.words)
		map.set(bare(w.hanzi), { pinyin: w.pinyin, spoken: w.spoken, vi: w.senses[0]?.vi });
	for (const s of c.sentences)
		if (!map.has(bare(s.hanzi))) map.set(bare(s.hanzi), { pinyin: s.pinyin });
	return map;
}

const plain = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[\u0300\u0301\u030C\u0304]/g, '')
		.normalize('NFC');
const flat = (text: string): Seg[] => [{ text, bold: false }];

function row(step: LessonStep, pick: string, lookup: Lookup): ReviewRow | null {
	switch (step.kind) {
		case 'choice': {
			const base = { id: step.id, prompt: step.title || step.ask, pick, right: step.answer };
			if (step.options.join() === [m.gate_true(), m.gate_false()].join()) {
				const han = step.title.match(/\p{Script=Han}+/u)?.[0] ?? '';
				const e = lookup.get(han);
				const gloss = e && `${han} ${e.pinyin}${e.vi ? ` = ${e.vi}` : ''}`;
				return { ...base, pinyin: gloss ? flat(gloss) : null };
			}
			const e = lookup.get(bare(step.answer));
			return { ...base, pinyin: e ? flat(e.pinyin) : null };
		}
		case 'order': {
			const e = lookup.get(step.answer);
			return {
				id: step.id,
				prompt: step.title,
				pick,
				right: step.answer,
				pinyin: e ? flat(e.pinyin) : null
			};
		}
		case 'pinyin':
			return {
				id: step.id,
				prompt: `${step.hanzi} · ${step.title}`,
				pick,
				right: step.answer,
				pinyin: null
			};
		case 'tone': {
			const e = lookup.get(bare(step.hanzi));
			const syllables = e ? (e.spoken ?? e.pinyin).split(/\s+/) : null;
			return {
				id: step.id,
				prompt: step.hanzi,
				pick: toMarks(plain(step.syllable) + pick),
				right: step.hanzi,
				pinyin: syllables?.map((text, i) => ({ text, bold: i === step.target })) ?? null
			};
		}
		default:
			return null;
	}
}

export function reviewRows(steps: LessonStep[], answers: Answer[], lookup: Lookup): ReviewRow[] {
	const byId = new Map(answers.map((a) => [a.questionId, a]));
	return steps.flatMap((s) => {
		const a = byId.get(s.id);
		if (a?.correct !== false) return [];
		return row(s, a.pick ?? '', lookup) ?? [];
	});
}
