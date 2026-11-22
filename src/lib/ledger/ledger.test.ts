import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { apply, initialState, localDate, type Attempt, type StudyEvent } from '#lib/study/index.js';
import { practice } from '#lib/study/fixtures/streak.js';
import { att, outbox, server, T } from './fixtures';
import { memoryStore, openLedger } from './index';

const fold = (inputs: Attempt[]) =>
	inputs.reduce((s, i) => apply(s, i, new Date(i.at)).state, initialState());

const fresh = () =>
	openLedger({
		initial: initialState({ curriculum: CURRICULUM }),
		store: memoryStore(),
		idb: new IDBFactory()
	});

const sectionAttempt = (i: number, at: string): Attempt => ({
	id: `sec-${i}`,
	at,
	questionId: `q${i}`,
	contentSha: 'sha1',
	correct: true,
	ms: 1000,
	step: { kind: 'section', lesson: 'h1-01', section: 'words', run: 'r1', of: 6 }
});

describe('ledger', () => {
	it('duplicate replays never create duplicate Attempts', async () => {
		const store = memoryStore();
		const a001 = att('a-001', T, '你', 'the', true);
		await store.push([a001]);
		const ledger = await openLedger({ initial: initialState(), store, idb: new IDBFactory() });
		await ledger.record(a001);
		expect(ledger.pending()).toBe(1);
		await ledger.sync();
		expect(store.rows().filter((r) => 'id' in r && r.id === 'a-001')).toHaveLength(1);
		expect(ledger.pending()).toBe(0);
		await ledger.record(a001);
		expect(ledger.pending()).toBe(0);
		await ledger.sync();
		await ledger.sync();
		expect(store.rows()).toHaveLength(1);
		expect(store.pushes).toBe(2);
	});

	it('state() is Study.apply folded in time order', async () => {
		const store = memoryStore();
		await store.push(server);
		store.pushes = 0;
		const idb = new IDBFactory();
		const ledger = await openLedger({ initial: initialState(), store, idb });
		await ledger.sync();
		expect(ledger.pending()).toBe(0);
		store.online = false;
		for (const o of outbox) await ledger.record(o);
		expect(ledger.pending()).toBe(3);
		const [s1, s2, s3, s4, s5] = server;
		const [o1, o2, o3] = outbox;
		expect(ledger.state()).toEqual(fold([s1, o1, s2, s3, s4, s5, o2, o3]));

		const reopened = await openLedger({ initial: initialState(), store, idb });
		expect(reopened.state()).toEqual(ledger.state());
		expect(reopened.pending()).toBe(3);
	});

	it('orders a saved word before an attempt at the same time', async () => {
		const ledger = await openLedger({
			initial: initialState(),
			store: memoryStore(),
			idb: new IDBFactory()
		});
		const nghe = att('n1', T, '你', 'nghe', true);
		await ledger.record(nghe);
		await ledger.record({ kind: 'saved', word: '你', at: nghe.at });
		expect(ledger.state().lexicon['你'].cards.nghe).toBeUndefined();
	});

	it('rejects sync without marking anything, then retries', async () => {
		const store = memoryStore();
		const ledger = await openLedger({ initial: initialState(), store, idb: new IDBFactory() });
		await ledger.record(outbox[0]);
		store.online = false;
		await expect(ledger.sync()).rejects.toThrow('offline');
		expect(ledger.pending()).toBe(1);
		store.online = true;
		await ledger.sync();
		expect(ledger.pending()).toBe(0);
		expect(store.rows()).toHaveLength(1);
	});

	it('shares one in-flight sync and pulls unknown inputs', async () => {
		const store = memoryStore();
		await store.push([server[0]]);
		const ledger = await openLedger({ initial: initialState(), store, idb: new IDBFactory() });
		const a = ledger.sync();
		expect(ledger.sync()).toBe(a);
		await a;
		expect(ledger.state()).toEqual(fold([server[0]]));
		expect(ledger.pending()).toBe(0);
	});

	it('syncs a record made while a sync runs', async () => {
		const store = memoryStore();
		await store.push([server[0]]);
		store.pushes = 0;
		const ledger = await openLedger({ initial: initialState(), store, idb: new IDBFactory() });
		const pull = store.pull.bind(store);
		let release!: () => void;
		const gate = new Promise<void>((r) => (release = r));
		store.pull = async () => {
			await gate;
			return pull();
		};
		const a = ledger.sync();
		await ledger.record(outbox[0]);
		expect(ledger.sync()).toBe(a);
		release();
		await a;
		expect(ledger.pending()).toBe(0);
		expect(store.rows().some((r) => 'id' in r && r.id === 'o1')).toBe(true);
		expect(store.pushes).toBe(1);
	});

	it('syncs a record that lands late in the run once the caller syncs again', async () => {
		const store = memoryStore();
		await store.push([server[0]]);
		const ledger = await openLedger({ initial: initialState(), store, idb: new IDBFactory() });
		let late: Promise<StudyEvent[]> | undefined;
		ledger.subscribe(() => {
			late ??= ledger.record(outbox[0]);
		});
		const a = ledger.sync();
		await a;
		await late;
		const b = ledger.sync();
		expect(b).not.toBe(a);
		await b;
		expect(ledger.pending()).toBe(0);
		expect(store.rows().some((r) => 'id' in r && r.id === 'o1')).toBe(true);
	});

	it('subscribe notifies on every change', async () => {
		const ledger = await openLedger({
			initial: initialState(),
			store: memoryStore(),
			idb: new IDBFactory()
		});
		const fn = vi.fn();
		const unsubscribe = ledger.subscribe(fn);
		const a100 = att('a100', T, '你', 'the', true);
		await ledger.record(a100);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith(ledger.state());
		await ledger.record(a100);
		expect(fn).toHaveBeenCalledTimes(1);
		unsubscribe();
		await ledger.record(att('a101', T + 1000, '你', 'the', true));
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('notifies when sync pulls new inputs', async () => {
		const store = memoryStore();
		await store.push([server[0]]);
		const ledger = await openLedger({ initial: initialState(), store, idb: new IDBFactory() });
		const fn = vi.fn();
		ledger.subscribe(fn);
		await ledger.sync();
		expect(fn).toHaveBeenCalledTimes(1);
		await ledger.sync();
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('a record racing a pull of the same key keeps memory and IndexedDB equal', async () => {
		const store = memoryStore();
		const saved = {
			kind: 'saved' as const,
			word: '你',
			at: new Date(T - 8 * 86_400_000).toISOString()
		};
		await store.push([saved]);
		const idb = new IDBFactory();
		const ledger = await openLedger({ initial: initialState(), store, idb });
		const syncing = ledger.sync();
		await Promise.resolve();
		const recording = ledger.record({ ...saved, at: new Date(T).toISOString() });
		await Promise.all([syncing, recording]);
		const reopened = await openLedger({ initial: initialState(), store, idb });
		expect(reopened.pending()).toBe(ledger.pending());
		expect(reopened.state()).toEqual(ledger.state());
	});

	it('pull marks a row recorded during an in-flight push as synced', async () => {
		const store = memoryStore();
		const idb = new IDBFactory();
		const ledger = await openLedger({ initial: initialState(), store, idb });
		await ledger.record(outbox[0]);
		const push = store.push.bind(store);
		store.push = async (inputs) => {
			await push(inputs);
			await ledger.record(outbox[1]);
			await push([outbox[1]]);
		};
		await ledger.sync();
		expect(ledger.pending()).toBe(0);
		expect((await openLedger({ initial: initialState(), store, idb })).pending()).toBe(0);
	});

	it('Given_LastAttemptOfSection_When_Record_Then_ResolvesSectionDoneAndDayCounted', async () => {
		// Arrange
		const ledger = await fresh();
		const at = new Date(T).toISOString();
		const day = localDate(new Date(at), ledger.state().tz);
		const got: StudyEvent[][] = [];

		// Act
		for (let i = 0; i < 6; i += 1) got.push(await ledger.record(sectionAttempt(i, at)));

		// Assert
		expect(got.slice(0, 5)).toEqual([[], [], [], [], []]);
		expect(got[5]).toEqual(
			expect.arrayContaining([
				{ type: 'SectionDone', lesson: 'h1-01', section: 'words' },
				{ type: 'DayCounted', day, streak: 1, record: false, freezes: 0 }
			])
		);
	});

	it('Given_StoredInput_When_RecordAgain_Then_Empty', async () => {
		// Arrange
		const ledger = await fresh();
		const input = sectionAttempt(0, new Date(T).toISOString());
		await ledger.record(input);

		// Act
		const again = await ledger.record(input);

		// Assert
		expect(again).toEqual([]);
		expect(Object.keys(ledger.state().runs)).toHaveLength(1);
	});

	it('Given_WordSaved_When_Record_Then_Empty', async () => {
		// Arrange
		const ledger = await fresh();

		// Act
		const events = await ledger.record({
			kind: 'saved',
			word: '你',
			at: new Date(T).toISOString()
		});

		// Assert
		expect(events).toEqual([]);
		expect(ledger.state().lexicon['你'].saved).toBe(true);
	});

	it('Given_EarlierAt_When_Record_Then_EventsOfItsPlace', async () => {
		// Arrange
		const ledger = await fresh();
		await ledger.record(att('d2', T, '你', 'the', true));

		// Act
		const events = await ledger.record(att('d1', T - 86_400_000, '好', 'the', true));

		// Assert
		expect(events).toContainEqual(expect.objectContaining({ type: 'CardScheduled', word: '好' }));
		expect(events.some((e) => e.type === 'CardScheduled' && e.word === '你')).toBe(false);
	});

	it('Given_TwoRunsSameLocalDay_When_Record_Then_OnlyFirstHasDayCounted', async () => {
		// Arrange
		const ledger = await fresh();
		const first = practice('r-a', ['你'], new Date('2026-11-13T03:00:00Z'))[0];
		const second = practice('r-b', ['好'], new Date('2026-11-13T09:00:00Z'))[0];

		// Act
		const firstEvents = await ledger.record(first);
		const secondEvents = await ledger.record(second);

		// Assert
		expect(firstEvents.some((e) => e.type === 'DayCounted')).toBe(true);
		expect(secondEvents.some((e) => e.type === 'DayCounted')).toBe(false);
	});

	it('Given_NextLocalDay_When_Record_Then_DayCountedAgain', async () => {
		// Arrange
		const ledger = await fresh();
		await ledger.record(practice('r-a', ['你'], new Date('2026-11-13T03:00:00Z'))[0]);
		await ledger.record(practice('r-b', ['好'], new Date('2026-11-13T09:00:00Z'))[0]);

		// Act
		const events = await ledger.record(
			practice('r-c', ['你'], new Date('2026-11-14T03:00:00Z'))[0]
		);

		// Assert
		expect(events).toContainEqual(expect.objectContaining({ type: 'DayCounted', streak: 2 }));
	});
});
