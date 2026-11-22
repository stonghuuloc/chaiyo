<script lang="ts">
	import NextCard from '../../(app)/(tabs)/today/NextCard.svelte';
	import { todayState } from '../../(app)/(tabs)/today/today';
	import { SCENARIOS, type ScenarioKey } from './scenarios';

	let key = $state<ScenarioKey>('reviews');

	const now = $derived(new Date());
	const view = $derived(todayState(SCENARIOS[key](now), now));
</script>

<div class="flex flex-col gap-4 p-4">
	<div class="flex flex-wrap gap-2">
		{#each Object.keys(SCENARIOS) as k (k)}
			<button data-part="scenario" type="button" onclick={() => (key = k as ScenarioKey)}
				>{k}</button
			>
		{/each}
	</div>
	<NextCard {view} />
	<pre data-part="state">{JSON.stringify(view, null, 2)}</pre>
</div>
