import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { learnerLedger } from './index';

type Hook = { fire?: (e: string, s?: { user: { id: string } } | null) => void };

function stub(
	tz: string | null,
	signedOut: Hook = {},
	who = '',
	tables: string[] = [],
	rpc = vi.fn(async () => ({ data: true, error: null }))
) {
	return {
		rpc,
		from: (table: string) => (
			tables.push(table),
			{
				select: () => ({
					eq: () => ({ maybeSingle: async () => ({ data: tz ? { tz } : null, error: null }) })
				})
			}
		),
		auth: {
			getSession: async () => ({ data: { session: who ? { user: { id: who } } : null } }),
			onAuthStateChange: (fn: NonNullable<Hook['fire']>) => {
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
		const hook: Hook = {};
		const client = stub('Asia/Tokyo', hook);
		const a = await learnerLedger({ user: { id: 'u-c' } }, { client, idb });
		hook.fire?.('TOKEN_REFRESHED');
		expect(await learnerLedger({ user: { id: 'u-c' } }, { client, idb })).toBe(a);
		hook.fire?.('SIGNED_OUT');
		const sync = vi.spyOn(a, 'sync');
		sync.mockClear();
		window.dispatchEvent(new Event('online'));
		expect(sync).not.toHaveBeenCalled();
		expect(await learnerLedger({ user: { id: 'u-c' } }, { client, idb })).not.toBe(a);
	});

	it('never syncs when the shared client is signed in as another learner', async () => {
		const tables: string[] = [];
		const a = await learnerLedger(
			{ user: { id: 'u-f' } },
			{ client: stub('Asia/Tokyo', {}, 'u-g', tables), idb: new IDBFactory() }
		);
		await a.record({
			id: 'x',
			at: '2026-11-11T02:00:00Z',
			questionId: 'q',
			contentSha: 's',
			correct: true,
			ms: 1
		});
		await expect(a.sync()).rejects.toThrow('another learner');
		expect(tables).toEqual(['settings']);
		expect(a.pending()).toBe(1);
	});

	it('forgets the Ledger when another learner signs in over it', async () => {
		const idb = new IDBFactory();
		const hook: Hook = {};
		const client = stub('Asia/Tokyo', hook);
		const a = await learnerLedger({ user: { id: 'u-d' } }, { client, idb });
		hook.fire?.('SIGNED_IN', { user: { id: 'u-d' } });
		expect(await learnerLedger({ user: { id: 'u-d' } }, { client, idb })).toBe(a);
		hook.fire?.('SIGNED_IN', { user: { id: 'u-e' } });
		const sync = vi.spyOn(a, 'sync');
		window.dispatchEvent(new Event('online'));
		expect(sync).not.toHaveBeenCalled();
		expect(await learnerLedger({ user: { id: 'u-d' } }, { client, idb })).not.toBe(a);
	});

	it('Given_Open_When_SyncDone_Then_PublishStatsOnce', async () => {
		const rpc = vi.fn(async () => ({ data: true, error: null }));
		const client = stub('Asia/Tokyo', {}, 'u-h', [], rpc);
		await learnerLedger({ user: { id: 'u-h' } }, { client, idb: new IDBFactory() });
		await vi.waitFor(() => expect(rpc).toHaveBeenCalledTimes(1));
		expect(rpc).toHaveBeenCalledWith('publish_stats', expect.objectContaining({ p_streak: 0 }));
	});

	it('Given_SignOut_Then_NoPublishAfter', async () => {
		const rpc = vi.fn(async () => ({ data: true, error: null }));
		const hook: Hook = {};
		const client = stub('Asia/Tokyo', hook, 'u-i', [], rpc);
		const a = await learnerLedger({ user: { id: 'u-i' } }, { client, idb: new IDBFactory() });
		await vi.waitFor(() => expect(rpc).toHaveBeenCalledTimes(1));
		hook.fire?.('SIGNED_OUT');
		await a.record({
			id: 'y',
			at: '2026-11-11T02:00:00Z',
			questionId: 'q',
			contentSha: 's',
			correct: true,
			ms: 1,
			card: { word: '你', skill: 'the' }
		});
		await new Promise((r) => setTimeout(r, 2100));
		expect(rpc).toHaveBeenCalledTimes(1);
	});
});
