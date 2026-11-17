<script module lang="ts">
	export type Step = {
		kind: 'grammar';
		id: string;
		kicker: string;
		title: string;
		rows: string[][];
		labels: string[];
		lead: string;
		more: string;
		examples: { hanzi: string; pinyin: string; vi: string; audio?: string }[];
		pitfall?: { wrong: string; right: string };
		drills: number;
	};

	export const kind = 'grammar';
</script>

<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { StepProps } from '../types';

	let { step, cta, next }: StepProps<Step> = $props();

	// Loaded on first tap: the player module reads $app/env/public, which step views must not pull in at import time.
	const playClip = async (key: string) => (await import('#lib/audio/index.js')).play(key);

	let open = $state(false);
	const sep = $derived(step.rows.length > 1 ? '→' : '+');

	$effect(() => {
		cta({
			label: m.grammar_start(),
			hint: m.grammar_drills({ n: step.drills }),
			caret: true,
			onclick: () => next()
		});
	});
</script>

<p class="mt-5 text-label font-semibold tracking-wider text-lantern-red-text uppercase">
	{step.kicker}
</p>
<h2 class="mt-1 font-display text-headline">{step.title}</h2>

<div class="mt-5 flex flex-col gap-2">
	{#each step.rows as row, r (r)}
		<div class="flex flex-wrap items-start gap-2" data-part="row">
			{#each row as slot, c (c)}
				{#if c > 0}
					<span class="self-center font-hanzi text-[22px] text-faint-pencil">{sep}</span>
				{/if}
				<span
					class="flex min-w-16 flex-col items-center gap-1 rounded-action border border-ruled-line bg-white/40 px-3 py-2"
					data-part="slot"
				>
					<span class="font-hanzi text-[24px]">{slot}</span>
					{#if step.labels[c]}
						<span class="text-caption text-graphite">{step.labels[c]}</span>
					{/if}
				</span>
			{/each}
		</div>
	{/each}
</div>

<p class="mt-5">{step.lead}</p>

{#if step.more}
	<button
		type="button"
		class="mt-2 min-h-11 text-chip font-semibold text-lantern-red-text"
		data-part="more-toggle"
		aria-expanded={open}
		aria-controls="grammar-more"
		onclick={() => (open = !open)}
	>
		{m.grammar_more()}
	</button>
	<p id="grammar-more" hidden={!open} class="mt-2 text-graphite">{step.more}</p>
{/if}

<h3 class="mt-6 text-label font-semibold tracking-wider text-graphite uppercase">
	{m.grammar_examples()}
</h3>
<ul class="mt-2 flex flex-col gap-2">
	{#each step.examples as ex (ex.hanzi)}
		<li
			class="flex items-center gap-3 rounded-action border border-ruled-line bg-white/40 px-3 py-2"
		>
			<div class="flex flex-1 flex-col">
				<span class="font-hanzi text-[22px]">{ex.hanzi}</span>
				<span class="font-pinyin text-chip text-graphite">{ex.pinyin}</span>
				<span class="text-chip text-graphite">{ex.vi}</span>
			</div>
			{#if ex.audio}
				<button
					type="button"
					class="flex size-11 shrink-0 items-center justify-center rounded-pill border border-ruled-line"
					data-part="play"
					aria-label={m.grammar_play({ hanzi: ex.hanzi })}
					onclick={() => playClip(ex.audio!).catch(() => {})}
				>
					<svg class="size-5 fill-current" aria-hidden="true"
						><use href="#i-fill-speaker-high" /></svg
					>
				</button>
			{/if}
		</li>
	{/each}
</ul>

{#if step.pitfall}
	<h3 class="mt-6 text-label font-semibold tracking-wider text-graphite uppercase">
		{m.grammar_pitfalls()}
	</h3>
	<div class="mt-2 flex flex-wrap gap-2">
		<div
			class="flex min-h-14 flex-col justify-center gap-1 rounded-action border-2 border-lantern-red bg-white px-3 py-2"
			data-part="pitfall-wrong"
		>
			<span class="font-hanzi text-[22px]">{step.pitfall.wrong}</span>
			<span class="text-caption font-semibold text-lantern-red-text">{m.grammar_wrong()}</span>
		</div>
		<div
			class="flex min-h-14 flex-col justify-center gap-1 rounded-action border-2 border-ink bg-white px-3 py-2"
			data-part="pitfall-right"
		>
			<span class="font-hanzi text-[22px]">{step.pitfall.right}</span>
			<span class="text-caption font-semibold">{m.grammar_right()}</span>
		</div>
	</div>
{/if}
