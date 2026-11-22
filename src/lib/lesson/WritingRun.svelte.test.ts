import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, tick, unmount } from 'svelte';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { memoryStore, openLedger, type Ledger } from '#lib/ledger/index.js';
import { initialState, type Attempt } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mounted } from '../../test/FakeWriteStrokes.svelte';
import WritingRun from './WritingRun.svelte';

vi.mock('#lib/components/HanziStrokes.svelte', () => import('../../test/FakeWriteStrokes.svelte'));

const setup = async () => {
	const store = memoryStore();
	const ledger = await openLedger({
		initial: initialState({ curriculum: CURRICULUM }),
		store,
		idb: new IDBFactory()
	});
	return { store, ledger };
};

let target: HTMLDivElement | undefined;
let app: ReturnType<typeof mount> | undefined;

const detach = () => {
	if (app) unmount(app);
	target?.remove();
	target = app = undefined;
	mounted.length = 0;
	flushSync();
};

const mountRun = (ledger: Ledger) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(WritingRun, {
		target,
		props: {
			chars: ['你', '好', '们'],
			lesson: 'h1-01',
			contentSha: 'sha1',
			ledger,
			exit: '/today',
			next: { label: 'Về bài học', href: '/lesson/h1-01' }
		}
	});
	flushSync();
};

const q = (sel: string) => target?.querySelector<HTMLElement>(sel) ?? null;
const counter = () => q('.top span')?.textContent;
const current = () => mounted[mounted.length - 1];

const settle = async () => {
	for (let i = 0; i < 4; i++) {
		await tick();
		await Promise.resolve();
	}
	flushSync();
};

const write = async (mistakes = 0) => {
	const before = mounted.length;
	current().oncomplete?.({ mistakes });
	flushSync();
	q('.actions button')?.click();
	await vi.waitFor(() =>
		expect(mounted.length > before || q('[data-part="done-title"]')).toBeTruthy()
	);
	await settle();
};

const skip = async () => {
	const before = mounted.length;
	q('[data-part="skip"]')?.click();
	await vi.waitFor(() =>
		expect(mounted.length > before || q('[data-part="done-title"]')).toBeTruthy()
	);
	await settle();
};

const attempts = (rows: ReturnType<ReturnType<typeof memoryStore>['rows']>) =>
	rows.filter((r): r is Attempt => 'questionId' in r);

afterEach(detach);

describe('WritingRun', () => {
	it('Given_3Chars_When_Opened_Then_Counter1Of6', async () => {
		// Arrange
		const { ledger } = await setup();

		// Act
		mountRun(ledger);

		// Assert
		expect(counter()).toBe('1/6');
		expect(q('[data-part="round"]')?.textContent?.trim()).toBe('Lần 1: viết theo nét mờ');
		expect(current()).toMatchObject({ char: '你', outline: true });
	});

	it('Given_NiR1_When_Skip_Then_HaoR1AndCounter3Of6And2NullRows', async () => {
		// Arrange
		const { store, ledger } = await setup();
		mountRun(ledger);

		// Act
		await skip();
		await ledger.sync();

		// Assert
		expect(counter()).toBe('3/6');
		expect(current()).toMatchObject({ char: '好', outline: true });
		const ni = attempts(store.rows()).filter((r) => r.questionId.startsWith('write-你-'));
		expect(ni.map((r) => [r.questionId, r.correct, r.answer, r.card])).toEqual([
			['write-你-1', null, undefined, undefined],
			['write-你-2', null, undefined, undefined]
		]);
	});

	it('Given_HaoR1Written_When_SkipR2_Then_1MarkerRow', async () => {
		// Arrange
		const { store, ledger } = await setup();
		mountRun(ledger);
		await write();
		await write();
		await write(1);

		// Act
		await skip();
		await ledger.sync();

		// Assert
		expect(counter()).toBe('5/6');
		expect(current()).toMatchObject({ char: '们', outline: true });
		const hao = attempts(store.rows()).filter((r) => r.questionId.startsWith('write-好-'));
		expect(hao.map((r) => [r.questionId, r.correct, r.answer])).toEqual([
			['write-好-1', true, '1'],
			['write-好-2', null, undefined]
		]);
	});

	it('Given_2MistakesOnNiR1_When_Tiep_Then_RowAnswer2CorrectTrue', async () => {
		// Arrange
		const { store, ledger } = await setup();
		mountRun(ledger);

		// Act
		await write(2);
		await ledger.sync();

		// Assert
		expect(counter()).toBe('2/6');
		const [row] = attempts(store.rows());
		expect(row).toMatchObject({ questionId: 'write-你-1', correct: true, answer: '2' });
		expect(row.card).toBeUndefined();
	});

	it('Given_WriteNiSkipHaoWriteMen_When_End_Then_DoneTextListsNiVaMenAndSectionDone', async () => {
		// Arrange
		const { ledger } = await setup();
		mountRun(ledger);

		// Act
		await write();
		await write(2);
		await skip();
		await write();
		await write();

		// Assert
		expect(q('[data-part="done-title"]')?.textContent).toBe('Xong phần Luyện viết');
		expect(q('[data-part="done-text"]')?.textContent).toBe('Bạn đã viết 2 chữ: 你 và 们');
		expect(ledger.state().lessons['h1-01'].done).toContain('writing');
	});

	it('Given_SkipOnLastChar_When_Skip_Then_DoneScreen', async () => {
		// Arrange
		const { ledger } = await setup();
		mountRun(ledger);
		for (let i = 0; i < 4; i++) await write();

		// Act
		await skip();

		// Assert
		expect(q('[data-part="done-text"]')?.textContent).toBe('Bạn đã viết 2 chữ: 你 và 好');
		expect(ledger.state().lessons['h1-01'].done).toContain('writing');
	});

	it('Given_OpenRunWithHaoMarker_When_Remount_Then_HaoNotListed', async () => {
		// Arrange
		const { ledger } = await setup();
		mountRun(ledger);
		await write();
		await write();
		await skip();
		detach();

		// Act
		mountRun(ledger);
		await write();
		await write();

		// Assert
		expect(q('[data-part="done-text"]')?.textContent).toBe('Bạn đã viết 2 chữ: 你 và 们');
	});

	it('Given_AllSkipped_When_End_Then_DoneHasNoText', async () => {
		// Arrange
		const { ledger } = await setup();
		mountRun(ledger);

		// Act
		await skip();
		await skip();
		await skip();

		// Assert
		expect(q('[data-part="done-title"]')?.textContent).toBe('Xong phần Luyện viết');
		expect(q('[data-part="done-text"]')).toBeNull();
	});
});
