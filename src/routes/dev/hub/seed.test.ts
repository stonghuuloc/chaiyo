import { CURRICULUM } from '#lib/curriculum/index.js';
import { memoryStore, openLedger } from '#lib/ledger/index.js';
import { initialState } from '#lib/study/index.js';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { seedSections, seedWords } from './seed';

describe('seedWords', () => {
	it('Given_TenWords_When_SeedRecorded_Then_OpenWordsRunWithFirstFour', async () => {
		// Arrange
		const words = CURRICULUM.lessons.find((l) => l.id === 'h1-01')!.words;
		const ledger = await openLedger({
			initial: initialState({ curriculum: CURRICULUM }),
			store: memoryStore(),
			db: 'seed-test',
			idb: new IDBFactory()
		});
		let n = 0;

		// Act
		for (const a of seedWords(words, new Date('2026-11-22T00:00:00Z'), () => `id-${n++}`))
			await ledger.record(a);

		// Assert
		const run = ledger.state().runs['id-0'];
		expect(run.closed).toBeUndefined();
		expect(run.step).toMatchObject({ section: 'words', of: 10 });
		expect(Object.keys(run.answers)).toEqual(words.slice(0, 4));
	});
});

describe('seedSections', () => {
	it('Given_FiveSections_When_SeedSections_Then_FiveOneOfOneAttempts', async () => {
		// Arrange
		const sections = CURRICULUM.lessons.find((l) => l.id === 'h1-01')!.sections;
		const ledger = await openLedger({
			initial: initialState({ curriculum: CURRICULUM }),
			store: memoryStore(),
			db: 'seed-sections-test',
			idb: new IDBFactory()
		});
		let n = 0;

		// Act
		const attempts = seedSections(
			'h1-01',
			sections,
			new Date('2026-11-22T00:00:00Z'),
			() => `id-${n++}`
		);
		for (const a of attempts) await ledger.record(a);

		// Assert
		expect(attempts).toHaveLength(5);
		const steps = attempts.map((a) => (a.step?.kind === 'section' ? a.step : null));
		expect(new Set(steps.map((s) => s?.run)).size).toBe(5);
		expect(steps.every((s) => s?.of === 1)).toBe(true);
		expect(ledger.state().lessons['h1-01'].done).toEqual(sections);
	});
});
