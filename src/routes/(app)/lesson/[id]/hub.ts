import type { LessonContent } from '#lib/catalog/index.js';
import { m } from '#lib/paraglide/messages.js';
import type { State } from '#lib/study/index.js';

export type Look = 'done' | 'now' | 'todo';
export type Row = { id: string; name: string; look: Look; pct: number; sub: string };
export type Hub = {
	kicker: string;
	title: string;
	hanzi: string;
	meta: string;
	done: number;
	total: number;
	progress: string;
	rows: Row[];
	cta: { section: string; label: string } | null;
};

const MINUTES_PER_WORD = 7;

const names: Record<string, () => string> = {
	words: m.hub_section_words,
	grammar: m.hub_section_grammar,
	dialogue: m.hub_section_dialogue,
	listenSpeak: m.hub_section_listenSpeak,
	writing: m.hub_section_writing
};

type Open = { answers: Record<string, boolean>; of: number };

const openRun = (state: State, lesson: string, section: string) =>
	Object.values(state.runs)
		.flatMap(({ step, answers, closed }): Open[] =>
			!closed &&
			step.kind === 'section' &&
			step.lesson === lesson &&
			step.section === section &&
			Object.keys(answers).length < step.of
				? [{ answers, of: step.of }]
				: []
		)
		.reduce<Open | undefined>(
			(best, cur) =>
				!best || Object.keys(cur.answers).length > Object.keys(best.answers).length ? cur : best,
			undefined
		);

export function hubView(content: LessonContent, sections: string[], state: State): Hub {
	const l = content.lesson;
	const done = state.lessons[l.id]?.done ?? [];
	const words = content.words;

	const row = (id: string): Row => {
		const name = names[id]?.() ?? id;
		const run = openRun(state, l.id, id);
		let look: Look = done.includes(id) ? 'done' : run ? 'now' : 'todo';
		let pct = look === 'done' ? 100 : 0;
		let sub = '';
		if (!('topic' in l)) return { id, name, look, pct, sub };
		const s = l.sections;
		if (id === 'words') {
			const answered = run ? words.filter((w) => Object.hasOwn(run.answers, w.id)) : [];
			const next = words.find((w) => !answered.includes(w));
			if (look === 'now' && answered.length > 0 && next) {
				pct = Math.round((answered.length / words.length) * 100);
				sub = m.hub_words_now({ n: answered.length, total: words.length, word: next.hanzi });
			} else {
				if (look === 'now') look = 'todo';
				sub = m.hub_words_todo({ n: words.length });
			}
			return { id, name, look, pct, sub };
		}
		if (look === 'now' && run) pct = Math.round((Object.keys(run.answers).length / run.of) * 100);
		if (id === 'grammar') sub = content.grammar.find((g) => g.id === s.grammar.ids[0])?.title ?? '';
		if (id === 'dialogue')
			sub = m.hub_dialogue({
				parts: s.dialogue.parts.length,
				lines: s.dialogue.parts.reduce((n, p) => n + p.lines.length, 0)
			});
		if (id === 'listenSpeak') sub = m.hub_listen({ n: s.listenSpeak.items.length });
		if (id === 'writing') sub = m.hub_writing({ chars: s.writing.chars.join(' ') });
		return { id, name, look, pct, sub };
	};

	const rows = sections.map(row);
	const count = rows.filter((r) => r.look === 'done').length;
	const now = rows.find((r) => r.look === 'now');
	const todo = rows.find((r) => r.look !== 'done');
	const cta = now
		? { section: now.id, label: m.hub_resume({ name: now.name }) }
		: todo
			? { section: todo.id, label: m.hub_start({ name: todo.name }) }
			: null;

	return {
		kicker: 'topic' in l ? m.hub_kicker({ level: l.level, topic: l.topic, order: l.order }) : '',
		title: l.title,
		hanzi: l.titleHanzi,
		meta:
			'topic' in l
				? m.hub_meta({
						words: words.length,
						grammar: l.sections.grammar.ids.length,
						min: words.length * MINUTES_PER_WORD
					})
				: '',
		done: count,
		total: sections.length,
		progress: m.hub_progress({ done: count, total: sections.length }),
		rows,
		cta
	};
}
