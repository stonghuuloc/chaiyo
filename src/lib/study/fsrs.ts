import { DefaultScheduler, Rating, type DefaultSchedulerCard } from 'ts-fsrs';
import { z } from 'zod';

const scheduler = await DefaultScheduler({ enableFuzz: false });

const storedCard = z.object({
	stability: z.number().finite(),
	stabilityFast: z.number().finite(),
	difficulty: z.number().finite(),
	state: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
	scheduleStatus: z.enum(['new', 'learning', 'review']),
	dueAt: z.coerce.date(),
	lastReviewAt: z.coerce.date().nullable(),
	cardId: z.string(),
	reps: z.number().int().nonnegative(),
	lapses: z.number().int().nonnegative(),
	scheduledDays: z.number().finite().nonnegative(),
	learningStep: z.number().int().nonnegative()
});

export function review(
	stored: Record<string, unknown> | undefined,
	cardId: string,
	right: boolean,
	at: Date
) {
	const parsed: DefaultSchedulerCard | undefined = stored && storedCard.parse(stored);
	const now = parsed?.lastReviewAt && parsed.lastReviewAt > at ? parsed.lastReviewAt : at;
	const card = parsed ?? scheduler.newCard({ now, cardId });
	const next = scheduler.review({ card, grade: right ? Rating.Good : Rating.Again, now }).card;
	const fsrs = JSON.parse(JSON.stringify(next)) as Record<string, unknown>;
	return { due: fsrs.dueAt as string, fsrs };
}
