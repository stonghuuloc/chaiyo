import type { BadgeId } from './badges';

export type Skill = 'the' | 'nghe' | 'viet';

export type Curriculum = {
	lessons: { id: string; level: number; sections: string[]; words: string[]; testOut?: boolean }[];
};

export type Step =
	| { kind: 'section'; lesson: string; section: string; run: string; of: number }
	| { kind: 'gate'; lesson: string; run: string; of: number }
	| { kind: 'placement'; level: number; run: string; of: number }
	| { kind: 'practice'; run: string; of: number }
	| { kind: 'mock'; level: number; mode: 'exam' | 'practice' };

export type Attempt = {
	id: string;
	at: string;
	questionId: string;
	contentSha: string;
	correct: boolean | null;
	ms: number;
	answer?: string;
	card?: { word: string; skill: Skill };
	tone?: 1 | 2 | 3 | 4;
	step?: Step;
};

export type WordSaved = { kind: 'saved'; word: string; at: string };

export type Card = { due: string; first: string; fsrs: Record<string, unknown> };

export type LessonProgress = { unlocked: boolean; passed: boolean; done: string[]; best?: number };

export type ToneTally = Record<1 | 2 | 3 | 4, { right: number; total: number }>;

export type State = {
	badges: Partial<Record<BadgeId, string>>;
	written: number;
	lexicon: Record<string, { saved: boolean; cards: Partial<Record<Skill, Card>> }>;
	curriculum: Curriculum;
	lessons: Record<string, LessonProgress>;
	placed: number;
	tz: string;
	streak: { count: number; last?: string; freezes: number; through?: string };
	runs: Record<string, { step: Step; answers: Record<string, boolean>; closed?: true }>;
	tones: ToneTally;
};

export type StudyEvent =
	| { type: 'CardScheduled'; word: string; skill: Skill; due: string }
	| { type: 'SectionDone'; lesson: string; section: string }
	| { type: 'GatePassed'; lesson: string; score: number }
	| { type: 'LessonUnlocked'; lesson: string }
	| { type: 'DayCounted'; day: string; streak: number }
	| { type: 'FreezeEarned'; freezes: number }
	| { type: 'FreezeSpent'; day: string; freezes: number }
	| { type: 'StreakReset'; day: string }
	| { type: 'BadgeEarned'; badge: BadgeId; title: string };

export type SessionCard = { word: string; skill: Skill };
