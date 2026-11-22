import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { CatalogWord } from '#lib/catalog/index.js';
import { memoryStore, openLedger, type Ledger } from '#lib/ledger/index.js';
import { m } from '#lib/paraglide/messages.js';
import {
	initialState,
	localDate,
	session,
	type Attempt,
	type SessionCard,
	type Skill,
	type State
} from '#lib/study/index.js';
import { mounted } from '../../test/FakeVietStrokes.svelte';

const hoisted = vi.hoisted(() => ({ play: vi.fn() }));
vi.mock('#lib/audio/index.js', () => ({
	play: hoisted.play,
	player: { play: hoisted.play, url: (k: string) => `/a/${k}.mp3`, element: () => null }
}));
vi.mock('#lib/components/HanziStrokes.svelte', () => import('../../test/FakeVietStrokes.svelte'));

const { default: SessionRun } = await import('./SessionRun.svelte');

const TZ = 'Asia/Ho_Chi_Minh';
const TEN = ['你', '好', '谢', '再', '见', '他', '她', '我', '们', '是'];

const catalog = {
	find: async (hanzi: string) => ({
		word: {
			id: hanzi,
			hanzi,
			pinyin: `py-${hanzi}`,
			hanviet: `hv-${hanzi}`,
			level: 1,
			pos: [],
			senses: [{ vi: `nghĩa ${hanzi}` }],
			examples: [],
			listedIn: [],
			audio: `word/${hanzi}`,
			contentSha: 'sha-1'
		} as unknown as CatalogWord,
		char: null
	}),
	thin: async () => null,
	lesson: async () => {
		throw new Error('no lesson');
	}
};

const due = '2020-01-01T00:00:00.000Z';
const stateOf = (lanes: Record<Skill, string[]>): State => {
	const lexicon: State['lexicon'] = {};
	for (const skill of ['the', 'nghe', 'viet'] as const)
		for (const w of lanes[skill]) {
			lexicon[w] ??= { saved: false, cards: {} };
			lexicon[w].cards[skill] = { due, first: due, fsrs: {} };
		}
	return { ...initialState(), lexicon };
};

const mixedState = () =>
	stateOf({
		the: ['你', '好', '谢', '再', '见', '他'],
		nghe: ['她', '我', '们', '是'],
		viet: ['不', '对']
	});

const cardsOf = (words: string[], skill: Skill): SessionCard[] =>
	words.map((word) => ({ word, skill }));

const need = <T>(v: T | null | undefined): T => {
	if (v == null) throw new Error('missing test value');
	return v;
};

let target: HTMLDivElement | undefined;
let app: ReturnType<typeof mount> | undefined;
let ledger: Ledger;
let record: MockInstance<Ledger['record']>;

const open = (initial: State = initialState()) =>
	openLedger({ initial, store: memoryStore(), idb: new IDBFactory() });

const itemEl = () => target?.querySelector<HTMLElement>('[data-part="item"]') ?? null;
const doneEl = () => target?.querySelector<HTMLElement>('[data-part="done"]') ?? null;
const dialog = () => target?.ownerDocument.querySelector('[role="dialog"]') ?? null;
const attempts = () => record.mock.calls.map((c) => c[0] as Attempt);

const render = async (cards: SessionCard[], over: { initial?: State; back?: string } = {}) => {
	ledger = await open(over.initial);
	record = vi.spyOn(ledger, 'record');
	target = document.createElement('div');
	document.body.append(target);
	app = mount(SessionRun, {
		target,
		props: { cards, ledger, catalog, back: over.back ?? '/practice' } as never
	});
	await vi.waitFor(() => expect(itemEl() ?? doneEl()).not.toBeNull());
};

const press = (selector: string) => {
	need(target?.querySelector<HTMLElement>(selector)).click();
	flushSync();
};

const optionText = (b: HTMLElement) => b.firstElementChild?.textContent?.trim();

const settle = async (id: string | undefined) =>
	vi.waitFor(() => expect(itemEl()?.dataset.id).not.toBe(id));

