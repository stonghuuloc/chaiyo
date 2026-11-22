<script lang="ts">
	import { sessionCards } from '../../(app)/practice/session/cards';
	import SkillTiles from '../../(app)/(tabs)/practice/SkillTiles.svelte';
	import ThiChips from '../../(app)/(tabs)/practice/ThiChips.svelte';
	import TodayCard from '../../(app)/(tabs)/practice/TodayCard.svelte';
	import WordsLink from '../../(app)/(tabs)/practice/WordsLink.svelte';
	import { thiChips } from '../../(app)/(tabs)/practice/thi';
	import { skillTiles } from '../../(app)/(tabs)/practice/tiles';
	import { todayView } from '../../(app)/(tabs)/practice/today';
	import { wordsPreview } from '../../(app)/(tabs)/practice/words';
	import type { Skill } from '#lib/study/index.js';
	import { SCENARIOS, withLevel, type ScenarioKey } from './scenarios';

	let key = $state<ScenarioKey>('mix');
	let level = $state<1 | 3 | 5>(1);
	let ready = $state(false);
	let skill = $state<Skill | null>(null);

	const now = $derived(new Date());
	const study = $derived(withLevel(SCENARIOS[key](now), level, ready));
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
		{#each [1, 3, 5] as const as n (n)}
			<button data-part="level" type="button" onclick={() => (level = n)}>{n}</button>
		{/each}
		<button data-part="ready" type="button" aria-pressed={ready} onclick={() => (ready = !ready)}
			>ready</button
		>
	</div>
	<div class="flex gap-2">
		{#each [null, 'the', 'nghe', 'viet'] as const as s (s)}
			<button data-part="skill" type="button" onclick={() => (skill = s)}>{s ?? 'none'}</button>
		{/each}
	</div>
	<TodayCard {view} />
	<SkillTiles tiles={skillTiles(study, now)} />
	<ThiChips view={thiChips(study)} />
	<WordsLink view={wordsPreview(study, now)} />
	<ol>
		{#each cards as c, i (i)}
			<li data-part="session-card" data-skill={c.skill}>{c.word}</li>
		{/each}
	</ol>
	<pre data-part="state">{JSON.stringify(view)}</pre>
</div>
