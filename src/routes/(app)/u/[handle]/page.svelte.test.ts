import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

const visible: PublicProfile = {
	status: 'visible',
	name: 'Linh',
	photo: null,
	handle: 'linh',
	streak: 0,
	wordsWeek: 0,
	wordsKnown: 0,
	hsk: 1,
	lesson: 0,
	badges: []
};

let target: HTMLElement | undefined;
let app: ReturnType<typeof mount> | undefined;

const render = (profile: PublicProfile) => {
	const root = document.createElement('div');
	document.body.append(root);
	target = root;
	const props = {
		params: { handle: 'x' },
		data: { session: null, shell: { template: 'pushed', section: 'me' }, profile }
	} as PageProps;
	app = mount(Page, { target: root, props });
	flushSync();
	return root;
};

afterEach(() => {
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
		expect(root.querySelector('p')).toBeNull();
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
