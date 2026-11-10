import { apply, initialState, type Attempt, type State } from '#lib/study/index.js';
import { CURRICULUM } from '#lib/study/fixtures/curriculum.js';

export const T = new Date('2026-11-09T02:00:00Z');
const DAY = 86_400_000;

function attempts(
	lesson: string,
	run: string,
	label: string,
	right: number,
	at: Date,
	answered: number,
	step: Attempt['step']
): Attempt[] {
	return Array.from({ length: answered }, (_, i) => {
		const n = String(i + 1).padStart(2, '0');
		return {
			id: `a:${run}:${n}`,
			at: new Date(at.getTime() + i * 1000).toISOString(),
			questionId: `q-${lesson}-${label}${n}`,
			contentSha: 'fixture',
			correct: i < right,
			ms: 1000,
			step
		};
	});
}

export const gateRun = (
	lesson: string,
	run: string,
	right: number,
	at: Date,
	answered = 10,
	of = 10
): Attempt[] => attempts(lesson, run, 't', right, at, answered, { kind: 'gate', lesson, run, of });

export const sectionRun = (
	lesson: string,
	section: string,
	run: string,
	at: Date,
	answered = 10
): Attempt[] =>
	attempts(lesson, run, `${section}-`, answered, at, answered, {
		kind: 'section',
		lesson,
		section,
		run,
		of: 10
	});

export function feed(state: State, list: Attempt[]): State {
	return list.reduce((s, a) => apply(s, a, new Date(a.at)).state, state);
}

export const bai0 = (): State =>
	feed(
		initialState({ curriculum: CURRICULUM }),
		gateRun('h0-00', 'g0', 10, new Date(T.getTime() - DAY))
	);

export const SECTIONS_1 = ['words', 'grammar', 'dialogue', 'listenSpeak', 'writing'];

export const ready = (): State =>
	SECTIONS_1.reduce(
		(s, section, i) =>
			feed(s, sectionRun('h1-01', section, `s${i}`, new Date(T.getTime() + i * 60_000))),
		bai0()
	);

export const placementBlock = (level: number, run: string, right: number, at: Date): Attempt[] =>
	Array.from({ length: 10 }, (_, i) => {
		const n = String(i + 1).padStart(2, '0');
		return {
			id: `a:${run}:${n}`,
			at: new Date(at.getTime() + i * 1000).toISOString(),
			questionId: `q-pl-${level}-${n}`,
			contentSha: 'fixture',
			correct: i < right,
			ms: 1000,
			step: { kind: 'placement', level, run, of: 10 }
		};
	});

export const placed2 = (): State =>
	feed(
		feed(initialState({ curriculum: CURRICULUM }), placementBlock(1, 'p1', 9, T)),
		placementBlock(2, 'p2', 5, new Date(T.getTime() + 600_000))
	);
