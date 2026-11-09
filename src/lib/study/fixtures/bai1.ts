import {
	apply,
	initialState,
	type Attempt,
	type Skill,
	type State,
	type WordSaved
} from '#lib/study/index.js';

export const T = new Date('2026-11-09T02:00:00Z');
const DAY = 86_400_000;

type Row = { at: number; skill: Skill; words: string[] } | { at: number; saved: string };

const rows: Row[] = [
	{ at: -6 * DAY, skill: 'viet', words: ['你', '好'] },
	{ at: -5 * DAY, skill: 'the', words: ['你', '好', '您', '对不起'] },
	{ at: -5 * DAY, skill: 'nghe', words: ['谢谢', '再见', '没关系'] },
	{ at: -3 * DAY, saved: '熊猫' },
	{ at: -2 * DAY, skill: 'the', words: ['熊猫', '你们', '谢谢', '再见', '没关系', '不客气'] },
	{ at: -2 * DAY, skill: 'nghe', words: ['你好', '对不起', '不客气'] },
	{ at: -2 * DAY, skill: 'viet', words: ['你们'] },
	{ at: -1 * DAY, saved: '奶茶' },
	{ at: -1 * DAY, skill: 'the', words: ['你好'] },
	{ at: -1 * DAY + 10 * 60_000, skill: 'the', words: ['你好'] }
];

export function bai1(): State {
	let state = initialState();
	for (const row of rows) {
		const when = new Date(T.getTime() + row.at);
		if ('saved' in row) {
			const input: WordSaved = { kind: 'saved', word: row.saved, at: when.toISOString() };
			state = apply(state, input, when).state;
			continue;
		}
		for (const word of row.words) {
			const input: Attempt = {
				id: `${word}:${row.skill}:${row.at}`,
				at: when.toISOString(),
				questionId: `q:${word}:${row.skill}`,
				contentSha: 'fixture',
				correct: true,
				ms: 1000,
				card: { word, skill: row.skill }
			};
			state = apply(state, input, when).state;
		}
	}
	return state;
}
