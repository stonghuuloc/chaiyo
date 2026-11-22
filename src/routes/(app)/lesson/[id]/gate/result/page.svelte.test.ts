import { flushSync, mount, unmount } from 'svelte';
import type { LessonContent } from '#lib/catalog/index.js';
import { m } from '#lib/paraglide/messages.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readGateResult, writeGateResult, type GateHandoff } from '../handoff';
import Page from './+page.svelte';

const nav = vi.hoisted(() => ({ goto: vi.fn() }));
vi.mock('$app/navigation', () => nav);

const LESSON = {
	contentSha: 'sha',
	lesson: { id: 'h1-01' },
	words: [],
	sentences: []
} as unknown as LessonContent;

const handoff = (correct: boolean): GateHandoff => ({
	lesson: 'h1-01',
	steps: [
		{ kind: 'choice', id: 'q0', ask: 'a', title: 'không sao', options: ['好', '你'], answer: '好' }
	],
	answers: [{ questionId: 'q0', pick: correct ? '好' : '你', correct, ms: 0 }],
	events: correct ? [{ type: 'LessonUnlocked', lesson: 'h1-02' }] : [],
	best: correct ? 100 : 70
});

let target: HTMLDivElement | undefined;
let app: ReturnType<typeof mount> | undefined;

const mountPage = () => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, {
		target,
		props: { data: { lesson: LESSON }, params: { id: 'h1-01' } } as never
	});
	flushSync();
	return target;
};

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	target = undefined;
	app = undefined;
	sessionStorage.clear();
	nav.goto.mockClear();
});

describe('gate result page', () => {
	it('Given_PassHandoff_When_Mount_Then_Result100', () => {
		// Arrange
		writeGateResult(sessionStorage, handoff(true));

		// Act
		const root = mountPage();

		// Assert
		expect(root.querySelector('[data-part="pct"]')?.textContent).toBe('100%');
		expect(root.querySelector('[data-part="line"]')?.textContent?.trim()).toBe('Đã mở Bài 2');
		expect(nav.goto).not.toHaveBeenCalled();
		expect(readGateResult(sessionStorage, 'h1-01')).not.toBe(null);
	});

	it('Given_NoHandoff_When_Mount_Then_GotoHub', () => {
		// Arrange
		sessionStorage.clear();

		// Act
		const root = mountPage();

		// Assert
		expect(nav.goto).toHaveBeenCalledWith('/lesson/h1-01', { replace: true });
		expect(root.querySelector('[data-part="pct"]')).toBe(null);
	});

	it('Given_FailHandoff_When_Retry_Then_ClearedAndGotoGate', () => {
		// Arrange
		writeGateResult(sessionStorage, handoff(false));
		const root = mountPage();
		expect(root.querySelector('[data-part="best"]')?.textContent?.trim()).toBe(
			m.gate_result_best({ pct: 70 })
		);
		expect(root.querySelector('s [data-part="pick"]')?.textContent).toBe('你');

		// Act
		root.querySelector<HTMLButtonElement>('[data-part="cta"] button')!.click();

		// Assert
		expect(readGateResult(sessionStorage, 'h1-01')).toBe(null);
		expect(nav.goto).toHaveBeenCalledWith('/lesson/h1-01/gate', { replace: true });
	});

	it('Given_PassHandoff_When_Back_Then_Cleared', () => {
		// Arrange
		writeGateResult(sessionStorage, handoff(true));
		const root = mountPage();
		const back = root.querySelector<HTMLAnchorElement>('[data-part="back"]')!;
		back.addEventListener('click', (e) => e.preventDefault());

		// Act
		back.click();

		// Assert
		expect(readGateResult(sessionStorage, 'h1-01')).toBe(null);
	});
});
