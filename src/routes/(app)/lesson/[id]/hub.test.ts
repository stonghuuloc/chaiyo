import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCatalog, type LessonContent } from '#lib/catalog/index.js';
import { buildBundle } from '#lib/content/import/bundle.js';
import { importContent } from '#lib/content/import/import.js';
import { scopeFor, PRODUCTION_ROOTS } from '#lib/content/import/scope.js';
import { createMemorySink } from '#lib/content/import/sink.js';
import { fixtureSource } from '#lib/catalog/fixtures/source.js';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { gateOpen, hubView } from './hub';

const lesson = await createCatalog(await fixtureSource()).lesson('h1-01');
const sections = CURRICULUM.lessons.find((l) => l.id === 'h1-01')!.sections;
const wordIds = lesson.words.map((w) => w.id);

const fresh = (): State => initialState({ curriculum: CURRICULUM });

const withWordsRun = (answered: string[]): State => {
	const s = fresh();
	s.runs.r1 = {
		step: { kind: 'section', lesson: 'h1-01', section: 'words', run: 'r1', of: 11 },
		answers: Object.fromEntries(answered.map((id) => [id, true]))
	};
	return s;
};

const withDone = (done: string[]): State => {
	const s = fresh();
	s.lessons['h1-01'] = { unlocked: true, passed: false, done };
	return s;
};

