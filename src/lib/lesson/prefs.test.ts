import { describe, expect, it } from 'vitest';
import { DisplayPrefs, showMeaning, showPinyin, type Stored } from './prefs.svelte';

const KEY = 'chaiyo-prefs-u1';

function memory(init?: Stored): Storage {
	const m = new Map<string, string>();
	if (init) m.set(KEY, JSON.stringify(init));
	return {
		getItem: (k) => m.get(k) ?? null,
		setItem: (k, v) => void m.set(k, v),
		removeItem: (k) => void m.delete(k),
		clear: () => m.clear(),
		key: () => null,
		get length() {
			return m.size;
		}
	};
}

type Row = { show_pinyin: boolean | null; show_meaning: boolean | null } | null;

function fake({
	fail = false,
	row = null as Row,
	hold
}: { fail?: boolean; row?: Row; hold?: Promise<void> } = {}) {
	const upserts: [unknown, unknown][] = [];
	const selects: string[] = [];
	const client = {
		from: (table: string) => {
			expect(table).toBe('settings');
			return {
				upsert: async (r: unknown, opts: unknown) => {
					upserts.push([r, opts]);
					return { error: fail ? new Error('offline') : null };
				},
				select: (cols: string) => {
					selects.push(cols);
					return {
						eq: () => ({
							maybeSingle: async () => {
								await hold;
								return { data: row, error: null };
							}
						})
					};
				}
			};
		}
	};
	return { upserts, selects, client: client as never };
}

const stored = (s: Storage) => JSON.parse(s.getItem(KEY) ?? 'null') as Stored;

