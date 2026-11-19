import type { Report } from './types';

export type Queue = {
	add(report: Report): Promise<void>;
	flush(): Promise<void>;
	pending(): number;
};

const done = <T>(req: IDBRequest<T>) => {
	const { promise, resolve, reject } = Promise.withResolvers<T>();
	req.onsuccess = () => resolve(req.result);
	req.onerror = () => reject(req.error);
	return promise;
};

function openDb(idb: IDBFactory, name: string): Promise<IDBDatabase> {
	const req = idb.open(name, 1);
	req.onupgradeneeded = () => req.result.createObjectStore('reports', { keyPath: 'id' });
	return done(req);
}

const rowsOf = (db: IDBDatabase) =>
	done<Report[]>(db.transaction('reports').objectStore('reports').getAll());

// Resolves on commit, so a queued row is durable before the caller moves on.
const commit = (db: IDBDatabase, run: (store: IDBObjectStore) => void) => {
	const { promise, resolve, reject } = Promise.withResolvers<void>();
	const tx = db.transaction('reports', 'readwrite');
	run(tx.objectStore('reports'));
	tx.oncomplete = () => resolve();
	tx.onerror = () => reject(tx.error);
	tx.onabort = () => reject(tx.error);
	return promise;
};

export async function openQueue(o: {
	push: (report: Report) => Promise<void>;
	db?: string;
	idb?: IDBFactory;
}): Promise<Queue> {
	const conn = await openDb(o.idb ?? indexedDB, o.db ?? 'chaiyo-reports');
	const rows = new Map<string, Report>((await rowsOf(conn)).map((r) => [r.id, r]));
	const oldest = () => [...rows.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
	let running: Promise<void> | undefined;
	let again = false;

	async function run() {
		do {
			again = false;
			for (const r of oldest()) {
				await o.push(r);
				await commit(conn, (store) => store.delete(r.id));
				rows.delete(r.id);
			}
		} while (again);
	}

	const flush = () => {
		running ??= run().finally(() => {
			running = undefined;
		});
		return running;
	};

	return {
		flush,
		pending: () => rows.size,
		async add(report) {
			await commit(conn, (store) => store.put(report));
			rows.set(report.id, report);
			if (running) again = true;
			void flush().catch(() => undefined);
		}
	};
}
