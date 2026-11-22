import type { Catalog } from '#lib/catalog/index.js';
import type { Step as ChoiceStep } from '#lib/lesson/steps/Choice.svelte';
import type { Step as VietStep } from '#lib/lesson/steps/Viet.svelte';
import type { Answer } from '#lib/lesson/types.js';
import type { Attempt, Skill } from '#lib/study/index.js';
import type { Card } from './Flashcard.svelte';
import { ngheStep } from './nghe';
import type { QueueItem } from './queue';

export type WordInfo = {
	pinyin: string;
	hanviet: string;
	nghia: string;
	audio: string;
	contentSha: string;
	example?: Card['example'];
};

export type RunItem = { kind: 'flashcard'; id: string; card: Card; again: boolean };

export type Headline = 'great' | 'ok' | 'hard';

export type Summary = {
	missed: number;
	scored: number;
	headline: Headline | null;
	skills: { skill: Skill; right: number; total: number }[];
	rows: { word: string; skill: Skill; missed: boolean }[];
};

const SKILLS: Skill[] = ['the', 'nghe', 'viet'];

const none = (): WordInfo => ({ pinyin: '', hanviet: '', nghia: '', audio: '', contentSha: '' });

export async function wordInfo(
	catalog: Pick<Catalog, 'find' | 'thin' | 'lesson'>,
	hanzi: string
): Promise<WordInfo> {
	try {
		const { word } = await catalog.find(hanzi);
		if (word) {
			const sense = word.senses.find((s) => !s.rare) ?? word.senses[0];
			return {
				pinyin: word.pinyin,
				hanviet: word.hanviet ?? '',
				nghia: sense?.vi ?? '',
				audio: word.audio ?? '',
				contentSha: word.contentSha ?? '',
				example: await exampleOf(catalog, word.taughtIn, sense?.example)
			};
		}
		const t = await catalog.thin(hanzi);
		if (t) return { ...none(), pinyin: t.pinyin, hanviet: t.hanviet, nghia: t.meaning };
	} catch {
		return none();
	}
	return none();
}

async function exampleOf(
	catalog: Pick<Catalog, 'lesson'>,
	lesson: string | undefined,
	id: string | undefined
): Promise<Card['example']> {
	if (!lesson || !id) return undefined;
	try {
		const s = (await catalog.lesson(lesson)).sentences.find((x) => x.id === id);
		return s && { hanzi: s.hanzi, pinyin: s.pinyin, vi: s.vi };
	} catch {
		return undefined;
	}
}

export function itemOf(
	item: QueueItem,
	info: WordInfo,
	pool: string[]
): RunItem | ChoiceStep | VietStep {
	if (item.skill === 'the')
		return {
			kind: 'flashcard',
			id: item.id,
			again: item.again,
			card: {
				hanzi: item.word,
				pinyin: info.pinyin,
				hanviet: info.hanviet,
				meaning: info.nghia,
				audio: info.audio,
				example: info.example
			}
		};
	if (item.skill === 'nghe')
		return ngheStep({ word: item.word, audio: info.audio, pool, again: item.again });
	return {
		kind: 'viet',
		id: item.id,
		word: item.word,
		pinyin: info.pinyin,
		nghia: info.nghia,
		again: item.again
	};
}

export const fromCard = (item: QueueItem, result: { remembered: boolean; ms: number }): Answer => ({
	questionId: item.id,
	pick: result.remembered ? 'nho' : 'quen',
	correct: result.remembered,
	ms: result.ms,
	card: { word: item.word, skill: 'the' }
});

export const toPracticeAttempt = (
	a: Answer | undefined,
	item: QueueItem,
	ctx: { run: string; of: number; contentSha: string },
	ids: { id: string; at: string }
): Attempt => ({
	id: ids.id,
	at: ids.at,
	questionId: item.id,
	contentSha: ctx.contentSha,
	correct: a?.correct ?? null,
	ms: a?.ms ?? 0,
	...(a?.pick == null ? {} : { answer: a.pick }),
	card: { word: item.word, skill: item.skill },
	step: { kind: 'practice', run: ctx.run, of: ctx.of }
});

export function summary(results: { item: QueueItem; correct: boolean | null }[]): Summary {
	const firsts = results.filter((r) => !r.item.again && r.correct !== null);
	const missed = firsts.filter((r) => r.correct === false).length;
	const rows = firsts.map((r) => ({
		word: r.item.word,
		skill: r.item.skill,
		missed: r.correct === false
	}));
	return {
		missed,
		scored: firsts.length,
		headline:
			firsts.length === 0
				? null
				: missed === 0
					? 'great'
					: missed * 2 < firsts.length
						? 'ok'
						: 'hard',
		skills: SKILLS.flatMap((skill) => {
			const of = firsts.filter((r) => r.item.skill === skill);
			return of.length === 0
				? []
				: [{ skill, right: of.filter((r) => r.correct).length, total: of.length }];
		}),
		rows: [...rows.filter((r) => r.missed), ...rows.filter((r) => !r.missed)]
	};
}
