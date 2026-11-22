import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { memoryStore, openLedger, type Input } from '#lib/ledger/index';
import { CURRICULUM } from '#lib/study/fixtures/curriculum';
import { initialState, rollover } from '#lib/study/index.js';
import { studied } from './fixtures';
import { tick, type Deps, type Learner, type Rolled } from './tick';

const HCM = 'Asia/Ho_Chi_Minh';

const depsFor = (
	learners: Learner[],
	inputs: Record<string, Input[]>,
	log: string[] = [],
	recorded: Rolled[] = []
): Deps => ({
	curriculum: CURRICULUM,
	learners: async () => learners,
	inputs: async (id) => {
		if (!(id in inputs)) throw new Error(`no inputs for ${id}`);
		return inputs[id];
	},
	record: async (r) => {
		log.push(`record ${r.learner.id}`);
		recorded.push(r);
	},
	remind: async (_now, rolled) => {
		log.push(`remind ${rolled.map((r) => r.learner.id).join(',')}`);
	}
});

describe('tick', () => {
	it('Given_Streak12With1Freeze_When_MissedDay_Then_FreezeSpentAndEqualsPhone', async () => {
		// Arrange
		const a = { id: 'a', tz: HCM };
		const inputs = studied('2026-11-01', '2026-11-12', HCM);
		const recorded: Rolled[] = [];
		const ledger = await openLedger({
			initial: initialState({ curriculum: CURRICULUM, tz: HCM }),
			store: memoryStore(),
			idb: new IDBFactory()
		});
		for (const i of inputs) await ledger.record(i);
		const phone = rollover(ledger.state(), '2026-11-13');

		// Act
		await tick(new Date('2026-11-14T01:00:00Z'), depsFor([a], { a: inputs }, [], recorded));

		// Assert
		expect(recorded[0].state.streak).toMatchObject({ count: 12, freezes: 0 });
		expect(recorded[0].events).toEqual([{ type: 'FreezeSpent', day: '2026-11-13', freezes: 0 }]);
		expect(recorded[0].state.streak).toEqual(phone.state.streak);
		expect(recorded[0].events).toEqual(phone.events);
	});

	it('Given_StudiedYesterday_When_Tick_Then_NoEventsAndStreakKept', async () => {
		// Arrange
		const a = { id: 'a', tz: HCM };
		const inputs = studied('2026-11-01', '2026-11-13', HCM);
		const recorded: Rolled[] = [];

		// Act
		await tick(new Date('2026-11-14T01:00:00Z'), depsFor([a], { a: inputs }, [], recorded));

		// Assert
		expect(recorded[0].events).toEqual([]);
		expect(recorded[0].state.streak).toMatchObject({ count: 13, freezes: 1 });
	});

	it('Given_TwoTimezones_When_Tick_Then_EachRollsItsOwnYesterday', async () => {
		// Arrange
		const learners = [
			{ id: 'hcm', tz: HCM },
			{ id: 'ny', tz: 'America/New_York' }
		];
		const recorded: Rolled[] = [];

		// Act
		await tick(
			new Date('2026-11-23T00:00:00Z'),
			depsFor(learners, { hcm: [], ny: [] }, [], recorded)
		);

		// Assert
		expect(recorded.map((r) => r.day)).toEqual(['2026-11-22', '2026-11-21']);
	});

	it('Given_TwoLearners_When_Tick_Then_RecordsAllBeforeOneRemind', async () => {
		// Arrange
		const learners = [
			{ id: 'a', tz: HCM },
			{ id: 'b', tz: HCM }
		];
		const log: string[] = [];

		// Act
		await tick(new Date('2026-11-23T00:00:00Z'), depsFor(learners, { a: [], b: [] }, log));

		// Assert
		expect(log).toEqual(['record a', 'record b', 'remind a,b']);
	});

	it('Given_MissedYesterdayNoFreeze_When_Tick_Then_StreakResetRecordedBeforeRemind', async () => {
		// Arrange
		const a = { id: 'a', tz: HCM };
		const inputs = studied('2026-11-17', '2026-11-21', HCM);
		const log: string[] = [];
		const recorded: Rolled[] = [];
		const deps = depsFor([a], { a: inputs }, log, recorded);
		let remindedCount: number | undefined;
		const remind = deps.remind;
		deps.remind = async (now, rolled) => {
			remindedCount = rolled[0].state.streak.count;
			await remind(now, rolled);
		};

		// Act
		await tick(new Date('2026-11-23T00:00:00Z'), deps);

		// Assert
		expect(recorded[0].events).toEqual([{ type: 'StreakReset', day: '2026-11-22' }]);
		expect(remindedCount).toBe(0);
		expect(log).toEqual(['record a', 'remind a']);
	});

	it('Given_InputsThrowForB_When_Tick_Then_BFailedAndRemindGetsOnlyA', async () => {
		// Arrange
		const learners = [
			{ id: 'a', tz: HCM },
			{ id: 'b', tz: HCM }
		];
		const log: string[] = [];

		// Act
		const result = await tick(new Date('2026-11-23T00:00:00Z'), depsFor(learners, { a: [] }, log));

		// Assert
		expect(result).toEqual({ rolled: ['a'], failed: ['b'] });
		expect(log).toEqual(['record a', 'remind a']);
	});

	it('Given_NoLearners_When_Tick_Then_RemindStillCalledOnce', async () => {
		// Arrange
		const log: string[] = [];

		// Act
		const result = await tick(new Date('2026-11-23T00:00:00Z'), depsFor([], {}, log));

		// Assert
		expect(result).toEqual({ rolled: [], failed: [] });
		expect(log).toEqual(['remind ']);
	});
});
