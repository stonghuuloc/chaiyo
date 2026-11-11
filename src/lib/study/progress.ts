import type { Attempt, State, Step, StudyEvent } from './types';

export function progress(
	s: State,
	step: Step,
	a: Attempt
): { state: State; events: StudyEvent[]; counts: boolean } {
	const ignore = { state: s, events: [], counts: false };
	if (!Number.isInteger(step.of) || step.of < 1) return ignore;
	const lessonless = step.kind === 'placement' || step.kind === 'practice';
	const index = lessonless ? -1 : s.curriculum.lessons.findIndex((l) => l.id === step.lesson);
	if (!lessonless && index < 0) return ignore;
	const meta = s.curriculum.lessons[index];
	const L = meta && s.lessons[meta.id];
	if (
		step.kind === 'gate' &&
		!(meta.testOut || meta.sections.every((section) => L.done.includes(section)))
	)
		return ignore;
	const run = Object.hasOwn(s.runs, step.run) ? s.runs[step.run] : { step, answers: {} };
	const first = run.step;
	if (
		first.kind !== step.kind ||
		first.of !== step.of ||
		(first.kind === 'placement' && step.kind === 'placement' && first.level !== step.level) ||
		(first.kind !== 'placement' &&
			first.kind !== 'practice' &&
			step.kind !== 'placement' &&
			step.kind !== 'practice' &&
			first.lesson !== step.lesson) ||
		(first.kind === 'section' && step.kind === 'section' && first.section !== step.section)
	)
		return ignore;
	if (run.closed || Object.hasOwn(run.answers, a.questionId)) return ignore;
	const answers = { ...run.answers, [a.questionId]: a.correct === true };
	if (Object.keys(answers).length < step.of)
		return {
			state: { ...s, runs: { ...s.runs, [step.run]: { step: run.step, answers } } },
			events: [],
			counts: false
		};

	const runs = { ...s.runs, [step.run]: { step: run.step, answers, closed: true as const } };
	const events: StudyEvent[] = [];
	if (step.kind === 'practice') return { state: { ...s, runs }, events, counts: true };
	const lessons = { ...s.lessons };
	let lexicon = s.lexicon;

	if (step.kind === 'placement') {
		const right = Object.values(answers).filter(Boolean).length;
		if (right * 100 < 80 * step.of || step.level !== s.placed + 1)
			return { state: { ...s, runs }, events, counts: false };
		lexicon = { ...lexicon };
		for (const l of s.curriculum.lessons.filter((l) => l.level <= step.level)) {
			lessons[l.id] = { ...lessons[l.id], passed: true, unlocked: true };
			for (const word of l.words)
				lexicon[word] = Object.hasOwn(lexicon, word)
					? { ...lexicon[word], saved: false }
					: { saved: false, cards: {} };
		}
		const next = s.curriculum.lessons.find((l) => l.level === step.level + 1);
		if (next && !lessons[next.id].unlocked) {
			lessons[next.id] = { ...lessons[next.id], unlocked: true };
			events.push({ type: 'LessonUnlocked', lesson: next.id });
		}
		return { state: { ...s, placed: step.level, lessons, lexicon, runs }, events, counts: false };
	}

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
		return { state: { ...s, lessons, lexicon, runs }, events, counts: true };
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
	return { state: { ...s, lessons, runs }, events, counts: true };
}
