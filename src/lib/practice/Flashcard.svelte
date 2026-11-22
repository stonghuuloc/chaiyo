<script module lang="ts">
	export type Card = {
		hanzi: string;
		pinyin: string;
		hanviet?: string;
		meaning: string;
		audio?: string;
		example?: { hanzi: string; pinyin: string; vi: string };
	};
</script>

<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';
	import { m } from '#lib/paraglide/messages.js';
	import { cssMs } from '#lib/ui/motion';
	import { keys } from '#lib/ui/keys';

	type Props = { card: Card; ondecide: (result: { remembered: boolean; ms: number }) => void };

	let { card, ondecide }: Props = $props();

	let flipped = $state(false);
	let deciding = $state<'right' | 'left' | null>(null);
	let cardNode = $state<HTMLElement>();
	const shown = performance.now();

	// Loaded on first tap: the player module reads $app/env/public, which this view must not pull in at import time.
	async function speak(key: string) {
		try {
			await (await import('#lib/audio/index.js')).play(key);
		} catch {
			// a blocked clip leaves the button usable
		}
	}

	const flip = () => (flipped = true);

	function commit(dir: 'right' | 'left') {
		if (!flipped || deciding || !cardNode) return;
		deciding = dir;
		const sign = dir === 'right' ? 1 : -1;
		const reduced = prefersReducedMotion.current;
		const animation = cardNode.animate(
			reduced
				? [{ opacity: 1 }, { opacity: 0 }]
				: [
						{ transform: 'none', opacity: 1 },
						{ transform: `translateX(${sign * 120}%) rotate(${sign * 12}deg)`, opacity: 1 }
					],
			{
				duration: reduced ? cssMs('--motion-fade-reduced', 150) : 250,
				easing: 'ease-out',
				fill: 'forwards'
			}
		);
		animation.onfinish = () =>
			ondecide({ remembered: dir === 'right', ms: Math.round(performance.now() - shown) });
	}
</script>

{#snippet speaker(clip: string)}
	<button
		type="button"
		data-part="speaker"
		class="grid size-11 place-items-center rounded-full border border-ruled-line"
		aria-label={m.practice_card_play()}
		onpointerdown={(e) => e.stopPropagation()}
		onclick={(e) => {
			e.stopPropagation();
			void speak(clip);
		}}
	>
		<svg class="size-5 fill-current" aria-hidden="true"><use href="#i-fill-speaker-high" /></svg>
	</button>
{/snippet}

<div
	class="flex flex-col items-center gap-4"
	use:keys={{
		space: flip,
		digit: (n) => (n === 1 ? commit('left') : n === 2 ? commit('right') : undefined)
	}}
>
	<div
		bind:this={cardNode}
		data-part="card"
		class="relative flex min-h-64 w-full flex-col items-center justify-center gap-3 rounded-action border border-ruled-line p-5"
	>
		{#if !flipped}
			<button
				type="button"
				data-part="flip"
				class="flex flex-col items-center gap-3"
				onclick={flip}
			>
				<span class="font-hanzi text-[56px]">{card.hanzi}</span>
				<span class="text-caption text-graphite">{m.practice_card_hint()}</span>
			</button>
			{#if card.audio}
				{@render speaker(card.audio)}
			{/if}
		{:else}
			<span class="font-hanzi text-[40px]">{card.hanzi}</span>
			<span data-part="pinyin" class="text-title">{card.pinyin}</span>
			{#if card.hanviet}
				<span data-part="hanviet" class="text-label tracking-wider text-graphite uppercase"
					>{card.hanviet}</span
				>
			{/if}
			<p data-part="meaning" class="font-display text-headline">{card.meaning}</p>
			{#if card.example}
				<div data-part="example" class="text-center">
					<p class="font-hanzi text-[20px]">{card.example.hanzi}</p>
					<p class="text-caption text-graphite">{card.example.pinyin}</p>
					<p>{card.example.vi}</p>
				</div>
			{/if}
			{#if card.audio}
				{@render speaker(card.audio)}
			{/if}
		{/if}
		{#if deciding}
			<span
				data-part={deciding === 'right' ? 'stamp-remember' : 'stamp-forget'}
				class="absolute top-4 rounded-action border-2 px-3 py-1 text-title font-bold {deciding ===
				'right'
					? 'right-4 -rotate-12'
					: 'left-4 rotate-12'}"
				>{deciding === 'right' ? m.practice_stamp_remember() : m.practice_stamp_forget()}</span
			>
		{/if}
	</div>
	{#if flipped}
		<p data-part="guide" class="text-caption text-graphite">{m.practice_card_guide()}</p>
		<div class="flex w-full gap-3">
			<button
				type="button"
				data-part="forget"
				class="min-h-11 flex-1 rounded-action border border-ruled-line px-4 py-2"
				onclick={() => commit('left')}>{m.practice_card_forget()}</button
			>
			<button
				type="button"
				data-part="remember"
				class="min-h-11 flex-1 rounded-action border border-ruled-line px-4 py-2"
				onclick={() => commit('right')}>{m.practice_card_remember()}</button
			>
		</div>
	{/if}
</div>
