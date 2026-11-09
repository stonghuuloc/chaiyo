import { apply, type State } from '#lib/study/index.js';
import { all, open, put, type Row } from './idb';
import type { Input, Ledger, Store } from './types';

const key = (i: Input) => ('kind' in i ? `s:${i.word}` : `a:${i.id}`);
const order = (a: Input, b: Input) =>
	Date.parse(a.at) - Date.parse(b.at) ||
	('kind' in b ? 1 : 0) - ('kind' in a ? 1 : 0) ||
	(key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);

export async function openLedger(o: {
	initial: State;
	store: Store;
	db?: string;
	idb?: IDBFactory;
}): Promise<Ledger> {
	const db = await open(o.idb ?? indexedDB, o.db ?? 'chaiyo-ledger');
	const rows = new Map<string, Row>((await all(db)).map((r) => [r.key, r]));
	const listeners = new Set<(s: State) => void>();
	let cache: State | undefined;
	let running: Promise<void> | undefined;

	const state = () =>
		(cache ??= [...rows.values()]
			.map((r) => r.input)
			.sort(order)
			.reduce((s, i) => apply(s, i, new Date(i.at)).state, o.initial));
	const pending = () => [...rows.values()].filter((r) => !r.synced).length;
	const changed = () => {
		cache = undefined;
		const s = state();
		for (const fn of listeners) fn(s);
	};
	const unsynced = () =>
		[...rows.values()]
			.filter((r) => !r.synced)
			.map((r) => r.input)
			.sort(order);

	async function run() {
		const out = unsynced();
		let added = false;
		if (out.length > 0) {
			await o.store.push(out);
			const marked = out.map((i) => ({ key: key(i), input: i, synced: true }));
			await put(db, marked);
			for (const r of marked) rows.set(r.key, r);
		}
		const fresh: Row[] = [];
		for (const input of await o.store.pull()) {
			const k = key(input);
			const known = rows.get(k);
			if (known?.synced) continue;
			if (!known) added = true;
			fresh.push({ key: k, input: known?.input ?? input, synced: true });
		}
		if (fresh.length > 0) {
			await put(db, fresh);
			for (const r of fresh) rows.set(r.key, r);
		}
		if (added) changed();
	}

	return {
		state,
		pending,
		subscribe(fn) {
			listeners.add(fn);
			return () => void listeners.delete(fn);
		},
		async record(input) {
			const k = key(input);
			if (rows.has(k)) return;
			const row = { key: k, input, synced: false };
			await put(db, [row]);
			if (rows.has(k)) return;
			rows.set(k, row);
			changed();
		},
		sync() {
			running ??= run().finally(() => {
				running = undefined;
			});
			return running;
		}
	};
}
