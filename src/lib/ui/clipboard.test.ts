import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from './clipboard';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('copyText', () => {
	it('Given_WriteResolves_Then_TrueAndTextPassed', async () => {
		const writeText = vi.fn(async () => undefined);
		vi.stubGlobal('navigator', { clipboard: { writeText } });
		expect(await copyText('https://chaiyo.app/u/linh?badge=streak7')).toBe(true);
		expect(writeText).toHaveBeenCalledWith('https://chaiyo.app/u/linh?badge=streak7');
	});

	it('Given_WriteRejects_Then_False', async () => {
		vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn(async () => Promise.reject()) } });
		expect(await copyText('x')).toBe(false);
	});

	it('Given_NoClipboard_Then_False', async () => {
		vi.stubGlobal('navigator', {});
		expect(await copyText('x')).toBe(false);
	});
});
