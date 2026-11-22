import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
	lesson: vi.fn(),
	url: new URL('http://localhost/dev/gate-result')
}));
vi.mock('$app/state', () => ({ page: { url: hoisted.url } }));
vi.mock('#lib/catalog/app.js', () => ({ catalog: { lesson: hoisted.lesson } }));

const { default: Page } = await import('./+page.svelte');

const pool = (n: number) =>
	Array.from({ length: n }, (_, i) => ({
		id: `q${i}`,
		type: 'choice',
		tests: {},
		prompt: { kind: 'vi', text: `Câu ${i}` },
		optionKind: 'hanzi',
		options: ['好', '你'],
		answer: 0
	}));

const content = (n: number) => ({
	contentSha: 'sha-1',
	lesson: { id: 'h1-01', sections: {}, gate: { pool: pool(n), draw: 10 } },
	words: [],
	chars: [],
	sentences: [],
	grammar: [],
	questions: [],
	gateCoverage: {},
	thin: []
});

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

beforeEach(() => {
	vi.stubGlobal('indexedDB', new IDBFactory());
	hoisted.lesson.mockReset();
	hoisted.url.search = '';
});

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	vi.unstubAllGlobals();
});

const mountPage = () => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target }) as Record<string, unknown>;
	flushSync();
	return target;
};

const ledgerLine = (root: HTMLElement) =>
	root.querySelector('[data-part="ledger"]')?.textContent ?? '';

const submitOne = async (root: HTMLElement, pick: number) => {
	await vi.waitFor(() => expect(root.querySelectorAll('[data-seg] i')).toHaveLength(1));
	root.querySelectorAll<HTMLButtonElement>('.body button')[pick].click();
	flushSync();
	root.querySelector<HTMLButtonElement>('.actions button')!.click();
	await vi.waitFor(() => expect(root.querySelector('[data-part="pct"]')).not.toBe(null));
};

describe('dev gate result harness', () => {
	it('Given_Catalog_When_Load_Then_GateRunAndLedgerLine', async () => {
		// Arrange
		hoisted.lesson.mockResolvedValue(content(12));

		// Act
		const root = mountPage();
		await vi.waitFor(() => expect(root.querySelectorAll('[data-seg] i')).toHaveLength(10));

		// Assert
		expect(hoisted.lesson).toHaveBeenCalledWith('h1-01');
		expect(ledgerLine(root)).toContain('best: —');
		expect(ledgerLine(root)).toContain('h1-02 unlocked: no');
	});

	it('Given_Best70Query_When_Load_Then_LedgerBest70', async () => {
		// Arrange
		hoisted.url.search = '?best=70';
		hoisted.lesson.mockResolvedValue(content(12));

		// Act
		const root = mountPage();

		// Assert
		await vi.waitFor(() => expect(ledgerLine(root)).toContain('best: 70'));
		expect(ledgerLine(root)).toContain('gate runs: 1');
	});

	it('Given_Done_When_Handoff_Then_ResultInline', async () => {
		// Arrange
		hoisted.lesson.mockResolvedValue(content(1));
		const root = mountPage();

		// Act
		await submitOne(root, 0);

		// Assert
		expect(root.querySelector('[data-part="pct"]')?.textContent).toBe('100%');
		expect(root.querySelector('[data-seg]')).toBe(null);
		await vi.waitFor(() => expect(ledgerLine(root)).toContain('h1-02 unlocked: yes'));
	});

	it('Given_FailResult_When_Retry_Then_PageReloaded', async () => {
		// Arrange
		const replace = vi.fn();
		vi.stubGlobal('location', { ...window.location, pathname: '/dev/gate-result', replace });
		hoisted.lesson.mockResolvedValue(content(1));
		const root = mountPage();
		await submitOne(root, 1);

		// Act
		root.querySelector<HTMLButtonElement>('[data-part="cta"] button')!.click();

		// Assert
		expect(replace).toHaveBeenCalledWith('/dev/gate-result');
	});

	it('Given_ResetQuery_When_Load_Then_DatabaseErasedAndPageReloaded', async () => {
		// Arrange
		hoisted.url.search = '?reset';
		const replace = vi.fn();
		vi.stubGlobal('location', { ...window.location, pathname: '/dev/gate-result', replace });

		// Act
		mountPage();

		// Assert
		await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/dev/gate-result'));
		expect(hoisted.lesson).not.toHaveBeenCalled();
	});

	it('Given_CatalogFails_When_Load_Then_Alert', async () => {
		// Arrange
		hoisted.lesson.mockRejectedValue(new Error('offline'));

		// Act
		const root = mountPage();

		// Assert
		await vi.waitFor(() =>
			expect(root.querySelector('[role="alert"]')?.textContent).toContain('offline')
		);
	});
});
