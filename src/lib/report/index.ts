import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '#lib/supabase.js';
import { openQueue, type Queue } from './queue';
import { pushReport } from './supabase';
import type { Category, ReportContext } from './types';

const opened = new Map<string, Promise<Queue>>();
// Per client, the learner whose queue the app shell opened; an offline report skips the session lookup.
const current = new WeakMap<SupabaseClient, string>();

const flushOnOnline = (queue: Queue) => {
	const target: EventTarget = typeof window === 'undefined' ? new EventTarget() : window;
	const run = () => void queue.flush().catch(() => undefined);
	target.addEventListener('online', run);
	run();
	return () => target.removeEventListener('online', run);
};

// One queue per signed-in learner, in its own database; rows wait there until the server takes them.
export function openReports(
	session: { user: { id: string } },
	{ client = supabase, idb = indexedDB }: { client?: SupabaseClient; idb?: IDBFactory } = {}
) {
	const uid = session.user.id;
	const cached = opened.get(uid);
	if (cached) {
		current.set(client, uid);
		return cached;
	}

	const queue = (async () => {
		const q = await openQueue({ push: pushReport(client, uid), db: `chaiyo-reports-${uid}`, idb });
		let stop = () => {};
		const { data: auth } = client.auth.onAuthStateChange((event, next) => {
			if (event !== 'SIGNED_OUT' && (!next || next.user.id === uid)) return;
			stop();
			opened.delete(uid);
			if (current.get(client) === uid) current.delete(client);
			auth.subscription.unsubscribe();
		});
		stop = flushOnOnline(q);
		return q;
	})();
	opened.set(uid, queue);
	current.set(client, uid);
	queue.catch(() => {
		opened.delete(uid);
		if (current.get(client) === uid) current.delete(client);
	});
	return queue;
}

export async function report(
	context: ReportContext,
	category: Category,
	note: string,
	{ client = supabase, idb = indexedDB }: { client?: SupabaseClient; idb?: IDBFactory } = {}
) {
	const uid = current.get(client);
	const cached = uid ? opened.get(uid) : undefined;
	const queue = cached ? await cached : await openFromSession(client, idb);
	await queue.add({
		id: crypto.randomUUID(),
		...context,
		category,
		note: note.trim() || null,
		at: new Date().toISOString()
	});
}

async function openFromSession(client: SupabaseClient, idb: IDBFactory) {
	const { data } = await client.auth.getSession();
	if (!data.session) throw new Error('signed out');
	return openReports(data.session, { client, idb });
}
