import { describe, expect, it } from 'vitest';
import { savePrefs, serial, toPrefs } from './prefs';

function fake(error: Error | null = null) {
	const calls: unknown[][] = [];
	const client = {
		from: (table: string) => ({
			upsert: async (row: unknown, opts: unknown) => {
				calls.push(['upsert', table, row, opts]);
				return { error };
			}
		})
	};
	return { calls, client: client as never };
}

describe('toPrefs', () => {
	it('Given_Row_When_ToPrefs_Then_SlicedTimeAndStyle', () => {
		expect(toPrefs({ reminder_time: '20:15:00', hanzi_style: 'xing' })).toEqual({
			time: '20:15',
			hanzi: 'xing',
			email: true
		});
	});

	it('Given_NoRow_When_ToPrefs_Then_Defaults', () => {
		expect(toPrefs(null)).toEqual({ time: '21:00', hanzi: 'kai', email: true });
	});

	it('Given_RemindEmailFalse_When_ToPrefs_Then_EmailFalse', () => {
		expect(toPrefs({ reminder_time: '21:00:00', remind_email: false }).email).toBe(false);
	});

	it('Given_NoRow_When_ToPrefs_Then_EmailTrue', () => {
		expect(toPrefs(null).email).toBe(true);
		expect(toPrefs({ remind_email: null }).email).toBe(true);
	});

	it('Given_Unknown_When_ToPrefs_Then_Kai', () => {
		expect(toPrefs({ reminder_time: '07:00:00', hanzi_style: 'abc' }).hanzi).toBe('kai');
	});
});

describe('savePrefs', () => {
	it('Given_TimePatch_When_Save_Then_UpsertReminderTimeOnLearnerId', async () => {
		const { calls, client } = fake();
		await savePrefs(client, 'u1', { time: '12:30' });
		expect(calls).toEqual([
			[
				'upsert',
				'settings',
				{ learner_id: 'u1', reminder_time: '12:30' },
				{ onConflict: 'learner_id' }
			]
		]);
	});

	it('Given_HanziPatch_When_Save_Then_UpsertHanziStyle', async () => {
		const { calls, client } = fake();
		await savePrefs(client, 'u1', { hanzi: 'xing' });
		expect(calls).toEqual([
			[
				'upsert',
				'settings',
				{ learner_id: 'u1', hanzi_style: 'xing' },
				{ onConflict: 'learner_id' }
			]
		]);
	});

	it('Given_EmailPatch_When_Save_Then_UpsertOnlyRemindEmail', async () => {
		const { calls, client } = fake();
		await savePrefs(client, 'u1', { email: false });
		expect(calls).toEqual([
			[
				'upsert',
				'settings',
				{ learner_id: 'u1', remind_email: false },
				{ onConflict: 'learner_id' }
			]
		]);
	});

	it('Given_Error_When_Save_Then_Throws', async () => {
		const { client } = fake(new Error('rls'));
		await expect(savePrefs(client, 'u1', { time: '07:00' })).rejects.toThrow('rls');
	});
});

describe('serial', () => {
	it('Given_TwoJobs_When_Serial_Then_SecondStartsAfterFirst', async () => {
		const run = serial();
		const log: string[] = [];
		let finish = () => {};
		const first = run(
			() =>
				new Promise<void>((r) => {
					log.push('first:start');
					finish = () => {
						log.push('first:end');
						r();
					};
				})
		);
		const second = run(async () => void log.push('second:start'));
		await Promise.resolve();
		expect(log).toEqual(['first:start']);
		finish();
		await Promise.all([first, second]);
		expect(log).toEqual(['first:start', 'first:end', 'second:start']);
	});

	it('Given_FirstRejects_When_Serial_Then_SecondStillRuns', async () => {
		const run = serial();
		const first = run(() => Promise.reject(new Error('boom')));
		const second = run(async () => 'ok');
		await expect(first).rejects.toThrow('boom');
		await expect(second).resolves.toBe('ok');
	});
});
