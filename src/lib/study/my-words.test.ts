import { describe, expect, it } from 'vitest';
import {
	apply,
	initialState,
	myWords,
	type Attempt,
	type Card,
	type Skill,
	type State,
	type WordMeta
} from '#lib/study/index.js';

const NOW = new Date('2026-11-09T02:00:00Z');
const meta = (h: string): WordMeta | undefined => ({
	pinyin: `p-${h}`,
	hanViet: `hv-${h}`,
	nghia: `n-${h}`
});
const card = (fsrs: Record<string, unknown>, due = '2026-12-01T00:00:00Z'): Card => ({
	due,
	first: '2026-11-01T00:00:00Z',
	fsrs
});
const withLexicon = (lexicon: State['lexicon']): State => ({ ...initialState(), lexicon });
const barsOf = (stability: number) =>
	myWords(withLexicon({ 词: { saved: false, cards: { the: card({ stability }) } } }), meta, NOW)[0]
		.bars;

describe('myWords rows', () => {
	it('a saved, a carded and a placed word give 3 rows with sources self, lesson, lesson', () => {
		// Arrange
		const state = withLexicon({
			熊猫: { saved: true, cards: {} },
			学生: { saved: false, cards: { the: card({ stability: 5 }) } },
			你好: { saved: false, cards: {} }
		});

		// Act
		const rows = myWords(state, meta, NOW);

		// Assert
		expect(rows.map((r) => [r.hanzi, r.source])).toEqual([
			['熊猫', 'self'],
			['你好', 'lesson'],
			['学生', 'lesson']
		]);
		expect(rows[0]).toMatchObject({ pinyin: 'p-熊猫', hanViet: 'hv-熊猫', nghia: 'n-熊猫' });
	});

	it('stability 0.11, 3.92, 6.99, 7, 10.94, 20.99, 21, 30.59 give 1,1,1,2,2,2,3,3', () => {
		// Arrange
		const stabilities = [0.11, 3.92, 6.99, 7, 10.94, 20.99, 21, 30.59];

		// Act
		const bars = stabilities.map(barsOf);

		// Assert
		expect(bars).toEqual([1, 1, 1, 2, 2, 2, 3, 3]);
	});

	it('a nghe-only word has 0 bars', () => {
		// Arrange
		const state = withLexicon({ 词: { saved: false, cards: { nghe: card({ stability: 30 }) } } });

		// Act
		const [row] = myWords(state, meta, NOW);

		// Assert
		expect(row.bars).toBe(0);
	});

	it('a the card with fsrs {} has 1 bar', () => {
		// Arrange
		const state = withLexicon({ 词: { saved: false, cards: { the: card({}) } } });

		// Act
		const [row] = myWords(state, meta, NOW);

		// Assert
		expect(row.bars).toBe(1);
	});

	it('real review() replay: 1, 2, 3 Good give 1, 2, 3 bars', () => {
		// Arrange
		let state = initialState();
		const good = (n: number): Attempt => ({
			id: `a${n}`,
			at: NOW.toISOString(),
			questionId: 'q',
			contentSha: 'x',
			correct: true,
			ms: 1,
			card: { word: '学生', skill: 'the' satisfies Skill }
		});

		// Act
		const bars: number[] = [];
		for (let n = 0; n < 3; n++) {
			const due = state.lexicon['学生']?.cards.the?.due;
			const at = due ? new Date(due) : NOW;
			state = apply(state, good(n), at).state;
			bars.push(myWords(state, meta, NOW)[0].bars);
		}

		// Assert
		expect(bars).toEqual([1, 2, 3]);
	});

	it('missing meta gives blank strings and still a row', () => {
		// Arrange
		const state = withLexicon({ 词: { saved: false, cards: {} } });

		// Act
		const rows = myWords(state, () => undefined, NOW);

		// Assert
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ hanzi: '词', pinyin: '', hanViet: '', nghia: '' });
	});
});

