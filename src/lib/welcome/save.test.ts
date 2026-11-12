import { describe, expect, it } from 'vitest';
import { saveWelcome } from './save';

const state = {
	name: ' Lộc ',
	photo: 'data:image/jpeg;base64,AAA',
	time: '07:00',
	push: false,
	emailOn: true,
	telegram: false
};
const now = new Date('2026-11-11T02:00:00Z');

function fake(fail?: string) {
	const calls: [string, unknown, unknown][] = [];
	const client = {
		from: (table: string) => ({
			upsert: async (row: unknown, opts: unknown) => {
				calls.push([table, row, opts]);
				return { error: fail === table ? new Error(table) : null };
			}
		})
	};
	return { calls, client: client as never };
}
const args = (client: never) => ({ client, learnerId: 'u1', now, tz: 'Asia/Ho_Chi_Minh' });

describe('saveWelcome', () => {
	it('upserts profiles then settings, onboarded_at last', async () => {
		const { calls, client } = fake();
		await saveWelcome(state, args(client));
		expect(calls).toEqual([
			[
				'profiles',
				{ learner_id: 'u1', display_name: 'Lộc', photo_url: 'data:image/jpeg;base64,AAA' },
				{ onConflict: 'learner_id' }
			],
			[
				'settings',
				{
					learner_id: 'u1',
					tz: 'Asia/Ho_Chi_Minh',
					reminder_time: '07:00',
					remind_push: false,
					remind_email: true,
					remind_telegram: false,
					onboarded_at: '2026-11-11T02:00:00.000Z',
					updated_at: '2026-11-11T02:00:00.000Z'
				},
				{ onConflict: 'learner_id' }
			]
		]);
	});

	it('a profiles error rejects and skips settings', async () => {
		const { calls, client } = fake('profiles');
		await expect(saveWelcome(state, args(client))).rejects.toThrow('profiles');
		expect(calls.map((c) => c[0])).toEqual(['profiles']);
	});

	it('a settings error rejects', async () => {
		await expect(saveWelcome(state, args(fake('settings').client))).rejects.toThrow('settings');
	});
});
