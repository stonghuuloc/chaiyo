<script module lang="ts">
	export const kind = 'pinyin';
	export type Step = {
		kind: 'pinyin';
		id: string;
		ask: string;
		title: string;
		hanzi: string;
		answer: string;
	};
</script>

<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { choiceCta } from '../choice';
	import { gradePinyin, norm, toMarks } from '../pinyin';
	import type { StepProps } from '../types';

	let { step, last, cta, next }: StepProps<Step> = $props();

	let value = $state('');
	const shown = performance.now();
	const typed = $derived(value.trim() !== '');

	$effect(() => {
		const c = choiceCta({ mode: 'test', last, phase: 'picking', picked: typed, correct: false });
		cta({
			...c,
			onclick: () => {
				if (!typed) return;
				next({
					questionId: step.id,
					pick: value.trim(),
					correct: gradePinyin(value, step.answer),
					ms: Math.round(performance.now() - shown)
				});
			}
		});
	});
</script>

<p class="mt-5 text-label font-semibold tracking-wider text-lantern-red-text uppercase">
	{step.ask}
</p>
<h2 class="mt-1 font-display text-headline">{step.title}</h2>
<p data-part="hanzi" class="mt-5 text-center font-hanzi text-[56px] leading-tight">{step.hanzi}</p>

<input
	data-part="pinyin-input"
	class="mt-5 min-h-14 w-full rounded-action border-2 border-ink bg-white px-4 text-[20px]"
	type="text"
	inputmode="text"
	autocomplete="off"
	autocapitalize="off"
	spellcheck="false"
	aria-label={m.gate_pinyin_label()}
	placeholder={m.gate_pinyin_placeholder()}
	bind:value
/>
<p data-part="pinyin-preview" class="mt-3 min-h-6 text-graphite" aria-live="polite">
	{#if typed}{m.gate_pinyin_preview({ text: toMarks(norm(value)) })}{/if}
</p>
