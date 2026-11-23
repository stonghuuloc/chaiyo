<script lang="ts">
	import { todayView } from '../../(app)/(tabs)/practice/today';
	import FriendsStrip from '../../(app)/(tabs)/today/FriendsStrip.svelte';
	import PracticeRow from '../../(app)/(tabs)/today/PracticeRow.svelte';
	import RoadmapSlice from '../../(app)/(tabs)/today/RoadmapSlice.svelte';
	import { roadmapSlice } from '../../(app)/(tabs)/today/roadmap';
	import { SCENARIOS, type ScenarioKey } from './scenarios';

	let key = $state<ScenarioKey>('ac3');

	const scenario = $derived(SCENARIOS[key]());
</script>

<div class="flex flex-col gap-4 p-4">
	<div class="flex flex-wrap gap-2">
		{#each Object.keys(SCENARIOS) as k (k)}
			<button data-part="scenario" type="button" onclick={() => (key = k as ScenarioKey)}
				>{k}</button
			>
		{/each}
	</div>
	<PracticeRow view={todayView(scenario.state, scenario.now)} />
	<RoadmapSlice rows={roadmapSlice(scenario.state)} />
	<FriendsStrip friends={scenario.friends} />
</div>
