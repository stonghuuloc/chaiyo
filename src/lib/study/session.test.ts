import { describe, expect, it } from 'vitest';
import { apply, minutes, session, type Attempt, type Skill } from '#lib/study/index.js';
import { T, bai1 } from '#lib/study/fixtures/bai1.js';

const tz = 'Asia/Ho_Chi_Minh';
const attempt = (word: string, skill: Skill, correct: boolean | null): Attempt => ({
	id: `a:${word}:${skill}`,
	at: T.toISOString(),
	questionId: `q:${word}:${skill}`,
	contentSha: 'fixture',
	correct,
	ms: 1000,
	card: { word, skill }
});
const c = (word: string, skill: Skill) => ({ word, skill });

describe('saved words', () => {
	it('a saved word has no listening card', () => {
		const s = bai1();
		const nghe = session(s, { now: T, tz, only: ['nghe'] });
		expect(nghe.map((x) => x.word)).not.toContain('奶茶');
		expect(session(s, { now: T, tz, only: ['the'] }).at(-1)).toEqual(c('奶茶', 'the'));

		const wrong = apply(s, attempt('奶茶', 'nghe', false), T);
		expect(wrong.events).toEqual([]);
		expect(wrong.state.lexicon['奶茶'].cards.nghe).toBeUndefined();
		expect(session(wrong.state, { now: T, tz, only: ['nghe'] })).toEqual(nghe);

		expect(apply(s, attempt('你好', 'nghe', false), T).events).toHaveLength(1);

		const the = apply(s, attempt('奶茶', 'the', false), T);
		expect(the.events).toEqual([
			{ type: 'CardScheduled', word: '奶茶', skill: 'the', due: '2026-11-09T02:01:00.000Z' }
		]);
	});

	it('saving a word twice changes nothing', () => {
		const s = bai1();
		const again = apply(s, { kind: 'saved', word: '奶茶', at: T.toISOString() }, T);
		expect(again.state).toEqual(s);
		expect(again.events).toEqual([]);
		const taught = apply(s, { kind: 'saved', word: '你好', at: T.toISOString() }, T);
		expect(taught.state).toEqual(s);
		expect(s.lexicon['你好'].saved).toBe(false);
	});
});

describe('session', () => {
	const expected = [
		c('你', 'the'),
		c('谢谢', 'nghe'),
		c('你', 'viet'),
		c('好', 'the'),
		c('再见', 'nghe'),
		c('好', 'viet'),
		c('您', 'the'),
		c('没关系', 'nghe'),
		c('对不起', 'the'),
		c('奶茶', 'the')
	];

	it("today's session interleaves skills", () => {
		const s = bai1();
		expect(Object.keys(s.lexicon)).toEqual([
			'你',
			'好',
			'您',
			'对不起',
			'谢谢',
			'再见',
			'没关系',
			'熊猫',
			'你们',
			'不客气',
			'你好',
			'奶茶'
		]);
		const cards = session(s, { now: T, tz });
		expect(cards).toEqual(expected);
		cards.forEach((card, i) => {
			if (i === cards.length - 1) return;
			expect(card.word).not.toBe(cards[i + 1].word);
			if (new Set(cards.slice(i + 1).map((x) => x.skill)).size >= 2)
				expect(card.skill).not.toBe(cards[i + 1].skill);
		});
		expect(minutes(cards)).toBe(3);
	});

	it('due cut is the local calendar date', () => {
		const s = bai1();
		expect(session(s, { now: new Date('2026-11-09T16:59:59Z'), tz })).toHaveLength(10);
		const later = session(s, { now: new Date('2026-11-11T17:00:00Z'), tz });
		expect(later.length).toBeGreaterThan(10);
		expect(later).toContainEqual(c('你们', 'the'));
		expect(later).toContainEqual(c('谢谢', 'the'));
	});

	it('single-skill filter', () => {
		const s = bai1();
		const viet = session(s, { now: T, tz, only: ['viet'] });
		expect(viet).toEqual([c('你', 'viet'), c('好', 'viet')]);
		expect(minutes(viet)).toBe(1);
		expect(session(s, { now: T, tz, only: ['nghe'] })).toEqual([
			c('谢谢', 'nghe'),
			c('再见', 'nghe'),
			c('没关系', 'nghe')
		]);
		expect(session(s, { now: T, tz, only: ['the'] })).toEqual(
			expected.filter((x) => x.skill === 'the')
		);
	});
});
