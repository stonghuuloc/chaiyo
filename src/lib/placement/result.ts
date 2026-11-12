import { m } from '#lib/paraglide/messages.js';
import type { CurriculumLesson } from '#lib/curriculum/build.js';

export function resultView(cleared: number, lessons: CurriculumLesson[]) {
	const level = (l: number) => lessons.filter((x) => x.level === l);
	const start = lessons.find((l) => l.n === 0);
	const next = level(cleared + 1)[0];

	if (cleared === 0) {
		const first = level(1).find((l) => l.n > 0);
		return {
			eyebrow: m.placement_result_eyebrow_start(),
			title: m.placement_result_b0_title({
				title: start?.title ?? '',
				hanzi: start?.titleHanzi ?? ''
			}),
			lead: m.placement_result_b0_lead(),
			rows: [
				{
					label: m.placement_result_next_label(),
					value: m.placement_result_next_value({ count: level(1).filter((l) => l.n > 0).length }),
					sub: m.placement_result_next_sub({ n: first?.n ?? 1, title: first?.title ?? '' })
				}
			],
			cta: m.placement_result_cta_b0(),
			href: '/today',
			confetti: 'none'
		} as const;
	}

	const opened = lessons.filter((l) => l.level <= cleared);
	const words = opened.reduce((sum, l) => sum + l.words.length, 0);
	const rows = [
		{
			label: m.placement_result_open_label(),
			value: m.placement_result_open_value({
				range: cleared > 1 ? `HSK 1–${cleared}` : 'HSK 1',
				n: opened.at(-1)?.n ?? 0
			}),
			sub: m.placement_result_open_sub()
		},
		{
			label: m.placement_result_words_label(),
			value: m.placement_result_words_value({ count: words.toLocaleString('vi-VN') }),
			sub: m.placement_result_words_sub()
		},
		{
			label: m.placement_result_daily_label(),
			value: m.placement_result_daily_value(),
			sub: m.placement_result_daily_sub()
		}
	];
	const confetti = cleared >= 4 ? 'big' : cleared >= 2 ? 'normal' : 'none';

	if (!next)
		return {
			eyebrow: m.placement_result_eyebrow_done(),
			title: m.placement_result_all_title(),
			lead: m.placement_result_all_lead(),
			rows,
			cta: m.placement_result_cta_topics(),
			href: '/roadmap',
			confetti
		} as const;

	return {
		eyebrow: m.placement_result_eyebrow_start(),
		title: m.placement_result_level_title({ level: next.level, n: next.n }),
		lead: m.placement_result_level_lead({ title: next.title, hanzi: next.titleHanzi }),
		rows,
		cta: m.placement_result_cta_lesson({ n: next.n }),
		href: '/today',
		confetti
	} as const;
}
