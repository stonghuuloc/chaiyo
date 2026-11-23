<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { MeStats } from './me';

	let { stats }: { stats: MeStats } = $props();

	const rows = $derived([
		{ label: m.chy50s1_lessons(), ...stats.lessons },
		{ label: m.chy50s1_words(), ...stats.words }
	]);

	const width = (have: number, need: number) => (need ? Math.min(100, (have / need) * 100) : 0);
</script>

<div data-part="me-hero" class="mt-5 rounded-[24px] bg-white p-5">
	<div data-part="me-prog" class="mt-4 grid gap-3">
		{#each rows as r (r.label)}
			<div class="grid grid-cols-[1fr_auto] gap-y-1.5 text-[14px] leading-[18px]">
				<span class="text-graphite">{r.label}</span>
				<b class="font-semibold tabular-nums"
					>{m.chy50s1_have_need({ have: r.have, need: r.need })}</b
				>
				<span class="col-span-full h-2.5 overflow-hidden rounded-[5px] bg-shaded-paper"
					><i
						class="block h-full min-w-1.5 rounded-[5px] bg-lantern-red"
						style:width="{width(r.have, r.need)}%"
					></i></span
				>
			</div>
		{/each}
	</div>
	<div
		data-part="me-streak"
		class="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-ruled-line pt-3 text-[13.5px] leading-[18px] text-pencil"
	>
		<span class="inline-flex items-center gap-1.5">
			<svg
				class="size-[17px] fill-current text-lantern-red [--duo-c:var(--icon-duo-c)] [--duo:1]"
				aria-hidden="true"><use href="#i-fill-fire" /></svg
			>
			<b class="font-semibold text-ink">{m.chy50s1_streak_days({ n: stats.streak.count })}</b>
		</span>
		<span class="inline-flex items-center gap-1.5">
			<svg class="size-[17px] fill-current text-freeze-blue" aria-hidden="true"
				><use href="#i-fill-snowflake" /></svg
			>
			{m.chy50s1_freezes({ n: stats.streak.freezes })}
		</span>
		<span class="inline-flex items-center gap-1.5">{m.chy50s1_best({ n: stats.streak.best })}</span>
	</div>
</div>
