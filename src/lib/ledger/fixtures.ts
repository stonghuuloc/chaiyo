import type { Attempt, Skill } from '#lib/study/index.js';

export const T = Date.parse('2026-11-09T02:00:00Z');
const H = 3_600_000;
const D = 24 * H;

export const att = (
	id: string,
	at: number,
	word: string,
	skill: Skill,
	correct: boolean
): Attempt => ({
	id,
	at: new Date(at).toISOString(),
	questionId: `card:${word}:${skill}`,
	contentSha: 'sha1',
	correct,
	ms: 1000,
	card: { word, skill }
});

export const server = [
	att('s1', T - 4 * D, '你', 'the', true),
	att('s2', T - 3 * D, '好', 'the', true),
	att('s3', T - 2 * D, '你', 'the', true),
	att('s4', T - 1 * D, '您', 'the', false),
	att('s5', T - 12 * H, '好', 'nghe', true)
];

export const outbox = [
	att('o1', T - 3.5 * D, '你', 'the', false),
	att('o2', T - 6 * H, '你好', 'the', true),
	att('o3', T - 1 * H, '谢谢', 'nghe', true)
];
