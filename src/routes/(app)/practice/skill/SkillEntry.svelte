<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';
	import { ENTRIES, noteFor, type SkillKey } from './skills';

	let { k, level }: { k: SkillKey; level?: number } = $props();

	const entry = $derived(ENTRIES[k]);
</script>

<article data-k={k} class="flex flex-col gap-4 pb-8">
	<header class="flex flex-col gap-2">
		<span class="text-sm flex items-center gap-2 text-pencil">
			<svg class="size-5" aria-hidden="true"><use href="#{entry.icon}" /></svg>
			{entry.label()}
		</span>
		<h1 class="text-2xl font-display">{entry.title()}</h1>
		<p class="text-graphite">{entry.lead()}</p>
	</header>

	<ol class="flex list-decimal flex-col gap-1 pl-5">
		{#each entry.steps as step, i (i)}
			<li>{step()}</li>
		{/each}
	</ol>

	<div
		data-part="sample"
		class="rounded-2xl flex flex-col gap-1 border border-ruled-line bg-white p-4"
	>
		<p class="text-sm text-pencil">{entry.sample.label()}</p>
		<p lang="zh" class="text-2xl">{entry.sample.hanzi()}</p>
		<p>{entry.sample.gloss()}</p>
	</div>

	<p
		data-part="demo-note"
		class="rounded-2xl border border-dashed border-ruled-line p-4 text-graphite"
	>
		{noteFor(k, level)}
	</p>

	<a
		href={resolve('/(app)/(tabs)/practice')}
		class="rounded-full bg-lantern-red p-4 text-center font-bold text-white">{m.skill_back()}</a
	>
</article>
