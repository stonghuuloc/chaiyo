import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
	lesson: vi.fn(),
	url: new URL('http://localhost/dev/primer-gate')
}));
vi.mock('$app/state', () => ({ page: { url: hoisted.url } }));
vi.mock('#lib/catalog/app.js', () => ({ catalog: { lesson: hoisted.lesson } }));

const { default: Page } = await import('./+page.svelte');

const SECTIONS = ['tones', 'finals', 'initials', 'spelling', 'sandhi'];
const pool = SECTIONS.flatMap((section) =>
	['mā', 'má', 'mǎ'].map((answer, n) => ({
		id: `g-${section}-${n}`,
		type: 'choice',
		section,
		tests: {},
		prompt: { kind: 'vi', text: `${section} ${n}` },
		optionKind: 'pinyin',
		options: ['mā', 'má', 'mǎ', 'mà'],
		answer: n,
		why: answer
	}))
);

const content = {
	contentSha: 'sha-1',
	lesson: {
		kind: 'primer',
		id: 'h0-00',
		title: 'Nhập môn',
		sections: {},
		gate: { pool, draw: 10 }
	},
	words: [],
	chars: [],
	sentences: [],
	grammar: [],
	questions: [],
	gateCoverage: {},
	thin: []
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

beforeEach(() => {
	vi.stubGlobal('indexedDB', new IDBFactory());
	hoisted.lesson.mockReset();
	hoisted.lesson.mockResolvedValue(content);
	hoisted.url.search = '?seed=1';
});

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	vi.unstubAllGlobals();
});

const mountPage = async () => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target }) as Record<string, unknown>;
	flushSync();
	const root = target;
	await vi.waitFor(() =>
		expect(root.querySelector<HTMLButtonElement>('[data-part="answer-9"]')?.disabled).toBe(false)
	);
	return root;
};

const part = (root: HTMLElement, p: string) =>
	root.querySelector<HTMLElement>(`[data-part="${p}"]`);
const total = (root: HTMLElement) =>
	Object.values(
		JSON.parse(part(root, 'tones')!.textContent!) as Record<string, { total: number }>
	).reduce((n, t) => n + t.total, 0);

describe('/dev/primer-gate', () => {
	it('Given_Answer9_When_Clicked_Then_CheerAndTonesTotal10', async () => {
		// Arrange
		const root = await mountPage();

		// Act
		part(root, 'answer-9')!.click();
		await vi.waitFor(() => expect(part(root, 'cheer')).not.toBe(null));

		// Assert
		expect(part(root, 'cheer')!.textContent).toContain('Chaiyo!');
		expect(part(root, 'pct')!.textContent).toBe('90%');
		expect(total(root)).toBe(10);
		expect(part(root, 'lexicon')!.textContent).toBe('0');
	});

	it('Given_Answer7_When_Clicked_Then_FailCopyLexicon0', async () => {
		// Arrange
		const root = await mountPage();

		// Act
		part(root, 'answer-7')!.click();
		await vi.waitFor(() => expect(part(root, 'pct')).not.toBe(null));

		// Assert
		expect(part(root, 'cheer')).toBe(null);
		expect(part(root, 'line')!.textContent).toContain('Gần được rồi. Cần 80% để mở Bài 1.');
		expect(total(root)).toBe(10);
		expect(part(root, 'lexicon')!.textContent).toBe('0');
	});
});
