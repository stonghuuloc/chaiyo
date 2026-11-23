import { flushSync, mount, tick, unmount } from 'svelte';
import { CURRICULUM } from '#lib/curriculum/index.js';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState, type Skill, type State } from '#lib/study/index.js';
import { countDays } from '#lib/study/fixtures/streak.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { controlName, controls, FREEZE_ACTION } from '../../../../test/controls';
import Page from './+page.svelte';

const past = '2026-11-01T00:00:00.000Z';
const build = (due: number): State => {
	const state = initialState({ curriculum: CURRICULUM });
	state.lessons['h0-00'].passed = true;
	state.lessons['h1-01'].unlocked = true;
	for (let i = 0; i < due; i++) {
		state.lexicon[`w${i}`] = { saved: false, cards: { the: { due: past, first: past, fsrs: {} } } };
	}
	return state;
};

const buildMix = (n: Partial<Record<Skill, number>>): State => {
	const state = build(0);
	for (const skill of ['the', 'nghe', 'viet'] as Skill[]) {
		for (let i = 0; i < (n[skill] ?? 0); i++) {
			const word = `${skill}${i}`;
			state.lexicon[word] ??= { saved: false, cards: {} };
			state.lexicon[word].cards[skill] = { due: past, first: past, fsrs: {} };
		}
	}
	return state;
};

const hoisted = vi.hoisted(() => ({ load: vi.fn() }));
let current: State = build(0);
const listeners = new Set<(s: State) => void>();
const ledger = {
	state: () => current,
	subscribe: (fn: (s: State) => void) => (listeners.add(fn), () => listeners.delete(fn))
} as unknown as Ledger;
const publish = (s: State) => {
	current = s;
	for (const fn of listeners) fn(s);
};

vi.mock('#lib/learner/index.js', () => ({ learnerLedger: hoisted.load }));

const session = { user: { id: 'u1' } };
let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	flushSync();
	await tick();
	await Promise.resolve();
	flushSync();
};

const mountPage = async (data: { session: typeof session | null } = { session }) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target, props: { data } as never }) as Record<string, unknown>;
	await settle();
	return {
		h1: () => target!.querySelectorAll('h1').length,
		cta: () => target!.querySelector('[data-part=next-cta]')?.textContent?.trim(),
		scene: () => target!.querySelector('[data-part=scene]')?.getAttribute('data-scene'),
		scenes: () => target!.querySelectorAll('[data-part=scene]').length,
		ctas: () => target!.querySelectorAll('[data-part=next-cta]').length,
		chip: () => target!.querySelector('[data-part=streak-chip]')?.getAttribute('aria-label'),
		marks: () =>
			[...target!.querySelectorAll('[data-part=week-strip] > li')].map((c) =>
				c.getAttribute('data-mark')
			),
		line: () => target!.querySelector('[data-part=streak-line]')?.textContent?.trim(),
		strips: () => target!.querySelectorAll('[data-part=week-strip]').length,
		dialog: () => document.querySelector('[role=dialog]'),
		practice: () => target!.querySelectorAll('[data-part=practice-row]').length,
		practiceTitle: () => target!.querySelector('[data-part=practice-title]')?.textContent?.trim(),
		roadmap: () => target!.querySelectorAll('[data-part=roadmap]').length,
		now: () => target!.querySelector('[data-part=road-row][data-status=now]')?.textContent?.trim(),
		friends: () => target!.querySelectorAll('[data-part=friends]').length,
		order: () =>
			[
				...target!.querySelectorAll(
					'[data-part=next-cta], [data-part=practice-row], [data-part=roadmap], [data-part=week-strip]'
				)
			].map((e) => e.getAttribute('data-part')),
		click: (part: string) => {
			target!.querySelector<HTMLElement>(`[data-part=${part}]`)!.click();
			flushSync();
		}
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	listeners.clear();
	hoisted.load.mockReset();
});

