import type { Answer } from '#lib/lesson/index.js';
import type { StudyEvent } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { resultView } from './result';

const answers = (right: number, of: number): Answer[] =>
	Array.from({ length: of }, (_, i) => ({
		questionId: `q${i}`,
		pick: 'x',
		correct: i < right,
		ms: 0
	}));

const PASSED: StudyEvent[] = [
	{ type: 'SectionDone', lesson: 'h1-01', section: 'gate' },
	{ type: 'GatePassed', lesson: 'h1-01', score: 90 },
	{ type: 'LessonUnlocked', lesson: 'h1-02' }
];
const DAY: StudyEvent = { type: 'DayCounted', day: '2026-11-22', streak: 4 };

describe('resultView', () => {
	it('Given_9of10_UnlockAndDay_When_View_Then_90PassFullLine', () => {
		// Arrange
		const input = { lesson: 'h1-01', answers: answers(9, 10), events: [...PASSED, DAY], best: 90 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v).toMatchObject({ pct: 90, right: 9, of: 10, pass: true, n: 1, art: 'b1-pass' });
		expect(v.line).toBe('Đã mở Bài 2 · +1 ngày chuỗi');
	});

	it('Given_9of10_NoDayCounted_When_View_Then_UnlockOnly', () => {
		// Arrange
		const input = { lesson: 'h1-01', answers: answers(9, 10), events: PASSED, best: 90 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v.line).toBe('Đã mở Bài 2');
	});

	it('Given_Repass_NoEvents_When_View_Then_NullLine', () => {
		// Arrange
		const events: StudyEvent[] = [{ type: 'GatePassed', lesson: 'h1-01', score: 100 }];
		const input = { lesson: 'h1-01', answers: answers(10, 10), events, best: 100 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v).toMatchObject({ pct: 100, pass: true, line: null });
	});

	it('Given_6of10_When_View_Then_60FailCalmLine', () => {
		// Arrange
		const input = { lesson: 'h1-01', answers: answers(6, 10), events: [DAY], best: 60 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v).toMatchObject({ pct: 60, right: 6, of: 10, pass: false, art: 'b1-fail' });
		expect(v.line).toBe('Gần được rồi. Cần 80% để mở Bài 2.');
	});

	it('Given_8of10_When_View_Then_PassAtThreshold', () => {
		// Arrange
		const input = { lesson: 'h1-01', answers: answers(8, 10), events: [], best: 80 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v).toMatchObject({ pct: 80, pass: true });
	});

	it('Given_Best70_Run60_When_View_Then_Best70', () => {
		// Arrange
		const input = { lesson: 'h1-01', answers: answers(6, 10), events: [], best: 70 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v).toMatchObject({ pct: 60, best: 70 });
	});

	it('Given_UnknownLesson_When_View_Then_NumberZero', () => {
		// Arrange
		const input = { lesson: 'x-99', answers: answers(1, 10), events: [], best: 10 };

		// Act
		const v = resultView(input);

		// Assert
		expect(v.n).toBe(0);
		expect(v.line).toBe('Gần được rồi. Cần 80% để mở Bài 0.');
	});
});
