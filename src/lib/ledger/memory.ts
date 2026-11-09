import { key } from './idb';
import type { Input, Store } from './types';

export type MemoryStore = Store & { rows(): Input[]; online: boolean; pushes: number };

export function memoryStore(): MemoryStore {
	const held = new Map<string, Input>();
	const store: MemoryStore = {
		online: true,
		pushes: 0,
		rows: () => [...held.values()].map((i) => structuredClone(i)),
		async push(inputs) {
			if (!store.online) throw new Error('offline');
			store.pushes += 1;
			for (const i of inputs) if (!held.has(key(i))) held.set(key(i), structuredClone(i));
		},
		async pull() {
			if (!store.online) throw new Error('offline');
			return store.rows();
		}
	};
	return store;
}
