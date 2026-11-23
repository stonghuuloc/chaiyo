import { flushSync, mount, unmount } from 'svelte';
import type { StudyEvent } from '#lib/study/index.js';
import { afterEach, describe, expect, it } from 'vitest';
import StreakPopup from './StreakPopup.svelte';

const original = window.matchMedia;
let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountPopup = (events: StudyEvent[]) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(StreakPopup, { target, props: { events } }) as Record<string, unknown>;
	flushSync();
	return () => document.querySelector('[role="dialog"]');
};

const sectionDone: StudyEvent = { type: 'SectionDone', lesson: 'h1-01', section: 'grammar' };

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
	window.matchMedia = original;
	flushSync();
});

describe('StreakPopup', () => {
	it('Given_DayCountedStreak4_When_Mount_Then_PopupReadsStreak', () => {
		// Arrange
		const events: StudyEvent[] = [
			sectionDone,
			{ type: 'DayCounted', day: '2026-11-22', streak: 4 }
		];

		// Act
		const dialog = mountPopup(events);

		// Assert
		expect(dialog()!.querySelector('h2')!.textContent).toBe('Chuỗi lên 4 ngày!');
		expect(dialog()!.querySelector('button')!.textContent).toContain('Tuyệt!');
	});

	it('Given_NoDayCounted_When_Mount_Then_NoPopup', () => {
		// Arrange / Act
		const dialog = mountPopup([sectionDone]);

		// Assert
		expect(dialog()).toBeNull();
	});

	it('Given_Popup_When_OkClicked_Then_Closes', async () => {
		// Arrange
		const dialog = mountPopup([{ type: 'DayCounted', day: '2026-11-22', streak: 2 }]);

		// Act
		dialog()!.querySelector('button')!.click();
		flushSync();

		// Assert
		await expect.poll(() => dialog()).toBeNull();
	});

	it('Given_AC1Events_When_Mount_Then_FlameHeadlineBodyWeekNoteButton', () => {
		// Arrange
		const events: StudyEvent[] = [
			{ type: 'DayCounted', day: '2026-11-13', streak: 13, record: true, freezes: 1 }
		];

		// Act
		const dialog = mountPopup(events);

		// Assert
		const d = dialog()!;
		expect(d.querySelector('[data-part="streak-flame"]')).not.toBeNull();
		expect(d.querySelector('h2')!.textContent).toBe('Kỷ lục mới 13 ngày!');
		expect(d.querySelector('[data-part="streak-body"]')!.textContent).toContain('thành 14 nha');
		expect(d.querySelectorAll('[data-part="streak-week"] li')).toHaveLength(7);
		expect(d.querySelector('li[data-today]')!.textContent).toContain('T6');
		expect(d.querySelectorAll('li[data-ticked]')).toHaveLength(5);
		expect(d.querySelector('[data-part="streak-note"]')!.textContent).toContain('Thêm 1 ngày');
		expect(d.querySelector('button')!.textContent).toContain('Tuyệt!');
	});

	it('Given_FullFreezes_When_Mount_Then_NoNoteElement', () => {
		// Arrange
		const events: StudyEvent[] = [
			{ type: 'DayCounted', day: '2026-11-13', streak: 6, record: false, freezes: 2 }
		];

		// Act
		const dialog = mountPopup(events);

		// Assert
		expect(dialog()!.querySelector('[data-part="streak-note"]')).toBeNull();
	});

	it('Given_EarnedEvent_When_Mount_Then_GiftNote', () => {
		// Arrange
		const events: StudyEvent[] = [
			{ type: 'DayCounted', day: '2026-11-14', streak: 14, record: true, freezes: 2 },
			{ type: 'FreezeEarned', freezes: 2 }
		];

		// Act
		const dialog = mountPopup(events);

		// Assert
		expect(dialog()!.querySelector('[data-part="streak-note"]')!.textContent).toContain(
			'Được tặng 1 lượt đóng băng!'
		);
	});

	it('Given_MotionAllowed_When_DayCounted_Then_FlameFlickersAnd18Embers', () => {
		// Arrange / Act
		const dialog = mountPopup([{ type: 'DayCounted', day: '2026-11-22', streak: 4 }]);

		// Assert
		expect(dialog()!.querySelector('[data-part="streak-flame"]')!.getAttribute('data-motion')).toBe(
			'flicker'
		);
		expect(document.querySelectorAll('[data-part="particle"][data-kind="ember"]')).toHaveLength(18);
	});

	it('Given_ReducedMotion_When_DayCounted_Then_NoParticlesAndStillFlame', () => {
		// Arrange
		window.matchMedia = ((media: string) => ({ matches: true, media })) as typeof matchMedia;

		// Act
		const dialog = mountPopup([{ type: 'DayCounted', day: '2026-11-22', streak: 4 }]);

		// Assert
		const flame = dialog()!.querySelector('[data-part="streak-flame"]')!;
		expect(flame.hasAttribute('data-motion')).toBe(false);
		expect(document.querySelectorAll('[data-part="particle"]')).toHaveLength(0);
	});

	it('Given_Open_When_ClickTuyet_Then_ParticlesRemoved', async () => {
		// Arrange
		const dialog = mountPopup([{ type: 'DayCounted', day: '2026-11-22', streak: 4 }]);

		// Act
		dialog()!.querySelector('button')!.click();
		flushSync();

		// Assert
		await expect.poll(() => dialog()).toBeNull();
		expect(document.querySelectorAll('[data-part="particle"]')).toHaveLength(0);
	});
});
