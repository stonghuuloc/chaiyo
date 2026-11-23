import { m } from '#lib/paraglide/messages.js';
import { MAX_FREEZES } from '#lib/study/index.js';
import type { WeekView } from './week';

export type FreezeRulesView = {
	have: string;
	sub: string;
	held: number;
	max: number;
	rules: { title: string; text: string }[];
};

export function freezeRules({
	count,
	freezes
}: Pick<WeekView, 'count' | 'freezes'>): FreezeRulesView {
	const max = MAX_FREEZES;
	return {
		held: Math.min(freezes, max),
		max,
		have: m.chy46s3_have({ f: freezes, max }),
		sub: freezes >= max ? m.chy46s3_full() : m.chy46s3_next({ k: 7 - (count % 7) }),
		rules: [
			{ title: m.chy46s3_r1_t(), text: m.chy46s3_r1() },
			{ title: m.chy46s3_r2_t(), text: m.chy46s3_r2({ max }) },
			{ title: m.chy46s3_r3_t(), text: m.chy46s3_r3() },
			{ title: m.chy46s3_r4_t(), text: m.chy46s3_r4() }
		]
	};
}
