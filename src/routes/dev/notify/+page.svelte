<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { runDemo } from './run';

	let now = $state(new Date().toISOString());
	let log = $state<string[]>([]);
	let failure = $state('');

	const run = async () => {
		failure = '';
		try {
			log = (await runDemo(new Date(now))).log;
		} catch (e) {
			failure = e instanceof Error ? e.message : String(e);
		}
	};
</script>

<main>
	<h1>{m.chy47s1_title()}</h1>
	<label>
		{m.chy47s1_now()}
		<input bind:value={now} />
	</label>
	<button type="button" onclick={run}>{m.chy47s1_run()}</button>
	{#if failure}<p role="alert">{failure}</p>{/if}
	{#if log.length === 0}
		<p>{m.chy47s1_log_empty()}</p>
	{:else}
		<ol>
			{#each log as line, i (i)}<li>{line}</li>{/each}
		</ol>
	{/if}
</main>
