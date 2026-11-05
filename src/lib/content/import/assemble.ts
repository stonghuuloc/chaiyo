import {
	bundleHanzi,
	deriveBacklinks,
	deriveHanViet,
	deriveSeg,
	gateCoverage,
	lessonWordEntries,
	resolveSpoken,
	thinEntries,
	type ThinEntry
} from '../derive';
import { audioManifest } from './audio';
import type { ContentSet, LintError } from '../lint';
import type { GrammarPoint, Lesson, Primer, Question, Sentence, Word } from '../schemas';
import type {
	ImportedContent,
	ImportedLesson,
	ImportedQuestion,
	ImportedSentence,
	ImportedWord
} from './sink';

const byKey =
	<T>(key: (x: T) => string) =>
	(a: T, b: T) =>
		key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0;

const isPrimer = (l: Lesson | Primer): l is Primer => 'kind' in l && l.kind === 'primer';

const role = (lessonId: string, r: ImportedQuestion['role'], qs: Question[]): ImportedQuestion[] =>
	qs.map((body) => ({ id: body.id, lessonId, role: r, body }));

export function bundleSentences(
	taught: Word[],
	points: GrammarPoint[],
	free: Iterable<ImportedSentence>
): ImportedSentence[] {
	const listed = new Set([
		...taught.flatMap((w) => [...w.examples, ...w.senses.flatMap((s) => s.example ?? [])]),
		...points.flatMap((g) => g.examples)
	]);
	return [...free].filter((s) => listed.has(s.id));
}

export function assemble(
	set: ContentSet,
	dictionary: ReadonlyMap<string, ThinEntry>
): { content: Omit<ImportedContent, 'sha'> } | { errors: LintError[] } {
	const { taughtIn, listedIn } = deriveBacklinks(set.lessons.map((l) => l.value));
	const charsByHanzi = Object.fromEntries(set.chars.map((c) => [c.value.hanzi, c.value]));
	const wordsById = new Map(set.words.map((w) => [w.value.id, w.value]));
	const grammarById = new Map(set.grammar.map((g) => [g.value.id, g.value]));
	const freeSentences = set.sentences.flatMap((s) => s.value);
	const errors: LintError[] = [];

	const words: ImportedWord[] = [];
	for (const { file, value } of set.words) {
		const derived = deriveHanViet(value, charsByHanzi);
		if ('missing' in derived) {
			errors.push({
				file,
				path: 'hanviet',
				check: 10,
				name: 'Derive',
				message: `cannot derive hanviet: no reading for ${derived.missing.join(' ')}`
			});
			continue;
		}
		const word: ImportedWord = {
			...value,
			spoken: resolveSpoken(value),
			hanviet: derived.hanviet,
			listedIn: listedIn[value.id] ?? []
		};
		if (taughtIn[value.id]) word.taughtIn = taughtIn[value.id];
		words.push(word);
	}
	if (errors.length) return { errors };

	const lessons: ImportedLesson[] = [];
	const sentences: ImportedSentence[] = [];
	const questions: ImportedQuestion[] = [];
	const free = new Map<string, ImportedSentence>(
		freeSentences.map((s: Sentence) => [
			s.id,
			{ ...s, spoken: resolveSpoken(s), seg: deriveSeg(s, new Set(), dictionary) }
		])
	);

	for (const { value: lesson } of set.lessons) {
		if (isPrimer(lesson)) {
			lessons.push({ ...lesson, gateCoverage: {}, thin: [] });
			for (const section of Object.values(lesson.sections))
				questions.push(...role(lesson.id, 'drill', section.drills));
			questions.push(...role(lesson.id, 'gate', lesson.gate.pool));
			continue;
		}
		const lessonEntries = lessonWordEntries(lesson, wordsById, charsByHanzi);
		const lessonWords = new Set(lessonEntries.keys());
		const own: ImportedSentence[] = lesson.sentences.map((s) => ({
			...s,
			lessonId: lesson.id,
			spoken: resolveSpoken(s),
			seg: deriveSeg(s, lessonWords, dictionary)
		}));
		const points = lesson.sections.grammar.ids.flatMap((id) => grammarById.get(id) ?? []);
		const taught = lesson.sections.words.ids.flatMap((id) => wordsById.get(id) ?? []);
		const shipped = [...own, ...bundleSentences(taught, points, free.values())];
		lessons.push({
			...lesson,
			gateCoverage: { ...gateCoverage(lesson) },
			thin: thinEntries(bundleHanzi(lesson, points, shipped), { lessonEntries, dict: dictionary })
		});
		sentences.push(...own);
		questions.push(
			...role(lesson.id, 'drill', lesson.sections.grammar.drills),
			...role(lesson.id, 'dialogue', lesson.sections.dialogue.questions),
			...role(lesson.id, 'listen', lesson.sections.listenSpeak.items),
			...role(lesson.id, 'gate', lesson.gate.pool)
		);
	}
	sentences.push(...free.values());

	const content: Omit<ImportedContent, 'sha' | 'audio'> = {
		lessons: lessons.sort(
			(a, b) => a.level - b.level || a.order - b.order || byKey<ImportedLesson>((x) => x.id)(a, b)
		),
		words: words.sort(byKey((w) => w.id)),
		sentences: sentences.sort(byKey((s) => s.id)),
		chars: set.chars.map((c) => c.value).sort(byKey((c) => c.hanzi)),
		grammar: set.grammar.map((g) => g.value).sort(byKey((g) => g.id)),
		questions: questions.sort(byKey((q) => q.id + '\0' + q.lessonId)),
		syllables: [...set.syllables].sort(byKey((s) => s.syllable))
	};
	return { content: { ...content, audio: audioManifest(content) } };
}
