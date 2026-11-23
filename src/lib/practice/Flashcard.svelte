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
	import { cssMs } from '#lib/ui/motion.js';
	import { keys } from '#lib/ui/keys.js';
	import { decide, stampOpacity, velocity } from './swipe.js';

	type Props = { card: Card; ondecide: (result: { remembered: boolean; ms: number }) => void };

	let { card, ondecide }: Props = $props();

	let flipped = $state(false);
	let deciding = $state<'right' | 'left' | null>(null);
	let cardNode = $state<HTMLElement>();
	let dx = $state(0);
	let dragging = $state(false);
	let captured = false;
	let width = $state(0);
	let start: { x: number; y: number } | null = null;
	let samples: { x: number; t: number }[] = [];
	let suppressClick = false;
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

	const TAP_SLOP = 8;

	function commit(dir: 'right' | 'left') {
		if (!flipped || deciding || !cardNode) return;
		deciding = dir;
		const sign = dir === 'right' ? 1 : -1;
		const reduced = prefersReducedMotion.current;
		const animation = cardNode.animate(
			reduced
				? [{ opacity: 1 }, { opacity: 0 }]
				: [
						{ transform: cardNode.style.transform || 'none', opacity: 1 },
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

	function down(e: PointerEvent) {
		if (deciding) return;
		start = { x: e.clientX, y: e.clientY };
		samples = [{ x: e.clientX, t: performance.now() }];
		suppressClick = false;
		captured = false;
		width = cardNode?.getBoundingClientRect().width ?? 0;
	}

	function move(e: PointerEvent) {
		if (!start || deciding) return;
		samples.push({ x: e.clientX, t: performance.now() });
		const moved = e.clientX - start.x;
		if (Math.abs(moved) >= TAP_SLOP) {
			suppressClick = true;
			if (!captured) {
				captured = true;
				(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
			}
		}
		if (!flipped) return;
		dragging = true;
		dx = moved;
	}

	function release(e: PointerEvent, cancelled: boolean) {
		if (!start) return;
		const moved = { dx: e.clientX - start.x, dy: e.clientY - start.y };
		const vx = velocity(samples);
		start = null;
		dragging = false;
		const dir = flipped && !cancelled ? decide({ ...moved, width, vx }) : null;
		if (dir) commit(dir);
		else dx = 0;
	}

	const dragStyle = $derived(
		dx === 0 && !dragging
			? 'transition: transform 200ms ease-out;'
			: `transform: translateX(${dx}px) rotate(${dx / 20}deg);`
	);
	const stampDir = $derived(deciding ?? (dx === 0 ? null : dx > 0 ? 'right' : 'left'));
	const stampAlpha = $derived(deciding ? 1 : stampOpacity(dx, width));
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
		data-part="stage"
		class="w-full overflow-x-clip"
		style="touch-action: pan-y; user-select: none;"
		role="presentation"
		onpointerdown={down}
		onpointermove={move}
		onpointerup={(e) => release(e, false)}
		onpointercancel={(e) => release(e, true)}
	>
		<div
			bind:this={cardNode}
			data-part="card"
			style={dragStyle}
			class="relative flex min-h-64 w-full flex-col items-center justify-center gap-3 rounded-action border border-ruled-line p-5"
		>
			{#if !flipped}
				<button
					type="button"
					data-part="flip"
					class="flex flex-col items-center gap-3"
					onclick={() => {
						if (suppressClick) suppressClick = false;
						else flip();
					}}
				>
					<span class="font-hanzi text-[56px]">{card.hanzi}</span>
					<span class="text-label text-graphite">{m.practice_card_hint()}</span>
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
						<p class="text-label text-graphite">{card.example.pinyin}</p>
						<p>{card.example.vi}</p>
					</div>
				{/if}
				{#if card.audio}
					{@render speaker(card.audio)}
				{/if}
			{/if}
			{#if stampDir}
				<span
					data-part={stampDir === 'right' ? 'stamp-remember' : 'stamp-forget'}
					style="opacity: {stampAlpha};"
					class="absolute top-4 rounded-action border-2 px-3 py-1 text-title font-bold {stampDir ===
					'right'
						? 'right-4 -rotate-12'
						: 'left-4 rotate-12'}"
					>{stampDir === 'right' ? m.practice_stamp_remember() : m.practice_stamp_forget()}</span
				>
			{/if}
		</div>
	</div>
	{#if flipped}
		<p data-part="guide" class="text-label text-graphite">{m.practice_card_guide()}</p>
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