describe('display prefs', () => {
	it('Given_PinyinNull_When_Level1to5_Then_TrueTrueFalseFalseFalse', () => {
		// Arrange
		const levels = [1, 2, 3, 4, 5];
		// Act
		const shown = levels.map((l) => showPinyin(null, l));
		// Assert
		expect(shown).toEqual([true, true, false, false, false]);
	});

	it('Given_PinyinSet_When_AnyLevel_Then_SetValueWins', () => {
		// Arrange
		const off = new DisplayPrefs({
			level: 1,
			key: KEY,
			storage: memory({ pinyin: false, meaning: null })
		});
		const on = new DisplayPrefs({
			level: 3,
			key: KEY,
			storage: memory({ pinyin: true, meaning: null })
		});
		// Act
		const values = [off.pinyin, on.pinyin];
		// Assert
		expect(values).toEqual([false, true]);
	});

	it('Given_MeaningNull_When_Level1_3_5_Then_True', () => {
		// Arrange
		const levels = [1, 3, 5];
		// Act
		const shown = levels.map(
			(level) => new DisplayPrefs({ level, key: KEY, storage: memory() }).meaning
		);
		// Assert
		expect(shown).toEqual([true, true, true]);
		expect(showMeaning(null)).toBe(true);
	});

	it('Given_Toggle_When_ClientOk_Then_UpsertsShowMeaningFalseAndNoUnsent', async () => {
		// Arrange
		const storage = memory({ pinyin: true, meaning: true });
		const { upserts, client } = fake();
		const prefs = new DisplayPrefs({ level: 1, key: KEY, storage, uid: 'u1', client });
		// Act
		await prefs.toggle('meaning');
		// Assert
		expect(prefs.meaning).toBe(false);
		expect(upserts).toEqual([
			[{ learner_id: 'u1', show_meaning: false }, { onConflict: 'learner_id' }]
		]);
		expect(stored(storage)).toEqual({ pinyin: true, meaning: false, unsent: [] });
	});

	it('Given_OtherPillNull_When_ToggleMeaning_Then_UpsertHasNoShowPinyin', async () => {
		// Arrange
		const { upserts, client } = fake();
		const prefs = new DisplayPrefs({ level: 1, key: KEY, storage: memory(), uid: 'u1', client });
		// Act
		await prefs.toggle('meaning');
		// Assert
		expect(upserts).toHaveLength(1);
		expect(upserts[0][0]).not.toHaveProperty('show_pinyin');
	});

	it('Given_UnsentMeaningOnly_When_Load_Then_UpsertHasNoShowPinyin', async () => {
		// Arrange
		const storage = memory({ pinyin: true, meaning: false, unsent: ['meaning'] });
		const { upserts, client } = fake();
		const prefs = new DisplayPrefs({ level: 1, key: KEY, storage, uid: 'u1', client });
		// Act
		await prefs.load();
		// Assert
		expect(upserts).toEqual([
			[{ learner_id: 'u1', show_meaning: false }, { onConflict: 'learner_id' }]
		]);
	});

	it('Given_Toggle_When_UpsertFails_Then_StorageKeepsUnsent', async () => {
		// Arrange
		const storage = memory();
		const { client } = fake({ fail: true });
		const prefs = new DisplayPrefs({ level: 1, key: KEY, storage, uid: 'u1', client });
		// Act
		await prefs.toggle('meaning');
		// Assert
		expect(stored(storage)).toEqual({ pinyin: null, meaning: false, unsent: ['meaning'] });
	});

	it('Given_UnsentInStorage_When_Load_Then_UpsertsOnceAndClearsUnsent', async () => {
		// Arrange
		const storage = memory({ pinyin: null, meaning: false, unsent: ['meaning'] });
		const { upserts, selects, client } = fake();
		const prefs = new DisplayPrefs({ level: 1, key: KEY, storage, uid: 'u1', client });
		// Act
		await prefs.load();
		// Assert
		expect(upserts).toEqual([
			[{ learner_id: 'u1', show_meaning: false }, { onConflict: 'learner_id' }]
		]);
		expect(selects).toEqual([]);
		expect(stored(storage)).toEqual({ pinyin: null, meaning: false, unsent: [] });
		expect(prefs.meaning).toBe(false);
	});

	it('Given_StorageClean_When_LoadServerFalse_Then_MeaningFalse', async () => {
		// Arrange
		const storage = memory({ pinyin: null, meaning: true });
		const { client } = fake({ row: { show_pinyin: null, show_meaning: false } });
		const prefs = new DisplayPrefs({ level: 1, key: KEY, storage, uid: 'u1', client });
		// Act
		await prefs.load();
		// Assert
		expect(prefs.meaning).toBe(false);
		expect(stored(storage)).toEqual({ pinyin: null, meaning: false });
	});

	it('Given_NoServerRow_When_Load_Then_DeviceCopyKept', async () => {
		// Arrange
		const storage = memory({ pinyin: false, meaning: null });
		const { client } = fake({ row: null });
		const prefs = new DisplayPrefs({ level: 1, key: KEY, storage, uid: 'u1', client });
		// Act
		await prefs.load();
		// Assert
		expect(prefs.pinyin).toBe(false);
	});

	it('Given_NoClient_When_Toggle_Then_StateChangesNoWrite', async () => {
		// Arrange
		const storage = memory();
		const prefs = new DisplayPrefs({ level: 3, key: KEY, storage });
		// Act
		await prefs.toggle('pinyin');
		await prefs.load();
		// Assert
		expect(prefs.pinyin).toBe(true);
		expect(stored(storage)).toEqual({ pinyin: true, meaning: null, unsent: ['pinyin'] });
	});

	it('Given_ToggleDuringLoad_When_ServerReturns_Then_ToggleKept', async () => {
		// Arrange
		let release = () => {};
		const hold = new Promise<void>((r) => (release = r));
		const { client } = fake({ row: { show_pinyin: null, show_meaning: true }, hold });
		const prefs = new DisplayPrefs({ level: 1, key: KEY, storage: memory(), uid: 'u1', client });
		// Act
		const loading = prefs.load();
		await prefs.toggle('meaning');
		release();
		await loading;
		// Assert
		expect(prefs.meaning).toBe(false);
	});

	it('Given_NoStorage_When_Construct_Then_Defaults', () => {
		// Arrange
		const prefs = new DisplayPrefs({ level: 2, key: KEY });
		// Act
		const values = [prefs.pinyin, prefs.meaning];
		// Assert
		expect(values).toEqual([true, true]);
	});
});
