<script module lang="ts">
	export const kind = 'tone';
	export type Step = {
		kind: 'tone';
		id: string;
		ask: string;
		audio: string;
		answer: 1 | 2 | 3 | 4 | 5;
		syllable: string;
	};
</script>

<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { CONTOUR } from '#lib/pinyin/contour.js';
	import ClipCast from '../ClipCast.svelte';
	import { choiceCta } from '../choice';
	import { gradeTone, toneAnswer } from '../tone';
	import type { StepProps } from '../types';

	let { step, mode, last, cta, next }: StepProps<Step> = $props();

	const tones = [1, 2, 3, 4, 5] as const;
	let pick = $state<number | null>(null);
	let phase = $state<'picking' | 'graded'>('picking');
	const shown = performance.now();

	const graded = $derived(phase === 'graded' && pick !== null ? gradeTone(step, pick) : null);
	const ms = () => Math.round(performance.now() - shown);

	$effect(() => {
		const c = choiceCta({
			mode,
			last,
			phase,
			picked: pick !== null,
			correct: graded?.correct ?? false
		});
		cta({
			...c,
			onclick: () => {
				if (pick === null) return;
				if (mode === 'feedback' && phase === 'picking') phase = 'graded';
				else next(toneAnswer(step, pick, ms()));
			}
		});
	});

	const choose = (tone: number) => {
		if (phase === 'graded') return;
		pick = tone;
	};
</script>

<p class="mt-5 text-label font-semibold tracking-wider text-lantern-red-text uppercase">
	{step.ask}
</p>
{#if step.audio}
	<ClipCast clip={step.audio} label={step.ask} />
{/if}

<div class="mt-5 grid grid-cols-2 gap-2 md:grid-cols-5">
	{#each tones as tone (tone)}
		{@const mark = graded?.marks[tone]}
		<button
			type="button"
			data-part="tone-option"
			class="relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-action border px-4 py-3 {mark ===
			'right'
				? 'border-2 border-ink bg-white'
				: mark === 'wrong'
					? 'border-2 border-lantern-red bg-white'
					: pick === tone
						? 'border-2 border-ink bg-white'
						: 'border-ruled-line bg-white/40'}"
			aria-pressed={pick === tone}
			data-mark={mark}
			disabled={phase === 'graded'}
			onclick={() => choose(tone)}
		>
			<svg class="h-5 w-9" viewBox="0 0 44 24" aria-hidden="true">
				<path
					d={CONTOUR[tone]}
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<span>{tone === 5 ? m.listen_tone_neutral() : m.listen_tone_option({ n: tone })}</span>
		</button>
	{/each}
</div>

<p class="mt-4 min-h-6" aria-live="polite">
	{#if graded}
		<b>{graded.verdict}</b>
		{#if !graded.correct}<span>{graded.explain}</span>{/if}
	{/if}
</p>
