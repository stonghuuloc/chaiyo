import { describe, expect, it } from 'vitest';
import { buildCurriculum } from './build';
import { CURRICULUM, LESSONS, firstLessonId } from './index';

const by = (id: string) => {
	const lesson = LESSONS.find((l) => l.id === id);
	if (!lesson) throw new Error(`no lesson ${id}`);
	return lesson;
};

describe('curriculum', () => {
	it('matches what content/ builds (run pnpm curriculum)', () => {
		expect(buildCurriculum('content')).toEqual(LESSONS);
		expect(CURRICULUM.lessons).toBe(LESSONS);
	});

	it('throws when the content folder holds no lessons', () => {
		expect(() => buildCurriculum('src/lib/curriculum')).toThrow(/no lessons/);
	});

	it('numbers lessons and counts words', () => {
		expect(LESSONS.map((l) => [l.id, l.n])).toEqual([
			['h0-00', 0],
			['h1-01', 1],
			['h1-02', 2],
			['h1-03', 3],
			['h1-04', 4],
			['h1-05', 5],
			['h2-01', 6],
			['h3-01', 7],
			['h4-01', 8],
			['h5-01', 9]
		]);
		expect(LESSONS.map((l) => l.words.length)).toEqual([0, 10, 9, 10, 8, 14, 12, 13, 15, 15]);
		expect(LESSONS.reduce((n, l) => n + l.words.length, 0)).toBe(106);
	});

	it('lists sections without warmup and flags the primer', () => {
		expect(by('h0-00')).toMatchObject({
			testOut: true,
			sections: ['tones', 'finals', 'initials', 'spelling', 'sandhi']
		});
		expect(by('h1-01').sections).toEqual([
			'words',
			'grammar',
			'dialogue',
			'listenSpeak',
			'writing'
		]);
		expect(by('h3-01').sections).toEqual([
			'words',
			'grammar',
			'dialogue',
			'reading',
			'listenSpeak',
			'writing'
		]);
		for (const l of LESSONS) expect(l.sections).not.toContain('warmup');
		expect(by('h1-01')).not.toHaveProperty('testOut');
	});
});

describe('firstLessonId', () => {
	it('firstLessonId(LESSONS) is h1-01', () => {
		// Arrange / Act
		const id = firstLessonId(LESSONS);

		// Assert
		expect(id).toBe('h1-01');
	});

	it('a list with no n=1 lesson falls back to the first id', () => {
		// Arrange
		const lessons = [{ ...by('h0-00') }, { ...by('h1-02') }];

		// Act
		const id = firstLessonId(lessons);

		// Assert
		expect(id).toBe('h0-00');
	});
});
