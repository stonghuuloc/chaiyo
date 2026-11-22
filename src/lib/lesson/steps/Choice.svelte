<script module lang="ts">
	import type { Skill } from '#lib/study/index.js';

	export const kind = 'choice';
	export type Step = {
		kind: 'choice';
		id: string;
		ask: string;
		title: string;
		options: string[];
		answer: string;
		script?: 'hanzi' | 'text' | 'pinyin';
		explain?: string;
		missHint?: string;
		card?: { word: string; skill: Skill };
		tone?: 1 | 2 | 3 | 4;
		audio?: string;
		prompt?: { text: string; hanzi: boolean };
	};
</script>

<script lang="ts">
	import ClipCast from '../ClipCast.svelte';
	import { choiceCta, grade, toAnswer } from '../choice';
	import { pinyinRuns } from '../pinyin-runs';
	import type { StepProps } from '../types';

	let { step, mode, last, cta, next }: StepProps<Step> = $props();

	let pick = $state<string | null>(null);
	let phase = $state<'picking' | 'graded'>('picking');
	const shown = performance.now();

	const graded = $derived(phase === 'graded' && pick !== null ? grade(step, pick) : null);
	const ms = () => Math.round(performance.now() - shown);
	let took: number | null = null;

	$effect(() => {
		const c = choiceCta({
			mode,
			last,
			phase,
			picked: pick !== null,
			correct: graded?.correct ?? false,
			missHint: step.missHint
		});
		cta({
			...c,
			onclick: () => {
				if (pick === null) return;
				if (mode === 'feedback' && phase === 'picking') {
					took = ms();
					phase = 'graded';
				} else next(toAnswer(step, pick, took ?? ms()));
			}
		});
	});

	const choose = (option: string) => {
		if (phase === 'graded') return;
		pick = option;
	};
</script>

{#snippet prose(text: string)}
	{#if step.script === 'pinyin'}
		{#each pinyinRuns(text) as run, i (i)}
			{#if run.pinyin}<span class="font-pinyin">{run.text}</span>{:else}{run.text}{/if}
		{/each}
	{:else}
		{text}
	{/if}
{/snippet}

<p class="mt-5 text-label font-semibold tracking-wider text-lantern-red-text uppercase">
	{@render prose(step.ask)}
</p>
{#if step.audio}
	<ClipCast clip={step.audio} label={step.ask} />
{/if}
{#if step.title}
	<h2 class="mt-1 font-display text-headline">{@render prose(step.title)}</h2>
{/if}
{#if step.prompt}
	<p
		data-part="choice-prompt"
		class="mt-3 {step.prompt.hanzi ? 'font-hanzi text-[56px]' : 'font-display text-headline'}"
	>
		{step.prompt.text}
	</p>
{/if}

<div class="mt-5 grid gap-2 md:grid-cols-2">
	{#each step.options as option (option)}
		{@const mark = graded?.marks[option]}
		<button
			type="button"
			class="relative flex min-h-14 items-center justify-between gap-3 rounded-action border px-4 py-3 text-left {step.script ===
			'text'
				? ''
				: step.script === 'pinyin'
					? 'font-pinyin text-[24px]'
					: 'font-hanzi text-[28px]'} {mark === 'right'
				? 'border-2 border-ink bg-white'
				: mark === 'wrong'
					? 'border-2 border-lantern-red bg-white'
					: pick === option
						? 'border-2 border-ink bg-white'
						: 'border-ruled-line bg-white/40'}"
			aria-pressed={pick === option}
			data-mark={mark}
			disabled={phase === 'graded'}
			onclick={() => choose(option)}
		>
			<span>{option}</span>
			{#if mark}
				<svg class="size-5 flex-none fill-current" aria-hidden="true"
					><use href={mark === 'right' ? '#i-bold-check' : '#i-regular-x'} /></svg
				>
			{/if}
		</button>
	{/each}
</div>

<p class="mt-4 min-h-6" aria-live="polite">
	{#if graded}
		<b>{graded.verdict}</b>
		<span class={step.script === 'text' || step.script === 'pinyin' ? '' : 'font-hanzi'}
			>{@render prose(step.explain ?? step.answer)}</span
		>
	{/if}
</p>
