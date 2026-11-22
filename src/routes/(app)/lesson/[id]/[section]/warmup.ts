import type { LessonContent } from '#lib/catalog/index.js';
import type { ImportedWord } from '#lib/content/import/sink.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';
import { session, type Curriculum, type State } from '#lib/study/index.js';

const CARDS = 6;
const ROT = ['audio', 'mean', 'tone', 'rev'] as const;
type Type = (typeof ROT)[number];

const STEP_ID = /^wu-\d+-(.+)-(?:audio|tone|mean|rev)$/;

const TONE_MARKS = ['̄', '́', '̌', '̀'];

const shuffle = <T>(items: T[], random: () => number): T[] => {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
};

export const previousLessonId = (curriculum: Curriculum, lessonId: string): string | null => {
	const i = curriculum.lessons.findIndex((l) => l.id === lessonId);
	return i > 0 ? curriculum.lessons[i - 1].id : null;
};

export function warmupWords(state: State, lessonId: string, now: Date, tz: string): string[] {
	const prevId = previousLessonId(state.curriculum, lessonId);
	const prev = state.curriculum.lessons.find((l) => l.id === prevId);
	if (!prev) return [];
	const ids = prev.words.filter((w) => Object.hasOwn(state.lexicon, w));
	const due = session(state, { now, tz, only: ['the', 'nghe'] })
		.map((c) => c.word)
		.filter((w) => ids.includes(w));
	const answered = Object.values(state.runs)
		.filter(
			(r) =>
				!r.closed &&
				r.step.kind === 'section' &&
				r.step.lesson === lessonId &&
				r.step.section === 'warmup'
		)
		.flatMap((r) => Object.keys(r.answers))
		.map((id) => id.match(STEP_ID)?.[1])
		.filter((w): w is string => !!w && ids.includes(w));
	return [...new Set([...answered, ...due, ...ids])];
}

export function toneVariants(pinyin: string): string[] {
	const chars = [...pinyin.normalize('NFD')];
	const at = chars.findIndex((c) => TONE_MARKS.includes(c));
	if (at < 0) return [];
	return TONE_MARKS.filter((t) => t !== chars[at]).map((t) =>
		chars
			.map((c, i) => (i === at ? t : c))
			.join('')
			.normalize('NFC')
	);
}

const decoys = <T>(
	pool: ImportedWord[],
	key: (w: ImportedWord) => T,
	answer: T,
	random: () => number
) =>
	shuffle(
		[...new Set(pool.map(key))].filter((k) => k !== answer),
		random
	).slice(0, 3);

const typeFor = (
	want: Type,
	w: ImportedWord,
	pool: ImportedWord[],
	random: () => number
): { type: Type; options: string[]; answer: string } => {
	const hanzi = {
		type: 'rev' as const,
		options: shuffle([w.hanzi, ...decoys(pool, (x) => x.hanzi, w.hanzi, random)], random),
		answer: w.hanzi
	};
	const meaning = w.senses[0]?.vi ?? '';
	if (want === 'audio' && w.audio) return { ...hanzi, type: 'audio' };
	if (want === 'tone' && w.audio) {
		const said = w.spoken ?? w.pinyin;
		const variants = toneVariants(said);
		if (variants.length >= 3)
			return {
				type: 'tone',
				options: shuffle([said, ...variants.slice(0, 3)], random),
				answer: said
			};
	}
	if (want === 'mean' || want === 'audio') {
		const others = decoys(
			pool.filter((x) => x.senses[0]?.vi),
			(x) => x.senses[0].vi,
			meaning,
			random
		);
		if (meaning && others.length === 3)
			return { type: 'mean', options: shuffle([meaning, ...others], random), answer: meaning };
	}
	return hanzi;
};

const build = (
	type: Type,
	w: ImportedWord,
	o: { options: string[]; answer: string },
	extra: { id: string; ask: string }
): LessonStep => {
	const base = {
		kind: 'choice' as const,
		id: extra.id,
		ask: extra.ask,
		options: o.options,
		answer: o.answer,
		missHint: m.warmup_miss()
	};
	if (type === 'audio')
		return {
			...base,
			title: m.warmup_audio(),
			script: 'hanzi',
			audio: w.audio,
			card: { word: w.id, skill: 'nghe' }
		};
	if (type === 'tone')
		return {
			...base,
			title: m.warmup_tone(),
			script: 'text',
			audio: w.audio,
			card: { word: w.id, skill: 'nghe' }
		};
	if (type === 'mean')
		return {
			...base,
			title: m.warmup_mean(),
			script: 'text',
			prompt: { text: w.hanzi, hanzi: true },
			card: { word: w.id, skill: 'the' }
		};
	return {
		...base,
		title: m.warmup_rev(),
		script: 'hanzi',
		prompt: { text: w.senses[0]?.vi ?? '', hanzi: false },
		card: { word: w.id, skill: 'the' }
	};
};

export function warmupSteps(
	prev: LessonContent,
	picked: string[],
	random = Math.random
): LessonStep[] {
	const pool = prev.words;
	if (new Set(pool.map((w) => w.hanzi)).size < 4) return [];
	const words = picked.flatMap((id) => pool.filter((w) => w.id === id).slice(0, 1));
	if (words.length === 0) return [];
	const n = 'order' in prev.lesson ? prev.lesson.order : 0;
	return Array.from({ length: CARDS }, (_, i) => {
		const w = words[i % words.length];
		const card = typeFor(ROT[i % ROT.length], w, pool, random);
		return build(card.type, w, card, {
			id: `wu-${i}-${w.id}-${card.type}`,
			ask: i === 0 ? m.warmup_first({ n }) : m.warmup_kicker({ n })
		});
	});
}

export function warmupScore(before: Set<string>, state: State, lessonId: string): number {
	const run = Object.entries(state.runs).find(
		([id, r]) =>
			!before.has(id) &&
			r.closed &&
			r.step.kind === 'section' &&
			r.step.lesson === lessonId &&
			r.step.section === 'warmup'
	);
	return run ? Object.values(run[1].answers).filter(Boolean).length : 0;
}
