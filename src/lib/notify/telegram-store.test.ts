import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { supabaseTelegram, telegramLink } from './telegram-store';

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});
const clientWith = (fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) =>
	createClient('http://127.0.0.1:56321', 'test-key', {
		auth: { persistSession: false },
		global: { fetch: fetch as typeof globalThis.fetch }
	});
const UID = '11111111-1111-1111-1111-111111111111';
const TOKEN = '0123456789abcdef0123456789abcdef';

describe('supabaseTelegram', () => {
	it('Given_Linked_When_ChatOf_Then_PathAndChat', async () => {
		const requests: { url: URL; method: string }[] = [];
		const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			requests.push({ url: new URL(String(input)), method: init?.method ?? 'GET' });
			return json([{ chat_id: 777000111 }]);
		});

		const chat = await supabaseTelegram(clientWith(fetch)).chatOf('minh');

		expect(chat).toBe(777000111);
		expect(requests).toHaveLength(1);
		expect(requests[0].method).toBe('GET');
		expect(requests[0].url.pathname).toBe('/rest/v1/telegram_links');
		expect(requests[0].url.searchParams.get('select')).toBe('chat_id');
		expect(requests[0].url.searchParams.get('user_id')).toBe('eq.minh');
	});

	it('Given_NoRow_When_ChatOf_Then_Null', async () => {
		const fetch = vi.fn(async () => json([]));
		expect(await supabaseTelegram(clientWith(fetch)).chatOf('minh')).toBeNull();
	});

	it('Given_Error_When_ChatOf_Then_Throws', async () => {
		const fetch = vi.fn(async () => json({ message: 'boom' }, 500));
		await expect(supabaseTelegram(clientWith(fetch)).chatOf('minh')).rejects.toThrow('boom');
	});

	it('Given_Token_When_Claim_Then_RpcBody', async () => {
		const requests: { url: URL; body: unknown }[] = [];
		const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			requests.push({ url: new URL(String(input)), body: JSON.parse(String(init?.body)) });
			return json(UID);
		});

		const user = await supabaseTelegram(clientWith(fetch)).claim(TOKEN, 777000111);

		expect(user).toBe(UID);
		expect(requests[0].url.pathname).toBe('/rest/v1/rpc/claim_telegram_link');
		expect(requests[0].body).toEqual({ p_token: TOKEN, p_chat_id: 777000111 });
	});

	it('Given_NullAnswer_When_Claim_Then_Null', async () => {
		const fetch = vi.fn(async () => json(null));
		expect(await supabaseTelegram(clientWith(fetch)).claim(TOKEN, 1)).toBeNull();
	});

	it('Given_RpcError_When_Claim_Then_Throws', async () => {
		const fetch = vi.fn(async () => json({ message: 'rpc down' }, 500));
		await expect(supabaseTelegram(clientWith(fetch)).claim(TOKEN, 1)).rejects.toThrow('rpc down');
	});

	it('Given_UnboundMethods_When_Called_Then_Work', async () => {
		const fetch = vi.fn(async () => json([{ chat_id: 5 }]));
		const { chatOf } = supabaseTelegram(clientWith(fetch));
		expect(await chatOf('minh')).toBe(5);
	});
});

describe('telegramLink', () => {
	it('Given_Uid_When_IssueToken_Then_RpcAndToken', async () => {
		const requests: URL[] = [];
		const fetch = vi.fn(async (input: RequestInfo | URL) => {
			requests.push(new URL(String(input)));
			return json(TOKEN);
		});

		const token = await telegramLink(clientWith(fetch), UID).issueToken();

		expect(token).toBe(TOKEN);
		expect(requests[0].pathname).toBe('/rest/v1/rpc/telegram_link_token');
	});

	it('Given_RpcError_When_IssueToken_Then_Throws', async () => {
		const fetch = vi.fn(async () => json({ message: 'denied' }, 403));
		await expect(telegramLink(clientWith(fetch), UID).issueToken()).rejects.toThrow('denied');
	});

	it('Given_Row_When_IsLinked_Then_True', async () => {
		const urls: URL[] = [];
		const fetch = vi.fn(async (input: RequestInfo | URL) => {
			urls.push(new URL(String(input)));
			return json([{ chat_id: 777000111 }]);
		});

		expect(await telegramLink(clientWith(fetch), UID).isLinked()).toBe(true);
		expect(urls[0].pathname).toBe('/rest/v1/telegram_links');
		expect(urls[0].searchParams.get('user_id')).toBe(`eq.${UID}`);
	});

	it('Given_NoRow_When_IsLinked_Then_False', async () => {
		const fetch = vi.fn(async () => json([]));
		expect(await telegramLink(clientWith(fetch), UID).isLinked()).toBe(false);
	});

	it('Given_Error_When_IsLinked_Then_Throws', async () => {
		const fetch = vi.fn(async () => json({ message: 'nope' }, 500));
		await expect(telegramLink(clientWith(fetch), UID).isLinked()).rejects.toThrow('nope');
	});

	it('Given_Uid_When_Unlink_Then_DeleteFilterAndFlagFalse', async () => {
		const requests: { url: URL; method: string; body: unknown }[] = [];
		const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			requests.push({
				url: new URL(String(input)),
				method: init?.method ?? 'GET',
				body: init?.body ? JSON.parse(String(init.body)) : undefined
			});
			return new Response(null, { status: 204 });
		});

		await telegramLink(clientWith(fetch), UID).unlink();

		expect(requests).toHaveLength(2);
		expect(requests[0].method).toBe('POST');
		expect(requests[0].url.pathname).toBe('/rest/v1/settings');
		expect(requests[0].url.searchParams.get('on_conflict')).toBe('learner_id');
		expect(requests[0].body).toEqual({ learner_id: UID, remind_telegram: false });
		expect(requests[1].method).toBe('DELETE');
		expect(requests[1].url.pathname).toBe('/rest/v1/telegram_links');
		expect(requests[1].url.searchParams.get('user_id')).toBe(`eq.${UID}`);
	});

	it('Given_FlagWriteError_When_Unlink_Then_ThrowsWithoutDelete', async () => {
		const fetch = vi.fn(async () => json({ message: 'locked' }, 500));
		await expect(telegramLink(clientWith(fetch), UID).unlink()).rejects.toThrow('locked');
		expect(fetch).toHaveBeenCalledTimes(1);
	});
});
