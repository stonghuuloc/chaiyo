import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { memoryStore, openLedger } from '#lib/ledger/index.js';
import { initialState } from '#lib/study/index.js';
import { answer, startRun } from './run';

const T0 = Date.parse('2026-11-11T02:00:00Z');
const attempts = (script: string) => {
	let n = 0;
	const uuid = () => `p${n++}`;
	let run = startRun(uuid);
	[...script.replace(/ /g, '')].forEach((s, i) => {
		run = answer(run, { ok: s === 'R', ms: 1000, at: new Date(T0 + i * 1000).toISOString() }, uuid);
	});
	return run.attempts;
};
const open = () =>
	openLedger({
		initial: initialState({ curriculum: CURRICULUM }),
		store: memoryStore(),
		idb: new IDBFactory()
	});

const PATH = 'RRRRRRRRRR WWRRRRRRRR RWRWW';

describe('placement result in Study', () => {
	it('25 recorded answers place the learner at HSK 3', async () => {
		const list = attempts(PATH);
		expect(list).toHaveLength(25);
		const ledger = await open();
		for (const a of list) await ledger.record(a);
		const s = ledger.state();
		expect(s.placed).toBe(2);
		for (const id of ['h0-00', 'h1-01', 'h1-05', 'h2-01'])
			expect(s.lessons[id]).toMatchObject({ passed: true, unlocked: true });
		expect(s.lessons['h3-01']).toMatchObject({ unlocked: true, passed: false });
		expect(s.lessons['h4-01'].unlocked).toBe(false);
		const words = Object.values(s.lexicon);
		expect(words).toHaveLength(230);
		for (const w of words) expect(w).toEqual({ saved: false, cards: {} });
		expect(list.every((a) => a.step?.kind === 'placement')).toBe(true);
	});

	it('recording the same answers again changes nothing', async () => {
		const list = attempts(PATH);
		const ledger = await open();
		for (const a of list) await ledger.record(a);
		const before = { state: structuredClone(ledger.state()), pending: ledger.pending() };
		for (const a of list) await ledger.record(a);
		expect(ledger.pending()).toBe(before.pending);
		expect(ledger.state()).toEqual(before.state);
	});

	it('a level run that stops short of 8 right changes nothing (negative control)', async () => {
		const ledger = await open();
		for (const a of attempts('RRRRRRRRRR WWRRRRRR')) await ledger.record(a);
		const s = ledger.state();
		expect(s.placed).toBe(1);
		expect(Object.keys(s.lexicon)).toHaveLength(219);
	});
});
