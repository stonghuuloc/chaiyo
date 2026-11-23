<script module lang="ts">
	export const kind = 'order';
	export type Step = {
		kind: 'order';
		id: string;
		ask: string;
		title: string;
		tiles: string[];
		answer: string;
	};
</script>

<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { choiceCta } from '../choice';
	import type { StepProps } from '../types';

	let { step, mode, last, cta, next }: StepProps<Step> = $props();

	let placed = $state<number[]>([]);
	let phase = $state<'placing' | 'graded'>('placing');
	const shown = performance.now();

	const full = $derived(placed.length === step.tiles.length);
	const got = $derived(placed.map((i) => step.tiles[i]).join(''));
	const correct = $derived(got === step.answer);
	const ms = () => Math.round(performance.now() - shown);

	$effect(() => {
		const c =
			mode === 'test'
				? choiceCta({ mode: 'test', last, phase: 'picking', picked: full, correct })
				: phase === 'graded'
					? choiceCta({ mode, last, phase: 'graded', picked: full, correct })
					: {
							label: m.lesson_check(),
							disabled: !full,
							caret: false,
							hint: full ? '' : m.grammar_order_hint()
						};
		cta({
			...c,
			onclick: () => {
				if (!full) return;
				if (mode === 'feedback' && phase === 'placing') phase = 'graded';
				else next({ questionId: step.id, pick: got, correct, ms: ms() });
			}
		});
	});

	const place = (tile: number) => {
		if (phase === 'graded' || placed.includes(tile)) return;
		placed = [...placed, tile];
	};

	const remove = (slot: number) => {
		if (phase === 'graded' || placed[slot] === undefined) return;
		placed = placed.filter((_, i) => i !== slot);
	};
</script>

<p class="mt-5 text-label text-pencil">
	{step.ask}
</p>
<h2 class="mt-1 font-display text-headline">{step.title}</h2>

<div class="mt-5 flex flex-wrap gap-2" data-part="slots">
	{#each step.tiles.keys() as slot (slot)}
		{@const tile = placed[slot]}
		<button
			type="button"
			class="flex size-14 items-center justify-center rounded-action border font-hanzi text-[28px] {tile ===
			undefined
				? 'border-dashed border-ruled-line bg-white/40'
				: phase === 'graded' && !correct
					? 'border-2 border-lantern-red bg-white'
					: 'border-2 border-ink bg-white'}"
			data-slot={slot}
			data-mark={phase === 'graded' ? (correct ? 'right' : 'wrong') : undefined}
			aria-label={tile === undefined ? undefined : m.grammar_order_remove({ c: step.tiles[tile] })}
			disabled={phase === 'graded'}
			onclick={() => remove(slot)}
		>
			{tile === undefined ? '' : step.tiles[tile]}
		</button>
	{/each}
</div>

<div class="mt-5 flex flex-wrap gap-2" data-part="pool">
	{#each step.tiles as tile, i (i)}
		{#if !placed.includes(i)}
			<button
				type="button"
				class="flex size-14 items-center justify-center rounded-action border border-ruled-line bg-white/40 font-hanzi text-[28px]"
				data-tile={i}
				aria-label={m.grammar_order_place({ c: tile })}
				disabled={phase === 'graded'}
				onclick={() => place(i)}
			>
				{tile}
			</button>
		{/if}
	{/each}
</div>

<p class="mt-4 min-h-6" aria-live="polite">
	{#if phase === 'graded'}
		<b>{correct ? m.lesson_right() : m.lesson_wrong()}</b>
		<span class="font-hanzi">{step.answer}</span>
	{/if}
</p>
