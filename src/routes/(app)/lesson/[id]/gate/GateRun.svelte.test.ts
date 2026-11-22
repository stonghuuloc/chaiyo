import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { memoryStore, openLedger, type Ledger } from '#lib/ledger/index.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';
import { initialState } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GateRun from './GateRun.svelte';
import type { GateHandoff } from './handoff';

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

const ten: LessonStep[] = Array.from({ length: 10 }, (_, i) => ({
	kind: 'choice',
	id: `t${i}`,
	ask: 'Chọn chữ',
	title: `Câu ${i + 1}`,
	options: ['好', '你'],
	answer: '好'
}));

const mountGate = (ledger: Ledger, s: LessonStep[] = steps) => {
	const ondone = vi.fn<(h: GateHandoff) => void>();
	target = document.createElement('div');
	document.body.append(target);
	app = mount(GateRun, {
		target,
		props: { lesson: 'h1-01', contentSha: 'sha', steps: s, ledger, ondone }
	});
	flushSync();
	const root = target;
	return {
		ondone,
		text: () => root.textContent ?? '',
		cta: () => root.querySelector<HTMLButtonElement>('.actions button')!,
		click: (el: HTMLElement) => {
			el.click();
			flushSync();
		},
		root
	};
};

const drop = () => {
	if (app) unmount(app);
	target?.remove();
	target = undefined;
	app = undefined;
};

afterEach(drop);

// Picks option 0 (right) or 1 (wrong) on each choice step, then submits.
const answerChoices = async (v: ReturnType<typeof mountGate>, picks: number[]) => {
	for (const [i, pick] of picks.entries()) {
		await vi.waitFor(() =>
			expect(v.root.querySelector('.top span')?.textContent).toBe(`${i + 1}/${picks.length}`)
		);
		v.click(v.root.querySelectorAll<HTMLButtonElement>('.body button')[pick]);
		v.click(v.cta());
	}
	await vi.waitFor(() => expect(v.ondone).toHaveBeenCalledOnce());
	return v.ondone.mock.calls[0][0];
};

describe('GateRun', () => {
	it('Given_TwoAnswers_When_Submit_Then_RunScoredAndHandoffEmitted', async () => {
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
		await vi.waitFor(() => expect(v.ondone).toHaveBeenCalledOnce());

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
		const h = v.ondone.mock.calls[0][0];
		expect(h).toMatchObject({ lesson: 'h1-01', steps, best: 100 });
		expect(h.answers.map((a) => [a.questionId, a.correct])).toEqual([
			['g0', true],
			['g1', true]
		]);
		expect(h.events).toContainEqual({ type: 'LessonUnlocked', lesson: 'h1-02' });
		expect(ledger.state().lessons['h1-02'].unlocked).toBe(true);
	});

	it('Given_AllWrong_When_Submit_Then_NoUnlockNextLocked', async () => {
		// Arrange
		const ledger = await ledgerFor();
		const v = mountGate(ledger, ten.slice(0, 2));

		// Act
		const h = await answerChoices(v, [1, 1]);

		// Assert
		expect(h.best).toBe(0);
		expect(h.events.map((e) => e.type)).not.toContain('LessonUnlocked');
		expect(h.events.map((e) => e.type)).not.toContain('GatePassed');
		expect(ledger.state().lessons['h1-02']?.unlocked ?? false).toBe(false);
	});

	it('Given_Best70_When_FailRun_Then_HandoffBest70', async () => {
		// Arrange
		const ledger = await ledgerFor();
		await answerChoices(mountGate(ledger, ten), [0, 0, 0, 0, 0, 0, 0, 1, 1, 1]);
		drop();
		const v = mountGate(ledger, ten);

		// Act
		const h = await answerChoices(v, [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]);

		// Assert
		expect(h.answers.filter((a) => a.correct)).toHaveLength(6);
		expect(h.best).toBe(70);
		expect(ledger.state().lessons['h1-02']?.unlocked ?? false).toBe(false);
	});

	it('Given_TwoMounts_When_Submit_Then_TwoGateRunIds', async () => {
		// Arrange
		const ledger = await ledgerFor();
		await answerChoices(mountGate(ledger, ten.slice(0, 2)), [0, 1]);
		drop();

		// Act
		await answerChoices(mountGate(ledger, ten.slice(0, 2)), [1, 0]);

		// Assert
		const runs = Object.values(ledger.state().runs);
		expect(runs).toHaveLength(2);
		expect(runs.every((r) => r.closed)).toBe(true);
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
