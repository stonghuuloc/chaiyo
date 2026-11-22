import type { SessionCard, Skill, State } from '#lib/study/index.js';
import { session } from '#lib/study/index.js';

const SKILLS: Skill[] = ['the', 'nghe', 'viet'];

export const skillParam = (raw: string | null): Skill | null =>
	SKILLS.find((s) => s === raw) ?? null;

export const sessionCards = (state: State, now: Date, skill: Skill | null): SessionCard[] =>
	session(state, { now, tz: state.tz, only: skill ? [skill] : undefined });
