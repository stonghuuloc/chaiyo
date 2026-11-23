<script lang="ts">
	import { onMount } from 'svelte';
	import { openLedger, supabaseStore, syncWhenOnline, type Ledger } from '#lib/ledger/index.js';
	import { initialState } from '#lib/study/index.js';
	import { supabase } from '#lib/supabase.js';
	import { DEV_CURRICULUM } from './curriculum';
	import { finish, ledgerDb, lines } from './finish';

	const initial = initialState({ curriculum: DEV_CURRICULUM, tz: 'Asia/Ho_Chi_Minh' });
	let ledger = $state<Ledger>();
	let failure = $state('');
	let view = $state(lines(initial, new Date(), 0));
	let who = $state('');

	const refresh = () => ledger && (view = lines(ledger.state(), new Date(), ledger.pending()));

	onMount(() => {
		let cancelled = false;
		let stop = () => {};
		let unsubscribe = () => {};
		let generation = 0;
		let uid: string | undefined;
		const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
			who = session ? `Tài khoản: ${session.user.email}` : 'Chưa đăng nhập';
			if (session?.user.id === uid) return;
			uid = session?.user.id;
			const current = ++generation;
			stop();
			unsubscribe();
			ledger = undefined;
			view = lines(initial, new Date(), 0);
			failure = '';
			if (!uid) return;
			// Never adopt the anonymous/legacy database into a signed-in account.
			void openLedger({
				initial,
				store: supabaseStore(supabase, uid),
				db: ledgerDb(uid)
			}).then(
				(l) => {
					if (cancelled || current !== generation) return;
					ledger = l;
					unsubscribe = l.subscribe(refresh);
					stop = syncWhenOnline({ ...l, sync: () => l.sync().finally(refresh) });
					refresh();
				},
				(e) => {
					if (!cancelled && current === generation) failure = String(e);
				}
			);
		});
		return () => {
			cancelled = true;
			auth.subscription.unsubscribe();
			stop();
			unsubscribe();
		};
	});

	async function complete() {
		const active = ledger;
		if (!active) return;
		for (const a of finish(new Date(), () => crypto.randomUUID())) await active.record(a);
		refresh();
		void active
			.sync()
			.finally(refresh)
			.catch(() => undefined);
	}
</script>

<main class="mx-auto max-w-column p-4 font-body">
	<h1 class="text-headline">/dev/ledger</h1>
	<button class="my-2 rounded-cell border px-3 py-2" onclick={complete} disabled={!ledger}
		>Hoàn thành Từ mới</button
	>
	<p data-testid="tu-moi">{view.tuMoi}</p>
	<p data-testid="streak">{view.streak}</p>
	<p data-testid="pending">{view.pending}</p>
	<p data-testid="who">{who}</p>
	{#if failure}<p data-testid="failure">{failure}</p>{/if}
</main>
