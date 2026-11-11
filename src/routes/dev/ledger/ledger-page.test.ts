import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { initialState } from '#lib/study/index.js';
import { memoryStore, openLedger } from '#lib/ledger/index.js';
import { DEV_CURRICULUM } from './curriculum';
import { finish, lines } from './finish';

const tz = 'Asia/Ho_Chi_Minh';
const initial = () => initialState({ curriculum: DEV_CURRICULUM, tz });

async function run(count: number, idb: IDBFactory, now: Date) {
	let n = 0;
	const ledger = await openLedger({
		initial: initial(),
		store: memoryStore(),
		idb,
		db: 'chaiyo-ledger-dev'
	});
	for (const a of finish(now, () => `u${n++}`).slice(0, count)) await ledger.record(a);
	return ledger;
}

describe('/dev/ledger', () => {
	it('10 Attempts finish Từ mới, count today, stay pending, and survive reopen', async () => {
		const now = new Date();
		const idb = new IDBFactory();
		const ledger = await run(10, idb, now);
		const expected = {
			tuMoi: 'Từ mới: xong',
			streak: 'Chuỗi: hôm nay đã tính (1)',
			pending: 'Chưa đồng bộ: 10'
		};
		expect(lines(ledger.state(), now, ledger.pending())).toEqual(expected);
		const reopened = await openLedger({
			initial: initial(),
			store: memoryStore(),
			idb,
			db: 'chaiyo-ledger-dev'
		});
		expect(lines(reopened.state(), now, reopened.pending())).toEqual(expected);
	});

	it('9 Attempts leave Từ mới not done', async () => {
		const now = new Date();
		const ledger = await run(9, new IDBFactory(), now);
		expect(lines(ledger.state(), now, ledger.pending())).toEqual({
			tuMoi: 'Từ mới: chưa xong',
			streak: 'Chuỗi: hôm nay chưa tính',
			pending: 'Chưa đồng bộ: 9'
		});
	});
});
