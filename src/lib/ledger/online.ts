import type { Ledger } from './types';

export function syncWhenOnline(ledger: Ledger, target: EventTarget = window): () => void {
	const run = () => void ledger.sync().catch(() => undefined);
	target.addEventListener('online', run);
	run();
	return () => target.removeEventListener('online', run);
}
