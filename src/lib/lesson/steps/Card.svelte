<script module lang="ts">
	export type Chip = { text: string; hanzi?: string; key: string | null };

	export type Step = {
		kind: 'card';
		id: string;
		kicker: string;
		title: string;
		explain: string;
		chips: Chip[];
		pairs: [Chip, Chip][];
	};

	export const kind = 'card';
</script>

<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { pinyinRuns } from '../pinyin-runs';
	import type { StepProps } from '../types';

	let { step, cta, next }: StepProps<Step> = $props();

	// Loaded on first tap: the player module reads $app/env/public, which step views must not pull in at import time.
	const playClip = async (key: string) => (await import('#lib/audio/index.js')).play(key);

	$effect(() => {
		cta({ label: m.primer_card_next(), caret: true, onclick: () => next() });
	});
</script>

{#snippet prose(text: string)}
	{#each pinyinRuns(text) as run, i (i)}
		{#if run.pinyin}<span class="font-pinyin">{run.text}</span>{:else}{run.text}{/if}
	{/each}
{/snippet}

{#snippet chip(c: Chip)}
	<button
		type="button"
		class="flex min-h-14 min-w-16 flex-col items-center justify-center rounded-action border border-ruled-line bg-white px-4 py-2 disabled:opacity-40"
		data-part="chip"
		disabled={c.key === null}
		onclick={() => c.key !== null && playClip(c.key).catch(() => {})}
	>
		<span class="font-pinyin text-[24px]">{c.text}</span>
		{#if c.hanzi}
			<span class="font-hanzi text-[20px]" lang="zh">{c.hanzi}</span>
		{/if}
	</button>
{/snippet}

<p class="mt-5 text-label text-pencil">
	{step.kicker}
</p>
<h2 class="mt-1 font-display text-headline">{@render prose(step.title)}</h2>
<p class="mt-3">{@render prose(step.explain)}</p>

{#if step.chips.length > 0}
	<div class="mt-5 flex flex-wrap gap-2" data-part="chips">
		{#each step.chips as c, i (i)}
			{@render chip(c)}
		{/each}
	</div>
{/if}

{#if step.pairs.length > 0}
	<ul class="mt-5 flex flex-col gap-2" data-part="pairs">
		{#each step.pairs as pair, i (i)}
			<li class="flex gap-2" data-part="pair">
				{#each pair as c, j (j)}
					{@render chip(c)}
				{/each}
			</li>
		{/each}
	</ul>
{/if}
