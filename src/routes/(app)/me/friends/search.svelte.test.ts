import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FriendSearch from './FriendSearch.svelte';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('#lib/supabase.js', () => ({ supabase: { rpc } }));

type Hit = {
	handle: string;
	display_name: string;
	photo_url: string | null;
	hsk: number;
	lesson: number;
	following: boolean;
};
const NGOC: Hit = {
	handle: 'ngoc',
	display_name: 'Nguyễn Thị Ngọc',
	photo_url: null,
	hsk: 2,
	lesson: 14,
	following: false
};
const LAN: Hit = {
	handle: 'lan',
	display_name: 'Ngọc Lan',
	photo_url: 'https://a.googleusercontent.com/x',
	hsk: 1,
	lesson: 3,
	following: true
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
const onchange = vi.fn(async () => {});

const settle = async () => {
	for (let i = 0; i < 4; i++) {
		await vi.advanceTimersByTimeAsync(0);
		await tick();
	}
	flushSync();
};

const render = async () => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(FriendSearch, { target, props: { client: { rpc } as never, onchange } }) as Record<
		string,
		unknown
	>;
	await settle();
	return target;
};

const type = async (root: HTMLElement, value: string) => {
	const input = root.querySelector('input')!;
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	await settle();
};
const wait = async (ms: number) => {
	await vi.advanceTimersByTimeAsync(ms);
	await tick();
	flushSync();
};
const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim();
const lis = (root: HTMLElement) => [...root.querySelectorAll('ul > li')];
const btn = (root: HTMLElement, i = 0) => lis(root)[i].querySelector('button')!;

beforeEach(() => {
	vi.useFakeTimers();
	rpc.mockReset();
	onchange.mockClear();
});
afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	app = undefined;
	target = undefined;
	vi.useRealTimers();
});

const answer = (rows: Hit[]) =>
	rpc.mockImplementation(async (fn: string) =>
		fn === 'search_learners' ? { data: rows, error: null } : { data: true, error: null }
	);

