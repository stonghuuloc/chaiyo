import { IDBFactory } from 'fake-indexeddb';
import { createClient } from '@supabase/supabase-js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/paraglide/messages.js';
import { openReports, report } from './index';
import ReportButton from './ReportButton.svelte';

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

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

// Offline fetch: a sent report stays queued, so `pending()` proves what "Gửi" stored.
const mountButton = async (uid: string) => {
	const client = clientWith(() => Promise.reject(new TypeError('offline')), uid);
	const idb = new IDBFactory();
	const queue = await openReports({ user: { id: uid } }, { client, idb });
	target = document.createElement('div');
	document.body.append(target);
	app = mount(ReportButton, {
		target,
		props: {
			context: { lesson: 'h1-01', step: 'w03', word: '你好', contentSha: 'sha1' },
			send: (context, category, note) => report(context, category, note, { client, idb })
		}
	}) as Record<string, unknown>;
	flushSync();
	return queue;
};

const sheet = () => document.querySelector<HTMLElement>('[role="dialog"]');
const chips = () => [...document.querySelectorAll<HTMLButtonElement>('[role="group"] button')];
const button = (key: string) =>
	[...(sheet()?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find(
		(b) => b.textContent?.trim() === key
	)!;
const pressed = () => chips().filter((c) => c.getAttribute('aria-pressed') === 'true');

const openSheet = () => {
	target!.querySelector('button')!.click();
	flushSync();
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
});

describe('ReportButton', () => {
	it('Gửi is disabled until a category is picked', async () => {
		// Arrange
		await mountButton('u-btn-1');

		// Act
		openSheet();

		// Assert
		expect(sheet()).not.toBe(null);
		expect(button(m.report_send()).disabled).toBe(true);

		// Act
		chips()[0].click();
		flushSync();

		// Assert
		expect(button(m.report_send()).disabled).toBe(false);
	});

	it('two taps send and show the toast', async () => {
		// Arrange
		const queue = await mountButton('u-btn-2');
		openSheet();

		// Act
		chips()[1].click();
		flushSync();
		button(m.report_send()).click();

		// Assert
		await vi.waitFor(() => expect(sheet()).toBe(null));
		expect(document.querySelector('[role="status"]')?.textContent).toContain(m.report_sent());
		expect(queue.pending()).toBe(1);
	});

	it('a double tap on Gửi stores one report', async () => {
		// Arrange
		const queue = await mountButton('u-btn-dbl');
		openSheet();
		chips()[0].click();
		flushSync();
		const send = button(m.report_send());

		// Act
		send.click();
		flushSync();
		send.click();

		// Assert
		await vi.waitFor(() => expect(sheet()).toBe(null));
		expect(queue.pending()).toBe(1);
	});

	it('five chips, one pressed at a time', async () => {
		// Arrange
		await mountButton('u-btn-3');

		// Act
		openSheet();

		// Assert
		expect(chips().map((c) => c.textContent?.trim())).toEqual([
			m.report_meaning(),
			m.report_pinyin(),
			m.report_hanviet(),
			m.report_audio(),
			m.report_other()
		]);

		// Act
		chips()[1].click();
		flushSync();
		chips()[2].click();
		flushSync();

		// Assert
		expect(pressed().map((c) => c.textContent?.trim())).toEqual([m.report_hanviet()]);
	});

	it('cancel stores nothing and resets', async () => {
		// Arrange
		const queue = await mountButton('u-btn-4');
		openSheet();
		chips()[0].click();
		flushSync();
		const note = sheet()!.querySelector('textarea')!;
		note.value = 'gõ nhầm';
		note.dispatchEvent(new Event('input'));
		flushSync();

		// Act
		button(m.report_cancel()).click();

		// Assert
		await vi.waitFor(() => expect(sheet()).toBe(null));
		expect(queue.pending()).toBe(0);

		// Act
		openSheet();

		// Assert
		expect(pressed()).toHaveLength(0);
		expect(sheet()!.querySelector('textarea')!.value).toBe('');
	});
});
