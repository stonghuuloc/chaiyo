import { describe, expect, it, vi } from 'vitest';
import { publicProfile } from './public-profile';

const NULLS = {
	display_name: null,
	photo_url: null,
	handle: null,
	streak: null,
	words_known: null,
	hsk: null,
	lesson: null,
	badges: null,
	following: null,
	me: null
};
const VISIBLE = {
	status: 'visible',
	display_name: 'Linh',
	photo_url: 'https://x/y.png',
	handle: 'linh',
	streak: 4,
	words_known: 90,
	hsk: 2,
	lesson: 7,
	badges: ['first'],
	following: true,
	me: false
};
const client = (result: { data: unknown; error: { message: string } | null }) => ({
	rpc: vi.fn().mockResolvedValue(result)
});

describe('publicProfile', () => {
	it('Given_VisibleRow_When_Read_Then_CamelCaseFields', async () => {
		expect(await publicProfile(client({ data: [VISIBLE], error: null }), 'linh')).toEqual({
			status: 'visible',
			name: 'Linh',
			photo: 'https://x/y.png',
			handle: 'linh',
			streak: 4,
			wordsKnown: 90,
			hsk: 2,
			lesson: 7,
			badges: ['first'],
			following: true,
			me: false
		});
	});

	it('Given_BadgesOutOfOrderAndUnknown_Then_CatalogueOrderKnownOnly', async () => {
		const row = { ...VISIBLE, badges: ['streak7', 'zzz', 'first'] };
		const got = await publicProfile(client({ data: [row], error: null }), 'linh');
		expect(got).toMatchObject({ badges: ['first', 'streak7'] });
	});

	it('Given_HiddenRow_When_Read_Then_StatusOnly', async () => {
		const c = client({ data: [{ status: 'hidden', ...NULLS }], error: null });
		expect(await publicProfile(c, 'loc')).toEqual({ status: 'hidden' });
	});

	it('Given_MissingRow_When_Read_Then_Missing', async () => {
		const c = client({ data: [{ status: 'missing', ...NULLS }], error: null });
		expect(await publicProfile(c, 'khongco')).toEqual({ status: 'missing' });
	});

	it('Given_EmptyData_When_Read_Then_Missing', async () => {
		expect(await publicProfile(client({ data: [], error: null }), 'x')).toEqual({
			status: 'missing'
		});
	});

	it('Given_RpcError_When_Read_Then_Throws', async () => {
		const c = client({ data: null, error: { message: 'boom' } });
		await expect(publicProfile(c, 'x')).rejects.toThrow('boom');
	});

	it('Given_Handle_When_Read_Then_CallsProfileView', async () => {
		const c = client({ data: [], error: null });
		await publicProfile(c, 'abc');
		expect(c.rpc).toHaveBeenCalledWith('profile_view', { p_handle: 'abc' });
	});
});
