import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { openQueue } from './queue';
import type { Category, Report } from './types';

const report = (
	id: string,
	at: string,
	category: Category = 'hanviet',
	over: Partial<Report> = {}
): Report => ({
	id,
	lesson: 'h1-01',
	step: 'w03',
	word: '你好',
	contentSha: 'sha1',
	category,
	note: null,
	at,
	...over
});

// A push that only works while the fake network is up, like the browser's `online`.
const net = () => {
	const sent: string[] = [];
	let online = false;
	return {
		sent,
		up: () => (online = true),
		push: async (r: Report) => {
			if (!online) throw new Error('offline');
			sent.push(r.id);
		}
	};
};

describe('report queue', () => {
	it('offline add stays pending, online flush sends once', async () => {
		// Arrange
		const n = net();
		const q = await openQueue({ db: 'report-q1', idb: new IDBFactory(), push: n.push });

		// Act
		await q.add(report('a', '2026-11-16T09:00:00.000Z'));
		await expect(q.flush()).rejects.toThrow('offline');

		// Assert
		expect(q.pending()).toBe(1);
		expect(n.sent).toHaveLength(0);

		// Act
		n.up();
		await q.flush();

		// Assert
		expect(q.pending()).toBe(0);
		expect(n.sent).toEqual(['a']);
	});

	it('failed push keeps the row', async () => {
		// Arrange
		const n = net();
		const q = await openQueue({ db: 'report-q2', idb: new IDBFactory(), push: n.push });

		// Act
		await q.add(report('a', '2026-11-16T09:00:00.000Z'));
		await expect(q.flush()).rejects.toThrow('offline');

		// Assert
		expect(q.pending()).toBe(1);

		// Act
		n.up();
		await q.flush();

		// Assert
		expect(q.pending()).toBe(0);
		expect(n.sent).toEqual(['a']);
	});

	it('rows survive reopening the database', async () => {
		// Arrange
		const idb = new IDBFactory();
		const n = net();
		const first = await openQueue({ db: 'report-q3', idb, push: n.push });
		await first.add(report('a', '2026-11-16T09:00:00.000Z'));
		await expect(first.flush()).rejects.toThrow('offline');

		// Act
		const second = await openQueue({ db: 'report-q3', idb, push: n.push });

		// Assert
		expect(second.pending()).toBe(1);
	});

	it('two adds during a running flush are both sent', async () => {
		// Arrange
		const blocked = Promise.withResolvers<void>();
		const sent: string[] = [];
		const q = await openQueue({
			db: 'report-q4',
			idb: new IDBFactory(),
			push: async (r) => {
				await blocked.promise;
				sent.push(r.id);
			}
		});

		// Act
		await q.add(report('a', '2026-11-16T09:00:00.000Z'));
		const running = q.flush();
		await q.add(report('b', '2026-11-16T09:01:00.000Z'));
		blocked.resolve();
		await running;

		// Assert
		expect(sent).toEqual(['a', 'b']);
		expect(q.pending()).toBe(0);
	});
});
