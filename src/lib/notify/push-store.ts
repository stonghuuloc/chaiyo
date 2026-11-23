import type { SupabaseClient } from '@supabase/supabase-js';
import type { PushSub, PushSubs } from './web-push';

export function supabasePushSubs(client: SupabaseClient): PushSubs {
	return {
		async list(learnerId) {
			const { data, error } = await client
				.from('push_subscriptions')
				.select('endpoint, p256dh, auth')
				.eq('learner_id', learnerId);
			if (error) throw new Error(error.message);
			return (data ?? []) as PushSub[];
		},
		async remove(learnerId, endpoint) {
			const { error } = await client
				.from('push_subscriptions')
				.delete()
				.eq('learner_id', learnerId)
				.eq('endpoint', endpoint);
			if (error) throw new Error(error.message);
		}
	};
}
