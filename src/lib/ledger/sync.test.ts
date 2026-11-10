import { IDBFactory } from 'fake-indexeddb';
import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { apply, initialState, type Attempt } from '#lib/study/index.js';
import { att, T } from './fixtures';
import { memoryStore, openLedger, supabaseStore, syncWhenOnline } from './index';

const MIN = 60_000;
const fold = (inputs: Attempt[]) =>
	inputs.reduce((s, i) => apply(s, i, new Date(i.at)).state, initialState());
const json = (body: unknown, status: number) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});
const clientWith = (fetch: typeof globalThis.fetch) =>
	createClient('http://127.0.0.1:56321', 'test-key', {
		auth: { persistSession: false },
		global: { fetch }
	});

describe('sync', () => {
	it('back online, sync exactly once', async () => {
		const store = memoryStore();
		store.online = false;
		const idb = new IDBFactory();
		const ledger = await openLedger({ initial: initialState(), store, idb });
		for (let n = 1; n <= 10; n++)
			await ledger.record(att(`a-${String(n).padStart(2, '0')}`, T + n * MIN, '你', 'the', true));
		const target = new EventTarget();
		const stop = syncWhenOnline(ledger, target);
		await new Promise((r) => setTimeout(r));
		expect(ledger.pending()).toBe(10);
		expect(store.rows()).toHaveLength(0);
		expect(store.pushes).toBe(0);
		store.online = true;
		target.dispatchEvent(new Event('online'));
		await vi.waitFor(() => expect(ledger.pending()).toBe(0));
		expect(store.rows()).toHaveLength(10);
		expect(store.pushes).toBe(1);
		const reopened = await openLedger({ initial: initialState(), store, idb });
		expect(reopened.pending()).toBe(0);
		await reopened.sync();
		expect(store.pushes).toBe(1);
		stop();
		await ledger.record(att('a-11', T + 11 * MIN, '你', 'the', true));
		target.dispatchEvent(new Event('online'));
		await new Promise((r) => setTimeout(r));
		expect(ledger.pending()).toBe(1);
		expect(store.pushes).toBe(1);
	});

	it("another device's Attempts are merged", async () => {
		const store = memoryStore();
		const a = await openLedger({ initial: initialState(), store, idb: new IDBFactory(), db: 'A' });
		const b = await openLedger({ initial: initialState(), store, idb: new IDBFactory(), db: 'B' });
		const [a1, a2, a3] = [1, 3, 5].map((m, i) => att(`a${i + 1}`, T + m * MIN, '你', 'the', true));
		const [b1, b2, b3, b4] = [0, 2, 4, 6].map((m, i) =>
			att(`b${i + 1}`, T + m * MIN, '好', 'nghe', true)
		);
		for (const x of [a1, a2, a3]) await a.record(x);
		for (const x of [b1, b2, b3, b4]) await b.record(x);
		await b.sync();
		expect(store.rows()).toHaveLength(4);
		await a.sync();
		expect(store.rows()).toHaveLength(7);
		expect(a.state()).toEqual(fold([b1, a1, b2, a2, b3, a3, b4]));
		expect(new Set(store.rows().map((r) => ('id' in r ? r.id : r.word))).size).toBe(7);
		await b.sync();
		expect(b.state()).toEqual(a.state());
	});

	it('a failed upload keeps the Attempts', async () => {
		const posts: { url: string; prefer: string | null; body: Record<string, unknown>[] }[] = [];
		const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			if (init?.method === 'POST') {
				posts.push({
					url: String(input),
					prefer: new Headers(init.headers).get('prefer'),
					body: JSON.parse(String(init.body))
				});
				return posts.length === 1 ? json({ message: 'boom' }, 500) : json(null, 201);
			}
			return json([], 200);
		});
		const ledger = await openLedger({
			initial: initialState(),
			store: supabaseStore(clientWith(fetch as typeof globalThis.fetch)),
			idb: new IDBFactory()
		});
		await ledger.record(att('a-01', T + MIN, '你', 'the', true));
		await ledger.record(att('a-02', T + 2 * MIN, '你', 'the', true));
		await expect(ledger.sync()).rejects.toMatchObject({ status: 500 });
		expect(ledger.pending()).toBe(2);
		expect(posts[0].url).toContain('/rest/v1/attempts?on_conflict=learner_id%2Cid');
		expect(posts[0].prefer).toContain('resolution=ignore-duplicates');
		expect(posts[0].body.map((r) => r.id)).toEqual(['a-01', 'a-02']);
		expect(posts[0].body.every((r) => !('learner_id' in r))).toBe(true);
		await ledger.sync();
		expect(posts[1].body.map((r) => r.id)).toEqual(['a-01', 'a-02']);
		expect(ledger.pending()).toBe(0);
	});

	it('pull pages', async () => {
		const gets: string[] = [];
		const row = (n: number) => ({
			id: `p${n}`,
			at: new Date(T + n * 1000).toISOString().replace('Z', '+00:00'),
			question_id: 'q',
			content_sha: 's',
			word: null,
			skill: null,
			correct: true,
			ms: 1,
			answer: null,
			step: null
		});
		const fetch = vi.fn(async (input: RequestInfo | URL) => {
			const url = new URL(String(input));
			gets.push(url.pathname + url.search);
			if (!url.pathname.endsWith('/attempts')) return json([], 200);
			const offset = Number(url.searchParams.get('offset'));
			const n = offset === 2000 ? 3 : 1000;
			return json(
				Array.from({ length: n }, (_, i) => row(offset + i)),
				200
			);
		});
		const pulled = await supabaseStore(clientWith(fetch as typeof globalThis.fetch)).pull();
		expect(pulled).toHaveLength(2003);
		const a = gets.filter((g) => g.includes('/attempts'));
		expect(a[0]).toContain('offset=0&limit=1000');
		expect(a[1]).toContain('offset=1000&limit=1000');
		expect(a[2]).toContain('offset=2000&limit=1000');
		expect(pulled[0]).toMatchObject({ id: 'p0', at: new Date(T).toISOString() });
		expect(pulled[0]).not.toHaveProperty('card');
	});
});
