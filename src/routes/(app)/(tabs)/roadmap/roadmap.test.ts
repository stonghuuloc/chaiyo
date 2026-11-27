import { CURRICULUM, LESSONS } from '#lib/curriculum/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { examToast, jumpTarget, lockToast, roadmapLevel } from './roadmap';

const lastWritten = Math.max(...LESSONS.filter((l) => l.level === 1).map((l) => l.n));

const reference = (): State => {
	const state = initialState({ curriculum: CURRICULUM });
	state.lessons['h0-00'] = { unlocked: true, passed: true, done: [], best: 90 };
	state.lessons['h1-01'].unlocked = true;
	return state;
};

const placed = (): State => {
	const state = initialState({ curriculum: CURRICULUM });
	for (const id of ['h0-00', 'h1-01', 'h1-02', 'h1-03', 'h1-04', 'h1-05'])
		state.lessons[id] = { unlocked: true, passed: true, done: [], best: 85 };
	state.lessons['h2-01'].unlocked = true;
	return state;
};

const row = (view: ReturnType<typeof roadmapLevel>, id: string) =>
	view.groups.flatMap((g) => g.rows).find((r) => r.id === id)!;

describe('roadmapLevel', () => {
	it('Given_ReferenceLearner_When_Level1_Then_Header0of40And300Words', () => {
		// Arrange / Act
		const view = roadmapLevel(reference(), 1);

		// Assert
		expect(view.empty).toBe(false);
		expect(view.header).toEqual({ passed: 0, total: 40, words: 300 });
	});

	it('Given_ReferenceLearner_When_Level1_Then_StripLocks2to5', () => {
		// Arrange / Act
		const view = roadmapLevel(reference(), 1);

		// Assert
		expect(view.strip.map((c) => c.level)).toEqual([1, 2, 3, 4, 5]);
		expect(view.strip.map((c) => c.locked)).toEqual([false, true, true, true, true]);
		expect(view.strip.map((c) => c.current)).toEqual([true, false, false, false, false]);
	});

	it('Given_ReferenceLearner_When_Level1_Then_CardBai1Part1Next2AndTopic1Open', () => {
		// Arrange / Act
		const view = roadmapLevel(reference(), 1);

		// Assert
		expect(view.card).toMatchObject({
			id: 'h1-01',
			n: 1,
			title: 'Xin chào',
			hanzi: '你好',
			part: 1,
			next: 2
		});
		expect(view.groups.map((g) => [g.kind, g.title, g.passed, g.total, g.open])).toEqual([
			['primer', '', 1, 1, false],
			['topic', 'Chào hỏi', 0, 2, true],
			['topic', 'Gia đình', 0, 5, false],
			...view.groups.slice(3).map((g) => ['topic', g.title, 0, g.total, false])
		]);
		expect(view.groups.filter((g) => g.kind === 'topic').map((g) => g.i)).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9
		]);
		expect(row(view, 'h0-00')).toMatchObject({ n: 0, status: 'done', best: 90 });
		expect(row(view, 'h1-01')).toMatchObject({ status: 'now', part: 1 });
		expect(row(view, 'h1-01')).not.toHaveProperty('after');
		expect(row(view, 'h1-02')).toMatchObject({ n: 2, status: 'locked', after: 1 });
	});

	it('Given_TwoSectionsDone_When_Level1_Then_Part3', () => {
		// Arrange
		const state = reference();
		state.lessons['h1-01'].done = ['words', 'grammar'];

		// Act
		const view = roadmapLevel(state, 1);

		// Assert
		expect(view.card?.part).toBe(3);
		expect(row(view, 'h1-01').part).toBe(3);
	});

	it('Given_AllSectionsDone_When_Level1_Then_PartCappedAtSectionCount', () => {
		// Arrange
		const state = reference();
		state.lessons['h1-01'].done = ['words', 'grammar', 'dialogue', 'listenSpeak', 'writing'];

		// Act
		const view = roadmapLevel(state, 1);

		// Assert
		expect(view.card?.part).toBe(5);
	});

	it('Given_FreshState_When_Level1_Then_CardBai0AndKhoiDauOpen', () => {
		// Arrange / Act
		const view = roadmapLevel(initialState({ curriculum: CURRICULUM }), 1);

		// Assert
		expect(view.card).toMatchObject({ id: 'h0-00', n: 0, next: 1, part: 1 });
		expect(view.groups.map((g) => g.open)).toEqual([true, ...Array(9).fill(false)]);
		expect(row(view, 'h1-01')).toMatchObject({ status: 'locked', after: 0 });
	});

	it('Given_AllBuiltHsk1Passed_When_Level1_Then_NoCardFirstTopicOpen', () => {
		// Arrange
		const state = initialState({ curriculum: CURRICULUM });
		for (const id of ['h0-00', 'h1-01', 'h1-02', 'h1-03', 'h1-04', 'h1-05'])
			state.lessons[id] = { unlocked: true, passed: true, done: [], best: 85 };

		// Act
		const view = roadmapLevel(state, 1);

		// Assert
		expect(view.card).toBeUndefined();
		expect(view.header).toEqual({ passed: 5, total: 40, words: 300 });
		expect(view.groups.map((g) => g.open)).toEqual([false, true, ...Array(8).fill(false)]);
	});

	it('Given_CurrentLessonInOtherLevel_When_Level1_Then_NoCard', () => {
		// Arrange
		const state = initialState({ curriculum: CURRICULUM });
		for (const id of ['h0-00', 'h1-01', 'h1-02', 'h1-03', 'h1-04', 'h1-05'])
			state.lessons[id] = { unlocked: true, passed: true, done: [] };
		state.lessons['h2-01'].unlocked = true;

		// Act
		const view = roadmapLevel(state, 1);

		// Assert
		expect(view.card).toBeUndefined();
		expect(view.strip.map((c) => c.locked)).toEqual([false, false, true, true, true]);
	});

	it('Given_PassedWithoutBest_When_Level1_Then_BestUndefined', () => {
		// Arrange
		const state = reference();
		delete state.lessons['h0-00'].best;

		// Act
		const view = roadmapLevel(state, 1);

		// Assert
		expect(row(view, 'h0-00').status).toBe('done');
		expect(row(view, 'h0-00').best).toBeUndefined();
	});

	it('Given_ReferenceLearner_When_Level1_Then_H102LockAfterAndH106LockDraft', () => {
		// Arrange / Act
		const view = roadmapLevel(reference(), 1);

		// Assert
		expect(row(view, 'h1-02')).toMatchObject({ n: 2, status: 'locked', after: 1, lock: 'after' });
		expect(row(view, 'h1-06')).toMatchObject({ n: 6, status: 'locked', lock: 'after', after: 5 });
		const drafts = view.groups
			.flatMap((g) => g.rows)
			.filter((r) => r.id.startsWith('h1-') && !LESSONS.some((l) => l.id === r.id));
		for (const draft of drafts) {
			expect(draft).toMatchObject({ status: 'locked', lock: 'draft' });
			expect(draft).not.toHaveProperty('after');
		}
		expect(row(view, 'h1-01')).not.toHaveProperty('lock');
		expect(row(view, 'h0-00')).not.toHaveProperty('lock');
	});

	it('Given_ReferenceLearner_When_Level2_Then_LockedLevelView', () => {
		// Arrange / Act
		const view = roadmapLevel(reference(), 2);

		// Assert
		expect(view.empty).toBe(false);
		expect(view.header).toEqual({ passed: 0, total: 27, words: 500 });
		expect(view.card).toBeUndefined();
		expect(view.groups.map((g) => g.open)).toEqual([true, false, false, false, false, false]);
		expect(view.groups[0].title).toBe('Thói quen hằng ngày');
		const rows = view.groups.flatMap((g) => g.rows);
		expect(rows).toHaveLength(27);
		expect(rows.every((r) => r.status === 'locked' && r.lock === 'level')).toBe(true);
		expect(view.strip.map((c) => c.current)).toEqual([false, true, false, false, false]);
		expect(view.strip[0].progress).toBe(0);
	});

	it('Given_TwoHsk1Passed_When_Level1_Then_StripProgress2of40', () => {
		// Arrange
		const state = reference();
		state.lessons['h1-01'] = { unlocked: true, passed: true, done: [] };
		state.lessons['h1-02'] = { unlocked: true, passed: true, done: [] };

		// Act
		const view = roadmapLevel(state, 1);

		// Assert
		expect(view.strip.map((c) => c.progress)).toEqual([2 / 40, 0, 0, 0, 0]);
	});

	it('Given_Level1_When_View_Then_OneLockedExamLast40', () => {
		// Arrange / Act
		const view = roadmapLevel(reference(), 1);

		// Assert
		expect(view.exams).toEqual({
			note: false,
			rows: [{ level: 1, last: lastWritten, status: 'locked' }]
		});
	});

	it('Given_Level3_When_View_Then_VietAndNoiLast26WithNote', () => {
		// Arrange / Act
		const view = roadmapLevel(reference(), 3);

		// Assert
		expect(view.exams).toEqual({
			note: true,
			rows: [
				{ part: 'viet', level: 3, last: 68, status: 'locked' },
				{ part: 'noi', level: 3, last: 68, status: 'locked' }
			]
		});
	});

	it('Given_Level2_When_View_Then_OneExamNoNote', () => {
		// Arrange / Act
		const view = roadmapLevel(reference(), 2);

		// Assert
		expect(view.exams).toEqual({ note: false, rows: [{ level: 2, last: 41, status: 'locked' }] });
	});

	it('Given_AllHsk1OutlinePassed_When_Level1_Then_ExamOpen', () => {
		// Arrange
		const state = reference();
		for (let i = 1; i <= 40; i++)
			state.lessons[`h1-${String(i).padStart(2, '0')}`] = {
				unlocked: true,
				passed: true,
				done: []
			};

		// Act
		const view = roadmapLevel(state, 1);

		// Assert
		expect(view.exams?.rows).toEqual([{ level: 1, last: lastWritten, status: 'open' }]);
	});

	it('Given_Hsk1LastPassedButLevelAbove_When_Level2_Then_ExamLocked', () => {
		// Arrange
		const state = reference();
		state.lessons['h2-27'] = { unlocked: false, passed: true, done: [] };

		// Act
		const view = roadmapLevel(state, 2);

		// Assert
		expect(view.exams?.rows[0].status).toBe('locked');
	});

	it('Given_LockReasons_When_LockToast_Then_ThreeCopies', () => {
		// Arrange
		const one = roadmapLevel(reference(), 1);
		const two = roadmapLevel(reference(), 2);

		// Act
		const copies = [
			lockToast(one, row(one, 'h1-02')),
			lockToast(one, { ...row(one, 'h1-02'), n: 36, lock: 'draft' }),
			lockToast(two, row(two, 'h2-01'))
		];

		// Assert
		expect(copies).toEqual([
			'Qua Bài 1 để mở Bài 2',
			'Bài 36 đang được soạn.',
			'Học xong HSK 1 để mở HSK 2'
		]);
	});

	it('Given_ExamRows_When_ExamToast_Then_LockedAndSoonCopies', () => {
		// Arrange
		const locked = { level: 1, last: lastWritten, status: 'locked' } as const;
		const open = { part: 'noi', level: 3, last: 68, status: 'open' } as const;

		// Act
		const copies = [examToast(locked), examToast(open)];

		// Assert
		expect(copies).toEqual([
			`Qua Bài ${lastWritten} để mở thi thử HSK 1`,
			'Thi thử HSK 3 sắp ra mắt.'
		]);
	});

	it('Given_BuiltLessons_When_Rows_Then_NEqualsLessonsN', () => {
		// Arrange
		const state = reference();

		// Act
		const rows = [1, 2, 3, 4, 5].flatMap((L) =>
			roadmapLevel(state, L).groups.flatMap((g) => g.rows)
		);

		// Assert
		for (const l of LESSONS) expect(rows.find((r) => r.id === l.id)?.n).toBe(l.n);
	});

	it('Given_ReferenceLearner_When_Level2_Then_FirstRowN41', () => {
		// Arrange / Act
		const view = roadmapLevel(reference(), 2);

		// Assert
		expect(view.groups[0].rows[0]).toMatchObject({ id: 'h2-01', n: 41 });
		expect(view.header?.total).toBe(27);
	});

	it('Given_PlacedHsk2_When_Level2_Then_Card41Next42', () => {
		// Arrange / Act
		const view = roadmapLevel(placed(), 2);

		// Assert
		expect(view.card).toMatchObject({ id: 'h2-01', n: 41, next: 42 });
	});

	it('Given_PlacedHsk2_When_Level2_Then_H202DraftN42', () => {
		// Arrange / Act
		const view = roadmapLevel(placed(), 2);

		// Assert
		expect(row(view, 'h2-02')).toMatchObject({ n: 42, status: 'locked', lock: 'draft' });
		expect(lockToast(view, row(view, 'h2-02'))).toBe('Bài 42 đang được soạn.');
	});

	it('Given_ReferenceLearner_When_JumpTarget_Then_Level1H101N1', () => {
		// Arrange / Act
		const target = jumpTarget(reference());

		// Assert
		expect(target).toEqual({ level: 1, id: 'h1-01', n: 1 });
	});

	it('Given_PlacedHsk2_When_JumpTarget_Then_Level2H201N41', () => {
		// Arrange / Act
		const target = jumpTarget(placed());

		// Assert
		expect(target).toEqual({ level: 2, id: 'h2-01', n: 41 });
	});

	it('Given_AllBuiltPassed_When_JumpTarget_Then_Undefined', () => {
		// Arrange
		const state = initialState({ curriculum: CURRICULUM });
		for (const l of LESSONS) state.lessons[l.id] = { unlocked: true, passed: true, done: [] };

		// Act
		const target = jumpTarget(state);

		// Assert
		expect(target).toBeUndefined();
	});
});
