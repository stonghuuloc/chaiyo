import type { Row } from '#lib/ledger/idb.js';
import type { Attempt } from '#lib/study/index.js';

export const attemptLines = (rows: Row[]) =>
	rows
		.map((r) => r.input)
		.filter((i): i is Attempt => !('kind' in i))
		.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
		.map((a) => ({ id: a.id, step: a.questionId, pick: a.answer ?? null, correct: a.correct }));
