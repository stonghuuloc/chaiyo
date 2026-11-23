import { describe, expect, it } from 'vitest';
import { leaveName, loadProfile, saveProfile } from './profile';

function fake(row: unknown = null, error: Error | null = null) {
	const calls: unknown[][] = [];
	const client = {
		from: (table: string) => ({
			select: (cols: string) => ({
				eq: (col: string, val: string) => ({
					maybeSingle: async () => {
						calls.push(['select', table, cols, col, val]);
						return { data: row, error: null };
					}
				})
			}),
			upsert: async (r: unknown, opts: unknown) => {
				calls.push(['upsert', table, r, opts]);
				return { error };
			}
		})
	};
	return { calls, client: client as never };
}

describe('profile', () => {
	it('Given_Row_When_Load_Then_MapsColumns', async () => {
		const { calls, client } = fake({ display_name: 'Tống Lộc', photo_url: 'data:x', hidden: true });
		expect(await loadProfile(client, 'u1')).toEqual({
			name: 'Tống Lộc',
			photo: 'data:x',
			hidden: true
		});
		expect(calls).toEqual([
			['select', 'profiles', 'display_name, photo_url, hidden', 'learner_id', 'u1']
		]);
	});

	it('Given_NoRow_When_Load_Then_Defaults', async () => {
		const { client } = fake(null);
		expect(await loadProfile(client, 'u1')).toEqual({ name: '', photo: null, hidden: false });
	});

	it('Given_NamePatch_When_Save_Then_UpsertDisplayNameOnLearnerId', async () => {
		const { calls, client } = fake();
		await saveProfile(client, 'u1', { name: 'Lộc T' });
		await saveProfile(client, 'u1', { photo: null });
		await saveProfile(client, 'u1', { hidden: true });
		expect(calls).toEqual([
			[
				'upsert',
				'profiles',
				{ learner_id: 'u1', display_name: 'Lộc T' },
				{ onConflict: 'learner_id' }
			],
			['upsert', 'profiles', { learner_id: 'u1', photo_url: null }, { onConflict: 'learner_id' }],
			['upsert', 'profiles', { learner_id: 'u1', hidden: true }, { onConflict: 'learner_id' }]
		]);
	});

	it('Given_UpsertError_When_Save_Then_Throws', async () => {
		const { client } = fake(null, new Error('rls'));
		await expect(saveProfile(client, 'u1', { name: 'x' })).rejects.toThrow('rls');
	});

	it('Given_Blank_When_LeaveName_Then_SavedNoWrite', () => {
		expect(leaveName('Tống Lộc', '   ')).toEqual({ value: 'Tống Lộc', write: false });
	});

	it('Given_Same_When_LeaveName_Then_NoWrite', () => {
		expect(leaveName('Tống Lộc', ' Tống Lộc ')).toEqual({ value: 'Tống Lộc', write: false });
	});

	it('Given_Padded_When_LeaveName_Then_TrimmedWrite', () => {
		expect(leaveName('Tống Lộc', '  Lộc T ')).toEqual({ value: 'Lộc T', write: true });
	});
});
