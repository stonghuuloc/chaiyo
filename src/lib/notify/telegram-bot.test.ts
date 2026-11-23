import { describe, expect, it, vi } from 'vitest';
import { handleTelegramUpdate } from './telegram-bot';

const SECRET = 's3cr3t';
const TOKEN = '0123456789abcdef0123456789abcdef';
const LINKED = 'Đã kết nối Chaiyo. Lời nhắc học sẽ đến ở đây.';
const EXPIRED =
	'Liên kết đã hết hạn hoặc đã dùng. Vào Cài đặt trong Chaiyo và bấm Kết nối Telegram lại.';

const request = (body: unknown, header: string | null = SECRET, method = 'POST') =>
	new Request('http://x/functions/v1/telegram-bot', {
		method,
		headers: header === null ? {} : { 'x-telegram-bot-api-secret-token': header },
		body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
	});
const start = (text: string, type = 'private') => ({
	message: { chat: { id: 777000111, type }, text }
});
const deps = (
	o: {
		secret?: string | undefined;
		claim?: (t: string, c: number) => Promise<string | null>;
		reply?: (c: number, t: string) => Promise<void>;
	} = {}
) => ({
	secret: 'secret' in o ? o.secret : SECRET,
	claim: vi.fn(o.claim ?? (async () => 'linh')),
	reply: vi.fn(o.reply ?? (async () => {}))
});

describe('handleTelegramUpdate', () => {
	it('Given_Get_When_Handle_Then_405', async () => {
		const d = deps();
		const res = await handleTelegramUpdate(request('', SECRET, 'GET'), d);
		expect(res.status).toBe(405);
		expect(d.claim).not.toHaveBeenCalled();
	});

	it('Given_WrongSecret_When_Handle_Then_401NoClaim', async () => {
		const d = deps();
		const res = await handleTelegramUpdate(request(start(`/start ${TOKEN}`), 's3cr3t-wrong'), d);
		expect(res.status).toBe(401);
		expect(d.claim).not.toHaveBeenCalled();
		expect(d.reply).not.toHaveBeenCalled();
	});

	it('Given_NoHeader_When_Handle_Then_401', async () => {
		const d = deps();
		const res = await handleTelegramUpdate(request(start(`/start ${TOKEN}`), null), d);
		expect(res.status).toBe(401);
		expect(d.claim).not.toHaveBeenCalled();
	});

	it('Given_SecretUnset_When_Handle_Then_401', async () => {
		const d = deps({ secret: undefined });
		const res = await handleTelegramUpdate(request(start(`/start ${TOKEN}`), 'anything'), d);
		expect(res.status).toBe(401);
		expect(d.claim).not.toHaveBeenCalled();
	});

	it.each([
		['start without a token', start('/start')],
		['a token that is not 32 hex', start('/start 0123')],
		['plain text', start('hi')],
		['a group chat', start(`/start ${TOKEN}`, 'group')],
		[
			'an edited message',
			{ edited_message: { chat: { id: 777000111, type: 'private' }, text: `/start ${TOKEN}` } }
		],
		['bad JSON', '{not json']
	])('Given_%s_When_Handle_Then_200NoClaimNoReply', async (_name, body) => {
		const d = deps();
		const res = await handleTelegramUpdate(request(body), d);
		expect(res.status).toBe(200);
		expect(d.claim).not.toHaveBeenCalled();
		expect(d.reply).not.toHaveBeenCalled();
	});

	it('Given_LiveToken_When_Start_Then_ClaimOnceAndLinkedReply', async () => {
		const d = deps();
		const res = await handleTelegramUpdate(request(start(`/start ${TOKEN}`)), d);
		expect(res.status).toBe(200);
		expect(d.claim).toHaveBeenCalledTimes(1);
		expect(d.claim).toHaveBeenCalledWith(TOKEN, 777000111);
		expect(d.reply).toHaveBeenCalledTimes(1);
		expect(d.reply).toHaveBeenCalledWith(777000111, LINKED);
	});

	it('Given_NullClaim_When_Start_Then_ExpiredReply200', async () => {
		const d = deps({ claim: async () => null });
		const res = await handleTelegramUpdate(request(start(`/start ${TOKEN}`)), d);
		expect(res.status).toBe(200);
		expect(d.reply).toHaveBeenCalledTimes(1);
		expect(d.reply).toHaveBeenCalledWith(777000111, EXPIRED);
	});

	it('Given_ClaimThrows_When_Start_Then_500NoReply', async () => {
		const d = deps({
			claim: async () => {
				throw new Error('rpc down');
			}
		});
		const res = await handleTelegramUpdate(request(start(`/start ${TOKEN}`)), d);
		expect(res.status).toBe(500);
		expect(d.reply).not.toHaveBeenCalled();
	});

	it('Given_ReplyThrows_When_Start_Then_200', async () => {
		const d = deps({
			reply: async () => {
				throw new Error('telegram: 403');
			}
		});
		const res = await handleTelegramUpdate(request(start(`/start ${TOKEN}`)), d);
		expect(res.status).toBe(200);
		expect(d.claim).toHaveBeenCalledTimes(1);
	});
});
