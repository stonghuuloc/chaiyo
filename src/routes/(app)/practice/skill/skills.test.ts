import { describe, expect, it } from 'vitest';
import { ENTRIES, SKILL_KEYS, noteFor, skillKey, thiLevel } from './skills';

describe('skill entries', () => {
	it.each([
		['noi', 'Đọc to, app chấm phát âm'],
		['doan', 'Viết câu, rồi viết đoạn ngắn'],
		['thi', 'Thi thử HSK 1, như thi thật']
	] as const)('Given_EachKey_%s_Then_TitleEqualsAc1Example', (k, title) => {
		// Arrange
		// Act
		const entry = ENTRIES[k];
		// Assert
		expect(entry.title()).toBe(title);
	});

	it.each(SKILL_KEYS)('Given_EachKey_%s_Then_ThreeStepsOneSample', (k) => {
		// Arrange
		// Act
		const entry = ENTRIES[k];
		// Assert
		expect(entry.steps).toHaveLength(3);
		expect(entry.steps.every((s) => s().length > 0)).toBe(true);
		expect(entry.sample.hanzi()).not.toBe('');
	});

	it.each([
		[null, 'noi'],
		['zzz', 'noi'],
		['', 'noi'],
		['doan', 'doan'],
		['thi', 'thi']
	] as const)('Given_%s_When_SkillKey_Then_%s', (raw, expected) => {
		// Arrange
		// Act
		const k = skillKey(raw);
		// Assert
		expect(k).toBe(expected);
	});
});

describe('noteFor', () => {
	it('Given_DoanLevel1_Then_Ac3Literal', () => {
		// Arrange
		// Act
		const note = noteFor('doan', 1);
		// Assert
		expect(note).toBe('Mở khi bạn tới HSK 3. Bạn đang ở HSK 1.');
	});

	it('Given_DoanLevel2_Then_Hsk2Line', () => {
		// Arrange
		// Act
		const note = noteFor('doan', 2);
		// Assert
		expect(note).toBe('Mở khi bạn tới HSK 3. Bạn đang ở HSK 2.');
	});

	it.each([3, 6])('Given_DoanLevelAtLeast3_%s_Then_DemoNote', (level) => {
		// Arrange
		// Act
		const note = noteFor('doan', level);
		// Assert
		expect(note).toBe('Chưa có trong bản demo: cần AI chấm bài viết.');
	});

	it('Given_DoanNoLevel_Then_DemoNote', () => {
		// Arrange
		// Act
		const note = noteFor('doan');
		// Assert
		expect(note).toBe('Chưa có trong bản demo: cần AI chấm bài viết.');
	});

	it.each(['noi', 'thi'] as const)('Given_OtherKLevel1_%s_Then_S1Note', (k) => {
		// Arrange
		// Act
		const note = noteFor(k, 1);
		// Assert
		expect(note).toBe(ENTRIES[k].note());
	});
});

describe('thiLevel', () => {
	it.each(['1', '2', '3', '4', '5', '6'])('Given_ValidLv_%s_Then_Number', (raw) => {
		// Arrange
		// Act
		const lv = thiLevel(raw);
		// Assert
		expect(lv).toBe(Number(raw));
	});

	it.each([null, '', '0', '7', '1.5', 'x', ' 2'])('Given_InvalidLv_%s_Then_Undefined', (raw) => {
		// Arrange
		// Act
		const lv = thiLevel(raw);
		// Assert
		expect(lv).toBeUndefined();
	});
});
