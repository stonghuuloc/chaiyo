import type { Skill } from '#lib/study/index.js';

export type Mode = 'feedback' | 'test';

export type Answer = {
	questionId: string;
	pick: string | null;
	correct: boolean | null;
	ms: number;
	card?: { word: string; skill: Skill };
};

export type Cta = {
	label: string;
	disabled?: boolean;
	caret?: boolean;
	hint?: string;
	onclick: () => void;
	hold?: { onpress: () => void; onrelease: () => void };
};

export type StepProps<S> = {
	step: S;
	mode: Mode;
	last: boolean;
	cta: (c: Cta) => void;
	next: (answer?: Answer) => void;
};
