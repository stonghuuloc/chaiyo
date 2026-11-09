import type { Attempt, State, Step, StudyEvent } from './types';

export function progress(s: State, step: Step, a: Attempt): { state: State; events: StudyEvent[] } {
	const ignore = { state: s, events: [] };
	const index = s.curriculum.lessons.findIndex((l) => l.id === step.lesson);
	if (index < 0) return ignore;
	const meta = s.curriculum.lessons[index];
	const L = s.lessons[step.lesson];
	if (
		step.kind === 'gate' &&
		!(meta.testOut || meta.sections.every((section) => L.done.includes(section)))
	)
		return ignore;
	const run = s.runs[step.run] ?? { answers: {} };
	if (run.closed || Object.hasOwn(run.answers, a.questionId)) return ignore;
	const answers = { ...run.answers, [a.questionId]: a.correct === true };
	if (Object.keys(answers).length < step.of)
		return { state: { ...s, runs: { ...s.runs, [step.run]: { answers } } }, events: [] };

	const runs = { ...s.runs, [step.run]: { answers, closed: true as const } };
	const events: StudyEvent[] = [];
	const lessons = { ...s.lessons };
	let lexicon = s.lexicon;

	if (step.kind === 'section') {
		const done = L.done.includes(step.section) ? L.done : [...L.done, step.section];
		lessons[step.lesson] = { ...L, done };
		events.push({ type: 'SectionDone', lesson: step.lesson, section: step.section });
		if (step.section === 'words') {
			lexicon = { ...lexicon };
			for (const word of meta.words)
				if (Object.hasOwn(lexicon, word) && lexicon[word].saved)
					lexicon[word] = { ...lexicon[word], saved: false };
		}
		return { state: { ...s, lessons, lexicon, runs }, events };
	}

	const right = Object.values(answers).filter(Boolean).length;
	const score = Math.floor((right * 100) / step.of);
	events.push({ type: 'SectionDone', lesson: step.lesson, section: 'gate' });
	lessons[step.lesson] = { ...L, best: Math.max(L.best ?? 0, score) };
	if (right * 100 >= 80 * step.of) {
		events.push({ type: 'GatePassed', lesson: step.lesson, score });
		if (!L.passed) {
			lessons[step.lesson] = { ...lessons[step.lesson], passed: true };
			const next = s.curriculum.lessons[index + 1];
			if (next && !lessons[next.id].unlocked) {
				lessons[next.id] = { ...lessons[next.id], unlocked: true };
				events.push({ type: 'LessonUnlocked', lesson: next.id });
			}
		}
	}
	return { state: { ...s, lessons, runs }, events };
}
