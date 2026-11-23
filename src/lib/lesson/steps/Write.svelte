<script module lang="ts">
	import type { WriteStep } from '../writing';

	export const kind = 'write';
	export type Step = WriteStep;
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import HanziStrokes from '#lib/components/HanziStrokes.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { StepProps } from '../types';

	let { step, cta, next }: StepProps<Step> = $props();

	const auto = untrack(() => step.round === 2 && step.skipped.has(step.char));
	const t0 = performance.now();
	let finished = $state(false);
	let mistakes = $state(0);

	onMount(() => {
		if (auto) next();
	});

	$effect(() => {
		if (auto) return;
		cta({
			label: m.lesson_continue(),
			caret: true,
			disabled: !finished,
			onclick: () =>
				next({
					questionId: step.id,
					pick: String(mistakes),
					correct: true,
					ms: Math.round(performance.now() - t0)
				})
		});
	});

	function skip() {
		step.skipped.add(step.char);
		next();
	}
</script>

{#if !auto}
	<p data-part="round" class="mt-5 text-label text-pencil">
		{step.round === 1 ? m.writing_round1() : m.writing_round2()}
	</p>
	<div class="mt-3">
		<HanziStrokes
			char={step.char}
			mode="quiz"
			outline={step.round === 1}
			oncomplete={(p) => {
				mistakes = p.mistakes;
				finished = true;
			}}
			onprogress={(p) => {
				if (p.done < p.total) finished = false;
			}}
		/>
	</div>
	<p
		data-part="result"
		class="mt-3 min-h-5 text-center text-label text-graphite"
		aria-live="polite"
	>
		{#if finished}
			{mistakes > 0 ? m.writing_done_mistakes({ n: mistakes }) : m.writing_done_clean()}
		{/if}
	</p>
	<button
		type="button"
		data-part="skip"
		class="mt-2 w-full text-center text-label text-graphite underline"
		onclick={skip}
	>
		{m.writing_skip()}
	</button>
{/if}
