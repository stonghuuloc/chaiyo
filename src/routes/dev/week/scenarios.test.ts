import { describe, expect, it } from 'vitest';
import { weekView } from '../../(app)/(tabs)/today/week';
import { SCENARIOS, type ScenarioKey } from './scenarios';

const rows: [ScenarioKey, string][] = [
	[
		'ac4',
		'T4 bạn nghỉ nên app dùng 1 lượt đóng băng. Học xong một phần bài hôm nay là chuỗi lên 13.'
	],
	['ac5', 'Hôm nay đã tính rồi, chuỗi 13 ngày. Mai gặp lại nha!'],
	[
		'overnight',
		'T5 bạn nghỉ nên app dùng 1 lượt đóng băng. Học xong một phần bài hôm nay là chuỗi lên 6.'
	],
	['reset', 'Học xong một phần bài hôm nay là chuỗi lên 1.'],
	['fresh', 'Học xong một phần bài hôm nay là chuỗi lên 1.'],
	['monday', 'Học xong một phần bài hôm nay là chuỗi lên 1.']
];

describe('dev week scenarios', () => {
	it.each(rows)('Given_EachScenario_When_WeekView_Then_NamedLine (%s)', (key, line) => {
		// Act
		const { state, now } = SCENARIOS[key]();

		// Assert
		expect(weekView(state, now).line).toBe(line);
	});

	it('Given_Scenarios_When_Listed_Then_SixKeys', () => {
		expect(Object.keys(SCENARIOS)).toEqual(rows.map(([k]) => k));
	});
});
