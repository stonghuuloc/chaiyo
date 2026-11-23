<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { ChannelName, Reminder } from '#lib/notify/channel.js';
	import type { RemindResult } from '#lib/notify/remind.js';
	import { runReminders } from './run';

	let now = $state(new Date().toISOString());
	let outcome = $state<{ result: RemindResult; messages: Record<ChannelName, Reminder[]> }>();
	let failure = $state('');

	const run = async () => {
		failure = '';
		try {
			outcome = await runReminders(new Date(now));
		} catch (e) {
			failure = e instanceof Error ? e.message : String(e);
		}
	};
</script>

<main>
	<h1>{m.chy47s2_title()}</h1>
	<label>
		{m.chy47s2_now()}
		<input bind:value={now} />
	</label>
	<button type="button" onclick={run}>{m.chy47s2_run()}</button>
	{#if failure}<p role="alert">{failure}</p>{/if}
	{#if !outcome}
		<p>{m.chy47s2_empty()}</p>
	{:else}
		<ul>
			{#each outcome.result.sent as id (id)}<li>{m.chy47s2_sent({ id })}</li>{/each}
			{#each outcome.result.skipped as s (s.id)}
				<li>{m.chy47s2_skipped({ id: s.id, reason: s.reason })}</li>
			{/each}
		</ul>
		<ul>
			{#each Object.entries(outcome.messages) as [name, list] (name)}
				<li>{m.chy47s2_channel({ name, n: list.length })}</li>
			{/each}
		</ul>
	{/if}
</main>
