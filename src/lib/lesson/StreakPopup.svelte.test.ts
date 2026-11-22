import { flushSync, mount, unmount } from 'svelte';
import type { StudyEvent } from '#lib/study/index.js';
import { afterEach, describe, expect, it } from 'vitest';
import StreakPopup from './StreakPopup.svelte';

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
});
