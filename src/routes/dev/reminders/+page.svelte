<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { ChannelName, Reminder } from '#lib/notify/channel.js';
	import type { RemindResult } from '#lib/notify/remind.js';
	import { localDate } from '#lib/study/index.js';
	import { runReminders, runTicks, TZ } from './run';

	let now = $state(new Date().toISOString());
	let outcome = $state<{ result: RemindResult; messages: Record<ChannelName, Reminder[]> }>();
	let ticks = $state<Awaited<ReturnType<typeof runTicks>>>();
	let failure = $state('');

	const run = async () => {
		failure = '';
		try {
			ticks = undefined;
			outcome = await runReminders(new Date(now));
		} catch (e) {
			failure = e instanceof Error ? e.message : String(e);
		}
	};

	const runFour = async () => {
		failure = '';
		try {
			outcome = undefined;
			ticks = await runTicks(localDate(new Date(now), TZ));
		} catch (e) {
			failure = e instanceof Error ? e.message : String(e);
		}
	};

	const ids = (list: string[]) => list.join(', ') || '-';
</script>

<main>
	<h1>{m.chy47s2_title()}</h1>
	<label>
		{m.chy47s2_now()}
		<input bind:value={now} />
	</label>
	<button type="button" onclick={run}>{m.chy47s2_run()}</button>
	<button type="button" onclick={runFour}>{m.chy47s3_ticks()}</button>
	{#if failure}<p role="alert">{failure}</p>{/if}
	{#if ticks}
		<ul>
			{#each ticks.ticks as t (t.at)}
				<li>
					{m.chy47s3_tick({
						at: t.at,
						sent: ids(t.result.sent),
						skipped: ids(t.result.skipped.map((s) => `${s.id}:${s.reason}`))
					})}
				</li>
			{/each}
		</ul>
		<ul>
			{#each Object.entries(ticks.messages) as [name, list] (name)}
				<li>{m.chy47s2_channel({ name, n: list.length })}</li>
			{/each}
		</ul>
	{:else if !outcome}
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
