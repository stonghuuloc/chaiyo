import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/paraglide/messages.js';

const hoisted = vi.hoisted(() => ({
	lesson: vi.fn(),
	url: new URL('http://localhost/dev/gate')
}));
vi.mock('$app/state', () => ({ page: { url: hoisted.url } }));
vi.mock('#lib/catalog/app.js', () => ({ catalog: { lesson: hoisted.lesson } }));

const { default: Page } = await import('./+page.svelte');

const pool = Array.from({ length: 12 }, (_, i) => ({
	id: `q${i}`,
	type: 'choice',
	tests: {},
	prompt: { kind: 'vi', text: `Câu ${i}` },
	optionKind: 'hanzi',
	options: ['好', '你'],
	answer: 0
}));

const content = {
	contentSha: 'sha-1',
	lesson: { id: 'h1-01', sections: {}, gate: { pool, draw: 10 } },
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

describe('dev gate harness', () => {
	it('Given_Catalog_When_Load_Then_TenDrawnKindsAndGateRun', async () => {
		// Arrange
		hoisted.lesson.mockResolvedValue(content);

		// Act
		const root = mountPage();
		await vi.waitFor(() => expect(root.querySelectorAll('[data-seg] i')).toHaveLength(10));

		// Assert
		expect(hoisted.lesson).toHaveBeenCalledWith('h1-01');
		expect(root.querySelectorAll('[data-part="drawn"] li')).toHaveLength(10);
		expect(root.querySelector('[data-part="drawn"] li')?.textContent).toMatch(/^choice · q\d+$/);
		expect(root.querySelector('[data-part="ledger"]')?.textContent).toContain('gate runs: 0');
		expect(root.textContent).toContain(m.gate_hint());
	});

	it('Given_OneStepSubmitted_When_Done_Then_SubmittedLine', async () => {
		// Arrange
		hoisted.lesson.mockResolvedValue({
			...content,
			lesson: { ...content.lesson, gate: { pool: pool.slice(0, 1), draw: 10 } }
		});
		const root = mountPage();
		await vi.waitFor(() => expect(root.querySelectorAll('[data-seg] i')).toHaveLength(1));

		// Act
		root.querySelector<HTMLButtonElement>('.body button')!.click();
		flushSync();
		root.querySelector<HTMLButtonElement>('.actions button')!.click();

		// Assert
		await vi.waitFor(() =>
			expect(root.querySelector('[data-part="submitted"]')?.textContent).toBe(
				'submitted: 1/1 right'
			)
		);
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

	it('Given_NonErrorRejection_When_Load_Then_AlertWithValue', async () => {
		// Arrange
		hoisted.lesson.mockRejectedValue('boom');

		// Act
		const root = mountPage();

		// Assert
		await vi.waitFor(() =>
			expect(root.querySelector('[role="alert"]')?.textContent).toContain('boom')
		);
	});

	it('Given_ResetQuery_When_Load_Then_DatabaseErasedAndPageReloaded', async () => {
		// Arrange
		hoisted.url.search = '?reset';
		const replace = vi.fn();
		vi.stubGlobal('location', { ...window.location, pathname: '/dev/gate', replace });

		// Act
		mountPage();

		// Assert
		await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/dev/gate'));
		expect(hoisted.lesson).not.toHaveBeenCalled();
	});
});
