import { describe, expect, it, vi } from 'vitest';
import { telegramChannel, telegramFromEnv } from './telegram';

const json = (body: unknown, status: number) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});
const minh = { learnerId: 'minh', day: '2026-11-23' };
const TOKEN = '123:abc';
const channelWith = (fetch: typeof globalThis.fetch, chat: number | null = 777000111) =>
	telegramChannel({ token: TOKEN, chatOf: vi.fn(async () => chat), fetch });
const failure = async (fetch: typeof globalThis.fetch, chat: number | null = 777000111) => {
	try {
		await channelWith(fetch, chat).send(minh);
	} catch (e) {
		return (e as Error).message;
	}
	return '';
};

describe('telegramChannel', () => {
	it('Given_Minh_When_Send_Then_OnePostWithTelegramShape', async () => {
		const fetch = vi.fn(async () => json({ ok: true }, 200));
		const chatOf = vi.fn(async () => 777000111);

		await telegramChannel({ token: TOKEN, chatOf, fetch }).send(minh);

		expect(chatOf).toHaveBeenCalledWith('minh');
		expect(fetch).toHaveBeenCalledTimes(1);
		const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://api.telegram.org/bot123:abc/sendMessage');
		expect(init.method).toBe('POST');
		expect(JSON.parse(init.body as string)).toEqual({
			chat_id: 777000111,
			text: 'Hôm nay bạn chưa học. Vài phút thôi để giữ chuỗi nhé!\nhttps://chaiyo.vercel.app/today'
		});
		expect(init.signal).toBeInstanceOf(AbortSignal);
	});

	it('Given_Channel_When_Name_Then_Telegram', () => {
		expect(channelWith(vi.fn()).name).toBe('telegram');
	});

	it('Given_200Ok_When_Send_Then_Resolves', async () => {
		await expect(
			channelWith(vi.fn(async () => json({ ok: true }, 200))).send(minh)
		).resolves.toBeUndefined();
	});

	it('Given_403_When_Send_Then_RejectsStatusAndDescription', async () => {
		const message = await failure(
			vi.fn(async () =>
				json({ ok: false, description: 'Forbidden: bot was blocked by the user' }, 403)
			)
		);
		expect(message).toBe('telegram: 403 Forbidden: bot was blocked by the user');
	});

	it('Given_200OkFalse_When_Send_Then_Rejects', async () => {
		const message = await failure(
			vi.fn(async () => json({ ok: false, description: 'Bad Request: chat not found' }, 200))
		);
		expect(message).toBe('telegram: 200 Bad Request: chat not found');
	});

	it('Given_502NonJson_When_Send_Then_RejectsStatusOnly', async () => {
		const message = await failure(
			vi.fn(async () => new Response('<html>bad gateway</html>', { status: 502 }))
		);
		expect(message).toBe('telegram: 502');
	});

	it('Given_AnyFailure_When_Send_Then_MessageHasNoToken', async () => {
		const messages = await Promise.all([
			failure(
				vi.fn(async () =>
					json({ ok: false, description: 'Forbidden: bot was blocked by the user' }, 403)
				)
			),
			failure(
				vi.fn(async () => json({ ok: false, description: 'Bad Request: chat not found' }, 200))
			),
			failure(vi.fn(async () => new Response('<html>bad gateway</html>', { status: 502 })))
		]);
		expect(messages).toHaveLength(3);
		for (const message of messages) {
			expect(message).not.toBe('');
			expect(message).not.toContain('123:abc');
		}
	});

	it('Given_NotLinked_When_Send_Then_RejectsNoFetch', async () => {
		const fetch = vi.fn();
		await expect(channelWith(fetch, null).send(minh)).rejects.toThrow('telegram: not linked');
		expect(fetch).not.toHaveBeenCalled();
	});

	it('Given_NotLinkedAndSkipUnlinked_When_Send_Then_ResolvesNoFetch', async () => {
		const fetch = vi.fn();
		const channel = telegramChannel({
			token: '123:abc',
			chatOf: async () => null,
			fetch: fetch as never,
			skipUnlinked: true
		});
		await expect(channel.send(minh)).resolves.toBeUndefined();
		expect(fetch).not.toHaveBeenCalled();
	});

	it('Given_FetchThrowsWithToken_When_Send_Then_RejectsTelegramNetworkWithoutToken', async () => {
		const fetch = vi.fn(async () => {
			throw new TypeError('fetch failed https://api.telegram.org/bot123:abc/sendMessage');
		});
		const message = await failure(fetch);
		expect(message).toBe('telegram: network');
		expect(message).not.toContain('123:abc');
	});
});

describe('telegramFromEnv', () => {
	const chatOf = async () => 777000111;

	it('Given_Token_When_FromEnv_Then_TelegramChannel', () => {
		const channel = telegramFromEnv((k) => (k === 'TELEGRAM_BOT_TOKEN' ? TOKEN : undefined), {
			chatOf
		});
		expect(channel?.name).toBe('telegram');
	});

	it.each([['' as string | undefined], [undefined]])(
		'Given_EmptyOrUnset_When_FromEnv_Then_Null %#',
		(value) => {
			expect(telegramFromEnv(() => value, { chatOf })).toBeNull();
		}
	);
});
