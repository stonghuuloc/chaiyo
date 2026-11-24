import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MeMenu from './MeMenu.svelte';

const hoisted = vi.hoisted(() => ({ signOut: vi.fn(), goto: vi.fn() }));
vi.mock('#lib/supabase.js', () => ({ supabase: { auth: { signOut: hoisted.signOut } } }));
vi.mock('$app/navigation', () => ({ goto: hoisted.goto }));

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
const render = (admin: boolean) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(MeMenu, { target, props: { admin } }) as Record<string, unknown>;
	flushSync();
	const rows = () => [...target!.querySelectorAll('[data-part=me-menu] li')];
	return {
		rows,
		titles: () => rows().map((r) => r.querySelector('b')?.textContent?.trim()),
		subs: () => rows().map((r) => r.querySelector('small')?.textContent?.trim()),
		hrefs: () => rows().map((r) => r.querySelector('a')?.getAttribute('href') ?? null),
		carets: () =>
			rows().map((r) => r.querySelectorAll('use[href="#i-regular-caret-right"]').length),
		logout: () => target!.querySelector<HTMLButtonElement>('button')!,
		tap: async () => {
			target!.querySelector<HTMLButtonElement>('button')!.click();
			flushSync();
			await tick();
		},
		toast: () => document.body.querySelector('[role=status]')?.textContent?.trim(),
		version: () => target!.querySelector('p')?.textContent?.trim()
	};
};

beforeEach(() => {
	hoisted.signOut.mockReset();
	hoisted.goto.mockReset();
	hoisted.signOut.mockResolvedValue({ error: null });
	hoisted.goto.mockResolvedValue(undefined);
});

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	document.body.querySelector('[role=status]')?.remove();
	app = target = undefined;
});

describe('MeMenu', () => {
	it('Given_NotAdmin_When_Render_Then_FriendsAndSettingsLinks', () => {
		const v = render(false);
		expect(v.titles()).toEqual(['Bạn bè', 'Cài đặt']);
		expect(v.subs()).toEqual(['Bảng xếp hạng tuần', 'Nhắc học · hồ sơ · kiểu chữ']);
		const hrefs = v.hrefs();
		expect(hrefs[0]).toMatch(/\/me\/friends$/);
		expect(hrefs[1]).toMatch(/\/settings$/);
		expect(v.carets()).toEqual([1, 1]);
	});

	it('Given_Admin_When_Render_Then_ReportsLinksUsagePlain', () => {
		const v = render(true);
		expect(v.titles()).toEqual(['Bạn bè', 'Cài đặt', 'Báo lỗi nội dung', 'Số liệu sử dụng']);
		expect(v.subs().slice(2)).toEqual([
			'Quản trị · hộp thư báo lỗi',
			'Quản trị · người học bỏ ở đâu'
		]);
		const hrefs = v.hrefs();
		expect(hrefs[2]).toMatch(/\/admin\/reports$/);
		expect(hrefs[3]).toBeNull();
		expect(hrefs.slice(0, 2).every(Boolean)).toBe(true);
		expect(v.carets()).toEqual([1, 1, 1, 0]);
	});

	it('Given_SignOutOk_When_Logout_Then_GotoLoginReplace', async () => {
		const v = render(false);
		await v.tap();
		expect(hoisted.signOut).toHaveBeenCalledTimes(1);
		expect(hoisted.goto).toHaveBeenCalledTimes(1);
		expect(hoisted.goto.mock.calls[0][0]).toMatch(/\/login$/);
		expect(hoisted.goto.mock.calls[0][1]).toEqual({ replace: true });
	});

	it('Given_DoubleTap_When_Logout_Then_SignOutOnce', async () => {
		let release: (v: { error: null }) => void = () => {};
		hoisted.signOut.mockReturnValue(new Promise((r) => (release = r)));
		const v = render(false);
		await v.tap();
		expect(v.logout().disabled).toBe(true);
		await v.tap();
		expect(hoisted.signOut).toHaveBeenCalledTimes(1);

		hoisted.goto.mockReturnValue(new Promise(() => {}));
		release({ error: null });
		await tick();
		await Promise.resolve();
		await v.tap();
		expect(hoisted.signOut).toHaveBeenCalledTimes(1);
		expect(hoisted.goto).toHaveBeenCalledTimes(1);
	});

	it('Given_SignOutError_When_Logout_Then_ToastNoGoto', async () => {
		hoisted.signOut.mockResolvedValue({ error: new Error('offline') });
		const v = render(false);
		await v.tap();
		await tick();
		expect(hoisted.goto).not.toHaveBeenCalled();
		expect(v.toast()).toBe('Chưa đăng xuất được, thử lại nhé.');
		expect(v.logout().disabled).toBe(false);
	});

	it('Given_Menu_When_Render_Then_VersionLine', () => {
		const v = render(false);
		expect(v.version()).toBe('Chaiyo · bản thử');
		expect(v.logout().textContent?.trim()).toBe('Đăng xuất');
	});
});
