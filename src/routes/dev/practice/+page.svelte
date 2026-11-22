<script lang="ts">
	import TodayCard from '../../(app)/(tabs)/practice/TodayCard.svelte';
	import { todayView } from '../../(app)/(tabs)/practice/today';
	import { SCENARIOS, type ScenarioKey } from './scenarios';

	let key = $state<ScenarioKey>('mix');

	const view = $derived.by(() => {
		const now = new Date();
		return todayView(SCENARIOS[key](now), now);
	});
</script>

<div class="flex flex-col gap-4 p-4">
	<div class="flex gap-2">
		{#each Object.keys(SCENARIOS) as k (k)}
			<button data-part="scenario" type="button" onclick={() => (key = k as ScenarioKey)}
				>{k}</button
			>
		{/each}
	</div>
	<TodayCard {view} />
	<pre data-part="state">{JSON.stringify(view)}</pre>
</div>