describe('/today', () => {
	it('Given_Ledger12Due_When_Mount_Then_LuyenHomNayAndReviewsScene', async () => {
		// Arrange
		current = build(12);
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.cta()).toBe('Luyện hôm nay');
		expect(page.scene()).toBe('reviews-due');
	});

	it('Given_NoSession_When_Mount_Then_OnlyH1', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage({ session: null });

		// Assert
		expect(page.h1()).toBe(1);
		expect(page.scenes()).toBe(0);
		expect(page.ctas()).toBe(0);
		expect(page.practice()).toBe(0);
		expect(page.roadmap()).toBe(0);
		expect(hoisted.load).not.toHaveBeenCalled();
	});

	it('Given_RejectingLedger_When_Mount_Then_OnlyH1', async () => {
		// Arrange
		hoisted.load.mockRejectedValue(new Error('idb'));

		// Act
		const page = await mountPage();

		// Assert
		expect(page.h1()).toBe(1);
		expect(page.scenes()).toBe(0);
		expect(page.ctas()).toBe(0);
	});

	it('Given_ReviewsCta_When_LedgerEmitsNoDue_Then_TiepTucBai1', async () => {
		// Arrange
		current = build(12);
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();

		// Act
		publish(build(0));
		await settle();

		// Assert
		expect(page.cta()).toBe('Tiếp tục Bài 1');
		expect(page.scene()).toBe('lesson-next');
	});
});

describe('/today rows', () => {
	it('Given_Ledger6The4Nghe2Viet_When_Mount_Then_PracticeRowUnderCta', async () => {
		// Arrange
		current = buildMix({ the: 6, nghe: 4, viet: 2 });
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.practiceTitle()).toBe('Luyện hôm nay · khoảng 3 phút');
		expect(page.order()).toEqual(['next-cta', 'practice-row', 'roadmap', 'week-strip']);
	});

	it('Given_PracticeRow_When_EmitEmptiesSession_Then_RowGone', async () => {
		// Arrange
		current = buildMix({ the: 6, nghe: 4, viet: 2 });
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();
		expect(page.practice()).toBe(1);

		// Act
		publish(build(0));
		await settle();

		// Assert
		expect(page.practice()).toBe(0);
	});

	it('Given_Ac6State_When_Mount_Then_RoadmapBai1NowAndNoFriends', async () => {
		// Arrange
		current = build(0);
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.roadmap()).toBe(1);
		expect(page.now()).toMatch(/^Bài 1/);
		expect(page.friends()).toBe(0);
	});
});

describe('/today streak', () => {
	const ac4 = (): State => {
		const state = build(0);
		state.streak = {
			count: 11,
			last: '2026-11-17',
			through: '2026-11-17',
			freezes: 2,
			best: 11
		};
		return countDays(state, '2026-11-19', '2026-11-19');
	};

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-11-20T03:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('Given_LedgerAc4State_When_Mount_Then_ChipStripAndAc4Line', async () => {
		// Arrange
		current = ac4();
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.h1()).toBe(1);
		expect(page.chip()).toBe('Chuỗi 12 ngày, còn 1 lượt đóng băng');
		expect(page.marks()).toEqual(['tick', 'tick', 'freeze', 'tick', 'today', 'later', 'later']);
		expect(page.line()).toBe(
			'T4 bạn nghỉ nên app dùng 1 lượt đóng băng. Học xong một phần bài hôm nay là chuỗi lên 13.'
		);
	});

	it('Given_NoSession_When_Mount_Then_NoChipNoStrip', async () => {
		// Arrange
		current = ac4();
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage({ session: null });

		// Assert
		expect(page.h1()).toBe(1);
		expect(page.chip()).toBeUndefined();
		expect(page.strips()).toBe(0);
		expect(page.line()).toBeUndefined();
	});

	it('Given_Ac4State_When_LedgerEmitsCountedToday_Then_Ac5Line', async () => {
		// Arrange
		current = ac4();
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();

		// Act
		publish(countDays(ac4(), '2026-11-20', '2026-11-20'));
		await settle();

		// Assert
		expect(page.chip()).toBe('Chuỗi 13 ngày, còn 1 lượt đóng băng');
		expect(page.marks()[4]).toBe('tick');
		expect(page.line()).toBe('Hôm nay đã tính rồi, chuỗi 13 ngày. Mai gặp lại nha!');
	});
});

