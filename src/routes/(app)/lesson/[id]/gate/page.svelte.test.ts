import { flushSync, mount, unmount } from 'svelte';
import type { LessonContent } from '#lib/catalog/index.js';
import type { Ledger } from '#lib/ledger/index.js';
import { m } from '#lib/paraglide/messages.js';
import { initialState } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';
import { readGateResult } from './handoff';

const nav = vi.hoisted(() => ({ goto: vi.fn() }));
vi.mock('$app/navigation', () => nav);

const ledger = { state: () => initialState(), record: async () => [] } as unknown as Ledger;
const learner = vi.hoisted(() => ({ fail: false }));
vi.mock('#lib/learner/index.js', () => ({
	learnerLedger: async () => {
		if (learner.fail) throw new Error('offline');
		return ledger;
	}
}));

const choice = (i: number) => ({
	id: `q${i}`,
	type: 'choice',
	tests: {},
	prompt: { kind: 'vi', text: `Câu ${i}` },
	optionKind: 'hanzi',
	options: ['好', '你'],
	answer: 0
});

const lesson = (n: number) =>
	({
		contentSha: 'sha',
		lesson: {
			id: 'h1-01',
			gate: { pool: Array.from({ length: n }, (_, i) => choice(i)), draw: 10 }
		},
		words: [],
		sentences: []
	}) as unknown as LessonContent;

let target: HTMLDivElement | undefined;
let app: ReturnType<typeof mount> | undefined;

const mountPage = (data: { lesson: LessonContent; session: unknown }) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target, props: { data, params: { id: 'h1-01' } } as never });
	flushSync();
	return target;
};

afterEach(() => {
	sessionStorage.clear();
	nav.goto.mockClear();
	if (app) unmount(app);
	target?.remove();
	target = undefined;
	app = undefined;
});

describe('gate page', () => {
	it('Given_NoSession_When_Render_Then_Placeholder', () => {
		// Arrange
		const data = { lesson: lesson(12), session: null };

		// Act
		const root = mountPage(data);

		// Assert
		expect(root.querySelector('h1')?.textContent).toBe(m.screen_gate());
	});

	it('Given_PoolOf12_When_Render_Then_TenStepRunInTestMode', async () => {
		// Arrange
		const data = { lesson: lesson(12), session: { user: { id: 'u1' } } };

		// Act
		const root = mountPage(data);
		await vi.waitFor(() => expect(root.querySelectorAll('[data-seg] i')).toHaveLength(10));

		// Assert
		expect(root.textContent).toContain(m.gate_hint());
		expect(root.querySelector('[data-part="exit"]')?.tagName).toBe('BUTTON');
	});

	it('Given_Done_When_Handoff_Then_StoredAndGotoResult', async () => {
		// Arrange
		const data = { lesson: lesson(1), session: { user: { id: 'u1' } } };
		const root = mountPage(data);
		await vi.waitFor(() => expect(root.querySelectorAll('[data-seg] i')).toHaveLength(1));

		// Act
		root.querySelector<HTMLButtonElement>('.body button')!.click();
		flushSync();
		root.querySelector<HTMLButtonElement>('.actions button')!.click();
		await vi.waitFor(() => expect(nav.goto).toHaveBeenCalledOnce());

		// Assert
		expect(nav.goto).toHaveBeenCalledWith('/lesson/h1-01/gate/result', { replace: true });
		const h = readGateResult(sessionStorage, 'h1-01');
		expect(h?.answers).toEqual([expect.objectContaining({ questionId: 'q0', correct: true })]);
		expect(h?.steps.map((s) => s.id)).toEqual(['q0']);
	});

	it('Given_LedgerFails_When_Render_Then_Placeholder', async () => {
		// Arrange
		learner.fail = true;
		const data = { lesson: lesson(12), session: { user: { id: 'u1' } } };

		// Act
		const root = mountPage(data);
		await new Promise((r) => setTimeout(r, 0));
		flushSync();
		learner.fail = false;

		// Assert
		expect(root.querySelector('h1')?.textContent).toBe(m.screen_gate());
		expect(root.querySelector('[data-seg]')).toBe(null);
	});
});
