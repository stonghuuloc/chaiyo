<script module lang="ts">
	export const kind = 'word';
	export type Step = {
		kind: 'word';
		id: string;
		hanzi: string;
		pinyin: string;
		hanviet?: string;
		meaning: string;
		audio?: string;
		parts: { hanzi: string; pinyin: string; hanviet: string }[];
		components: string[];
		examples: { hanzi: string; pinyin: string; vi: string }[];
	};
</script>

<script lang="ts">
	import HanziStrokes from '#lib/components/HanziStrokes.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { StepProps } from '../types';

	let { step, cta, next }: StepProps<Step> = $props();

	// Loaded on first tap: the player module reads $app/env/public, which step views must not pull in at import time.
	const playClip = async (key: string) => (await import('#lib/audio/index.js')).play(key);

	const chars = $derived([...step.hanzi]);
	const pads: { play: () => Promise<void> }[] = $state([]);
	const ready: boolean[] = [];
	let running = false;
	const shown = performance.now();

	async function animate() {
		if (running) return;
		running = true;
		try {
			for (const pad of pads) await pad?.play();
		} finally {
			running = false;
		}
	}

	const onready = (i: number) => {
		if (ready[i]) return;
		ready[i] = true;
		if (ready.filter(Boolean).length === chars.length) void animate();
	};

	$effect(() => {
		cta({
			label: m.words_next(),
			caret: true,
			onclick: () =>
				next({
					questionId: step.id,
					pick: 'seen',
					correct: true,
					ms: Math.round(performance.now() - shown),
					card: { word: step.id, skill: 'the' }
				})
		});
	});
</script>

<div class="mt-5 flex flex-col items-center gap-3">
	<button
		type="button"
		data-part="strokes"
		class="flex justify-center gap-2"
		aria-label={step.hanzi}
		onclick={() => void animate()}
	>
		{#each chars as char, i (i)}
			<span class="block w-28">
				<HanziStrokes bind:this={pads[i]} {char} mode="animate" onprogress={() => onready(i)} />
			</span>
		{/each}
	</button>
	<div class="flex items-center gap-3">
		<span data-part="pinyin" class="text-title">{step.pinyin}</span>
		{#if step.audio}
			{@const clip = step.audio}
			<button
				type="button"
				data-part="listen"
				class="grid size-11 place-items-center rounded-full border border-ruled-line"
				aria-label={m.words_listen()}
				onclick={() => void playClip(clip)}
			>
				<svg class="size-5 fill-current" aria-hidden="true"><use href="#i-fill-speaker-high" /></svg
				>
			</button>
		{/if}
	</div>
	{#if step.hanviet}
		<span data-part="hanviet" class="text-label tracking-wider text-graphite uppercase"
			>{step.hanviet}</span
		>
	{/if}
	<p data-part="meaning" class="font-display text-headline">{step.meaning}</p>
</div>

{#if step.parts.length > 0}
	<section data-part="parts" class="mt-5">
		<h3 class="text-label font-semibold text-graphite">{m.words_parts()}</h3>
		<ul class="mt-2 flex flex-wrap gap-2">
			{#each step.parts as part, i (i)}
				<li class="flex flex-col items-center rounded-action border border-ruled-line px-3 py-2">
					<span class="font-hanzi text-[24px]">{part.hanzi}</span>
					<span class="text-caption">{part.pinyin}</span>
					<span class="text-caption text-graphite uppercase">{part.hanviet}</span>
				</li>
			{/each}
		</ul>
	</section>
{:else if step.components.length > 0}
	<section data-part="components" class="mt-5">
		<h3 class="text-label font-semibold text-graphite">{m.words_components()}</h3>
		<ul class="mt-2 flex flex-col gap-1">
			{#each step.components as c, i (i)}
				<li class="font-hanzi">{c}</li>
			{/each}
		</ul>
	</section>
{/if}

{#if step.examples.length > 0}
	<section data-part="examples" class="mt-5">
		<h3 class="text-label font-semibold text-graphite">{m.words_examples()}</h3>
		<ul class="mt-2 flex flex-col gap-2">
			{#each step.examples as ex, i (i)}
				<li data-part="example">
					<p class="font-hanzi text-[20px]">{ex.hanzi}</p>
					<p class="text-caption text-graphite">{ex.pinyin}</p>
					<p>{ex.vi}</p>
				</li>
			{/each}
		</ul>
	</section>
{/if}
