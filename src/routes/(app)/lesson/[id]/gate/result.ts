import { LESSONS } from '#lib/curriculum/index.js';
import type { Answer } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';
import type { StudyEvent } from '#lib/study/index.js';

type ResultInput = { lesson: string; answers: Answer[]; events: StudyEvent[]; best: number };

export function resultView(i: ResultInput) {
	const of = i.answers.length;
	const right = i.answers.filter((a) => a.correct).length;
	const pass = right * 100 >= 80 * of;
	const at = LESSONS.findIndex((l) => l.id === i.lesson);
	const next = at < 0 ? undefined : LESSONS[at + 1];
	const nOf = (id: string) => LESSONS.find((l) => l.id === id)?.n ?? 0;
	const parts = i.events.flatMap((e) => {
		if (e.type === 'LessonUnlocked') return [m.gate_result_unlocked({ n: nOf(e.lesson) })];
		if (e.type === 'DayCounted') return [m.gate_result_streak()];
		return [];
	});
	return {
		pct: Math.floor((right * 100) / of),
		right,
		of,
		pass,
		best: i.best,
		n: LESSONS[at]?.n ?? 0,
		line: pass ? parts.join(' · ') || null : m.gate_result_fail({ n: next?.n ?? 0 }),
		art: pass ? 'b1-pass' : 'b1-fail'
	};
}

export type ResultView = ReturnType<typeof resultView>;
