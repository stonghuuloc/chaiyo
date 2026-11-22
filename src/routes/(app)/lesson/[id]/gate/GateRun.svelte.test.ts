import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { memoryStore, openLedger, type Ledger } from '#lib/ledger/index.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';
import { initialState } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GateRun from './GateRun.svelte';

const steps: LessonStep[] = [
	{
		kind: 'choice',
		id: 'g0',
		ask: 'Chọn chữ',
		title: 'Câu 1',
		options: ['好', '你'],
		answer: '好'
	},
	{
		kind: 'pinyin',
		id: 'g1',
		ask: 'Gõ pinyin',
		title: 'tạm biệt',
		hanzi: '再见',
		answer: 'zàijiàn'
	}
];

// Gate attempts count only after every section is done or the lesson is tested out.
const ledgerFor = () =>
	openLedger({
		initial: initialState({
			curriculum: {
				...CURRICULUM,
				lessons: CURRICULUM.lessons.map((l) => (l.id === 'h1-01' ? { ...l, testOut: true } : l))
			}
		}),
		store: memoryStore(),
		idb: new IDBFactory()
	});

let target: HTMLDivElement | undefined;
let app: ReturnType<typeof mount> | undefined;

const mountGate = (ledger: Ledger) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(GateRun, { target, props: { lesson: 'h1-01', contentSha: 'sha', steps, ledger } });
	flushSync();
	const root = target;
	return {
		text: () => root.textContent ?? '',
		cta: () => root.querySelector<HTMLButtonElement>('.actions button')!,
		click: (el: HTMLElement) => {
			el.click();
			flushSync();
		},
		root
	};
};

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	target = undefined;
	app = undefined;
});

describe('GateRun', () => {
	it('Given_TwoAnswers_When_Submit_Then_RunScoredAndSubmittedCard', async () => {
		// Arrange
		const ledger = await ledgerFor();
		const v = mountGate(ledger);
		expect(v.text()).toContain(m.gate_hint());
		v.click(v.root.querySelector<HTMLButtonElement>('.body button')!);
		v.click(v.cta());
		await vi.waitFor(() =>
			expect(v.root.querySelector('[data-part="pinyin-input"]')).not.toBe(null)
		);
		const input = v.root.querySelector<HTMLInputElement>('[data-part="pinyin-input"]')!;
		input.value = 'zai4jian4';
		input.dispatchEvent(new Event('input'));
		flushSync();

		// Act
		expect(v.cta().textContent).toContain(m.lesson_submit());
		v.click(v.cta());
		await vi.waitFor(() => expect(v.text()).toContain(m.gate_submitted()));

		// Assert
		const runs = Object.values(ledger.state().runs);
		expect(runs).toHaveLength(1);
		expect(runs[0]).toMatchObject({
			step: { kind: 'gate', lesson: 'h1-01', of: 2 },
			answers: { g0: true, g1: true },
			closed: true
		});
		expect(ledger.state().lessons['h1-01'].best).toBe(100);
		expect(v.text()).not.toContain(m.lesson_right());
		expect(v.root.querySelector('[data-part="done-next"] a')?.getAttribute('href')).toBe(
			'/lesson/h1-01'
		);
	});

	it('Given_OneAnswer_When_Exit_Then_RunOpenWithNoBest', async () => {
		// Arrange
		const ledger = await ledgerFor();
		const v = mountGate(ledger);
		v.click(v.root.querySelector<HTMLButtonElement>('.body button')!);
		v.click(v.cta());
		await vi.waitFor(() => expect(Object.keys(ledger.state().runs)).toHaveLength(1));

		// Act
		v.click(v.root.querySelector<HTMLButtonElement>('[data-part="exit"]')!);

		// Assert
		const dialog = document.querySelector('[role="dialog"]');
		expect(dialog?.textContent).toContain(m.gate_exit_body());
		expect(
			[...dialog!.querySelectorAll('a')]
				.find((a) => a.textContent?.trim() === m.gate_exit_leave())
				?.getAttribute('href')
		).toBe('/lesson/h1-01');
		const [run] = Object.values(ledger.state().runs);
		expect(run.closed).toBeUndefined();
		expect(ledger.state().lessons['h1-01'].best).toBeUndefined();
	});
});
