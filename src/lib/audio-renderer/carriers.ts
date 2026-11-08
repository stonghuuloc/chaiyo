import { toneNumber } from './recorded';
import table from './syllable-carriers.json';

export type Carrier = { say: string; cut?: boolean };

const cells: Record<string, Carrier> = table.cells;
const chips: Record<string, string> = table.chips;

export function carrierOf(text: string): Carrier | undefined {
	const label = toneNumber(text);
	if (label) return cells[label];
	const say = chips[text];
	return say ? { say } : undefined;
}

export const noClipReason = (label: string): string | undefined =>
	cells[label.replace('ü', 'v')] ? undefined : 'no standard hanzi or word reads this syllable';
