<script lang="ts">
	import { learnerLedger } from '#lib/learner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { State } from '#lib/study/index.js';
	import type { PageProps } from './$types';
	import NextCard from './NextCard.svelte';
	import StreakChip from './StreakChip.svelte';
	import { todayState } from './today';
	import WeekStrip from './WeekStrip.svelte';
	import { weekView } from './week';

	let { data }: PageProps = $props();

	let study = $state<State | null>(null);
	const now = $derived(study ? new Date() : null);

	$effect(() => {
		const session = data.session;
		study = null;
		if (!session) return;
		let live = true;
		let off = () => {};
		learnerLedger(session)
			.then((ledger) => {
				if (!live) return;
				study = ledger.state();
				off = ledger.subscribe((next) => (study = next));
			})
			.catch(() => {});
		return () => {
			live = false;
			off();
		};
	});
</script>

<div class="flex items-center justify-between">
	<h1>{m.tab_today()}</h1>
	{#if study && now}
		<StreakChip view={weekView(study, now)} />
	{/if}
</div>
{#if study && now}
	<NextCard view={todayState(study, now)} />
	<WeekStrip view={weekView(study, now)} />
{/if}
