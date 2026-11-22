<script lang="ts">
	import { learnerLedger } from '#lib/learner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { State } from '#lib/study/index.js';
	import type { PageProps } from './$types';
	import SkillTiles from './SkillTiles.svelte';
	import TodayCard from './TodayCard.svelte';
	import { skillTiles } from './tiles';
	import { todayView } from './today';

	let { data }: PageProps = $props();

	let study = $state<State | null>(null);

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

<h1>{m.tab_practice()}</h1>
{#if study}
	<TodayCard view={todayView(study, new Date())} />
	<SkillTiles tiles={skillTiles(study, new Date())} />
{/if}
