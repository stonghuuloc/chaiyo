import { describe, expect, it, vi } from 'vitest';
import { runEmail } from './run';

describe('/dev/email runEmail', () => {
	it('Given_InvokeOk_When_RunEmail_Then_OkText', async () => {
		const invoke = vi.fn(async () => ({ error: null }));

		expect(await runEmail(invoke)).toBe('Kết quả: ok');
		expect(invoke).toHaveBeenCalledTimes(1);
	});

	it('Given_InvokeError_When_RunEmail_Then_ErrorText', async () => {
		const invoke = vi.fn(async () => ({ error: { message: 'email: 422 Invalid from' } }));

		expect(await runEmail(invoke)).toBe('Kết quả: email: 422 Invalid from');
	});
});
