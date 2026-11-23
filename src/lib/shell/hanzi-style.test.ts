import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyHanziStyle, bootHanziStyle, HANZI_KEY } from './hanzi-style';

const fakeDoc = () => ({ documentElement: { dataset: {} as DOMStringMap } });
const fakeStore = (initial: Record<string, string> = {}) => {
	const data = { ...initial };
	return {
		data,
		getItem: (k: string) => data[k] ?? null,
		setItem: (k: string, v: string) => void (data[k] = v),
		removeItem: (k: string) => void delete data[k]
	};
};

describe('applyHanziStyle', () => {
	it('Given_Xing_When_Apply_Then_AttributeAndCache', () => {
		const doc = fakeDoc();
		const store = fakeStore();
		applyHanziStyle('xing', doc, store);
		expect(doc.documentElement.dataset.hanzi).toBe('xing');
		expect(store.data[HANZI_KEY]).toBe('xing');
	});

	it('Given_Kai_When_Apply_Then_NoAttributeNoCache', () => {
		const doc = fakeDoc();
		doc.documentElement.dataset.hanzi = 'xing';
		const store = fakeStore({ [HANZI_KEY]: 'xing' });
		applyHanziStyle('kai', doc, store);
		expect(doc.documentElement.dataset.hanzi).toBeUndefined();
		expect(store.data[HANZI_KEY]).toBeUndefined();
	});

	it('Given_StorageThrows_When_Apply_Then_AttributeStillSet', () => {
		const doc = fakeDoc();
		const store = {
			getItem: () => null,
			setItem: () => {
				throw new Error('denied');
			},
			removeItem: () => {
				throw new Error('denied');
			}
		};
		applyHanziStyle('xing', doc, store);
		expect(doc.documentElement.dataset.hanzi).toBe('xing');
	});
});

describe('bootHanziStyle', () => {
	it('Given_CacheXing_When_Boot_Then_AppliedBeforeRead', async () => {
		const doc = fakeDoc();
		const store = fakeStore({ [HANZI_KEY]: 'xing' });
		let seen: string | undefined;
		await bootHanziStyle({
			doc,
			storage: store,
			read: async () => {
				seen = doc.documentElement.dataset.hanzi;
				return null;
			}
		});
		expect(seen).toBe('xing');
		expect(doc.documentElement.dataset.hanzi).toBe('xing');
	});

	it('Given_AccountKai_When_Boot_Then_AccountWins', async () => {
		const doc = fakeDoc();
		const store = fakeStore({ [HANZI_KEY]: 'xing' });
		await bootHanziStyle({ doc, storage: store, read: async () => 'kai' });
		expect(doc.documentElement.dataset.hanzi).toBeUndefined();
		expect(store.data[HANZI_KEY]).toBeUndefined();
	});

	it('Given_ReadRejects_When_Boot_Then_CacheKept', async () => {
		const doc = fakeDoc();
		const store = fakeStore({ [HANZI_KEY]: 'xing' });
		await bootHanziStyle({
			doc,
			storage: store,
			read: async () => {
				throw new Error('offline');
			}
		});
		expect(doc.documentElement.dataset.hanzi).toBe('xing');
		expect(store.data[HANZI_KEY]).toBe('xing');
	});
});

describe('layout.css', () => {
	it('Given_LayoutCss_Then_BodyOverrideAndKaishuCapture', () => {
		const css = readFileSync('src/routes/layout.css', 'utf8');
		expect(css).toMatch(/:root\s*\{\s*--font-hanzi-kaishu:\s*var\(--font-hanzi\);/);
		expect(css).toMatch(
			/:root\[data-hanzi='xing'\]\s+body\s*\{\s*--font-hanzi:\s*var\(--font-hanzi-xingshu\);/
		);
	});
});
