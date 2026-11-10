import type { SupabaseClient } from '@supabase/supabase-js';
import type { Attempt, Skill, Step, WordSaved } from '#lib/study/index.js';
import type { Input, Store } from './types';

const COLS = 'id, at, question_id, content_sha, word, skill, correct, ms, answer, step';
const PAGE = 1000;

type Row = {
	id: string;
	at: string;
	question_id: string;
	content_sha: string;
	word: string | null;
	skill: Skill | null;
	correct: boolean | null;
	ms: number;
	answer: string | null;
	step: Step | null;
};

const toRow = (a: Attempt) => ({
	id: a.id,
	at: a.at,
	question_id: a.questionId,
	content_sha: a.contentSha,
	word: a.card?.word ?? null,
	skill: a.card?.skill ?? null,
	correct: a.correct,
	ms: a.ms,
	answer: a.answer ?? null,
	step: a.step ?? null
});

const fromRow = (r: Row): Attempt => ({
	id: r.id,
	at: new Date(r.at).toISOString(),
	questionId: r.question_id,
	contentSha: r.content_sha,
	correct: r.correct,
	ms: r.ms,
	...(r.answer !== null && { answer: r.answer }),
	...(r.word !== null && r.skill !== null && { card: { word: r.word, skill: r.skill } }),
	...(r.step !== null && { step: r.step })
});

type Result<T> = { data: T[] | null; error: { message: string } | null; status: number };

const fail = (e: { message: string }, status: number) =>
	Object.assign(new Error(e.message), { status });

async function paged<T>(query: (from: number) => PromiseLike<Result<T>>): Promise<T[]> {
	const out: T[] = [];
	for (let from = 0; ; from += PAGE) {
		const { data, error, status } = await query(from);
		if (error) throw fail(error, status);
		out.push(...(data ?? []));
		if ((data ?? []).length < PAGE) return out;
	}
}

export function supabaseStore(client: SupabaseClient): Store {
	return {
		async push(inputs) {
			const attempts = inputs.filter((i): i is Attempt => !('kind' in i)).map(toRow);
			const saves = inputs
				.filter((i): i is WordSaved => 'kind' in i)
				.map((s) => ({ word: s.word, saved_at: s.at }));
			if (attempts.length > 0) {
				const { error, status } = await client
					.from('attempts')
					.upsert(attempts, { onConflict: 'learner_id,id', ignoreDuplicates: true });
				if (error) throw fail(error, status);
			}
			if (saves.length > 0) {
				const { error, status } = await client
					.from('lexicon_saves')
					.upsert(saves, { onConflict: 'learner_id,word', ignoreDuplicates: true });
				if (error) throw fail(error, status);
			}
		},
		async pull() {
			const attempts = await paged<Row>((from) =>
				client
					.from('attempts')
					.select(COLS)
					.order('at')
					.order('id')
					.range(from, from + PAGE - 1)
			);
			const saves = await paged<{ word: string; saved_at: string }>((from) =>
				client
					.from('lexicon_saves')
					.select('word, saved_at')
					.order('saved_at')
					.order('word')
					.range(from, from + PAGE - 1)
			);
			const out: Input[] = attempts.map(fromRow);
			for (const s of saves)
				out.push({ kind: 'saved', word: s.word, at: new Date(s.saved_at).toISOString() });
			return out;
		}
	};
}
