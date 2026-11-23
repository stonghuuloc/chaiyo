import { describe, expect, it } from 'vitest';
import { buildCurriculum, buildLevels } from './build';
import { CURRICULUM, LESSONS, LEVELS, firstLessonId } from './index';
import { numberOf, outlineNumbers } from './numbers';

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
			['h1-06', 6],
			['h1-07', 7],
			['h2-01', 41],
			['h3-01', 68],
			['h4-01', 94],
			['h5-01', 116]
		]);
		expect(LESSONS.map((l) => l.words.length)).toEqual([0, 10, 9, 10, 8, 14, 8, 8, 12, 13, 15, 15]);
		expect(LESSONS.reduce((n, l) => n + l.words.length, 0)).toBe(122);
	});

	it('Given_TwoLevels_When_OutlineNumbers_Then_SecondStartsAfterFirstCount', () => {
		const lesson = (id: string) => ({ id, title: id });
		const nums = outlineNumbers([
			{ level: 1, words: 0, topics: [{ title: 'a', lessons: [lesson('a1'), lesson('a2')] }] },
			{
				level: 2,
				words: 0,
				topics: [
					{ title: 'b', lessons: [lesson('b1')] },
					{ title: 'c', lessons: [lesson('c1'), lesson('c2')] }
				]
			}
		]);
		expect([...nums]).toEqual([
			['a1', 1],
			['a2', 2],
			['b1', 3],
			['c1', 4],
			['c2', 5]
		]);
	});

	it('Given_LessonNotInOutline_When_Number_Then_ThrowsWithId', () => {
		expect(() => numberOf(new Map([['a1', 1]]), 'h9-99')).toThrow(
			'curriculum: h9-99 is in no level outline'
		);
		expect(numberOf(new Map([['a1', 1]]), 'a1')).toBe(1);
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

describe('levels', () => {
	it('Given_Content_When_BuildLevels_Then_MatchesLevelsJson', () => {
		// Arrange / Act
		const built = buildLevels('content');

		// Assert
		expect(built).toEqual(LEVELS);
	});

	it('Given_Hsk1_When_BuildLevels_Then_40LessonsIn9TopicsAnd300Words', () => {
		// Arrange / Act
		const hsk1 = buildLevels('content').find((l) => l.level === 1)!;

		// Assert
		expect(hsk1.words).toBe(300);
		expect(hsk1.topics).toHaveLength(9);
		expect(hsk1.topics.flatMap((t) => t.lessons)).toHaveLength(40);
		expect(hsk1.topics[0]).toEqual({
			title: 'Chào hỏi',
			lessons: [
				{ id: 'h1-01', title: 'Xin chào', titleHanzi: '你好' },
				{ id: 'h1-02', title: 'Hỏi tên', titleHanzi: '名字' }
			]
		});
	});

	it('Given_Content_When_BuildLevels_Then_FiveLevelsCounts40_27_26_22_21', () => {
		// Arrange / Act
		const levels = buildLevels('content');

		// Assert
		expect(levels.map((l) => l.level)).toEqual([1, 2, 3, 4, 5]);
		expect(levels.map((l) => l.topics.flatMap((t) => t.lessons).length)).toEqual([
			40, 27, 26, 22, 21
		]);
		expect(levels.map((l) => l.words)).toEqual([300, 500, 1000, 1200, 1300]);
		for (const l of levels.slice(1))
			expect(l.topics.flatMap((t) => t.lessons).map((x) => x.id)).toEqual(
				Array.from(
					{ length: l.topics.flatMap((t) => t.lessons).length },
					(_, i) => `h${l.level}-${String(i + 1).padStart(2, '0')}`
				)
			);
	});

	it('Given_BuiltFirstLessons_When_BuildLevels_Then_TitlesMatchLessons', () => {
		// Arrange
		const levels = buildLevels('content').filter((l) => l.level > 1);

		// Act
		const firsts = levels.map((l) => l.topics[0].lessons[0]);

		// Assert
		expect(firsts).toEqual(
			['h2-01', 'h3-01', 'h4-01', 'h5-01'].map((id) => ({
				id,
				title: by(id).title,
				titleHanzi: by(id).titleHanzi
			}))
		);
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
