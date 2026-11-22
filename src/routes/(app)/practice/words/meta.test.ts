import { describe, expect, it, vi } from 'vitest';
import { createCatalog, type Catalog, type CatalogSource } from '#lib/catalog/index.js';
import type { Bundle } from '#lib/content/import/bundle.js';
import type { ImportedWord } from '#lib/content/import/sink.js';
import { loadMeta } from './meta';

const sha = 'a'.repeat(64);

const word = (id: string, over: Partial<ImportedWord> = {}) =>
	({
		id,
		hanzi: id.split('-')[0],
		pinyin: `py-${id}`,
		hanviet: `hv-${id}`,
		senses: [{ vi: `vi-${id}` }],
		...over
	}) as ImportedWord;

const thin = (hanzi: string) => ({
	hanzi,
	pinyin: `tp-${hanzi}`,
	hanviet: `th-${hanzi}`,
	meaning: `tm-${hanzi}`
});

const stub = (o: Partial<Pick<Catalog, 'find' | 'thin'>>) =>
	({
		find: async () => ({ word: null, char: null }),
		thin: async () => null,
		...o
	}) as Pick<Catalog, 'find' | 'thin'>;

describe('loadMeta', () => {
	it('catalog word wins over thin', async () => {
		// Arrange
		const catalog = stub({
			find: async (h) => ({ word: word(h), char: null }),
			thin: async (h) => thin(h)
		});

		// Act
		const meta = await loadMeta(catalog, ['你'], new Map());

		// Assert
		expect(meta.get('你')).toEqual({ pinyin: 'py-你', hanViet: 'hv-你', nghia: 'vi-你' });
	});

	it('thin used when find returns null word', async () => {
		// Arrange
		const catalog = stub({ thin: async (h) => thin(h) });

		// Act
		const meta = await loadMeta(catalog, ['你'], new Map());

		// Assert
		expect(meta.get('你')).toEqual({ pinyin: 'tp-你', hanViet: 'th-你', nghia: 'tm-你' });
	});

	it('neither gives no entry', async () => {
		// Arrange
		const catalog = stub({});

		// Act
		const meta = await loadMeta(catalog, ['你'], new Map());

		// Assert
		expect(meta.has('你')).toBe(false);
	});

	it('nghia skips a rare first sense, falls back to the first sense, and hanViet defaults empty', async () => {
		// Arrange
		const rare = word('a', {
			hanviet: undefined,
			senses: [{ vi: 'hiếm', rare: true }, { vi: 'thường' }]
		});
		const onlyRare = word('b', { senses: [{ vi: 'hiếm', rare: true }] });
		const catalog = stub({
			find: async (h) => ({ word: h === 'a' ? rare : onlyRare, char: null })
		});

		// Act
		const meta = await loadMeta(catalog, ['a', 'b'], new Map());

		// Assert
		expect(meta.get('a')).toMatchObject({ nghia: 'thường', hanViet: '' });
		expect(meta.get('b')?.nghia).toBe('hiếm');
	});

	it('a word with no senses gives an empty nghia', async () => {
		// Arrange
		const catalog = stub({ find: async (h) => ({ word: word(h, { senses: [] }), char: null }) });

		// Act
		const meta = await loadMeta(catalog, ['x'], new Map());

		// Assert
		expect(meta.get('x')?.nghia).toBe('');
	});

	it('word id 都-du1 resolves through thin by hanzi 都', async () => {
		// Arrange
		const catalog = stub({
			find: async (h) => ({ word: h === '都-du1' ? word('都-du1') : null, char: null }),
			thin: async (h) => (h === '都' ? thin('都') : null)
		});

		// Act
		const meta = await loadMeta(catalog, ['都'], new Map());

		// Assert
		expect(meta.get('都')?.nghia).toBe('tm-都');
	});

	it('skips hanzi already known and does not call the catalog for them', async () => {
		// Arrange
		const find = vi.fn(async () => ({ word: null, char: null }));
		const known = new Map([['你', { pinyin: 'x', hanViet: 'y', nghia: 'z' }]]);

		// Act
		const meta = await loadMeta(stub({ find }), ['你'], known);

		// Assert
		expect(find).not.toHaveBeenCalled();
		expect(meta.size).toBe(0);
	});

	it('6 hanzi across 2 lessons call source.bundle twice', async () => {
		// Arrange
		const lessons: Record<string, string[]> = {
			'l-1': ['一', '二', '三'],
			'l-2': ['四', '五', '六']
		};
		const bundle = vi.fn(
			async (_: string, id: string) =>
				({
					sha,
					lesson: { id, sections: { words: { ids: lessons[id] } } },
					words: lessons[id].map((h) => word(h)),
					chars: [],
					sentences: [],
					grammar: [],
					questions: [],
					gateCoverage: {},
					thin: []
				}) as unknown as Bundle
		);
		const source: CatalogSource = { current: async () => sha, bundle };
		const teaches = (h: string) => Object.keys(lessons).find((id) => lessons[id].includes(h));
		const catalog = createCatalog(source, teaches);

		// Act
		const meta = await loadMeta(catalog, ['一', '四', '二', '五', '三', '六'], new Map());

		// Assert
		expect(meta.size).toBe(6);
		expect(bundle).toHaveBeenCalledTimes(2);
	});
});
