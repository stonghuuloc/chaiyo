import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { countDays } from '#lib/study/fixtures/streak.js';
import { initialState, type Card, type State } from '#lib/study/index.js';
import { publicStats, publishOnChange, publishStats, type PublicStats } from './stats';

const at = (iso: string) => new Date(iso);
const fresh = () => initialState({ curriculum: CURRICULUM });
const streak12 = () => countDays(fresh(), '2026-11-01', '2026-11-12');
const card = (first: string) => ({ due: first, first, fsrs: {} }) as Card;

describe('publicStats', () => {
	it('Given_CountedToday_When_Stats_Then_StreakAndUntilTodayPlus1PlusFreezes', () => {
		const s = publicStats(streak12(), at('2026-11-12T05:00:00Z'));
		expect(s).toMatchObject({ streak: 12, streakUntil: '2026-11-14' });
	});

	it('Given_NotCountedToday_When_Stats_Then_RolledToYesterday', () => {
		const s = publicStats(streak12(), at('2026-11-13T05:00:00Z'));
		expect(s).toMatchObject({ streak: 12, streakUntil: '2026-11-14' });
	});

	it('Given_ResetStreak_When_Stats_Then_0AndToday', () => {
		const base = streak12();
		const s = publicStats(
			{ ...base, streak: { ...base.streak, freezes: 0 } },
			at('2026-11-15T05:00:00Z')
		);
		expect(s).toMatchObject({ streak: 0, streakUntil: '2026-11-15' });
	});

	it('Given_CardFirstSunday_When_StatsMonday_Then_NotInWeek', () => {
		const state: State = {
			...fresh(),
			lexicon: {
				你: {
					saved: false,
					cards: { the: card('2026-11-15T16:00:00Z'), nghe: card('2026-11-16T01:00:00Z') }
				}
			}
		};
		expect(publicStats(state, at('2026-11-16T03:00:00Z'))).toMatchObject({
			wordsWeek: 0,
			wordsKnown: 1
		});
	});

	it('Given_CardFirstMonday_Then_InWeek', () => {
		const state: State = {
			...fresh(),
			lexicon: { 你: { saved: false, cards: { the: card('2026-11-15T17:30:00Z') } } }
		};
		expect(publicStats(state, at('2026-11-22T16:00:00Z'))).toMatchObject({ wordsWeek: 1 });
	});

	it('Given_SavedOnly_When_Stats_Then_KnownCountsIt', () => {
		const state: State = { ...fresh(), lexicon: { 你: { saved: true, cards: {} } } };
		expect(publicStats(state, at('2026-11-16T03:00:00Z'))).toMatchObject({
			wordsKnown: 1,
			wordsWeek: 0
		});
	});

	it('Given_AnchorH102_When_Stats_Then_Lesson2', () => {
		const base = fresh();
		const state: State = {
			...base,
			lessons: {
				...base.lessons,
				'h0-00': { unlocked: true, passed: true, done: [] },
				'h1-01': { unlocked: true, passed: true, done: [] },
				'h1-02': { unlocked: true, passed: false, done: [] }
			}
		};
		expect(publicStats(state, at('2026-11-16T03:00:00Z'))).toMatchObject({ lesson: 2, hsk: 1 });
	});

	it('Given_AllPassed_When_Stats_Then_HighestPassedN', () => {
		const base = fresh();
		const state: State = {
			...base,
			lessons: Object.fromEntries(
				Object.keys(base.lessons).map((id) => [id, { unlocked: true, passed: true, done: [] }])
			)
		};
		expect(publicStats(state, at('2026-11-16T03:00:00Z'))).toMatchObject({
			lesson: 116,
			hsk: 5
		});
	});

	it('Given_Fresh_When_Stats_Then_Lesson0Hsk1', () => {
		expect(publicStats(fresh(), at('2026-11-16T03:00:00Z'))).toEqual({
			streak: 0,
			streakUntil: '2026-11-16',
			wordsWeek: 0,
			wordsKnown: 0,
			hsk: 1,
			lesson: 0,
			badges: []
		});
	});

	it('Given_Badges_When_Stats_Then_SortedIds', () => {
		const state = initialState({
			curriculum: CURRICULUM,
			badges: { streak7: '2026-11-07T00:00:00Z', first: '2026-11-01T00:00:00Z' }
		});
		expect(publicStats(state, at('2026-11-16T03:00:00Z')).badges).toEqual(['first', 'streak7']);
	});
});

const STATS: PublicStats = {
	streak: 12,
	streakUntil: '2026-11-14',
	wordsWeek: 9,
	wordsKnown: 40,
	hsk: 1,
	lesson: 3,
	badges: ['first']
};

const rpcClient = (rpc: ReturnType<typeof vi.fn>) => ({ rpc }) as unknown as SupabaseClient;

describe('publishStats', () => {
	it('Given_Rpc_When_Publish_Then_SnakeCaseArgs', async () => {
		const rpc = vi.fn(async () => ({ data: true, error: null }));
		expect(await publishStats(rpcClient(rpc), STATS)).toBe(true);
		expect(rpc).toHaveBeenCalledWith('publish_stats', {
			p_streak: 12,
			p_streak_until: '2026-11-14',
			p_words_week: 9,
			p_words_known: 40,
			p_hsk: 1,
			p_lesson: 3,
			p_badges: ['first']
		});
	});

	it('Given_RpcError_Then_Throws', async () => {
		const rpc = vi.fn(async () => ({ data: null, error: { message: 'boom' } }));
		await expect(publishStats(rpcClient(rpc), STATS)).rejects.toThrow('boom');
	});
});

