<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { supabase } from '#lib/supabase.js';
	import { runEmail } from './run';

	let result = $state('');

	const send = async () => {
		try {
			result = await runEmail(() => supabase.functions.invoke('email-test'));
		} catch (e) {
			result = m.chy48s2_result({ state: e instanceof Error ? e.message : String(e) });
		}
	};
</script>

<main>
	<h1>{m.chy48s2_title()}</h1>
	<button type="button" onclick={send}>{m.chy48s2_test()}</button>
	{#if result}<p>{result}</p>{/if}
</main>
