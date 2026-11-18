import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogError, createCatalog, type CatalogSource } from './index';
import { fixtureSource } from './fixtures/source';

const failure = async (p: Promise<unknown>): Promise<CatalogError> => {
	try {
		await p;
	} catch (e) {
		if (e instanceof CatalogError) return e;
		throw e;
	}
	throw new Error('expected rejection');
};

afterEach(() => vi.unstubAllGlobals());

describe('lesson', () => {
	it('returns the lesson with the bundle sha and words in section order', async () => {
		// Arrange
		const catalog = createCatalog(await fixtureSource());
		// Act
		const l = await catalog.lesson('h1-01');
		// Assert
		expect(l.contentSha).toMatch(/^[0-9a-f]{64}$/);
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
		expect(l.sentences).toHaveLength(20);
		expect(l.thin).toHaveLength(11);
	});

	it('returns no words for a Primer', async () => {
		const catalog = createCatalog(await fixtureSource());
		const l = await catalog.lesson('h0-00');
		expect(l.words).toEqual([]);
	});

	it('asks the source for a bundle once for repeated lesson calls', async () => {
		// Arrange
		const inner = await fixtureSource();
		const bundle = vi.fn(inner.bundle);
		const catalog = createCatalog({ ...inner, bundle });
		// Act
		await catalog.lesson('h1-01');
		await catalog.lesson('h1-01');
		// Assert
		expect(bundle).toHaveBeenCalledTimes(1);
	});

	it('refetches a loaded lesson when the content sha changes', async () => {
		// Arrange
		const inner = await fixtureSource();
		const sha = await inner.current();
		const next = 'a'.repeat(64);
		let now = sha;
		const bundle = vi.fn(async (_: string, id: string) => ({
			...(await inner.bundle(sha, id)),
			sha: now
		}));
		const catalog = createCatalog({ current: async () => now, bundle });
		// Act
		await catalog.lesson('h1-01');
		now = next;
		const l = await catalog.lesson('h1-01');
		// Assert
		expect(bundle).toHaveBeenCalledTimes(2);
		expect(l.contentSha).toBe(next);
	});

	it('drops bundles from an older sha when a newer one loads', async () => {
		// Arrange
		const inner = await fixtureSource();
		const shaA = await inner.current();
		const shaB = 'b'.repeat(64);
		const first = await inner.bundle(shaA, 'h1-01');
		let now = shaA;
		const source: CatalogSource = {
			current: async () => now,
			bundle: async (sha, id) => ({
				...(id === 'h1-02'
					? { ...first, lesson: { ...first.lesson, id: 'h1-02' } }
					: await inner.bundle(shaA, id)),
				sha
			})
		};
		const catalog = createCatalog(source);
		await catalog.lesson('h1-02');
		now = shaB;
		await catalog.lesson('h1-01');
		// Act
		const w = await catalog.word('你好');
		// Assert
		expect(w.contentSha).toBe(shaB);
	});

	it('keeps the newer sha when a load of an older sha finishes last', async () => {
		// Arrange
		const inner = await fixtureSource();
		const shaA = await inner.current();
		const shaB = 'b'.repeat(64);
		let now = shaA;
		let release = () => {};
		const gate = new Promise<void>((r) => {
			release = r;
		});
		const source: CatalogSource = {
			current: async () => now,
			bundle: async (sha, id) => {
				if (sha === shaA) await gate;
				return { ...(await inner.bundle(shaA, id)), sha };
			}
		};
		const catalog = createCatalog(source);
		const slow = catalog.lesson('h1-01');
		await new Promise((r) => setTimeout(r, 0));
		now = shaB;
		await catalog.lesson('h1-01');
		release();
		await slow;
		// Act
		const w = await catalog.word('你好');
		// Assert
		expect(w.contentSha).toBe(shaB);
	});

	it('keeps the loaded bundle for word reads', async () => {
		// Arrange
		const inner = await fixtureSource();
		const bundle = vi.fn(inner.bundle);
		const catalog = createCatalog({ ...inner, bundle });
		// Act
		await catalog.lesson('h1-01');
		await catalog.word('你好');
		// Assert
		expect(bundle).toHaveBeenCalledTimes(1);
	});

	it('throws not-found for an unknown lesson', async () => {
		const catalog = createCatalog(await fixtureSource());
		const e = await failure(catalog.lesson('h9-99'));
		expect(e).toBeInstanceOf(CatalogError);
		expect(e.code).toBe('not-found');
		expect(e.id).toBe('h9-99');
		expect(e.message).toContain('h9-99');
	});

	it('throws malformed when the bundle sha differs from the requested sha', async () => {
		const inner = await fixtureSource();
		const source: CatalogSource = {
			...inner,
			bundle: async (sha, id) => ({ ...(await inner.bundle(sha, id)), sha: 'f'.repeat(64) })
		};
		const e = await failure(createCatalog(source).lesson('h1-01'));
		expect(e.code).toBe('malformed');
		expect(e.id).toBe('h1-01');
	});

	it('throws malformed when the bundle holds another lesson', async () => {
		const inner = await fixtureSource();
		const source: CatalogSource = {
			...inner,
			bundle: async (sha) => inner.bundle(sha, 'h0-00')
		};
		const e = await failure(createCatalog(source).lesson('h1-01'));
		expect(e.code).toBe('malformed');
		expect(e.id).toBe('h1-01');
	});
});