async function answerCurrent(correct: boolean | 'skip') {
	const el = need(itemEl());
	const { id, kind } = el.dataset;
	if (kind === 'the') {
		press('[data-part="flip"]');
		press(correct ? '[data-part="remember"]' : '[data-part="forget"]');
	} else if (kind === 'nghe') {
		const word = need(id).split(':')[2].replace('#again', '');
		const options = [...el.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')];
		need(options.find((b) => (optionText(b) === word) === (correct === true))).click();
		flushSync();
		press('[data-part="cta"] button');
	} else {
		const strokes = need(mounted.at(-1));
		if (correct === 'skip') strokes.onerror?.();
		else if (correct) strokes.oncomplete?.({ mistakes: 0 });
		else press('[data-part="unsure"]');
		flushSync();
		press('[data-part="cta"] button');
	}
	await settle(id);
}

async function playOut(results: (boolean | 'skip')[]) {
	for (const r of results) await answerCurrent(r);
}

const kindsPlayed = async (limit = 99) => {
	const kinds: string[] = [];
	while (itemEl() && kinds.length < limit) {
		kinds.push(need(itemEl()).dataset.kind!);
		await answerCurrent(true);
	}
	return kinds;
};

beforeEach(() => {
	hoisted.play.mockReset();
	hoisted.play.mockResolvedValue(true);
});

afterEach(() => {
	vi.restoreAllMocks();
	if (app) unmount(app);
	target?.remove();
	target = app = undefined;
	mounted.length = 0;
});

describe('SessionRun skill filter', () => {
	it('Given_OnlyNgheRun_When_Play_Then_EveryItemIsNghe', async () => {
		// Arrange
		const cards = session(mixedState(), { now: new Date(), tz: TZ, only: ['nghe'] });
		await render(cards);

		// Act
		const kinds = await kindsPlayed();

		// Assert
		expect(kinds).toEqual(['nghe', 'nghe', 'nghe', 'nghe']);
		expect(doneEl()).not.toBeNull();
	});

	it('Given_OnlyTheRun_When_Play_Then_SixFlashcards', async () => {
		// Arrange
		const cards = session(mixedState(), { now: new Date(), tz: TZ, only: ['the'] });
		await render(cards);

		// Act
		const kinds = await kindsPlayed();

		// Assert
		expect(kinds).toEqual(Array(6).fill('the'));
	});

	it('Given_OnlyVietRun_When_Play_Then_TwoWriters', async () => {
		// Arrange
		const cards = session(mixedState(), { now: new Date(), tz: TZ, only: ['viet'] });
		await render(cards);

		// Act
		const kinds = await kindsPlayed();

		// Assert
		expect(kinds).toEqual(['viet', 'viet']);
	});

	it('Given_MixedRun_When_Start_Then_TheNgheVietOrder', async () => {
		// Arrange
		const cards = session(mixedState(), { now: new Date(), tz: TZ });
		await render(cards);

		// Act
		const kinds = await kindsPlayed(3);

		// Assert
		expect(need(target?.querySelector('[data-part="session-run"]')).getAttribute('data-of')).toBe(
			'12'
		);
		expect(kinds).toEqual(['the', 'nghe', 'viet']);
	});
});

describe('SessionRun records', () => {
	const tenCards = () => cardsOf(TEN, 'nghe');
	const oneMiss = [true, false, ...Array(8).fill(true), true] as boolean[];

	it('Given_TenCardsOneMiss_When_Finish_Then_ElevenRecordsOneRun', async () => {
		// Arrange
		await render(tenCards());

		// Act
		await playOut(oneMiss);

		// Assert
		const written = attempts();
		expect(written).toHaveLength(11);
		expect(new Set(written.map((a) => a.questionId)).size).toBe(11);
		expect(written.map((a) => a.questionId)).toContain('practice:nghe:好#again');
		expect(new Set(written.map((a) => (a.step as { run: string }).run)).size).toBe(1);
		expect(written.every((a) => a.step?.kind === 'practice' && a.step.of === 10)).toBe(true);
		expect(written.filter((a) => a.correct === false)).toHaveLength(1);
		expect(written.every((a) => a.card?.skill === 'nghe' && a.contentSha === 'sha-1')).toBe(true);
	});

	it('Given_TenCardsOneMiss_When_BeforeLast_Then_NoStreakDialog', async () => {
		// Arrange
		await render(tenCards());

		// Act
		for (const r of oneMiss.slice(0, -1)) {
			await answerCurrent(r);
			// Assert
			expect(dialog()).toBeNull();
		}
		expect(doneEl()).toBeNull();
	});

	it('Given_TenCardsOneMiss_When_Finish_Then_StreakDialog', async () => {
		// Arrange
		await render(tenCards());

		// Act
		await playOut(oneMiss);

		// Assert
		expect(doneEl()).not.toBeNull();
		await vi.waitFor(() => expect(dialog()?.textContent).toContain(m.done_streak({ n: 1 })));
	});

	it('Given_DayAlreadyCounted_When_Finish_Then_NoStreakDialog', async () => {
		// Arrange
		const today = localDate(new Date(), TZ);
		const initial: State = {
			...initialState(),
			streak: { count: 3, last: today, freezes: 0, through: today }
		};
		await render(tenCards(), { initial });

		// Act
		await playOut(oneMiss);

		// Assert
		expect(doneEl()).not.toBeNull();
		expect(dialog()).toBeNull();
	});

	it('Given_RecordThrows_When_Answer_Then_StaysOnItem', async () => {
		// Arrange
		await render(cardsOf(TEN.slice(0, 2), 'nghe'));
		const first = need(itemEl()).dataset.id;
		record.mockRejectedValueOnce(new Error('disk'));

		// Act
		const el = need(itemEl());
		const words = [...el.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')];
		need(words.find((b) => optionText(b) === TEN[0])).click();
		flushSync();
		press('[data-part="cta"] button');
		await vi.waitFor(() => expect(record).toHaveBeenCalledTimes(1));
		await new Promise((r) => setTimeout(r, 0));

		// Assert
		expect(itemEl()?.dataset.id).toBe(first);
		expect(doneEl()).toBeNull();
		press('[data-part="cta"] button');
		await settle(first);
		expect(attempts()).toHaveLength(2);
	});
});

describe('SessionRun flashcard return', () => {
	it('Given_Quen_When_Decide_Then_CardReturnsMarked', async () => {
		// Arrange
		await render(cardsOf(['你', '好'], 'the'));
		const seen: { id: string; marked: boolean }[] = [];

		// Act
		await answerCurrent(false);
		while (itemEl()) {
			const el = need(itemEl());
			seen.push({
				id: need(el.dataset.id),
				marked: el.querySelector('[data-part="again"]') !== null
			});
			await answerCurrent(true);
		}

		// Assert
		expect(seen).toEqual([
			{ id: 'practice:the:好', marked: false },
			{ id: 'practice:the:你#again', marked: true }
		]);
		expect(attempts().map((a) => [a.questionId, a.correct, a.answer])).toEqual([
			['practice:the:你', false, 'quen'],
			['practice:the:好', true, 'nho'],
			['practice:the:你#again', true, 'nho']
		]);
	});
});

describe('SessionRun done screen', () => {
	it('Given_ThreeMissed_When_Done_Then_ChipsAndOkHeadline', async () => {
		// Arrange
		await render(cardsOf(TEN, 'nghe'), { back: '/practice' });

		// Act
		await playOut([
			false,
			true,
			false,
			true,
			true,
			true,
			false,
			true,
			true,
			true,
			true,
			true,
			true
		]);

		// Assert
		const root = need(doneEl());
		expect(need(root.querySelector('[data-part="headline"]')).textContent?.trim()).toBe(
			m.practice_run_ok()
		);
		expect(need(root.querySelector('[data-part="scores"]')).textContent).toContain(
			m.practice_run_score_nghe({ right: 7, total: 10 })
		);
		const chips = [...root.querySelectorAll('[data-part="chip"]')].map((c) =>
			c.textContent?.trim()
		);
		expect(chips).toEqual([
			...Array(3).fill(m.practice_run_again()),
			...Array(7).fill(m.practice_run_known())
		]);
		const link = need(root.querySelector<HTMLAnchorElement>('a'));
		expect(link.textContent).toContain(m.practice_run_back());
		expect(link.getAttribute('href')).toBe('/practice');
	});

	it('Given_Done_When_ReadText_Then_NoSchedulerWords', async () => {
		// Arrange
		await render(cardsOf(TEN, 'nghe'));
		await playOut([
			false,
			true,
			false,
			true,
			true,
			true,
			false,
			true,
			true,
			true,
			true,
			true,
			true
		]);

		// Act
		const copy = need(target).cloneNode(true) as HTMLElement;
		copy.querySelectorAll('[role="dialog"]').forEach((d) => d.remove());
		const text = copy.textContent ?? '';

		// Assert
		expect(text).not.toMatch(/FSRS|lịch ôn|thuật toán/i);
		expect(text).not.toMatch(/\d+\s*ngày/);
	});

	it('Given_AllNullResults_When_Done_Then_OnlyBackAction', async () => {
		// Arrange
		await render(cardsOf(['你', '好'], 'viet'));

		// Act
		await playOut(['skip', 'skip']);

		// Assert
		const root = need(doneEl());
		expect(root.querySelector('[data-part="headline"]')).toBeNull();
		expect(root.querySelector('[data-part="scores"]')).toBeNull();
		expect(root.querySelector('[data-part="row"]')).toBeNull();
		expect(root.textContent).toContain(m.practice_run_back());
		expect(attempts().map((a) => a.correct)).toEqual([null, null]);
	});

	it('Given_ThreeMixedSkills_When_Done_Then_ScoreLinePerSkill', async () => {
		// Arrange
		const cards: SessionCard[] = [
			{ word: '你', skill: 'the' },
			{ word: '好', skill: 'nghe' },
			{ word: '谢', skill: 'viet' }
		];
		await render(cards);

		// Act
		await playOut([true, true, true]);

		// Assert
		const scores = need(doneEl()).querySelector('[data-part="scores"]')?.textContent ?? '';
		expect(scores).toContain(m.practice_run_score_the({ right: 1, total: 1 }));
		expect(scores).toContain(m.practice_run_score_nghe({ right: 1, total: 1 }));
		expect(scores).toContain(m.practice_run_score_viet({ right: 1, total: 1 }));
		expect(need(doneEl()).querySelector('[data-part="headline"]')?.textContent?.trim()).toBe(
			m.practice_run_great()
		);
	});
});