describe('hubView', () => {
	it('Given_FreshLearner_When_View_Then_HeaderZeroOfFiveAllTodoStartWords', () => {
		// Arrange
		const state = fresh();

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.kicker).toBe('HSK1 · Chào hỏi · Bài 1');
		expect(`${v.title} ${v.hanzi}`).toBe('Xin chào 你好');
		expect(lesson.lesson.sections).toHaveProperty('grammar.ids', ['h1-g01']);
		expect(v.meta).toBe('10 từ · 1 điểm ngữ pháp · khoảng 70 phút');
		expect(v.progress).toBe('0/5 phần');
		expect(v.rows.map((r) => [r.id, r.name, r.look, r.sub])).toEqual([
			['words', 'Từ mới', 'todo', '10 từ'],
			['grammar', 'Ngữ pháp', 'todo', 'Chào hỏi: A + 好'],
			['dialogue', 'Hội thoại', 'todo', '2 đoạn · 7 câu'],
			['listenSpeak', 'Nghe & nói', 'todo', '1 bài · cần micro'],
			['writing', 'Luyện viết', 'todo', 'Viết 你 好 们']
		]);
		expect(v.cta).toEqual({ section: 'words', label: 'Bắt đầu: Từ mới' });
	});

	it('Given_OpenWordsRunFourAnswered_When_View_Then_WordsNowResumeAtFifthWord', () => {
		// Arrange
		const state = withWordsRun([...wordIds.slice(0, 4), 'mini-check-1']);

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		const words = v.rows[0];
		expect(words.look).toBe('now');
		expect(words.pct).toBe(40);
		expect(words.sub).toBe(`4/10 từ · tiếp ở ${lesson.words[4].hanzi}`);
		expect(lesson.words[4].hanzi).toBe('你好');
		expect(v.cta).toEqual({ section: 'words', label: 'Tiếp tục: Từ mới' });
	});

	it('Given_AllWordsAnsweredChecksPending_When_View_Then_WordsNowChecksLeftResume', () => {
		// Arrange
		const state = withWordsRun([...wordIds, 'chk-1']);
		state.runs.r1.step = { kind: 'section', lesson: 'h1-01', section: 'words', run: 'r1', of: 13 };

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.rows[0]).toMatchObject({
			look: 'now',
			pct: 100,
			sub: '10/10 từ · còn kiểm tra nhanh'
		});
		expect(v.cta).toEqual({ section: 'words', label: 'Tiếp tục: Từ mới' });
	});

	it('Given_TwoOpenWordsRuns_When_View_Then_RunWithMostAnswersWins', () => {
		// Arrange
		const state = withWordsRun(wordIds.slice(0, 2));
		state.runs.r0 = {
			step: { kind: 'section', lesson: 'h1-01', section: 'words', run: 'r0', of: 11 },
			answers: Object.fromEntries(wordIds.slice(0, 6).map((id) => [id, true]))
		};
		state.runs.r9 = {
			step: { kind: 'section', lesson: 'h1-01', section: 'words', run: 'r9', of: 11 },
			answers: { [wordIds[0]]: true }
		};

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.rows[0]).toMatchObject({ look: 'now', pct: 60 });
	});

	it('Given_ClosedWordsRun_When_View_Then_WordsTodo', () => {
		// Arrange
		const state = withWordsRun(wordIds.slice(0, 4));
		state.runs.r1.closed = true;

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.rows[0].look).toBe('todo');
		expect(v.cta?.label).toBe('Bắt đầu: Từ mới');
	});

	it('Given_GrammarDone_When_View_Then_GrammarFullOneOfFive', () => {
		// Arrange
		const state = withDone(['grammar']);

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.rows[1]).toMatchObject({ id: 'grammar', look: 'done', pct: 100 });
		expect(v.progress).toBe('1/5 phần');
		expect(v.done).toBe(1);
	});

	it('Given_WordsDone_When_View_Then_StartNextNotDoneSection', () => {
		// Arrange
		const state = withDone(['words']);

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.cta).toEqual({ section: 'grammar', label: 'Bắt đầu: Ngữ pháp' });
	});

	it('Given_AllFiveDone_When_View_Then_NoCta', () => {
		// Arrange
		const state = withDone([...sections]);

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.progress).toBe('5/5 phần');
		expect(v.cta).toBeNull();
	});

	it('Given_Primer_When_View_Then_NoKickerNoMeta', async () => {
		// Arrange
		const primer = await createCatalog(await fixtureSource()).lesson('h0-00');
		const ids = CURRICULUM.lessons.find((l) => l.id === 'h0-00')!.sections;

		// Act
		const v = hubView(primer, ids, fresh());

		// Assert
		expect(v.kicker).toBe('');
		expect(v.meta).toBe('');
		expect(v.rows).toHaveLength(5);
		expect(v.rows[0]).toMatchObject({ id: 'tones', look: 'todo', sub: '' });
	});

	it('Given_OpenGrammarRunOtherLesson_When_View_Then_Ignored', () => {
		// Arrange
		const state = fresh();
		state.runs.r2 = {
			step: { kind: 'section', lesson: 'h1-02', section: 'grammar', run: 'r2', of: 4 },
			answers: { a: true }
		};

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.rows[1].look).toBe('todo');
	});

	it('Given_OpenGrammarRunHalfway_When_View_Then_GrammarNowPctFromRun', () => {
		// Arrange
		const state = fresh();
		state.runs.r2 = {
			step: { kind: 'section', lesson: 'h1-01', section: 'grammar', run: 'r2', of: 4 },
			answers: { a: true, b: false }
		};

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.rows[1]).toMatchObject({ look: 'now', pct: 50, sub: 'Chào hỏi: A + 好' });
		expect(v.cta).toEqual({ section: 'grammar', label: 'Tiếp tục: Ngữ pháp' });
	});

	it('Given_RealBai1Content_When_View_Then_MetaTwoGrammarAndSixListenItems', async () => {
		// Arrange
		const prev = process.env.CHAIYO_VAULT;
		process.env.CHAIYO_VAULT = join(tmpdir(), 'no-such-vault');
		const sink = createMemorySink();
		const r = await importContent('content', sink, { only: scopeFor('content', PRODUCTION_ROOTS) });
		if (prev === undefined) delete process.env.CHAIYO_VAULT;
		else process.env.CHAIYO_VAULT = prev;
		if (!('sha' in r)) throw new Error(JSON.stringify(r.errors, null, 2));
		if (!sink.content) throw new Error('import wrote no content');
		const b = buildBundle(sink.content, 'h1-01');
		const real: LessonContent = await createCatalog({
			current: async () => b.sha,
			bundle: async () => b
		}).lesson('h1-01');

		// Act
		const v = hubView(real, sections, fresh());

		// Assert
		expect(v.meta).toBe('10 từ · 2 điểm ngữ pháp · khoảng 70 phút');
		expect(v.rows.find((row) => row.id === 'listenSpeak')!.sub).toBe('6 bài · cần micro');
	});
});

