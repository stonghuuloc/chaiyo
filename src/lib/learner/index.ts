import type { SupabaseClient } from '@supabase/supabase-js';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { openLedger, supabaseStore, syncWhenOnline, type Ledger } from '#lib/ledger/index.js';
import { initialState } from '#lib/study/index.js';
import { supabase } from '#lib/supabase.js';

const opened = new Map<string, Promise<Ledger>>();

// One Ledger per signed-in learner, in its own database; there is no shared fallback, so a missing session has no Ledger.
export function learnerLedger(
	session: { user: { id: string } },
	{ client = supabase, idb = indexedDB }: { client?: SupabaseClient; idb?: IDBFactory } = {}
) {
	const uid = session.user.id;
	const cached = opened.get(uid);
	if (cached) return cached;

	const ledger = (async () => {
		const { data } = await client.from('settings').select('tz').eq('learner_id', uid).maybeSingle();
		const tz = data?.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
		const remote = supabaseStore(client, uid);
		const own = async () => {
			const { data: now } = await client.auth.getSession();
			if (now.session?.user.id !== uid) throw new Error('signed in as another learner');
		};
		const l = await openLedger({
			initial: initialState({ curriculum: CURRICULUM, tz }),
			store: {
				push: async (inputs) => (await own(), remote.push(inputs)),
				pull: async () => (await own(), remote.pull())
			},
			db: `chaiyo-ledger-${uid}`,
			idb
		});
		let stop = () => {};
		const { data: auth } = client.auth.onAuthStateChange((event, next) => {
			if (event !== 'SIGNED_OUT' && (!next || next.user.id === uid)) return;
			stop();
			opened.delete(uid);
			auth.subscription.unsubscribe();
		});
		stop = syncWhenOnline(l);
		return l;
	})();
	opened.set(uid, ledger);
	ledger.catch(() => opened.delete(uid));
	return ledger;
}
