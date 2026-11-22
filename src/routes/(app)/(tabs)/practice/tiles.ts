import { resolve } from '$app/paths';
import { currentLevel, session, type Skill, type State } from '#lib/study/index.js';

const SKILLS: Skill[] = ['the', 'nghe', 'viet'];

export type Tile = {
	key: Skill | 'noi' | 'doan';
	count?: number;
	open?: boolean;
	href: string;
};

export function skillTiles(state: State, now: Date): Tile[] {
	const counted = SKILLS.map((key) => ({
		key,
		count: session(state, { now, tz: state.tz, only: [key] }).length,
		href: `${resolve('/(app)/practice/session')}?skill=${key}`
	}));
	const entry = resolve('/(app)/practice/skill');
	return [
		...counted,
		{ key: 'noi', href: `${entry}?k=noi` },
		{ key: 'doan', open: currentLevel(state) >= 3, href: `${entry}?k=doan` }
	];
}
