<script lang="ts">
	import FreezeRules from '../../(app)/(tabs)/today/FreezeRules.svelte';
	import StreakChip from '../../(app)/(tabs)/today/StreakChip.svelte';
	import WeekStrip from '../../(app)/(tabs)/today/WeekStrip.svelte';
	import { freezeRules } from '../../(app)/(tabs)/today/rules';
	import { weekView } from '../../(app)/(tabs)/today/week';
	import { SCENARIOS, type ScenarioKey } from './scenarios';

	let key = $state<ScenarioKey>('ac4');
	let rules = $state(false);

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
	<StreakChip {view} onrules={() => (rules = true)} />
	<WeekStrip {view} onrules={() => (rules = true)} />
	<FreezeRules open={rules} view={freezeRules(view)} onclose={() => (rules = false)} />
	<pre data-part="state">{JSON.stringify(view, null, 2)}</pre>
</div>
