import { describe, expect, it, vi } from 'vitest';
import { handle } from './handler';

const req = (headers: Record<string, string> = {}) =>
	new Request('http://x/notify', { method: 'POST', headers });

describe('handle', () => {
	it.each([
		['no header', {}, 'secret'],
		['wrong header', { 'x-notify-secret': 'nope' }, 'secret'],
		['unset env secret', { 'x-notify-secret': 'secret' }, undefined]
	])('Given_%s_When_Handle_Then_401AndNoRun', async (_n, headers, secret) => {
		// Arrange
		const run = vi.fn();

		// Act
		const res = await handle(req(headers), { secret, run });

		// Assert
		expect(res.status).toBe(401);
		expect(run).not.toHaveBeenCalled();
	});

	it('Given_RightHeader_When_Handle_Then_200WithResult', async () => {
		// Arrange
		const run = vi.fn(async () => ({ rolled: ['a'], failed: [] }));

		// Act
		const res = await handle(req({ 'x-notify-secret': 'secret' }), { secret: 'secret', run });

		// Assert
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ rolled: ['a'], failed: [] });
		expect(run).toHaveBeenCalledOnce();
	});

	it('Given_RunThrows_When_Handle_Then_500WithError', async () => {
		// Arrange
		const run = vi.fn(async () => {
			throw new Error('boom');
		});

		// Act
		const res = await handle(req({ 'x-notify-secret': 'secret' }), { secret: 'secret', run });

		// Assert
		expect(res.status).toBe(500);
		expect(await res.json()).toEqual({ error: 'boom' });
	});
});
