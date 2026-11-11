import { describe, expect, it } from 'vitest';
import { buildCurriculum } from './build';
import { CURRICULUM, LESSONS } from './index';

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
			['h2-01', 2],
			['h3-01', 3],
			['h4-01', 4],
			['h5-01', 5]
		]);
		expect(LESSONS.map((l) => l.words.length)).toEqual([0, 10, 12, 13, 15, 15]);
		expect(LESSONS.reduce((n, l) => n + l.words.length, 0)).toBe(65);
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
