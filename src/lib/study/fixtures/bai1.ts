import { apply, initialState, type Skill, type State } from '#lib/study/index.js';

export const T = new Date('2026-11-09T02:00:00Z');
const DAY = 86_400_000;

const rows: { at: number; skill: Skill; words: string[] }[] = [
	{ at: -6 * DAY, skill: 'viet', words: ['你', '好'] },
	{ at: -5 * DAY, skill: 'the', words: ['你', '好', '您', '对不起'] },
	{ at: -5 * DAY, skill: 'nghe', words: ['谢谢', '再见', '没关系'] },
	{ at: -2 * DAY, skill: 'the', words: ['你们', '谢谢', '再见', '没关系', '不客气'] },
	{ at: -2 * DAY, skill: 'nghe', words: ['你好', '对不起', '不客气'] },
	{ at: -2 * DAY, skill: 'viet', words: ['你们'] },
	{ at: -1 * DAY, skill: 'the', words: ['你好'] },
	{ at: -1 * DAY + 10 * 60_000, skill: 'the', words: ['你好'] }
];

export function bai1(): State {
	let state = initialState();
	for (const { at, skill, words } of rows) {
		for (const word of words) {
			const when = new Date(T.getTime() + at);
			state = apply(
				state,
				{
					id: `${word}:${skill}:${at}`,
					at: when.toISOString(),
					questionId: `q:${word}:${skill}`,
					contentSha: 'fixture',
					correct: true,
					ms: 1000,
					card: { word, skill }
				},
				when
			).state;
		}
	}
	return state;
}
