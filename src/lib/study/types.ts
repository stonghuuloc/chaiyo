export type Skill = 'the' | 'nghe' | 'viet';

export type Curriculum = {
	lessons: { id: string; level: number; sections: string[]; words: string[]; testOut?: boolean }[];
};

export type Step =
	| { kind: 'section'; lesson: string; section: string; run: string; of: number }
	| { kind: 'gate'; lesson: string; run: string; of: number }
	| { kind: 'placement'; level: number; run: string; of: number }
	| { kind: 'practice'; run: string; of: number };

export type Attempt = {
	id: string;
	at: string;
	questionId: string;
	contentSha: string;
	correct: boolean | null;
	ms: number;
	answer?: string;
	card?: { word: string; skill: Skill };
	step?: Step;
};

export type WordSaved = { kind: 'saved'; word: string; at: string };

export type Card = { due: string; first: string; fsrs: Record<string, unknown> };

export type LessonProgress = { unlocked: boolean; passed: boolean; done: string[]; best?: number };

export type State = {
	lexicon: Record<string, { saved: boolean; cards: Partial<Record<Skill, Card>> }>;
	curriculum: Curriculum;
	lessons: Record<string, LessonProgress>;
	placed: number;
	tz: string;
	streak: { count: number; last?: string };
	runs: Record<string, { step: Step; answers: Record<string, boolean>; closed?: true }>;
};

export type StudyEvent =
	| { type: 'CardScheduled'; word: string; skill: Skill; due: string }
	| { type: 'SectionDone'; lesson: string; section: string }
	| { type: 'GatePassed'; lesson: string; score: number }
	| { type: 'LessonUnlocked'; lesson: string }
	| { type: 'DayCounted'; day: string; streak: number };

export type SessionCard = { word: string; skill: Skill };
