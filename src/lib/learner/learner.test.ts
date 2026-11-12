import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { learnerLedger } from './index';

function stub(tz: string | null, signedOut: { fire?: (e: string) => void } = {}) {
	return {
		from: () => ({
			select: () => ({
				eq: () => ({ maybeSingle: async () => ({ data: tz ? { tz } : null, error: null }) })
			})
		}),
		auth: {
			onAuthStateChange: (fn: (e: string) => void) => {
				signedOut.fire = fn;
				return { data: { subscription: { unsubscribe() {} } } };
			}
		}
	} as unknown as SupabaseClient;
}

beforeEach(() => void vi.stubGlobal('window', new EventTarget()));
afterEach(() => vi.unstubAllGlobals());

describe('learnerLedger', () => {
	it('opens one Ledger per learner in chaiyo-ledger-<uid>, with the learner timezone', async () => {
		const idb = new IDBFactory();
		const a = await learnerLedger({ user: { id: 'u-a' } }, { client: stub('Asia/Tokyo'), idb });
		expect(await learnerLedger({ user: { id: 'u-a' } }, { client: stub('x'), idb })).toBe(a);
		const b = await learnerLedger({ user: { id: 'u-b' } }, { client: stub(null), idb });
		expect(b).not.toBe(a);
		expect(a.state().tz).toBe('Asia/Tokyo');
		expect(b.state().tz).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
		expect((await idb.databases()).map((d) => d.name).sort()).toEqual([
			'chaiyo-ledger-u-a',
			'chaiyo-ledger-u-b'
		]);
	});

	it('forgets the Ledger on SIGNED_OUT', async () => {
		const idb = new IDBFactory();
		const hook: { fire?: (e: string) => void } = {};
		const client = stub('Asia/Tokyo', hook);
		const a = await learnerLedger({ user: { id: 'u-c' } }, { client, idb });
		hook.fire?.('TOKEN_REFRESHED');
		expect(await learnerLedger({ user: { id: 'u-c' } }, { client, idb })).toBe(a);
		hook.fire?.('SIGNED_OUT');
		expect(await learnerLedger({ user: { id: 'u-c' } }, { client, idb })).not.toBe(a);
	});
});
