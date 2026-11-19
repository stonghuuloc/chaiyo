import type { ThinEntry } from '../content/derive/dictionary';
import type { Bundle } from '../content/import/bundle';
import type { ImportedSentence, ImportedWord } from '../content/import/sink';
import type { Char, GrammarPoint, Lesson, Primer, Question } from '../content/schemas';

export type CatalogSource = {
	current(): Promise<string>;
	bundle(sha: string, lessonId: string): Promise<Bundle>;
};

export type CatalogErrorCode = 'not-found' | 'offline' | 'malformed';

export class CatalogError extends Error {
	constructor(
		readonly code: CatalogErrorCode,
		readonly id: string
	) {
		super(`${code}: ${id}`);
	}
}

export type LessonContent = {
	contentSha: string;
	lesson: Lesson | Primer;
	words: ImportedWord[];
	chars: Char[];
	sentences: ImportedSentence[];
	grammar: GrammarPoint[];
	questions: Question[];
	gateCoverage: Record<string, string[]>;
	thin: ThinEntry[];
};

export type CatalogWord = ImportedWord & { contentSha?: string };
export type CatalogChar = Char & { contentSha?: string };
export type LookupHit = ThinEntry & { contentSha?: string; sentenceId: string; start: number };

export type Catalog = {
	lesson(id: string): Promise<LessonContent>;
	word(id: string): Promise<CatalogWord>;
	char(hanzi: string): Promise<CatalogChar>;
	lookup(sentenceId: string, tapIndex: number): Promise<LookupHit>;
};

const toLessonContent = (b: Bundle): LessonContent => {
	const lesson = b.lesson;
	const words =
		'words' in lesson.sections
			? lesson.sections.words.ids.flatMap((id) => b.words.filter((w) => w.id === id))
			: [];
	return {
		contentSha: b.sha,
		lesson,
		words,
		chars: b.chars,
		sentences: b.sentences,
		grammar: b.grammar,
		questions: b.questions,
		gateCoverage: b.gateCoverage,
		thin: b.thin
	};
};

const tokenAt = (seg: string[], index: number): { token: string; start: number } | undefined => {
	if (!Number.isInteger(index)) return undefined;
	let start = 0;
	for (const token of seg) {
		const end = start + [...token].length;
		if (index >= start && index < end) return { token, start };
		start = end;
	}
	return undefined;
};

export function createCatalog(source: CatalogSource): Catalog {
	const loaded = new Map<string, Bundle>();
	// The sha read by the most recently started lesson() call. current() answers can arrive out of
	// order, so a call sets it only if no later-started call has already set it.
	let started = 0;
	let newest = 0;
	let latest = '';

	const find = <T>(pick: (b: Bundle) => T | undefined): { hit: T; sha: string } | undefined => {
		for (const b of loaded.values()) {
			const hit = pick(b);
			if (hit !== undefined) return { hit, sha: b.sha };
		}
		return undefined;
	};

	return {
		async lesson(id) {
			const ticket = ++started;
			const sha = await source.current();
			if (ticket > newest) {
				newest = ticket;
				latest = sha;
			}
			const cached = loaded.get(id);
			if (cached?.sha === sha) return toLessonContent(cached);
			const bundle = await source.bundle(sha, id);
			if (bundle.sha !== sha || bundle.lesson.id !== id) throw new CatalogError('malformed', id);
			if (sha === latest) {
				for (const [key, b] of loaded) if (b.sha !== sha) loaded.delete(key);
				loaded.set(id, bundle);
			}
			return toLessonContent(bundle);
		},
		async word(id) {
			const f = find((b) => b.words.find((w) => w.id === id));
			if (!f) throw new CatalogError('not-found', id);
			return { ...f.hit, contentSha: f.sha };
		},
		async char(hanzi) {
			const f = find((b) => b.chars.find((c) => c.hanzi === hanzi));
			if (!f) throw new CatalogError('not-found', hanzi);
			return { ...f.hit, contentSha: f.sha };
		},
		async lookup(sentenceId, tapIndex) {
			const f = find((b) => {
				const s = b.sentences.find((x) => x.id === sentenceId);
				return s && { bundle: b, sentence: s };
			});
			if (!f) throw new CatalogError('not-found', sentenceId);
			const { bundle, sentence } = f.hit;
			if (sentence.seg.join('') !== sentence.hanzi) throw new CatalogError('malformed', sentenceId);
			const miss = new CatalogError('not-found', `${sentenceId}:${tapIndex}`);
			const tok = tokenAt(sentence.seg, tapIndex);
			if (!tok) throw miss;
			const whole = bundle.thin.find((t) => t.hanzi === tok.token);
			if (whole) return { ...whole, contentSha: bundle.sha, sentenceId, start: tok.start };
			const ch = [...sentence.hanzi][tapIndex];
			const part = bundle.thin.find((t) => t.hanzi === ch);
			if (!part) throw miss;
			return { ...part, contentSha: bundle.sha, sentenceId, start: tapIndex };
		}
	};
}
