import { describe, expect, it, vi } from 'vitest';
import { emailChannel, emailFromEnv } from './email';

const json = (body: unknown, status: number) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});
const lan = { learnerId: 'lan', day: '2026-11-23' };
const channelWith = (fetch: typeof globalThis.fetch, address: string | null = 'lan@example.com') =>
	emailChannel({
		apiKey: 're_test',
		from: 'Chaiyo <nhac@chaiyo.test>',
		addressOf: vi.fn(async () => address),
		fetch
	});
const BODY = 'Hôm nay bạn chưa học. Vài phút thôi để giữ chuỗi nhé!';
const URL_TODAY = 'https://chaiyo.vercel.app/today';

describe('emailChannel', () => {
	it('Given_Lan_When_Send_Then_OnePostWithResendShape', async () => {
		// Arrange
		const fetch = vi.fn(async () => json({ id: 'e1' }, 200));
		const addressOf = vi.fn(async () => 'lan@example.com');
		const channel = emailChannel({
			apiKey: 're_test',
			from: 'Chaiyo <nhac@chaiyo.test>',
			addressOf,
			fetch
		});

		// Act
		await channel.send(lan);

		// Assert
		expect(channel.name).toBe('email');
		expect(addressOf).toHaveBeenCalledWith('lan');
		expect(fetch).toHaveBeenCalledTimes(1);
		const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://api.resend.com/emails');
		expect(init.method).toBe('POST');
		const headers = new Headers(init.headers);
		expect(headers.get('authorization')).toBe('Bearer re_test');
		const body = JSON.parse(init.body as string);
		expect(body).toMatchObject({
			from: 'Chaiyo <nhac@chaiyo.test>',
			to: ['lan@example.com'],
			subject: 'Chaiyo! Hôm nay bạn chưa học'
		});
		for (const part of [body.text, body.html]) {
			expect(part).toContain(BODY);
			expect(part).toContain(URL_TODAY);
		}
		expect(init.signal).toBeInstanceOf(AbortSignal);
	});

	it('Given_200_When_Send_Then_Resolves', async () => {
		const channel = channelWith(async () => json({ id: 'e1' }, 200));

		await expect(channel.send(lan)).resolves.toBeUndefined();
	});

	it('Given_422_When_Send_Then_RejectsStatusAndMessage', async () => {
		const channel = channelWith(async () => json({ message: 'Invalid from' }, 422));

		await expect(channel.send(lan)).rejects.toThrow('email: 422 Invalid from');
	});

	it('Given_429_When_Send_Then_Rejects', async () => {
		const channel = channelWith(async () => json({ message: 'Too many requests' }, 429));

		await expect(channel.send(lan)).rejects.toThrow('email: 429 Too many requests');
	});

	it('Given_500NonJson_When_Send_Then_RejectsStatusOnly', async () => {
		const channel = channelWith(async () => new Response('<html>oops</html>', { status: 500 }));

		await expect(channel.send(lan)).rejects.toThrow(/^email: 500$/);
	});

	it('Given_NoAddress_When_Send_Then_RejectsNoFetch', async () => {
		const fetch = vi.fn(async () => json({}, 200));
		const channel = channelWith(fetch, null);

		await expect(channel.send(lan)).rejects.toThrow('email: no address');
		expect(fetch).not.toHaveBeenCalled();
	});

	it('Given_FetchThrows_When_Send_Then_RejectsSameError', async () => {
		const channel = channelWith(async () => {
			throw new Error('timeout');
		});

		await expect(channel.send(lan)).rejects.toThrow('timeout');
	});
});

describe('emailFromEnv', () => {
	const deps = { addressOf: async () => 'lan@example.com' };
	const envOf = (o: Record<string, string>) => (k: string) => o[k];

	it('Given_KeyOnly_When_EmailFromEnv_Then_Null', () => {
		expect(emailFromEnv(envOf({ RESEND_API_KEY: 're_test' }), deps)).toBeNull();
	});

	it('Given_FromOnly_When_EmailFromEnv_Then_Null', () => {
		expect(emailFromEnv(envOf({ RESEND_FROM: 'a@b.c' }), deps)).toBeNull();
	});

	it('Given_EmptyKey_When_EmailFromEnv_Then_Null', () => {
		expect(emailFromEnv(envOf({ RESEND_API_KEY: '', RESEND_FROM: 'a@b.c' }), deps)).toBeNull();
	});

	it('Given_Both_When_EmailFromEnv_Then_EmailChannel', () => {
		const channel = emailFromEnv(envOf({ RESEND_API_KEY: 're_test', RESEND_FROM: 'a@b.c' }), deps);

		expect(channel?.name).toBe('email');
	});
});

describe('emailChannel reminder token', () => {
	const sentBody = async (r: { learnerId: string; day: string; open?: string }) => {
		const fetch = vi.fn(async () => json({ id: 'e1' }, 200));
		await channelWith(fetch).send(r);
		const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
		return JSON.parse(init.body as string) as { text: string; html: string };
	};

	it('Given_OpenToken_When_Send_Then_UrlHasRemindParam', async () => {
		const body = await sentBody({ ...lan, open: 'u-1' });

		expect(body.text).toBe(`${BODY}\n\n${URL_TODAY}?remind=u-1`);
		expect(body.html).toContain(`<a href="${URL_TODAY}?remind=u-1">`);
	});

	it('Given_NoToken_When_Send_Then_BodyUnchanged', async () => {
		const body = await sentBody(lan);

		expect(body.text).toBe(`${BODY}\n\n${URL_TODAY}`);
		expect(body.html).toBe(`<p>${BODY}</p><p><a href="${URL_TODAY}">Học ngay</a></p>`);
	});

	it('Given_Message_Then_EveryUrlOnAppOriginOrRelative', async () => {
		const body = await sentBody({ ...lan, open: 'u-1' });

		const urls = [
			...body.text.match(/https?:\/\/\S+/g)!,
			...[...body.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
		];
		expect(urls.length).toBeGreaterThan(1);
		for (const u of urls)
			expect(new URL(u, 'https://chaiyo.vercel.app').origin).toBe('https://chaiyo.vercel.app');
	});

	it('Given_Html_Then_NoImg', async () => {
		const body = await sentBody({ ...lan, open: 'u-1' });

		expect(body.html).not.toContain('<img');
	});
});