describe('/today freeze card', () => {
	const frozen = (): State => ({
		...build(0),
		streak: { count: 12, last: '2026-11-10', through: '2026-11-10', freezes: 2, best: 12 }
	});

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-11-12T02:00:00Z'));
		current = frozen();
		hoisted.load.mockResolvedValue(ledger);
	});

	afterEach(() => {
		vi.useRealTimers();
		localStorage.clear();
		document.body.querySelectorAll('[role=dialog]').forEach((d) => d.remove());
	});

	it('Given_FreezeSpentYesterday_When_Mount_Then_FreezeCardAndSeenStored', async () => {
		// Arrange / Act
		const page = await mountPage();

		// Assert
		expect(page.dialog()!.querySelector('h2')!.textContent).toBe('Chuỗi vẫn còn nguyên!');
		expect(localStorage.getItem('chaiyo.freeze-seen.u1')).toBe('2026-11-11');
	});

	it('Given_SeenToday_When_Remount_Then_NoFreezeCard', async () => {
		// Arrange
		await mountPage();
		unmount(app as never);
		target?.remove();
		target = app = undefined;
		await settle();

		// Act
		const page = await mountPage();

		// Assert
		expect(page.dialog()).toBeNull();
		expect(localStorage.getItem('chaiyo.freeze-seen.u1')).toBe('2026-11-11');
	});

	it('Given_ClosedCard_When_LedgerPublishes_Then_NoReopen', async () => {
		// Arrange
		const page = await mountPage();
		page.dialog()!.querySelector('button')!.click();
		await expect.poll(() => page.dialog()).toBeNull();

		// Act
		publish(frozen());
		await settle();

		// Assert
		expect(page.dialog()).toBeNull();
	});

	it('Given_SyncPublishesFreezeAfterMount_When_Publish_Then_FreezeCard', async () => {
		// Arrange
		current = build(0);
		const page = await mountPage();
		expect(page.dialog()).toBeNull();

		// Act
		publish(frozen());
		await settle();

		// Assert
		expect(page.dialog()).not.toBeNull();
	});

	it('Given_OtherLearnerSeen_When_Mount_Then_FreezeCard', async () => {
		// Arrange
		localStorage.setItem('chaiyo.freeze-seen.u2', '2026-11-11');

		// Act
		const page = await mountPage();

		// Assert
		expect(page.dialog()).not.toBeNull();
	});
});

describe('/today rules sheet', () => {
	const ac4 = (): State => {
		const state = build(0);
		state.streak = {
			count: 11,
			last: '2026-11-17',
			through: '2026-11-17',
			freezes: 2,
			best: 11
		};
		return countDays(state, '2026-11-19', '2026-11-19');
	};
	const hieuRoi = () =>
		[...document.querySelectorAll<HTMLElement>('[role=dialog] button')].find(
			(b) => b.textContent?.trim() === 'Hiểu rồi'
		)!;

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-11-20T03:00:00Z'));
		current = ac4();
		hoisted.load.mockResolvedValue(ledger);
	});

	afterEach(() => {
		vi.useRealTimers();
		localStorage.clear();
		document.body.querySelectorAll('[role=dialog]').forEach((d) => d.remove());
	});

	it.each(['streak-chip', 'week-info', 'freeze-rules-link'])(
		'Given_Ac4_When_Click_%s_Then_RulesSheet1of2And4Rules',
		async (part) => {
			// Arrange
			const page = await mountPage();
			expect(page.dialog()).toBeNull();

			// Act
			page.click(part);

			// Assert
			const d = page.dialog()!;
			expect(d.querySelector('h2')?.textContent).toBe('Lượt đóng băng là gì?');
			expect(d.textContent).toContain('Bạn đang có 1/2 lượt');
			expect(d.querySelectorAll('[data-part=freeze-rule]')).toHaveLength(4);
		}
	);

	it('Given_OpenSheet_When_ClickHieuRoi_Then_Closed', async () => {
		// Arrange
		const page = await mountPage();
		page.click('streak-chip');

		// Act
		hieuRoi().click();

		// Assert
		await expect.poll(() => page.dialog()).toBeNull();
	});

	it('Given_OpenSheet_When_Escape_Then_Closed', async () => {
		// Arrange
		const page = await mountPage();
		page.click('streak-chip');
		expect(page.dialog()).not.toBeNull();

		// Act
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		flushSync();

		// Assert
		await expect.poll(() => page.dialog()).toBeNull();
	});

	it('Given_OpenThenClose_When_Read_Then_ChipMarksLineUnchanged', async () => {
		// Arrange
		const page = await mountPage();
		const before = { chip: page.chip(), marks: page.marks(), line: page.line() };

		// Act
		page.click('streak-chip');
		hieuRoi().click();
		await expect.poll(() => page.dialog()).toBeNull();

		// Assert
		expect({ chip: page.chip(), marks: page.marks(), line: page.line() }).toEqual(before);
	});
});
