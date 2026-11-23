import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicProfile } from '#lib/social/public-profile.js';
import type { PageProps } from './$types';
import Page from './+page.svelte';

const nav = vi.hoisted(() => {
	const after: ((n: unknown) => void)[] = [];
	return {
		after,
		afterNavigate: (fn: (n: unknown) => void) => after.push(fn),
		snapshot: vi.fn()
	};
});
vi.mock('$app/navigation', () => nav);

const rpc = vi.hoisted(() => vi.fn());
vi.mock('#lib/supabase.js', () => ({ supabase: { rpc } }));

type Visible = Extract<PublicProfile, { status: 'visible' }>;

const visible: Visible = {
	status: 'visible',
	name: 'Linh',
	photo: null,
	handle: 'linh',
	streak: 0,
	wordsKnown: 0,
	hsk: 1,
	lesson: 0,
	badges: [],
	following: false,
	me: true
};
const ngoc: Visible = {
	status: 'visible',
	name: 'Nguyễn Thị Ngọc',
	photo: null,
	handle: 'ngoc',
	streak: 9,
	wordsKnown: 120,
	hsk: 2,
	lesson: 14,
	badges: ['first', 'streak7'],
	following: false,
	me: false
};

let target: HTMLElement | undefined;
let app: ReturnType<typeof mount> | undefined;
const scroll = vi.fn();

const render = (profile: PublicProfile, badge: string | null = null) => {
	const root = document.createElement('div');
	document.body.append(root);
	target = root;
	const props = {
		params: { handle: 'x' },
		data: { session: null, shell: { template: 'pushed', section: 'me' }, profile, badge }
	} as unknown as PageProps;
	app = mount(Page, { target: root, props });
	flushSync();
	return root;
};

const settle = async () => {
	for (let i = 0; i < 4; i++) {
		await vi.advanceTimersByTimeAsync(0);
		await tick();
	}
	flushSync();
};
const followBtn = (root: HTMLElement) => root.querySelector<HTMLButtonElement>('button');
const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim();

beforeEach(() => {
	rpc.mockReset();
	scroll.mockReset();
	Element.prototype.scrollIntoView = scroll;
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	nav.after.length = 0;
	vi.restoreAllMocks();
	if (app) unmount(app);
	target?.remove();
	app = undefined;
	target = undefined;
});

describe('profile page', () => {
	it('Given_Hidden_When_Render_Then_UserBlockIconTitleAndBody', () => {
		const root = render({ status: 'hidden' });
		expect(root.querySelector('h1')?.textContent).toBe('Hồ sơ đang ẩn');
		expect(root.querySelector('p')?.textContent).toBe(
			'Bạn này chọn giữ hồ sơ cho riêng mình. Tôn trọng nha!'
		);
		expect(root.querySelector('use[href="#i-fill-user-block"]')).not.toBeNull();
	});

	it('Given_Missing_When_Render_Then_MagniferTitleAndBody', () => {
		const root = render({ status: 'missing' });
		expect(root.querySelector('h1')?.textContent).toBe('Không thấy người này');
		expect(root.querySelector('p')?.textContent).toBe(
			'Link hơi lạc đường rồi. Quay lại tìm bạn nhé.'
		);
		expect(root.querySelector('use[href="#i-fill-magnifer"]')).not.toBeNull();
	});

	it('Given_Visible_When_Render_Then_NameH1NoEmptyText', () => {
		const root = render(visible);
		expect(root.querySelector('h1')?.textContent).toBe('Linh');
		expect(root.textContent).not.toContain('Hồ sơ đang ẩn');
		expect(root.textContent).not.toContain('Không thấy người này');
	});

	it('Given_Any_When_Render_Then_TopBarHoSoAndBackToMe', () => {
		const root = render({ status: 'hidden' });
		expect(root.querySelector('span')?.textContent).toBe('Hồ sơ');
		const back = root.querySelector('a');
		expect(back?.getAttribute('aria-label')).toBe('Quay lại');
		expect(back?.getAttribute('href')).toMatch(/\/me$/);
	});

	it('Given_ArrivedInApp_When_BackClicked_Then_HistoryBack', () => {
		const back = vi.spyOn(history, 'back').mockImplementation(() => undefined);
		const root = render({ status: 'hidden' });
		nav.after[0]({ from: {}, type: 'link' });
		root.querySelector('a')?.click();
		expect(back).toHaveBeenCalledOnce();
	});
});

