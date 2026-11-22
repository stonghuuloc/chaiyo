<script module lang="ts">
	import type { CharacterJson } from 'hanzi-writer';

	export const kind = 'viet';
	export type Step = {
		kind: 'viet';
		id: string;
		word: string;
		pinyin: string;
		nghia: string;
		again: boolean;
		load?: (char: string) => Promise<CharacterJson>;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import HanziStrokes from '#lib/components/HanziStrokes.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { StepProps } from '../types';
	import { vietVerdict, wrongTotal } from '../viet';

	let { step, cta, next }: StepProps<Step> = $props();

	const chars = untrack(() => [...step.word]);
	const t0 = performance.now();
	let at = $state(0);
	let wrong = $state<number[]>([]);
	let peeked = $state(false);
	let unsure = $state(false);
	let loadFailed = $state(false);
	let over = $state(false);

	const total = $derived(wrongTotal(wrong));
	const verdict = $derived(over ? vietVerdict({ total, peeked, unsure, loadFailed }) : null);

	const finish = () => {
		over = true;
	};

	$effect(() => {
		cta({
			label: m.lesson_continue(),
			caret: true,
			disabled: !over,
			onclick: () => {
				if (!verdict) return;
				next({
					questionId: step.id,
					pick: String(total),
					correct: verdict === 'skip' ? null : verdict === 'hit',
					ms: Math.round(performance.now() - t0),
					card: { word: step.word, skill: 'viet' }
				});
			}
		});
	});

	const complete = (p: { mistakes: number }) => {
		if (over) return;
		wrong = [...wrong, p.mistakes];
		if (at + 1 >= chars.length) finish();
		else at += 1;
	};
</script>

<p class="mt-5 font-pinyin text-[24px]" data-part="viet-pinyin">{step.pinyin}</p>
<h2 class="mt-1 font-display text-headline" data-part="viet-nghia">{step.nghia}</h2>
{#if step.again}
	<p data-part="again" class="mt-1 text-label text-graphite">· {m.practice_again()}</p>
{/if}

{#if !(over && unsure)}
	<div class="mt-3">
		{#key at}
			<HanziStrokes
				char={chars[at]}
				mode="quiz"
				outline={false}
				load={step.load}
				onpeek={() => {
					if (!over) peeked = true;
				}}
				oncomplete={complete}
				onerror={() => {
					loadFailed = true;
					finish();
				}}
			/>
		{/key}
	</div>
{/if}

<p data-part="verdict" class="mt-3 min-h-6 text-center" aria-live="polite">
	{#if verdict === 'hit'}
		<b>{m.practice_viet_right()}</b>
	{:else if verdict === 'miss'}
		<b>{step.again ? m.practice_viet_wrong_final() : m.practice_viet_wrong()}</b>
	{/if}
</p>
{#if !over}
	<button
		type="button"
		data-part="unsure"
		class="mt-2 w-full text-center text-label text-graphite underline"
		onclick={() => {
			unsure = true;
			finish();
		}}
	>
		{m.practice_viet_unsure()}
	</button>
{/if}
