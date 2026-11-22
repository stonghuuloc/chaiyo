import type { LessonContent } from '#lib/catalog/index.js';
import type { Question } from '#lib/content/schemas.js';
import { toneOf } from '#lib/lesson/pinyin.js';
import type { Chip } from '#lib/lesson/steps/Card.svelte';
import type { LessonStep } from '#lib/lesson/steps.js';
import { m } from '#lib/paraglide/messages.js';
import type { State } from '#lib/study/index.js';

type Source = string | { say: string; hanzi?: string };

export function drillStep(c: LessonContent, d: Question): LessonStep {
	if (d.type !== 'choice') throw new Error(`unsupported Primer drill ${d.id}`);
	const heard = d.prompt.kind === 'syllable' ? (d.prompt.spoken ?? d.prompt.text) : null;
	const answer = d.options[d.answer];
	const tone = toneOf(answer) ?? (heard ? toneOf(heard) : null);
	return {
		kind: 'choice',
		id: d.id,
		ask: d.ask ?? (heard ? m.primer_drill_ask() : m.primer_gate_ask_read()),
		title: d.prompt.kind === 'vi' ? d.prompt.text : '',
		options: d.options,
		answer,
		script: 'pinyin',
		...(d.why ? { explain: d.why } : {}),
		...(heard && c.clips?.[heard] ? { audio: c.clips[heard] } : {}),
		...(tone ? { tone } : {})
	};
}

export function primerSteps(c: LessonContent, section: string): LessonStep[] {
	const { lesson } = c;
	if (!('kind' in lesson) || !Object.hasOwn(lesson.sections, section)) return [];
	const { cards, drills } = lesson.sections[section as keyof typeof lesson.sections];
	const chip = (x: Source): Chip => {
		const text = typeof x === 'string' ? x : x.say;
		const hanzi = typeof x === 'string' ? undefined : x.hanzi;
		return { text, ...(hanzi ? { hanzi } : {}), key: c.clips?.[text] ?? null };
	};

	const steps: LessonStep[] = cards.map((card, i) => ({
		kind: 'card',
		id: `${lesson.id}-${section}-card-${i}`,
		kicker: `${i + 1}/${cards.length}`,
		title: card.title,
		explain: card.explain,
		chips: card.syllables.map(chip),
		pairs: (card.pairs ?? []).map(([a, b]) => [chip(a), chip(b)])
	}));

	for (const d of drills) steps.push(drillStep(c, d));
	return steps;
}

const sectionRuns = (state: State, lesson: string, section: string) =>
	Object.entries(state.runs).filter(
		([, r]) => r.step.kind === 'section' && r.step.lesson === lesson && r.step.section === section
	);

export const closedRuns = (state: State, lesson: string, section: string): Set<string> =>
	new Set(
		sectionRuns(state, lesson, section)
			.filter(([, r]) => r.closed)
			.map(([id]) => id)
	);

export function primerScore(
	state: State,
	before: Set<string>,
	lesson: string,
	section: string,
	drillIds: string[]
): { n: number; total: number } {
	const run = sectionRuns(state, lesson, section).find(
		([id, r]) => r.closed && !before.has(id)
	)?.[1];
	return { n: drillIds.filter((id) => run?.answers[id] === true).length, total: drillIds.length };
}
