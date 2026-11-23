<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { resolve } from '$app/paths';
	import { ENTRIES, noteFor, type SkillKey } from './skills';

	let { k, level, lv }: { k: SkillKey; level?: number; lv?: number } = $props();

	const entry = $derived(ENTRIES[k]);
</script>

<article data-k={k} class="flex flex-col gap-4 pb-8">
	<header class="flex flex-col gap-2">
		<span class="flex items-center gap-2 text-label text-pencil">
			<svg class="size-5" aria-hidden="true"><use href="#{entry.icon}" /></svg>
			{entry.label()}
		</span>
		<h1 class="font-display text-headline">{entry.title()}</h1>
		<p class="text-graphite">{entry.lead()}</p>
	</header>

	<ol class="flex list-decimal flex-col gap-1 pl-5">
		{#each entry.steps as step, i (i)}
			<li>{step()}</li>
		{/each}
	</ol>

	<div
		data-part="sample"
		class="flex flex-col gap-1 rounded-cell border border-ruled-line bg-white p-4"
	>
		<p class="text-label text-pencil">{entry.sample.label()}</p>
		<p lang="zh" class="text-headline">{entry.sample.hanzi()}</p>
		<p>{entry.sample.gloss()}</p>
	</div>

	<p
		data-part="demo-note"
		class="rounded-cell border border-dashed border-ruled-line p-4 text-graphite"
	>
		{noteFor(k, level, lv)}
	</p>

	<a
		href={resolve('/(app)/(tabs)/practice')}
		class="rounded-full bg-lantern-red p-4 text-center font-bold text-white">{m.skill_back()}</a
	>
</article>
