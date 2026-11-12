import type { Ledger } from '#lib/ledger/index.js';
import type { Attempt } from '#lib/study/index.js';
import { HANDOFF } from './index';

export type Handoff = { cleared: number; attempts: Attempt[] };

export function readHandoff(storage: Pick<Storage, 'getItem'>): Handoff | null {
	try {
		const value = JSON.parse(storage.getItem(HANDOFF) ?? 'null');
		return Number.isInteger(value?.cleared) && value.cleared >= 0 && Array.isArray(value?.attempts)
			? value
			: null;
	} catch {
		return null;
	}
}

export async function recordHandoff(
	storage: Pick<Storage, 'removeItem'>,
	handoff: Handoff,
	ledger: Ledger
) {
	for (const a of handoff.attempts) await ledger.record(a);
	storage.removeItem(HANDOFF);
	void ledger.sync().catch(() => undefined);
}
