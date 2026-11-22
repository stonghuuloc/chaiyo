import type { SupabaseClient } from '@supabase/supabase-js';
import type { Report } from './types';

// Same error shape as the Ledger's store: status rides on the Error.
const fail = (e: { message: string }, status: number) =>
	Object.assign(new Error(e.message), { status });

export function pushReport(client: SupabaseClient, learnerId: string) {
	const own = async () => {
		const { data, error } = await client.auth.getSession();
		if (error) throw error;
		if (!learnerId || data.session?.user.id !== learnerId)
			throw new Error('signed in as another learner');
	};

	return async (r: Report) => {
		await own();
		const { error, status } = await client.from('error_reports').insert({
			id: r.id,
			lesson_id: r.lesson,
			step_id: r.step,
			word_id: r.word,
			content_sha: r.contentSha,
			category: r.category,
			note: r.note,
			created_at: r.at
		});
		// A replay of a report the server already has is sent, not a failure.
		if (!error || error.code === '23505') return;
		throw fail(error, status);
	};
}
