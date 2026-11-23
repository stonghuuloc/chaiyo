import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { controlName, controls } from '../../test/controls';
import FreezePopup from './FreezePopup.svelte';
import type { FreezeUsedView } from './freeze-popup';

const original = window.matchMedia;
let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const view: FreezeUsedView = {
	day: '2026-11-11',
	n: 12,
	left: 1,
	headline: 'Chuỗi vẫn còn nguyên!',
	body: 'Hôm T4 bạn nghỉ, 1 lượt đóng băng đã tự giữ chuỗi 12 ngày cho bạn. Hôm nay học để chuỗi chạy tiếp nhé.',
	note: 'Còn 1 lượt. Học đủ 7 ngày liền được tặng thêm 1.'
};

const mountPopup = () => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(FreezePopup, { target, props: { view } }) as Record<string, unknown>;
	flushSync();
	return () => document.querySelector('[role="dialog"]');
};

const particles = () => document.querySelectorAll('[data-part="particle"]');

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	window.matchMedia = original;
	flushSync();
});

describe('FreezePopup', () => {
	it('Given_AC3View_When_Mount_Then_SnowflakeHeadlineBodyNoteButton', () => {
		// Arrange / Act
		const dialog = mountPopup();

		// Assert
		const d = dialog()!;
		expect(d.querySelector('[data-part="freeze-icon"] use')!.getAttribute('href')).toBe(
			'#i-fill-snowflake'
		);
		expect(d.querySelector('h2')!.textContent).toBe(view.headline);
		expect(d.querySelector('[data-part="freeze-body"]')!.textContent).toContain(view.body);
		expect(d.querySelector('[data-part="freeze-note"]')!.textContent).toContain(view.note);
		expect(d.querySelectorAll('button')).toHaveLength(1);
		expect(d.querySelector('button')!.textContent).toContain('Học ngay thôi');
	});

	it('Given_Open_When_ClickHocNgay_Then_DialogAndParticlesRemoved', async () => {
		// Arrange
		const dialog = mountPopup();
		expect(particles()).toHaveLength(18);

		// Act
		dialog()!.querySelector('button')!.click();
		flushSync();

		// Assert
		await expect.poll(() => dialog()).toBeNull();
		expect(particles()).toHaveLength(0);
	});

	it('Given_MotionAllowed_When_Mount_Then_SpinAnd18Snow', () => {
		// Arrange / Act
		const dialog = mountPopup();

		// Assert
		expect(dialog()!.querySelector('[data-part="freeze-icon"]')!.getAttribute('data-motion')).toBe(
			'spin'
		);
		expect(document.querySelectorAll('[data-part="particle"][data-kind="snow"]')).toHaveLength(18);
	});

	it('Given_ReducedMotion_When_Mount_Then_NoParticlesNoSpin', () => {
		// Arrange
		window.matchMedia = ((media: string) => ({ matches: true, media })) as typeof matchMedia;

		// Act
		const dialog = mountPopup();

		// Assert
		expect(dialog()!.querySelector('[data-part="freeze-icon"]')!.hasAttribute('data-motion')).toBe(
			false
		);
		expect(particles()).toHaveLength(0);
	});

	it('Given_AC3View_When_ScanControls_Then_OnlyHocNgayThoi', () => {
		// Arrange / Act
		const dialog = mountPopup();

		// Assert
		expect(controls(dialog() as HTMLElement).map(controlName)).toEqual(['Học ngay thôi']);
	});
});
