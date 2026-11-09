export type Skill = 'the' | 'nghe' | 'viet';

export type Attempt = {
	id: string;
	at: string;
	questionId: string;
	contentSha: string;
	correct: boolean | null;
	ms: number;
	answer?: string;
	card?: { word: string; skill: Skill };
};

export type WordSaved = { kind: 'saved'; word: string; at: string };

export type Card = { due: string; fsrs: Record<string, unknown> };

export type State = {
	lexicon: Record<string, { saved: boolean; cards: Partial<Record<Skill, Card>> }>;
};

export type StudyEvent = { type: 'CardScheduled'; word: string; skill: Skill; due: string };

export type SessionCard = { word: string; skill: Skill };
