<script lang="ts">
	import { onMount } from 'svelte';
	import { openLedger, supabaseStore, syncWhenOnline, type Ledger } from '#lib/ledger/index.js';
	import { initialState } from '#lib/study/index.js';
	import { supabase } from '#lib/supabase.js';
	import { DEV_CURRICULUM } from './curriculum';
	import { finish, ledgerDb, lines } from './finish';

	const initial = initialState({ curriculum: DEV_CURRICULUM, tz: 'Asia/Ho_Chi_Minh' });
	let ledger: Ledger | undefined;
	let failure = $state('');
	let view = $state(lines(initial, new Date(), 0));
	let who = $state('');

	const refresh = () => ledger && (view = lines(ledger.state(), new Date(), ledger.pending()));

	onMount(() => {
		let cancelled = false;
		let stop = () => {};
		let unsubscribe = () => {};
		supabase.auth
			.getSession()
			.then(({ data }) => {
				who = data.session?.user.email ? `Tài khoản: ${data.session.user.email}` : 'Chưa đăng nhập';
				return openLedger({
					initial,
					store: supabaseStore(supabase),
					db: ledgerDb(data.session?.user.id)
				});
			})
			.then(
			(l) => {
				if (cancelled) return;
				ledger = l;
				unsubscribe = l.subscribe(refresh);
				stop = syncWhenOnline({ ...l, sync: () => l.sync().finally(refresh) });
				refresh();
			},
			(e) => (failure = String(e))
		);
		return () => {
			cancelled = true;
			stop();
			unsubscribe();
		};
	});

	async function complete() {
		if (!ledger) return;
		for (const a of finish(new Date(), () => crypto.randomUUID())) await ledger.record(a);
		refresh();
		void ledger.sync().then(refresh, () => undefined);
	}
</script>

<main class="max-w-xl mx-auto p-4 font-body">
	<h1 class="text-xl">/dev/ledger</h1>
	<button class="rounded my-2 border px-3 py-2" onclick={complete}>Hoàn thành Từ mới</button>
	<p data-testid="tu-moi">{view.tuMoi}</p>
	<p data-testid="streak">{view.streak}</p>
	<p data-testid="pending">{view.pending}</p>
	<p data-testid="who">{who}</p>
	{#if failure}<p data-testid="failure">{failure}</p>{/if}
</main>
