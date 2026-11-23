<script lang="ts">
	import { learnerLedger } from '#lib/learner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { currentLevel, type State } from '#lib/study/index.js';
	import type { PageProps } from './$types';
	import LevelStrip from './LevelStrip.svelte';
	import NowCard from './NowCard.svelte';
	import { roadmapLevel } from './roadmap';
	import TopicGroups from './TopicGroups.svelte';

	let { data }: PageProps = $props();

	let study = $state<State | null>(null);
	const view = $derived(study ? roadmapLevel(study, currentLevel(study)) : null);

	$effect(() => {
		const session = data.session;
		study = null;
		if (!session) return;
		let live = true;
		let off = () => {};
		learnerLedger(session)
			.then((ledger) => {
				if (!live) return;
				const show = (next: State) => {
					study = next;
				};
				show(ledger.state());
				off = ledger.subscribe(show);
			})
			.catch(() => {});
		return () => {
			live = false;
			off();
		};
	});
</script>

<h1 class="text-display">{m.tab_roadmap()}</h1>
{#if view}
	<p data-part="roadmap-sum" class="mt-3 text-label text-muted">
		{view.header
			? m.chy49s1_header({ level: view.level, ...view.header })
			: m.chy49s1_header_bare({ level: view.level })}
	</p>
	<LevelStrip
		cells={view.strip}
		progress={view.header ? view.header.passed / view.header.total : 0}
	/>
	{#if view.empty}
		<p
			data-part="drafting"
			class="mt-5 rounded-cell bg-shaded-paper px-4 py-3 text-toast text-graphite"
		>
			{m.chy49s1_drafting({ level: view.level })}
		</p>
	{:else}
		{#if view.card}
			<NowCard card={view.card} />
		{/if}
		<TopicGroups groups={view.groups} />
	{/if}
{/if}
