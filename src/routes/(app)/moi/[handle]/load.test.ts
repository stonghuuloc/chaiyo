import { describe, expect, it } from 'vitest';
import { load } from './+page';

describe('moi redirect', () => {
	it('Given_MoiLinh_Then_307ToULinh', () => {
		let thrown: { status?: number; location?: string } | undefined;
		try {
			load({ params: { handle: 'linh' } } as Parameters<typeof load>[0]);
		} catch (e) {
			thrown = e as { status?: number; location?: string };
		}
		expect(thrown?.status).toBe(307);
		expect(thrown?.location).toMatch(/\/u\/linh$/);
	});
});
