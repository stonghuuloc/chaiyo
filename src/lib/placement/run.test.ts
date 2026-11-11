import { describe, expect, it } from 'vitest';
import { answer, startRun, type Run } from './run';
import { HANDOFF, PLACEMENT_SHA } from './index';

const counter = () => {
	let i = 0;
	return () => `u${i++}`;
};
const T0 = Date.parse('2026-11-11T02:00:00Z');

const play = (script: string[]): Run => {
	const uuid = counter();
	let run = startRun(uuid);
	script.forEach((s, i) => {
		run = answer(run, { ok: s === 'R', ms: 1000, at: new Date(T0 + i * 1000).toISOString() }, uuid);
	});
	return run;
};
const seq = (s: string) => s.replace(/ /g, '').split('');

describe('placement run', () => {
	it('exports the handoff key and bank version', () => {
		expect(HANDOFF).toBe('chaiyo.placement');
		expect(PLACEMENT_SHA).toBe('placement-1');
	});

	it('records "Không biết" as a miss with no answer key', () => {
		const u = counter();
		const run = answer(startRun(u), { ok: false, ms: 900, at: '2026-11-11T02:00:00Z' }, u);
		expect(run.attempts[0].correct).toBe(false);
		expect(run.attempts[0]).not.toHaveProperty('answer');
		expect(run.miss).toBe(1);
	});

	it('keeps a picked answer', () => {
		const u = counter();
		const run = answer(startRun(u), { ok: true, pick: '谢谢', ms: 5, at: 'x' }, u);
		expect(run.attempts[0]).toMatchObject({ answer: '谢谢', contentSha: 'placement-1' });
	});

	it('stops at the third miss in level 1', () => {
		const run = play(seq('RWRWRW'));
		expect(run).toMatchObject({ done: true, cleared: 0, miss: 3 });
		expect(run.attempts).toHaveLength(6);
		expect(new Set(run.attempts.map((a) => (a.step as { run: string }).run)).size).toBe(1);
		for (const a of run.attempts)
			expect(a.step).toMatchObject({ kind: 'placement', level: 1, of: 10 });
	});

	it('a third miss on the last item does not clear', () => {
		const run = play(seq('RRRRRRR WWW'));
		expect(run).toMatchObject({ done: true, cleared: 0 });
		expect(run.attempts).toHaveLength(10);
	});

	it('clears level 1 with two misses, then stops in level 2', () => {
		const cleared = play(seq('RRRRRRRR WW'));
		expect(cleared).toMatchObject({ level: 2, miss: 0, cleared: 1, done: false, index: 0 });
		const run = play(seq('RRRRRRRR WW WWW'));
		expect(run).toMatchObject({ done: true, cleared: 1 });
		expect(run.attempts).toHaveLength(13);
	});

	it('clears two levels and stops in the third with 3 run ids', () => {
		const run = play(seq('RRRRRRRRRR WWRRRRRRRR RWRWW'));
		expect(run).toMatchObject({ done: true, cleared: 2 });
		expect(run.attempts).toHaveLength(25);
		expect(new Set(run.attempts.map((a) => (a.step as { run: string }).run)).size).toBe(3);
	});

	it('clears all five levels', () => {
		const run = play(Array<string>(50).fill('R'));
		expect(run).toMatchObject({ done: true, cleared: 5 });
		expect(run.attempts).toHaveLength(50);
	});

	it('returns new objects', () => {
		const u = counter();
		const a = startRun(u);
		const b = answer(a, { ok: true, ms: 1, at: 'x' }, u);
		expect(b).not.toBe(a);
		expect(a.attempts).toHaveLength(0);
	});
});
