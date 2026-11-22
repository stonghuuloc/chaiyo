import { describe, expect, it } from 'vitest';
import { apply, initialState, type Attempt, type Card, type Skill, type State } from './index';
import { myWords, type WordMeta } from './my-words';

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
			['学生', 'lesson'],
			['你好', 'lesson']
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
