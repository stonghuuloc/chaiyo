import type { LevelOutline } from './build';

export function outlineNumbers(levels: LevelOutline[]): Map<string, number> {
	const out = new Map<string, number>();
	let k = 0;
	for (const o of [...levels].sort((a, b) => a.level - b.level))
		for (const t of o.topics) for (const l of t.lessons) out.set(l.id, ++k);
	return out;
}

export function numberOf(nums: Map<string, number>, id: string): number {
	const n = nums.get(id);
	if (n === undefined) throw new Error(`curriculum: ${id} is in no level outline`);
	return n;
}
