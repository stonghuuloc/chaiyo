import { afterEach, describe, expect, it, vi } from 'vitest';
import { avatarDataUrl } from './photo';

afterEach(() => vi.unstubAllGlobals());

describe('avatarDataUrl', () => {
	it('centre-crops to a 256 px square JPEG data URL', async () => {
		const drawImage = vi.fn();
		const canvas = {
			width: 0,
			height: 0,
			getContext: () => ({ drawImage }),
			toDataURL: vi.fn(() => 'data:image/jpeg;base64,AAA')
		};
		vi.stubGlobal('createImageBitmap', async () => ({ width: 600, height: 400 }));
		vi.stubGlobal('document', { createElement: () => canvas });
		expect(await avatarDataUrl(new File([], 'a.png'))).toBe('data:image/jpeg;base64,AAA');
		expect(drawImage).toHaveBeenCalledWith(
			{ width: 600, height: 400 },
			100,
			0,
			400,
			400,
			0,
			0,
			256,
			256
		);
		expect(canvas).toMatchObject({ width: 256, height: 256 });
		expect(canvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);
	});

	it('rejects when the image cannot be decoded', async () => {
		vi.stubGlobal('createImageBitmap', () => Promise.reject(new Error('heic')));
		await expect(avatarDataUrl(new File([], 'a.heic'))).rejects.toThrow('heic');
	});
});
