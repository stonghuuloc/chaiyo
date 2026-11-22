import { m } from '#lib/paraglide/messages.js';

export type WriteStep = {
	kind: 'write';
	id: string;
	char: string;
	round: 1 | 2;
	skipped: Set<string>;
};

export const writingSteps = (chars: string[], skipped: Set<string>): WriteStep[] =>
	chars.flatMap((char) =>
		([1, 2] as const).map((round) => ({
			kind: 'write' as const,
			id: `write-${char}-${round}`,
			char,
			round,
			skipped
		}))
	);

export const skippedFrom = (answers: Record<string, boolean>, chars: string[]) =>
	new Set(chars.filter((c) => [1, 2].some((r) => answers[`write-${c}-${r}`] === false)));

export const practised = (chars: string[], skipped: Set<string>) =>
	chars.filter((c) => !skipped.has(c));

export const joinChars = (list: string[]) =>
	list.length < 2
		? (list[0] ?? '')
		: m.writing_and({ rest: list.slice(0, -1).join(', '), last: list[list.length - 1] });
