import { apply, type State } from '#lib/study/index.js';
import { all, key, open, put, type Row } from './idb';
import type { Input, Ledger, Store } from './types';

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
	let again = false;
	let chain: Promise<unknown> = Promise.resolve();
	const serial = <T>(f: () => Promise<T>) => {
		const p = chain.then(f);
		chain = p.catch(() => undefined);
		return p;
	};

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
		do {
			again = false;
			const out = unsynced();
			if (out.length > 0) {
				await o.store.push(out);
				await serial(async () => {
					const marked = out.map((i) => ({ key: key(i), input: i, synced: true }));
					await put(db, marked);
					for (const r of marked) rows.set(r.key, r);
				});
			}
			const pulled = await o.store.pull();
			await serial(async () => {
				const fresh: Row[] = [];
				let added = false;
				for (const input of pulled) {
					const k = key(input);
					const known = rows.get(k);
					if (known?.synced) continue;
					if (!known) added = true;
					fresh.push({ key: k, input: known?.input ?? input, synced: true });
				}
				if (fresh.length === 0) return;
				await put(db, fresh);
				for (const r of fresh) rows.set(r.key, r);
				if (added) changed();
			});
		} while (again);
	}

	return {
		state,
		pending,
		subscribe(fn) {
			listeners.add(fn);
			return () => void listeners.delete(fn);
		},
		record(input) {
			return serial(async () => {
				const k = key(input);
				if (rows.has(k)) return;
				const row = { key: k, input, synced: false };
				await put(db, [row]);
				rows.set(k, row);
				if (running) again = true;
				changed();
			});
		},
		sync() {
			running ??= run().finally(() => {
				running = undefined;
			});
			return running;
		}
	};
}
