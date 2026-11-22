import { order } from '#lib/ledger/order.js';
import type { Input } from '#lib/ledger/types.js';
import { apply, localDate, type State } from '#lib/study/index.js';

export const foldInputs = (initial: State, inputs: Input[]): State =>
	[...inputs].sort(order).reduce((s, i) => apply(s, i, new Date(i.at)).state, initial);

export const yesterday = (now: Date, tz: string): string => {
	const [y, m, d] = localDate(now, tz).split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
};
