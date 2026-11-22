import { m } from '#lib/paraglide/messages.js';
import type { LessonContent } from '#lib/catalog/index.js';
import type { Question } from '#lib/content/schemas.js';
import type { ImportedSentence } from '#lib/content/import/sink.js';
import type { LessonStep } from '#lib/lesson/steps.js';

// `A → B / C → D` lists reply pairs; `slots → slots` is one sentence turned into another.
const rowsOf = (pattern: string) =>
	!pattern.includes('→')
		? [pattern.split(' + ')]
		: pattern.includes(' + ')
			? pattern.split(' → ').map((side) => side.split(' + '))
			: pattern.split(' / ').map((pair) => pair.split(' → '));

const bare = (hanzi: string) => hanzi.replace(/[\p{P}\s]/gu, '');

const findSentence = (sentences: ImportedSentence[], id: string): ImportedSentence => {
	const s = sentences.find((x) => x.id === id);
	if (!s) throw new Error(`no sentence ${id}`);
	return s;
};

const exampleOf = (sentences: ImportedSentence[], id: string) => {
	const s = findSentence(sentences, id);
	return {
		id: s.id,
		hanzi: s.hanzi,
		pinyin: s.pinyin,
		vi: s.vi,
		...(s.audio ? { audio: s.audio } : {})
	};
};

const supported = (d: Question) =>
	(d.type === 'choice' && d.prompt.kind === 'vi') || d.type === 'order';

const drillStep = (d: Question, ask: string, sentences: ImportedSentence[]): LessonStep => {
	if (d.type === 'choice' && d.prompt.kind === 'vi')
		return {
			kind: 'choice',
			id: d.id,
			ask,
			title: d.prompt.text,
			options: d.options,
			answer: d.options[d.answer]
		};
	if (d.type === 'order') {
		const s = findSentence(sentences, d.answer);
		return { kind: 'order', id: d.id, ask, title: s.vi, tiles: d.tiles, answer: bare(s.hanzi) };
	}
	throw new Error(`unsupported drill ${d.id}`);
};

export function grammarSteps(c: LessonContent): LessonStep[] {
	if ('kind' in c.lesson) return [];
	const { ids, drills } = c.lesson.sections.grammar;
	const steps: LessonStep[] = [];

	ids.forEach((gid, i) => {
		const g = c.grammar.find((x) => x.id === gid);
		if (!g) throw new Error(`no grammar point ${gid}`);
		// A drill testing several points shows once, under the first of them in lesson order.
		const mine = drills.filter(
			(d) => supported(d) && ids.find((id) => d.tests.grammar?.includes(id)) === gid
		);
		const [lead, ...rest] = g.explain.split('\n\n');

		steps.push({
			kind: 'grammar',
			id: g.id,
			kicker: m.grammar_point({ n: i + 1, of: ids.length }),
			title: g.title,
			rows: rowsOf(g.pattern),
			labels: g.labels ?? [],
			lead,
			more: rest.join('\n\n'),
			examples: g.examples.map((id) => exampleOf(c.sentences, id)),
			...(g.pitfalls?.[0] ? { pitfall: g.pitfalls[0] } : {}),
			drills: mine.length
		});

		mine.forEach((d, j) => {
			steps.push(drillStep(d, m.grammar_drill({ n: j + 1, of: mine.length }), c.sentences));
		});
	});

	return steps;
}
