import { describe, expect, it, vi } from 'vitest';
import type { ImportedWord } from '#lib/content/import/sink.js';
import type { ReportContext } from '#lib/report/types.js';

const sha = 'a'.repeat(64);

const word: ImportedWord = {
	id: '都-du1',
	hanzi: '都',
	pinyin: 'dū',
	level: 1,
	pos: ['adv'],
	senses: [{ vi: 'đều' }],
	examples: [],
	listedIn: ['h1-01'],
	taughtIn: 'h1-01'
};

vi.mock('#lib/catalog/app.js', () => ({
	catalog: {
		word: async (id: string) => {
			if (id !== word.id) throw new Error(`unexpected word ${id}`);
			return { ...word, contentSha: sha };
		},
		lesson: async (id: string) => {
			if (id !== 'h1-01') throw new Error(`unexpected lesson ${id}`);
			return { sha, lesson: { id, title: 'Xin chào' }, words: [word], sentences: [] };
		}
	}
}));

describe('word page load', () => {
	it('Given_WordIdDiffersFromHanzi_When_Load_Then_ReportWordIsTheWordId', async () => {
		// Arrange
		const { load } = await import('./+page');

		// Act
		const data = (await load({
			params: { id: '都-du1' },
			url: new URL('http://localhost/word/都-du1')
		} as never)) as { report: ReportContext | null };

		// Assert
		expect(data.report).toEqual({ lesson: null, step: null, word: '都-du1', contentSha: sha });
	});
});
