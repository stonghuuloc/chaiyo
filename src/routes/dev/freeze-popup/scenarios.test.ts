import { dayCountedView } from '#lib/lesson/index.js';
import type { FreezeUsedView } from '#lib/lesson/index.js';
import type { StudyEvent } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from './scenarios';

describe('freeze popup scenarios', () => {
	it('Given_EachScenario_When_Build_Then_ExpectedView', () => {
		// Arrange / Act
		const ac3 = SCENARIOS.ac3() as FreezeUsedView;
		const noneLeft = SCENARIOS.noneLeft() as FreezeUsedView;

		// Assert
		expect(ac3.body).toContain('Hôm T4');
		expect(ac3.note).toContain('Còn 1 lượt');
		expect(noneLeft.note).toContain('Hết lượt');
		expect(SCENARIOS.seen()).toBeNull();
		expect(dayCountedView(SCENARIOS.dayCounted() as StudyEvent[])!.headline).toBe(
			'Kỷ lục mới 13 ngày!'
		);
	});
});
