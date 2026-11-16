import { CatalogError, type Catalog, type LessonContent } from '#lib/catalog/index.js';
import type { ImportedSentence, ImportedWord } from '#lib/content/import/sink.js';
import type { Sentence, Word } from '#lib/content/schemas.js';

type Pos = Word['pos'][number];

export type ExampleSource = { kind: 'ai' } | { kind: 'tatoeba'; url: string };

export type WordViewExample = {
	hanzi: string;
	pinyin: string;
	vi: string;
	source: ExampleSource | null;
};

export type WordView = {
	hanzi: string;
	pinyin: string;
	hanviet?: string;
	groups: { pos: Pos; senses: { vi: string; rare: boolean; example: WordViewExample | null }[] }[];
	rare: number;
};

const TATOEBA = /^tatoeba:(\d+)$/;

const exampleSource = (source: Sentence['source']): ExampleSource | null => {
	if (!source) return null;
	if (source === 'ai') return { kind: 'ai' };
	const id = TATOEBA.exec(source)?.[1];
	return id ? { kind: 'tatoeba', url: `https://tatoeba.org/vi/sentences/show/${id}` } : null;
};

export function wordView(word: ImportedWord, sentences: ImportedSentence[]): WordView {
	const byId = new Map(sentences.map((s) => [s.id, s]));
	const tagged = word.senses.some((s) => s.pos);
	const shown = tagged ? word.senses.filter((s) => s.pos) : word.senses;
	const groups: WordView['groups'] = [];
	for (const sense of shown) {
		const pos = sense.pos ?? word.pos[0];
		if (!pos) continue;
		let group = groups.find((g) => g.pos === pos);
		if (!group) groups.push((group = { pos, senses: [] }));
		const id = sense.example ?? (tagged ? undefined : word.examples[0]);
		const s = id ? byId.get(id) : undefined;
		group.senses.push({
			vi: sense.vi,
			rare: sense.rare === true,
			example: s
				? { hanzi: s.hanzi, pinyin: s.pinyin, vi: s.vi, source: exampleSource(s.source) }
				: null
		});
	}
	const all = groups.flatMap((g) => g.senses);
	return {
		hanzi: word.hanzi,
		pinyin: word.pinyin,
		hanviet: word.hanviet,
		groups,
		rare: all.filter((s) => s.rare).length
	};
}

const lessonOrNull = async (catalog: Catalog, id: string): Promise<LessonContent | null> => {
	try {
		return await catalog.lesson(id);
	} catch (e) {
		if (e instanceof CatalogError && (e.code === 'not-found' || e.code === 'malformed'))
			return null;
		throw e;
	}
};

export async function loadWord(
	catalog: Catalog,
	id: string,
	lesson: string | null
): Promise<WordView | { notFound: true }> {
	const content = lesson ? await lessonOrNull(catalog, lesson) : null;
	let word: ImportedWord;
	try {
		word = await catalog.word(id);
	} catch (e) {
		if (e instanceof CatalogError && e.code === 'not-found') return { notFound: true };
		throw e;
	}
	if (content?.words.some((w) => w.id === id)) return wordView(word, content.sentences);
	const from = word.taughtIn;
	if (!from) return { notFound: true };
	const taught = from === lesson && content ? content : await lessonOrNull(catalog, from);
	if (!taught) return { notFound: true };
	return wordView(word, taught.sentences);
}