describe('word and char', () => {
	it('returns a loaded word with its sha', async () => {
		const catalog = createCatalog(await fixtureSource());
		const l = await catalog.lesson('h1-01');
		const w = await catalog.word('你好');
		expect(w).toMatchObject({
			pinyin: 'nǐ hǎo',
			spoken: 'ní hǎo',
			hanviet: 'nhĩ hảo',
			listedIn: ['h1-01'],
			taughtIn: 'h1-01',
			contentSha: l.contentSha
		});
	});

	it('returns a loaded char with readings, strokes and sha', async () => {
		const catalog = createCatalog(await fixtureSource());
		const l = await catalog.lesson('h1-01');
		const c = await catalog.char('你');
		expect(c.readings).toEqual([expect.objectContaining({ pinyin: 'nǐ', hanviet: 'nhĩ' })]);
		expect(c.readings).toHaveLength(1);
		expect(c.strokes).toBe(7);
		expect(c.contentSha).toBe(l.contentSha);
	});

	it('throws not-found naming the id for a miss', async () => {
		const catalog = createCatalog(await fixtureSource());
		await catalog.lesson('h1-01');
		const w = await failure(catalog.word('不存在'));
		const c = await failure(catalog.char('𠀀'));
		expect([w.code, w.id]).toEqual(['not-found', '不存在']);
		expect([c.code, c.id]).toEqual(['not-found', '𠀀']);
		expect(w.message).toContain('不存在');
	});

	it('throws not-found before any lesson is loaded', async () => {
		const e = await failure(createCatalog(await fixtureSource()).word('你好'));
		expect(e.code).toBe('not-found');
	});

	it('searches every loaded bundle, not only the last', async () => {
		const catalog = createCatalog(await fixtureSource());
		await catalog.lesson('h1-01');
		await catalog.lesson('h0-00');
		expect((await catalog.word('你好')).taughtIn).toBe('h1-01');
	});
});

describe('lookup', () => {
	it('maps both chars of a token to that token, start at the token', async () => {
		const catalog = createCatalog(await fixtureSource());
		const l = await catalog.lesson('h1-01');
		for (const i of [0, 1]) {
			const hit = await catalog.lookup('s-h1-01-01', i);
			expect(hit).toMatchObject({
				hanzi: '你好',
				pinyin: 'nǐ hǎo',
				hanviet: 'nhĩ hảo',
				meaning: 'xin chào',
				contentSha: l.contentSha,
				sentenceId: 's-h1-01-01',
				start: 0
			});
		}
	});

	it('throws not-found for a non-integer tap', async () => {
		const catalog = createCatalog(await fixtureSource());
		await catalog.lesson('h1-01');
		const e = await failure(catalog.lookup('s-h1-01-01', 0.5));
		expect([e.code, e.id]).toEqual(['not-found', 's-h1-01-01:0.5']);
	});

	it('throws not-found on punctuation and past the end', async () => {
		const catalog = createCatalog(await fixtureSource());
		await catalog.lesson('h1-01');
		const p = await failure(catalog.lookup('s-h1-01-01', 2));
		const end = await failure(catalog.lookup('s-h1-01-01', 20));
		expect([p.code, p.id]).toEqual(['not-found', 's-h1-01-01:2']);
		expect([end.code, end.id]).toEqual(['not-found', 's-h1-01-01:20']);
	});

	it('throws not-found for a sentence in no loaded bundle', async () => {
		const catalog = createCatalog(await fixtureSource());
		await catalog.lesson('h1-01');
		const e = await failure(catalog.lookup('s-h9-99-01', 0));
		expect([e.code, e.id]).toEqual(['not-found', 's-h9-99-01']);
	});

	it('falls back to the char entry when the token has none', async () => {
		// Arrange
		const inner = await fixtureSource();
		const source: CatalogSource = {
			...inner,
			bundle: async (sha, id) => {
				const b = await inner.bundle(sha, id);
				return { ...b, thin: b.thin.filter((t) => t.hanzi !== '你好') };
			}
		};
		const catalog = createCatalog(source);
		await catalog.lesson('h1-01');
		// Act
		const hit = await catalog.lookup('s-h1-01-01', 1);
		// Assert
		expect(hit).toMatchObject({ hanzi: '好', start: 1 });
	});

	it('throws malformed when seg does not concatenate to hanzi', async () => {
		const inner = await fixtureSource();
		const source: CatalogSource = {
			...inner,
			bundle: async (sha, id) => {
				const b = await inner.bundle(sha, id);
				return {
					...b,
					sentences: b.sentences.map((s) => (s.id === 's-h1-01-01' ? { ...s, seg: ['你'] } : s))
				};
			}
		};
		const catalog = createCatalog(source);
		await catalog.lesson('h1-01');
		const e = await failure(catalog.lookup('s-h1-01-01', 1));
		expect([e.code, e.id]).toEqual(['malformed', 's-h1-01-01']);
	});
});

describe('no network', () => {
	it('never calls fetch across lesson, word, char and lookup', async () => {
		// Arrange
		const spy = vi.fn(() => {
			throw new Error('network');
		});
		vi.stubGlobal('fetch', spy);
		const catalog = createCatalog(await fixtureSource());
		// Act
		await catalog.lesson('h1-01');
		await catalog.word('你好');
		await catalog.char('你');
		await catalog.lookup('s-h1-01-01', 0);
		// Assert
		expect(spy).not.toHaveBeenCalled();
	});
});