describe('friend search section', () => {
	it('Given_Section_Then_TitleSubAndLabelledBox', async () => {
		const root = await render();
		expect(text(root.querySelector('h2'))).toBe('Theo dõi thêm');
		expect(text(root.querySelector('section p'))).toBe('Tìm bạn theo tên rồi bấm theo dõi.');
		const input = root.querySelector('input')!;
		expect(input.getAttribute('placeholder')).toBe('Tìm bạn theo tên');
		expect(input.getAttribute('aria-label')).toBe('Tìm bạn theo tên');
		expect(root.querySelector('use')?.getAttribute('href')).toBe('#i-fill-magnifer');
		expect(root.querySelector('ul')).toBeNull();
	});

	it('Given_TypeNgoc_When_250ms_Then_OneRpcTwoRows', async () => {
		answer([LAN, NGOC]);
		const root = await render();
		await type(root, 'ngoc');
		await wait(249);
		expect(rpc).not.toHaveBeenCalled();
		await wait(1);
		expect(rpc).toHaveBeenCalledTimes(1);
		expect(rpc).toHaveBeenCalledWith('search_learners', { p_q: 'ngoc' });
		expect(lis(root)).toHaveLength(2);
	});

	it('Given_TypeFast_Then_OnlyLastQuerySent', async () => {
		answer([NGOC]);
		const root = await render();
		await type(root, 'ng');
		await wait(100);
		await type(root, 'ngo');
		await wait(100);
		await type(root, 'ngoc');
		await wait(250);
		expect(rpc).toHaveBeenCalledTimes(1);
		expect(rpc).toHaveBeenCalledWith('search_learners', { p_q: 'ngoc' });
	});

	it('Given_FollowInFlight_When_StaleSearchLands_Then_ButtonStaysFollowing', async () => {
		let releaseFollow: (v: unknown) => void = () => {};
		let searches = 0;
		rpc.mockImplementation((fn: string) => {
			if (fn === 'set_follow') return new Promise((r) => (releaseFollow = r));
			searches++;
			return Promise.resolve({ data: [{ ...NGOC }], error: null });
		});
		const root = await render();
		await type(root, 'ngoc');
		await wait(250);
		btn(root).click();
		flushSync();
		await type(root, 'ngoc ');
		await wait(250);
		expect(searches).toBe(2);
		releaseFollow({ data: true, error: null });
		await settle();
		expect(btn(root).textContent).toContain('Đang theo dõi');
	});

	it('Given_OldAnswerLate_Then_NewerListKept', async () => {
		let release: (v: unknown) => void = () => {};
		rpc.mockImplementationOnce(() => new Promise((r) => (release = r)));
		rpc.mockImplementationOnce(async () => ({ data: [NGOC], error: null }));
		const root = await render();
		await type(root, 'ngo');
		await wait(250);
		await type(root, 'ngoc');
		await wait(250);
		expect(text(lis(root)[0].querySelector('b'))).toBe('Nguyễn Thị Ngọc');
		release({ data: [LAN], error: null });
		await settle();
		expect(lis(root)).toHaveLength(1);
		expect(text(lis(root)[0].querySelector('b'))).toBe('Nguyễn Thị Ngọc');
	});

	it('Given_Row_Then_AvatarNameHsk2Bai14AndLinkUNgoc', async () => {
		answer([LAN, NGOC]);
		const root = await render();
		await type(root, 'ngoc');
		await wait(250);
		const [lan, ngoc] = lis(root);
		expect(lan.querySelector('img')?.getAttribute('src')).toBe('https://a.googleusercontent.com/x');
		expect(text(ngoc.querySelector('[data-part="avatar"]'))).toBe('N');
		expect(text(ngoc.querySelector('b'))).toBe('Nguyễn Thị Ngọc');
		expect(text(ngoc.querySelector('small'))).toBe('HSK 2 · Bài 14');
		expect(ngoc.querySelector('a')?.getAttribute('href')).toBe('/u/ngoc');
		expect(ngoc.querySelector('a')?.contains(ngoc.querySelector('button'))).toBe(false);
	});

	it('Given_NoHit_Then_NoneLineWithCurlyQuotes', async () => {
		answer([]);
		const root = await render();
		await type(root, '  xyzzy ');
		await wait(250);
		expect(lis(root)).toHaveLength(1);
		expect(text(lis(root)[0])).toBe('Không thấy ai tên “xyzzy”. Thử tên khác nhé.');
	});

	it('Given_EmptyOrOneChar_Then_NoListNoRpc', async () => {
		answer([NGOC]);
		const root = await render();
		await type(root, 'n');
		await wait(500);
		expect(rpc).not.toHaveBeenCalled();
		expect(root.querySelector('ul')).toBeNull();
		await type(root, 'ngoc');
		await wait(250);
		expect(lis(root)).toHaveLength(1);
		await type(root, '');
		expect(root.querySelector('ul')).toBeNull();
		await type(root, '   ');
		await wait(500);
		expect(rpc).toHaveBeenCalledTimes(1);
	});

	it('Given_SearchError_Then_FailedLine', async () => {
		rpc.mockResolvedValue({ data: null, error: { message: 'offline' } });
		const root = await render();
		await type(root, 'ngoc');
		await wait(250);
		expect(lis(root)).toHaveLength(1);
		expect(text(lis(root)[0])).toBe('Chưa tìm được. Kiểm tra mạng rồi thử lại.');
	});

	it('Given_NotFollowed_Then_TheoDoiPressedFalseLabel', async () => {
		answer([LAN, NGOC]);
		const root = await render();
		await type(root, 'ngoc');
		await wait(250);
		const off = btn(root, 1);
		expect(text(off)).toBe('Theo dõi');
		expect(off.getAttribute('aria-pressed')).toBe('false');
		expect(off.getAttribute('aria-label')).toBe('Theo dõi Nguyễn Thị Ngọc');
		expect(off.querySelector('svg')).toBeNull();
	});

	it('Given_FollowingFromServer_Then_DangTheoDoi', async () => {
		answer([LAN, NGOC]);
		const root = await render();
		await type(root, 'ngoc');
		await wait(250);
		const on = btn(root, 0);
		expect(text(on)).toBe('Đang theo dõi');
		expect(on.getAttribute('aria-pressed')).toBe('true');
		expect(on.getAttribute('aria-label')).toBe('Bỏ theo dõi Ngọc Lan');
		expect(on.querySelector('use')?.getAttribute('href')).toBe('#i-bold-check');
	});

	it('Given_TapTheoDoi_Then_FlipsToastAndOnchange', async () => {
		answer([LAN, NGOC]);
		const root = await render();
		await type(root, 'ngoc');
		await wait(250);
		btn(root, 1).click();
		flushSync();
		expect(btn(root, 1).getAttribute('aria-pressed')).toBe('true');
		expect(text(btn(root, 1))).toBe('Đang theo dõi');
		await settle();
		expect(rpc).toHaveBeenLastCalledWith('set_follow', { p_handle: 'ngoc', p_on: true });
		expect(text(root.querySelector('[role="status"]'))).toBe('Đã theo dõi Nguyễn Thị Ngọc');
		expect(onchange).toHaveBeenCalledTimes(1);
		await wait(2200 + 1000);
		expect(root.querySelector('[role="status"]')).toBeNull();
	});

	it('Given_TapDangTheoDoi_Then_UnfollowToastAndOnchange', async () => {
		answer([LAN, NGOC]);
		const root = await render();
		await type(root, 'ngoc');
		await wait(250);
		btn(root, 0).click();
		await settle();
		expect(rpc).toHaveBeenLastCalledWith('set_follow', { p_handle: 'lan', p_on: false });
		expect(btn(root, 0).getAttribute('aria-pressed')).toBe('false');
		expect(text(btn(root, 0))).toBe('Theo dõi');
		expect(text(root.querySelector('[role="status"]'))).toBe('Đã bỏ theo dõi Ngọc Lan');
		expect(onchange).toHaveBeenCalledTimes(1);
	});

	it('Given_FalseOrError_Then_RollbackFailedToastNoOnchange', async () => {
		answer([LAN, NGOC]);
		const root = await render();
		await type(root, 'ngoc');
		await wait(250);
		rpc.mockResolvedValueOnce({ data: false, error: null });
		btn(root, 1).click();
		await settle();
		expect(btn(root, 1).getAttribute('aria-pressed')).toBe('false');
		expect(text(root.querySelector('[role="status"]'))).toBe('Chưa lưu được, thử lại nhé');
		rpc.mockResolvedValueOnce({ data: null, error: { message: 'x' } });
		btn(root, 0).click();
		await settle();
		expect(btn(root, 0).getAttribute('aria-pressed')).toBe('true');
		expect(text(root.querySelector('[role="status"]'))).toBe('Chưa lưu được, thử lại nhé');
		expect(onchange).not.toHaveBeenCalled();
	});

	it('Given_Pending_When_TapAgain_Then_OneRpc', async () => {
		let release: (v: unknown) => void = () => {};
		rpc.mockImplementationOnce(async () => ({ data: [NGOC], error: null }));
		const root = await render();
		await type(root, 'ngoc');
		await wait(250);
		rpc.mockImplementationOnce(() => new Promise((r) => (release = r)));
		btn(root, 0).click();
		flushSync();
		btn(root, 0).click();
		flushSync();
		expect(rpc.mock.calls.filter(([fn]) => fn === 'set_follow')).toHaveLength(1);
		release({ data: true, error: null });
		await settle();
		expect(btn(root, 0).getAttribute('aria-pressed')).toBe('true');
		expect(onchange).toHaveBeenCalledTimes(1);
	});
});
