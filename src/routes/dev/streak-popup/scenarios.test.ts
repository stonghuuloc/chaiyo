import { describe, expect, it } from 'vitest';
import { dayCountedView } from '#lib/lesson/index.js';
import { SCENARIOS } from './scenarios';

describe('streak popup scenarios', () => {
	it('Given_EachScenario_When_View_Then_MatchesAC2Row', () => {
		// Arrange / Act
		const view = (name: keyof typeof SCENARIOS) => dayCountedView(SCENARIOS[name]());

		// Assert
		expect(view('record13')!.headline).toBe('Kỷ lục mới 13 ngày!');
		expect(view('record13')!.note).toBe('Thêm 1 ngày nữa là được thêm 1 lượt đóng băng.');
		expect(view('gift14')!.note).toBe(
			'Được tặng 1 lượt đóng băng! Lỡ bận một hôm thì chuỗi vẫn giữ.'
		);
		expect(view('full6')!.headline).toBe('Chuỗi lên 6 ngày!');
		expect(view('full6')!.note).toBeNull();
		expect(view('sameDay')).toBeNull();
	});
});
