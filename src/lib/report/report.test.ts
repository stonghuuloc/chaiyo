import { IDBFactory } from 'fake-indexeddb';
import { createClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openReports, report } from './index';

const json = (body: unknown, status: number) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});

const clientWith = (fetch: typeof globalThis.fetch, who: string) => {
	const client = createClient('http://127.0.0.1:56321', 'test-key', {
		auth: { persistSession: false },
		global: { fetch }
	});
	vi.spyOn(client.auth, 'getSession').mockResolvedValue({
		data: { session: { user: { id: who } } },
		error: null
	} as Awaited<ReturnType<typeof client.auth.getSession>>);
	vi.spyOn(client.auth, 'onAuthStateChange').mockReturnValue({
		data: { subscription: { unsubscribe() {} } }
	} as unknown as ReturnType<typeof client.auth.onAuthStateChange>);
	return client;
};

const recording = () => {
	const posts: Record<string, unknown>[] = [];
	return {
		posts,
		fetch: async (_input: RequestInfo | URL, init?: RequestInit) => {
			posts.push(JSON.parse(String(init?.body)));
			return json([], 201);
		}
	};
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

beforeEach(() => void vi.stubGlobal('window', new EventTarget()));
afterEach(() => vi.unstubAllGlobals());

describe('report', () => {
	it('report stores its context', async () => {
		// Arrange
		const net = recording();
		const client = clientWith(net.fetch, 'u-store');
		const idb = new IDBFactory();

		// Act
		await report(
			{ lesson: 'h1-01', step: 'w03', word: '你好', contentSha: 'sha1' },
			'hanviet',
			' Hán Việt lệch ',
			{ client, idb }
		);
		await (await openReports({ user: { id: 'u-store' } }, { client, idb })).flush();

		// Assert
		expect(net.posts).toHaveLength(1);
		const body = net.posts[0];
		expect(Object.keys(body).sort()).toEqual([
			'category',
			'content_sha',
			'created_at',
			'id',
			'lesson_id',
			'note',
			'step_id',
			'word_id'
		]);
		expect(body).toMatchObject({
			lesson_id: 'h1-01',
			step_id: 'w03',
			word_id: '你好',
			content_sha: 'sha1',
			category: 'hanviet',
			note: 'Hán Việt lệch'
		});
		expect(String(body.id)).toMatch(UUID);
		expect(Number.isNaN(Date.parse(String(body.created_at)))).toBe(false);
	});

	it('word-page report has no lesson', async () => {
		// Arrange
		const net = recording();
		const client = clientWith(net.fetch, 'u-word');
		const idb = new IDBFactory();

		// Act
		await report({ lesson: null, step: null, word: '你好', contentSha: 'sha1' }, 'audio', '', {
			client,
			idb
		});
		await (await openReports({ user: { id: 'u-word' } }, { client, idb })).flush();

		// Assert
		expect(net.posts[0]).toMatchObject({ lesson_id: null, step_id: null, word_id: '你好' });
	});

	it('report opens the queue itself', async () => {
		// Arrange
		const client = clientWith(() => Promise.reject(new TypeError('offline')), 'u-own');
		const idb = new IDBFactory();

		// Act
		await report({ lesson: 'h1-01', step: 'w03', word: null, contentSha: 'sha1' }, 'other', '', {
			client,
			idb
		});
		const queue = await openReports({ user: { id: 'u-own' } }, { client, idb });

		// Assert
		expect(queue.pending()).toBe(1);
	});

	it('blank note is null', async () => {
		// Arrange
		const net = recording();
		const client = clientWith(net.fetch, 'u-note');
		const idb = new IDBFactory();

		// Act
		await report({ lesson: null, step: null, word: '你好', contentSha: 'sha1' }, 'pinyin', '   ', {
			client,
			idb
		});
		await (await openReports({ user: { id: 'u-note' } }, { client, idb })).flush();

		// Assert
		expect(net.posts[0].note).toBe(null);
	});

	it('409 23505 counts as sent', async () => {
		// Arrange
		const client = clientWith(
			async () => json({ code: '23505', message: 'duplicate key value' }, 409),
			'u-dup'
		);
		const idb = new IDBFactory();

		// Act
		await report({ lesson: null, step: null, word: '你好', contentSha: 'sha1' }, 'meaning', '', {
			client,
			idb
		});
		await (await openReports({ user: { id: 'u-dup' } }, { client, idb })).flush();

		// Assert
		expect((await openReports({ user: { id: 'u-dup' } }, { client, idb })).pending()).toBe(0);
	});

	it('signed-out report throws', async () => {
		// Arrange
		const client = clientWith(recording().fetch, 'u-out');
		vi.spyOn(client.auth, 'getSession').mockResolvedValue({
			data: { session: null },
			error: null
		} as Awaited<ReturnType<typeof client.auth.getSession>>);

		// Act / Assert
		await expect(
			report({ lesson: null, step: null, word: '你好', contentSha: 'sha1' }, 'audio', '', {
				client,
				idb: new IDBFactory()
			})
		).rejects.toThrow('signed out');
	});

	it('sign-out drops the cached queue', async () => {
		// Arrange
		const client = clientWith(recording().fetch, 'u-drop');
		let onAuth: (event: string, next: { user: { id: string } } | null) => void = () => {};
		const unsubscribe = vi.fn();
		vi.spyOn(client.auth, 'onAuthStateChange').mockImplementation((cb) => {
			onAuth = cb as typeof onAuth;
			return { data: { subscription: { unsubscribe } } } as unknown as ReturnType<
				typeof client.auth.onAuthStateChange
			>;
		});
		const idb = new IDBFactory();
		const session = { user: { id: 'u-drop' } };
		const first = openReports(session, { client, idb });
		await first;

		// Act
		onAuth('TOKEN_REFRESHED', session);
		const kept = openReports(session, { client, idb });
		onAuth('SIGNED_OUT', null);
		const fresh = openReports(session, { client, idb });

		// Assert
		expect(kept).toBe(first);
		expect(unsubscribe).toHaveBeenCalledTimes(1);
		expect(fresh).not.toBe(first);
		await fresh;
	});

	it('queued report goes out on online', async () => {
		// Arrange
		let online = false;
		const posts: Record<string, unknown>[] = [];
		const client = clientWith(async (_input, init) => {
			if (!online) throw new TypeError('offline');
			posts.push(JSON.parse(String(init?.body)));
			return json([], 201);
		}, 'u-online');
		const idb = new IDBFactory();
		await report({ lesson: null, step: null, word: '你好', contentSha: 'sha1' }, 'pinyin', '', {
			client,
			idb
		});
		const queue = await openReports({ user: { id: 'u-online' } }, { client, idb });
		expect(queue.pending()).toBe(1);

		// Act
		online = true;
		window.dispatchEvent(new Event('online'));
		await queue.flush();

		// Assert
		expect(queue.pending()).toBe(0);
		expect(posts).toHaveLength(1);
	});
});
