import { describe, expect, it } from 'vitest';
import { ENTRIES, SKILL_KEYS, skillKey } from './skills';

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