describe('hubView gate', () => {
	it('Given_FreshLearner_When_View_Then_GateLockedWithCopy', () => {
		// Arrange
		const state = fresh();

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.gate).toEqual({ locked: true, sub: 'Mở khi xong 5 phần · đạt từ 80%' });
		expect(v.progress).toBe('0/5 phần');
	});

	it('Given_FourOfFiveDone_When_View_Then_GateLocked', () => {
		// Arrange
		const state = withDone(sections.slice(0, 4));

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.gate.locked).toBe(true);
		expect(v.gate.sub).toBe('Mở khi xong 5 phần · đạt từ 80%');
	});

	it('Given_PlacedHsk1NoDone_When_View_Then_GateLocked', () => {
		// Arrange
		const state = fresh();
		state.lessons['h1-01'] = { unlocked: true, passed: true, done: [] };

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.gate.locked).toBe(true);
	});

	it('Given_AllFiveDone_When_View_Then_GateOpen', () => {
		// Arrange
		const state = withDone([...sections]);

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.gate).toEqual({ locked: false, sub: '' });
	});

	it('Given_PrimerTestOut_When_GateOpen_Then_True', () => {
		// Arrange
		const state = fresh();

		// Act
		const open = gateOpen(state, 'h0-00');

		// Assert
		expect(open).toBe(true);
	});

	it('Given_UnknownLesson_When_GateOpen_Then_False', () => {
		// Arrange
		const state = fresh();

		// Act
		const open = gateOpen(state, 'h9-99');

		// Assert
		expect(open).toBe(false);
	});
});

describe('hubView words', () => {
	const reached = (s: State) => hubView(lesson, sections, s).words.map((w) => w.reached);

	it('Given_FreshLearner_When_View_Then_TenWordsNoneReached', () => {
		// Arrange
		const state = fresh();

		// Act
		const v = hubView(lesson, sections, state);

		// Assert
		expect(v.words.map((w) => w.id)).toEqual(wordIds);
		expect(v.words).toHaveLength(10);
		expect(v.words[0]).toEqual({ id: wordIds[0], hanzi: '你', pinyin: 'nǐ', reached: false });
		expect(v.words.some((w) => w.reached)).toBe(false);
	});

	it('Given_OpenWordsRunFourAnswered_When_View_Then_FirstFourReached', () => {
		// Arrange
		const state = withWordsRun(wordIds.slice(0, 4));

		// Act
		const r = reached(state);

		// Assert
		expect(r).toEqual([...Array(4).fill(true), ...Array(6).fill(false)]);
	});

	it('Given_WordsDone_When_View_Then_AllTenReached', () => {
		// Arrange
		const state = withDone(['words']);

		// Act
		const r = reached(state);

		// Assert
		expect(r).toEqual(Array(10).fill(true));
	});

	it('Given_PlacedHsk1NoDone_When_View_Then_NoWordsReached', () => {
		// Arrange
		const state = fresh();
		state.lessons['h1-01'] = { unlocked: true, passed: true, done: [] };

		// Act
		const r = reached(state);

		// Assert
		expect(r).toEqual(Array(10).fill(false));
	});

	it('Given_ClosedWordsRunNotDone_When_View_Then_NoWordsReached', () => {
		// Arrange
		const state = withWordsRun(wordIds.slice(0, 4));
		state.runs.r1.closed = true;

		// Act
		const r = reached(state);

		// Assert
		expect(r).toEqual(Array(10).fill(false));
	});

	it('Given_Primer_When_View_Then_NoWordsSection', async () => {
		// Arrange
		const primer = await createCatalog(await fixtureSource()).lesson('h0-00');
		const ids = CURRICULUM.lessons.find((l) => l.id === 'h0-00')!.sections;

		// Act
		const v = hubView(primer, ids, fresh());

		// Assert
		expect(v.words).toEqual([]);
	});
});
