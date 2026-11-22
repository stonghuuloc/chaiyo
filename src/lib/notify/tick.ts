import type { Input } from '#lib/ledger/types';
import {
	initialState,
	rollover,
	type Curriculum,
	type State,
	type StudyEvent
} from '#lib/study/index.js';
import { foldInputs, yesterday } from './fold';

export type Learner = { id: string; tz: string };
export type Rolled = { learner: Learner; day: string; state: State; events: StudyEvent[] };
export type TickResult = { rolled: string[]; failed: string[] };
export type Deps = {
	curriculum: Curriculum;
	learners(): Promise<Learner[]>;
	inputs(id: string): Promise<Input[]>;
	record(r: Rolled): Promise<void>;
	remind(now: Date, rolled: Rolled[]): Promise<void>;
};

export const noRemind: Deps['remind'] = async () => {};

export async function tick(now: Date, d: Deps): Promise<TickResult> {
	const rolled: Rolled[] = [];
	const failed: string[] = [];
	for (const learner of await d.learners()) {
		try {
			const state = foldInputs(
				initialState({ curriculum: d.curriculum, tz: learner.tz }),
				await d.inputs(learner.id)
			);
			const day = yesterday(now, learner.tz);
			const r = { learner, day, ...rollover(state, day) };
			await d.record(r);
			rolled.push(r);
		} catch {
			failed.push(learner.id);
		}
	}
	await d.remind(now, rolled);
	return { rolled: rolled.map((r) => r.learner.id), failed };
}
