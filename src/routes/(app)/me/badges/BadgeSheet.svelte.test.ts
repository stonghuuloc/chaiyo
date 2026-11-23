import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EarnedBadge, LockedBadge } from '#lib/study/index.js';
import BadgeSheet from './BadgeSheet.svelte';

const streak7: EarnedBadge = { id: 'streak7', title: 'Chuỗi 7 ngày', art: 'streak7', date: '18/10' };
const streak30: LockedBadge = {
	id: 'streak30',
	title: 'Chuỗi 30 ngày',
	art: 'streak30',
	have: 12,
	need: 30,
	pct: 40
};
const hsk1: LockedBadge = { id: 'hsk1', title: 'Đỗ HSK 1', art: 'hsk1', have: 0, need: null, pct: 0 };

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const show = (badge: EarnedBadge | LockedBadge | null, how = '') => {
	const onclose = vi.fn();
	const onshare = vi.fn();
	target = document.createElement('div');
	document.body.append(target);
	app = mount(BadgeSheet, { target, props: { badge, how, onclose, onshare } });
	flushSync();
	return { onclose, onshare };
};
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const shareButton = () =>
	[...(dialog()?.querySelectorAll('button') ?? [])].filter((b) =>
		b.textContent?.includes('Khoe với bạn bè')
	);

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	app = target = undefined;
});

describe('BadgeSheet', () => {
	it('Given_EarnedStreak7_Then_HowGotAndShare', () => {
		show(streak7, 'Học 7 ngày liền, không bỏ buổi nào.');
		const d = dialog()!;
		expect(d.querySelector('h2')?.textContent).toBe('Chuỗi 7 ngày');
		expect(d.textContent).toContain('Học 7 ngày liền, không bỏ buổi nào.');
		expect(d.textContent).toContain('Đã có từ ngày 18/10');
		expect(shareButton()).toHaveLength(1);
		expect(d.querySelector('img')?.className).not.toContain('grayscale');
	});

	it('Given_LockedStreak30_Then_At12of30Bar40NoShare', () => {
		show(streak30);
		const d = dialog()!;
		expect(d.textContent).toContain('Đang ở 12/30');
		expect(d.querySelector<HTMLElement>('[data-part="fill"]')?.style.width).toBe('40%');
		expect(shareButton()).toHaveLength(0);
		expect(d.querySelector('img')?.className).toContain('grayscale');
	});

	it('Given_LockedHsk1_Then_ChuaMoNoBarNoShare', () => {
		show(hsk1);
		const d = dialog()!;
		expect(d.textContent).toContain('Chưa mở');
		expect(d.querySelector('[data-part="fill"]')).toBeNull();
		expect(shareButton()).toHaveLength(0);
	});

	it('Given_Close_When_Click_Then_OnClose', () => {
		const { onclose } = show(streak7);
		dialog()!.querySelector<HTMLButtonElement>('button[aria-label="Đóng"]')!.click();
		expect(onclose).toHaveBeenCalledTimes(1);
	});

	it('Given_Share_When_Click_Then_OnShare', () => {
		const { onshare } = show(streak7);
		shareButton()[0].click();
		expect(onshare).toHaveBeenCalledTimes(1);
	});

	it('Given_Null_Then_NoDialog', () => {
		show(null);
		expect(dialog()).toBeNull();
	});
});