describe('profile body', () => {
	it('Given_Ngoc_Then_AvatarNameChipStats', () => {
		const root = render(ngoc);
		expect(text(root.querySelector('h1'))).toBe('Nguyễn Thị Ngọc');
		const avatar = root.querySelector('[data-part="avatar"]');
		expect(text(avatar)).toBe('N');
		expect(avatar?.className).toContain('bg-sunflower-wash');
		expect(avatar?.className).toContain('size-24');
		expect(text(root.querySelector('[data-part="chip"]'))).toBe('HSK 2');
		const cells = [...root.querySelectorAll('[data-part="stats"] > div')].map((c) => text(c));
		expect(cells).toEqual(['Bài 14 Đang học', '9 Chuỗi ngày', '120 Từ đã biết']);
	});

	it('Given_Photo_Then_ImgAvatar', () => {
		const root = render({ ...ngoc, photo: 'https://x/y.png' });
		const img = root.querySelector('img[data-part="avatar"]');
		expect(img?.getAttribute('src')).toBe('https://x/y.png');
		expect(img?.className).toContain('size-24');
	});

	it('Given_Streak_Then_FlameAndChuoiNgay', () => {
		const root = render(ngoc);
		const cell = root.querySelectorAll('[data-part="stats"] > div')[1];
		expect(cell.querySelector('use[href="#i-fill-fire"]')).not.toBeNull();
		expect(text(cell)).toContain('Chuỗi ngày');
	});

	it('Given_TwoBadges_Then_CountLineAndCatalogueOrder', () => {
		const root = render(ngoc);
		expect(text(root.querySelector('section h2'))).toBe('Huy hiệu');
		expect(text(root.querySelector('section p'))).toBe('Nguyễn Thị Ngọc có 2 huy hiệu.');
		const cards = [...root.querySelectorAll('[data-part="badge"]')];
		expect(cards.map((c) => text(c))).toEqual(['Bước đầu tiên', 'Chuỗi 7 ngày']);
		expect(cards.map((c) => c.querySelector('img')?.getAttribute('src'))).toEqual([
			'/badges/first.webp',
			'/badges/streak7.webp'
		]);
	});

	it('Given_NoBadges_Then_NoneLineNoStrip', () => {
		const root = render({ ...ngoc, name: 'Đặng Minh', badges: [] });
		expect(text(root.querySelector('section h2'))).toBe('Huy hiệu');
		expect(text(root.querySelector('section p'))).toBe('Đặng Minh chưa có huy hiệu nào.');
		expect(root.querySelector('[data-part="badge"]')).toBeNull();
		expect(root.querySelector('[data-part="strip"]')).toBeNull();
	});

	it('Given_Visible_Then_NoEmailPhoneScoreText', () => {
		const t = render(ngoc).textContent ?? '';
		expect(t).not.toMatch(/email|điện thoại|điểm|lỗi/i);
	});
});

