import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CURRICULUM } from '#lib/curriculum/index.js';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState, type State } from '#lib/study/index.js';
import Page from './+page.svelte';

const catalogCalls = vi.hoisted(() => ({ find: [] as string[], fail: false }));

vi.mock('#lib/catalog/app.js', () => ({
	catalog: {
		find: async (hanzi: string) => {
			catalogCalls.find.push(hanzi);
			if (catalogCalls.fail) throw new Error('offline');
			return { word: null, char: null };
		},
		thin: async (hanzi: string) => ({
			hanzi,
			pinyin: `py-${hanzi}`,
			hanviet: '',
			meaning: `nghia-${hanzi}`
		})
	}
}));

const withWords = (words: string[]): State => ({
	...initialState({ curriculum: CURRICULUM }),
	lexicon: Object.fromEntries(words.map((w) => [w, { saved: false, cards: {} }]))
});

let current = withWords([]);
const listeners = new Set<(s: State) => void>();
const ledger = {
	state: () => current,
	subscribe: (fn: (s: State) => void) => (listeners.add(fn), () => listeners.delete(fn))
} as unknown as Ledger;
const publish = (s: State) => {
	current = s;
	for (const fn of listeners) fn(s);
};

const gate = vi.hoisted(() => ({ next: null as Promise<unknown> | null }));
const nav = vi.hoisted(() => ({ snapshot: vi.fn() }));

vi.mock('$app/navigation', () => nav);
vi.mock('#lib/learner/index.js', () => ({
	learnerLedger: async () => (gate.next ? gate.next : ledger)
}));

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	for (let i = 0; i < 5; i++) {
		await new Promise((r) => setTimeout(r, 0));
		await tick();
	}
	flushSync();
};

const mountPage = async (session: { user: { id: string } } | null) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target, props: { data: { session } } as never }) as Record<string, unknown>;
	await settle();
	return target;
};

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	app = target = undefined;
	catalogCalls.find.length = 0;
	catalogCalls.fail = false;
	listeners.clear();
	gate.next = null;
	nav.snapshot.mockClear();
});

describe('practice words page', () => {
	it('a ledger with 30 entries renders "30 từ đã học và đã lưu"', async () => {
		// Arrange
		current = withWords(Array.from({ length: 30 }, (_, i) => `字${i}`));

		// Act
		const el = await mountPage({ user: { id: 'u1' } });

		// Assert
		expect(el.textContent).toContain('30 từ đã học và đã lưu');
		expect(el.textContent).toContain('py-字0');
		expect(el.querySelector('h1')?.textContent).toBe('Từ của tôi');
	});

	it('no session renders Chưa có từ nào and Học Bài 1', async () => {
		// Arrange
		current = withWords(['你']);

		// Act
		const el = await mountPage(null);

		// Assert
		expect(el.textContent).toContain('Chưa có từ nào');
		expect(el.textContent).toContain('Học Bài 1');
		expect(catalogCalls.find).toEqual([]);
	});

	it('saving a word after mount adds a row and loads only that hanzi', async () => {
		// Arrange
		current = withWords(['你']);
		const el = await mountPage({ user: { id: 'u1' } });
		expect(catalogCalls.find).toEqual(['你']);

		// Act
		publish(withWords(['你', '好']));
		await settle();

		// Assert
		expect(el.textContent).toContain('2 từ đã học và đã lưu');
		expect(catalogCalls.find).toEqual(['你', '好']);
	});

	it('a loadMeta failure still renders hanzi rows', async () => {
		// Arrange
		current = withWords(['你']);
		catalogCalls.fail = true;

		// Act
		const el = await mountPage({ user: { id: 'u1' } });

		// Assert
		expect(el.textContent).toContain('1 từ đã học và đã lưu');
		expect(el.querySelector('[lang="zh"]')?.textContent).toBe('你');
	});

	it('a held ledger renders neither the empty state nor rows, then 30 rows after resolve', async () => {
		// Arrange
		current = withWords(Array.from({ length: 30 }, (_, i) => `字${i}`));
		let release: (l: Ledger) => void = () => {};
		gate.next = new Promise<Ledger>((r) => (release = r));

		// Act
		const el = await mountPage({ user: { id: 'u1' } });

		// Assert
		expect(el.textContent).not.toContain('Chưa có từ nào');
		expect(el.querySelectorAll('li')).toHaveLength(0);
		release(ledger);
		await settle();
		expect(el.querySelectorAll('li')).toHaveLength(30);
		expect(el.textContent).not.toContain('Chưa có từ nào');
	});

	it('a rejected ledger renders the empty state', async () => {
		// Arrange
		gate.next = Promise.reject(new Error('offline'));

		// Act
		const el = await mountPage({ user: { id: 'u1' } });

		// Assert
		expect(el.textContent).toContain('Chưa có từ nào');
	});

	it('snapshot capture returns the typed query and restore("hoc") refilters', async () => {
		// Arrange
		current = withWords(['学生', '你']);
		const el = await mountPage({ user: { id: 'u1' } });
		const { capture, restore } = nav.snapshot.mock.calls[0][0] as {
			capture: () => string;
			restore: (v: string) => void;
		};
		const input = el.querySelector('input')!;

		// Act
		input.value = '你';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		flushSync();
		const captured = capture();
		restore('学');
		flushSync();

		// Assert
		expect(captured).toBe('你');
		expect([...el.querySelectorAll('li [lang="zh"]')].map((x) => x.textContent)).toEqual(['学生']);
	});
});
