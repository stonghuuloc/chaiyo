import { DefaultScheduler, Rating } from 'ts-fsrs';

const scheduler = await DefaultScheduler({ enableFuzz: false });

type Stored = Record<string, unknown>;

const toDate = (v: unknown) => (v == null ? null : new Date(v as string));

export function review(stored: Stored | undefined, cardId: string, right: boolean, at: Date) {
	const last = toDate(stored?.lastReviewAt);
	const now = last && last > at ? last : at;
	const card = stored
		? ({
				...stored,
				dueAt: toDate(stored.dueAt),
				lastReviewAt: toDate(stored.lastReviewAt)
			} as never)
		: scheduler.newCard({ now, cardId });
	const next = scheduler.review({ card, grade: right ? Rating.Good : Rating.Again, now }).card;
	const fsrs = JSON.parse(JSON.stringify(next)) as Stored;
	return { due: fsrs.dueAt as string, fsrs };
}
