import type { LessonContent } from '#lib/catalog/index.js';
import type { Question } from '#lib/content/schemas.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';
import { shuffle } from '#lib/placement/shuffle.js';
import { promptClip, promptWord } from '../[section]/listen-speak';

const refOf = (prompt: object) => ('ref' in prompt ? String(prompt.ref) : '');
const textOf = (prompt: object) => ('text' in prompt ? String(prompt.text) : refOf(prompt));
const bare = (hanzi: string) => hanzi.replace(/[\p{P}\s]/gu, '');

function gateStep(q: Question, c: LessonContent): LessonStep | null {
	switch (q.type) {
		case 'choice': {
			const script: 'hanzi' | 'text' = q.optionKind === 'hanzi' ? 'hanzi' : 'text';
			const base = { kind: 'choice' as const, id: q.id, options: q.options, script };
			const answer = q.options[q.answer];
			if (q.prompt.kind === 'audio') {
				const audio = promptClip(c, q.prompt.ref);
				if (!audio) return null;
				const ask = script === 'hanzi' ? m.listen_word_ask() : m.listen_meaning_ask();
				return { ...base, ask, title: '', answer, audio };
			}
			const ask = script === 'hanzi' ? m.gate_hanzi_ask() : m.gate_meaning_ask();
			return { ...base, ask, title: textOf(q.prompt), answer };
		}
		case 'order': {
			const s = c.sentences.find((x) => x.id === q.answer);
			if (!s) return null;
			return {
				kind: 'order',
				id: q.id,
				ask: m.gate_order_ask(),
				title: s.vi,
				tiles: q.tiles,
				answer: bare(s.hanzi)
			};
		}
		case 'tone': {
			const ref = refOf(q.prompt);
			const audio = promptClip(c, ref);
			if (!audio) return null;
			const word = promptWord(c, ref);
			const pinyin = word ? (word.spoken ?? word.pinyin) : ref;
			return {
				kind: 'tone',
				id: q.id,
				ask: m.listen_tone_ask(),
				audio,
				answer: q.answer,
				syllable: pinyin.split(/\s+/)[q.syllable] ?? pinyin
			};
		}
		case 'trueFalse': {
			const options = [m.gate_true(), m.gate_false()];
			return {
				kind: 'choice',
				id: q.id,
				ask: m.gate_true_false_ask(),
				title: q.statement,
				options,
				answer: options[q.answer ? 0 : 1],
				script: 'text'
			};
		}
		case 'typePinyin': {
			const hanzi = refOf(q.prompt);
			return {
				kind: 'pinyin',
				id: q.id,
				ask: m.gate_pinyin_ask(),
				title: promptWord(c, hanzi)?.senses[0]?.vi ?? '',
				hanzi,
				answer: q.answer
			};
		}
		default:
			return null;
	}
}

export function gateSteps(c: LessonContent, random: () => number = Math.random): LessonStep[] {
	if ('kind' in c.lesson) return [];
	const { pool, draw } = c.lesson.gate;
	const steps = pool.map((q) => gateStep(q, c)).filter((s) => s !== null);
	return shuffle(steps, random).slice(0, draw);
}
