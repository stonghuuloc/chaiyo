import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { trackToast, trackView } from './tracks';

const reference = (): State => {
	const state = initialState({ curriculum: CURRICULUM });
	state.lessons['h0-00'] = { unlocked: true, passed: true, done: [], best: 90 };
	state.lessons['h1-01'].unlocked = true;
	return state;
};

const level3 = (): State => {
	const state = reference();
	for (const id of ['h1-01', 'h1-02', 'h1-03', 'h1-04', 'h1-05', 'h2-01'])
		state.lessons[id] = { unlocked: true, passed: true, done: [] };
	state.lessons['h3-01'].unlocked = true;
	return state;
};

describe('trackView', () => {
	it('Given_ReferenceLearner_When_TrackView_Then_5Locked0Open', () => {
		// Arrange / Act
		const view = trackView(reference());

		// Assert
		expect(view.total).toBe(5);
		expect(view.open).toBe(0);
		expect(view.items.map((t) => [t.title, t.hz, t.icon, t.need, t.lessons.length])).toEqual([
			['Du lịch', '旅游', 'suitcase', 2, 8],
			['Tiếng lóng', '网络用语', 'chat-dots', 2, 8],
			['Tiếng Trung IT', '信息技术', 'code', 3, 10],
			['Tiếng Trung tài chính', '金融', 'wallet', 3, 12],
			['Tiếng Trung thương mại', '商务', 'case', 4, 8]
		]);
		expect(view.items.every((t) => t.locked)).toBe(true);
	});

	it('Given_Level3Learner_When_TrackView_Then_DuLichAndTiengLongOpen', () => {
		// Arrange / Act
		const view = trackView(level3());

		// Assert
		expect(view.open).toBe(2);
		expect(view.items.map((t) => t.locked)).toEqual([false, false, true, true, true]);
	});

	it('Given_LockedAndOpen_When_TrackToast_Then_Copies', () => {
		// Arrange
		const locked = trackView(reference()).items[0];
		const open = trackView(level3()).items[0];

		// Act
		const copies = [trackToast(locked), trackToast(open)];

		// Assert
		expect(copies).toEqual(['Học xong HSK 2 để mở Du lịch', 'Chuyên đề Du lịch sắp ra mắt.']);
	});
});
