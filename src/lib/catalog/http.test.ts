import { describe, expect, it } from 'vitest';
import { fakeFetch } from './fixtures/http';
import { httpSource } from './http';
import { CatalogError, createCatalog } from './index';

const rejection = async (p: Promise<unknown>): Promise<CatalogError> => {
	try {
		await p;
	} catch (e) {
		if (e instanceof CatalogError) return e;
		throw e;
	}
	throw new Error('expected rejection');
};

const load = async (overrides?: Parameters<typeof fakeFetch>[0]) =>
	createCatalog(httpSource((await fakeFetch(overrides)).fetch));

describe('httpSource', () => {
	it('Given_HttpSource_When_LessonH1_01_Then_XinChao_Level1_TenWords_Sha', async () => {
		// Arrange
		const f = await fakeFetch();
		// Act
		const l = await createCatalog(httpSource(f.fetch)).lesson('h1-01');
		// Assert
		expect(l.lesson.title).toBe('Xin chào');
		expect(l.lesson.level).toBe(1);
		expect(l.words.map((w) => w.id)).toEqual([
			'你',
			'好',
			'您',
			'你们',
			'你好',
			'对不起',
			'没关系',
			'谢谢',
			'不客气',
			'再见'
		]);
		expect(l.contentSha).toMatch(/^[0-9a-f]{64}$/);
		expect(f.urls).toEqual(['/content/current.json', `/content/${f.sha}/h1-01.json`]);
	});

	it('Given_HttpSource_When_BundleFetchRejects_Then_Offline_NamingId', async () => {
		// Arrange
		const { sha } = await fakeFetch();
		const catalog = await load({
			[`/content/${sha}/h1-01.json`]: () => Promise.reject(new TypeError('offline'))
		});
		// Act
		const e = await rejection(catalog.lesson('h1-01'));
		// Assert
		expect(e).toBeInstanceOf(CatalogError);
		expect(e.code).toBe('offline');
		expect(e.id).toBe('h1-01');
	});

	it('Given_HttpSource_When_Bundle404_Then_NotFound_NamingId', async () => {
		// Act
		const e = await rejection((await load()).lesson('h9-99'));
		// Assert
		expect(e).toBeInstanceOf(CatalogError);
		expect(e.code).toBe('not-found');
		expect(e.id).toBe('h9-99');
	});

	it('Given_HttpSource_When_Bundle500_Then_Malformed', async () => {
		// Arrange
		const { sha } = await fakeFetch();
		const catalog = await load({
			[`/content/${sha}/h1-01.json`]: () => new Response('boom', { status: 500 })
		});
		// Act
		const e = await rejection(catalog.lesson('h1-01'));
		// Assert
		expect(e.code).toBe('malformed');
		expect(e.id).toBe('h1-01');
	});

	it('Given_HttpSource_When_BodyNotJson_Then_Malformed', async () => {
		// Arrange
		const { sha } = await fakeFetch();
		const catalog = await load({
			[`/content/${sha}/h1-01.json`]: () => new Response('not json', { status: 200 })
		});
		// Act
		const e = await rejection(catalog.lesson('h1-01'));
		// Assert
		expect(e.code).toBe('malformed');
		expect(e.id).toBe('h1-01');
	});

	it('Given_HttpSource_When_BundleBodyNull_Then_Malformed_NamingId', async () => {
		// Arrange
		const { sha } = await fakeFetch();
		const catalog = await load({ [`/content/${sha}/h1-01.json`]: () => Response.json(null) });
		// Act
		const e = await rejection(catalog.lesson('h1-01'));
		// Assert
		expect(e.code).toBe('malformed');
		expect(e.id).toBe('h1-01');
	});

	it('Given_HttpSource_When_BundleHasNoLesson_Then_Malformed_NamingId', async () => {
		// Arrange
		const { sha } = await fakeFetch();
		const catalog = await load({ [`/content/${sha}/h1-01.json`]: () => Response.json({ sha }) });
		// Act
		const e = await rejection(catalog.lesson('h1-01'));
		// Assert
		expect(e.code).toBe('malformed');
		expect(e.id).toBe('h1-01');
	});

	it('Given_HttpSource_When_LessonHasNoSections_Then_Malformed_NamingId', async () => {
		// Arrange
		const { sha } = await fakeFetch();
		const catalog = await load({
			[`/content/${sha}/h1-01.json`]: () => Response.json({ sha, lesson: { id: 'h1-01' } })
		});
		// Act
		const e = await rejection(catalog.lesson('h1-01'));
		// Assert
		expect(e.code).toBe('malformed');
		expect(e.id).toBe('h1-01');
	});

	it('Given_HttpSource_When_BundleHasNoWords_Then_Malformed_NamingId', async () => {
		// Arrange
		const { sha } = await fakeFetch();
		const catalog = await load({
			[`/content/${sha}/h1-01.json`]: () =>
				Response.json({ sha, lesson: { id: 'h1-01', sections: { words: { ids: [] } } } })
		});
		// Act
		const e = await rejection(catalog.lesson('h1-01'));
		// Assert
		expect(e.code).toBe('malformed');
		expect(e.id).toBe('h1-01');
	});

	it('Given_HttpSource_When_WordsSectionHasNoIds_Then_Malformed_NamingId', async () => {
		// Arrange
		const { sha } = await fakeFetch();
		const good = await (
			await fakeFetch()
		)
			.fetch(`/content/${sha}/h1-01.json`)
			.then((r) => r.json());
		const catalog = await load({
			[`/content/${sha}/h1-01.json`]: () =>
				Response.json({
					...good,
					lesson: { ...good.lesson, sections: { ...good.lesson.sections, words: {} } }
				})
		});
		// Act
		const e = await rejection(catalog.lesson('h1-01'));
		// Assert
		expect(e.code).toBe('malformed');
		expect(e.id).toBe('h1-01');
	});

	it('Given_HttpSource_When_PrimerHasNoWordsSection_Then_EmptyWords', async () => {
		// Act
		const l = await (await load()).lesson('h0-00');
		// Assert
		expect(l.lesson.id).toBe('h0-00');
		expect(l.words).toEqual([]);
	});

	it.each([
		['NullWord', (b: Record<string, unknown>) => ({ ...b, words: [null] })],
		['NullChar', (b: Record<string, unknown>) => ({ ...b, chars: [null] })],
		['NullThin', (b: Record<string, unknown>) => ({ ...b, thin: [null] })],
		[
			'SentenceSegNotStrings',
			(b: Record<string, unknown>) => ({ ...b, sentences: [{ id: 's', hanzi: '你', seg: [1] }] })
		]
	])('Given_HttpSource_When_Bundle%s_Then_Malformed_NamingId', async (_, mutate) => {
		// Arrange
		const { sha } = await fakeFetch();
		const good = await (
			await fakeFetch()
		)
			.fetch(`/content/${sha}/h1-01.json`)
			.then((r) => r.json());
		const catalog = await load({
			[`/content/${sha}/h1-01.json`]: () => Response.json(mutate(good))
		});
		// Act
		const e = await rejection(catalog.lesson('h1-01'));
		// Assert
		expect(e.code).toBe('malformed');
		expect(e.id).toBe('h1-01');
	});

	it('Given_HttpSource_When_CurrentShaNotHex_Then_Malformed_Current', async () => {
		// Arrange
		const f = await fakeFetch({
			'/content/current.json': () => Response.json({ sha: 'abc' })
		});
		const catalog = createCatalog(httpSource(f.fetch));
		// Act
		const e = await rejection(catalog.lesson('h1-01'));
		// Assert
		expect(e.code).toBe('malformed');
		expect(e.id).toBe('current');
		expect(f.urls.length).toBe(1);
	});

	it('Given_HttpSource_When_CurrentRejects_Then_Offline_Current', async () => {
		// Arrange
		const catalog = await load({
			'/content/current.json': () => Promise.reject(new TypeError('offline'))
		});
		// Act
		const e = await rejection(catalog.lesson('h1-01'));
		// Assert
		expect(e.code).toBe('offline');
		expect(e.id).toBe('current');
	});
});
