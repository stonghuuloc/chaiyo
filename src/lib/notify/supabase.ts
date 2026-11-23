import type { SupabaseClient } from '@supabase/supabase-js';
import { PAGE, pullInputs } from '#lib/ledger/supabase.js';
import type { Curriculum } from '#lib/study/index.js';
import { CHANNEL_NAMES } from './channel';
import type { Marks } from './marks';
import type { Deps, Learner } from './tick';

export function supabaseDeps(
	client: SupabaseClient,
	curriculum: Curriculum,
	remind: Deps['remind']
): Deps {
	return {
		curriculum,
		async learners() {
			const out: Learner[] = [];
			for (let from = 0; ; from += PAGE) {
				const { data, error } = await client
					.from('settings')
					.select('learner_id, tz, reminder_time, remind_push, remind_email, remind_telegram')
					.order('learner_id')
					.range(from, from + PAGE - 1);
				if (error) throw new Error(error.message);
				const rows = (data ?? []) as {
					learner_id: string;
					tz: string;
					reminder_time: string;
					remind_push: boolean;
					remind_email: boolean;
					remind_telegram: boolean;
				}[];
				out.push(
					...rows.map((r) => ({
						id: r.learner_id,
						tz: r.tz,
						remindAt: r.reminder_time.slice(0, 5),
						channels: CHANNEL_NAMES.filter((n) => r[`remind_${n}`])
					}))
				);
				if (rows.length < PAGE) return out;
			}
		},
		inputs: (id) => pullInputs(client, id),
		async record(r) {
			const { error } = await client.from('streak_rollovers').upsert(
				{
					learner_id: r.learner.id,
					day: r.day,
					count: r.state.streak.count,
					freezes: r.state.streak.freezes,
					events: r.events
				},
				{ onConflict: 'learner_id,day', ignoreDuplicates: true }
			);
			if (error) throw new Error(error.message);
		},
		remind
	};
}

export function supabaseMarks(client: SupabaseClient): Marks {
	return {
		async claim(learnerId, day) {
			const { data, error } = await client
				.from('reminders_sent')
				.upsert(
					{ learner_id: learnerId, day },
					{ onConflict: 'learner_id,day', ignoreDuplicates: true }
				)
				.select('learner_id');
			if (error) throw new Error(error.message);
			return (data ?? []).length === 1;
		}
	};
}
