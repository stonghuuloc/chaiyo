<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Button from '#lib/ui/Button.svelte';
	import { resolve } from '$app/paths';
	import type { LevelView } from './roadmap';

	let { card }: { card: NonNullable<LevelView['card']> } = $props();
</script>

<section
	data-part="now-card"
	aria-label={m.chy49s1_kicker()}
	class="mt-5 overflow-hidden rounded-[20px] border border-ruled-line bg-white p-4"
>
	<p class="text-[12.5px] font-semibold tracking-[.02em] text-lantern-red-text uppercase">
		{m.chy49s1_kicker()}
	</p>
	<h2 data-part="now-title" class="mt-1 text-headline">
		{m.chy49s1_lesson({ n: card.n, title: card.title })}
		<span lang="zh" class="text-[22px] font-normal text-graphite">{card.hanzi}</span>
	</h2>
	<p data-part="now-line" class="mt-1 text-label text-muted">
		{m.chy49s1_card_line({ part: card.part ?? 1, pct: 80, next: card.next })}
	</p>
	<div class="mt-4">
		<Button
			variant="primary"
			href={resolve('/(app)/lesson/[id]', { id: card.id })}
			icon="regular-play"
			caret
		>
			{m.chy49s1_cta({ n: card.n })}
		</Button>
	</div>
</section>
