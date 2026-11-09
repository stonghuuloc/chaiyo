import { describe, expect, it } from 'vitest';
import { apply, type Attempt, type Skill, type State } from '#lib/study/index.js';
import { T, bai1 } from '#lib/study/fixtures/bai1.js';

const DAY = 86_400_000;
const attempt = (word: string, skill: Skill, correct: boolean | null): Attempt => ({
	id: `a:${word}:${skill}`,
	at: T.toISOString(),
	questionId: `q:${word}:${skill}`,
	contentSha: 'fixture',
	correct,
	ms: 1000,
	card: { word, skill }
});

describe('apply', () => {
	it("one Attempt schedules only its own skill's card", () => {
		const s = bai1();
		const { state, events } = apply(s, attempt('你好', 'nghe', false), T);
		expect(events).toEqual([
			{ type: 'CardScheduled', word: '你好', skill: 'nghe', due: '2026-11-09T02:10:00.000Z' }
		]);
		expect(state.lexicon['你好'].cards.the).toEqual(s.lexicon['你好'].cards.the);
		const due = new Date(state.lexicon['你好'].cards.the!.due);
		const day = (d: Date) =>
			new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
		expect(day(due)).toBe(day(new Date(T.getTime() + 9 * DAY)));
	});

	it('negative control: the other skill is the one that changes', () => {
		const s = bai1();
		const { state, events } = apply(s, attempt('你好', 'the', false), T);
		expect(events.map((e) => (e.type === 'CardScheduled' ? e.skill : null))).toEqual(['the']);
		expect(state.lexicon['你好'].cards.nghe).toEqual(s.lexicon['你好'].cards.nghe);
	});

	it('a drill Attempt changes nothing', () => {
		const s = bai1();
		const drill: Attempt = { ...attempt('你好', 'the', true), card: undefined };
		const a = apply(s, drill, T);
		const b = apply(s, attempt('你好', 'the', null), T);
		for (const r of [a, b]) {
			expect(r.events).toEqual([]);
			expect(r.state).toEqual(s);
		}
	});

	it('remembering pushes the card further than forgetting', () => {
		const s = bai1();
		const right = apply(s, attempt('你', 'the', true), T);
		expect(right.events[0].due).toBe('2026-12-05T14:51:41.809Z');
		const wrong = apply(right.state, attempt('好', 'the', false), T);
		expect(wrong.events[0].due).toBe('2026-11-09T02:10:00.000Z');
		const dueOf = (w: string) => new Date(wrong.state.lexicon[w].cards.the!.due).getTime();
		expect(dueOf('你')).toBeGreaterThan(dueOf('好'));
		expect(dueOf('好') - T.getTime()).toBeLessThanOrEqual(DAY);
	});

	it('same word, three skills, three cards', () => {
		let state = bai1();
		const events = [];
		for (const [skill, correct] of [
			['the', true],
			['nghe', false],
			['viet', true]
		] as const) {
			const r = apply(state, attempt('你', skill, correct), T);
			state = r.state;
			events.push(...r.events);
		}
		expect(new Set(events.map((e) => e.skill)).size).toBe(3);
		expect(events.map((e) => e.due)).toEqual([
			'2026-12-05T14:51:41.809Z',
			'2026-11-09T02:01:00.000Z',
			'2026-12-07T04:28:23.574Z'
		]);
		for (const e of events) expect(state.lexicon['你'].cards[e.skill]!.due).toBe(e.due);
	});

	it('an Attempt dated before the last review does not throw', () => {
		const s = bai1();
		const early = new Date(T.getTime() - 30 * DAY);
		const { events } = apply(s, attempt('你好', 'the', true), early);
		expect(events).toHaveLength(1);
	});

	it('words named like Object.prototype keys are ordinary words', () => {
		const { state, events } = apply(bai1(), attempt('constructor', 'the', true), T);
		expect(events).toHaveLength(1);
		expect(Object.hasOwn(state.lexicon, 'constructor')).toBe(true);
	});

	it('a malformed stored card is rejected, not scheduled as NaN', () => {
		const broken: State = {
			lexicon: {
				你: { saved: false, cards: { the: { due: '2026-11-09T02:00:00.000Z', fsrs: { reps: 1 } } } }
			}
		};
		const before = JSON.stringify(broken);
		expect(() => apply(broken, attempt('你', 'the', true), T)).toThrow();
		expect(JSON.stringify(broken)).toBe(before);
	});

	it('state survives JSON', () => {
		const s = bai1();
		const a = apply(s, attempt('你', 'the', true), T);
		const b = apply(JSON.parse(JSON.stringify(s)), attempt('你', 'the', true), T);
		expect(b.events).toEqual(a.events);
	});

	it('apply does not mutate its input', () => {
		const s = bai1();
		const before = JSON.stringify(s);
		apply(s, attempt('你', 'the', true), T);
		apply(s, attempt('新词', 'viet', false), T);
		expect(JSON.stringify(s)).toBe(before);
	});
});
