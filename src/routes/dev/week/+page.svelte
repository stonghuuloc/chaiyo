<script lang="ts">
	import StreakChip from '../../(app)/(tabs)/today/StreakChip.svelte';
	import WeekStrip from '../../(app)/(tabs)/today/WeekStrip.svelte';
	import { weekView } from '../../(app)/(tabs)/today/week';
	import { SCENARIOS, type ScenarioKey } from './scenarios';

	let key = $state<ScenarioKey>('ac4');

	const view = $derived.by(() => {
		const { state, now } = SCENARIOS[key]();
		return weekView(state, now);
	});
</script>

<div class="flex flex-col gap-4 p-4">
	<div class="flex flex-wrap gap-2">
		{#each Object.keys(SCENARIOS) as k (k)}
			<button data-part="scenario" type="button" onclick={() => (key = k as ScenarioKey)}
				>{k}</button
			>
		{/each}
	</div>
	<StreakChip {view} />
	<WeekStrip {view} />
	<pre data-part="state">{JSON.stringify(view, null, 2)}</pre>
</div>
