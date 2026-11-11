import type { Attempt, State, StudyEvent, WordSaved } from './types';

export const BADGES = [
	['first', 'Bước đầu tiên'],
	['streak7', 'Chuỗi 7 ngày'],
	['streak30', 'Chuỗi 30 ngày'],
	['streak100', 'Chuỗi 100 ngày'],
	['words100', '100 từ'],
	['words300', '300 từ'],
	['write50', 'Viết chữ đẹp'],
	['hsk1', 'Đỗ HSK 1'],
	['hsk2', 'Đỗ HSK 2']
] as const;

export type BadgeId = (typeof BADGES)[number][0];

export function award(
	s: State,
	a: Attempt | WordSaved,
	now: Date
): { state: State; events: StudyEvent[] } {
	const step = 'kind' in a ? undefined : a.step;
	const exam =
		step?.kind === 'mock' && step.mode === 'exam' && (a as Attempt).correct === true
			? `hsk${step.level}`
			: '';
	const words = Object.keys(s.lexicon).length;
	const first = s.curriculum.lessons[0];
	const holds: Record<BadgeId, boolean> = {
		first: !!first && s.lessons[first.id].passed,
		streak7: s.streak.count >= 7,
		streak30: s.streak.count >= 30,
		streak100: s.streak.count >= 100,
		words100: words >= 100,
		words300: words >= 300,
		write50: s.written >= 50,
		hsk1: exam === 'hsk1',
		hsk2: exam === 'hsk2'
	};
	const badges = { ...s.badges };
	const events: StudyEvent[] = [];
	for (const [badge, title] of BADGES)
		if (holds[badge] && !badges[badge]) {
			badges[badge] = now.toISOString();
			events.push({ type: 'BadgeEarned', badge, title });
		}
	return { state: { ...s, badges }, events };
}
