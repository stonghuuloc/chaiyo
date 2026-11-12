import { IDBFactory } from 'fake-indexeddb';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apply, initialState, type Attempt } from '#lib/study/index.js';
import { att, T } from './fixtures';
import { openLedger, supabaseStore } from './index';

const MIN = 60_000;
const url = process.env.API_URL ?? '';
const admin = () =>
	createClient(url, process.env.SERVICE_ROLE_KEY ?? '', { auth: { persistSession: false } });
const fold = (inputs: Attempt[]) =>
	inputs.reduce((s, i) => apply(s, i, new Date(i.at)).state, initialState());

describe.skipIf(!process.env.LEDGER_SUPABASE)('ledger on local supabase', () => {
	const made: string[] = [];
	afterEach(async () => {
		for (const id of made.splice(0)) await admin().auth.admin.deleteUser(id);
	});

	async function learner(name: string, fetch?: typeof globalThis.fetch) {
		const email = `${name}-${crypto.randomUUID()}@example.test`;
		const password = crypto.randomUUID();
		const created = await admin().auth.admin.createUser({ email, password, email_confirm: true });
		if (created.error) throw created.error;
		made.push(created.data.user.id);
		const client: SupabaseClient = createClient(url, process.env.PUBLISHABLE_KEY ?? '', {
			auth: { persistSession: false },
			global: fetch ? { fetch } : undefined
		});
		const signed = await client.auth.signInWithPassword({ email, password });
		if (signed.error) throw signed.error;
		return client;
	}
	const count = async (client: SupabaseClient) => {
		const { count: n, error } = await client
			.from('attempts')
			.select('*', { count: 'exact', head: true });
		if (error) throw error;
		return n;
	};

	it('keeps 10 Attempts through a network failure, then uploads them once', async () => {
		let down = false;
		let posts = 0;
		const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			if (down) throw new TypeError('Failed to fetch');
			if (init?.method === 'POST' && String(input).includes('/rest/v1/attempts')) posts += 1;
			return globalThis.fetch(input, init);
		});
		const linh = await learner('linh', fetch as typeof globalThis.fetch);
		const idb = new IDBFactory();
		const ledger = await openLedger({
			initial: initialState(),
			store: supabaseStore(linh, (await linh.auth.getSession()).data.session!.user.id),
			idb
		});
		down = true;
		for (let n = 1; n <= 10; n++)
			await ledger.record(att(`a-${String(n).padStart(2, '0')}`, T + n * MIN, '你', 'the', true));
		await expect(ledger.sync()).rejects.toThrow();
		expect(ledger.pending()).toBe(10);
		down = false;
		await ledger.sync();
		expect(await count(linh)).toBe(10);
		expect(ledger.pending()).toBe(0);
		const reopened = await openLedger({
			initial: initialState(),
			store: supabaseStore(linh, (await linh.auth.getSession()).data.session!.user.id),
			idb
		});
		posts = 0;
		await reopened.sync();
		expect(posts).toBe(0);
	});

	it("merges Linh's other device and hides her rows from Nam", async () => {
		const linh = await learner('linh');
		const nam = await learner('nam');
		const store = supabaseStore(linh, (await linh.auth.getSession()).data.session!.user.id);
		const a = await openLedger({ initial: initialState(), store, idb: new IDBFactory(), db: 'A' });
		const b = await openLedger({ initial: initialState(), store, idb: new IDBFactory(), db: 'B' });
		for (const [i, m] of [0, 2, 4, 6].entries())
			await b.record(att(`b${i + 1}`, T + m * MIN, '好', 'nghe', true));
		await b.sync();
		for (const [i, m] of [1, 3, 5].entries())
			await a.record(att(`a${i + 1}`, T + m * MIN, '你', 'the', true));
		await a.sync();
		const { data, error } = await linh
			.from('attempts')
			.select('id, at, question_id, content_sha, word, skill, correct, ms, answer, step')
			.order('at')
			.order('id');
		if (error) throw error;
		expect(data).toHaveLength(7);
		expect(await count(linh)).toBe(7);
		const server = await store.pull();
		expect(a.state()).toEqual(fold(server as Attempt[]));
		const other = await openLedger({
			initial: initialState(),
			store: supabaseStore(nam, (await nam.auth.getSession()).data.session!.user.id),
			idb: new IDBFactory(),
			db: 'N'
		});
		await other.sync();
		expect(other.pending()).toBe(0);
		expect(await count(nam)).toBe(0);
		expect(other.state()).toEqual(initialState());
	});
});