describe('follow button', () => {
	it('Given_NotFollowed_Then_PrimaryTheoDoiName', () => {
		const b = followBtn(render(ngoc))!;
		expect(text(b)).toBe('Theo dõi Nguyễn Thị Ngọc');
		expect(b.className).toContain('bg-lantern-red');
	});

	it('Given_Tap_Then_FlipsDangTheoDoiAndToast', async () => {
		let done!: (v: unknown) => void;
		rpc.mockReturnValue(new Promise((r) => (done = r)));
		const root = render(ngoc);
		followBtn(root)!.click();
		flushSync();
		expect(text(followBtn(root))).toBe('Đang theo dõi');
		expect(followBtn(root)!.className).toContain('border-ruled-line');
		expect(followBtn(root)!.querySelector('use[href="#i-bold-check"]')).not.toBeNull();
		expect(rpc).toHaveBeenCalledWith('set_follow', { p_handle: 'ngoc', p_on: true });
		done({ data: true, error: null });
		await settle();
		expect(root.textContent).toContain('Đã theo dõi Nguyễn Thị Ngọc');
		await vi.advanceTimersByTimeAsync(2200);
		flushSync();
		expect(root.textContent).not.toContain('Đã theo dõi Nguyễn Thị Ngọc');
	});

	it('Given_TapDangTheoDoi_Then_UnfollowToast', async () => {
		rpc.mockResolvedValue({ data: true, error: null });
		const root = render({ ...ngoc, following: true });
		expect(text(followBtn(root))).toBe('Đang theo dõi');
		followBtn(root)!.click();
		await settle();
		expect(rpc).toHaveBeenCalledWith('set_follow', { p_handle: 'ngoc', p_on: false });
		expect(text(followBtn(root))).toBe('Theo dõi Nguyễn Thị Ngọc');
		expect(root.textContent).toContain('Đã bỏ theo dõi Nguyễn Thị Ngọc');
	});

	it('Given_FalseOrError_Then_RollbackFailedToast', async () => {
		rpc.mockResolvedValueOnce({ data: false, error: null });
		const root = render(ngoc);
		followBtn(root)!.click();
		await settle();
		expect(text(followBtn(root))).toBe('Theo dõi Nguyễn Thị Ngọc');
		expect(root.textContent).toContain('Chưa lưu được, thử lại nhé');
		rpc.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
		followBtn(root)!.click();
		await settle();
		expect(text(followBtn(root))).toBe('Theo dõi Nguyễn Thị Ngọc');
		expect(root.textContent).toContain('Chưa lưu được, thử lại nhé');
	});

	it('Given_Pending_When_TapAgain_Then_OneRpc', () => {
		rpc.mockReturnValue(new Promise(() => {}));
		const root = render(ngoc);
		followBtn(root)!.click();
		flushSync();
		followBtn(root)!.click();
		flushSync();
		expect(rpc).toHaveBeenCalledTimes(1);
	});

	it('Given_Me_Then_NoButton', () => {
		const root = render({ ...ngoc, me: true });
		expect(root.querySelector('button')).toBeNull();
	});
});

describe('?badge=', () => {
	it('Given_BadgeStreak7_Then_AriaCurrentAndScrolled', () => {
		const root = render(ngoc, 'streak7');
		const cur = root.querySelectorAll('[aria-current="true"]');
		expect(cur).toHaveLength(1);
		expect(text(cur[0])).toBe('Chuỗi 7 ngày');
		expect(cur[0].className).toContain('aria-[current=true]:ring-[2.5px]');
		expect(cur[0].className).toContain('aria-[current=true]:ring-lantern-red');
		expect(scroll).toHaveBeenCalledWith({ inline: 'center', block: 'nearest' });
		expect(scroll.mock.contexts[0]).toBe(cur[0]);
	});

	it('Given_NoBadge_Then_NoAriaCurrent', () => {
		const root = render(ngoc, null);
		expect(root.querySelector('[aria-current]')).toBeNull();
		expect(scroll).not.toHaveBeenCalled();
	});

	it('Given_HiddenOrMissingWithBadgeQuery_Then_SameDomAsWithout', () => {
		for (const status of ['hidden', 'missing'] as const) {
			const a = render({ status }, null).innerHTML;
			const b = render({ status }, 'streak7').innerHTML;
			expect(b).toBe(a);
		}
	});
});
