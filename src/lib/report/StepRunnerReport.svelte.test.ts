import { IDBFactory } from 'fake-indexeddb';
import { createClient } from '@supabase/supabase-js';
import { flushSync, mount, unmount } from 'svelte';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { memoryStore, openLedger, type Ledger } from '#lib/ledger/index.js';
import type { LessonStep } from '#lib/lesson/index.js';
import StepRunner from '#lib/lesson/StepRunner.svelte';
import { m } from '#lib/paraglide/messages.js';
import { initialState } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openReports } from './index';

const UID = 'u-step';

// The button's default sender is the app client; the layout owns the queue, so stub the session only.
vi.mock('#lib/supabase.js', () => ({
	supabase: { auth: { getSession: async () => ({ data: { session: { user: { id: UID } } } }) } }
}));
vi.mock('#lib/components/HanziStrokes.svelte', () => import('../../test/FakeStrokes.svelte'));

const steps: LessonStep[] = [
	{
		kind: 'choice',
		id: 'q0',
		ask: 'Chọn nghĩa',
		title: 'Câu 1',
		options: ['好', '你'],
		answer: '好'
	},
	{
		kind: 'choice',
		id: 'q1',
		ask: 'Chọn nghĩa',
		title: 'Câu 2',
		options: ['好', '你'],
		answer: '好',
		card: { word: '你好', skill: 'the' }
	}
];

const recording = () => {
	const posts: Record<string, unknown>[] = [];
	return {
		posts,
		client: (() => {
			const client = createClient('http://127.0.0.1:56321', 'test-key', {
				auth: { persistSession: false },
				global: {
					fetch: async (_input: RequestInfo | URL, init?: RequestInit) => {
						posts.push(JSON.parse(String(init?.body)));
						return new Response('[]', {
							status: 201,
							headers: { 'content-type': 'application/json' }
						});
					}
				}
			});
			vi.spyOn(client.auth, 'getSession').mockResolvedValue({
				data: { session: { user: { id: UID } } },
				error: null
			} as Awaited<ReturnType<typeof client.auth.getSession>>);
			vi.spyOn(client.auth, 'onAuthStateChange').mockReturnValue({
				data: { subscription: { unsubscribe() {} } }
			} as unknown as ReturnType<typeof client.auth.onAuthStateChange>);
			return client;
		})()
	};
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
// openReports caches one queue per learner for the module's lifetime, so every test shares its client.
let shared: ReturnType<typeof recording> | undefined;

const mountRunner = async (list: LessonStep[] = steps) => {
	const net = (shared ??= recording());
	net.posts.length = 0;
	const idb = new IDBFactory();
	vi.stubGlobal('indexedDB', idb);
	await openReports({ user: { id: UID } }, { client: net.client, idb });
	const ledger: Ledger = await openLedger({
		initial: initialState({ curriculum: CURRICULUM }),
		store: memoryStore(),
		idb: new IDBFactory()
	});
	target = document.createElement('div');
	document.body.append(target);
	app = mount(StepRunner, {
		target,
		props: {
			steps: list,
			mode: 'feedback',
			exit: '/today',
			lesson: 'h1-01',
			section: 'words',
			contentSha: 'sha1',
			ledger,
			onfinish: () => {}
		}
	}) as Record<string, unknown>;
	flushSync();
	return net;
};

const options = () => [...target!.querySelectorAll<HTMLButtonElement>('.body button')];
const cta = () => target!.querySelector<HTMLButtonElement>('.actions button')!;
const flag = () =>
	target!.querySelector<HTMLButtonElement>(`.top button[aria-label="${m.report_open()}"]`)!;
const sheet = () => document.querySelector<HTMLElement>('[role="dialog"]');
const chips = () => [...document.querySelectorAll<HTMLButtonElement>('[role="group"] button')];
const sheetButton = (key: string) =>
	[...(sheet()?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find(
		(b) => b.textContent?.trim() === key
	)!;

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
	vi.unstubAllGlobals();
});

describe('StepRunner report button', () => {
	it('reports the current step', async () => {
		// Arrange
		const net = await mountRunner();
		options()[0].click();
		flushSync();
		cta().click();
		flushSync();
		await vi.waitFor(() => expect(cta().textContent).toContain(m.lesson_continue()));
		cta().click();
		await vi.waitFor(() => expect(target!.textContent).toContain('Câu 2'));

		// Act
		flag().click();
		flushSync();
		chips()[2].click();
		flushSync();
		sheetButton(m.report_send()).click();

		// Assert
		await vi.waitFor(() => expect(net.posts).toHaveLength(1));
		expect(net.posts[0]).toMatchObject({
			lesson_id: 'h1-01',
			step_id: 'q1',
			word_id: '你好',
			content_sha: 'sha1',
			category: 'hanviet'
		});
	});

	it('reports the word of a word card', async () => {
		// Arrange
		const card: LessonStep = {
			kind: 'word',
			id: '再见',
			hanzi: '再见',
			pinyin: 'zàijiàn',
			meaning: 'tạm biệt',
			parts: [],
			components: [],
			examples: []
		};
		const net = await mountRunner([card]);
		await vi.waitFor(() => expect(target!.textContent).toContain('zàijiàn'));

		// Act
		flag().click();
		flushSync();
		chips()[2].click();
		flushSync();
		sheetButton(m.report_send()).click();

		// Assert
		await vi.waitFor(() => expect(net.posts).toHaveLength(1));
		expect(net.posts[0]).toMatchObject({ step_id: '再见', word_id: '再见' });
	});
});
