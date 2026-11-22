import { key } from './order';
import type { Input } from './types';

export { key };

export type Row = { key: string; input: Input; synced: boolean };

const done = <T>(req: IDBRequest<T>) =>
	new Promise<T>((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});

export function open(idb: IDBFactory, name: string): Promise<IDBDatabase> {
	const req = idb.open(name, 1);
	req.onupgradeneeded = () => req.result.createObjectStore('inputs', { keyPath: 'key' });
	return done(req);
}

export const all = (db: IDBDatabase): Promise<Row[]> =>
	done(db.transaction('inputs').objectStore('inputs').getAll());

export function put(db: IDBDatabase, rows: Row[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction('inputs', 'readwrite');
		const store = tx.objectStore('inputs');
		for (const r of rows) store.put(r);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error);
	});
}
