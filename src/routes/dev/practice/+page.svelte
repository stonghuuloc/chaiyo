<script lang="ts">
	import { sessionCards } from '../../(app)/practice/session/cards';
	import SkillTiles from '../../(app)/(tabs)/practice/SkillTiles.svelte';
	import TodayCard from '../../(app)/(tabs)/practice/TodayCard.svelte';
	import { skillTiles } from '../../(app)/(tabs)/practice/tiles';
	import { todayView } from '../../(app)/(tabs)/practice/today';
	import type { Skill } from '#lib/study/index.js';
	import { SCENARIOS, withLevel, type ScenarioKey } from './scenarios';

	let key = $state<ScenarioKey>('mix');
	let level = $state<1 | 3>(1);
	let skill = $state<Skill | null>(null);

	const now = $derived(new Date());
	const study = $derived(withLevel(SCENARIOS[key](now), level));
	const view = $derived(todayView(study, now));
	const cards = $derived(sessionCards(study, now, skill));
</script>

<div class="flex flex-col gap-4 p-4">
	<div class="flex gap-2">
		{#each Object.keys(SCENARIOS) as k (k)}
			<button data-part="scenario" type="button" onclick={() => (key = k as ScenarioKey)}
				>{k}</button
			>
		{/each}
	</div>
	<div class="flex gap-2">
		{#each [1, 3] as const as n (n)}
			<button data-part="level" type="button" onclick={() => (level = n)}>{n}</button>
		{/each}
	</div>
	<div class="flex gap-2">
		{#each [null, 'the', 'nghe', 'viet'] as const as s (s)}
			<button data-part="skill" type="button" onclick={() => (skill = s)}>{s ?? 'none'}</button>
		{/each}
	</div>
	<TodayCard {view} />
	<SkillTiles tiles={skillTiles(study, now)} />
	<ol>
		{#each cards as c, i (i)}
			<li data-part="session-card" data-skill={c.skill}>{c.word}</li>
		{/each}
	</ol>
	<pre data-part="state">{JSON.stringify(view)}</pre>
</div>
