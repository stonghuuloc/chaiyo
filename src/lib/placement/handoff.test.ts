import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { memoryStore, openLedger } from '#lib/ledger/index.js';
import { initialState } from '#lib/study/index.js';
import { readHandoff, recordHandoff } from './handoff';
import { HANDOFF } from './index';

const attempt = (id: string) => ({
	id,
	at: '2026-11-11T02:00:00Z',
	questionId: 'q',
	contentSha: 'placement-1',
	correct: true,
	ms: 1,
	step: { kind: 'placement' as const, level: 1, run: 'r', of: 10 }
});
const stored = (value: string | null) => ({ getItem: () => value });

describe('placement handoff', () => {
	it('reads a valid handoff', () => {
		const h = { cleared: 2, attempts: [attempt('a')] };
		expect(readHandoff(stored(JSON.stringify(h)))).toEqual(h);
	});

	it.each([null, 'not json', '{"cleared":"2","attempts":[]}', '{"cleared":1}', 'null'])(
		'treats %s as no handoff',
		(raw) => expect(readHandoff(stored(raw))).toBeNull()
	);

	it('records every Attempt, then removes the key, then syncs', async () => {
		const order: string[] = [];
		const ledger = {
			record: vi.fn(async (i: { id: string }) => void order.push('record ' + i.id)),
			sync: vi.fn(async () => void order.push('sync'))
		};
		const storage = { removeItem: vi.fn((k: string) => void order.push('remove ' + k)) };
		await recordHandoff(
			storage,
			{ cleared: 1, attempts: [attempt('a'), attempt('b')] },
			ledger as never
		);
		expect(order).toEqual(['record a', 'record b', `remove ${HANDOFF}`, 'sync']);
	});

	it('keeps the key when a record fails, and swallows a failed sync', async () => {
		const storage = { removeItem: vi.fn() };
		const broken = { record: async () => Promise.reject(new Error('idb')), sync: vi.fn() };
		await expect(
			recordHandoff(storage, { cleared: 1, attempts: [attempt('a')] }, broken as never)
		).rejects.toThrow('idb');
		expect(storage.removeItem).not.toHaveBeenCalled();

		const ledger = await openLedger({
			initial: initialState(),
			store: memoryStore(),
			idb: new IDBFactory()
		});
		ledger.sync = () => Promise.reject(new Error('offline'));
		await recordHandoff(storage, { cleared: 1, attempts: [attempt('a')] }, ledger);
		expect(storage.removeItem).toHaveBeenCalledOnce();
	});
});
