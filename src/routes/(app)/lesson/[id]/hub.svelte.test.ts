import { flushSync, mount, unmount, tick } from 'svelte';
import { createCatalog, type LessonContent } from '#lib/catalog/index.js';
import { fixtureSource } from '#lib/catalog/fixtures/source.js';
import { CURRICULUM } from '#lib/curriculum/index.js';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

let current: State = initialState({ curriculum: CURRICULUM });
const listeners = new Set<(s: State) => void>();
const ledger = {
	state: () => current,
	subscribe: (fn: (s: State) => void) => (listeners.add(fn), () => listeners.delete(fn))
} as unknown as Ledger;
const publish = (s: State) => {
	current = s;
	for (const fn of listeners) fn(s);
};

vi.mock('#lib/learner/index.js', () => ({ learnerLedger: async () => ledger }));

const lesson: LessonContent = await createCatalog(await fixtureSource()).lesson('h1-01');
const session = { user: { id: 'u1' } };

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const primer: LessonContent = await createCatalog(await fixtureSource()).lesson('h0-00');

const mountPage = async (s: typeof session | null = session, content: LessonContent = lesson) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, {
		target,
		props: { data: { lesson: content, session: s }, params: { id: content.lesson.id } } as never
	}) as Record<string, unknown>;
	flushSync();
	await tick();
	await Promise.resolve();
	flushSync();
	return {
		rows: () => [...target!.querySelectorAll<HTMLAnchorElement>('[data-part=hub-row]')],
		links: () => [...target!.querySelectorAll<HTMLAnchorElement>('[data-part=hub-link]')],
		cta: () => target!.querySelector<HTMLAnchorElement>('[data-part=hub-cta]'),
		gate: () => target!.querySelector<HTMLAnchorElement>('[data-part=hub-gate]')!
	};
};

const withDone = (done: string[]): State => {
	const s = initialState({ curriculum: CURRICULUM });
	s.lessons['h1-01'] = { unlocked: true, passed: false, done };
	return s;
};
const sections = CURRICULUM.lessons.find((l) => l.id === 'h1-01')!.sections;

const wordsRun = (answered: string[]): State => {
	const s = initialState({ curriculum: CURRICULUM });
	s.runs.r1 = {
		step: { kind: 'section', lesson: 'h1-01', section: 'words', run: 'r1', of: 10 },
		answers: Object.fromEntries(answered.map((id) => [id, true]))
	};
	return s;
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
	listeners.clear();
	current = initialState({ curriculum: CURRICULUM });
});

describe('lesson hub page', () => {
	it('Given_FreshLearner_When_Open_Then_HeaderFiveTodoRowsStartCta', async () => {
		// Arrange / Act
		const { rows, cta } = await mountPage();

		// Assert
		expect(target!.textContent).toContain('HSK1 · Chào hỏi · Bài 1');
		expect(target!.querySelector('h1')!.textContent).toContain('Xin chào');
		expect(target!.textContent).toContain('0/5 phần');
		expect(target!.querySelector('[data-content-sha]')!.getAttribute('data-content-sha')).toBe(
			lesson.contentSha
		);
		expect(rows().map((r) => r.dataset.look)).toEqual(['todo', 'todo', 'todo', 'todo', 'todo']);
		expect(rows()[0].getAttribute('href')).toMatch(/\/lesson\/h1-01\/words$/);
		expect(cta()!.textContent).toContain('Bắt đầu: Từ mới');
	});

	it('Given_OpenWordsRunAtWord5_When_Open_Then_ResumeCtaToWords', async () => {
		// Arrange
		current = wordsRun(lesson.words.slice(0, 4).map((w) => w.id));

		// Act
		const { rows, cta } = await mountPage();

		// Assert
		expect(rows()[0].dataset.look).toBe('now');
		expect(rows()[0].textContent).toContain('4/10 từ · tiếp ở 你好');
		expect(cta()!.textContent).toContain('Tiếp tục: Từ mới');
		expect(cta()!.getAttribute('href')).toMatch(/\/lesson\/h1-01\/words$/);
	});

	it('Given_Mounted_When_LedgerSectionDone_Then_RowFullAndProgress', async () => {
		// Arrange
		const { rows } = await mountPage();
		const next = initialState({ curriculum: CURRICULUM });
		next.lessons['h1-01'] = { unlocked: true, passed: false, done: ['grammar'] };

		// Act
		publish(next);
		flushSync();

		// Assert
		expect(rows()[1].dataset.look).toBe('done');
		expect(target!.textContent).toContain('1/5 phần');
	});

	it('Given_NullSession_When_Open_Then_AllTodoRows', async () => {
		// Arrange / Act
		const { rows, cta } = await mountPage(null);

		// Assert
		expect(rows()).toHaveLength(5);
		expect(rows().every((r) => r.dataset.look === 'todo')).toBe(true);
		expect(cta()!.textContent).toContain('Bắt đầu: Từ mới');
	});
});

describe('lesson hub Gate row', () => {
	it('Given_FourOfFiveDone_When_Open_Then_GateLockedNoHref', async () => {
		// Arrange
		current = withDone(sections.slice(0, 4));

		// Act
		const { rows, gate } = await mountPage();

		// Assert
		expect(target!.querySelectorAll('[data-part=hub-gate]')).toHaveLength(1);
		expect(gate().getAttribute('aria-disabled')).toBe('true');
		expect(gate().hasAttribute('href')).toBe(false);
		expect(gate().querySelector('use[href="#i-fill-lock-simple"]')).not.toBeNull();
		expect(gate().textContent).toContain('Kiểm tra cuối bài');
		expect(gate().textContent).toContain('Mở khi xong 5 phần · đạt từ 80%');
		expect(rows()).toHaveLength(5);
	});

	it('Given_FourDone_When_LedgerFifthSectionDone_Then_GateOpensToGateRoute', async () => {
		// Arrange
		current = withDone(sections.slice(0, 4));
		const { gate } = await mountPage();

		// Act
		publish(withDone([...sections]));
		flushSync();

		// Assert
		expect(gate().getAttribute('href')).toMatch(/\/lesson\/h1-01\/gate$/);
		expect(gate().hasAttribute('aria-disabled')).toBe(false);
		expect(gate().querySelector('use[href="#i-fill-lock-simple"]')).toBeNull();
	});
});

