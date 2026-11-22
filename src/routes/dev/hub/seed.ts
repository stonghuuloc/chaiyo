import type { Attempt } from '#lib/study/index.js';

export const seedWords = (words: string[], now: Date, uuid: () => string): Attempt[] => {
	const run = uuid();
	return words.slice(0, 4).map((word, i) => ({
		id: uuid(),
		at: new Date(now.getTime() + i).toISOString(),
		questionId: word,
		contentSha: 'dev',
		correct: true,
		ms: 1000,
		step: { kind: 'section', lesson: 'h1-01', section: 'words', run, of: words.length }
	}));
};

export const seedSections = (
	lesson: string,
	sections: string[],
	now: Date,
	uuid: () => string
): Attempt[] =>
	sections.map((section, i) => ({
		id: uuid(),
		at: new Date(now.getTime() + i).toISOString(),
		questionId: `seed-${section}`,
		contentSha: 'dev',
		correct: true,
		ms: 1000,
		step: { kind: 'section', lesson, section, run: uuid(), of: 1 }
	}));