describe('myWords due and order', () => {
	const tz = 'Asia/Ho_Chi_Minh';
	const due = (iso: string, skill: Skill = 'the', stability = 1) => ({
		[skill]: card({ stability }, iso)
	});

	it('due 2026-11-09T18:00:00Z is not due on 11-09 and is due on 11-10 (Asia/Ho_Chi_Minh)', () => {
		// Arrange
		const state = {
			...withLexicon({ 词: { saved: false, cards: due('2026-11-09T18:00:00Z') } }),
			tz
		};

		// Act
		const before = myWords(state, meta, new Date('2026-11-09T16:00:00Z'));
		const after = myWords(state, meta, new Date('2026-11-09T17:00:00Z'));

		// Assert
		expect(before[0].dueNote).toBeNull();
		expect(after[0].dueNote).toBe('due');
	});

	it('a card 5 days overdue is due', () => {
		// Arrange
		const state = withLexicon({ 词: { saved: false, cards: due('2026-11-04T02:00:00Z') } });

		// Act
		const [row] = myWords(state, meta, NOW);

		// Assert
		expect(row.dueNote).toBe('due');
	});

	it('a due nghe card alone makes the word due', () => {
		// Arrange
		const state = withLexicon({
			词: {
				saved: false,
				cards: { ...due('2026-12-30T00:00:00Z'), ...due('2026-11-08T00:00:00Z', 'nghe') }
			}
		});

		// Act
		const [row] = myWords(state, meta, NOW);

		// Assert
		expect(row.dueNote).toBe('due');
	});

	it('due words sort first, a never-practised word sits between, 你好 last', () => {
		// Arrange
		const state = withLexicon({
			你好: { saved: false, cards: due('2026-12-30T00:00:00Z', 'the', 30) },
			新: { saved: false, cards: {} },
			学生: { saved: false, cards: due('2026-11-09T01:00:00Z', 'the', 1) }
		});

		// Act
		const rows = myWords(state, meta, NOW);

		// Assert
		expect(rows.map((r) => r.hanzi)).toEqual(['学生', '新', '你好']);
	});

	it('two due words order by earliest due', () => {
		// Arrange
		const state = withLexicon({
			晚: { saved: false, cards: due('2026-11-09T01:00:00Z') },
			早: { saved: false, cards: due('2026-11-03T01:00:00Z') },
			中: {
				saved: false,
				cards: { ...due('2026-12-01T00:00:00Z'), ...due('2026-11-05T00:00:00Z', 'viet') }
			}
		});

		// Act
		const rows = myWords(state, meta, NOW);

		// Assert
		expect(rows.map((r) => r.hanzi)).toEqual(['早', '中', '晚']);
	});

	it('due words with the same due time keep lexicon key order', () => {
		// Arrange
		const at = '2026-11-08T00:00:00Z';
		const state = withLexicon({
			乙: { saved: false, cards: due(at) },
			甲: { saved: false, cards: due(at) }
		});

		// Act
		const rows = myWords(state, meta, NOW);

		// Assert
		expect(rows.map((r) => r.hanzi)).toEqual(['乙', '甲']);
	});

	it('not-due words order by bars ascending and ties keep lexicon key order', () => {
		// Arrange
		const far = '2026-12-30T00:00:00Z';
		const state = withLexicon({
			乙: { saved: false, cards: due(far, 'the', 30) },
			甲: { saved: false, cards: due(far, 'the', 10) },
			丙: { saved: false, cards: due(far, 'the', 10) },
			丁: { saved: false, cards: due(far, 'the', 1) }
		});

		// Act
		const rows = myWords(state, meta, NOW);

		// Assert
		expect(rows.map((r) => r.hanzi)).toEqual(['丁', '甲', '丙', '乙']);
	});

	it('dueNote is due, never, null', () => {
		// Arrange
		const state = withLexicon({
			a: { saved: false, cards: due('2026-11-08T00:00:00Z') },
			b: { saved: false, cards: {} },
			c: { saved: false, cards: due('2026-12-30T00:00:00Z') }
		});

		// Act
		const notes = myWords(state, meta, NOW).map((r) => r.dueNote);

		// Assert
		expect(notes).toEqual(['due', 'never', null]);
	});
});