describe('lesson hub word Tiles', () => {
	it('Given_OpenWordsRunAtWord5_When_Open_Then_FourSolidSixDashedTiles', async () => {
		// Arrange
		current = wordsRun(lesson.words.slice(0, 4).map((w) => w.id));

		// Act
		await mountPage();

		// Assert
		const tiles = [...target!.querySelectorAll<HTMLElement>('[data-part=hub-word]')];
		expect(tiles).toHaveLength(10);
		expect(tiles.map((t) => t.dataset.reached)).toEqual([
			...Array(4).fill('true'),
			...Array(6).fill('false')
		]);
		expect(tiles[5].classList.contains('border-dashed')).toBe(true);
		expect(tiles[0].classList.contains('border-dashed')).toBe(false);
		expect(tiles[0].textContent).toContain('你');
		expect(tiles[0].textContent).toContain('nǐ');
		expect(target!.querySelector('[data-part=hub-legend]')!.textContent).toBe(
			'Viền đứt: chưa học tới.'
		);
		const mine = target!.querySelector<HTMLAnchorElement>('[data-part=hub-lexicon]')!;
		expect(mine.textContent).toContain('Từ của tôi');
		expect(mine.getAttribute('href')).toMatch(/\/practice$/);
	});
});

describe('lesson hub Khởi động row', () => {
	it('Given_PrevWordsLearned_When_Open_Then_WarmupRowFirstAndFiveSegments', async () => {
		// Arrange
		const lesson2: LessonContent = { ...lesson, lesson: { ...lesson.lesson, id: 'h1-02' } };
		const state = initialState({ curriculum: CURRICULUM });
		for (const w of CURRICULUM.lessons.find((l) => l.id === 'h1-01')!.words.slice(0, 3))
			state.lexicon[w] = { saved: false, cards: {} };
		current = state;

		// Act
		const { rows, cta } = await mountPage(session, lesson2);

		// Assert
		expect(rows()).toHaveLength(6);
		expect(rows()[0].textContent).toContain('Khởi động');
		expect(rows()[0].getAttribute('href')).toMatch(/\/lesson\/h1-02\/warmup$/);
		expect(rows()[1].textContent).toContain('Từ mới');
		expect(target!.querySelectorAll('[data-seg], header i')).toHaveLength(5);
		expect(target!.textContent).toContain('0/5 phần');
		expect(cta()!.textContent).toContain('Bắt đầu: Khởi động');
	});

	it('Given_FreshLearner_When_OpenH1_01_Then_NoWarmupRow', async () => {
		// Arrange / Act
		const { rows } = await mountPage();

		// Assert
		expect(rows()).toHaveLength(5);
		expect(target!.textContent).not.toContain('Khởi động');
	});
});

describe('Primer hub', () => {
	it('Given_PrimerHub_When_Mounted_Then_PinyinThenGateRows', async () => {
		// Arrange / Act
		const { rows, links, gate, cta } = await mountPage(session, primer);

		// Assert
		const order = [
			...target!.querySelectorAll('[data-part=hub-row], [data-part=hub-link], [data-part=hub-gate]')
		];
		expect(order.map((n) => (n as HTMLElement).dataset.part)).toEqual([
			...rows().map(() => 'hub-row'),
			'hub-link',
			'hub-gate'
		]);
		expect(rows()).toHaveLength(5);
		expect(rows().map((r) => r.textContent)).toEqual([
			expect.stringContaining('Thanh điệu'),
			expect.stringContaining('Vận mẫu'),
			expect.stringContaining('Thanh mẫu'),
			expect.stringContaining('Quy tắc viết'),
			expect.stringContaining('Biến điệu')
		]);
		expect(links()).toHaveLength(1);
		expect(links()[0].getAttribute('href')).toMatch(/\/pinyin$/);
		expect(links()[0].textContent).toContain('Bảng pinyin');
		expect(gate().getAttribute('href')).toMatch(/\/lesson\/h0-00\/gate$/);
		expect(gate().textContent).toContain('Kiểm tra Nhập môn');
		expect(target!.querySelectorAll('[data-part=hub-gate]')).toHaveLength(1);
		expect(target!.textContent).toContain('5 phần · không học từ mới · khoảng 25 phút');
		expect(target!.textContent).toContain('0/5 phần');
		expect(cta()!.textContent).toContain('Bắt đầu: Thanh điệu');
		expect(cta()!.getAttribute('href')).toMatch(/\/lesson\/h0-00\/tones$/);
	});

	it('Given_FiveDoneNotPassed_When_Mounted_Then_CtaOpensGateRoute', async () => {
		// Arrange
		const s = initialState({ curriculum: CURRICULUM });
		s.lessons['h0-00'] = {
			unlocked: true,
			passed: false,
			done: ['tones', 'finals', 'initials', 'spelling', 'sandhi']
		};
		current = s;

		// Act
		const { cta } = await mountPage(session, primer);

		// Assert
		expect(cta()!.textContent).toContain('Làm bài kiểm tra');
		expect(cta()!.getAttribute('href')).toMatch(/\/lesson\/h0-00\/gate$/);
	});
});