describe('publishOnChange', () => {
	let state: State;
	const listeners = new Set<(s: State) => void>();
	const ledger = {
		state: () => state,
		subscribe: (fn: (s: State) => void) => (listeners.add(fn), () => void listeners.delete(fn)),
		sync: vi.fn(async () => {})
	};
	const change = (next: State = state) => {
		state = next;
		for (const fn of listeners) fn(next);
	};
	const bump = () =>
		change({ ...state, written: state.written + 1, badges: { ...state.badges, first: 'x' } });

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(at('2026-11-12T05:00:00Z'));
		state = streak12();
		listeners.clear();
		ledger.sync.mockReset().mockResolvedValue(undefined);
	});
	afterEach(() => vi.useRealTimers());

	const open = async (rpc: ReturnType<typeof vi.fn>) => {
		const stop = publishOnChange(ledger, rpcClient(rpc));
		await vi.advanceTimersByTimeAsync(0);
		return stop;
	};

	it('Given_Open_When_SyncDone_Then_OneRpc', async () => {
		const rpc = vi.fn(async () => ({ data: true, error: null }));
		await open(rpc);
		expect(ledger.sync).toHaveBeenCalledTimes(1);
		expect(rpc).toHaveBeenCalledTimes(1);
	});

	it('Given_SyncRejects_When_Open_Then_StillPublishes', async () => {
		ledger.sync.mockRejectedValue(new Error('offline'));
		const rpc = vi.fn(async () => ({ data: true, error: null }));
		await open(rpc);
		expect(rpc).toHaveBeenCalledTimes(1);
	});

	it('Given_Change_When_Publish_Then_SyncRunsBeforeRpc', async () => {
		const order: string[] = [];
		ledger.sync.mockImplementation(async () => void order.push('sync'));
		const rpc = vi.fn(async () => (order.push('rpc'), { data: true, error: null }));
		await open(rpc);
		order.length = 0;
		bump();
		await vi.advanceTimersByTimeAsync(2000);
		expect(order).toEqual(['sync', 'rpc']);
	});

	it('Given_SyncFailsThenWorks_When_Change_Then_PayloadRepublished', async () => {
		ledger.sync.mockRejectedValue(new Error('offline'));
		const rpc = vi.fn(async () => ({ data: true, error: null }));
		await open(rpc);
		ledger.sync.mockResolvedValue(undefined);
		change();
		await vi.advanceTimersByTimeAsync(2000);
		expect(rpc).toHaveBeenCalledTimes(2);
	});

	it('Given_TwoChangesIn2s_When_OnChange_Then_OneRpc', async () => {
		const rpc = vi.fn(async () => ({ data: true, error: null }));
		await open(rpc);
		bump();
		await vi.advanceTimersByTimeAsync(1000);
		bump();
		await vi.advanceTimersByTimeAsync(1999);
		expect(rpc).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1);
		expect(rpc).toHaveBeenCalledTimes(2);
	});

	it('Given_SamePayload_Then_NoSecondRpc', async () => {
		const rpc = vi.fn(async () => ({ data: true, error: null }));
		await open(rpc);
		change();
		await vi.advanceTimersByTimeAsync(2000);
		expect(rpc).toHaveBeenCalledTimes(1);
	});

	it('Given_RpcFalse_When_SamePayloadAgain_Then_Resent', async () => {
		const rpc = vi.fn(async () => ({ data: false, error: null }));
		await open(rpc);
		change();
		await vi.advanceTimersByTimeAsync(2000);
		expect(rpc).toHaveBeenCalledTimes(2);
	});

	it('Given_RpcRejects_Then_NoThrowAndNextChangeRetries', async () => {
		const rpc = vi
			.fn()
			.mockRejectedValueOnce(new Error('network'))
			.mockResolvedValueOnce({ data: null, error: { message: 'boom' } })
			.mockResolvedValue({ data: true, error: null });
		await open(rpc);
		change();
		await vi.advanceTimersByTimeAsync(2000);
		change();
		await vi.advanceTimersByTimeAsync(2000);
		change();
		await vi.advanceTimersByTimeAsync(2000);
		expect(rpc).toHaveBeenCalledTimes(3);
	});

	it('Given_Stop_Then_NoMoreRpc', async () => {
		const rpc = vi.fn(async () => ({ data: true, error: null }));
		const stop = await open(rpc);
		bump();
		stop();
		await vi.advanceTimersByTimeAsync(5000);
		bump();
		await vi.advanceTimersByTimeAsync(5000);
		expect(rpc).toHaveBeenCalledTimes(1);
	});

	it('Given_StopBeforeSync_Then_NoRpc', async () => {
		let done = () => {};
		ledger.sync.mockReturnValue(new Promise<void>((r) => (done = r)));
		const rpc = vi.fn(async () => ({ data: true, error: null }));
		const stop = publishOnChange(ledger, rpcClient(rpc));
		stop();
		done();
		await vi.advanceTimersByTimeAsync(0);
		expect(rpc).not.toHaveBeenCalled();
	});
});
