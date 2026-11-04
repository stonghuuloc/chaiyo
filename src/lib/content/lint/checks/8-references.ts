import type { Lesson, Primer, Question } from '../../schemas';
import { CAST } from '../types';
import type { ContentSet, LintError, LintRefs } from '../types';
import { issue, pathOf, stripTones } from '../util';

type Path = (string | number)[];

const SECTIONS = ['tones', 'finals', 'initials', 'spelling', 'sandhi'] as const;
const PATTERN_SPLIT = /[\s/+()（）\[\]［］，。、；：？！]+/;

export const references = (set: ContentSet, refs: LintRefs): LintError[] => {
	const errors: LintError[] = [];
	const add = (file: string, path: Path, message: string) =>
		errors.push(issue(8, file, pathOf(path), message));

	const wordIds = new Set(set.words.map((w) => w.value.id));
	const grammarIds = new Set(set.grammar.map((g) => g.value.id));
	const sentenceIds = new Set<string>();
	const seen = (file: string, path: Path, id: string) => {
		if (sentenceIds.has(id)) add(file, path, `Duplicate sentence id ${id}`);
		sentenceIds.add(id);
	};
	for (const { file, value } of set.lessons)
		if (!('kind' in value))
			value.sentences.forEach((s, i) => seen(file, ['sentences', i, 'id'], s.id));
	for (const { file, value } of set.sentences) value.forEach((s, i) => seen(file, [i, 'id'], s.id));

	const need = (file: string, path: Path, id: string, known: Set<string>, what: string) => {
		if (!known.has(id)) add(file, path, `Unknown ${what} id ${id}`);
	};
	const cast = (file: string, path: Path, list: string[] | undefined) =>
		list?.forEach((c, i) => {
			if (!CAST.includes(c)) add(file, [...path, i], `Unknown Cast id ${c}`);
		});

	const question = (file: string, base: Path, q: Question) => {
		q.tests.words?.forEach((id, i) =>
			need(file, [...base, 'tests', 'words', i], id, wordIds, 'word')
		);
		q.tests.grammar?.forEach((id, i) =>
			need(file, [...base, 'tests', 'grammar', i], id, grammarIds, 'grammar')
		);
		if ('prompt' in q && q.prompt.kind !== 'vi' && q.prompt.kind !== 'syllable') {
			const { ref } = q.prompt;
			if (!wordIds.has(ref) && !sentenceIds.has(ref))
				add(file, [...base, 'prompt', 'ref'], `Unknown word or sentence id ${ref}`);
		}
		if (q.type === 'fill' || q.type === 'readAloud')
			need(file, [...base, 'sentence'], q.sentence, sentenceIds, 'sentence');
		if (q.type === 'order') need(file, [...base, 'answer'], q.answer, sentenceIds, 'sentence');
	};

	const pool = (file: string, lesson: Lesson | Primer) => {
		const { pool: questions, draw } = lesson.gate;
		questions.forEach((q, i) => question(file, ['gate', 'pool', i], q));
		if (questions.length < 2 * draw)
			add(
				file,
				['gate', 'pool'],
				`Gate pool has ${questions.length} questions, needs at least ${2 * draw} (2 × draw ${draw})`
			);
	};

	const primer = (file: string, p: Primer) => {
		cast(file, ['scene', 'cast'], p.scene.cast);
		const rows = new Set(set.syllables.map((r) => r.syllable));
		for (const name of SECTIONS) {
			const section = p.sections[name];
			if (!section.drills.length)
				add(file, ['sections', name, 'drills'], `Section ${name} has no drill`);
			section.drills.forEach((q, i) => question(file, ['sections', name, 'drills', i], q));
			const chip = (path: Path, entry: string | { say: string }) => {
				const text = typeof entry === 'string' ? entry : entry.say;
				for (const piece of stripTones(text).split(' ').filter(Boolean))
					if (!rows.has(piece))
						add(
							file,
							typeof entry === 'string' ? path : [...path, 'say'],
							`Syllable "${piece}" is not a row of syllables.yaml`
						);
			};
			section.cards.forEach((card, c) => {
				const base = ['sections', name, 'cards', c];
				card.syllables.forEach((e, i) => chip([...base, 'syllables', i], e));
				card.pairs?.forEach((pair, i) => pair.forEach((e, j) => chip([...base, 'pairs', i, j], e)));
			});
		}
		p.gate.pool.forEach((q, i) => {
			if (!q.section) add(file, ['gate', 'pool', i, 'section'], 'Pool question has no section');
		});
		const covered = new Set(p.gate.pool.map((q) => q.section));
		for (const name of SECTIONS)
			if (!covered.has(name))
				add(file, ['gate', 'pool'], `Gate pool has no question for section ${name}`);
		pool(file, p);
	};

	const lessonRefs = (file: string, l: Lesson) => {
		const { sections } = l;
		cast(file, ['scene', 'cast'], l.scene.cast);
		sections.words.ids.forEach((id, i) =>
			need(file, ['sections', 'words', 'ids', i], id, wordIds, 'word')
		);
		sections.grammar.ids.forEach((id, i) =>
			need(file, ['sections', 'grammar', 'ids', i], id, grammarIds, 'grammar')
		);
		sections.dialogue.parts.forEach((part, p) =>
			part.lines.forEach((id, i) =>
				need(file, ['sections', 'dialogue', 'parts', p, 'lines', i], id, sentenceIds, 'sentence')
			)
		);
		sections.reading?.lines.forEach((id, i) =>
			need(file, ['sections', 'reading', 'lines', i], id, sentenceIds, 'sentence')
		);
		sections.warmup.extra?.forEach((id, i) =>
			need(file, ['sections', 'warmup', 'extra', i], id, sentenceIds, 'sentence')
		);
		sections.grammar.drills.forEach((q, i) =>
			question(file, ['sections', 'grammar', 'drills', i], q)
		);
		sections.dialogue.questions.forEach((q, i) =>
			question(file, ['sections', 'dialogue', 'questions', i], q)
		);
		sections.listenSpeak.items.forEach((q, i) =>
			question(file, ['sections', 'listenSpeak', 'items', i], q)
		);
		pool(file, l);

		const ids = sections.words.ids;
		if (ids.length < 8 || ids.length > 15)
			add(file, ['sections', 'words', 'ids'], `Lesson has ${ids.length} words, needs 8 to 15`);

		const tested = new Set(l.gate.pool.flatMap((q) => q.tests.words ?? []));
		ids.forEach((id, i) => {
			if (!tested.has(id))
				add(
					file,
					['sections', 'words', 'ids', i],
					`Word ${id} is not tested by any gate pool question`
				);
		});

		const points = set.grammar.filter((g) => sections.grammar.ids.includes(g.value.id));
		const tokens = new Set(points.flatMap((g) => g.value.pattern.split(PATTERN_SPLIT)));
		const taught = new Set(
			[
				...sections.grammar.drills,
				...sections.dialogue.questions,
				...sections.listenSpeak.items
			].flatMap((q) => q.tests.words ?? [])
		);
		const hanziOf = new Map(set.words.map((w) => [w.value.id, w.value.hanzi]));
		ids.forEach((id, i) => {
			const hanzi = hanziOf.get(id);
			if (!hanzi || [...hanzi].length !== 1) return;
			const inside = ids.some((o) => o !== id && hanziOf.get(o)?.includes(hanzi));
			if (inside && !tokens.has(hanzi) && !taught.has(id))
				add(
					file,
					['sections', 'words', 'ids', i],
					`Single char ${hanzi} sits inside another word but is neither a grammar pattern token nor tested by a drill, dialogue or listenSpeak question`
				);
		});

		const stds = points.flatMap((g) => g.value.std);
		if (stds.length && !stds.some((n) => refs.syllabus.get(n) === l.level))
			add(file, ['sections', 'grammar', 'ids'], `No grammar std item at lesson level ${l.level}`);
	};

	for (const { file, value } of set.lessons) {
		if ('kind' in value) primer(file, value);
		else lessonRefs(file, value);
	}
	for (const { file, value } of set.words) {
		value.examples.forEach((id, i) => need(file, ['examples', i], id, sentenceIds, 'sentence'));
		value.senses.forEach((s, i) => {
			if (s.example) need(file, ['senses', i, 'example'], s.example, sentenceIds, 'sentence');
		});
		cast(file, ['image', 'cast'], value.image?.cast);
	}
	for (const { file, value } of set.grammar) {
		value.examples.forEach((id, i) => need(file, ['examples', i], id, sentenceIds, 'sentence'));
		value.std.forEach((n, i) => {
			const level = refs.syllabus.get(n);
			if (level === undefined)
				add(file, ['std', i], `Grammar item ${n} is not in hsk30-grammar.csv`);
			else if (level > value.level)
				add(file, ['std', i], `Grammar item ${n} is level ${level}, above level ${value.level}`);
		});
	}
	return errors;
};
