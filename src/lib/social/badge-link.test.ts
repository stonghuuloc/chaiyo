import { describe, expect, it, vi } from 'vitest';
import { badgeLink, ownHandle } from './badge-link';

const client = (result: { data: unknown; error: unknown }) => {
	const maybeSingle = vi.fn(async () => result);
	const eq = vi.fn(() => ({ maybeSingle }));
	const select = vi.fn(() => ({ eq }));
	const from = vi.fn(() => ({ select }));
	return { client: { from } as never, from, select, eq };
};

describe('badge link', () => {
	it('Given_Linh_When_Link_Then_UHandleBadgeQuery', () => {
		expect(badgeLink('https://chaiyo.app', 'linh', 'streak7')).toBe(
			'https://chaiyo.app/u/linh?badge=streak7'
		);
	});

	it('Given_Row_When_OwnHandle_Then_Handle', async () => {
		const c = client({ data: { handle: 'linh' }, error: null });
		expect(await ownHandle(c.client, 'u1')).toBe('linh');
	});

	it('Given_NoRow_Then_Null', async () => {
		const c = client({ data: null, error: null });
		expect(await ownHandle(c.client, 'u1')).toBeNull();
	});

	it('Given_Error_Then_Throws', async () => {
		const c = client({ data: null, error: { message: 'boom' } });
		await expect(ownHandle(c.client, 'u1')).rejects.toEqual({ message: 'boom' });
	});

	it('Given_Uid_Then_SelectsHandleByLearnerId', async () => {
		const c = client({ data: { handle: 'linh' }, error: null });
		await ownHandle(c.client, 'u1');
		expect(c.from).toHaveBeenCalledWith('profiles');
		expect(c.select).toHaveBeenCalledWith('handle');
		expect(c.eq).toHaveBeenCalledWith('learner_id', 'u1');
	});
});
