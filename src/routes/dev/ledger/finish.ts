import { localDate, type Attempt, type State } from '#lib/study/index.js';
import { DEV_CURRICULUM } from './curriculum';

export const finish = (now: Date, uuid: () => string): Attempt[] => {
	const run = uuid();
	return DEV_CURRICULUM.lessons[1].words.map((word, i) => ({
		id: uuid(),
		at: new Date(now.getTime() + i).toISOString(),
		questionId: `q-h1-01-words-${word}`,
		contentSha: 'dev',
		card: { word, skill: 'the' },
		correct: true,
		ms: 1000,
		step: { kind: 'section', lesson: 'h1-01', section: 'words', run, of: 10 }
	}));
};

export function lines(state: State, now: Date, pending: number) {
	const today = localDate(now, state.tz);
	return {
		tuMoi: state.lessons['h1-01'].done.includes('words') ? 'Từ mới: xong' : 'Từ mới: chưa xong',
		streak:
			state.streak.last === today
				? `Chuỗi: hôm nay đã tính (${state.streak.count})`
				: 'Chuỗi: hôm nay chưa tính',
		pending: `Chưa đồng bộ: ${pending}`
	};
}
