<script lang="ts">
	import { onMount } from 'svelte';
	import { openLedger, supabaseStore, syncWhenOnline, type Ledger } from '#lib/ledger/index.js';
	import { initialState } from '#lib/study/index.js';
	import { supabase } from '#lib/supabase';
	import { DEV_CURRICULUM } from './curriculum';
	import { finish, lines } from './finish';

	const initial = initialState({ curriculum: DEV_CURRICULUM, tz: 'Asia/Ho_Chi_Minh' });
	let ledger: Ledger | undefined;
	let view = $state(lines(initial, new Date(), 0));

	const refresh = () => ledger && (view = lines(ledger.state(), new Date(), ledger.pending()));

	onMount(() => {
		let stop = () => {};
		let unsubscribe = () => {};
		void openLedger({ initial, store: supabaseStore(supabase), db: 'chaiyo-ledger-dev' }).then(
			(l) => {
				ledger = l;
				unsubscribe = l.subscribe(refresh);
				stop = syncWhenOnline(l);
				refresh();
			}
		);
		return () => {
			stop();
			unsubscribe();
		};
	});

	async function complete() {
		if (!ledger) return;
		for (const a of finish(new Date(), () => crypto.randomUUID())) await ledger.record(a);
		refresh();
	}
</script>

<main class="max-w-xl mx-auto p-4 font-body">
	<h1 class="text-xl">/dev/ledger</h1>
	<button class="rounded my-2 border px-3 py-2" onclick={complete}>Hoàn thành Từ mới</button>
	<p data-testid="tu-moi">{view.tuMoi}</p>
	<p data-testid="streak">{view.streak}</p>
	<p data-testid="pending">{view.pending}</p>
</main>
