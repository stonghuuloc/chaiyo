import { describe, expect, it } from 'vitest';
import { slideParams } from './motion';

describe('slideParams', () => {
	it('slides for 260ms normally', () => {
		expect(slideParams(false).duration).toBe(260);
	});

	it('drops to 0ms under reduced motion', () => {
		expect(slideParams(true).duration).toBe(0);
	});
});
