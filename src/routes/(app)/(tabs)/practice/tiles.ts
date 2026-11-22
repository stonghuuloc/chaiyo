import { currentLevel, session, type Skill, type State } from '#lib/study/index.js';

const SKILLS: Skill[] = ['the', 'nghe', 'viet'];

export type Tile = {
	key: Skill | 'noi' | 'doan';
	count?: number;
	open?: boolean;
	route: '/(app)/practice/session' | '/(app)/practice/skill';
	query: string;
};

export function skillTiles(state: State, now: Date): Tile[] {
	const counted = SKILLS.map((key) => ({
		key,
		count: session(state, { now, tz: state.tz, only: [key] }).length,
		route: '/(app)/practice/session' as const,
		query: `skill=${key}`
	}));
	return [
		...counted,
		{ key: 'noi', route: '/(app)/practice/skill', query: 'k=noi' },
		{
			key: 'doan',
			open: currentLevel(state) >= 3,
			route: '/(app)/practice/skill',
			query: 'k=doan'
		}
	];
}
