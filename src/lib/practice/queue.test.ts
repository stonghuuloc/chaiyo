import { describe, expect, it } from 'vitest';
import type { SessionCard } from '#lib/study/index.js';
import { answer, current, finished, startQueue, type Queue } from './queue';

const cards: SessionCard[] = [
	{ word: '你好', skill: 'nghe' },
	{ word: '谢谢', skill: 'nghe' },
	{ word: '再见', skill: 'viet' }
];

const run = (q: Queue, results: (boolean | null)[]) => {
	const seen: { id: string; again: boolean }[] = [];
	let at = 0;
	while (!finished(q)) {
		const cur = current(q);
		seen.push({ id: cur.id, again: cur.again });
		q = answer(q, results[at++] ?? true);
	}
	return seen;
};

describe('practice queue', () => {
	it('Given_FirstMiss_When_Answer_Then_AppendsOneAgainCopy', () => {
		// Arrange
		const q = startQueue(cards);

		// Act
		const next = answer(q, false);

		// Assert
		expect(next.items).toHaveLength(4);
		expect(next.items[3]).toEqual({
			word: '你好',
			skill: 'nghe',
			id: 'practice:nghe:你好#again',
			again: true
		});
		expect(current(next).word).toBe('谢谢');
	});

	it('Given_SecondMiss_When_Answer_Then_NotQueued', () => {
		// Arrange
		const q = { ...startQueue(cards.slice(0, 1)), at: 0 };
		const again = answer(q, false);

		// Act
		const next = answer(again, false);

		// Assert
		expect(next.items).toHaveLength(2);
		expect(finished(next)).toBe(true);
	});

	it('Given_Hit_When_Answer_Then_NotQueued', () => {
		// Arrange
		const q = startQueue(cards);

		// Act
		const next = answer(q, true);

		// Assert
		expect(next.items).toHaveLength(3);
	});

	it('Given_NullResult_When_Answer_Then_NotQueued', () => {
		// Arrange
		const q = startQueue(cards);

		// Act
		const next = answer(q, null);

		// Assert
		expect(next.items).toHaveLength(3);
	});

	it('Given_DoubleMissInThree_When_Run_Then_FiveAppearancesFiveDistinctIds', () => {
		// Arrange
		const q = startQueue(cards);

		// Act
		const seen = run(q, [false, true, true, false]);

		// Assert
		expect(seen.map((s) => s.id)).toEqual([
			'practice:nghe:你好',
			'practice:nghe:谢谢',
			'practice:viet:再见',
			'practice:nghe:你好#again'
		]);
		expect(seen).toHaveLength(4);
		const double = run(startQueue(cards), [false, false, true, true, false, false]);
		expect(double).toHaveLength(5);
		expect(new Set(double.map((s) => s.id)).size).toBe(5);
		expect(double.at(-1)?.again).toBe(true);
	});

	it('Given_TheCardMissed_When_Answer_Then_QueuesOnce', () => {
		// Arrange
		const q = startQueue([{ word: '你', skill: 'the' }]);

		// Act
		const seen = run(q, [false, false]);

		// Assert
		expect(seen.map((s) => s.id)).toEqual(['practice:the:你', 'practice:the:你#again']);
	});
});
